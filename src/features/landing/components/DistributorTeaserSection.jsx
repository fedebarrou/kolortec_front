import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function DistributorTeaserSection({ distributor }) {
  const { t } = useLanguage()
  const data = distributor ?? {}

  const eyebrow = data.eyebrow ?? t('landing.distributor.eyebrow', 'Programa de distribuidores')
  const title = data.title ?? t('landing.distributor.title', 'Quieres formar parte del equipo de distribuidores Kolortec?')
  const subtitle = data.subtitle ?? t(
    'landing.distributor.subtitle',
    'Sumate a la red de partners autorizados — acceso a productos, soporte tecnico de fabrica y condiciones comerciales preferenciales.',
  )
  const cta = data.cta ?? t('landing.distributor.cta', 'Solicitud de cuenta')
  const href = data.href ?? '/distribuidores'

  return (
    <section
      className="kt-section-reveal relative isolate overflow-hidden border-t border-b border-[#1a1a1a] bg-[#070707] px-6 py-[clamp(64px,9vw,112px)] lg:px-40"
      style={{ '--reveal-delay': '120ms' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.18]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse 60% 50% at 12% 50%, rgba(244, 223, 51, 0.4), transparent 70%), radial-gradient(ellipse 55% 45% at 88% 50%, rgba(244, 223, 51, 0.18), transparent 75%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1px] bg-gradient-to-r from-transparent via-[rgba(244,223,51,0.4)] to-transparent"
      />

      <div className="relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center md:gap-14">
        <div className="kt-landing-reveal-item flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
            <span className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-primary">{eyebrow}</span>
          </div>
          <h2 className="title-font m-0 max-w-[18ch] text-left text-[clamp(1.25rem,4.4vw,3.4rem)] leading-[1.04] sm:max-w-none">
            {title}<span className="text-primary">.</span>
          </h2>
          <p className="m-0 max-w-[60ch] text-[1rem] leading-[1.55] text-[#b7bbc4]">{subtitle}</p>
        </div>

        <div className="kt-landing-reveal-item flex md:justify-end">
          <Link
            to={href}
            className="group inline-flex items-center gap-3 rounded-[10px] bg-primary px-7 py-4 text-sm font-extrabold uppercase tracking-[0.14em] text-[#0b0b0b] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(244,223,51,0.25)]"
          >
            <span>{cta}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4] transition-transform group-hover:translate-x-0.5">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default DistributorTeaserSection
