import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function SupportSection({ support }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.support.title', support.title)
  const sectionSubtitle = t('landing.support.subtitle', support.subtitle)

  const mapQuery = encodeURIComponent(support.locationLabel || 'Riobamab 132, Lanus Oeste, Buenos Aires, Argentina')
  const contactOptions = support.contacts ?? [
    {
      label: 'Envianos un WhatsApp',
      value: support.urgent?.phone ?? '+54 9 11 5555-5555',
      href: 'https://wa.me/5491155555555',
    },
    {
      label: 'Envianos un email',
      value: support.urgent?.email ?? 'info@kolortec.pro',
      href: `mailto:${support.urgent?.email ?? 'info@kolortec.pro'}`,
    },
  ]

  return (
    <section className="px-6 py-[clamp(84px,11vw,128px)] lg:px-40 kt-section-reveal" id="support" style={{ '--reveal-delay': '240ms' }}>
      <div className="grid gap-8 lg:grid-cols-[1.22fr_1fr] lg:items-start">
        <div className="grid gap-5">
          <div className="kt-landing-reveal-item border-l border-[rgba(244,223,51,0.5)] pl-4">
          <h2 className="title-font mb-2 text-left text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02] tracking-[0]">
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
        <div className="kt-landing-reveal-item kt-landing-float-card min-h-[340px] overflow-hidden border border-[rgba(255,255,255,0.14)] bg-[#0f0f0f] shadow-[0_14px_34px_rgba(0,0,0,0.32)]">
          <iframe
            title="Ubicacion Kolortec"
            src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-full min-h-[320px] w-full border-0 [filter:grayscale(0.2)_contrast(1.05)]"
          />
        </div>
      </div>
    </section>
  )
}

export default SupportSection
