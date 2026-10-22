/**
 * check-hero-altura.mjs — H1 y H7 de la paridad del Hero Labs en Kolortec.
 *
 * H1 · el alto del hero en el CELULAR lo decide heroAltura.js (antes había un 65svh clavado en HeroSection que ignoraba el aspecto, el
 *      alto y el modo del diseño):
 *        · lo ELEGIDO por el diseño (heightMobile / aspectMobile) se ve; «Pantalla completa» elegida → el viewport entero;
 *        · sin elegir nada → PANTALLA COMPLETA (decisión de Fedev, 22-oct; ya no el 65 % ni el mobile_height_vh del marco);
 *        · escritorio / tablet: Encabezado → el alto del diseño; pantalla completa → el viewport.
 * H7 · el logo de la barra del scrolltelling es el de la cuenta; el logo fijo queda SÓLO como respaldo.
 *
 * Uso: node scripts/check-hero-altura.mjs   (exit 0 = OK)
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { alturaDelHero, eligioAltoMovil, ALTO_PANTALLA } from '../src/features/landing/heroAltura.js'

let ok = 0
const caso = (nombre, fn) => { fn(); ok += 1; console.log(`  ✔ ${nombre}`) }

const MARCO = { gutter: 24, gutter_wide: 160, wide_from: 1024, max_width: null, mobile_height_vh: 65 }
const CONTENEDOR = { fullHeight: false, heroWidth: 'contained', aspectMobile: '4/5', heightMobile: 360 }
const COMPLETA = { fullHeight: true, heroWidth: 'full' }
const SIN_ELEGIR = { mode: 'carousel', autoplay: true, arrows: true } // el diseño no eligió ni modo, ni alto, ni aspecto

caso('Decisión de Fedev (22-oct) · celular sin elegir nada: PANTALLA COMPLETA (100dvh), con o sin marco, y ya no el mobile_height_vh de la cuenta', () => {
  for (const heroFrame of [MARCO, { ...MARCO, mobile_height_vh: 80 }, undefined, null, {}]) for (const settings of [SIN_ELEGIR, {}, undefined]) {
    assert.equal(alturaDelHero({ breakpoint: 'mobile', settings, heroFrame }), ALTO_PANTALLA, JSON.stringify([settings, heroFrame]))
  }
  assert.equal(ALTO_PANTALLA, 'calc(100dvh / var(--kt-canvas-scale, 1))')
})
caso('REG-002 · lo ELEGIDO se ve en el celular aunque la cuenta declare un marco: Pantalla completa → el viewport; heightMobile / aspectMobile → el del diseño', () => {
  const marco80 = { ...MARCO, mobile_height_vh: 80 }
  assert.equal(alturaDelHero({ breakpoint: 'mobile', settings: COMPLETA, heroFrame: marco80 }), ALTO_PANTALLA)
  assert.equal(alturaDelHero({ breakpoint: 'mobile', settings: CONTENEDOR, heroFrame: marco80 }), undefined)
  assert.equal(alturaDelHero({ breakpoint: 'mobile', settings: { heightMobile: 300 }, heroFrame: marco80 }), undefined)
  assert.equal(alturaDelHero({ breakpoint: 'mobile', settings: { aspectMobile: '4 / 5' }, heroFrame: marco80 }), undefined)
  assert.equal(alturaDelHero({ breakpoint: 'mobile', settings: COMPLETA, heroFrame: null }), ALTO_PANTALLA)
  assert.equal(alturaDelHero({ breakpoint: 'mobile', settings: CONTENEDOR, heroFrame: null }), undefined)
})
caso('eligioAltoMovil: sólo las claves EXPLÍCITAS cuentan (Pantalla completa por compat, un aspecto vacío o un alto no numérico no son una elección)', () => {
  for (const s of [COMPLETA, { heightMobile: 360 }, { aspectMobile: '16 / 9' }, CONTENEDOR]) assert.equal(eligioAltoMovil(s), true, JSON.stringify(s))
  for (const s of [undefined, null, {}, SIN_ELEGIR, { fullHeight: true }, { heroWidth: 'full' }, { aspectMobile: null }, { aspectMobile: '  ' }, { heightMobile: '360' }, { heightMobile: null }]) assert.equal(eligioAltoMovil(s), false, JSON.stringify(s))
})
caso('escritorio SIN marco, Pantalla completa: el viewport entero; Encabezado: el alto del diseño', () => {
  assert.equal(alturaDelHero({ breakpoint: 'desktop', settings: COMPLETA, heroFrame: null }), ALTO_PANTALLA)
  assert.equal(alturaDelHero({ breakpoint: 'desktop', settings: CONTENEDOR, heroFrame: null }), undefined)
  assert.equal(ALTO_PANTALLA, 'calc(100dvh / var(--kt-canvas-scale, 1))')
})
caso('el mobile_height_vh de la cuenta se IGNORA (sólo el gutter hace «marco»): celular sin elegir nada = pantalla completa, con o sin ese dato', () => {
  for (const heroFrame of [{ mobile_height_vh: 65 }, { gutter: '24', mobile_height_vh: 65 }, { gutter: 24, mobile_height_vh: 20 }, { gutter: 24, mobile_height_vh: 500 }, { gutter: 24 }]) {
    assert.equal(alturaDelHero({ breakpoint: 'mobile', settings: SIN_ELEGIR, heroFrame }), ALTO_PANTALLA, JSON.stringify(heroFrame))
  }
})
caso('escritorio y tablet IGNORAN el marco: Pantalla completa → viewport, Encabezado → diseño', () => {
  for (const breakpoint of ['desktop', 'tablet']) {
    assert.equal(alturaDelHero({ breakpoint, settings: COMPLETA, heroFrame: MARCO }), ALTO_PANTALLA)
    assert.equal(alturaDelHero({ breakpoint, settings: CONTENEDOR, heroFrame: MARCO }), undefined)
  }
})
caso('settings ausentes: modo por defecto (Pantalla completa), sin romper', () => {
  assert.equal(alturaDelHero({ breakpoint: 'desktop', settings: undefined, heroFrame: null }), ALTO_PANTALLA)
})

const leer = (ruta) => readFileSync(new URL(ruta, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const sinComentarios = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '')

caso('H1: HeroSection pide el alto a alturaDelHero y no tiene un 65svh clavado en el código', () => {
  const src = sinComentarios(leer('../src/features/landing/components/HeroSection.jsx'))
  assert.match(src, /alturaDelHero\(\{[^}]*breakpoint:\s*bp[^}]*heroFrame:\s*hero\.heroFrame/)
  assert.doesNotMatch(src, /65\s*svh/)
  assert.doesNotMatch(src, /DEFAULT_SETTINGS/, 'el DEFAULT_SETTINGS muerto volvió')
})
caso('H7: el logo de la barra es el de la cuenta y el fijo sólo es respaldo (sin logo → el de siempre)', () => {
  const src = sinComentarios(leer('../src/features/landing/components/LandingPage.jsx'))
  assert.match(src, /const logoUrl = content\.site\?\.logo \|\| KOLORTEC_LOGO_RESPALDO/)
  assert.match(src, /logoUrl=\{logoUrl\}/)
  assert.doesNotMatch(src, /logoUrl=\{KOLORTEC_LOGO/)
  assert.match(src, /KOLORTEC_LOGO_RESPALDO = '\/assets\/Grupo-Kolortec-1024x150\.jpeg'/)
})

console.log(`\ncheck-hero-altura OK (${ok} casos)`)
