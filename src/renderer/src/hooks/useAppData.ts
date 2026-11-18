import { useCallback, useEffect, useState } from 'react'
import type { AppData, PomodoroStats, Settings, Task, WaterState } from '@shared/types'

export function useAppData() {
  const [data, setData] = useState<AppData | null>(null)

  useEffect(() => {
    let cancelled = false
    window.mili
      .getState()
      .then((state) => {
        if (!cancelled) setData(state)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  // Settings can also change from the tray menu.
  useEffect(
    () =>
      window.mili.onSettings((settings) => {
        setData((prev) => (prev ? { ...prev, settings } : prev))
      }),
    []
  )

  const patchSettings = useCallback(async (patch: Partial<Settings>) => {
    const next = await window.mili.patchSettings(patch)
    setData(next)
  }, [])

  const setTasks = useCallback((tasks: Task[]) => {
    setData((prev) => (prev ? { ...prev, tasks } : prev))
    void window.mili.setTasks(tasks)
  }, [])

  const setNote = useCallback((note: string) => {
    setData((prev) => (prev ? { ...prev, note } : prev))
    void window.mili.setNote(note)
  }, [])

  const setWater = useCallback((water: WaterState) => {
    setData((prev) => (prev ? { ...prev, water } : prev))
    void window.mili.setWater(water)
  }, [])

  const setPomodoroStats = useCallback((stats: PomodoroStats) => {
    setData((prev) => (prev ? { ...prev, pomodoroStats: stats } : prev))
    void window.mili.setPomodoroStats(stats)
  }, [])

  return { data, patchSettings, setTasks, setNote, setWater, setPomodoroStats }
}
