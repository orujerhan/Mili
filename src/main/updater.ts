import { app } from 'electron'
import { autoUpdater } from 'electron-updater'
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
