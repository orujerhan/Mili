import type { MascotMood } from '@shared/types'
import { formatClock, formatDate, greetingKeyForHour } from '../lib/utils'
import type { TFunction } from '../lib/i18n'
import { Mascot } from './Mascot'

interface HeroProps {
  mood: MascotMood
  now: Date
  clock24h: boolean
  locale: string
  name: string
  t: TFunction
}

export function Hero({ mood, now, clock24h, locale, name, t }: HeroProps) {
  const clock = formatClock(now, clock24h)
  const greeting = `${t(`greeting.${greetingKeyForHour(now.getHours())}`)}${name ? `, ${name}` : ''}`

  return (
    <section className="drag flex items-center gap-2 px-4 pb-1 pt-0.5">
      <Mascot mood={mood} size={94} />

      <div className="min-w-0 flex-1 text-right">
        <p className="truncate text-[9.5px] font-extrabold text-accent-cyan">
          {greeting}
        </p>
        <div className="mt-1 flex items-baseline justify-end gap-1">
          <span className="num text-[40px] font-semibold leading-none tracking-tight text-ink-900">
            {clock.hours}
            <span className="mx-[1px] text-ink-900/25">:</span>
            {clock.minutes}
          </span>
          {clock.suffix && (
            <span className="text-[10px] font-semibold tracking-wide text-ink-900/35">{clock.suffix}</span>
          )}
        </div>
        <p className="mt-1.5 truncate text-[10.5px] font-medium capitalize text-ink-900/45">{formatDate(now, locale)}</p>
      </div>
    </section>
  )
}
