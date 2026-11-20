import {
  app,
  BrowserWindow,
  globalShortcut,
  ipcMain,
  Menu,
  nativeImage,
  Notification,
  screen,
  shell,
  Tray
} from 'electron'
import { join } from 'node:path'
import type { MediaCommand, MediaState, NotifyPayload, Settings } from '@shared/types'
import { fetchLyrics } from './lyrics'
import { MediaWatcher, emptyMediaState } from './media'
import { StatsMonitor } from './stats'
import { checkForUpdates, getUpdateState, installUpdate, startUpdater } from './updater'
import {
  flushStore,
  getData,
  loadStore,
  patchSettings,
  setNote,
  setPomodoroStats,
  setTasks,
  setWater
} from './store'

// Shown as the sender name on Windows toast notifications.
const APP_ID = 'Friend Mili'
const EXPANDED_WIDTH = 400
const EXPANDED_HEIGHT = 664
const COLLAPSED_WIDTH = 272
const COLLAPSED_HEIGHT = 58
const TOP_MARGIN = 8

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let mediaWatcher: MediaWatcher | null = null
let statsMonitor: StatsMonitor | null = null
let quitting = false
let islandExpanded = false

const startHidden = process.argv.includes('--hidden')

function resolveAsset(name: string): string {
  return app.isPackaged
    ? join(process.resourcesPath, 'assets', name)
    : join(app.getAppPath(), 'assets', name)
}

/** Simple generated dot, used when the shipped icon is unavailable. */
function fallbackIcon(size = 16): Electron.NativeImage {
  const buffer = Buffer.alloc(size * size * 4)
  const center = (size - 1) / 2
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const distance = Math.hypot(x - center, y - center)
      const alpha = distance < size * 0.44 ? 255 : 0
      const offset = (y * size + x) * 4
      buffer[offset] = 238
      buffer[offset + 1] = 211
      buffer[offset + 2] = 34
      buffer[offset + 3] = alpha
    }
  }
  return nativeImage.createFromBitmap(buffer, { width: size, height: size })
}

function loadIcon(name: string): Electron.NativeImage {
  const image = nativeImage.createFromPath(resolveAsset(name))
  return image.isEmpty() ? fallbackIcon(16) : image
}

function applyLoginItem(enabled: boolean): void {
  if (!app.isPackaged) return
  app.setLoginItemSettings({
    openAtLogin: enabled,
    path: process.execPath,
    args: ['--hidden']
  })
}

function broadcastSettings(): void {
  const settings = getData().settings
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('settings:update', settings)
  }
  rebuildTray()
}

function setAlwaysOnTop(enabled: boolean): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.setAlwaysOnTop(enabled, 'floating')
}

function toggleWindow(): void {
  if (!mainWindow) return
  if (mainWindow.isVisible() && !mainWindow.isMinimized()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.focus()
  }
}

function islandBounds(expanded: boolean): Electron.Rectangle {
  const { workArea } = screen.getPrimaryDisplay()
  const width = expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH
  const height = expanded ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT
  return {
    x: Math.round(workArea.x + (workArea.width - width) / 2),
    y: Math.round(workArea.y + TOP_MARGIN),
    width,
    height
  }
}

/**
 * The window jumps to its final size in one call and the renderer performs the
 * visible part of the morph (the panel unfolds out of the pill's rectangle).
 * Stepping setBounds frame by frame made Windows repaint the transparent window
 * a dozen times per transition, which is what felt slow and glitchy.
 */
function animateIsland(expanded: boolean): void {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.setBounds(islandBounds(expanded))
}

function setIsland(expanded: boolean): void {
  if (islandExpanded === expanded) return
  islandExpanded = expanded
  animateIsland(expanded)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('island:update', expanded)
  }
}

