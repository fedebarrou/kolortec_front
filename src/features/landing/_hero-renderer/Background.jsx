/**
 * Background — el fondo de una escena del hero (el global del diseño o el de una placa).
 *
 * `bg.animation` (opcional) le agrega movimiento. Es 100% CSS y NO depende del scroll
 * a propósito: el Encabezado ocupa el viewport y no se recorre, así que un parallax ahí
 * no tendría de dónde agarrarse. El parallax que sí existe es el de los TEXTOS del
 * scrolltelling (`settings.snap.parallax`), que es otra cosa y vive en ScrollRenderer.
 *
 * ⚠ AUSENTE DEBE QUEDAR AUSENTE: nunca completar un `animation` por defecto. El
 * round-trip del schema compara el background global con igualdad ESTRICTA
 * (check-hero-roundtrip.mjs) contra fixtures que no traen el campo, y un default
 * inventado lo rompe. Por eso todo acá es "si no vino, no hago nada".
 *
 * ⚠ COPIA SINCRONIZADA — idéntico en kolortec, el store y el `_renderer/` del admin.
 * Los keyframes viven en las 4 hojas de estilo (hero-anim.css ×2, hero-lab.css,
 * globals.css del store).
 */

import { useEffect, useRef, useState } from 'react'
import { cssAngle, cssColor, cssFit, cssPosition, cssUrl, safeSrc } from './cssSafe'

const ANIM_TYPES = ['ken-burns', 'drift', 'zoom-out', 'light-sweep']

const clamp01 = (n) => Math.max(0, Math.min(1, n))

/**
 * De `animation` a clase + custom properties CONCRETAS.
 *
 * La cuenta se hace en JS y no en el CSS a propósito: un `calc()` con `var()`
 * adentro de un `transform` es justo donde más difieren los navegadores. Acá salen
 * valores ya resueltos y el keyframe solo los consume.
 *
 * Se EXPORTA porque los fondos con scrub (ScrubFrames / ScrubVideo del
 * scrolltelling) no pasan por Background: pintan un <canvas>/<video> propio.
 * Sin esto, elegir una animacion para un fondo de frames o video no hacia nada
 * — el control estaria ahi mintiendo.
 */
// eslint-disable-next-line react-refresh/only-export-components -- helper puro que comparte ScrollRenderer; este archivo se copia byte-idéntico a la store, no se parte. Sólo afecta al Fast Refresh en dev.
export function animProps(bg) {
  const a = bg && bg.animation
  if (!a || ANIM_TYPES.indexOf(a.type) === -1) return null

  const k = typeof a.intensity === 'number' ? clamp01(a.intensity) : 0.5
  const style = {}
  // Fondo animado: 2-60 s (sekh, 23-oct-2026). Con 1 ms ken-burns y drift alternan escala o posición en cada cuadro y se ve
  // como un parpadeo; los valores por defecto (9-18 s) quedan adentro, así que lo publicado no cambia.
  if (typeof a.durationMs === 'number' && Number.isFinite(a.durationMs) && a.durationMs > 0) style['--kt-bg-dur'] = `${Math.min(60000, Math.max(2000, a.durationMs))}ms`

  if (a.type === 'ken-burns') {
    style['--kt-bg-scale'] = String(1 + 0.14 * k)
    style['--kt-bg-x'] = `${(-3.2 * k).toFixed(2)}%`
    style['--kt-bg-y'] = `${(-2.4 * k).toFixed(2)}%`
  } else if (a.type === 'drift') {
    // Un poco de escala aunque sea un paneo: sin ella el desplazamiento
    // descubriría el borde de la imagen.
    style['--kt-bg-scale'] = String(1 + 0.07 * k)
    style['--kt-bg-x'] = `${(3.6 * k).toFixed(2)}%`
  } else if (a.type === 'zoom-out') {
    style['--kt-bg-scale'] = String(1 + 0.18 * k)
  } else if (a.type === 'light-sweep') {
    style['--kt-bg-op'] = String(0.42 * k)
  }

  return { className: `kt-bg-anim kt-bg-anim--${a.type}`, style }
}

