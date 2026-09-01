import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Seo from '../../../shared/seo/Seo'
import { getGuides } from '../../../shared/services/contentService'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function GuidesIndexPage() {
  const { t } = useLanguage()
  // Data-driven: las guías salen de tiendita; si la cuenta no tiene, la lista queda vacía
  // (empty state) en vez de mostrar las guías hardcodeadas.
  const [guides, setGuides] = useState([])

  useEffect(() => {
    let cancelled = false
    getGuides().then((data) => {
      if (!cancelled) setGuides(Array.isArray(data) ? data : [])
    })
    return () => { cancelled = true }
  }, [])

  return (
    <section className="min-h-screen bg-[#050505] px-6 py-[clamp(56px,8vw,96px)] lg:px-40">
      <Seo
        title={t('seo.guidesTitle', 'Guías técnicas de iluminación escénica · Soporte Kolortec')}
        description={t('seo.guidesDesc', 'Cluster de guías técnicas: diagnóstico de cabezales móviles, errores DMX, mantenimiento de consolas y reparación profesional. Soporte local Kolortec.')}
        path="/soporte/guias"
      />

      <nav className="mb-5 flex items-center gap-2 text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-[#aab2be]" aria-label="Breadcrumb">
        <Link to="/descargas" className="transition hover:text-primary">{t('pages.guides.breadcrumbSupport', 'Soporte')}</Link>
        <span aria-hidden="true">/</span>
        <span className="text-white">{t('pages.guides.breadcrumbGuides', 'Guías')}</span>
      </nav>

      <header className="mb-10 grid max-w-[80ch] gap-3 kt-reveal">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
          <span className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-primary">
            {t('pages.guides.cluster', 'Cluster Soporte')}
          </span>
        </div>
        <h1 className="title-font m-0 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
          {t('pages.guides.title', 'Guías técnicas')}<span className="text-primary">.</span>
        </h1>
        <p className="m-0 text-[1.05rem] leading-[1.55] text-[#cfd4dc]">
          {t('pages.guides.intro', 'Diagnóstico, mantenimiento y reparación de iluminación profesional. Las preguntas que recibimos en soporte, respondidas en profundidad.')}
        </p>
      </header>

      {guides.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[#2a2a2a] bg-[#0f0f10] p-10 text-center kt-reveal">
          <p className="m-0 text-[0.95rem] text-[#aeb5bf]">
            {t('pages.guides.empty', 'Todavía no hay guías publicadas.')}
          </p>
        </div>
      ) : (
        // Con FOTO. Antes eran rectángulos de texto sobre gris: una biblioteca de
        // guías donde todo se ve igual no invita a entrar a ninguna, y la portada
        // (media[] del post en tiendita) ya estaba cargada y sin usar. Sin portada
        // queda el isotipo sobre negro, no un hueco.
        <ul className="grid gap-5 list-none m-0 p-0 sm:grid-cols-2 xl:grid-cols-3 kt-reveal">
          {guides.map((g) => (
            <li key={g.slug} className="kt-reveal-item">
              <Link
                to={`/soporte/guias/${g.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-[12px] border border-[#2a2a2a] bg-[#0f0f10] transition hover:-translate-y-1 hover:border-primary/55"
              >
                <span className="relative block aspect-[16/9] w-full overflow-hidden bg-deep-black">
                  {g.image ? (
                    <img
                      src={g.image}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                    />
                  ) : (
                    // Sin portada cargada en el admin: panel de marca en vez de un
                    // rectángulo negro vacío. Isotipo grande y tenue sobre un
                    // degradado, para que la card se lea igual de terminada que
                    // las que sí tienen foto.
                    <span
                      className="flex h-full w-full items-center justify-center"
                      style={{
                        backgroundImage:
                          'radial-gradient(ellipse 70% 90% at 50% 0%, rgba(244,223,51,0.10), transparent 70%), linear-gradient(160deg, #141414 0%, #0a0a0a 100%)',
                      }}
                    >
                      <img src="/favicon.svg" alt="" aria-hidden="true" className="h-16 w-16 opacity-25" />
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0f0f10] to-transparent"
                  />
                </span>

                <span className="flex flex-1 flex-col gap-2 p-5">
                  <h2 className="title-font m-0 text-[1.15rem] leading-[1.25] text-white transition-colors group-hover:text-primary">
                    {g.title}
                  </h2>
                  {g.excerpt ? (
                    <p className="m-0 text-[0.92rem] leading-[1.55] text-[#aeb5bf]">{g.excerpt}</p>
                  ) : null}
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-primary">
                    {t('pages.guides.readCta', 'Leer guía')}
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4] transition-transform group-hover:translate-x-1">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default GuidesIndexPage
