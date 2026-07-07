import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

// Frame-sequence: en vez de scrubbear el <video> (que hace jank al hacer seek), pre-cargamos los
// frames como imágenes y swapeamos la que corresponde al progreso del scroll (swap cacheado = suave).
const FRAME_COUNT = 96
const frameUrl = (i) => `/assets/scrolly-frames/f${String(i).padStart(3, '0')}.jpg`
const LOGO = '/assets/Grupo-Kolortec-1024x150.jpeg'

// Mensajes de MARCA (pilares KOLORTEC), coherentes con lo que muestra el video en cada etapa:
// (rugged/lluvia → Calidad) · (haz potente → Presencia) · (en escena → Soporte) · (show masivo → Ready to work)
const MESSAGES = [
  { eyebrow: 'Calidad', title: 'Construidos para rendir', subtitle: 'Línea propia, testeada y fabricada para aguantar giras, clima y uso intensivo.' },
  { eyebrow: 'Presencia', title: 'Presencia en escena', subtitle: 'Óptica y potencia que definen el espacio y se imponen en cualquier escenario.' },
  { eyebrow: 'Soporte', title: 'Respaldo que no falla', subtitle: 'Soporte técnico, repuestos y mantenimiento de fábrica: tu equipo, siempre listo.' },
  { eyebrow: 'Ready to work', title: 'Listos para usar', subtitle: 'Salen de fábrica listos para trabajar — los conectás y el show arranca.', cta: { label: 'Ver productos', href: '/products' } },
]

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const smoothstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t) }
const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

