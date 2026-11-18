import type { MascotMood } from '@shared/types'
import iconUrl from '../../../../assets/icon.png'

/** Generated from assets/mili_icon_source.webp — used as the brand mark in the UI. */
export const appIconUrl: string = iconUrl

/**
 * Any ./assets/mili_*.png dropped into the project is picked up automatically.
 *    mili_mascot.png  → idle / default mascot
 *    mili_vibing.png  → headphones + music notes
 *    mili_focused.png → glasses, study pose
 *    mili_sleepy.png  → pillow + Zzz
 *    mili_happy.png   → celebrating pose
 * Missing files simply fall back: mood → mili_mascot → built-in SVG bunny.
 */
const discovered = import.meta.glob('../../../../assets/mili_*.png', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>

const sprites: Record<string, string> = {}

for (const [path, url] of Object.entries(discovered)) {
  const file = path.split('/').pop() ?? ''
  const name = file.replace(/\.png$/i, '')
  sprites[name] = url
}

export function mascotSprite(mood: MascotMood): string | null {
  return sprites[`mili_${mood}`] ?? sprites.mili_mascot ?? null
}

export function hasMascotArt(): boolean {
  return Boolean(sprites.mili_mascot)
}
