import type { SystemStats, WaterState } from '@shared/types'
import type { TFunction } from '../lib/i18n'
import { cn } from '../lib/utils'
import { DropletIcon, PlusIcon } from './icons'

interface FooterProps {
  stats: SystemStats | null
  water: WaterState
  goal: number
  onAddWater: () => void
  t: TFunction
}

export function Footer({ stats, water, goal, onAddWater, t }: FooterProps) {
  return (
    <footer className="flex items-center gap-1.5 border-t border-ink-900/[0.05] px-3 py-1.5">
      <Pill label={t('footer.cpu')} value={`${stats?.cpu ?? 0}%`} tone="cyan" />
      <Pill label={t('footer.ram')} value={`${stats?.ram ?? 0}%`} tone="violet" />

      <div className="ml-auto flex items-center">
        <button
          type="button"
          onClick={onAddWater}
          title={`${t('care.addCup')} · ${water.count}/${goal}`}
          className="chip transition hover:border-accent-cyan/40 hover:text-ink-900/85 active:scale-95"
        >
          <DropletIcon size={9} className="text-accent-cyan" />
          <span className="num">
            {water.count}/{goal}
          </span>
          <PlusIcon size={8} />
        </button>
      </div>
    </footer>
  )
}

function Pill({
  label,
  value,
  tone
}: {
  label: string
  value: string
  tone: 'cyan' | 'violet'
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-ink-900/[0.07] bg-ink-900/[0.035] px-1.5 py-[2px] text-[8.5px] leading-none text-ink-900/45">
      <span
        className={cn(
          'h-1 w-1 rounded-full',
          tone === 'cyan' ? 'bg-accent-cyan/80' : 'bg-accent-violet/80'
        )}
      />
      {label}
      <span className="num font-bold text-ink-900/60">{value}</span>
    </span>
  )
}
