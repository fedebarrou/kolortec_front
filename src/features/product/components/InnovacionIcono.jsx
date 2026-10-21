import { useEffect, useState } from 'react'

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
 * Leer los píxeles necesita CORS: archivos.soytiendita.store lo da para el
 * dominio de kolortec, no para localhost. Si no se puede (CORS, red, imagen
 * rota), queda el respaldo: la imagen entera con `contain` y aire alrededor,
 * sin recortes, aunque sin igualar tamaños.
 */

const LADO = 128 // px del cuadrado que se genera (2× el círculo de 56px, nítido en retina)
const OCUPA = 0.66 // fracción del lado que ocupa el dibujo: entra holgado en el círculo
const UMBRAL_COLOR = 60 // distancia RGB al fondo para contar un píxel como dibujo
const UMBRAL_ALFA = 24
const MAX_LECTURA = 320

const cache = new Map() // src -> dataURL | null (null = no se pudo, usar respaldo)

// Fondo = el color que más se repite entre las 4 esquinas. Promediarlas daba
// un gris inexistente cuando el dibujo tocaba una esquina (joan REG-002).
function colorDeFondo(d, w, h) {
  const esquinas = [0, w - 1, (h - 1) * w, h * w - 1].map((i) => d.slice(i * 4, i * 4 + 4))
  const parecido = (p, q) => Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) + Math.abs(p[3] - q[3]) < 40
  let mejor = esquinas[0]
  let votos = -1
  for (const e of esquinas) {
    const n = esquinas.filter((o) => parecido(e, o)).length
    if (n > votos) {
      votos = n
      mejor = e
    }
  }
  return Array.from(mejor)
}

function normalizarIcono(img) {
  const nw = img.naturalWidth
  const nh = img.naturalHeight
  if (!nw || !nh) return null
  // Se lee a lo sumo MAX_LECTURA px de lado: una foto de 6000×4000 tardaba ~300 ms
  // en el hilo principal y pasa el tope de canvas de iOS (joan REG-004). Para un
  // ícono que se muestra a 56px sobra.
  const reduce = Math.min(1, MAX_LECTURA / Math.max(nw, nh))
  const w = Math.max(1, Math.round(nw * reduce))
  const h = Math.max(1, Math.round(nh * reduce))
  const src = document.createElement('canvas')
  src.width = w
  src.height = h
  const sctx = src.getContext('2d', { willReadFrequently: true })
  sctx.drawImage(img, 0, 0, w, h)
  const d = sctx.getImageData(0, 0, w, h).data // tira SecurityError sin CORS

  const fondo = colorDeFondo(d, w, h)
  const fondoTransparente = fondo[3] < 128
  let x0 = w
  let y0 = h
  let x1 = -1
  let y1 = -1
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const k = (y * w + x) * 4
      const a = d[k + 3]
      let esDibujo
      if (fondoTransparente) {
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

  const out = document.createElement('canvas')
  out.width = LADO
  out.height = LADO
  const ctx = out.getContext('2d')
  if (!fondoTransparente) {
    ctx.fillStyle = `rgb(${fondo[0]}, ${fondo[1]}, ${fondo[2]})`
    ctx.fillRect(0, 0, LADO, LADO)
  }
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, x0, y0, bw, bh, (LADO - dw) / 2, (LADO - dh) / 2, dw, dh)
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
// `cuadrado`: la imagen tal cual, entera (object-fit: contain) sobre negro y sin esquinas redondas, sin recorte ni
// normalización: es la imagen de la grilla/recuadro de InnovacionesGrilla (mockup 2026-10-21-innovaciones-imagen, C1).
// `onError` (sólo con `cuadrado`): la imagen no cargó (404, red); quien la usa cae a la inicial en vez de dejar un
// cuadrado negro con el ícono de imagen rota (joan REG-002).
function InnovacionIcono({ src, tamano = 'h-14 w-14', relleno = 'p-2.5', cuadrado = false, onError }) {
  // El resultado se guarda junto con SU src: si cambia la imagen, no se muestra
  // el ícono de la anterior mientras se procesa la nueva.
  const [hecho, setHecho] = useState({ src: null, url: null })
  const listo = hecho.src === src ? hecho.url : cache.get(src)

  useEffect(() => {
    if (cuadrado || cache.has(src)) return undefined
    let vivo = true
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.decoding = 'async'
    img.onload = () => {
      let url = null
      try {
        url = normalizarIcono(img)
      } catch {
        url = null // sin CORS: queda el respaldo
      }
      cache.set(src, url)
      if (vivo) setHecho({ src, url })
    }
    img.onerror = () => {
      cache.set(src, null)
      if (vivo) setHecho({ src, url: null })
    }
    img.src = urlConCors(src)
    return () => {
      vivo = false
    }
  }, [src, cuadrado])

  if (cuadrado) {
    return <img src={src} alt="" loading="lazy" className={`${tamano} shrink-0 bg-black object-contain`} data-icono="cuadrado" onError={onError} />
  }
  if (listo) {
    return <img src={listo} alt="" className={`${tamano} shrink-0 rounded-full bg-black object-cover`} data-icono="normalizado" />
  }
  // Respaldo: entera y con aire (p-2.5 deja el dibujo dentro del círculo).
  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      className={`${tamano} shrink-0 rounded-full bg-black object-contain ${relleno}`}
      data-icono="respaldo"
    />
  )
}

export default InnovacionIcono
