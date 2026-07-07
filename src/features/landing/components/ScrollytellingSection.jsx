import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

// Frame-sequence: en vez de scrubbear el <video> (que hace jank al hacer seek), pre-cargamos los
// frames como imágenes y swapeamos la que corresponde al progreso del scroll (swap cacheado = suave).
const FRAME_COUNT = 96
const frameUrl = (i) => `/assets/scrolly-frames/f${String(i).padStart(3, '0')}.jpg`
const LOGO = '/assets/Grupo-Kolortec-1024x150.jpeg'

// Mensajes SINCRONIZADOS con lo que muestra el video en cada etapa:
// (rugged bajo lluvia) → (se enciende, haz potente) → (se abre el plano) → (show en vivo con público)
const MESSAGES = [
  { eyebrow: 'Resistencia', title: 'Hecha para la ruta', subtitle: 'Cabezales profesionales que aguantan lluvia, polvo y cada gira.' },
  { eyebrow: 'Potencia', title: 'Encendé la potencia', subtitle: 'Haces intensos que atraviesan la noche.' },
  { eyebrow: 'Producción', title: 'Del truss al escenario', subtitle: 'Producciones que se ven desde la última fila.' },
  { eyebrow: 'En vivo', title: 'La luz que mueve el show', subtitle: 'KOLORTEC en cada escenario.', cta: { label: 'Ver productos', href: '/products' } },
]

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

function ScrollytellingSection() {
  const spacerRef = useRef(null)
  const layerRef = useRef(null)
  const imgRef = useRef(null)
  const hintRef = useRef(null)
  const segRefs = useRef([])
  const lastFrameRef = useRef(-1)
  const rafRef = useRef(0)
  const [active, setActive] = useState(0)

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

      const idx = Math.min(Math.floor(p * N), N - 1)
      setActive((prev) => (prev === idx ? prev : idx))
    }
    const onScroll = () => { if (!rafRef.current) rafRef.current = window.requestAnimationFrame(update) }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
    }
  }, [reduced])

  // "Inicio" saltea el scrollytelling: scrollea a la sección que sigue al spacer (Instagram).
  const skipIntro = () => {
    const next = spacerRef.current?.nextElementSibling
    if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else window.scrollTo({ top: window.innerHeight * 3.6, behavior: 'smooth' })
  }

  // Clases de reveal (solo transform/opacity). El texto va a la DERECHA (el video apunta a la
  // izquierda), así que el reveal entra desde la derecha. El stagger se hace con transition-delay.
  const revealCls = (isActive) =>
    `transition-[transform,opacity] ease-out will-change-transform ${
      isActive ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
    }`
  const revealStyle = (isActive, order) => ({
    transitionDuration: isActive ? '520ms' : '300ms',
    transitionDelay: isActive ? `${order * 80}ms` : '0ms',
  })

  const TextBlock = ({ m, isActive }) => (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-end px-6 lg:px-16 xl:pl-24 xl:pr-40">
      <div className="max-w-[40rem] text-right">
        <span
          className={`block text-[0.72rem] font-bold uppercase tracking-[0.24em] text-primary ${revealCls(isActive)}`}
          style={revealStyle(isActive, 0)}
        >
          {m.eyebrow}
        </span>
        <h2
          className={`title-font mt-3 text-[clamp(1.9rem,6vw,4.6rem)] font-black leading-[0.98] text-white drop-shadow-[0_6px_28px_rgba(0,0,0,0.6)] ${revealCls(isActive)}`}
          style={revealStyle(isActive, 1)}
        >
          {m.title}<span className="text-primary">.</span>
        </h2>
        <p
          className={`mt-4 ml-auto max-w-[42ch] text-[clamp(0.95rem,1.6vw,1.25rem)] leading-[1.55] text-[#e6e9ef] drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] ${revealCls(isActive)}`}
          style={revealStyle(isActive, 2)}
        >
          {m.subtitle}
        </p>
        {m.cta ? (
          <Link
            to={m.cta.href}
            className={`pointer-events-auto mt-8 inline-flex min-h-11 items-center bg-primary px-7 text-[0.82rem] font-black uppercase tracking-[0.1em] text-black transition hover:brightness-105 ${revealCls(isActive)}`}
            style={revealStyle(isActive, 3)}
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
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-l from-black/75 via-black/30 to-transparent" />
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
            {/* Scrims: derecha (para el texto, que va a la derecha) + vertical (top-bar / indicador) */}
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-l from-black/75 via-black/30 to-transparent" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/45" />

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
              <TextBlock key={m.title} m={m} isActive={i === active} />
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
