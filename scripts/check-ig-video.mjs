/**
 * check-ig-video.mjs — los reels de Instagram se reproducen y la galería del pie es 4:5.
 *
 *  1) UNIDAD  — src/shared/utils/igMedia.js: un VIDEO con media_url conserva el .mp4; uno SIN media_url
 *               (Instagram no lo manda en reels con derechos de autor) NO se muestra y reaparece si vuelve; la tapa de un
 *               video nunca es el .mp4; una foto no tiene video.
 *  2) FUENTES — el carrusel y el lightbox usan <video>, contentService pasa `items`, y la galería del
 *               pie usa la clase 4:5 con el ancho de siempre.
 *  3) MUTACIÓN — se rompe una COPIA del helper (descarta el .mp4, que era el bug) y el caso tiene que
 *               ponerse rojo.
 *
 *   node scripts/check-ig-video.mjs
 */
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as real from '../src/shared/utils/igMedia.js'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const leer = (rel) => readFileSync(resolve(raiz, rel), 'utf8')

const FEED = [
  { media_type: 'VIDEO', media_url: 'https://cdn/a.mp4', thumbnail_url: 'https://cdn/a.jpg', preview_url: 'https://cdn/a.jpg', permalink: 'https://ig/a' },
  { media_type: 'VIDEO', media_url: null, thumbnail_url: 'https://cdn/b.jpg', preview_url: 'https://cdn/b.jpg', permalink: 'https://ig/b' },
  { media_type: 'IMAGE', media_url: 'https://cdn/c.jpg', thumbnail_url: null, preview_url: 'https://cdn/c.jpg', permalink: 'https://ig/c' },
  // Video SIN tapa tal como lo manda tiendita: preview_url = thumbnail_url ?: media_url → el .mp4.
  { media_type: 'VIDEO', media_url: 'https://cdn/d.mp4', thumbnail_url: null, preview_url: 'https://cdn/d.mp4', permalink: 'https://ig/d' },
  { media_type: 'CAROUSEL_ALBUM', media_url: 'https://cdn/e.jpg', permalink: 'https://ig/e' },
  null,
]

function unidad(mod) {
  const items = mod.mapIgItems(FEED)
  assert.equal(items.length, 3, 'el reel sin .mp4, el video sin tapa y el null se descartan')
  assert.deepEqual(items[0], { src: 'https://cdn/a.jpg', video: 'https://cdn/a.mp4', permalink: 'https://ig/a' }, 'reel con .mp4')
  assert.ok(!items.some((i) => i.permalink === 'https://ig/b'), 'reel sin media_url (derechos de autor) no se muestra')
  assert.equal(items[1].video, null, 'una foto no tiene video')
  assert.equal(items[2].src, 'https://cdn/e.jpg', 'álbum: usa media_url como foto')
  // Sin lista negra: el mismo reel, cuando Instagram vuelve a mandar el .mp4, reaparece.
  const resuelto = mod.mapIgItems([{ ...FEED[1], media_url: 'https://cdn/b.mp4' }])
  assert.deepEqual(resuelto, [{ src: 'https://cdn/b.jpg', video: 'https://cdn/b.mp4', permalink: 'https://ig/b' }], 'resuelto en Instagram → reaparece')
  assert.ok(items.every((i) => !/\.mp4$/.test(i.src)), 'la tapa nunca es el .mp4')
  assert.deepEqual(mod.mapIgItems(undefined), [])
  assert.deepEqual(mod.aItemDeGaleria('https://cdn/x.jpg'), { src: 'https://cdn/x.jpg', video: null })
  assert.equal(mod.aItemDeGaleria({ src: 'x', video: 'v' }).video, 'v')
  assert.equal(mod.aItemDeGaleria(null), null)
}

function fuentes() {
  const tira = leer('src/features/landing/components/InstagramSection.jsx')
  assert.match(tira, /<video[\s\S]*?src=\{item\.video\}[\s\S]*?muted/, 'el carrusel reproduce el reel sin sonido')
  assert.match(tira, /onMouseEnter=\{prender\}/, 'se reproduce al apoyar el mouse')
  assert.match(tira, /images=\{items\}/, 'el lightbox recibe los items con video')
  assert.match(leer('src/shared/components/ImageLightbox.jsx'), /actual\.video && !videosRotos\.has\(actual\.video\) \?[\s\S]*?<video[\s\S]*?controls[\s\S]*?onError/, 'el lightbox tiene reproductor con controles y vuelve a la tapa si el .mp4 falla')
  assert.match(leer('src/shared/services/contentService.js'), /items = mapIgItems\(igData\.data\)/, 'contentService conserva el .mp4')

  const css = leer('src/index.css').replace(/\r\n/g, '\n')
  const regla = /\.kt-marquee-item-footer \{\n([^}]*)\}/.exec(css)
  assert.ok(regla, 'existe .kt-marquee-item-footer')
  assert.match(regla[1], /aspect-ratio: 4 \/ 5;/, 'la galería del pie es 4:5')
  assert.match(regla[1], /width: clamp\(210px, 19vw, 340px\);/, 'conserva el ancho que tenía')
  assert.match(leer('src/features/landing/components/FooterSection.jsx'), /kt-marquee-item-footer/, 'el pie usa la clase 4:5')
  assert.doesNotMatch(css, /kt-marquee-item-square/, 'no queda la clase 1:1')
}

async function mutacion() {
  const dir = mkdtempSync(join(tmpdir(), 'kt-ig-'))
  try {
    const fuente = leer('src/shared/utils/igMedia.js')
    const rota = fuente.replace("esVideo && item.media_url ? item.media_url : null", 'null')
    assert.notEqual(rota, fuente, 'la mutación tiene que aplicar')
    const archivo = join(dir, 'igMedia.mjs')
    writeFileSync(archivo, rota)
    const mod = await import(pathToFileURL(archivo).href)
    assert.throws(() => unidad(mod), 'descartar el .mp4 (el bug original) tiene que poner rojo el check')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

unidad(real)
console.log('✔ unidad: mapIgItems / aItemDeGaleria')
fuentes()
console.log('✔ fuentes: carrusel, lightbox, contentService, pie 4:5')
await mutacion()
console.log('✔ mutación: sin el .mp4 el check se pone rojo')
