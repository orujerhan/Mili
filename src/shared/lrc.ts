export interface LyricLine {
  /** seconds */
  time: number
  text: string
}

const TIME_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g

/**
 * Parses an LRC document into a sorted list of timed lines.
 * Supports multiple tags per line and both `[mm:ss.xx]` / `[mm:ss.xxx]` forms.
 */
export function parseLrc(input: string): LyricLine[] {
  if (!input) return []
  const lines: LyricLine[] = []

  for (const rawLine of input.split(/\r?\n/)) {
    const stamps: number[] = []
    TIME_TAG.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = TIME_TAG.exec(rawLine)) !== null) {
      const minutes = Number.parseInt(match[1], 10)
      const seconds = Number.parseInt(match[2], 10)
      const fractionRaw = match[3] ?? '0'
      const fraction = Number.parseInt(fractionRaw, 10) / Math.pow(10, fractionRaw.length)
      stamps.push(minutes * 60 + seconds + fraction)
    }
    if (stamps.length === 0) continue

    const text = rawLine.replace(TIME_TAG, '').trim()
    for (const time of stamps) {
      lines.push({ time, text })
    }
  }

  lines.sort((a, b) => a.time - b.time)

  // Drop duplicate timestamps produced by repeated tags.
  const deduped: LyricLine[] = []
  for (const line of lines) {
    const previous = deduped[deduped.length - 1]
    if (previous && Math.abs(previous.time - line.time) < 0.001) {
      if (!previous.text && line.text) previous.text = line.text
      continue
    }
    deduped.push({ ...line })
  }

  return deduped
}

/** Index of the lyric line active at `positionSeconds`, or -1 when before the first line. */
export function activeLineIndex(lines: LyricLine[], positionSeconds: number): number {
  let index = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].time <= positionSeconds + 0.15) index = i
    else break
  }
  return index
}
