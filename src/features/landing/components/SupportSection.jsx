import { useLanguage } from '../../../shared/i18n/LanguageProvider'

const FALLBACK_IMAGE = '/assets/scrolly-frames/f095.jpg'

function SupportSection({ support, loading = false }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.support.title', support.title)
  const sectionSubtitle = t('landing.support.subtitle', support.subtitle)

  const contactOptions = support.contacts ?? []
  const image = (Array.isArray(support.carouselImages) && support.carouselImages[0]) || FALLBACK_IMAGE

  return (
    <section className="px-6 py-[clamp(84px,11vw,128px)] lg:px-40 kt-section-reveal" id="support" style={{ '--reveal-delay': '240ms' }}>
      <div className="grid gap-8 lg:grid-cols-[1.22fr_1fr] lg:items-stretch">
        <div className="grid gap-5">
          <div className="kt-landing-reveal-item border-l border-[rgba(244,223,51,0.5)] pl-4">
            <h2 className="title-font mb-2 text-left text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02]">
              {sectionTitle}<span className="text-primary">.</span>
            </h2>
            <p className="m-0 text-[#aab2be]">{sectionSubtitle}</p>
          </div>
          {loading ? (
            // Mientras carga: skeleton sutil (evita el flash de contactos fantasma → empty).
            <div className="grid gap-0 border-y border-[rgba(255,255,255,0.14)] py-1" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="grid gap-1.5 border-b border-[rgba(255,255,255,0.1)] py-4 last:border-b-0">
                  <div className="h-3 w-28 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-40 animate-pulse rounded bg-white/[0.06]" />
                </div>
              ))}
            </div>
          ) : contactOptions.length > 0 ? (
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
          ) : (
            <div className="grid place-items-center gap-3 border-y border-[rgba(255,255,255,0.14)] py-9 text-center">
              <span
                className="material-symbols-outlined grid h-12 w-12 place-items-center rounded-full border border-[rgba(244,223,51,0.35)] text-[24px] text-primary"
                aria-hidden="true"
              >
                forum
              </span>
              <p className="m-0 max-w-[30ch] text-[0.9rem] leading-relaxed text-[#aeb5bf]">
                {t('landing.support.emptyContacts', 'Todavía no cargamos los datos de contacto. Pronto vas a poder escribirnos por acá.')}
              </p>
            </div>
          )}
        </div>

        <div className="kt-landing-reveal-item relative min-h-[240px] overflow-hidden rounded-2xl sm:min-h-[340px] lg:min-h-0 lg:h-full">
          <img
            src={image}
            alt={sectionTitle}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        </div>
      </div>
    </section>
  )
}

export default SupportSection
