import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

/**
 * GuideCard — tarjeta de una guía/nota con foto. La usan el índice
 * (/soporte/guias) y el «Seguí leyendo» del detalle, para que las dos se vean
 * como lo mismo: portada 16:9 con object-cover, título, extracto y CTA.
 *
 * `headingTag` existe por la jerarquía de títulos: en el índice la tarjeta es
 * un h2 (debajo del h1 de la página); en el detalle cuelga de un h2 «Seguí
 * leyendo» y tiene que ser h3.
 *
 * Sin portada cargada en el admin: panel de marca en vez de un rectángulo negro
 * vacío. Isotipo grande y tenue sobre un degradado, para que la card se lea
 * igual de terminada que las que sí tienen foto (misma proporción, alineada).
 */
function GuideCard({ guide, headingTag = 'h2' }) {
  const { t } = useLanguage()
  const Heading = headingTag
  return (
    <Link
      to={`/soporte/guias/${guide.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[12px] border border-[color:var(--line2)] bg-[#0f0f10] transition-[transform,border-color] hover:-translate-y-1 hover:border-primary/55 focus-visible:border-primary/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="relative block aspect-[16/9] w-full overflow-hidden bg-deep-black">
        {guide.image ? (
          <img
            src={guide.image}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center"
            style={{
              backgroundImage:
                'radial-gradient(ellipse 70% 90% at 50% 0%, rgba(244,223,51,0.10), transparent 70%), linear-gradient(160deg, #141414 0%, #0a0a0a 100%)',
            }}
          >
            <img src="/assets/logo_minimal.png" alt="" aria-hidden="true" className="h-16 w-16 opacity-25 object-contain" />
          </span>
        )}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0f0f10] to-transparent"
        />
      </span>

      <span className="flex flex-1 flex-col gap-2 p-5">
        <Heading className="title-font m-0 text-[1.15rem] leading-[1.25] text-white transition-colors group-hover:text-primary group-focus-visible:text-primary">
          {guide.title}
        </Heading>
        {guide.excerpt ? (
          <p className="m-0 text-[0.92rem] leading-[1.55] text-[#aeb5bf]">{guide.excerpt}</p>
        ) : null}
        <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-primary">
          {t('pages.guides.readCta', 'Leer guía')}
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4] transition-transform group-hover:translate-x-1">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </span>
    </Link>
  )
}

export default GuideCard