function createWindow(): void {
  const bounds = islandBounds(islandExpanded)
  const settings = getData().settings

  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: COLLAPSED_WIDTH,
    minHeight: COLLAPSED_HEIGHT,
    show: false,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    // No OS frame/shadow: the island draws its own edge, nothing around it.
    hasShadow: false,
    thickFrame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: settings.alwaysOnTop,
    title: 'Mili',
    icon: loadIcon('icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false,
      spellcheck: false
    }
  })

  mainWindow.setMenuBarVisibility(false)
  setAlwaysOnTop(settings.alwaysOnTop)

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow?.webContents.send('island:update', islandExpanded)
  })

  mainWindow.on('ready-to-show', () => {
    if (startHidden) return
    mainWindow?.show()
  })

  mainWindow.on('close', (event) => {
    if (quitting) return
    if (getData().settings.minimizeToTray) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const current = mainWindow?.webContents.getURL() ?? ''
    if (url !== current) {
      event.preventDefault()
      void shell.openExternal(url)
    }
  })

  const devServer = process.env['ELECTRON_RENDERER_URL']
  if (devServer) {
    void mainWindow.loadURL(devServer)
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function rebuildTray(): void {
  if (!tray) return
  const settings = getData().settings
  const menu = Menu.buildFromTemplate([
    {
      label: 'Show Mili',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    { type: 'separator' },
    {
      label: 'Always on top',
      type: 'checkbox',
      checked: settings.alwaysOnTop,
      click: () => {
        patchSettings({ alwaysOnTop: !getData().settings.alwaysOnTop })
        setAlwaysOnTop(getData().settings.alwaysOnTop)
        broadcastSettings()
      }
    },
    {
      label: 'Launch at startup',
      type: 'checkbox',
      checked: settings.launchAtLogin,
      click: () => {
        patchSettings({ launchAtLogin: !getData().settings.launchAtLogin })
        applyLoginItem(getData().settings.launchAtLogin)
        broadcastSettings()
      }
    },
    { type: 'separator' },
    {
      label: 'Check for updates',
      click: () => {
        void checkForUpdates()
      }
    },
    {
      label: `Mili ${app.getVersion()}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quit Mili',
      click: () => {
        quitting = true
        app.quit()
      }
    }
  ])
  tray.setContextMenu(menu)
}

function createTray(): void {
  tray = new Tray(loadIcon('tray.png'))
  tray.setToolTip('Mili')
  tray.on('click', toggleWindow)
  rebuildTray()
}

function registerIpc(): void {
  ipcMain.handle('app:get-state', () => getData())

  ipcMain.handle('island:set', (_event, expanded: boolean) => {
    setIsland(Boolean(expanded))
  })

  ipcMain.handle('app:patch-settings', (_event, patch: Partial<Settings>) => {
    const before = getData().settings
    const next = patchSettings(patch ?? {})
    if (patch?.alwaysOnTop !== undefined) setAlwaysOnTop(next.settings.alwaysOnTop)
    if (patch?.launchAtLogin !== undefined && patch.launchAtLogin !== before.launchAtLogin) {
      applyLoginItem(next.settings.launchAtLogin)
    }
    // Start or stop the media bridge immediately, no restart needed.
    if (patch?.spotifyEnabled !== undefined && patch.spotifyEnabled !== before.spotifyEnabled) {
      if (next.settings.spotifyEnabled) startMediaWatcher()
      else stopMediaWatcher()
    }
    broadcastSettings()
    return next
  })

  ipcMain.handle('app:set-tasks', (_event, tasks) => {
    setTasks(tasks)
  })
  ipcMain.handle('app:set-note', (_event, note: string) => {
    setNote(note)
  })
  ipcMain.handle('app:set-water', (_event, water) => {
    setWater(water)
  })
  ipcMain.handle('app:set-pomodoro-stats', (_event, stats) => {
    setPomodoroStats(stats)
  })

  ipcMain.handle('media:command', async (_event, command: MediaCommand) => {
    await mediaWatcher?.command(command)
  })

  ipcMain.handle('notify:show', (_event, payload: NotifyPayload) => {
    if (!getData().settings.notifications) return
    if (!Notification.isSupported()) return
    const notification = new Notification({
      title: payload.title,
      body: payload.body,
      silent: payload.silent ?? true,
      icon: loadIcon('icon.png')
    })
    notification.on('click', () => {
      mainWindow?.show()
      mainWindow?.focus()
    })
    notification.show()
  })

  ipcMain.handle('lyrics:fetch', (_event, query) => fetchLyrics(query))

  ipcMain.handle('window:action', (_event, action: 'hide' | 'close') => {
    if (action === 'hide') mainWindow?.hide()
    if (action === 'close') {
      if (getData().settings.minimizeToTray) mainWindow?.hide()
      else {
        quitting = true
        app.quit()
      }
    }
  })

  ipcMain.handle('shell:open', async (_event, url: string) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      await shell.openExternal(url)
    }
  })

  ipcMain.handle('updater:get', () => getUpdateState())

  ipcMain.handle('updater:check', () => checkForUpdates())

  ipcMain.handle('updater:install', () => installUpdate())

  ipcMain.handle('app:set-launch-at-login', (_event, enabled: boolean) => {
    patchSettings({ launchAtLogin: Boolean(enabled) })
    applyLoginItem(Boolean(enabled))
    broadcastSettings()
    return Boolean(enabled)
  })
}

function sendMedia(state: MediaState): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('media:update', state)
  }
}

function startMediaWatcher(): void {
  if (mediaWatcher) return
  mediaWatcher = new MediaWatcher(app.getPath('userData'), sendMedia)
  void mediaWatcher.start()
}

function stopMediaWatcher(): void {
  if (!mediaWatcher) return
  mediaWatcher.stop()
  mediaWatcher = null
  // Clear the player so the UI and the mascot drop the stale track right away.
  sendMedia(emptyMediaState())
}

const gotLock = app.requestSingleInstanceLock()

if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    mainWindow?.show()
    mainWindow?.focus()
  })

  app.whenReady().then(async () => {
    app.setAppUserModelId(APP_ID)
    await loadStore()

    registerIpc()
    createWindow()
    createTray()

    if (getData().settings.launchAtLogin) applyLoginItem(true)

    try {
      const registered = globalShortcut.register('Alt+M', toggleWindow)
      if (!registered) console.warn('[mili] Alt+M is already taken by another app')
    } catch (error) {
      console.warn('[mili] global shortcut failed', error)
    }

    statsMonitor = new StatsMonitor((stats) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('stats:update', stats)
      }
    })
    statsMonitor.start()

    if (getData().settings.spotifyEnabled) startMediaWatcher()

    startUpdater((state) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('update:state', state)
      }
      if (state.status !== 'ready') return
      if (!getData().settings.notifications || !Notification.isSupported()) return
      const ru = getData().settings.language === 'ru'
      const notification = new Notification({
        title: ru ? `Обновление Mili ${state.version} готово` : `Mili ${state.version} is ready`,
        body: ru ? 'Перезапусти Mili, чтобы установить.' : 'Restart Mili to finish the update.',
        silent: true,
        icon: loadIcon('icon.png')
      })
      notification.on('click', () => {
        mainWindow?.show()
        mainWindow?.focus()
      })
      notification.show()
    })
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })

  app.on('window-all-closed', () => {
    // The tray keeps Mili alive on Windows.
    if (process.platform !== 'darwin' && !getData().settings.minimizeToTray) {
      app.quit()
    }
  })

  app.on('before-quit', () => {
    quitting = true
    flushStore()
    globalShortcut.unregisterAll()
    statsMonitor?.stop()
    stopMediaWatcher()
  })
}
