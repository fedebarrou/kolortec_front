import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const SRC = resolve('GOLDENLINE')
const OUT = resolve('public/assets/golden-line')

const map = [
  ['hf_20260329_214700_d5f5d517-da22-44a0-8ee1-0b91983e3783.png', 'blinder-74.webp'],
  ['hf_20260329_215026_e776b7bd-8b03-4689-8037-726bb564dba7.png', 'linepar.webp'],
  ['hf_20260329_215254_e4ce9799-3985-43bd-bf1f-0391235e5dfa.png', 'golden-bar.webp'],
  ['hf_20260329_215721_26b4df7f-fed5-490b-9007-2a23316886bf.png', 'moonpar.webp'],
  ['hf_20260329_215802_d8254cdf-02c3-4cca-bee7-b950b39e7deb.png', 'starpar.webp'],
]

await mkdir(OUT, { recursive: true })

for (const [input, output] of map) {
  const inPath = resolve(SRC, input)
  const outPath = resolve(OUT, output)
  const info = await sharp(inPath)
    .resize({ width: 1800, withoutEnlargement: true })
    .webp({ quality: 78, effort: 5 })
    .toFile(outPath)
  console.log(`${output}: ${(info.size / 1024).toFixed(1)} KB (${info.width}x${info.height})`)
}
