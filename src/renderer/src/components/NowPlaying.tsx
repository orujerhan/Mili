import { useEffect, useMemo, useRef, useState } from 'react'
import type { LyricsResult, MediaCommand, MediaState } from '@shared/types'
import { activeLineIndex, parseLrc, type LyricLine } from '@shared/lrc'
import type { TFunction } from '../lib/i18n'
import { cn, formatTrackTime } from '../lib/utils'
import { useTrackPosition } from '../hooks/useMedia'
import {
  ExternalIcon,
  MusicIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon
} from './icons'

const lyricsCache = new Map<string, LyricsResult>()

interface NowPlayingProps {
  media: MediaState
  spotifyEnabled: boolean
  showLyrics: boolean
  onOpenSettings: () => void
  t: TFunction
}

export function NowPlaying({ media, spotifyEnabled, showLyrics, onOpenSettings, t }: NowPlayingProps) {
  const position = useTrackPosition(media)
  const [lyrics, setLyrics] = useState<LyricsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const trackKey = media.title ? `${media.artist}::${media.title}` : ''

  useEffect(() => {
    if (!spotifyEnabled || !showLyrics || !trackKey) {
      setLyrics(null)
      setLoading(false)
      return
    }

    const cached = lyricsCache.get(trackKey)
    if (cached) {
      setLyrics(cached)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    window.mili
      .fetchLyrics({
        title: media.title,
        artist: media.artist,
        album: media.album,
        durationMs: media.durationMs
      })
      .then((result) => {
        lyricsCache.set(trackKey, result)
        if (!cancelled) setLyrics(result)
      })
      .catch(() => {
        if (!cancelled) setLyrics(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackKey, showLyrics, spotifyEnabled])

  const lines = useMemo<LyricLine[]>(
    () => (lyrics?.syncedLyrics ? parseLrc(lyrics.syncedLyrics) : []),
    [lyrics]
  )

  const command = (action: MediaCommand): void => {
    void window.mili.mediaCommand(action)
  }

  const percent = media.durationMs > 0 ? Math.min(100, (position / media.durationMs) * 100) : 0
  const hasTrack = Boolean(media.title)

  if (!spotifyEnabled) {
    return (
      <div className="glass flex h-full flex-col items-center justify-center p-4 text-center animate-rise">
        <MusicIcon size={20} className="mx-auto text-ink-900/20" />
        <p className="mt-2 px-2 text-[11px] leading-relaxed text-ink-900/45">
          {t('media.detectionOff')}
        </p>
        <button type="button" onClick={onOpenSettings} className="soft-btn mt-2">
          {t('header.settings')}
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2.5 animate-rise">
      <div className="glass shrink-0 overflow-hidden p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[8.5px] font-bold text-ink-900/45">
            {t('media.nowPlaying')}
          </span>
          <span
            className={cn(
              'flex items-center gap-1 text-[8.5px]',
              media.playing ? 'text-accent-cyan' : 'text-ink-900/40'
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                media.playing ? 'animate-pulse bg-accent-cyan' : 'bg-ink-900/25'
              )}
            />
            {media.playing ? t('media.playing') : t('media.paused')}
          </span>
        </div>

        <div className="flex gap-3">
          <div className="relative h-[58px] w-[58px] shrink-0 overflow-hidden rounded-xl bg-ink-900/[0.06] ring-1 ring-ink-900/10">
            {media.artwork ? (
              <img src={media.artwork} alt="" className="h-full w-full object-cover" draggable={false} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-ink-900/25">
                <MusicIcon size={20} />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight text-ink-900">
              {hasTrack ? media.title : t('media.nothing')}
            </p>
            <p className="mt-0.5 truncate text-[10.5px] text-ink-900/45">
              {hasTrack ? media.artist || '—' : t('media.nothingHint')}
            </p>
            {media.album ? (
              <p className="mt-0.5 truncate text-[9px] text-ink-900/40">{media.album}</p>
            ) : null}

            <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-ink-900/10">
              <div
                className="h-full rounded-full bg-accent-cyan transition-[width] duration-300 ease-linear"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="num mt-1 flex justify-between text-[8.5px] text-ink-900/40">
              <span>{formatTrackTime(position)}</span>
              <span>{formatTrackTime(media.durationMs)}</span>
            </div>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            className="icon-btn"
            title={t('media.previous')}
            onClick={() => command('previous')}
            disabled={!hasTrack}
          >
            <PrevIcon size={13} />
          </button>
          <button
            type="button"
            onClick={() => command('playpause')}
            disabled={!hasTrack}
            title={media.playing ? t('media.pause') : t('media.play')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-white transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {media.playing ? <PauseIcon size={14} /> : <PlayIcon size={14} className="ml-0.5" />}
          </button>
          <button
            type="button"
            className="icon-btn"
            title={t('media.next')}
            onClick={() => command('next')}
            disabled={!hasTrack}
          >
            <NextIcon size={13} />
          </button>
        </div>

        {!media.ok && (
          <p className="mt-2 rounded-lg bg-accent-pink/10 px-2 py-1 text-[9px] leading-tight text-accent-pink/80">
            {media.error || t('media.unsupported')}
          </p>
        )}
      </div>

      <div className="glass flex min-h-0 flex-1 flex-col p-3">
        <div className="mb-1 flex shrink-0 items-center justify-between">
          <span className="text-[8.5px] font-bold text-ink-900/45">
            {t('media.lyrics')}
          </span>
          {lyrics?.found && <span className="text-[8px] text-ink-900/40">{t('media.lyricsCredit')}</span>}
        </div>

        {!showLyrics ? (
          <p className="flex flex-1 items-center justify-center text-center text-[10px] text-ink-900/45">
            {t('media.lyricsOff')}
          </p>
        ) : loading ? (
          <p className="flex flex-1 items-center justify-center animate-pulse text-center text-[10px] text-ink-900/45">
            {t('media.lyricsLoading')}
          </p>
        ) : lines.length > 0 ? (
          <LyricsList lines={lines} positionMs={position} />
        ) : lyrics?.plainLyrics ? (
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto whitespace-pre-line py-1 text-[10.5px] leading-5 text-ink-900/45">
            {lyrics.plainLyrics}
          </div>
        ) : (
          <div className="py-5 text-center">
            <p className="text-[10px] text-ink-900/30">
              {lyrics?.instrumental ? t('media.lyricsInstrumental') : t('media.lyricsNone')}
            </p>
            {!hasTrack && (
              <button
                type="button"
                onClick={() => void window.mili.openExternal('https://open.spotify.com')}
                className="soft-btn mt-2"
              >
                <ExternalIcon size={11} />
                {t('media.openSpotify')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function LyricsList({ lines, positionMs }: { lines: LyricLine[]; positionMs: number }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLParagraphElement | null>(null)
  const index = activeLineIndex(lines, positionMs / 1000)

  useEffect(() => {
    const container = containerRef.current
    const element = activeRef.current
    if (!container || !element) return
    const target = element.offsetTop - container.clientHeight / 2 + element.clientHeight / 2
    container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
  }, [index])

  return (
    <div
      ref={containerRef}
      className="scroll-thin min-h-0 flex-1 overflow-y-auto text-center"
      style={{
        maskImage: 'linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)'
      }}
    >
      <div className="py-12">
        {lines.map((line, lineIndex) => (
          <p
            key={`${line.time}-${lineIndex}`}
            ref={lineIndex === index ? activeRef : null}
            className={cn(
              'px-2 py-1 text-[11px] leading-snug transition-all duration-300',
              lineIndex === index
                ? 'scale-[1.04] font-semibold text-ink-900'
                : lineIndex < index
                  ? 'text-ink-900/30'
                  : 'text-ink-900/55'
            )}
          >
            {line.text || '♪'}
          </p>
        ))}
      </div>
    </div>
  )
}
