import { useCallback, useEffect, useRef, useState } from 'react'
import type { Settings } from '@shared/types'

export type PomodoroPhase = 'work' | 'short' | 'long'

export function phaseDurationMs(phase: PomodoroPhase, settings: Settings): number {
  const minutes =
    phase === 'work'
      ? settings.pomodoro.work
      : phase === 'short'
        ? settings.pomodoro.short
        : settings.pomodoro.long
  return Math.max(1, Number(minutes) || 1) * 60_000
}

interface Options {
  settings: Settings
  sessionsToday: number
  onWorkComplete: (completed: number, nextPhase: PomodoroPhase) => void
  onBreakComplete: () => void
  onTick?: () => void
}

export interface PomodoroController {
  phase: PomodoroPhase
  running: boolean
  remainingMs: number
  durationMs: number
  progress: number
  sessionsToday: number
  start: () => void
  toggle: () => void
  pause: () => void
  reset: () => void
  skip: () => void
}

export function usePomodoro(options: Options): PomodoroController {
  const { settings, sessionsToday } = options
  const [phase, setPhase] = useState<PomodoroPhase>('work')
  const [remainingMs, setRemainingMs] = useState(() => phaseDurationMs('work', settings))
  const [running, setRunning] = useState(false)

  const endAtRef = useRef<number | null>(null)
  const lastSecondRef = useRef<number>(-1)
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    if (!running) return

    const id = window.setInterval(() => {
      const endAt = endAtRef.current
      if (!endAt) return

      const left = endAt - Date.now()
      if (left > 0) {
        setRemainingMs(left)
        const second = Math.ceil(left / 1000)
        if (phase === 'work' && second !== lastSecondRef.current) {
          lastSecondRef.current = second
          optionsRef.current.onTick?.()
        }
        return
      }

      endAtRef.current = null
      const current = optionsRef.current

      if (phase === 'work') {
        const completed = current.sessionsToday + 1
        const longEvery = Math.max(1, Number(current.settings.pomodoro.longEvery) || 4)
        const nextPhase: PomodoroPhase = completed % longEvery === 0 ? 'long' : 'short'
        const nextMs = phaseDurationMs(nextPhase, current.settings)
        setPhase(nextPhase)
        setRemainingMs(nextMs)
        endAtRef.current = Date.now() + nextMs
        lastSecondRef.current = -1
        current.onWorkComplete(completed, nextPhase)
      } else {
        const nextMs = phaseDurationMs('work', current.settings)
        setPhase('work')
        setRemainingMs(nextMs)
        setRunning(false)
        lastSecondRef.current = -1
        current.onBreakComplete()
      }
    }, 250)

    return () => window.clearInterval(id)
  }, [running, phase])

  // Keep an idle timer in sync with the configured lengths.
  const previousLengths = useRef(settings.pomodoro)
  useEffect(() => {
    const previous = previousLengths.current
    const next = settings.pomodoro
    const changed =
      previous.work !== next.work || previous.short !== next.short || previous.long !== next.long
    previousLengths.current = next
    if (changed && !running) {
      setRemainingMs(phaseDurationMs(phase, settings))
      endAtRef.current = null
    }
  }, [settings, phase, running])

  const start = useCallback(() => {
    const ms = remainingMs > 0 ? remainingMs : phaseDurationMs(phase, optionsRef.current.settings)
    endAtRef.current = Date.now() + ms
    setRemainingMs(ms)
    setRunning(true)
  }, [remainingMs, phase])

  const pause = useCallback(() => {
    const endAt = endAtRef.current
    if (endAt) setRemainingMs(Math.max(0, endAt - Date.now()))
    endAtRef.current = null
    setRunning(false)
  }, [])

  const toggle = useCallback(() => {
    if (running) pause()
    else start()
  }, [running, pause, start])

  const reset = useCallback(() => {
    endAtRef.current = null
    setRunning(false)
    lastSecondRef.current = -1
    setRemainingMs(phaseDurationMs(phase, optionsRef.current.settings))
  }, [phase])

  const skip = useCallback(() => {
    const nextPhase: PomodoroPhase = phase === 'work' ? 'short' : 'work'
    endAtRef.current = null
    setRunning(false)
    lastSecondRef.current = -1
    setPhase(nextPhase)
    setRemainingMs(phaseDurationMs(nextPhase, optionsRef.current.settings))
  }, [phase])

  const durationMs = phaseDurationMs(phase, settings)

  return {
    phase,
    running,
    remainingMs,
    durationMs,
    progress: durationMs > 0 ? Math.min(1, Math.max(0, 1 - remainingMs / durationMs)) : 0,
    sessionsToday,
    start,
    toggle,
    pause,
    reset,
    skip
  }
}
