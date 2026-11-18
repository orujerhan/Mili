/** Cache of cover-art data URLs, keyed by lowercased "artist|title". */
const cache = new Map<string, string>()

function cacheKey(title: string, artist: string): string {
  return `${artist.trim().toLowerCase()}|${title.trim().toLowerCase()}`
}

async function readBytes(url: string, ms = 5000): Promise<string | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    if (buffer.length < 256) return null
    const mime = response.headers.get('content-type') || 'image/jpeg'
    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/** Deezer is keyless and has good coverage, including Russian catalogues. */
async function deezerCover(query: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=1`,
      { signal: controller.signal }
    )
    if (!response.ok) return ''
    const json = (await response.json()) as {
      data?: { album?: { cover_big?: string; cover_medium?: string } }[]
    }
    const cover =
      json.data?.[0]?.album?.cover_big || json.data?.[0]?.album?.cover_medium
    if (!cover) return ''
    return (await readBytes(cover)) ?? ''
  } catch {
    return ''
  } finally {
    clearTimeout(timer)
  }
}

/** iTunes is a reliable second opinion with high-resolution art. */
async function itunesCover(query: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=1`,
      { signal: controller.signal }
    )
    if (!response.ok) return ''
    const json = (await response.json()) as { results?: { artworkUrl100?: string }[] }
    const art = json.results?.[0]?.artworkUrl100
    if (!art) return ''
    const url = art.replace('/100x100bb', '/500x500bb')
    return (await readBytes(url)) ?? ''
  } catch {
    return ''
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Best-effort cover-art data URL for a track. Tries Deezer first, then iTunes.
 * Results (including empty) are cached so a track change does not re-fetch.
 */
export async function fetchCoverArt(title: string, artist: string): Promise<string> {
  const key = cacheKey(title, artist)
  if (cache.has(key)) return cache.get(key) ?? ''
  if (!title.trim() && !artist.trim()) return ''
  const query = `${artist} ${title}`.trim()
  let result = await deezerCover(query)
  if (!result) result = await itunesCover(query)
  cache.set(key, result)
  if (cache.size > 100) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  return result
}
