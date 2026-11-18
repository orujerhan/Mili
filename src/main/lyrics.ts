import { net } from 'electron'
import type { LyricsResult } from '@shared/types'

/**
 * LRCLIB (https://lrclib.net) is a free, open and keyless lyrics database.
 * We query /api/get first (exact match) and fall back to /api/search.
 */

const BASE = 'https://lrclib.net/api'
const USER_AGENT = 'Mili/1.0 (https://github.com/mili-app/mili)'
const TIMEOUT = 9000

interface LrclibTrack {
  trackName?: string
  artistName?: string
  albumName?: string
  instrumental?: boolean
  plainLyrics?: string | null
  syncedLyrics?: string | null
}

const EMPTY: LyricsResult = {
  found: false,
  syncedLyrics: '',
  plainLyrics: '',
  instrumental: false,
  trackName: '',
  artistName: '',
  albumName: '',
  error: ''
}

async function request(url: string): Promise<unknown | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT)
  try {
    const response = await net.fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: controller.signal
    })
    if (!response.ok) return null
    return (await response.json()) as unknown
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function toResult(track: LrclibTrack | null): LyricsResult {
  if (!track) return { ...EMPTY }
  const synced = (track.syncedLyrics ?? '').trim()
  const plain = (track.plainLyrics ?? '').trim()
  return {
    found: Boolean(synced || plain),
    syncedLyrics: synced,
    plainLyrics: plain,
    instrumental: Boolean(track.instrumental),
    trackName: track.trackName ?? '',
    artistName: track.artistName ?? '',
    albumName: track.albumName ?? '',
    error: ''
  }
}

export async function fetchLyrics(query: {
  title: string
  artist: string
  album: string
  durationMs: number
}): Promise<LyricsResult> {
  const title = (query.title || '').trim()
  if (!title) return { ...EMPTY, error: 'no-track' }

  // Strip common decorations Spotify adds to media session titles.
  const cleanTitle = title
    .replace(/\s*[([-]\s*(feat\.?|ft\.|with)\s[^)\]]*[)\]]?/gi, '')
    .replace(/\s*[([-]\s*(remaster(ed)?|radio edit|live|explicit)[^)\]]*[)\]]?/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  const artist = (query.artist || '').split(/,|&|feat\./i)[0].trim()
  const durationSeconds = query.durationMs > 0 ? Math.round(query.durationMs / 1000) : 0

  if (artist) {
    const params = new URLSearchParams({ track_name: cleanTitle, artist_name: artist })
    if (query.album) params.set('album_name', query.album)
    if (durationSeconds > 0) params.set('duration', String(durationSeconds))

    const exact = (await request(`${BASE}/get?${params.toString()}`)) as LrclibTrack | null
    if (exact && (exact.syncedLyrics || exact.plainLyrics)) {
      return toResult(exact)
    }
  }

  // Fallback: fuzzy search, preferring entries that carry synced lyrics.
  const searchParams = new URLSearchParams()
  searchParams.set('track_name', cleanTitle)
  if (artist) searchParams.set('artist_name', artist)
  const found = (await request(`${BASE}/search?${searchParams.toString()}`)) as LrclibTrack[] | null
  if (Array.isArray(found) && found.length > 0) {
    const synced = found.find((item) => Boolean(item.syncedLyrics))
    return toResult(synced ?? found[0])
  }

  return { ...EMPTY, error: 'not-found' }
}
