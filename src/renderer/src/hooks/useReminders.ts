import { useEffect, useRef, useState } from 'react'
import type { Settings } from '@shared/types'

interface Options {
  settings: Settings
  onStretch: () => void
  onEye: () => void
}

/** Fires stretch / 20-20-20 reminders on wall-clock intervals. */
export function useReminders({ settings, onStretch, onEye }: Options): void {
  const optionsRef = useRef({ settings, onStretch, onEye })
  optionsRef.current = { settings, onStretch, onEye }

  const lastStretch = useRef(Date.now())
  const lastEye = useRef(Date.now())
  const previous = useRef(settings.reminders)

  useEffect(() => {
    const id = window.setInterval(() => {
      const { settings: current, onStretch: stretch, onEye: eye } = optionsRef.current
      const now = Date.now()

      if (
        previous.current.stretchMinutes !== current.reminders.stretchMinutes ||
        previous.current.stretchEnabled !== current.reminders.stretchEnabled
      ) {
        lastStretch.current = now
      }
      if (
        previous.current.eyeMinutes !== current.reminders.eyeMinutes ||
        previous.current.eyeEnabled !== current.reminders.eyeEnabled
      ) {
        lastEye.current = now
      }
      previous.current = current.reminders

      if (
        current.reminders.stretchEnabled &&
        now - lastStretch.current >= Math.max(5, current.reminders.stretchMinutes) * 60_000
      ) {
        lastStretch.current = now
        stretch()
      }

      if (
        current.reminders.eyeEnabled &&
        now - lastEye.current >= Math.max(2, current.reminders.eyeMinutes) * 60_000
      ) {
        lastEye.current = now
        eye()
      }
    }, 15_000)

    return () => window.clearInterval(id)
  }, [])
}

/** True when the mouse and keyboard have been quiet for a while. */
export function useIdle(minutes = 12): boolean {
  const [idle, setIdle] = useState(false)
  const lastActivity = useRef(Date.now())

  useEffect(() => {
    const bump = (): void => {
      lastActivity.current = Date.now()
      setIdle(false)
    }
    const events: Array<keyof WindowEventMap> = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart']
    events.forEach((event) => window.addEventListener(event, bump, { passive: true }))
    const id = window.setInterval(() => {
      setIdle(Date.now() - lastActivity.current > minutes * 60_000)
    }, 20_000)

    return () => {
      events.forEach((event) => window.removeEventListener(event, bump))
      window.clearInterval(id)
    }
  }, [minutes])

  return idle
}
