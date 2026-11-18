import { useState } from 'react'
import type { Priority, Task } from '@shared/types'
import type { TFunction } from '../lib/i18n'
import { cn } from '../lib/utils'
import { CheckIcon, PlusIcon, TrashIcon } from './icons'

interface TasksProps {
  tasks: Task[]
  onAdd: (text: string, priority: Priority) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onCyclePriority: (id: string) => void
  onClearDone: () => void
  t: TFunction
}

const PRIORITY_STYLE: Record<Priority, string> = {
  low: 'border-ink-900/10 bg-ink-900/[0.04] text-ink-900/35',
  normal: 'border-accent-cyan/20 bg-accent-cyan/10 text-accent-cyan/80',
  high: 'border-accent-pink/25 bg-accent-pink/10 text-accent-pink'
}

export function Tasks({ tasks, onAdd, onToggle, onDelete, onCyclePriority, onClearDone, t }: TasksProps) {
  const [draft, setDraft] = useState('')
  const [priority, setPriority] = useState<Priority>('normal')

  const total = tasks.length
  const done = tasks.filter((task) => task.done).length
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  const ordered = [...tasks].sort(
    (a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt
  )

  const submit = (event: React.FormEvent): void => {
    event.preventDefault()
    if (!draft.trim()) return
    onAdd(draft, priority)
    setDraft('')
  }

  const cycle = (): void => {
    setPriority((current) => (current === 'normal' ? 'high' : current === 'high' ? 'low' : 'normal'))
  }

  return (
    <div className="animate-rise space-y-2.5">
      <form onSubmit={submit} className="glass flex items-center gap-1.5 p-1.5">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('tasks.placeholder')}
          className="h-8 min-w-0 flex-1 rounded-lg bg-transparent px-2 text-[11.5px] font-medium text-ink-900 outline-none placeholder:text-ink-900/35"
          maxLength={160}
        />
        <button
          type="button"
          onClick={cycle}
          className={cn(
            'shrink-0 rounded-md border px-1.5 py-1 text-[9px] font-medium transition',
            PRIORITY_STYLE[priority]
          )}
          title={t('tasks.priority.normal')}
        >
          {t(`tasks.priority.${priority}`)}
        </button>
        <button
          type="submit"
          disabled={!draft.trim()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-cyan text-white transition hover:brightness-110 disabled:opacity-30"
        >
          <PlusIcon size={14} />
        </button>
      </form>

      <div className="glass px-3 py-2">
        <div className="flex items-center justify-between text-[9.5px]">
          <span className="text-ink-900/40">
            <span className="num font-semibold text-ink-900/70">{done}</span>
            <span className="mx-0.5 text-ink-900/20">/</span>
            <span className="num">{total}</span>
            <span className="ml-1">{t('tasks.progress')}</span>
          </span>
          <span className="num text-[9px] text-accent-cyan/70">{percent}%</span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink-900/10">
          <div
            className="h-full rounded-full bg-accent-cyan transition-[width] duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="glass px-1.5 py-1.5">
        {ordered.length === 0 ? (
          <div className="py-7 text-center">
            <p className="text-[11px] font-bold text-ink-900/55">{t('tasks.empty')}</p>
            <p className="mt-0.5 text-[9.5px] text-ink-900/40">{t('tasks.emptyHint')}</p>
          </div>
        ) : (
          <ul className="max-h-[248px] space-y-0.5 overflow-y-auto scroll-thin">
            {ordered.map((task) => (
              <li
                key={task.id}
                className="group flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition hover:bg-ink-900/[0.04]"
              >
                <button
                  type="button"
                  onClick={() => onToggle(task.id)}
                  aria-label={t('tasks.progress')}
                  className={cn(
                    'flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[5px] border transition',
                    task.done
                      ? 'border-accent-cyan bg-accent-cyan text-white'
                      : 'border-ink-900/25 text-transparent hover:border-accent-cyan/60'
                  )}
                >
                  <CheckIcon size={10} />
                </button>

                <p
                  className={cn(
                    'min-w-0 flex-1 truncate text-[11.5px] leading-snug',
                    task.done ? 'text-ink-900/25 line-through' : 'text-ink-900/85'
                  )}
                  title={task.text}
                >
                  {task.text}
                </p>

                <button
                  type="button"
                  onClick={() => onCyclePriority(task.id)}
                  className={cn(
                    'shrink-0 rounded border px-1 py-[1px] text-[8px] font-medium uppercase tracking-wide transition',
                    PRIORITY_STYLE[task.priority],
                    task.done && 'opacity-40'
                  )}
                >
                  {t(`tasks.priority.${task.priority}`)}
                </button>

                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  title={t('tasks.delete')}
                  className="shrink-0 text-ink-900/15 opacity-0 transition hover:text-accent-pink group-hover:opacity-100"
                >
                  <TrashIcon size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {done > 0 && (
        <button
          type="button"
          onClick={onClearDone}
          className="mx-auto block text-[9.5px] font-bold text-ink-900/45 transition hover:text-ink-900/70"
        >
          {t('tasks.clearDone')}
        </button>
      )}
    </div>
  )
}
