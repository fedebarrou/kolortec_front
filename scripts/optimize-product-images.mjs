import { readdir, stat, unlink } from 'node:fs/promises'
import { resolve, join, parse } from 'node:path'
import sharp from 'sharp'

const ROOT = resolve(process.cwd(), 'public/assets/products')
const MAX_WIDTH = 1600
const QUALITY = 85

const formatBytes = (bytes) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const entries = await readdir(ROOT)
const pngs = entries.filter((name) => name.toLowerCase().endsWith('.png'))

if (pngs.length === 0) {
  console.log('No PNG files to process.')
  process.exit(0)
}

let totalBefore = 0
let totalAfter = 0
const rows = []

for (const name of pngs) {
  const srcPath = join(ROOT, name)
  const { name: base } = parse(name)
  const outPath = join(ROOT, `${base}.webp`)

  const beforeStat = await stat(srcPath)
  totalBefore += beforeStat.size

  const image = sharp(srcPath, { failOn: 'none' })
  const meta = await image.metadata()
  const pipeline = meta.width && meta.width > MAX_WIDTH
    ? image.resize({ width: MAX_WIDTH, withoutEnlargement: true })
    : image

  await pipeline.webp({ quality: QUALITY, effort: 6 }).toFile(outPath)

  const afterStat = await stat(outPath)
  totalAfter += afterStat.size

  await unlink(srcPath)

  rows.push({
    name: `${base}.png → ${base}.webp`,
    before: beforeStat.size,
    after: afterStat.size,
    saved: ((1 - afterStat.size / beforeStat.size) * 100).toFixed(1),
    width: meta.width,
  })
}

const padName = Math.max(...rows.map((r) => r.name.length))
for (const r of rows) {
  console.log(
    `${r.name.padEnd(padName)}  ${String(r.width).padStart(5)}px  ${formatBytes(r.before).padStart(10)} → ${formatBytes(r.after).padStart(9)}  (-${r.saved}%)`,
  )
}

console.log('─'.repeat(padName + 50))
console.log(
  `Total: ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)}  (-${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`,
)
