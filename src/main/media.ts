import { spawn, type ChildProcessByStdio } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Readable } from 'node:stream'
import type { MediaCommand, MediaState } from '@shared/types'
import { MEDIA_POWERSHELL } from './ps/mediaScript'
import { fetchCoverArt } from './artwork'

const POLL_INTERVAL = 1200
const WATCHDOG_TIMEOUT = 20000

const EMPTY_STATE: MediaState = {
  ok: true,
  hasSession: false,
  title: '',
  artist: '',
  album: '',
  source: '',
  status: 'closed',
  playing: false,
  positionMs: 0,
  durationMs: 0,
  lastUpdatedMs: 0,
  artwork: '',
  error: '',
  receivedAt: 0
}

/** A neutral "nothing playing" snapshot, used when detection is switched off. */
export function emptyMediaState(): MediaState {
  return { ...EMPTY_STATE, receivedAt: Date.now() }
}

interface RawState {
  ok?: boolean
  hasSession?: boolean
  title?: string
  artist?: string
  album?: string
  source?: string
  status?: string
  playing?: boolean
  positionMs?: number
  durationMs?: number
  lastUpdatedMs?: number
  artVersion?: number
  error?: string
}

/**
 * Keeps a single PowerShell process alive and converts its JSON-lines output
 * into MediaState objects for the renderer.
 */
export class MediaWatcher {
  private child: ChildProcessByStdio<null, Readable, Readable> | null = null
  private buffer = ''
  private artVersion = 0
  private artwork = ''
  private artReadInFlight = false
  private lastOutput = 0
  private watchdog: NodeJS.Timeout | null = null
  private disposed = false
  private scriptPath = ''
  private artPath = ''
  private lastRaw: RawState | null = null

  constructor(
    private readonly userDataDir: string,
    private readonly emit: (state: MediaState) => void
  ) {}

  private get untracked(): MediaState {
    return emptyMediaState()
  }

  async start(): Promise<void> {
    this.disposed = false
    this.scriptPath = join(this.userDataDir, 'mili-media.ps1')
    this.artPath = join(this.userDataDir, 'mili-artwork.bin')

    try {
      await mkdir(this.userDataDir, { recursive: true })
      await writeFile(this.scriptPath, MEDIA_POWERSHELL, 'utf8')
    } catch (error) {
      this.emit({
        ...this.untracked,
        ok: false,
        error: `Cannot prepare media bridge: ${(error as Error).message}`
      })
      return
    }

    if (this.disposed) return
    this.spawnPoller()

    this.watchdog = setInterval(() => {
      if (this.disposed) return
      if (this.lastOutput === 0) return
      if (Date.now() - this.lastOutput > WATCHDOG_TIMEOUT) {
        this.restart()
      }
    }, 5000)
  }

  private spawnPoller(): void {
    if (this.disposed) return

    const child = spawn(
      'powershell.exe',
      [
        '-NoLogo',
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        this.scriptPath,
        '-Action',
        'poll',
        '-IntervalMs',
        String(POLL_INTERVAL),
        '-ArtPath',
        this.artPath
      ],
      { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }
    )

    this.child = child
    this.buffer = ''
    this.lastOutput = Date.now()

    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => this.consume(chunk))

    child.stderr.on('data', () => {
      /* PowerShell warnings are non fatal — availability is reported via JSON */
    })

    child.on('error', (error) => {
      this.emit({ ...this.untracked, ok: false, error: error.message })
    })

    child.on('exit', () => {
      this.child = null
      if (!this.disposed) {
        setTimeout(() => this.spawnPoller(), 4000)
      }
    })
  }

  private consume(chunk: string): void {
    this.buffer += chunk
    let index = this.buffer.indexOf('\n')
    while (index !== -1) {
      const line = this.buffer.slice(0, index).trim()
      this.buffer = this.buffer.slice(index + 1)
      if (line.startsWith('{')) this.handleLine(line)
      index = this.buffer.indexOf('\n')
    }
    // Guard against unbounded growth if the child never emits newlines.
    if (this.buffer.length > 100_000) this.buffer = ''
  }

  private handleLine(line: string): void {
    let raw: RawState
    try {
      raw = JSON.parse(line) as RawState
    } catch {
      return
    }

    this.lastOutput = Date.now()

    // GSMTC reports "Playing" / "Paused"; normalise so the renderer can compare.
    this.lastRaw = raw
    if (!raw.hasSession) this.artwork = ''
    const version = raw.artVersion ?? 0
    if (version !== this.artVersion) {
      this.artVersion = version
      void this.refreshArtwork(raw.title ?? '', raw.artist ?? '')
    }

    this.emitState(raw)
  }

  private async refreshArtwork(title: string, artist: string): Promise<void> {
    if (this.artReadInFlight) return
    this.artReadInFlight = true
    try {
      const buffer = await this.readArtworkWithRetry()
      if (buffer) {
        this.artwork = `data:image/png;base64,${buffer.toString('base64')}`
      } else {
        this.artwork = await fetchCoverArt(title, artist)
      }
      if (this.lastRaw) this.emitState(this.lastRaw)
    } finally {
      this.artReadInFlight = false
    }
  }

  private emitState(raw: RawState): void {
    const reported = (raw.status ?? 'closed').toLowerCase()
    const status: MediaState['status'] =
      reported === 'playing' || reported === 'paused' || reported === 'stopped' || reported === 'closed'
        ? reported
        : 'unknown'
    this.emit({
      ok: raw.ok !== false,
      hasSession: Boolean(raw.hasSession),
      title: raw.title ?? '',
      artist: raw.artist ?? '',
      album: raw.album ?? '',
      source: raw.source ?? '',
      status,
      playing: raw.playing ?? status === 'playing',
      positionMs: raw.positionMs ?? 0,
      durationMs: raw.durationMs ?? 0,
      lastUpdatedMs: raw.lastUpdatedMs ?? 0,
      artwork: this.artwork,
      error: raw.error ?? '',
      receivedAt: Date.now()
    })
  }

  private async readArtworkWithRetry(attempt = 0): Promise<Buffer | null> {
    try {
      const buffer = await readFile(this.artPath)
      if (buffer.length < 64) return null
      return buffer
    } catch {
      if (attempt >= 3) return null
      await new Promise((resolve) => setTimeout(resolve, 120))
      return this.readArtworkWithRetry(attempt + 1)
    }
  }

  private restart(): void {
    this.lastOutput = 0
    if (this.child) {
      this.child.removeAllListeners()
      this.child.kill()
      this.child = null
    }
    this.spawnPoller()
  }

  async command(action: MediaCommand): Promise<void> {
    if (!this.scriptPath) return
    await new Promise<void>((resolve) => {
      const child = spawn(
        'powershell.exe',
        [
          '-NoLogo',
          '-NoProfile',
          '-NonInteractive',
          '-ExecutionPolicy',
          'Bypass',
          '-File',
          this.scriptPath,
          '-Action',
          action
        ],
        { windowsHide: true, stdio: 'ignore' }
      )
      const timeout = setTimeout(() => {
        child.kill()
        resolve()
      }, 6000)
      child.on('exit', () => {
        clearTimeout(timeout)
        resolve()
      })
      child.on('error', () => {
        clearTimeout(timeout)
        resolve()
      })
    })
  }

  stop(): void {
    this.disposed = true
    if (this.watchdog) clearInterval(this.watchdog)
    this.watchdog = null
    if (this.child) {
      this.child.removeAllListeners()
      this.child.kill()
      this.child = null
    }
  }
}
