import { useEffect, useState } from 'react'
import type { MediaState } from '@shared/types'

const INITIAL: MediaState = {
  ok: true,
  hasSession: false,
  title: '',
  artist: '',
  album: '',
  source: '',
  status: 'closed',
  playing: false,
  positionMs: 0,
  durationMs: 0,
  lastUpdatedMs: 0,
  artwork: '',
  error: '',
  receivedAt: 0
}

export function useMedia(): MediaState {
  const [media, setMedia] = useState<MediaState>(INITIAL)

  useEffect(() => {
    return window.mili.onMedia((state) => setMedia(state))
  }, [])

  return media
}

/**
 * The bridge polls every ~1.2s, so the progress bar and lyric highlight are
 * interpolated locally to stay smooth between polls.
 */
export function useTrackPosition(media: MediaState): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!media.playing) return
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [media.playing, media.receivedAt])

  if (!media.playing) return media.positionMs
  const elapsed = Math.max(0, now - media.receivedAt)
  const position = media.positionMs + elapsed
  return media.durationMs > 0 ? Math.min(media.durationMs, position) : position
}
