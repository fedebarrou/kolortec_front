import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const PDF = resolve('GOLDENLINE/LISTA - 146.pdf')

try {
  const mod = await import('pdf-parse')
  const PDFParse = mod.PDFParse || mod.default?.PDFParse || mod.default
  const buf = await readFile(PDF)
  const parser = new PDFParse({ data: buf })
  const data = await parser.getText()
  const text = data.text || data.pages?.map((p) => p.text).join('\n') || ''
  console.log('--- PDF TEXT (first 4000 chars) ---')
  console.log(text.slice(0, 4000))
  console.log('--- END ---')
  console.log('NumPages:', data.numpages)
  if (data.info) console.log('Info:', JSON.stringify(data.info, null, 2))
  // Search for likely typeface mentions
  const fontHits = text.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\s?(?:Script|Serif|Sans|Display|Italic|Bold)?/g)
  if (fontHits) console.log('Possible font terms:', [...new Set(fontHits)].slice(0, 30))
} catch (e) {
  console.error('PDF parse failed:', e.message)
  process.exit(1)
}
