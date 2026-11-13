import { useState } from 'react'
import { quitarFondo, fondoDeEsquinas } from '../../../shared/utils/quitar-fondo'

/**
 * InnovacionIcono — la imagen de una innovación como ÍCONO: entera, centrada y
 * del mismo tamaño que las demás, suba lo que suba el cliente en tiendita.
 *
 * Por qué hace falta: los archivos llegan con cualquier encuadre (hoy 160×90 con
 * el dibujo tocando los bordes). En un círculo con `cover` se cortaban las
 * puntas, y cada uno se veía de un tamaño distinto según cuánto margen traía.
 *
 * Cómo: se lee la imagen en un canvas, se busca el rectángulo donde hay dibujo
 * (lo que se distingue del color de las esquinas, o lo que no es transparente),
 * se recorta ese margen y se vuelve a dibujar centrado en un cuadrado, ocupando
 * la parte que entra en el círculo sin que el borde lo toque.
 *
 * SIN FONDO (pedido de Fedev, 13-nov-2026): las imágenes se muestran sin color
 * de fondo, ni el del sitio ni el del archivo. El sitio ya no pinta negro detrás
 * (antes `bg-black` en las tres variantes) y el fondo liso que trae cada archivo
 * se vuelve transparente al leerlo (shared/utils/quitar-fondo.js): la imagen
 * queda apoyada directamente sobre la tarjeta. No se toca ningún archivo de
 * tiendita. Una foto (sin fondo liso) se deja como está, y también un dibujo
 * oscuro sobre fondo claro: sin su fondo no se vería sobre la tarjeta oscura.
 *
 * Leer los píxeles necesita CORS: archivos.soytiendita.store lo da para el
 * dominio de kolortec, no para localhost. Si no se puede (CORS, red, imagen
 * rota), queda el respaldo: la imagen tal cual llega, con `contain`, sin el
 * negro del sitio pero CON el fondo que traiga el archivo.
 */

const LADO = 128 // px del cuadrado que se genera (2× el círculo de 56px, nítido en retina)
const OCUPA = 0.66 // fracción del lado que ocupa el dibujo: entra holgado en el círculo
const UMBRAL_COLOR = 60 // distancia RGB al fondo para contar un píxel como dibujo
const UMBRAL_ALFA = 24
const MAX_LECTURA = 320

// modo:src -> { url } (la copia procesada; url null = no había nada que quitar) | { plano: true } (no se pudo leer).
// Con tope (sekh SEC-002): guarda imágenes de hasta 320px y sin límite crecía con cada innovación vista en la sesión.
const CACHE_MAX = 120
const cache = new Map()
const clave = (src, cuadrado) => `${cuadrado ? 'c' : 'n'}:${src}`
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
  // ícono que se muestra a 56px (84 en el recuadro) sobra.
  const reduce = Math.min(1, MAX_LECTURA / Math.max(nw, nh))
  const w = Math.max(1, Math.round(nw * reduce))
  const h = Math.max(1, Math.round(nh * reduce))
  const lienzo = document.createElement('canvas')
  lienzo.width = w
  lienzo.height = h
  const ctx = lienzo.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  const datos = ctx.getImageData(0, 0, w, h) // tira SecurityError sin CORS
  // Fondo = el color que más se repite entre las 4 esquinas. Promediarlas daba
  // un gris inexistente cuando el dibujo tocaba una esquina (joan REG-002).
  // Se mira ANTES de quitarlo: después las esquinas ya son transparentes.
  const fondo = fondoDeEsquinas(datos.data, w, h).color
  const estado = quitarFondo(datos.data, w, h)
  if (estado === 'quitado') ctx.putImageData(datos, 0, 0)
  return { lienzo, d: datos.data, w, h, estado, fondo }
}

/** Variante `cuadrado`: la misma imagen, entera y sin recortar, con el fondo liso transparente. null = no tenía (se usa tal cual). */
function soloSinFondo(img) {
  const leida = leerSinFondo(img)
  return leida && leida.estado === 'quitado' ? leida.lienzo.toDataURL('image/png') : null
}

function normalizarIcono(img) {
  const leida = leerSinFondo(img)
  if (!leida) return null
  const { lienzo, d, w, h, estado, fondo } = leida
  // Con el fondo ya transparente (lo era o se quitó) el dibujo es lo que no es transparente. Si el fondo sigue ahí
  // (una foto, o un fondo claro con dibujo oscuro que no se quita), se distingue por color contra el de las esquinas.
  const porAlfa = estado === 'quitado' || estado === 'transparente'
  let x0 = w
  let y0 = h
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const k = (y * w + x) * 4
      const a = d[k + 3]
      let esDibujo
      if (porAlfa) {
        esDibujo = a > UMBRAL_ALFA
      } else {
        const dist = Math.abs(d[k] - fondo[0]) + Math.abs(d[k + 1] - fondo[1]) + Math.abs(d[k + 2] - fondo[2])
        esDibujo = a > UMBRAL_ALFA && dist > UMBRAL_COLOR
      }
      if (esDibujo) {
        if (x < x0) x0 = x
        if (x > x1) x1 = x
        if (y < y0) y0 = y
        if (y > y1) y1 = y
      }
    }
  }
  // Sin dibujo distinguible (imagen lisa): se usa entera.
  if (x1 < 0) {
    x0 = 0
    y0 = 0
    x1 = w - 1
    y1 = h - 1
  }
  const bw = x1 - x0 + 1
  const bh = y1 - y0 + 1
  const escala = (LADO * OCUPA) / Math.max(bw, bh)
  const dw = bw * escala
  const dh = bh * escala

  // El cuadrado de salida NO se rellena con ningún color: el fondo queda transparente.
  const out = document.createElement('canvas')
  out.width = LADO
  out.height = LADO
  const ctx = out.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(lienzo, x0, y0, bw, bh, (LADO - dw) / 2, (LADO - dh) / 2, dw, dh)
  return out.toDataURL('image/png')
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

