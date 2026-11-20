import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppData,
  LyricsResult,
  MediaCommand,
  MediaState,
  MiliBridge,
  NotifyPayload,
  PomodoroStats,
  Settings,
  SystemStats,
  Task,
  UpdateState,
  WaterState
} from '@shared/types'

function subscribe<T>(channel: string, listener: (value: T) => void): () => void {
  const handler = (_event: Electron.IpcRendererEvent, value: T): void => listener(value)
  ipcRenderer.on(channel, handler as never)
  return () => {
    ipcRenderer.removeListener(channel, handler as never)
  }
}

const bridge: MiliBridge = {
  platform: process.platform,
  getState: () => ipcRenderer.invoke('app:get-state') as Promise<AppData>,
  patchSettings: (patch: Partial<Settings>) =>
    ipcRenderer.invoke('app:patch-settings', patch) as Promise<AppData>,
  setTasks: (tasks: Task[]) => ipcRenderer.invoke('app:set-tasks', tasks) as Promise<void>,
  setNote: (note: string) => ipcRenderer.invoke('app:set-note', note) as Promise<void>,
  setWater: (water: WaterState) => ipcRenderer.invoke('app:set-water', water) as Promise<void>,
  setPomodoroStats: (stats: PomodoroStats) =>
    ipcRenderer.invoke('app:set-pomodoro-stats', stats) as Promise<void>,
  mediaCommand: (command: MediaCommand) =>
    ipcRenderer.invoke('media:command', command) as Promise<void>,
  notify: (payload: NotifyPayload) =>
    ipcRenderer.invoke('notify:show', payload) as Promise<void>,
  fetchLyrics: (query) => ipcRenderer.invoke('lyrics:fetch', query) as Promise<LyricsResult>,
  windowAction: (action: 'hide' | 'close') =>
    ipcRenderer.invoke('window:action', action) as Promise<void>,
  openExternal: (url: string) => ipcRenderer.invoke('shell:open', url) as Promise<void>,
  setLaunchAtLogin: (enabled: boolean) =>
    ipcRenderer.invoke('app:set-launch-at-login', enabled) as Promise<boolean>,
  onMedia: (listener: (state: MediaState) => void) => subscribe('media:update', listener),
  onStats: (listener: (stats: SystemStats) => void) => subscribe('stats:update', listener),
  onSettings: (listener: (settings: Settings) => void) => subscribe('settings:update', listener),
  setIsland: (expanded: boolean) =>
    ipcRenderer.invoke('island:set', expanded) as Promise<void>,
  onIsland: (listener: (expanded: boolean) => void) => subscribe('island:update', listener),
  getUpdateState: () => ipcRenderer.invoke('updater:get') as Promise<UpdateState>,
  checkForUpdates: () => ipcRenderer.invoke('updater:check') as Promise<UpdateState>,
  installUpdate: () => ipcRenderer.invoke('updater:install') as Promise<void>,
  onUpdate: (listener: (state: UpdateState) => void) => subscribe('update:state', listener)
}

contextBridge.exposeInMainWorld('mili', bridge)
