/**
 * igMedia.js — del feed público de Instagram (/public/instagram/feed) a lo que
 * dibuja el carrusel.
 *
 * tiendita manda por publicación `media_type`, `media_url`, `thumbnail_url` y
 * `preview_url`. En un VIDEO/REEL `media_url` es el .mp4 y `thumbnail_url` la
 * tapa. Antes el front se quedaba SÓLO con la tapa: los reels salían como fotos
 * fijas, sin forma de reproducirlos.
 *
 * Ojo: Instagram NO manda `media_url` en algunos reels (audio con derechos).
 * Esos quedan como imagen — no hay .mp4 que reproducir.
 */

/** @returns {{ src: string, video: string|null, permalink: string }[]} */
export function mapIgItems(data) {
  if (!Array.isArray(data)) return []
  return data
    .map((item) => {
      if (!item) return null
      const esVideo = String(item.media_type || '').toUpperCase() === 'VIDEO'
      const video = esVideo && item.media_url ? item.media_url : null
      // La tapa de un video NUNCA es media_url: es el .mp4 y como <img> sale rota.
      // Ojo con preview_url: tiendita lo arma como `thumbnail_url ?: media_url`, así
      // que en un video SIN tapa viene igual al .mp4. Ese video se descarta: la tira
      // (y la galería del pie) son de imágenes y no hay nada que mostrar quieto.
      const src = esVideo
        ? item.thumbnail_url || (item.preview_url !== item.media_url ? item.preview_url : '') || ''
        : item.preview_url || item.thumbnail_url || item.media_url || ''
      if (!src) return null
      return { src, video, permalink: item.permalink || '' }
    })
    .filter(Boolean)
}

/** Normaliza una entrada de galería: string (url de foto) u objeto { src, video }. */
export function aItemDeGaleria(entrada) {
  if (!entrada) return null
  if (typeof entrada === 'string') return { src: entrada, video: null }
  if (!entrada.src) return null
  return { ...entrada, video: entrada.video || null }
}
