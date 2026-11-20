import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { UpdateState } from '@shared/types'

type Listener = (state: UpdateState) => void

let listener: Listener | null = null
let started = false

let state: UpdateState = {
  status: 'idle',
  version: '',
  percent: 0,
  reason: '',
  error: ''
}

function publish(patch: Partial<UpdateState>): UpdateState {
  state = { ...state, ...patch }
  listener?.(state)
  return state
}

/**
 * electron-updater can only replace an installed NSIS build: in development there is no
 * app-update.yml, and the portable exe has nothing to update in place.
 */
function blockedReason(): string {
  if (!app.isPackaged) return 'dev'
  if (process.env.PORTABLE_EXECUTABLE_DIR || process.env.PORTABLE_EXECUTABLE_FILE) return 'portable'
  return ''
}

/**
 * electron-updater patches an update by diffing it against the installer it downloaded last time,
 * which it keeps as `<cache>/<updaterCacheDirName>/installer.exe`. That copy is gone after an
 * install — including every install done by hand — and the library still attempts the differential
 * pass: it streams the whole new installer, fails the checksum and downloads the file again. The
 * user sees the progress bar run to 100%, jump back to 1% and 80 MB arrive twice.
 */
function hasCachedInstaller(): boolean {
  const base =
    process.platform === 'win32'
      ? process.env['LOCALAPPDATA'] || join(homedir(), 'AppData', 'Local')
      : process.platform === 'darwin'
        ? join(homedir(), 'Library', 'Caches')
        : process.env['XDG_CACHE_HOME'] || join(homedir(), '.cache')

  // Same directory name electron-updater reads from app-update.yml.
  let dirName = app.getName()
  try {
    const config = readFileSync(join(process.resourcesPath, 'app-update.yml'), 'utf8')
    const match = /^updaterCacheDirName:\s*(.+)$/m.exec(config)
    if (match?.[1]) dirName = match[1].trim()
  } catch {
    // Development build without app-update.yml: the app name is the fallback.
  }

  return existsSync(join(base, dirName, 'installer.exe'))
}

export function getUpdateState(): UpdateState {
  return state
}

export function startUpdater(send: Listener): void {
  listener = send
  if (started) return
  started = true

  const reason = blockedReason()
  if (reason) {
    publish({ status: 'unsupported', reason })
    return
  }

  // Errors are surfaced in settings instead of the console; quiet keeps the log clean.
  autoUpdater.logger = null
  autoUpdater.autoDownload = true
  // Installing on quit means a normal restart of Mili already applies the download.
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowPrerelease = false

  // Allow pointing the updater at a local mirror during development/testing.
  const mirror = process.env['MILI_UPDATE_URL']
  if (mirror) {
    autoUpdater.setFeedURL({ provider: 'generic', url: mirror })
  }

  autoUpdater.on('checking-for-update', () => publish({ status: 'checking', error: '' }))

  autoUpdater.on('update-available', (info) =>
    publish({ status: 'downloading', version: info.version, percent: 0, error: '' })
  )

  autoUpdater.on('update-not-available', () =>
    publish({ status: 'current', version: app.getVersion(), percent: 0, error: '' })
  )

  autoUpdater.on('download-progress', (progress) =>
    publish({ status: 'downloading', percent: Math.round(progress.percent) })
  )

  autoUpdater.on('update-downloaded', (info) =>
    publish({ status: 'ready', version: info.version, percent: 100, error: '' })
  )

  autoUpdater.on('error', (error: Error) =>
    publish({ status: 'error', error: error?.message ?? 'unknown error' })
  )

  // Let the island appear before the first request goes out.
  setTimeout(() => void checkForUpdates(), 6000)
}

export async function checkForUpdates(): Promise<UpdateState> {
  const reason = blockedReason()
  if (reason) return publish({ status: 'unsupported', reason })

  const before = state.status
  if (before === 'checking' || before === 'downloading' || before === 'ready') {
    return state
  }

  // Only ask for a differential download when there really is an old installer to diff against;
  // otherwise the library downloads everything twice.
  autoUpdater.disableDifferentialDownload = !hasCachedInstaller()

  publish({ status: 'checking', error: '' })
  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    // The 'error' event already reports the message; this keeps a rejected promise quiet.
    if (getUpdateState().status === 'checking') {
      publish({ status: 'error', error: (error as Error)?.message ?? 'unknown error' })
    }
  }
  return state
}

export function installUpdate(): void {
  if (state.status !== 'ready') return
  // Silent install, then bring Mili back up by itself.
  autoUpdater.quitAndInstall(true, true)
}
