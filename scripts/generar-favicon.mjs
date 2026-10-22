/**
 * generar-favicon.mjs — favicon = logo REAL (public/assets/logo_minimal.png) sobre un círculo negro.
 *
 * El asterisco amarillo (248×232, sin fondo) va centrado, ocupando ~66 % del diámetro, sobre un círculo
 * #050505 que llena el lienzo. Afuera del círculo es transparente. NO se redibuja el asterisco: se compone
 * el PNG real con un canvas dentro de puppeteer (sin dependencias nuevas).
 *
 *   node scripts/generar-favicon.mjs
 *
 * Salidas en public/: favicon.png (512), favicon-48.png, favicon-32.png, apple-touch-icon.png (180).
 */
import puppeteer from 'puppeteer'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..')
const LOGO = join(RAIZ, 'public/assets/logo_minimal.png')
const FONDO = '#050505'
const PROPORCION = 0.66 // lado mayor del logo / diámetro del círculo

const SALIDAS = [
  ['favicon.png', 512],
  ['favicon-48.png', 48],
  ['favicon-32.png', 32],
  ['apple-touch-icon.png', 180],
]

const logoB64 = readFileSync(LOGO).toString('base64')
const browser = await puppeteer.launch({ headless: true })
try {
  const page = await browser.newPage()
  await page.setContent('<!doctype html><meta charset="utf-8"><body></body>')
  const resultados = await page.evaluate(
    async (b64, salidas, fondo, prop) => {
      const img = new Image()
      img.src = `data:image/png;base64,${b64}`
      await img.decode()
      const out = {}
      for (const [nombre, size] of salidas) {
        const c = document.createElement('canvas')
        c.width = c.height = size
        const ctx = c.getContext('2d')
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.fillStyle = fondo
        ctx.beginPath()
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
        ctx.fill()
        const escala = (size * prop) / Math.max(img.naturalWidth, img.naturalHeight)
        const w = img.naturalWidth * escala
        const h = img.naturalHeight * escala
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        out[nombre] = c.toDataURL('image/png').split(',')[1]
      }
      return out
    },
    logoB64,
    SALIDAS,
    FONDO,
    PROPORCION,
  )
  for (const [nombre] of SALIDAS) {
    writeFileSync(join(RAIZ, 'public', nombre), Buffer.from(resultados[nombre], 'base64'))
    console.log('OK  public/' + nombre)
  }
} finally {
  await browser.close()
}
