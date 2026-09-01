import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

/**
 * Un solo llamado a sumarse, para las dos formas.
 *
 * Reemplaza a DistributorTeaserSection y RentalTeaserSection, que eran espejos
 * visuales con el mismo peso y competian entre si. El tipo se elige adentro,
 * en /sumate, en vez de obligar a decidirlo desde la landing.
 */
function JoinTeaserSection({ join }) {
  const { t } = useLanguage()
  const data = join ?? {}

  const eyebrow = t('landing.join.eyebrow', data.eyebrow ?? 'Sumate a Kolortec')
  const title = t('landing.join.title', data.title ?? '¿Querés formar parte de Kolortec?')
  const subtitle = t(
    'landing.join.subtitle',
    data.subtitle ?? 'Como distribuidor autorizado o presentando tu proyecto de rental. Acceso a producto, soporte técnico de fábrica y condiciones comerciales preferenciales.',
  )
  const cta = t('landing.join.cta', data.cta ?? 'Quiero sumarme')
  const href = data.href ?? '/sumate'

  return (
    <section
      className="kt-join-section kt-section-reveal relative isolate flex flex-col justify-center overflow-hidden bg-[#050505] px-6 py-[clamp(110px,15vw,200px)] lg:pr-40 lg:pl-[calc(10rem+var(--kt-bleed-inset,0px))]"
      style={{ '--reveal-delay': '120ms' }}
    >
      {/* SIN el resplandor amarillo que había acá (dos radiales de rgba(244,223,51)
          al 18%): sobre el negro no daba "brillo", daba un lavado MARRÓN, y la
          sección se leía como una banda color barro justo después de la amarilla.
          El acento amarillo lo ponen la rayita del eyebrow, el punto del título y
          el botón — sobre negro pleno pegan mucho más. */}
      {/* Sin borde ni rayita arriba: esta sección SUBE por encima de la amarilla,
          así que cualquier línea en su tope se lee como el borde inferior del
          bloque amarillo — que no tiene bordes. El corte lo hace el propio
          movimiento de una tapando a la otra. */}

      <div className="kt-join-grid relative grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center md:gap-14">
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

        <div className="kt-join-cta kt-landing-reveal-item flex md:justify-end">
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

export default JoinTeaserSection
