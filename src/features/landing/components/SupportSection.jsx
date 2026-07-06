import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { getGuides } from '../../../shared/services/contentService'

function SupportSection({ support }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.support.title', support.title)
  const sectionSubtitle = t('landing.support.subtitle', support.subtitle)

  const contactOptions = support.contacts ?? []

  // Lado derecho: lista de acceso a las guías de mantenimiento (blogs tipo=guia).
  // Data-driven: si la cuenta no tiene guías cargadas, ese lado no se muestra.
  const [guides, setGuides] = useState([])
  useEffect(() => {
    let mounted = true
    getGuides().then((g) => { if (mounted && Array.isArray(g)) setGuides(g) })
    return () => { mounted = false }
  }, [])
  const hasGuides = guides.length > 0

  return (
    <section className="px-6 py-[clamp(84px,11vw,128px)] lg:px-40 kt-section-reveal" id="support" style={{ '--reveal-delay': '240ms' }}>
      <div className={`grid gap-8 ${hasGuides ? 'lg:grid-cols-[1.22fr_1fr] lg:items-start' : ''}`}>
        <div className="grid gap-5">
          <div className="kt-landing-reveal-item border-l border-[rgba(244,223,51,0.5)] pl-4">
            <h2 className="title-font mb-2 text-left text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02]">
              {sectionTitle}<span className="text-primary">.</span>
            </h2>
            <p className="m-0 text-[#aab2be]">{sectionSubtitle}</p>
          </div>
          {contactOptions.length > 0 ? (
            <ul className="grid list-none gap-0 border-y border-[rgba(255,255,255,0.14)] p-0">
              {contactOptions.map((item) => (
                <li key={item.label} className="kt-landing-reveal-item border-b border-[rgba(255,255,255,0.12)] last:border-b-0">
                  <a
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                    className="grid gap-1 py-3.5 transition hover:translate-x-0.5"
                  >
                    <strong className="inline-flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.08em] text-[#f2f4f8]">
                      <span className="material-symbols-outlined inline-flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(244,223,51,0.45)] text-[15px] text-primary" aria-hidden="true">
                        {item.href.startsWith('mailto') ? 'mail' : 'chat'}
                      </span>
                      {item.label}
                    </strong>
                    <span className="text-[0.9rem] text-[#aeb5bf]">{item.value}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {hasGuides ? (
          <div className="kt-landing-reveal-item">
            <h3 className="title-font mb-3 text-left text-[clamp(1.1rem,2.2vw,1.5rem)] leading-tight">
              {t('landing.support.guidesTitle', 'Guías de mantenimiento')}<span className="text-primary">.</span>
            </h3>
            <ul className="grid list-none gap-0 border-y border-[rgba(255,255,255,0.14)] p-0">
              {guides.map((g) => (
                <li key={g.slug} className="border-b border-[rgba(255,255,255,0.12)] last:border-b-0">
                  <Link
                    to={`/soporte/guias/${g.slug}`}
                    className="flex items-center justify-between gap-3 py-3.5 transition hover:translate-x-0.5"
                  >
                    <span className="grid gap-0.5">
                      <strong className="text-[0.9rem] text-[#f2f4f8]">{g.title}</strong>
                      {g.excerpt ? <span className="line-clamp-1 text-[0.8rem] text-[#aeb5bf]">{g.excerpt}</span> : null}
                    </span>
                    <span className="material-symbols-outlined text-primary" aria-hidden="true">arrow_forward</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default SupportSection
