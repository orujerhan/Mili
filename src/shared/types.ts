/**
 * Types shared between the Electron main process, the preload bridge and the
 * React renderer. Keep this file free of runtime dependencies.
 */

export type Language = 'en' | 'ru'
export type Priority = 'low' | 'normal' | 'high'
export type MascotMood = 'idle' | 'vibing' | 'focused' | 'sleepy' | 'happy'

export interface PomodoroSettings {
  /** work session length in minutes */
  work: number
  /** short break length in minutes */
  short: number
  /** long break length in minutes */
  long: number
  /** a long break replaces every Nth short break */
  longEvery: number
}

export interface ReminderSettings {
  stretchEnabled: boolean
  stretchMinutes: number
  eyeEnabled: boolean
  eyeMinutes: number
}

export interface Settings {
  language: Language
  /** 24 hour clock when true, 12 hour clock otherwise */
  clock24h: boolean
  alwaysOnTop: boolean
  launchAtLogin: boolean
  minimizeToTray: boolean
  sound: boolean
  notifications: boolean
  showLyrics: boolean
  spotifyEnabled: boolean
  /** single accent colour, #rrggbb */
  accent: string
  /** what Mili calls the user */
  profileName: string
  /** false until the welcome flow is finished */
  hasOnboarded: boolean
  pomodoro: PomodoroSettings
  reminders: ReminderSettings
  waterGoal: number
}

export interface Task {
  id: string
  text: string
  done: boolean
  priority: Priority
  createdAt: number
  completedAt?: number
}

export interface WaterState {
  /** local ISO day, e.g. 2026-11-17 */
  date: string
  count: number
}

export interface PomodoroStats {
  date: string
  completed: number
}

export interface AppData {
  settings: Settings
  tasks: Task[]
  note: string
  water: WaterState
  pomodoroStats: PomodoroStats
}

/** State pushed from the main process on every media poll. */
export interface MediaState {
  ok: boolean
  hasSession: boolean
  title: string
  artist: string
  album: string
  source: string
  status: 'playing' | 'paused' | 'stopped' | 'closed' | 'unknown'
  playing: boolean
  positionMs: number
  durationMs: number
  lastUpdatedMs: number
  artwork: string
  error: string
  /** renderer timestamp (Date.now) when this snapshot arrived */
  receivedAt: number
}

export interface SystemStats {
  cpu: number
  ram: number
  ramUsedGb: number
  ramTotalGb: number
  friendly: string
}

export interface LyricsResult {
  found: boolean
  syncedLyrics: string
  plainLyrics: string
  instrumental: boolean
  trackName: string
  artistName: string
  albumName: string
  error: string
}

export type MediaCommand = 'playpause' | 'next' | 'previous'

export interface NotifyPayload {
  title: string
  body: string
  silent?: boolean
}

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'ready'
  | 'current'
  | 'error'
  | 'unsupported'

/** Snapshot of the self-update pipeline, pushed from the main process. */
export interface UpdateState {
  status: UpdateStatus
  /** version being downloaded or waiting to install */
  version: string
  /** 0-100 while downloading */
  percent: number
  /** why updates are unavailable: 'dev' or 'portable' */
  reason: string
  error: string
}

export interface MiliBridge {
  platform: string
  getState: () => Promise<AppData>
  patchSettings: (patch: Partial<Settings>) => Promise<AppData>
  setTasks: (tasks: Task[]) => Promise<void>
  setNote: (note: string) => Promise<void>
  setWater: (water: WaterState) => Promise<void>
  setPomodoroStats: (stats: PomodoroStats) => Promise<void>
  mediaCommand: (command: MediaCommand) => Promise<void>
  notify: (payload: NotifyPayload) => Promise<void>
  fetchLyrics: (query: {
    title: string
    artist: string
    album: string
    durationMs: number
  }) => Promise<LyricsResult>
  windowAction: (action: 'hide' | 'close') => Promise<void>
  openExternal: (url: string) => Promise<void>
  setLaunchAtLogin: (enabled: boolean) => Promise<boolean>
  onMedia: (listener: (state: MediaState) => void) => () => void
  onStats: (listener: (stats: SystemStats) => void) => () => void
  onSettings: (listener: (settings: Settings) => void) => () => void
  setIsland: (expanded: boolean) => Promise<void>
  onIsland: (listener: (expanded: boolean) => void) => () => void
  getUpdateState: () => Promise<UpdateState>
  checkForUpdates: () => Promise<UpdateState>
  installUpdate: () => Promise<void>
  onUpdate: (listener: (state: UpdateState) => void) => () => void
}

export const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  clock24h: true,
  alwaysOnTop: true,
  launchAtLogin: false,
  minimizeToTray: true,
  sound: true,
  notifications: true,
  showLyrics: true,
  spotifyEnabled: true,
  accent: '#0891b2',
  profileName: '',
  hasOnboarded: false,
  pomodoro: { work: 25, short: 5, long: 15, longEvery: 4 },
  reminders: { stretchEnabled: true, stretchMinutes: 50, eyeEnabled: true, eyeMinutes: 20 },
  waterGoal: 8
}

export function localDayKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function createDefaultData(): AppData {
  return {
    settings: { ...DEFAULT_SETTINGS },
    tasks: [],
    note: '',
    water: { date: localDayKey(), count: 0 },
    pomodoroStats: { date: localDayKey(), completed: 0 }
  }
}
