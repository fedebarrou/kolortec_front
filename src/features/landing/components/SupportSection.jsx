import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function SupportSection({ support }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.support.title', support.title)
  const sectionSubtitle = t('landing.support.subtitle', support.subtitle)

  const contactOptions = support.contacts ?? []
  const sideImage = support.sideImage

  return (
    <section className="px-6 py-[clamp(84px,11vw,128px)] lg:px-40 kt-section-reveal" id="support" style={{ '--reveal-delay': '240ms' }}>
      <div className="grid gap-8 lg:grid-cols-[1.22fr_1fr] lg:items-start">
        <div className="grid gap-5">
          <div className="kt-landing-reveal-item border-l border-[rgba(244,223,51,0.5)] pl-4">
            <h2 className="title-font mb-2 text-left text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02]">
              {sectionTitle}
              <span className="text-primary">.</span>
            </h2>
            <p className="m-0 text-[#aab2be]">{sectionSubtitle}</p>
          </div>
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
        </div>

        <div className="kt-landing-reveal-item relative min-h-[340px] overflow-hidden">
          {sideImage ? (
            <img
              src={sideImage}
              alt=""
              loading="lazy"
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover"
              style={{ maskImage: 'linear-gradient(180deg, transparent 0%, black 22%, black 78%, transparent 100%)', WebkitMaskImage: 'linear-gradient(180deg, transparent 0%, black 22%, black 78%, transparent 100%)' }}
            />
          ) : null}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]"
          />
        </div>
      </div>
    </section>
  )
}

export default SupportSection
