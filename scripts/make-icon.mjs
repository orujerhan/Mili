/**
 * Builds the Mili app icon, the tray icon and the Windows .ico from the mascot
 * photo, so every icon surface uses the same artwork.
 *
 *   node scripts/make-icon.mjs
 *
 * Source: assets/mili_icon_source.webp (the shipped bunny illustration).
 * Output: assets/icon.png, assets/tray.png, build/icon.ico
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = process.argv[2] ?? join(root, 'assets', 'mili_icon_source.webp')
const assetsDir = join(root, 'assets')
const buildDir = join(root, 'build')

const WHITE_THRESHOLD = 236

/** Flood-fills the white paper background from the borders, keeping the art. */
function clearBackground(data, width, height) {
  const visited = new Uint8Array(width * height)
  const stack = []
  const isWhite = (x, y) => {
    const index = (y * width + x) * 4
    return (
      data[index] >= WHITE_THRESHOLD &&
      data[index + 1] >= WHITE_THRESHOLD &&
      data[index + 2] >= WHITE_THRESHOLD
    )
  }
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    if (visited[y * width + x]) return
    stack.push(x, y)
  }

  for (let x = 0; x < width; x += 1) {
    push(x, 0)
    push(x, height - 1)
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y)
    push(width - 1, y)
  }

  while (stack.length > 0) {
    const y = stack.pop()
    const x = stack.pop()
    const index = y * width + x
    if (visited[index]) continue
    visited[index] = 1
    if (!isWhite(x, y)) continue
    data[index * 4 + 3] = 0
    push(x + 1, y)
    push(x - 1, y)
    push(x, y + 1)
    push(x, y - 1)
  }
}

function icoFromPng(png, size = 256) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)

  const entry = Buffer.alloc(16)
  entry[0] = size >= 256 ? 0 : size
  entry[1] = size >= 256 ? 0 : size
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(png.length, 8)
  entry.writeUInt32LE(22, 12)

  return Buffer.concat([header, entry, png])
}

async function transparentPng() {
  const { data, info } = await sharp(await readFile(sourcePath))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  clearBackground(data, info.width, info.height)
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).trim({
    threshold: 1
  })
}

async function main() {
  if (!existsSync(sourcePath)) {
    console.error(`[icon] source not found: ${sourcePath}`)
    process.exit(1)
  }
  await mkdir(assetsDir, { recursive: true })
  await mkdir(buildDir, { recursive: true })

  const trimmed = await (await transparentPng()).png().toBuffer()

  const iconPng = await sharp(trimmed)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer()
  await writeFile(join(assetsDir, 'icon.png'), iconPng)
  console.log('[icon] wrote assets/icon.png')

  // Tray: the head reads better than the whole body at 16 px.
  const head = await sharp(trimmed)
    .extract({
      left: 0,
      top: 0,
      width: (await sharp(trimmed).metadata()).width,
      height: Math.round((await sharp(trimmed).metadata()).height * 0.62)
    })
    .png()
    .toBuffer()

  await sharp(head)
    .resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(join(assetsDir, 'tray.png'))
  console.log('[icon] wrote assets/tray.png')

  const icon256 = await sharp(iconPng).resize(256, 256).png().toBuffer()
  await writeFile(join(buildDir, 'icon.ico'), icoFromPng(icon256, 256))
  console.log('[icon] wrote build/icon.ico')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
