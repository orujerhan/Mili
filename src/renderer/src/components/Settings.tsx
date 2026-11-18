import { version } from '../../../../package.json'
import type { Language, Settings } from '@shared/types'
import type { TFunction } from '../lib/i18n'
import { ACCENT_SWATCHES } from '../lib/theme'
import { cn } from '../lib/utils'
import { Row, Section, Segmented, Stepper, Toggle } from './ui'
import { ArrowLeftIcon, XIcon } from './icons'

interface SettingsPanelProps {
  settings: Settings
  onPatch: (patch: Partial<Settings>) => void
  onClose: () => void
  t: TFunction
}

export function SettingsPanel({ settings, onPatch, onClose, t }: SettingsPanelProps) {
  const { pomodoro, reminders } = settings

  return (
    <div className="absolute inset-0 z-30 flex animate-slideOver flex-col bg-white">
      <header className="drag flex items-center gap-2 border-b border-ink-900/[0.06] px-3 py-2">
        <button
          type="button"
          onClick={onClose}
          title={t('settings.back')}
          className="soft-btn h-7 gap-1 rounded-lg px-2 text-[10.5px]"
        >
          <ArrowLeftIcon size={12} />
          {t('settings.back')}
        </button>
        <h2 className="text-[12px] font-semibold tracking-wide text-ink-900">{t('settings.title')}</h2>
        <button type="button" onClick={onClose} title={t('settings.close')} className="icon-btn ml-auto">
          <XIcon size={14} />
        </button>
      </header>

      <div className="scroll-thin flex-1 space-y-2 overflow-y-auto px-3 py-3">
        <Section title={t('settings.general')}>
          <Row title={t('settings.language')}>
            <Segmented<Language>
              value={settings.language}
              onChange={(language) => onPatch({ language })}
              options={[
                { value: 'en', label: 'EN' },
                { value: 'ru', label: 'RU' }
              ]}
            />
          </Row>
          <Row title={t('settings.timeFormat')}>
            <Segmented<'24' | '12'>
              value={settings.clock24h ? '24' : '12'}
              onChange={(value) => onPatch({ clock24h: value === '24' })}
              options={[
                { value: '24', label: '24h' },
                { value: '12', label: '12h' }
              ]}
            />
          </Row>
          <Row title={t('settings.name')}>
            <input
              value={settings.profileName}
              maxLength={24}
              placeholder={t('onboarding.namePlaceholder')}
              onChange={(event) => onPatch({ profileName: event.target.value })}
              className="w-28 rounded-lg bg-ink-900/[0.04] px-2 py-1 text-right text-[11px] font-semibold text-ink-900 outline-none"
            />
          </Row>
        </Section>

        <Section title={t('settings.appearance')}>
          <div className="flex flex-wrap items-center gap-1.5 py-2">
            {ACCENT_SWATCHES.map((color) => (
              <button
                key={color}
                type="button"
                title={color}
                aria-label={color}
                onClick={() => onPatch({ accent: color })}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition active:translate-y-[1px]',
                  settings.accent === color
                    ? 'border-ink-900/70'
                    : 'border-white hover:border-ink-900/20'
                )}
                style={{ background: color }}
              />
            ))}
          </div>
          <Row title={t('settings.primaryColor')} hint={t('settings.accentHint')}>
            <input
              type="color"
              value={settings.accent}
              aria-label={t('settings.primaryColor')}
              onChange={(event) => onPatch({ accent: event.target.value })}
              className="h-7 w-10 cursor-pointer rounded-lg border border-ink-900/10 bg-white p-0.5"
            />
          </Row>
        </Section>

        <Section title="Windows">
          <Row title={t('settings.alwaysOnTop')} hint={t('settings.alwaysOnTopDesc')}>
            <Toggle checked={settings.alwaysOnTop} onChange={(value) => onPatch({ alwaysOnTop: value })} />
          </Row>
          <Row title={t('settings.launch')} hint={t('settings.launchDesc')}>
            <Toggle checked={settings.launchAtLogin} onChange={(value) => onPatch({ launchAtLogin: value })} />
          </Row>
          <Row title={t('settings.sounds')} hint={t('settings.soundsDesc')}>
            <Toggle checked={settings.sound} onChange={(value) => onPatch({ sound: value })} />
          </Row>
          <Row title={t('settings.notifications')} hint={t('settings.notificationsDesc')}>
            <Toggle
              checked={settings.notifications}
              onChange={(value) => onPatch({ notifications: value })}
            />
          </Row>
        </Section>

        <Section title="Spotify">
          <Row title={t('settings.spotify')} hint={t('settings.spotifyDesc')}>
            <Toggle
              checked={settings.spotifyEnabled}
              onChange={(value) => onPatch({ spotifyEnabled: value })}
            />
          </Row>
          <Row title={t('settings.lyrics')} hint={t('settings.lyricsDesc')}>
            <Toggle checked={settings.showLyrics} onChange={(value) => onPatch({ showLyrics: value })} />
          </Row>
        </Section>

        <Section title={t('settings.pomodoro')}>
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
          <Row title={t('settings.longEvery')}>
            <Stepper
              value={pomodoro.longEvery}
              min={2}
              max={8}
              onChange={(longEvery) => onPatch({ pomodoro: { ...pomodoro, longEvery } })}
            />
          </Row>
        </Section>

        <Section title={t('settings.reminders')}>
          <Row title={t('care.stretch')} hint={t('care.stretchDesc')}>
            <Toggle
              checked={reminders.stretchEnabled}
              onChange={(stretchEnabled) =>
                onPatch({ reminders: { ...reminders, stretchEnabled } })
              }
            />
          </Row>
          <Row title={t('settings.stretchEvery')}>
            <Stepper
              value={reminders.stretchMinutes}
              min={5}
              max={180}
              step={5}
              suffix={t('common.min')}
              onChange={(stretchMinutes) =>
                onPatch({ reminders: { ...reminders, stretchMinutes } })
              }
            />
          </Row>
          <Row title={t('care.eye')} hint={t('care.eyeDesc')}>
            <Toggle
              checked={reminders.eyeEnabled}
              onChange={(eyeEnabled) => onPatch({ reminders: { ...reminders, eyeEnabled } })}
            />
          </Row>
          <Row title={t('settings.eyeEvery')}>
            <Stepper
              value={reminders.eyeMinutes}
              min={5}
              max={90}
              step={5}
              suffix={t('common.min')}
              onChange={(eyeMinutes) => onPatch({ reminders: { ...reminders, eyeMinutes } })}
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
        </Section>

        <Section title={t('settings.about')}>
          <Row title={`Mili · ${t('settings.version')}`}>
            <span className="num text-[10px] font-bold text-ink-900/45">v{version}</span>
          </Row>
          <div className="space-y-1 py-2">
            <p className="text-[9.5px] leading-tight text-ink-900/50">{t('settings.license')}</p>
            <p className="text-[9.5px] leading-tight text-ink-900/45">{t('settings.madeBy')}</p>
            <p className="text-[9.5px] font-bold leading-tight text-ink-900/60">{t('settings.author')}</p>
            <p className="text-[9.5px] leading-tight text-ink-900/45">{t('settings.shortcut')}</p>
          </div>
        </Section>
      </div>

      <footer className="border-t border-ink-900/[0.06] px-4 py-2 text-center">
        <span className="text-[8.5px] font-bold tracking-[0.2em] text-ink-900/35">MILI · MIT</span>
      </footer>
    </div>
  )
}
