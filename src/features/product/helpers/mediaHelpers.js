/**
 * Helpers de «En obra» (ProductMedia / MediaViewer). Viven aparte de los componentes
 * porque react-refresh exige que un archivo de componente exporte sólo componentes.
 */

/** Segundos → «m:ss». Vacío si no se conoce (el video todavía no cargó sus metadatos). */
export function formatearDuracion(seg) {
  if (!Number.isFinite(seg) || seg <= 0) return ''
  const m = Math.floor(seg / 60)
  const s = Math.floor(seg % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * La API no manda un póster del video: el primer cuadro lo da el propio archivo
 * (<video preload="metadata">). `#t=0.1` pide un cuadro que no sea el negro del frame 0.
 */
export function videoFrameSrc(url) {
  return url.includes('#') ? url : `${url}#t=0.1`
}

/** En celular se muestran 6 ítems y un «Ver los N» (la grilla lo oculta en escritorio por CSS). */
export const LIMITE_CELULAR = 6

/** «Ver los N» aparece sólo si hay MÁS de LIMITE_CELULAR visibles: con 6 justos no hay nada que ver. */
export function mostrarVerLos(n) {
  return Number.isFinite(n) && n > LIMITE_CELULAR
}

/** Ítems utilizables: los que tienen url. Lo demás (null, sin url) se descarta sin romper. */
export function itemsValidos(items) {
  return Array.isArray(items) ? items.filter((m) => m && m.url) : []
}

/** «Sin media → no se dibuja nada» (ni sección ni lengüeta): mismo criterio que ProductBlogs. */
export function hayMedia(items) {
  return itemsValidos(items).length > 0
}

/**
 * Cuenta fotos/videos y aplica el filtro Todo / Fotos / Videos.
 *  - `total` es lo utilizable (chip «Todo»); un ítem de otro tipo cuenta en el total y se ve en «Todo».
 *  - El filtro sólo existe si hay de los dos tipos (`hayDeAmbos`): con uno solo, `activo` vuelve a 'all'.
 * `fotos` y `videos` son CANTIDADES; `visibles` es la lista a dibujar.
 */
export function contarYFiltrar(items, filtro) {
  const lista = itemsValidos(items)
  const delTipo = (tipo) => lista.filter((m) => m.type === tipo)
  const fotos = delTipo('image')
  const videos = delTipo('video')
  const hayDeAmbos = fotos.length > 0 && videos.length > 0
  const activo = hayDeAmbos ? filtro : 'all'
  const visibles = activo === 'image' ? fotos : activo === 'video' ? videos : lista
  return { fotos: fotos.length, videos: videos.length, total: lista.length, hayDeAmbos, activo, visibles }
}
