import { useState } from 'react'
import type { Settings } from '@shared/types'
import type { TFunction } from '../lib/i18n'
import { ACCENT_SWATCHES } from '../lib/theme'
import { cn } from '../lib/utils'
import { ArrowLeftIcon } from './icons'
import { Mascot } from './Mascot'
import { Row, Stepper } from './ui'

interface OnboardingProps {
  initialName: string
  settings: Settings
  onPatch: (patch: Partial<Settings>) => void
  onFinish: (name: string) => void
  t: TFunction
}

const TOTAL_STEPS = 3

/** Mili introduces herself once, then asks for the basics. */
export function Onboarding({ initialName, settings, onPatch, onFinish, t }: OnboardingProps) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState(initialName)
  const { pomodoro } = settings

  const isLast = step === TOTAL_STEPS - 1
  const canContinue = step > 0 || name.trim().length > 0

  const next = (): void => {
    if (!canContinue) return
    if (isLast) onFinish(name.trim())
    else setStep((current) => current + 1)
  }

  return (
    <div className="absolute inset-0 z-40 flex animate-slideOver flex-col bg-[#f7f8fa]">
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="text-[9px] font-semibold text-ink-900/45">
          {t('onboarding.step', { current: step + 1, total: TOTAL_STEPS })}
        </span>
        <span className="flex gap-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <span
              key={index}
              className={cn(
                'h-1.5 w-1.5 rounded-full transition-colors',
                index <= step ? 'bg-accent-cyan' : 'bg-ink-900/15'
              )}
            />
          ))}
        </span>
      </div>

      <div className="drag flex shrink-0 justify-center pt-2">
        <Mascot mood={step === 0 ? 'happy' : 'vibing'} size={92} />
      </div>

      <div className="scroll-thin mt-1 flex-1 overflow-y-auto px-4 pb-2">
        {step === 0 && (
          <div className="text-center">
            <h2 className="text-[16px] font-bold text-ink-900">{t('onboarding.hi')}</h2>
            <p className="mx-auto mt-1 max-w-[290px] text-[11px] leading-snug text-ink-900/55">
              {t('onboarding.intro')}
            </p>
            <input
              autoFocus
              value={name}
              maxLength={24}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') next()
              }}
              placeholder={t('onboarding.namePlaceholder')}
              className="field mt-3 text-center"
            />
          </div>
        )}

        {step === 1 && (
          <div className="text-center">
            <h2 className="text-[16px] font-bold text-ink-900">{t('onboarding.colorsTitle')}</h2>
            <p className="mx-auto mt-1 max-w-[290px] text-[11px] leading-snug text-ink-900/55">
              {t('onboarding.colorsBody')}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              {ACCENT_SWATCHES.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  onClick={() => onPatch({ accent: color })}
                  className={cn(
                    'h-9 w-9 rounded-full border-2 transition active:scale-95',
                    settings.accent === color ? 'border-ink-900/70' : 'border-white'
                  )}
                  style={{ background: color }}
                />
              ))}
            </div>
            <label className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold text-ink-900/60">
              {t('settings.primaryColor')}
              <input
                type="color"
                value={settings.accent}
                onChange={(event) => onPatch({ accent: event.target.value })}
                className="h-7 w-10 cursor-pointer rounded-lg border border-ink-900/10 bg-white p-0.5"
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-center text-[16px] font-bold text-ink-900">
              {t('onboarding.focusTitle')}
            </h2>
            <p className="mx-auto mt-1 max-w-[290px] text-center text-[11px] leading-snug text-ink-900/55">
              {t('onboarding.focusBody')}
            </p>
            <div className="mt-3 rounded-2xl border-2 border-[#e9eaee] bg-white px-3 py-1">
              <Row title={t('settings.workLen')}>
                <Stepper
                  value={pomodoro.work}
                  min={1}
                  max={90}
                  suffix={t('common.min')}
                  onChange={(work) => onPatch({ pomodoro: { ...pomodoro, work } })}
                />
              </Row>
              <Row title={t('settings.shortLen')}>
                <Stepper
                  value={pomodoro.short}
                  min={1}
                  max={30}
                  suffix={t('common.min')}
                  onChange={(short) => onPatch({ pomodoro: { ...pomodoro, short } })}
                />
              </Row>
              <Row title={t('settings.longLen')}>
                <Stepper
                  value={pomodoro.long}
                  min={1}
                  max={60}
                  suffix={t('common.min')}
                  onChange={(long) => onPatch({ pomodoro: { ...pomodoro, long } })}
                />
              </Row>
              <Row title={t('settings.waterGoal')}>
                <Stepper
                  value={settings.waterGoal}
                  min={1}
                  max={20}
                  onChange={(waterGoal) => onPatch({ waterGoal })}
                />
              </Row>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 px-4 pb-4 pt-2">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((current) => current - 1)}
            className="soft-btn h-9 gap-1 px-3"
          >
            <ArrowLeftIcon size={12} />
            {t('onboarding.back')}
          </button>
        ) : null}
        <button
          type="button"
          onClick={next}
          disabled={!canContinue}
          className="primary-btn h-9 flex-1"
        >
          {isLast ? t('onboarding.finish') : t('onboarding.next')}
        </button>
      </div>
    </div>
  )
}
