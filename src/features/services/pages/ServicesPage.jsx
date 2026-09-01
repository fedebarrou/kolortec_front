import { Link } from 'react-router-dom'
import { defaultLandingContent } from '../../landing/data/landingData'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import Seo from '../../../shared/seo/Seo'

function ServicesPage() {
  const { t } = useLanguage()
  return (
    // Sin `min-h-screen`: la pagina son tres tarjetas (675px de contenido) y el
    // 100vh forzado dejaba 249px de negro entre la grilla y el footer. El
    // `.kt-app-shell` ya garantiza el alto minimo de la ventana.
    <section className="bg-[#050505] px-6 py-[clamp(56px,8vw,96px)] lg:px-40">
      <Seo
        title={t('seo.servicesTitle', 'Servicios y soluciones · Kolortec')}
        description={t('seo.servicesDesc', 'Servicios de instalación, capacitación y soporte para iluminación profesional Kolortec. Soluciones llave en mano con respaldo de fábrica.')}
        path="/servicios"
      />
      {/* El "Volver al inicio" venia pegado al costado del h1 (que es
          inline-flex) y se leia como parte del titulo. Va en su propia linea,
          con la misma flecha que usa /garantias. */}
      <div className="mb-10 flex flex-col gap-4 kt-reveal">
        <h1 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(3.8rem,10vw,7rem)] leading-[1.02]">
          {t('pages.services.title', 'Servicios')}
          <span className="text-primary">.</span>
        </h1>
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-2 text-sm font-extrabold uppercase tracking-[0.12em] text-primary transition hover:opacity-80"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4]">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          {t('pages.services.back', 'Volver al inicio')}
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 kt-reveal">
        {defaultLandingContent.services.items.map((item) => (
          <article key={item.title} className="overflow-hidden border border-[#2a2a2a] bg-[#111] kt-reveal-item">
            <div className="aspect-[16/10] w-full overflow-hidden border-b border-[#2a2a2a]">
              <img src={item.image} alt={item.title} loading="lazy" className="h-full w-full object-cover transition duration-500 ease-out hover:scale-105" />
            </div>
            <div className="px-4 py-4">
              <h3 className="title-font mb-2 text-[1.35rem]">{item.title}</h3>
              {/* El dato se llama `subtitle` en landingData: leyendo
                  `item.description` (que no existe) las tres tarjetas quedaban
                  sin una sola linea de texto. Se deja `description` como
                  fallback por si el contenido pasa a venir del adapter. */}
              <p className="text-[0.9rem] leading-[1.55] text-[#c4c8ce]">{item.subtitle || item.description}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ServicesPage
