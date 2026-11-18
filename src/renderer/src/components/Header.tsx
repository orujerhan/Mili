import type { MascotMood } from '@shared/types'
import type { TFunction } from '../lib/i18n'
import { appIconUrl } from '../lib/mascot'
import { cn } from '../lib/utils'
import { ChevronUpIcon, GearIcon, MinusIcon, PinIcon } from './icons'

const DOT: Record<MascotMood, string> = {
  idle: 'bg-ink-900/30',
  vibing: 'bg-accent-cyan',
  focused: 'bg-accent-violet',
  sleepy: 'bg-indigo-400',
  happy: 'bg-accent-pink'
}

interface HeaderProps {
  mood: MascotMood
  alwaysOnTop: boolean
  onTogglePin: () => void
  onOpenSettings: () => void
  onCollapse: () => void
  onHide: () => void
  t: TFunction
}

export function Header({
  mood,
  alwaysOnTop,
  onTogglePin,
  onOpenSettings,
  onCollapse,
  onHide,
  t
}: HeaderProps) {
  return (
    <header className="drag flex items-center gap-2 px-4 pb-1 pt-3">
      <img src={appIconUrl} alt="Mili" draggable={false} className="h-7 w-7 object-contain" />
      <span className="text-[14px] font-bold tracking-tight text-ink-900">Mili</span>

      <div className="ml-auto flex items-center gap-1">
        <span className="chip mr-0.5">
          <span className={cn('h-1.5 w-1.5 rounded-full', DOT[mood])} />
          {t(`mood.${mood}`)}
        </span>

        <button
          type="button"
          onClick={onTogglePin}
          title={t('header.pin')}
          aria-pressed={alwaysOnTop}
          className={cn('icon-btn', alwaysOnTop && 'bg-accent-cyan/10 text-accent-cyan')}
        >
          <PinIcon size={13} />
        </button>
        <button type="button" onClick={onOpenSettings} title={t('header.settings')} className="icon-btn">
          <GearIcon size={14} />
        </button>
        <button type="button" onClick={onHide} title={t('header.hide')} className="icon-btn">
          <MinusIcon size={14} />
        </button>
        <button
          type="button"
          onClick={onCollapse}
          title={t('header.collapse')}
          className="icon-btn"
        >
          <ChevronUpIcon size={14} />
        </button>
      </div>
    </header>
  )
}
