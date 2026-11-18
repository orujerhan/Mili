import type { Settings } from '@shared/types'
import type { PomodoroController } from '../hooks/usePomodoro'
import type { TFunction } from '../lib/i18n'
import { cn, formatCountdown } from '../lib/utils'
import { ResetIcon, SkipIcon } from './icons'

interface PomodoroProps {
  controller: PomodoroController
  settings: Settings
  t: TFunction
}

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function Pomodoro({ controller, settings, t }: PomodoroProps) {
  const { phase, running, remainingMs, progress, sessionsToday } = controller

  const label =
    phase === 'work'
      ? t('pomodoro.work')
      : phase === 'short'
        ? t('pomodoro.short')
        : t('pomodoro.long')
  const accentChannel = phase === 'work' ? '--accent-1' : phase === 'short' ? '--accent-teal' : '--accent-2'
  const accent = `rgb(var(${accentChannel}))`
  const dots = Math.max(4, settings.pomodoro.longEvery)

  return (
    <div className="animate-rise space-y-2.5">
      <div className="glass p-4">
        <div className="flex flex-col items-center">
          <div className="relative h-[148px] w-[148px]">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                stroke="rgba(20,22,29,0.08)"
                strokeWidth="5.5"
              />
              <circle
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                stroke={accent}
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
                style={{ transition: 'stroke-dashoffset 0.35s linear' }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="max-w-[92px] truncate text-[8.5px] font-semibold"
                style={{ color: accent }}
              >
                {label}
              </span>
              <span className="num mt-1 text-[31px] font-semibold leading-none text-ink-900">
                {formatCountdown(remainingMs)}
              </span>
              <span className="mt-1.5 flex items-center gap-1 text-[8.5px] text-ink-900/45">
                <span
                  className={cn(
                    'h-1 w-1 rounded-full',
                    running ? 'animate-pulse bg-accent-cyan' : 'bg-ink-900/25'
                  )}
                />
                {running ? t('media.playing') : t('pomodoro.start')}
              </span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={controller.reset}
              title={t('pomodoro.reset')}
              className="soft-btn h-8 w-8 px-0"
            >
              <ResetIcon size={13} />
            </button>
            <button type="button" onClick={controller.toggle} className="primary-btn min-w-[112px]">
              {running ? t('pomodoro.pause') : t('pomodoro.start')}
            </button>
            <button
              type="button"
              onClick={controller.skip}
              title={t('pomodoro.skip')}
              className="soft-btn h-8 w-8 px-0"
            >
              <SkipIcon size={13} />
            </button>
          </div>
        </div>
      </div>

      <div className="glass flex items-center justify-between px-3.5 py-2.5">
        <div>
          <p className="text-[8.5px] font-bold text-ink-900/45">
            {t('pomodoro.today')}
          </p>
          <p className="num mt-0.5 text-[17px] font-semibold leading-none text-ink-900">
            {sessionsToday}
            <span className="ml-1 text-[9.5px] font-normal text-ink-900/45">
              {t('pomodoro.sessions')}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: dots }).map((_, index) => (
            <span
              key={index}
              className={cn(
                'h-1.5 w-1.5 rounded-full transition-colors',
                index < sessionsToday % dots || (sessionsToday > 0 && sessionsToday % dots === 0)
                  ? 'bg-accent-cyan'
                  : 'bg-ink-900/12'
              )}
            />
          ))}
        </div>
      </div>

      <p className="px-1 text-[9.5px] leading-relaxed text-ink-900/45">{t('pomodoro.hint')}</p>
    </div>
  )
}
