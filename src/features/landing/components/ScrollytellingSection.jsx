import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

// Frame-sequence: en vez de scrubbear el <video> (que hace jank al hacer seek), pre-cargamos los
// frames como imágenes y swapeamos la que corresponde al progreso del scroll (swap cacheado = suave).
const FRAME_COUNT = 96
const frameUrl = (i) => `/assets/scrolly-frames/f${String(i).padStart(3, '0')}.jpg`

// Mensajes SINCRONIZADOS con lo que muestra el video en cada etapa:
// (rugged bajo lluvia) → (se enciende, haz potente) → (se abre el plano) → (show en vivo con público)
const MESSAGES = [
  { title: 'Hecha para la ruta', subtitle: 'Cabezales profesionales que aguantan lluvia, polvo y cada gira.' },
  { title: 'Encendé la potencia', subtitle: 'Haces intensos que atraviesan la noche.' },
  { title: 'Del truss al escenario', subtitle: 'Producciones que se ven desde la última fila.' },
  { title: 'La luz que mueve el show', subtitle: 'KOLORTEC en cada escenario.', cta: { label: 'Ver productos', href: '/products' } },
]

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

function ScrollytellingSection() {
  const spacerRef = useRef(null)
  const layerRef = useRef(null)
  const imgRef = useRef(null)
  const barRef = useRef(null)
  const hintRef = useRef(null)
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

  // Scroll → progreso → frame + mensaje + visibilidad del layer fixed.
  useEffect(() => {
    if (reduced) return undefined
    const update = () => {
      rafRef.current = 0
      const spacer = spacerRef.current
      const layer = layerRef.current
      if (!spacer || !layer) return
      const r = spacer.getBoundingClientRect()
      const vh = window.innerHeight
      const total = r.height - vh
      const p = total > 0 ? clamp(-r.top / total, 0, 1) : 0

      // Visible mientras el spacer ocupa el viewport (tolerante al offset del header sticky).
      const inRange = r.bottom > vh * 0.15 && r.top < vh
      layer.style.opacity = inRange ? '1' : '0'
      layer.style.pointerEvents = inRange ? 'auto' : 'none'

      const fi = clamp(Math.round(p * (FRAME_COUNT - 1)), 0, FRAME_COUNT - 1)
      if (fi !== lastFrameRef.current && imgRef.current) {
        imgRef.current.src = frameUrl(fi)
        lastFrameRef.current = fi
      }
      if (barRef.current) barRef.current.style.width = `${(p * 100).toFixed(2)}%`
      if (hintRef.current) hintRef.current.style.opacity = p > 0.03 ? '0' : '1'

      const idx = Math.min(Math.floor(p * MESSAGES.length), MESSAGES.length - 1)
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

  // Reduced-motion: sección simple full-screen (primer frame + primer mensaje), sin scrub.
  if (reduced) {
    return (
      <section className="relative h-[100dvh] w-full overflow-hidden bg-deep-black">
        <img src={frameUrl(0)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <div className="max-w-[26ch]">
            <h2 className="title-font text-[clamp(2.6rem,7.5vw,6rem)] leading-[0.9] text-white">
              {MESSAGES[0].title}<span className="text-primary">.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-[44ch] text-[clamp(1rem,1.9vw,1.4rem)] text-[#e6e9ef]">{MESSAGES[0].subtitle}</p>
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
            style={{ willChange: 'opacity' }}
            aria-label="Kolortec — iluminación profesional"
          >
            <img ref={imgRef} src={frameUrl(0)} alt="" draggable="false" className="absolute inset-0 h-full w-full object-cover" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/70" />

            <div className="absolute inset-0 flex items-center justify-center px-6">
              {MESSAGES.map((m, i) => (
                <div
                  key={m.title}
                  className={`absolute max-w-[26ch] text-center transition-all duration-[800ms] ease-out ${
                    i === active ? 'translate-y-0 opacity-100 blur-none' : 'pointer-events-none translate-y-8 opacity-0 blur-[3px]'
                  }`}
                >
                  <h2 className="title-font text-[clamp(2.6rem,7.5vw,6rem)] leading-[0.9] text-white drop-shadow-[0_6px_30px_rgba(0,0,0,0.6)]">
                    {m.title}<span className="text-primary">.</span>
                  </h2>
                  {m.subtitle ? (
                    <p className="mx-auto mt-4 max-w-[44ch] text-[clamp(1rem,1.9vw,1.4rem)] leading-[1.5] text-[#e6e9ef] drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
                      {m.subtitle}
                    </p>
                  ) : null}
                  {m.cta ? (
                    <Link
                      to={m.cta.href}
                      className="pointer-events-auto mt-8 inline-flex items-center bg-primary px-7 py-3.5 text-[0.82rem] font-black uppercase tracking-[0.1em] text-black transition hover:brightness-105"
                    >
                      {m.cta.label}
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>

            <div ref={barRef} className="absolute bottom-0 left-0 h-[3px] w-0 bg-primary" aria-hidden="true" />
            <div
              ref={hintRef}
              className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-white/70 transition-opacity duration-500"
              aria-hidden="true"
            >
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.22em]">Scrolleá</span>
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
