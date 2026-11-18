import type { ComponentType, SVGProps } from 'react'
import type { TFunction } from '../lib/i18n'
import type { TranslationKey } from '../lib/i18n'
import { cn } from '../lib/utils'
import { CareIcon, HomeIcon, NoteIcon, TasksIcon, TimerIcon } from './icons'

export type TabId = 'home' | 'focus' | 'tasks' | 'notes' | 'care'

interface TabDefinition {
  id: TabId
  label: TranslationKey
  Icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>
}

const TABS: TabDefinition[] = [
  { id: 'home', label: 'tabs.home', Icon: HomeIcon },
  { id: 'focus', label: 'tabs.focus', Icon: TimerIcon },
  { id: 'tasks', label: 'tabs.tasks', Icon: TasksIcon },
  { id: 'notes', label: 'tabs.notes', Icon: NoteIcon },
  { id: 'care', label: 'tabs.care', Icon: CareIcon }
]

interface TabsProps {
  active: TabId
  onChange: (tab: TabId) => void
  t: TFunction
}

export function Tabs({ active, onChange, t }: TabsProps) {
  return (
    <nav className="flex gap-1 rounded-xl bg-ink-900/[0.05] p-1">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = id === active
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'group flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition duration-150 active:translate-y-[1px]',
              isActive
                ? 'bg-accent-cyan text-white shadow-[0_2px_0_rgba(20,22,29,0.18)]'
                : 'text-ink-900/55 hover:bg-ink-900/[0.04] hover:text-ink-900/80'
            )}
          >
            <Icon size={14} className={isActive ? 'text-white' : ''} />
            <span className="max-w-full truncate px-0.5 text-[8.5px] font-extrabold uppercase leading-none tracking-[0.02em]">
              {t(label)}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