export function Background({ bg, breakpoint, trim = null }) {
  const anim = animProps(bg)
  const cls = anim ? anim.className : undefined
  const base = { position: 'absolute', inset: 0, ...(anim ? anim.style : null) }

  if (!bg || bg.type === 'none') return null
  if (bg.type === 'color') return <div className={cls} style={{ ...base, backgroundColor: cssColor(bg.value) }} />
  if (bg.type === 'gradient') return <div className={cls} style={{ ...base, backgroundImage: `linear-gradient(${cssAngle(bg.angle)}deg, ${cssColor(bg.from, 'transparent')}, ${cssColor(bg.to, 'transparent')})` }} />
  if (bg.type === 'image')
    return <div className={cls} style={{ ...base, backgroundImage: cssUrl(bg.url), backgroundSize: cssFit(bg.fit), backgroundPosition: cssPosition(bg.focalX, bg.focalY), backgroundRepeat: 'no-repeat' }} />
  if (bg.type === 'frames') {
    const src = bg.poster || bg.urls[0] || ''
    return src ? <div className={cls} style={{ ...base, backgroundImage: cssUrl(src), backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} /> : null
  }
  return <VideoDeFondo bg={bg} cls={cls} base={base} breakpoint={breakpoint} trim={trim} />
}

/**
 * Fondo de VIDEO (el que no es scrub). Tres cosas que el `<video src={bg.url}>` pelado no hacía:
 *  1. En celular usa `bg.urlMobile` si lo hay (antes se guardaba y la tienda reproducía siempre el de PC: informe 04-nov, ALTA).
 *  2. Con `urlMobile` NO pone ninguna fuente en el primer pintado: el `breakpoint` de la tienda nace 'desktop' y pasa a 'mobile' al montar, y el
 *     servidor mandaba el video de PC, que el celular empezaba a bajar (14 MB) antes de cambiar al suyo.
 *  3. La descarga espera a que la pantalla termine de cargar (`load` + un respiro): el video no compite con el texto y las fotos por el LCP.
 *     `preload="metadata"` y el `poster` cubren el hueco.
 */
/**
 * `true` recién cuando la pantalla terminó de cargar (`load` + un respiro). Hasta ahí ningún video lleva fuente: el `breakpoint` ya
 * quedó resuelto (nace 'desktop' y pasa a 'mobile' al montar) y el video no compite por el LCP. Lo usan VideoDeFondo y ScrubVideo:
 * a 390 el ScrubVideo arrancaba con el de PC y `preload="auto"` bajaba 16 MB antes de cambiar al de celular (informe 08-nov, ALTA 1).
 */
export function useTrasCargarLaPantalla() {
  const [puede, setPuede] = useState(false)
  useEffect(() => {
    let tId = 0
    let idle = 0
    const arrancar = () => {
      const ir = () => setPuede(true)
      if (typeof window.requestIdleCallback === 'function') idle = window.requestIdleCallback(ir, { timeout: 1200 })
      else tId = window.setTimeout(ir, 200)
    }
    if (document.readyState === 'complete') arrancar()
    else window.addEventListener('load', arrancar, { once: true })
    return () => {
      window.removeEventListener('load', arrancar)
      if (idle && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle)
      if (tId) window.clearTimeout(tId)
    }
  }, [])
  return puede
}

/**
 * X (pilares 04-dic): `true` cuando el video está a una pantalla o menos de verse (y ya no vuelve a `false`). Hasta ahí no lleva fuente:
 * a 390 la tienda bajaba 9-16 MB de videos que estaban debajo de la primera pantalla. Mira la `<section>` que lo contiene (no el video:
 * en el scroll y en el carrusel los pasos se corren dentro de un contenedor recortado y el video puede estar «fuera» con la sección en
 * pantalla). Con una pantalla de margen, el video atado al scroll empieza a cargar antes de llegar; el de arriba de todo, enseguida.
 * Sin IntersectionObserver, `true` (como antes).
 */
export function useCercaDeVerse(ref, activo = true) {
  const [cerca, setCerca] = useState(false)
  useEffect(() => {
    if (!activo || cerca) return undefined
    const el = ref.current
    if (!el) return undefined
    if (typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function') { setCerca(true); return undefined }
    const blanco = (typeof el.closest === 'function' && el.closest('section')) || el
    const io = new window.IntersectionObserver((entradas) => {
      if (entradas.some((e) => e.isIntersecting)) { setCerca(true); io.disconnect() }
    }, { rootMargin: '100% 0px 100% 0px' })
    io.observe(blanco)
    return () => io.disconnect()
  }, [ref, activo, cerca])
  return activo && cerca
}

/**
 * El recorte del bucle («solo, en bucle», informe 25-nov defecto 1): `{ desde, hasta }` en segundos, o null si no hay recorte que respetar
 * (sin trim, sin duración o el video entero) y alcanza con el `loop` nativo. Mismo saneo que ScrubVideo: 0 ≤ start < end ≤ 1.
 */
export function rangoDelBucle(trim, duracion) {
  if (!trim || !Number.isFinite(duracion) || duracion <= 0) return null
  const s = Number(trim.start), e = Number(trim.end)
  const start = Number.isFinite(s) ? Math.min(Math.max(s, 0), 1) : 0
  const end = Number.isFinite(e) ? Math.min(Math.max(e, 0), 1) : 1
  if (end <= start || (start <= 0 && end >= 1)) return null
  return { desde: start * duracion, hasta: end * duracion }
}

/** Dónde tiene que estar el video ahora: fuera del recorte (antes del inicio o en/después del fin) vuelve al inicio; adentro, null (sigue). */
export function siguienteDelBucle(t, rango) {
  if (!rango || !Number.isFinite(t)) return null
  return t < rango.desde - 0.05 || t >= rango.hasta ? rango.desde : null
}

/** ¿Se puede saltar a `t`? Sin Range (`php -S`, un disco mal configurado) `seekable` es [0,0] y el salto al inicio del recorte no termina nunca. */
export function dejaSaltarA(seekable, t) {
  if (!seekable || !Number.isFinite(t)) return false
  for (let i = 0; i < seekable.length; i++) {
    if (seekable.start(i) <= t + 0.05 && seekable.end(i) >= t) return true
  }
  return false
}

/**
 * Informe 26-nov defecto 1: sin Range el bucle con recorte quedaba quieto en 0 s (`seeking` true para siempre). El bucle nunca puede quedar
 * quieto: si no se puede saltar al inicio del recorte (o un salto ya se trabó), se reproduce del cuadro 0 hasta el fin del recorte y vuelve al 0,
 * que siempre se puede. Con Range, el recorte entero como siempre.
 */
export function rangoQueSePuede(rango, seekable, trabado = false) {
  if (!rango) return null
  if (!trabado && (rango.desde <= 0.05 || dejaSaltarA(seekable, rango.desde))) return rango
  return { desde: 0, hasta: rango.hasta }
}

/** Cuánto puede tardar un salto antes de darlo por trabado: ahí se recarga el video (vuelve al cuadro 0 y sigue) y ya no se salta al inicio. */
export const SALTO_TRABADO_MS = 1000

function VideoDeFondo({ bg, cls, base, breakpoint, trim }) {
  const ref = useRef(null)
  // X (pilares 04-dic): el bucle debajo de la primera pantalla no baja nada hasta estar a una pantalla de verse.
  const cerca = useCercaDeVerse(ref)
  const puede = useTrasCargarLaPantalla() && cerca
  const fuente = breakpoint === 'mobile' && bg.urlMobile ? bg.urlMobile : bg.url
  const ts = trim?.start, te = trim?.end
  useEffect(() => {
    const v = ref.current
    if (!v || !puede) return undefined
    let cb = 0, vivo = true, trabado = false, saltoEn = 0, vigia = 0
    const rango = () => rangoQueSePuede(rangoDelBucle({ start: ts, end: te }, v.duration), v.seekable, trabado)
    const revisar = () => {
      if (!vivo) return
      if (saltoEn && v.seeking && Date.now() - saltoEn >= SALTO_TRABADO_MS) {
        // El salto no terminó (servidor sin Range): se recarga, que vuelve al cuadro 0, y desde ahí el bucle va de 0 al fin del recorte.
        trabado = true; saltoEn = 0
        try { v.load?.() } catch { /* sin fuente */ }
        v.play?.()?.catch?.(() => {})
        return
      }
      if (!v.seeking) saltoEn = 0
      const r = rango()
      v.loop = !r // sin recorte, el bucle nativo; con recorte, lo cierra este control (al llegar al fin vuelve al inicio)
      const ir = saltoEn ? null : siguienteDelBucle(v.currentTime, r)
      if (ir !== null) {
        try {
          v.currentTime = ir
          saltoEn = Date.now()
          // Un salto trabado no dispara timeupdate ni cuadros: el vigía vuelve a mirar pasado el plazo.
          window.clearTimeout(vigia); vigia = window.setTimeout(revisar, SALTO_TRABADO_MS + 50)
        } catch { /* sin metadatos todavía */ }
      }
      if (r && v.ended) v.play?.()?.catch?.(() => {})
    }
    // Más fino que timeupdate (~4 por segundo): cada cuadro, donde el navegador lo ofrece; si no, timeupdate alcanza.
    const porCuadro = () => { if (!vivo) return; revisar(); cb = v.requestVideoFrameCallback(porCuadro) }
    if (typeof v.requestVideoFrameCallback === 'function') cb = v.requestVideoFrameCallback(porCuadro)
    v.addEventListener('loadedmetadata', revisar)
    v.addEventListener('timeupdate', revisar)
    v.addEventListener('ended', revisar)
    revisar()
    return () => {
      vivo = false
      window.clearTimeout(vigia)
      if (cb && typeof v.cancelVideoFrameCallback === 'function') v.cancelVideoFrameCallback(cb)
      v.removeEventListener('loadedmetadata', revisar)
      v.removeEventListener('timeupdate', revisar)
      v.removeEventListener('ended', revisar)
    }
  }, [puede, fuente, ts, te])
  return (
    <video ref={ref} className={cls} style={{ ...base, width: '100%', height: '100%', objectFit: 'cover' }} src={safeSrc(puede ? fuente : undefined)} poster={safeSrc(bg.poster)} preload="metadata" autoPlay loop muted playsInline />
  )
}
