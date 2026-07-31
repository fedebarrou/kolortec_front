import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

// Accesos de la sección de soporte (data estática en landingData) → key i18n por icono (ES/EN).
const ACCESS_KEY_BY_ICON = {
  download: 'landing.shop.access.downloads',
  forum: 'landing.shop.access.contact',
  verified: 'landing.shop.access.guides',
}

// Diseño "2c" del mockup de la sección amarilla, invertido: la intro (cortina + barrido del
// logo + flash) arranca en amarillo y al terminar el fondo funde a NEGRO con tipografía blanca
// (en el mockup fundía a blanco con tipografía negra). El video vive en el borde derecho con
// máscara ghost que lo mezcla con el fondo; la biblioteca de guías salió de la sección y queda
// accesible por su acceso "Biblioteca de guías" (/soporte/guias).
function ShopSection({ shop }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.shop.title', shop.title)
  const sectionSubtitle = t('landing.shop.subtitle', shop.subtitle)
  const sectionEyebrow = t('landing.shop.eyebrow', 'Warranty Program')
  const videoBadge = t('landing.shop.videoBadge', 'Repuestos originales')
  const ctas = shop.ctas ?? []

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const sectionRef = useRef(null)
  const videoRef = useRef(null)
  const [introPhase, setIntroPhase] = useState(prefersReducedMotion ? 'done' : 'priming')

  // Video: se reproduce UNA vez al entrar la sección al viewport y queda en el último frame
  // (equipo encendido). Sin loop.
  useEffect(() => {
    const vid = videoRef.current
    const el = sectionRef.current
    if (!vid || !el) return undefined
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            vid.play?.()?.catch(() => {})
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.25 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Animación de entrada (cortina + barrido + flash → fundido a negro). Se dispara al entrar
  // la sección al viewport; el contenido se revela mientras el fondo oscurece.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return undefined
    if (prefersReducedMotion) return undefined

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIntroPhase('playing')
            window.setTimeout(() => setIntroPhase('done'), 2100)
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
      'group/access flex items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.18)] py-4 text-left transition last:border-b-0 hover:pl-1'
    const inner = (
      <>
        <span className="flex items-center gap-3">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-primary text-[#0b0b0b] transition group-hover/access:scale-105">
            <span className="material-symbols-outlined text-[20px] leading-none" aria-hidden="true">
              {cta.icon || 'arrow_forward'}
            </span>
          </span>
          <span className="flex flex-col">
            <strong className="text-[0.95rem] font-extrabold uppercase tracking-[0.06em] text-white">
              {t(ACCESS_KEY_BY_ICON[cta.icon] ?? '', cta.label)}
            </strong>
            {cta.description ? (
              <span className="text-[0.8rem] text-[rgba(255,255,255,0.62)]">{cta.description}</span>
            ) : null}
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5 flex-none stroke-white fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4] transition-transform group-hover/access:translate-x-1 group-hover/access:stroke-primary"
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
      className={`kt-shop-section ${phaseClass} relative isolate flex min-h-[600px] items-center overflow-hidden bg-primary py-[clamp(72px,10vw,128px)] text-white`}
    >
      {/* Fundido amarillo → negro al terminar la intro (equivalente invertido del kt2-white del mockup) */}
      <div className="kt-shop-dark" aria-hidden="true" />

      {/* Video al borde derecho, mezclado con el fondo por máscara ghost (en mobile pasa a
          fondo full-bleed atenuado). El asset se va a reemplazar; el comportamiento queda. */}
      <div className="kt-shop-video-edge kt-shop-from-right" aria-hidden="true">
        <video
          ref={videoRef}
          src="/assets/shop-section-bg.mp4"
          muted
          playsInline
          preload="auto"
        />
        <span className="kt-shop-video-badge">{videoBadge}</span>
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

      <div className="kt-shop-content relative z-10 w-full px-6 lg:pl-40 lg:pr-[min(620px,46vw)]">
        <div className="kt-shop-from-left flex max-w-[660px] flex-col gap-5">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
            <span className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-white">
              {sectionEyebrow}
            </span>
          </div>

          <h2 className="title-font m-0 whitespace-pre-line text-left text-[clamp(2.4rem,7vw,5.4rem)] leading-[0.88] text-white">
            {sectionTitle}
            <span className="text-primary">.</span>
          </h2>

          <p className="max-w-[52ch] text-[1.05rem] leading-[1.55] text-[rgba(255,255,255,0.75)]">
            {sectionSubtitle}
          </p>

          {ctas.length > 0 ? (
            <nav className="mt-2 border-t border-[rgba(255,255,255,0.18)]" aria-label={sectionEyebrow}>
              {ctas.map(renderAccess)}
            </nav>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default ShopSection