function ScrollytellingSection() {
  const spacerRef = useRef(null)
  const layerRef = useRef(null)
  const imgRef = useRef(null)
  const hintRef = useRef(null)
  const segRefs = useRef([])
  const blockRefs = useRef([])
  const lastFrameRef = useRef(-1)
  const rafRef = useRef(0)

  const reduced =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  // Pre-cargar todos los frames (para que el swap sea instantáneo/suave).
  useEffect(() => {
    if (reduced) return undefined
    const imgs = []
    for (let i = 0; i < FRAME_COUNT; i++) {
      const im = new Image()
      im.src = frameUrl(i)
      imgs.push(im)
    }
    return () => { imgs.length = 0 }
  }, [reduced])

  // Scroll → progreso → frame + mensaje + indicador + visibilidad del layer fixed.
  useEffect(() => {
    if (reduced) return undefined
    const N = MESSAGES.length
    const update = () => {
      rafRef.current = 0
      const spacer = spacerRef.current
      const layer = layerRef.current
      if (!spacer || !layer) return
      const r = spacer.getBoundingClientRect()
      const vh = window.innerHeight
      const total = r.height - vh
      const p = total > 0 ? clamp(-r.top / total, 0, 1) : 0

      // Salida suave: mientras el spacer sale por abajo del viewport, el layer se desliza hacia arriba
      // (scroll-away) revelando la sección siguiente (Instagram) de forma natural, en vez de apagarse
      // de golpe. `releaseY` es 0 mientras está pinned y negativo cuando `r.bottom < vh`.
      const releaseY = Math.min(0, r.bottom - vh)
      const visible = r.bottom > 0 && r.top < vh
      layer.style.transform = `translate3d(0, ${releaseY}px, 0)`
      layer.style.opacity = visible ? '1' : '0'
      layer.style.pointerEvents = visible && releaseY > -vh * 0.5 ? 'auto' : 'none'

      const fi = clamp(Math.round(p * (FRAME_COUNT - 1)), 0, FRAME_COUNT - 1)
      if (fi !== lastFrameRef.current && imgRef.current) {
        imgRef.current.src = frameUrl(fi)
        lastFrameRef.current = fi
      }
      // Indicador por pasos: cada segmento se llena según el progreso local.
      for (let i = 0; i < N; i++) {
        const seg = segRefs.current[i]
        if (seg) seg.style.width = `${(clamp(p * N - i, 0, 1) * 100).toFixed(1)}%`
      }
      if (hintRef.current) hintRef.current.style.opacity = p > 0.03 ? '0' : '1'

      // Reveal LIGADO AL SCROLL: cada mensaje entra/mantiene/sale según su centro (crossfade limpio
      // + parallax por línea via --ty). Sin transiciones CSS ni re-render → conectado al scroll.
      for (let i = 0; i < N; i++) {
        const block = blockRefs.current[i]
        if (!block) continue
        const c = N > 1 ? i / (N - 1) : 0
        const dist = Math.abs(p - c)
        const op = 1 - smoothstep(0.06, 0.16, dist)
        block.style.opacity = op.toFixed(3)
        block.style.setProperty('--ty', `${((c - p) * 200).toFixed(1)}px`)
        block.style.setProperty('--blur', `${((1 - op) * 7).toFixed(2)}px`)
        block.style.setProperty('--rv', op.toFixed(3))
        block.style.pointerEvents = op > 0.5 ? 'auto' : 'none'
      }
    }
    const onScroll = () => { if (!rafRef.current) rafRef.current = window.requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    // Robustez: re-correr tras el paint del portal (refs/layout listos) para fijar el estado inicial.
    const initRaf = window.requestAnimationFrame(() => window.requestAnimationFrame(update))
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.cancelAnimationFrame(initRaf)
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    }
  }, [reduced])

  // "Inicio" saltea el scrollytelling: scrollea a la sección que sigue al spacer (Instagram).
  const skipIntro = () => {
    const next = spacerRef.current?.nextElementSibling
    if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else window.scrollTo({ top: window.innerHeight * 3.6, behavior: 'smooth' })
  }

  // Bloque de mensaje. El reveal (opacity + rise) lo maneja update() por scroll, seteando `opacity` y
  // la var `--ty` en el div raíz; cada línea aplica un factor distinto de --ty → parallax por capas.
  const TextBlock = ({ m, index }) => (
    <div
      ref={(el) => { blockRefs.current[index] = el }}
      className="pointer-events-none absolute inset-0 flex items-center justify-end px-6 will-change-[transform,opacity] lg:px-16 xl:pl-24 xl:pr-40"
      style={{ opacity: index === 0 ? 1 : 0 }}
    >
      <div className="max-w-[40rem] text-right will-change-[filter]" style={{ filter: 'blur(var(--blur, 0px))' }}>
        <span
          className="flex items-center justify-end gap-2.5"
          style={{ transform: 'translateY(calc(var(--ty, 0px) * 0.6))' }}
        >
          <span className="h-[2px] w-9 origin-right bg-primary" style={{ transform: 'scaleX(var(--rv, 1))' }} aria-hidden="true" />
          <span className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-primary">{m.eyebrow}</span>
        </span>
        <h2
          className="title-font mt-3 text-[clamp(1.9rem,6vw,4.6rem)] font-black leading-[0.98] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.9),0_1px_3px_rgba(0,0,0,0.85)]"
          style={{ transform: 'translateY(var(--ty, 0px))' }}
        >
          {m.title}<span className="text-primary">.</span>
        </h2>
        <p
          className="mt-4 ml-auto max-w-[42ch] text-[clamp(0.95rem,1.6vw,1.25rem)] leading-[1.55] text-[#eef0f4] [text-shadow:0_1px_12px_rgba(0,0,0,0.9)]"
          style={{ transform: 'translateY(calc(var(--ty, 0px) * 1.35))' }}
        >
          {m.subtitle}
        </p>
        {m.cta ? (
          <Link
            to={m.cta.href}
            className="mt-8 inline-flex min-h-11 items-center bg-primary px-7 text-[0.82rem] font-black uppercase tracking-[0.1em] text-black shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition hover:brightness-105"
            style={{ transform: 'translateY(calc(var(--ty, 0px) * 1.1))' }}
          >
            {m.cta.label}
          </Link>
        ) : null}
      </div>
    </div>
  )

  // Reduced-motion: sección simple full-screen (primer frame + primer mensaje), sin scrub.
  if (reduced) {
    const m = MESSAGES[0]
    return (
      <section className="relative h-[100dvh] w-full overflow-hidden bg-deep-black">
        <img src={frameUrl(0)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/45 to-transparent" />
        <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(ellipse 58% 62% at 78% 50%, rgba(0,0,0,0.6), transparent 72%)' }} />
        <div className="absolute inset-0 flex items-center justify-end px-6 lg:px-16 xl:pr-40">
          <div className="max-w-[40rem] text-right">
            <span className="block text-[0.72rem] font-bold uppercase tracking-[0.24em] text-primary">{m.eyebrow}</span>
            <h2 className="title-font mt-3 text-[clamp(1.9rem,6vw,4.6rem)] font-black leading-[0.98] text-white">
              {m.title}<span className="text-primary">.</span>
            </h2>
            <p className="mt-4 ml-auto max-w-[42ch] text-[clamp(0.95rem,1.6vw,1.25rem)] leading-[1.55] text-[#e6e9ef]">{m.subtitle}</p>
          </div>
        </div>
      </section>
    )
  }

  // Layer VISUAL portaleado a document.body → escapa el `.kt-zoom-canvas` (zoom/overflow-clip/width fijo)
  // que rompía el sticky y el full-bleed. `position: fixed` full-viewport real.
  const layer =
    typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={layerRef}
            className="pointer-events-none fixed inset-0 z-[5] opacity-0 transition-opacity duration-200"
            style={{ willChange: 'transform, opacity' }}
            aria-label="Kolortec — iluminación profesional"
          >
            <img ref={imgRef} src={frameUrl(0)} alt="" draggable="false" className="absolute inset-0 h-full w-full object-cover" />
            {/* Scrims para legibilidad: gradiente derecho (texto) + vertical (top-bar/indicador) +
                "spotlight" radial oscuro anclado detrás de la copy → el texto no se pierde en el bg. */}
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-l from-black/85 via-black/45 to-transparent" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/50" />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{ backgroundImage: 'radial-gradient(ellipse 58% 62% at 78% 50%, rgba(0,0,0,0.6), transparent 72%)' }}
            />

            {/* Mini top-bar: branding + Inicio (el navbar real queda tapado por el portal) */}
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-6 py-4 lg:px-10 xl:px-20">
              <button type="button" onClick={scrollTop} className="pointer-events-auto flex items-center transition hover:opacity-80" aria-label="Kolortec — ir al inicio">
                <img src={LOGO} alt="Kolortec" className="h-6 w-auto object-contain" />
              </button>
              <button
                type="button"
                onClick={skipIntro}
                className="pointer-events-auto inline-flex min-h-11 items-center text-[0.72rem] font-bold uppercase tracking-[0.14em] text-slate-100 transition hover:text-primary xl:text-sm"
              >
                Inicio
              </button>
            </div>

            {/* Mensajes (uno visible por vez, reveal escalonado) */}
            {MESSAGES.map((m, i) => (
              <TextBlock key={m.title} m={m} index={i} />
            ))}

            {/* Indicador de progreso por pasos */}
            <div className="pointer-events-none absolute bottom-8 right-6 flex gap-2 lg:right-16 xl:right-40" aria-hidden="true">
              {MESSAGES.map((_, i) => (
                <div key={i} className="h-[3px] w-9 overflow-hidden rounded-full bg-white/20 sm:w-14">
                  <div ref={(el) => { segRefs.current[i] = el }} className="h-full w-0 bg-primary" />
                </div>
              ))}
            </div>

            {/* Hint "Scrolleá" (se desvanece al empezar) */}
            <div
              ref={hintRef}
              className="pointer-events-none absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-white/70 transition-opacity duration-500"
              aria-hidden="true"
            >
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.22em]">Scrolleá</span>
              <svg viewBox="0 0 24 24" className="h-5 w-5 animate-bounce stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      {layer}
      {/* Spacer: crea la distancia de scroll; el visual va en el layer fixed portaleado a body. */}
      <div ref={spacerRef} className="h-[360vh] w-full bg-deep-black" aria-hidden="true" />
    </>
  )
}

export default ScrollytellingSection
