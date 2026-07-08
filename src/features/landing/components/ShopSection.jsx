import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function ShopSection({ shop }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.shop.title', shop.title)
  const sectionSubtitle = t('landing.shop.subtitle', shop.subtitle)
  const sectionEyebrow = t('landing.shop.eyebrow', 'Warranty Program')
  const ctas = shop.ctas ?? []

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const sectionRef = useRef(null)
  const [introPhase, setIntroPhase] = useState(prefersReducedMotion ? 'done' : 'priming')

  // Biblioteca de guías = data-driven desde blogs de tiendita (tipo=guia), PRECARGADas con el
  // contenido de la landing (useLandingContent) → aparecen al instante con la sección amarilla, sin
  // un fetch propio que las demore. Si no hay, la columna derecha no se muestra.
  const guides = Array.isArray(shop?.guides) ? shop.guides : []
  const hasGuides = guides.length > 0
  // Showcase: una guía destacada a la vez; "Siguiente" cicla y cada botón salta a una guía.
  const [activeGuide, setActiveGuide] = useState(0)
  const activeIdx = hasGuides ? Math.min(activeGuide, guides.length - 1) : 0
  const active = hasGuides ? guides[activeIdx] : null

  // Animacion de entrada (cortina + barrido + flash). Se dispara al entrar la
  // seccion al viewport; el resto del contenido se revela junto.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return undefined
    if (prefersReducedMotion) return undefined

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIntroPhase('playing')
            window.setTimeout(() => setIntroPhase('done'), 1500)
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px 12% 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [prefersReducedMotion])

  const phaseClass =
    introPhase === 'playing' ? 'is-playing' : introPhase === 'done' ? 'is-done' : 'is-priming'

  const renderAccess = (cta) => {
    const isExternal = /^https?:\/\//.test(cta.href)
    const hashMatch = cta.href.match(/^\/?#([\w-]+)$/) || cta.href.match(/^\/#([\w-]+)$/)
    const targetId = hashMatch ? hashMatch[1] : null
    const isInternal = cta.href.startsWith('/') && !targetId

    const className =
      'group/access flex items-center justify-between gap-4 border-b border-[rgba(11,11,11,0.18)] py-4 text-left transition last:border-b-0 hover:pl-1'
    const inner = (
      <>
        <span className="flex items-center gap-3">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-[#0b0b0b] text-primary transition group-hover/access:scale-105">
            <span className="material-symbols-outlined text-[20px] leading-none" aria-hidden="true">
              {cta.icon || 'arrow_forward'}
            </span>
          </span>
          <span className="flex flex-col">
            <strong className="text-[0.95rem] font-extrabold uppercase tracking-[0.06em] text-[#0b0b0b]">
              {cta.label}
            </strong>
            {cta.description ? (
              <span className="text-[0.8rem] text-[rgba(11,11,11,0.62)]">{cta.description}</span>
            ) : null}
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5 flex-none stroke-[#0b0b0b] fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4] transition-transform group-hover/access:translate-x-1"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </>
    )

    if (targetId) {
      return (
        <Link
          key={cta.label}
          to={cta.href}
          className={className}
          onClick={(event) => {
            const node = document.getElementById(targetId)
            if (node) {
              event.preventDefault()
              node.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }}
        >
          {inner}
        </Link>
      )
    }
    if (isInternal) {
      return (
        <Link key={cta.label} to={cta.href} className={className}>
          {inner}
        </Link>
      )
    }
    return (
      <a
        key={cta.label}
        href={cta.href}
        className={className}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noreferrer' : undefined}
      >
        {inner}
      </a>
    )
  }

  const renderGuideCard = (guide, hidden = false) => (
    <Link
      to={`/soporte/guias/${guide.slug}`}
      tabIndex={hidden ? -1 : undefined}
      className="group/guide flex w-full items-center gap-4 rounded-2xl border border-[rgba(11,11,11,0.2)] bg-[rgba(11,11,11,0.05)] p-2.5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-[#0b0b0b] hover:bg-[#0b0b0b] hover:shadow-[0_16px_34px_rgba(0,0,0,0.32)]"
    >
      {guide.image ? (
        <img src={guide.image} alt="" loading="lazy" aria-hidden="true" className="h-[68px] w-[68px] flex-none rounded-xl object-cover" />
      ) : (
        <span className="grid h-[68px] w-[68px] flex-none place-items-center rounded-xl bg-[#0b0b0b]">
          <img src="/favicon.svg" alt="" aria-hidden="true" className="h-8 w-8" />
        </span>
      )}
      <span className="flex min-w-0 flex-col gap-0.5">
        {guide.excerpt ? (
          <span className="line-clamp-1 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[rgba(11,11,11,0.6)] transition group-hover/guide:text-primary">
            {guide.excerpt}
          </span>
        ) : null}
        <span className="title-font truncate text-[1.1rem] leading-tight text-[#0b0b0b] transition group-hover/guide:text-white">
          {guide.title}
        </span>
      </span>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="ml-auto h-5 w-5 flex-none stroke-[#0b0b0b] fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4] transition group-hover/guide:translate-x-1 group-hover/guide:stroke-primary"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </Link>
  )

  return (
    <section
      id="shop"
      ref={sectionRef}
      className={`kt-shop-section ${phaseClass} relative isolate flex min-h-[600px] items-center overflow-hidden bg-primary py-[clamp(72px,10vw,128px)] text-[#0b0b0b]`}
    >
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <video
          className="h-full w-full object-cover"
          src="/assets/shop-section-video.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div className="absolute inset-0 bg-[rgba(244,223,51,0.74)]" />
      </div>

      {introPhase !== 'done' ? (
        <>
          <div className={`kt-shop-curtain ${introPhase === 'playing' ? 'is-playing' : ''}`} aria-hidden="true" />
          <div
            aria-hidden="true"
            className={`kt-shop-logo-sweep ${introPhase === 'playing' ? 'is-playing' : ''}`}
          />
          <div className={`kt-shop-flash ${introPhase === 'playing' ? 'is-playing' : ''}`} aria-hidden="true" />
        </>
      ) : null}

      <div className={`kt-shop-content relative z-10 grid w-full items-center gap-10 px-6 lg:gap-16 lg:pl-40 lg:pr-48 ${hasGuides ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)]' : ''}`}>
        <div className="kt-shop-from-left flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="block h-[2px] w-8 bg-[#0b0b0b]" />
            <span className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-[#0b0b0b]">
              {sectionEyebrow}
            </span>
          </div>

          <h2 className="title-font m-0 whitespace-pre-line text-left text-[clamp(2.4rem,7vw,5.4rem)] leading-[0.88]">
            {sectionTitle}
            <span className="text-[#0b0b0b]">.</span>
          </h2>

          <p className="max-w-[52ch] text-[1.05rem] leading-[1.55] text-[rgba(11,11,11,0.78)]">
            {sectionSubtitle}
          </p>

          {ctas.length > 0 ? (
            <nav className="mt-2 border-t border-[rgba(11,11,11,0.18)]" aria-label={sectionEyebrow}>
              {ctas.map(renderAccess)}
            </nav>
          ) : null}
        </div>

        {hasGuides && active ? (
        <div className="kt-shop-from-right flex flex-col gap-3">
          {/* Guía destacada (la portada / video llena el panel) */}
          <div className="relative h-[clamp(220px,26vw,300px)] overflow-hidden rounded-2xl border border-[rgba(11,11,11,0.28)] bg-[#0b0b0b]">
            <Link to={`/soporte/guias/${active.slug}`} className="group absolute inset-0 block">
              {active.image ? (
                <img
                  src={active.image}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="absolute inset-0"
                  style={{ backgroundImage: 'radial-gradient(120% 80% at 25% 15%, rgba(244,223,51,0.18), transparent 55%), linear-gradient(160deg,#1b1b20,#0c0c0e)' }}
                />
              )}
              {active.video ? (
                <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-primary text-[#0b0b0b] shadow-[0_10px_28px_rgba(0,0,0,0.45)]">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M8 5v14l11-7z" /></svg>
                  </span>
                </span>
              ) : null}
              <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[0.56rem] font-black uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                {active.video ? 'Video' : 'Guía'}
              </span>
              <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-10">
                {active.excerpt ? (
                  <span className="line-clamp-1 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-primary">{active.excerpt}</span>
                ) : null}
                <span className="title-font text-[clamp(1.05rem,2vw,1.4rem)] leading-tight text-white">{active.title}</span>
              </span>
            </Link>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveGuide((prev) => (prev + 1) % guides.length)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#0b0b0b] px-4 text-[0.72rem] font-black uppercase tracking-[0.08em] text-primary transition hover:brightness-110"
            >
              Siguiente
              <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4]"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
            <span className="text-[0.72rem] font-bold text-[rgba(11,11,11,0.6)]">{activeIdx + 1} / {guides.length}</span>
          </div>

          {/* Cada botón = una guía */}
          <div className="flex flex-wrap gap-2">
            {guides.map((guide, i) => (
              <button
                key={guide.slug}
                type="button"
                onClick={() => setActiveGuide(i)}
                aria-current={i === activeIdx ? 'true' : undefined}
                className={`max-w-[15rem] truncate rounded-lg border px-3 py-2 text-left text-[0.72rem] font-bold transition ${
                  i === activeIdx
                    ? 'border-[#0b0b0b] bg-[#0b0b0b] text-primary'
                    : 'border-[rgba(11,11,11,0.3)] bg-[rgba(11,11,11,0.05)] text-[#0b0b0b] hover:border-[#0b0b0b]'
                }`}
              >
                {guide.title}
              </button>
            ))}
          </div>
        </div>
        ) : null}
      </div>
    </section>
  )
}

export default ShopSection
