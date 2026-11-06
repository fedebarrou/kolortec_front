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

import { useEffect, useState } from 'react'
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

export function Background({ bg, breakpoint }) {
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
  return <VideoDeFondo bg={bg} cls={cls} base={base} breakpoint={breakpoint} />
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

function VideoDeFondo({ bg, cls, base, breakpoint }) {
  const puede = useTrasCargarLaPantalla()
  const fuente = breakpoint === 'mobile' && bg.urlMobile ? bg.urlMobile : bg.url
  return (
    <video className={cls} style={{ ...base, width: '100%', height: '100%', objectFit: 'cover' }} src={safeSrc(puede ? fuente : undefined)} poster={safeSrc(bg.poster)} preload="metadata" autoPlay loop muted playsInline />
  )
}
