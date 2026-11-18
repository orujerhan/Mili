/**
 * Slices the Mili mascot sprites from a 4x4 sticker sheet.
 * The app/tray icons come from scripts/make-icon.mjs.
 *
 *   node scripts/make-assets.mjs [path/to/sheet.webp]
 *
 * Defaults to ./assets/mili_sheet.webp. The generated files are committed, so
 * this only needs to run when the artwork changes.
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sheetPath = process.argv[2] ?? join(root, 'assets', 'mili_sheet.webp')
const assetsDir = join(root, 'assets')
const buildDir = join(root, 'build')

const COLUMNS = 4
const ROWS = 4
const WHITE_THRESHOLD = 232

/** Rows of the sheet mapped to mascot moods. */
const MOODS = [
  { name: 'mili_mascot', row: 0, column: 0 },
  { name: 'mili_happy', row: 0, column: 1 },
  { name: 'mili_vibing', row: 1, column: 0 },
  { name: 'mili_focused', row: 2, column: 0 },
  { name: 'mili_sleepy', row: 3, column: 0 }
]

/**
 * Flood-fills the white sheet background from the borders so the mascot stays
 * intact (interior whites like the face are never touched).
 */
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

  // Soften the one pixel halo left on anti-aliased white edges.
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x
      if (data[index * 4 + 3] === 0) continue
      const neighboursClear =
        data[(index - 1) * 4 + 3] === 0 ||
        data[(index + 1) * 4 + 3] === 0 ||
        data[(index - width) * 4 + 3] === 0 ||
        data[(index + width) * 4 + 3] === 0
      if (!neighboursClear) continue
      const minimum = Math.min(data[index * 4], data[index * 4 + 1], data[index * 4 + 2])
      if (minimum > 205) data[index * 4 + 3] = Math.min(data[index * 4 + 3], 90)
    }
  }
}

async function main() {
  if (!existsSync(sheetPath)) {
    console.error(`[assets] sheet not found: ${sheetPath}`)
    process.exit(1)
  }

  await mkdir(assetsDir, { recursive: true })
  await mkdir(buildDir, { recursive: true })

  const sheet = sharp(await readFile(sheetPath))
  const meta = await sheet.metadata()
  const cellWidth = Math.floor(meta.width / COLUMNS)
  const cellHeight = Math.floor(meta.height / ROWS)
  const padding = Math.round(Math.min(cellWidth, cellHeight) * 0.03)

  for (const mood of MOODS) {
    const left = mood.column * cellWidth + padding
    const top = mood.row * cellHeight + padding
    const width = cellWidth - padding * 2
    const height = cellHeight - padding * 2

    const { data, info } = await sharp(await readFile(sheetPath))
      .extract({ left, top, width, height })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    clearBackground(data, info.width, info.height)

    const raw = { width: info.width, height: info.height, channels: 4 }

    let output
    try {
      output = await sharp(data, { raw })
        .trim({ threshold: 1 })
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ compressionLevel: 9 })
        .toBuffer()
    } catch {
      output = await sharp(data, { raw })
        .resize(512, 512, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png({ compressionLevel: 9 })
        .toBuffer()
    }

    await writeFile(join(assetsDir, `${mood.name}.png`), output)
    console.log(`[assets] wrote assets/${mood.name}.png`)
  }

}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
