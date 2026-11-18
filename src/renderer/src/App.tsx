import { useCallback, useEffect, useRef, useState } from 'react'
import {
  DEFAULT_SETTINGS,
  localDayKey,
  type MascotMood,
  type Priority,
  type Task
} from '@shared/types'
import { Care } from './components/Care'
import { Footer } from './components/Footer'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { IslandPill } from './components/Island'
import { Notes } from './components/Notes'
import { Notice } from './components/Notice'
import { Onboarding } from './components/Onboarding'
import { NowPlaying } from './components/NowPlaying'
import { Pomodoro } from './components/Pomodoro'
import { SettingsPanel } from './components/Settings'
import { Tabs, type TabId } from './components/Tabs'
import { Tasks } from './components/Tasks'
import { useAppData } from './hooks/useAppData'
import { useMedia } from './hooks/useMedia'
import { usePomodoro } from './hooks/usePomodoro'
import { useIdle, useReminders } from './hooks/useReminders'
import { useStats } from './hooks/useStats'
import { useI18n } from './lib/i18n'
import { playChime, playConfirm, playPop, playTick } from './lib/sound'
import { cn, formatClock, hexToChannels, makeId, shadeHex } from './lib/utils'

/** Must stay in sync with the islandClose animation duration in index.css. */
const ISLAND_CLOSE_MS = 200

const NEXT_PRIORITY: Record<Priority, Priority> = {
  low: 'normal',
  normal: 'high',
  high: 'low'
}

