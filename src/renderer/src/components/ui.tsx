import type { ReactNode } from 'react'
import { cn } from '../lib/utils'

export function Toggle({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[18px] w-8 shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-accent-cyan' : 'bg-ink-900/15'
      )}
    >
      <span
        className={cn(
          'absolute top-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-all duration-200',
          checked ? 'left-[16px]' : 'left-[2px]'
        )}
      />
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
}) {
  return (
    <div className="flex shrink-0 rounded-lg border border-ink-900/10 bg-ink-900/[0.045] p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn('seg-item', option.value === value && 'seg-item-active')}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Stepper({
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange
}: {
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (value: number) => void
}) {
  const clamp = (next: number): number => Math.min(max, Math.max(min, next))
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <button
        type="button"
        onClick={() => onChange(clamp(value - step))}
        aria-label="Decrease"
        className="flex h-6 w-6 items-center justify-center rounded-md border border-ink-900/10 text-[12px] leading-none text-ink-900/50 transition hover:bg-ink-900/10 hover:text-ink-900 active:scale-95"
      >
        −
      </button>
      <span className="num w-[38px] text-center text-[11px] font-semibold text-ink-900">
        {value}
        {suffix ? <span className="ml-0.5 text-[8.5px] font-normal text-ink-900/35">{suffix}</span> : null}
      </span>
      <button
        type="button"
        onClick={() => onChange(clamp(value + step))}
        aria-label="Increase"
        className="flex h-6 w-6 items-center justify-center rounded-md border border-ink-900/10 text-[12px] leading-none text-ink-900/50 transition hover:bg-ink-900/10 hover:text-ink-900 active:scale-95"
      >
        +
      </button>
    </div>
  )
}

export function Row({
  title,
  hint,
  children
}: {
  title: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-[7px]">
      <div className="min-w-0">
        <p className="text-[11.5px] text-ink-900/75">{title}</p>
        {hint ? <p className="mt-0.5 text-[9px] leading-tight text-ink-900/45">{hint}</p> : null}
      </div>
      {children}
    </div>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass px-3 py-2">
      <h3 className="mb-1 text-[8.5px] font-extrabold uppercase tracking-[0.12em] text-ink-900/45">
        {title}
      </h3>
      <div className="divide-y divide-ink-900/[0.05]">{children}</div>
    </section>
  )
}
