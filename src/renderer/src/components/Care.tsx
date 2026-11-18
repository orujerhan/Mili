import type { Settings, WaterState } from '@shared/types'
import type { TFunction } from '../lib/i18n'
import { cn } from '../lib/utils'
import { DropletIcon, EyeIcon, PlusIcon, StretchIcon } from './icons'
import { Toggle } from './ui'

interface CareProps {
  settings: Settings
  water: WaterState
  onPatch: (patch: Partial<Settings>) => void
  onAddWater: () => void
  onResetWater: () => void
  t: TFunction
}

const STRETCH_PRESETS = [30, 45, 60, 90]
const EYE_PRESETS = [15, 20, 30]

export function Care({ settings, water, onPatch, onAddWater, onResetWater, t }: CareProps) {
  const percent = Math.min(100, Math.round((water.count / Math.max(1, settings.waterGoal)) * 100))

  return (
    <div className="animate-rise space-y-2.5">
      <div className="glass p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[8.5px] font-bold text-ink-900/45">
              {t('care.water')}
            </p>
            <p className="num mt-1 text-[26px] font-semibold leading-none text-ink-900">
              {water.count}
              <span className="ml-1 text-[10px] font-normal text-ink-900/45">
                / {settings.waterGoal} {t('care.cups')}
              </span>
            </p>
          </div>
          <button type="button" onClick={onAddWater} className="primary-btn h-8 px-2.5 text-[10.5px]">
            <PlusIcon size={12} />
            {t('care.addCup')}
          </button>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1">
          {Array.from({ length: settings.waterGoal }).map((_, index) => (
            <DropletIcon
              key={index}
              size={13}
              className={cn(
                'transition-colors',
                index < water.count ? 'text-accent-cyan' : 'text-ink-900/15'
              )}
            />
          ))}
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-ink-900/10">
            <div
              className="h-full rounded-full bg-accent-teal transition-[width] duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          <button
            type="button"
            onClick={onResetWater}
            className="text-[8.5px] font-bold text-ink-900/45 transition hover:text-ink-900/70"
          >
            {t('care.reset')}
          </button>
        </div>
      </div>

      <div className="glass p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent-violet/15 text-accent-violet">
            <StretchIcon size={13} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-medium text-ink-900/80">{t('care.stretch')}</p>
            <p className="truncate text-[9px] text-ink-900/45">{t('care.stretchDesc')}</p>
          </div>
          <Toggle
            checked={settings.reminders.stretchEnabled}
            onChange={(value) =>
              onPatch({ reminders: { ...settings.reminders, stretchEnabled: value } })
            }
          />
        </div>

        <div className="mt-2 flex items-center gap-1">
          <span className="text-[8.5px] font-bold text-ink-900/40">
            {t('care.every')}
          </span>
          {STRETCH_PRESETS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => onPatch({ reminders: { ...settings.reminders, stretchMinutes: minutes } })}
              className={cn(
                'num rounded-md border px-1.5 py-[2px] text-[9px] transition',
                settings.reminders.stretchMinutes === minutes
                  ? 'border-accent-violet/40 bg-accent-violet/15 text-ink-900'
                  : 'border-ink-900/10 text-ink-900/35 hover:bg-ink-900/5'
              )}
            >
              {minutes}
            </button>
          ))}
          <span className="text-[8.5px] font-bold text-ink-900/40">{t('care.minutes')}</span>
        </div>
      </div>

      <div className="glass p-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent-cyan/15 text-accent-cyan">
            <EyeIcon size={13} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11.5px] font-medium text-ink-900/80">{t('care.eye')}</p>
            <p className="truncate text-[9px] text-ink-900/45">{t('care.eyeDesc')}</p>
          </div>
          <Toggle
            checked={settings.reminders.eyeEnabled}
            onChange={(value) => onPatch({ reminders: { ...settings.reminders, eyeEnabled: value } })}
          />
        </div>

        <div className="mt-2 flex items-center gap-1">
          <span className="text-[8.5px] font-bold text-ink-900/40">
            {t('care.every')}
          </span>
          {EYE_PRESETS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => onPatch({ reminders: { ...settings.reminders, eyeMinutes: minutes } })}
              className={cn(
                'num rounded-md border px-1.5 py-[2px] text-[9px] transition',
                settings.reminders.eyeMinutes === minutes
                  ? 'border-accent-cyan/40 bg-accent-cyan/15 text-ink-900'
                  : 'border-ink-900/10 text-ink-900/35 hover:bg-ink-900/5'
              )}
            >
              {minutes}
            </button>
          ))}
          <span className="text-[8.5px] text-ink-900/40">{t('care.minutes')}</span>
        </div>
      </div>
    </div>
  )
}