export default function App() {
  const { data, patchSettings, setTasks, setNote, setWater, setPomodoroStats } = useAppData()
  const settings = data?.settings ?? DEFAULT_SETTINGS
  const { t, locale } = useI18n(settings.language)
  const onboarding = Boolean(data) && !settings.hasOnboarded

  const [tab, setTab] = useState<TabId>('home')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const [celebrating, setCelebrating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [phase, setPhase] = useState<'opening' | 'closing' | 'idle'>('opening')
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null)

  const media = useMedia()
  const stats = useStats()
  const idle = useIdle(12)

  const toastTimer = useRef<number | null>(null)
  const celebrateTimer = useRef<number | null>(null)
  const collapseTimer = useRef<number | null>(null)
  const closeTimer = useRef<number | null>(null)
  const noticeTimer = useRef<number | null>(null)

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => {
      window.clearInterval(id)
      if (toastTimer.current) window.clearTimeout(toastTimer.current)
      if (celebrateTimer.current) window.clearTimeout(celebrateTimer.current)
      if (collapseTimer.current) window.clearTimeout(collapseTimer.current)
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current)
    }
  }, [])

  // Accent theme → CSS variables consumed by Tailwind's accent palette.
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--accent-1', hexToChannels(settings.accent))
    root.style.setProperty('--accent-2', hexToChannels(shadeHex(settings.accent, -0.18)))
  }, [settings.accent])

  useEffect(
    () =>
      window.mili.onIsland((isExpanded) => {
        setExpanded(isExpanded)
        // Every fresh mount unfolds out of the pill again.
        setPhase('opening')
      }),
    []
  )

  // The welcome flow needs the full panel, and it must not auto-collapse.
  useEffect(() => {
    if (onboarding) void window.mili.setIsland(true)
  }, [onboarding])

  const expandIsland = useCallback(() => {
    if (collapseTimer.current) {
      window.clearTimeout(collapseTimer.current)
      collapseTimer.current = null
    }
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
      setPhase('idle')
    }
    void window.mili.setIsland(true)
  }, [])

  const cancelCollapse = useCallback(() => {
    if (collapseTimer.current) {
      window.clearTimeout(collapseTimer.current)
      collapseTimer.current = null
    }
    // Coming back mid-animation aborts the collapse instead of finishing it.
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
      setPhase('idle')
    }
  }, [])

  /**
   * Runs the fold-back animation first and only then shrinks the window, so the
   * panel is never laid out inside a pill-sized frame (that reflow is what made
   * collapsing look heavy).
   */
  const collapseIsland = useCallback(() => {
    if (onboarding) return
    if (collapseTimer.current) {
      window.clearTimeout(collapseTimer.current)
      collapseTimer.current = null
    }
    if (closeTimer.current) return
    setPhase('closing')
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null
      setSettingsOpen(false)
      void window.mili.setIsland(false)
    }, ISLAND_CLOSE_MS)
  }, [onboarding])

  const scheduleCollapse = useCallback(() => {
    if (onboarding) return
    if (collapseTimer.current) window.clearTimeout(collapseTimer.current)
    collapseTimer.current = window.setTimeout(() => {
      collapseTimer.current = null
      collapseIsland()
    }, 900)
  }, [onboarding, collapseIsland])

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      if (settingsOpen) setSettingsOpen(false)
      else collapseIsland()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [settingsOpen, collapseIsland])

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2000)
  }, [])

  const celebrate = useCallback(() => {
    setCelebrating(true)
    if (celebrateTimer.current) window.clearTimeout(celebrateTimer.current)
    celebrateTimer.current = window.setTimeout(() => setCelebrating(false), 4500)
  }, [])

  const dismissNotice = useCallback(() => {
    setNotice(null)
    if (noticeTimer.current) {
      window.clearTimeout(noticeTimer.current)
      noticeTimer.current = null
    }
  }, [])

  const notify = useCallback((title: string, body: string) => {
    void window.mili.notify({ title, body })
    setNotice({ title, body })
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current)
    noticeTimer.current = window.setTimeout(() => setNotice(null), 8000)
  }, [])

  const today = localDayKey()

  const pomodoro = usePomodoro({
    settings,
    sessionsToday: data?.pomodoroStats.completed ?? 0,
    onWorkComplete: (completed) => {
      setPomodoroStats({ date: today, completed })
      if (settings.sound) playChime()
      celebrate()
      notify(t('notif.workTitle'), t('notif.workBody'))
    },
    onBreakComplete: () => {
      if (settings.sound) playChime()
      celebrate()
      notify(t('notif.breakTitle'), t('notif.breakBody'))
    },
    onTick: () => {
      if (settings.sound) playTick()
    }
  })

  useReminders({
    settings,
    onStretch: () => {
      notify(t('notif.stretchTitle'), t('notif.stretchBody'))
      showToast(t('notif.stretchTitle'))
    },
    onEye: () => {
      notify(t('notif.eyeTitle'), t('notif.eyeBody'))
      showToast(t('notif.eyeTitle'))
    }
  })

  const water = data && data.water.date === today ? data.water : { date: today, count: 0 }
  const tasks = data?.tasks ?? []

  const addWater = useCallback(() => {
    const next = { date: today, count: Math.min(99, water.count + 1) }
    setWater(next)
    if (settings.sound) playPop()
    if (next.count === settings.waterGoal) {
      celebrate()
      showToast(`💧 ${next.count}/${settings.waterGoal}`)
    }
  }, [today, water.count, setWater, settings.sound, settings.waterGoal, celebrate, showToast])

  const addTask = (text: string, priority: Priority): void => {
    const trimmed = text.trim()
    if (!trimmed) return
    const task: Task = {
      id: makeId(),
      text: trimmed.slice(0, 160),
      done: false,
      priority,
      createdAt: Date.now()
    }
    setTasks([task, ...tasks])
    if (settings.sound) playConfirm()
  }

  const toggleTask = (id: string): void => {
    const target = tasks.find((task) => task.id === id)
    const next = tasks.map((task) =>
      task.id === id
        ? { ...task, done: !task.done, completedAt: task.done ? undefined : Date.now() }
        : task
    )
    setTasks(next)
    if (target && !target.done) {
      if (settings.sound) playPop()
      celebrate()
    }
  }

  const cyclePriority = (id: string): void => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, priority: NEXT_PRIORITY[task.priority] } : task
      )
    )
  }

  const hour = now.getHours()
  const mood: MascotMood = celebrating
    ? 'happy'
    : pomodoro.running && pomodoro.phase === 'work'
      ? 'focused'
      : media.playing
        ? 'vibing'
        : hour >= 23 || hour < 6 || idle
          ? 'sleepy'
          : 'idle'

  const clock = formatClock(now, settings.clock24h)

  if (!expanded) {
    return (
      <div className="island-appear h-full w-full">
        <IslandPill
          mood={mood}
          hours={clock.hours}
          minutes={clock.minutes}
          playing={media.playing}
          artwork={media.artwork}
          noticeTitle={notice?.title ?? ''}
          onExpand={expandIsland}
          t={t}
        />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="h-full w-full p-2">
        <div className="flex h-full items-center justify-center overflow-hidden rounded-[30px] border border-ink-900/[0.06] bg-white/90 shadow-island">
          <span className="animate-pulse text-[10px] font-semibold tracking-[0.3em] text-ink-900/25">
            MILI
          </span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'h-full w-full p-2',
        phase === 'closing' ? 'island-closing' : phase === 'opening' ? 'island-opening' : null
      )}
      onMouseEnter={cancelCollapse}
      onMouseLeave={scheduleCollapse}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[26px] bg-[#f7f8fa] shadow-island">
        <Header
          mood={mood}
          alwaysOnTop={settings.alwaysOnTop}
          onTogglePin={() => void patchSettings({ alwaysOnTop: !settings.alwaysOnTop })}
          onOpenSettings={() => setSettingsOpen(true)}
          onCollapse={collapseIsland}
          onHide={() => void window.mili.windowAction('hide')}
          t={t}
        />

        <Hero
          mood={mood}
          now={now}
          clock24h={settings.clock24h}
          locale={locale}
          name={settings.profileName}
          t={t}
        />

        <div className="px-3">
          <Tabs active={tab} onChange={setTab} t={t} />
        </div>

        <main className="scroll-thin mt-2 flex min-h-0 flex-1 flex-col overflow-y-auto px-3 pb-2">
          {notice && <Notice title={notice.title} body={notice.body} onClose={dismissNotice} />}
          {tab === 'home' && (
            <div className="flex min-h-0 flex-1 flex-col">
              <NowPlaying
                media={media}
                spotifyEnabled={settings.spotifyEnabled}
                showLyrics={settings.showLyrics}
                onOpenSettings={() => setSettingsOpen(true)}
                t={t}
              />
            </div>
          )}
          {tab === 'focus' && <Pomodoro controller={pomodoro} settings={settings} t={t} />}
          {tab === 'tasks' && (
            <Tasks
              tasks={tasks}
              onAdd={addTask}
              onToggle={toggleTask}
              onDelete={(id) => setTasks(tasks.filter((task) => task.id !== id))}
              onCyclePriority={cyclePriority}
              onClearDone={() => setTasks(tasks.filter((task) => !task.done))}
              t={t}
            />
          )}
          {tab === 'notes' && <Notes value={data.note} onChange={setNote} t={t} />}
          {tab === 'care' && (
            <Care
              settings={settings}
              water={water}
              onPatch={(patch) => void patchSettings(patch)}
              onAddWater={addWater}
              onResetWater={() => setWater({ date: today, count: 0 })}
              t={t}
            />
          )}
        </main>

        <Footer stats={stats} water={water} goal={settings.waterGoal} onAddWater={addWater} t={t} />

        {toast && (
          <div className="pointer-events-none absolute bottom-12 left-1/2 z-20 -translate-x-1/2 animate-pop rounded-full border border-ink-900/10 bg-white/95 px-3 py-1 text-[10px] text-ink-900/80 shadow-island">
            {toast}
          </div>
        )}

        {settingsOpen && (
          <SettingsPanel
            settings={settings}
            onPatch={(patch) => void patchSettings(patch)}
            onClose={() => setSettingsOpen(false)}
            t={t}
          />
        )}

        {onboarding && (
          <Onboarding
            initialName={settings.profileName}
            settings={settings}
            onPatch={(patch) => void patchSettings(patch)}
            onFinish={(name) => void patchSettings({ profileName: name, hasOnboarded: true })}
            t={t}
          />
        )}
      </div>
    </div>
  )
}
