import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

// Mensajes del scrollytelling (kolortec — iluminación profesional). Editables.
const MESSAGES = [
  { title: 'La luz que mueve el show', subtitle: 'Iluminación profesional para eventos y escenarios.' },
  { title: 'Cabezales · Láseres · Estrobos · Humo', subtitle: 'Todo el arsenal para tu producción.' },
  { title: 'Potencia que se ve', subtitle: 'Equipos de alto rendimiento, listos para girar.' },
  { title: 'KOLORTEC', subtitle: 'Hacé que cada escenario impacte.', cta: { label: 'Ver productos', href: '/products' } },
]

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))

function ScrollytellingSection() {
  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const barRef = useRef(null)
  const hintRef = useRef(null)
  const durationRef = useRef(0)
  const rafRef = useRef(0)
  const [active, setActive] = useState(0)

  const reduced =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  useEffect(() => {
    if (reduced) return undefined
    const video = videoRef.current
    // Prime (iOS): renderiza el primer frame y habilita el seek.
    if (video) { video.play().then(() => video.pause()).catch(() => {}) }

    const update = () => {
      rafRef.current = 0
      const sec = sectionRef.current
      if (!sec) return
      const r = sec.getBoundingClientRect()
      const total = r.height - window.innerHeight
      const p = total > 0 ? clamp(-r.top / total, 0, 1) : 0

      const v = videoRef.current
      const dur = durationRef.current
      if (v && dur > 0) {
        const target = p * dur
        if (Math.abs(v.currentTime - target) > 0.033) {
          try { v.currentTime = target } catch (e) { /* seek en curso */ }
        }
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

  const onLoadedMetadata = () => {
    const v = videoRef.current
    if (v) durationRef.current = v.duration || 0
  }

  return (
    <section
      ref={sectionRef}
      className={`relative bg-deep-black ${reduced ? 'h-[100dvh]' : 'h-[360vh]'}`}
      aria-label="Kolortec — iluminación profesional"
    >
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        <video
          ref={videoRef}
          src="/assets/scrolly.mp4"
          muted
          playsInline
          preload="auto"
          autoPlay={reduced}
          loop={reduced}
          onLoadedMetadata={onLoadedMetadata}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black/70" />

        {/* Mensajes */}
        <div className="absolute inset-0 flex items-center justify-center px-6">
          {MESSAGES.map((m, i) => {
            const isActive = reduced ? i === 0 : i === active
            return (
              <div
                key={m.title}
                className={`absolute max-w-[24ch] text-center transition-all duration-[800ms] ease-out ${
                  isActive ? 'translate-y-0 opacity-100 blur-none' : 'pointer-events-none translate-y-7 opacity-0 blur-[3px]'
                }`}
              >
                <h2 className="title-font text-[clamp(2.4rem,7vw,5.6rem)] leading-[0.92] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
                  {m.title}<span className="text-primary">.</span>
                </h2>
                {m.subtitle ? (
                  <p className="mx-auto mt-4 max-w-[42ch] text-[clamp(1rem,1.8vw,1.35rem)] leading-[1.5] text-[#dfe2e8] drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                    {m.subtitle}
                  </p>
                ) : null}
                {m.cta ? (
                  <Link
                    to={m.cta.href}
                    className="mt-8 inline-flex items-center gap-2 bg-primary px-6 py-3 text-[0.8rem] font-black uppercase tracking-[0.1em] text-black transition hover:brightness-105"
                  >
                    {m.cta.label}
                  </Link>
                ) : null}
              </div>
            )
          })}
        </div>

        {!reduced ? (
          <>
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
          </>
        ) : null}
      </div>
    </section>
  )
}

export default ScrollytellingSection
