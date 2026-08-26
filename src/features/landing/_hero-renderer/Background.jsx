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
export function animProps(bg) {
  const a = bg && bg.animation
  if (!a || ANIM_TYPES.indexOf(a.type) === -1) return null

  const k = typeof a.intensity === 'number' ? clamp01(a.intensity) : 0.5
  const style = {}
  if (typeof a.durationMs === 'number' && a.durationMs > 0) style['--kt-bg-dur'] = `${a.durationMs}ms`

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

export function Background({ bg }) {
  const anim = animProps(bg)
  const cls = anim ? anim.className : undefined
  const base = { position: 'absolute', inset: 0, ...(anim ? anim.style : null) }

  if (!bg || bg.type === 'none') return null
  if (bg.type === 'color') return <div className={cls} style={{ ...base, backgroundColor: bg.value }} />
  if (bg.type === 'gradient') return <div className={cls} style={{ ...base, backgroundImage: `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})` }} />
  if (bg.type === 'image')
    return <div className={cls} style={{ ...base, backgroundImage: `url(${bg.url})`, backgroundSize: bg.fit, backgroundPosition: `${bg.focalX}% ${bg.focalY}%`, backgroundRepeat: 'no-repeat' }} />
  if (bg.type === 'frames') {
    const src = bg.poster || bg.urls[0] || ''
    return src ? <div className={cls} style={{ ...base, backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} /> : null
  }
  return (
    <video className={cls} style={{ ...base, width: '100%', height: '100%', objectFit: 'cover' }} src={bg.url} poster={bg.poster} autoPlay loop muted playsInline />
  )
}
