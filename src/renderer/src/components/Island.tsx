import { useEffect, useRef } from 'react'
import type { MascotMood } from '@shared/types'
import type { TFunction } from '../lib/i18n'
import { Mascot } from './Mascot'
import { BellIcon, ChevronDownIcon, PauseIcon, PlayIcon } from './icons'

/** How long the pointer has to actually rest on the pill before it opens. */
const HOVER_DELAY_MS = 450

interface IslandPillProps {
  mood: MascotMood
  hours: string
  minutes: string
  playing: boolean
  artwork: string
  noticeTitle: string
  onExpand: () => void
  t: TFunction
}

/**
 * The collapsed dynamic island. It only opens after a short deliberate hover
 * (a cursor merely passing over it, or resting there when the app starts, does
 * nothing) and opens instantly on click.
 */
export function IslandPill({
  mood,
  hours,
  minutes,
  playing,
  artwork,
  noticeTitle,
  onExpand,
  t
}: IslandPillProps) {
  const hoverTimer = useRef<number | null>(null)

  const cancelHover = (): void => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current)
      hoverTimer.current = null
    }
  }

  useEffect(() => cancelHover, [])

  const startHover = (): void => {
    if (hoverTimer.current) return
    hoverTimer.current = window.setTimeout(() => {
      hoverTimer.current = null
      onExpand()
    }, HOVER_DELAY_MS)
  }

  return (
    <div className="h-full w-full p-1.5">
      <button
        type="button"
        onMouseMove={startHover}
        onMouseLeave={cancelHover}
        onClick={onExpand}
        aria-label={t('header.expand')}
        title={t('header.expand')}
        className="group flex h-full w-full items-center gap-2 rounded-full bg-white px-2.5 shadow-island transition hover:bg-[#fbfcfd]"
      >
        {artwork ? (
          <img
            src={artwork}
            alt=""
            draggable={false}
            className="h-9 w-9 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <Mascot mood={mood} size={30} />
        )}

        <span className="num text-[16px] font-bold leading-none tracking-tight text-ink-900">
          {hours}
          <span className="text-ink-900/30">:</span>
          {minutes}
        </span>

        {noticeTitle ? (
          <span className="flex min-w-0 items-center gap-1 text-ink-900/70">
            <BellIcon size={11} className="shrink-0" />
            <span className="min-w-0 truncate text-[9.5px] font-semibold">{noticeTitle}</span>
          </span>
        ) : (
          <span className="max-w-[74px] truncate text-[9px] font-semibold text-ink-900/45">
            {t(`mood.${mood}`)}
          </span>
        )}

        <span className="ml-auto flex items-center gap-1.5">
          {playing ? (
            <PauseIcon size={11} className="text-accent-cyan" />
          ) : (
            <PlayIcon size={11} className="text-ink-900/25" />
          )}
          <ChevronDownIcon size={14} className="text-ink-900/40" />
        </span>
      </button>
    </div>
  )
}
