import { useState } from 'react'
import { quitarFondo } from '../../../shared/utils/quitar-fondo'

/**
 * InnovacionIcono — la imagen de una innovación: entera (object-fit: contain), sin recortar y SIN FONDO.
 * Es la imagen de las fichas y del recuadro de InnovacionesGrilla (mockup 2026-10-21-innovaciones-imagen, C1).
 *
 * SIN FONDO (pedido de Fedev, 13-nov-2026): las imágenes se muestran sin color
 * de fondo, ni el del sitio ni el del archivo. El sitio no pinta nada detrás y
 * el fondo liso que trae cada archivo se vuelve transparente al leerlo
 * (shared/utils/quitar-fondo.js): la imagen queda apoyada directamente sobre la
 * tarjeta. No se toca ningún archivo de tiendita. Una foto (sin fondo liso) se
 * deja como está, y también un dibujo oscuro sobre fondo claro: sin su fondo no
 * se vería sobre la tarjeta oscura.
 *
 * Leer los píxeles necesita CORS: archivos.soytiendita.store lo da para el
 * dominio de kolortec, no para localhost. Si no se puede (CORS, red, imagen
 * rota), queda el respaldo: la imagen tal cual llega, con `contain`, CON el
 * fondo que traiga el archivo.
 *
 * Hasta el 14-nov-2026 había además una variante redonda, recortada al dibujo y centrada, para la lista de hasta
 * 4 innovaciones. Esa lista ya no existe (todas van en grilla) y la variante se quitó con ella.
 */

const MAX_LECTURA = 320

// src -> { url } (la copia procesada; url null = no había nada que quitar) | { plano: true } (no se pudo leer).
// Con tope (sekh SEC-002): guarda imágenes de hasta 320px y sin límite crecía con cada innovación vista en la sesión.
const CACHE_MAX = 120
const cache = new Map()
function recordar(k, res) {
  cache.delete(k)
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value) // se va la más vieja
  cache.set(k, res)
}

/** La imagen en un canvas (a lo sumo MAX_LECTURA de lado) con sus píxeles ya sin fondo liso, si lo tenía. */
function leerSinFondo(img) {
  const nw = img.naturalWidth
  const nh = img.naturalHeight
  if (!nw || !nh) return null
  // Se lee a lo sumo MAX_LECTURA px de lado: una foto de 6000×4000 tardaba ~300 ms
  // en el hilo principal y pasa el tope de canvas de iOS (joan REG-004). Para un
  // ícono que se muestra a 84px como mucho (el recuadro) sobra.
  const reduce = Math.min(1, MAX_LECTURA / Math.max(nw, nh))
  const w = Math.max(1, Math.round(nw * reduce))
  const h = Math.max(1, Math.round(nh * reduce))
  const lienzo = document.createElement('canvas')
  lienzo.width = w
  lienzo.height = h
  const ctx = lienzo.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  const datos = ctx.getImageData(0, 0, w, h) // tira SecurityError sin CORS
  const estado = quitarFondo(datos.data, w, h)
  if (estado === 'quitado') ctx.putImageData(datos, 0, 0)
  return { lienzo, estado }
}

/** La misma imagen, entera y sin recortar, con el fondo liso transparente. null = no tenía (se usa tal cual). */
function soloSinFondo(img) {
  const leida = leerSinFondo(img)
  return leida && leida.estado === 'quitado' ? leida.lienzo.toDataURL('image/png') : null
}

// El respaldo pinta la imagen SIN CORS y el navegador la guarda en caché; el
// CDN sólo manda ACAO (y Vary: Origin) si el pedido trae Origin, así que el
// pedido CORS a la MISMA url se servía de esa caché sin ACAO y fallaba siempre
// (joan REG-001). Con un parámetro propio es otra entrada de caché, que sólo se
// pide con Origin. El host va en el parámetro para que kolortec.com.ar y www no
// compartan la respuesta cacheada (el ACAO nombra a uno solo).
function urlConCors(src) {
  try {
    const u = new URL(src, window.location.href)
    u.searchParams.set('cors', window.location.host)
    return u.toString()
  } catch {
    return src
  }
}

// `tamano`: clases de tamaño de la imagen.
// `onError`: la imagen no cargó (404, red); quien la usa cae a la inicial en vez de dejar un cuadrado con el ícono
// de imagen rota (joan REG-002).
//
// UNA sola descarga y sin destello (joan REG-001/004, sekh SEC-001): el <img> que se ve es el mismo que se lee.
//   1. «leyendo»: se pide con CORS (crossOrigin) y queda INVISIBLE (opacity 0, ocupando su lugar: nada se mueve).
//      Antes se pintaba primero el archivo tal cual —con su fondo— y un rato después se cambiaba por la copia
//      procesada, que además se bajaba aparte: se veía el cuadrado blanco o negro aparecer y desaparecer.
//   2. Al cargar se procesa ahí mismo y se muestra el resultado. Si no había nada que quitar, se muestra ese mismo
//      archivo. Si el pedido con CORS falla (localhost, CDN sin la cabecera, imagen rota) se pasa al respaldo: el
//      archivo pedido sin CORS, tal cual llega; si ese también falla, `onError`.
function InnovacionIcono({ src, tamano = 'h-14 w-14', onError }) {
  // El resultado se guarda junto con SU clave (el src): si cambia la imagen, no se muestra
  // la anterior mientras se procesa la nueva.
  const k = src
  const [hecho, setHecho] = useState({ k: null, r: null })
  const r = hecho.k === k ? hecho.r : cache.get(k) // undefined = todavía leyendo
  const guardar = (res) => {
    recordar(k, res)
    setHecho({ k, r: res })
  }
  const clases = `${tamano} shrink-0 object-contain`

  if (r === undefined) {
    return (
      <img
        key={`leer:${k}`}
        src={urlConCors(src)}
        crossOrigin="anonymous"
        alt=""
        loading="lazy"
        className={`${clases} opacity-0`}
        data-icono="cuadrado"
        data-fondo="leyendo"
        onLoad={(e) => {
          try {
            guardar({ url: soloSinFondo(e.currentTarget) })
          } catch {
            guardar({ plano: true }) // no se pudieron leer los píxeles
          }
        }}
        onError={() => guardar({ plano: true })}
      />
    )
  }
  if (r.plano) {
    // Respaldo: el archivo tal cual.
    return <img key={`plano:${k}`} src={src} alt="" loading="lazy" className={clases} data-icono="cuadrado" data-fondo="original" onError={onError} />
  }
  if (r.url) {
    return <img key={`listo:${k}`} src={r.url} alt="" className={clases} data-icono="cuadrado" data-fondo="quitado" />
  }
  // Se leyó y no había fondo liso que quitar (una foto, un PNG ya transparente): el mismo archivo, ya descargado.
  return <img key={`igual:${k}`} src={urlConCors(src)} crossOrigin="anonymous" alt="" className={clases} data-icono="cuadrado" data-fondo="original" onError={onError} />
}

export default InnovacionIcono
