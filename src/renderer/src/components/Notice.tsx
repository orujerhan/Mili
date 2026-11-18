import { BellIcon, XIcon } from './icons'

interface NoticeProps {
  title: string
  body: string
  onClose: () => void
}

/** In-app notification shown on the island (pomodoro, stretch, eye care…). */
export function Notice({ title, body, onClose }: NoticeProps) {
  return (
    <div className="mb-2 flex items-start gap-2 rounded-xl bg-white p-2 shadow-[0_1px_3px_rgba(20,22,29,0.08)] animate-rise">
      <span className="mt-[1px] flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-cyan/10 text-accent-cyan">
        <BellIcon size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold leading-tight text-ink-900">{title}</p>
        <p className="mt-0.5 text-[9.5px] leading-snug text-ink-900/55">{body}</p>
      </div>
      <button type="button" onClick={onClose} className="icon-btn h-5 w-5" aria-label="Dismiss">
        <XIcon size={11} />
      </button>
    </div>
  )
}
