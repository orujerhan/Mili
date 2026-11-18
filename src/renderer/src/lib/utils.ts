export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

export function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

export function formatClock(date: Date, use24h: boolean): { hours: string; minutes: string; suffix: string } {
  const rawHours = date.getHours()
  const hours = use24h ? rawHours : rawHours % 12 || 12
  return {
    hours: pad(hours),
    minutes: pad(date.getMinutes()),
    suffix: use24h ? '' : rawHours >= 12 ? 'PM' : 'AM'
  }
}

export function formatDate(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(date)
  } catch {
    return date.toDateString()
  }
}

/** mm:ss for the timer, h:mm:ss above one hour. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}

export function formatTrackTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(total / 60)}:${pad(total % 60)}`
}

export function greetingKeyForHour(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 22) return 'evening'
  return 'night'
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Darkens (negative) or lightens (positive) a #rrggbb colour by a fraction. */
export function shadeHex(hex: string, amount: number): string {
  const value = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.slice(1) : '0891b2'
  const target = amount < 0 ? 0 : 255
  const ratio = Math.min(1, Math.abs(amount))
  const channels = [0, 2, 4].map((index) => {
    const channel = parseInt(value.slice(index, index + 2), 16)
    return Math.round(channel + (target - channel) * ratio)
  })
  return `#${channels.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`
}

/** '#0891b2' → '8 145 178' for use in rgb(var(--accent)) CSS. */
export function hexToChannels(hex: string): string {
  const value = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.slice(1) : '0891b2'
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}

export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
