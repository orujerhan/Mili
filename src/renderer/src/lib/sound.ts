/**
 * Tiny Web Audio synth — the whole app ships without a single audio file.
 */

let context: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    context = new Ctor()
  }
  if (context.state === 'suspended') {
    void context.resume().catch(() => undefined)
  }
  return context
}

function tone(frequency: number, start: number, duration: number, peak: number, type: OscillatorType = 'sine'): void {
  const ctx = getContext()
  if (!ctx) return
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + start)
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + start)
  gain.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duration)
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(ctx.currentTime + start)
  oscillator.stop(ctx.currentTime + start + duration + 0.05)
}

/** Warm two-note chime used when a pomodoro phase ends. */
export function playChime(): void {
  tone(659.25, 0, 0.5, 0.12)
  tone(987.77, 0.14, 0.55, 0.1)
  tone(1318.51, 0.28, 0.7, 0.06)
}

/** Quiet metronome tick. */
export function playTick(): void {
  tone(1200, 0, 0.045, 0.012, 'triangle')
}

/** Short rising blip for task completion. */
export function playPop(): void {
  tone(880, 0, 0.09, 0.05, 'triangle')
  tone(1174.66, 0.05, 0.12, 0.035, 'triangle')
}

export function playConfirm(): void {
  tone(523.25, 0, 0.14, 0.05)
  tone(783.99, 0.08, 0.18, 0.04)
}
