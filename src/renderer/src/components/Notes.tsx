import { useEffect, useRef, useState } from 'react'
import type { TFunction } from '../lib/i18n'
import { cn } from '../lib/utils'

interface NotesProps {
  value: string
  onChange: (value: string) => void
  t: TFunction
}

export function Notes({ value: initialValue, onChange, t }: NotesProps) {
  const [value, setValue] = useState(initialValue)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const savedRef = useRef(initialValue)

  useEffect(() => {
    if (value === savedRef.current) return
    setStatus('saving')
    const id = window.setTimeout(() => {
      savedRef.current = value
      onChange(value)
      setStatus('saved')
    }, 450)
    return () => window.clearTimeout(id)
  }, [value, onChange])

  useEffect(() => {
    if (status !== 'saved') return
    const id = window.setTimeout(() => setStatus('idle'), 1600)
    return () => window.clearTimeout(id)
  }, [status])

  const words = value.trim() ? value.trim().split(/\s+/).length : 0

  return (
    <div className="animate-rise">
      <div className="glass flex h-[336px] flex-col p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[8.5px] font-bold text-ink-900/45">
            {t('notes.title')}
          </span>
          <span
            className={cn(
              'flex items-center gap-1 text-[8.5px] transition',
              status === 'saving' ? 'text-ink-900/25' : 'text-accent-cyan/60'
            )}
          >
            <span
              className={cn(
                'h-1 w-1 rounded-full',
                status === 'saving' ? 'animate-pulse bg-ink-900/40' : 'bg-accent-cyan'
              )}
            />
            {status === 'saving' ? t('notes.saving') : status === 'saved' ? t('notes.saved') : ''}
          </span>
        </div>

        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t('notes.placeholder')}
          spellCheck={false}
          className="scroll-thin min-h-0 flex-1 resize-none rounded-lg bg-transparent px-1 text-[11.5px] leading-[1.7] text-ink-900/80 outline-none placeholder:text-ink-900/30"
        />

        <div className="num mt-1 flex items-center justify-between border-t border-ink-900/[0.05] pt-1.5 text-[8.5px] text-ink-900/45">
          <span>
            {words} {t('notes.words')}
          </span>
          <span>
            {value.length} {t('notes.chars')}
          </span>
        </div>
      </div>
      <p className="mt-1.5 px-1 text-[9px] text-ink-900/40">markdown · txt · auto-save</p>
    </div>
  )
}
