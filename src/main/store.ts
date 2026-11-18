import { app } from 'electron'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import {
  createDefaultData,
  DEFAULT_SETTINGS,
  localDayKey,
  type AppData,
  type PomodoroStats,
  type Settings,
  type Task,
  type WaterState
} from '@shared/types'

let data: AppData = createDefaultData()
let filePath = ''
let writeTimer: NodeJS.Timeout | null = null
let writing: Promise<void> = Promise.resolve()

function normalizeHex(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
    ? value.toLowerCase()
    : fallback
}

/** Older builds stored `{ primary, secondary }`; accept both shapes. */
function legacyAccent(value: unknown): unknown {
  if (value && typeof value === 'object' && 'primary' in value) {
    return (value as { primary?: unknown }).primary
  }
  return value
}

function coerceSettings(input: Partial<Settings> | undefined): Settings {
  const raw = (input ?? {}) as Partial<Settings>
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    accent: normalizeHex(legacyAccent(raw.accent), DEFAULT_SETTINGS.accent),
    profileName:
      typeof raw.profileName === 'string' ? raw.profileName.trim().slice(0, 24) : '',
    hasOnboarded: Boolean(raw.hasOnboarded),
    pomodoro: { ...DEFAULT_SETTINGS.pomodoro, ...(raw.pomodoro ?? {}) },
    reminders: { ...DEFAULT_SETTINGS.reminders, ...(raw.reminders ?? {}) },
    waterGoal: clampNumber(raw.waterGoal ?? DEFAULT_SETTINGS.waterGoal, 1, 20)
  }
}

function clampNumber(value: number, min: number, max: number): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return min
  return Math.min(max, Math.max(min, Math.round(numeric)))
}

function migrate(input: unknown): AppData {
  const base = createDefaultData()
  if (!input || typeof input !== 'object') return base
  const raw = input as Partial<AppData>

  const tasks: Task[] = Array.isArray(raw.tasks)
    ? raw.tasks
        .filter((task): task is Task => Boolean(task) && typeof task.text === 'string')
        .map((task) => ({
          id: typeof task.id === 'string' ? task.id : `${Date.now()}-${Math.random()}`,
          text: task.text,
          done: Boolean(task.done),
          priority: task.priority === 'high' || task.priority === 'low' ? task.priority : 'normal',
          createdAt: typeof task.createdAt === 'number' ? task.createdAt : Date.now(),
          completedAt: typeof task.completedAt === 'number' ? task.completedAt : undefined
        }))
    : []

  return {
    settings: coerceSettings(raw.settings),
    tasks,
    note: typeof raw.note === 'string' ? raw.note : '',
    water: {
      date: typeof raw.water?.date === 'string' ? raw.water.date : base.water.date,
      count: clampNumber(raw.water?.count ?? 0, 0, 99)
    },
    pomodoroStats: {
      date:
        typeof raw.pomodoroStats?.date === 'string' ? raw.pomodoroStats.date : base.pomodoroStats.date,
      completed: clampNumber(raw.pomodoroStats?.completed ?? 0, 0, 99)
    }
  }
}

/** Resets daily counters when the calendar day changes. */
function rolloverDay(): void {
  const today = localDayKey()
  if (data.water.date !== today) {
    data.water = { date: today, count: 0 }
  }
  if (data.pomodoroStats.date !== today) {
    data.pomodoroStats = { date: today, completed: 0 }
  }
}

export async function loadStore(): Promise<AppData> {
  filePath = join(app.getPath('userData'), 'mili-data.json')
  try {
    const content = await fs.readFile(filePath, 'utf8')
    data = migrate(JSON.parse(content))
  } catch {
    data = createDefaultData()
  }
  rolloverDay()
  return data
}

export function getData(): AppData {
  rolloverDay()
  return data
}

export function flushStore(): void {
  if (writeTimer) {
    clearTimeout(writeTimer)
    writeTimer = null
  }
  void persist()
}

function scheduleSave(): void {
  if (writeTimer) clearTimeout(writeTimer)
  writeTimer = setTimeout(() => {
    writeTimer = null
    void persist()
  }, 400)
}

async function persist(): Promise<void> {
  if (!filePath) return
  const snapshot = JSON.stringify(data, null, 2)
  writing = writing
    .then(async () => {
      const temp = `${filePath}.tmp`
      await fs.writeFile(temp, snapshot, 'utf8')
      await fs.rename(temp, filePath)
    })
    .catch(() => {
      /* best effort — a read-only userData must not crash the app */
    })
  await writing
}

export function patchSettings(patch: Partial<Settings>): AppData {
  data.settings = coerceSettings({ ...data.settings, ...patch })
  scheduleSave()
  return data
}

export function setTasks(tasks: Task[]): void {
  data.tasks = Array.isArray(tasks) ? tasks : []
  scheduleSave()
}

export function setNote(note: string): void {
  data.note = typeof note === 'string' ? note : ''
  scheduleSave()
}

export function setWater(water: WaterState): void {
  data.water = {
    date: typeof water.date === 'string' ? water.date : localDayKey(),
    count: clampNumber(water.count, 0, 99)
  }
  scheduleSave()
}

export function setPomodoroStats(stats: PomodoroStats): void {
  data.pomodoroStats = {
    date: typeof stats.date === 'string' ? stats.date : localDayKey(),
    completed: clampNumber(stats.completed, 0, 99)
  }
  scheduleSave()
}
