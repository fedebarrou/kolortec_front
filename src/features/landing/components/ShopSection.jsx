import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { maintenanceGuides } from '../../warranty/data/maintenanceGuides'
import MaintenanceDetailModal from '../../warranty/components/MaintenanceDetailModal'

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
  const [openGuide, setOpenGuide] = useState(null)
  const [openOrigin, setOpenOrigin] = useState(null)

  const openGuideDetail = (guide, event) => {
    if (event?.currentTarget) {
      const rect = event.currentTarget.getBoundingClientRect()
      setOpenOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    } else {
      setOpenOrigin(null)
    }
    setOpenGuide(guide)
  }

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

  return (
    <section
      id="shop"
      ref={sectionRef}
      className={`kt-shop-section ${phaseClass} relative isolate overflow-hidden bg-primary py-[clamp(72px,10vw,128px)] text-[#0b0b0b]`}
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

      <div className="kt-shop-content relative z-10 grid items-start gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-16 lg:px-40">
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

        <div className="kt-shop-from-right flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="block h-[2px] w-6 bg-[#0b0b0b]" />
            <span className="text-[0.7rem] font-black uppercase tracking-[0.2em] text-[#0b0b0b]">
              {t('landing.shop.guidesLabel', 'Biblioteca de guias')}
            </span>
          </div>

          <ul className="grid list-none gap-3 p-0">
            {maintenanceGuides.map((guide) => (
              <li key={guide.slug ?? guide.name}>
                <button
                  type="button"
                  onClick={(event) => openGuideDetail(guide, event)}
                  className="group/guide flex w-full items-center gap-4 rounded-2xl border border-[rgba(11,11,11,0.2)] bg-[rgba(11,11,11,0.05)] p-2.5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-[#0b0b0b] hover:bg-[#0b0b0b] hover:shadow-[0_16px_34px_rgba(0,0,0,0.32)]"
                >
                  <img
                    src={guide.image}
                    alt=""
                    loading="lazy"
                    aria-hidden="true"
                    className="h-[68px] w-[68px] flex-none rounded-xl object-cover"
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[rgba(11,11,11,0.6)] transition group-hover/guide:text-primary">
                      {guide.category}
                    </span>
                    <span className="title-font truncate text-[1.1rem] leading-tight text-[#0b0b0b] transition group-hover/guide:text-white">
                      {guide.name}
                    </span>
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="ml-auto h-5 w-5 flex-none stroke-[#0b0b0b] fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4] transition group-hover/guide:translate-x-1 group-hover/guide:stroke-primary"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {openGuide ? (
        <MaintenanceDetailModal
          guide={openGuide}
          origin={openOrigin}
          onClose={() => {
            setOpenGuide(null)
            setOpenOrigin(null)
          }}
        />
      ) : null}
    </section>
  )
}

export default ShopSection
