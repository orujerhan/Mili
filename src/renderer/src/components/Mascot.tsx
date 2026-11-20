import { useState } from 'react'
import type { MascotMood } from '@shared/types'
import { mascotSprite } from '../lib/mascot'
import { cn } from '../lib/utils'

const MOTION: Record<MascotMood, string> = {
  idle: 'animate-floaty',
  vibing: 'animate-bouncey',
  focused: 'animate-floaty',
  sleepy: 'animate-floaty',
  happy: 'animate-pop'
}

/**
 * The sleeping pose is drawn lying down, so on its square canvas the bunny only
 * fills the width and reads smaller than the standing poses. Scaling the image
 * up (it is centred and may spill out of the layout box) brings her body back
 * to the same size as the rest.
 */
const SPRITE_SCALE: Record<MascotMood, number> = {
  idle: 1,
  vibing: 1,
  focused: 1,
  happy: 1,
  sleepy: 1.16
}

interface MascotProps {
  mood: MascotMood
  size?: number
}

export function Mascot({ mood, size = 92 }: MascotProps) {
  const sprite = mascotSprite(mood)
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const showSprite = Boolean(sprite) && failedSrc !== sprite
  const scale = SPRITE_SCALE[mood]

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        key={mood}
        className={cn('relative flex h-full w-full items-center justify-center', MOTION[mood])}
      >
        {showSprite ? (
          <img
            src={sprite as string}
            alt="Mili"
            draggable={false}
            onError={() => setFailedSrc(sprite)}
            style={scale === 1 ? undefined : { width: size * scale, height: size * scale }}
            className={cn(
              'max-w-none select-none object-contain drop-shadow-[0_6px_12px_rgba(20,22,32,0.14)]',
              scale === 1 && 'h-full w-full'
            )}
          />
        ) : (
          <FallbackBunny className="h-full w-full drop-shadow-[0_6px_12px_rgba(20,22,32,0.14)]" />
        )}
      </div>

      <MoodEffects mood={mood} />
    </div>
  )
}

const NOTES = [
  { glyph: '♪', left: '2%', top: '42%', color: '#0891B2', size: 13 },
  { glyph: '♫', left: '84%', top: '30%', color: '#7C3AED', size: 15 },
  { glyph: '♬', left: '72%', top: '62%', color: '#B45309', size: 11 },
  { glyph: '♪', left: '16%', top: '16%', color: '#DB2777', size: 11 }
]

function MoodEffects({ mood }: { mood: MascotMood }) {
  if (mood === 'vibing') {
    return (
      <div className="pointer-events-none absolute inset-0">
        {NOTES.map((note, index) => (
          <span
            key={`${note.glyph}-${index}`}
            className="absolute animate-driftUp font-semibold"
            style={{
              left: note.left,
              top: note.top,
              color: note.color,
              fontSize: note.size,
              animationDelay: `${index * 0.6}s`
            }}
          >
            {note.glyph}
          </span>
        ))}
      </div>
    )
  }

  if (mood === 'sleepy') {
    return (
      <div className="pointer-events-none absolute inset-0">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="absolute animate-driftUp font-semibold text-accent-violet/70"
            style={{
              left: `${64 + index * 9}%`,
              top: `${34 - index * 8}%`,
              fontSize: 10 + index * 4,
              animationDelay: `${index * 0.7}s`
            }}
          >
            Z
          </span>
        ))}
      </div>
    )
  }

  if (mood === 'happy') {
    const colors = ['#0891B2', '#7C3AED', '#DB2777', '#B45309', '#059669']
    return (
      <div className="pointer-events-none absolute inset-0">
        {colors.map((color, index) => (
          <span
            key={color}
            className="absolute animate-confetti rounded-full"
            style={{
              left: `${12 + index * 18}%`,
              top: '14%',
              width: 5,
              height: 5,
              backgroundColor: color,
              animationDelay: `${index * 0.09}s`
            }}
          />
        ))}
      </div>
    )
  }

  return null
}

/** Built-in placeholder used when ./assets/mili_mascot.png is missing. */
function FallbackBunny({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <ellipse cx="60" cy="109" rx="24" ry="4" fill="#22d3ee" opacity="0.18" />
      <g stroke="#141826" strokeWidth="3" fill="#FDFDFE" strokeLinejoin="round">
        <ellipse cx="45" cy="35" rx="9" ry="21" transform="rotate(-10 45 35)" />
        <ellipse cx="75" cy="35" rx="9" ry="21" transform="rotate(10 75 35)" />
      </g>
      <ellipse cx="47" cy="34" rx="4.2" ry="12" fill="#F9A8D4" transform="rotate(-10 47 34)" opacity="0.85" />
      <ellipse cx="73" cy="34" rx="4.2" ry="12" fill="#F9A8D4" transform="rotate(10 73 34)" opacity="0.85" />
      <ellipse cx="60" cy="70" rx="27" ry="25" fill="#FDFDFE" stroke="#141826" strokeWidth="3" />
      <ellipse cx="60" cy="88" rx="16" ry="13" fill="#F472B6" opacity="0.9" />
      <ellipse cx="49" cy="66" rx="2.8" ry="3.4" fill="#141826" />
      <ellipse cx="71" cy="66" rx="2.8" ry="3.4" fill="#141826" />
      <path d="M56.5 73.5q3.5 3.4 7 0" stroke="#141826" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="41" cy="72" r="3.8" fill="#F9A8D4" opacity="0.5" />
      <circle cx="79" cy="72" r="3.8" fill="#F9A8D4" opacity="0.5" />
      <path d="M60 24l-8.5-5.5v11z" fill="#F472B6" stroke="#141826" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M60 24l8.5-5.5v11z" fill="#F472B6" stroke="#141826" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="60" cy="24.5" r="2.6" fill="#F9A8D4" stroke="#141826" strokeWidth="1.6" />
    </svg>
  )
}