// `tamano` / `relleno`: clases del círculo y del aire del respaldo (56px en la lista de siempre).
// `cuadrado`: la imagen entera (object-fit: contain), sin esquinas redondas ni recorte: es la imagen de la
// grilla/recuadro de InnovacionesGrilla (mockup 2026-10-21-innovaciones-imagen, C1). Sólo se le quita el fondo liso.
// `onError` (sólo con `cuadrado`): la imagen no cargó (404, red); quien la usa cae a la inicial en vez de dejar un
// cuadrado con el ícono de imagen rota (joan REG-002).
//
// UNA sola descarga y sin destello (joan REG-001/004, sekh SEC-001): el <img> que se ve es el mismo que se lee.
//   1. «leyendo»: se pide con CORS (crossOrigin) y queda INVISIBLE (opacity 0, ocupando su lugar: nada se mueve).
//      Antes se pintaba primero el archivo tal cual —con su fondo— y un rato después se cambiaba por la copia
//      procesada, que además se bajaba aparte: se veía el cuadrado blanco o negro aparecer y desaparecer.
//   2. Al cargar se procesa ahí mismo y se muestra el resultado. Si no había nada que quitar, se muestra ese mismo
//      archivo. Si el pedido con CORS falla (localhost, CDN sin la cabecera, imagen rota) se pasa al respaldo: el
//      archivo pedido sin CORS, tal cual llega; si ese también falla, `onError`.
function InnovacionIcono({ src, tamano = 'h-14 w-14', relleno = 'p-2.5', cuadrado = false, onError }) {
  // El resultado se guarda junto con SU clave (modo + src): si cambia la imagen, no se muestra
  // el ícono de la anterior mientras se procesa la nueva.
  const k = clave(src, cuadrado)
  const [hecho, setHecho] = useState({ k: null, r: null })
  const r = hecho.k === k ? hecho.r : cache.get(k) // undefined = todavía leyendo
  const guardar = (res) => {
    recordar(k, res)
    setHecho({ k, r: res })
  }
  const forma = cuadrado ? 'object-contain' : 'rounded-full object-contain'
  const icono = cuadrado ? 'cuadrado' : 'respaldo'

  if (r === undefined) {
    return (
      <img
        key={`leer:${k}`}
        src={urlConCors(src)}
        crossOrigin="anonymous"
        alt=""
        loading="lazy"
        className={`${tamano} shrink-0 opacity-0 ${forma}`}
        data-icono={icono}
        data-fondo="leyendo"
        onLoad={(e) => {
          try {
            guardar({ url: cuadrado ? soloSinFondo(e.currentTarget) : normalizarIcono(e.currentTarget) })
          } catch {
            guardar({ plano: true }) // no se pudieron leer los píxeles
          }
        }}
        onError={() => guardar({ plano: true })}
      />
    )
  }
  if (r.plano) {
    // Respaldo: el archivo tal cual. En la lista, entero y con aire (p-2.5 deja el dibujo dentro del círculo).
    return (
      <img
        key={`plano:${k}`}
        src={src}
        alt=""
        loading="lazy"
        className={`${tamano} shrink-0 ${forma}${cuadrado ? '' : ` ${relleno}`}`}
        data-icono={icono}
        data-fondo="original"
        onError={onError}
      />
    )
  }
  if (r.url) {
    return cuadrado ? (
      <img key={`listo:${k}`} src={r.url} alt="" className={`${tamano} shrink-0 object-contain`} data-icono="cuadrado" data-fondo="quitado" />
    ) : (
      <img key={`listo:${k}`} src={r.url} alt="" className={`${tamano} shrink-0 rounded-full object-cover`} data-icono="normalizado" />
    )
  }
  // Se leyó y no había fondo liso que quitar (una foto, un PNG ya transparente): el mismo archivo, ya descargado.
  return (
    <img
      key={`igual:${k}`}
      src={urlConCors(src)}
      crossOrigin="anonymous"
      alt=""
      className={`${tamano} shrink-0 ${forma}${cuadrado ? '' : ` ${relleno}`}`}
      data-icono={icono}
      data-fondo="original"
      onError={onError}
    />
  )
}

export default InnovacionIcono
