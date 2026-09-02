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

  // React Router conserva el scroll entre rutas. Al entrar desde otra pagina
  // scrolleada (o al volver del detalle) el indice aterrizaba a mitad de la
  // lista. Mismo criterio que /descargas y /garantias.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  useEffect(() => {
    let cancelled = false
    getGuides().then((data) => {
      if (!cancelled) setGuides(Array.isArray(data) ? data : [])
    })
    return () => { cancelled = true }
  }, [])

  return (
    // Sin `min-h-screen`: `.kt-app-shell` ya garantiza 100vh, y cuando la cuenta
    // no tiene guias publicadas el 100vh de esta seccion dejaba ~450px de negro
    // entre el empty state y el footer.
    <section className="bg-[#050505] px-6 py-[clamp(56px,8vw,96px)] lg:px-40">
      <Seo
        title={t('seo.guidesTitle', 'Guías técnicas de iluminación escénica · Soporte Kolortec')}
        description={t('seo.guidesDesc', 'Cluster de guías técnicas: diagnóstico de cabezales móviles, errores DMX, mantenimiento de consolas y reparación profesional. Soporte local Kolortec.')}
        path="/soporte/guias"
      />

      <nav className="mb-5 flex items-center gap-2 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-[#aab2be]" aria-label="Breadcrumb">
        <Link to="/descargas" className="transition hover:text-primary">{t('pages.guides.breadcrumbSupport', 'Soporte')}</Link>
        <span aria-hidden="true">/</span>
        <span className="text-white">{t('pages.guides.breadcrumbGuides', 'Guías')}</span>
      </nav>

      <header className="mb-10 grid max-w-[80ch] gap-3 kt-reveal">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
          <span className="text-[0.75rem] font-black uppercase tracking-[0.22em] text-primary">
            {t('pages.guides.cluster', 'Cluster Soporte')}
          </span>
        </div>
        <h1 className="title-font m-0 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
          {t('pages.guides.title', 'Guías técnicas')}<span className="text-primary">.</span>
        </h1>
        {/* El `ch` MIENTE: es el ancho del "0" y los glifos reales promedian
            menos, asi que un tope en `ch` renderiza mas caracteres de los que
            dice. Medido carácter por carácter con un Range sobre el texto
            renderizado: 56ch da 65 caracteres por linea, bajo el tope comodo de
            lectura (~75). */}
        <p className="m-0 max-w-[56ch] text-[1.05rem] leading-[1.55] text-[#cfd4dc]">
          {t('pages.guides.intro', 'Diagnóstico, mantenimiento y reparación de iluminación profesional. Las preguntas que recibimos en soporte, respondidas en profundidad.')}
        </p>
      </header>

      {guides.length === 0 ? (
        // Empty state CON salida. Antes era un cartel sin ningun link: el lector
        // que llegaba buscando ayuda se quedaba sin nada que tocar. Mismas dos
        // salidas que ofrece el empty state de /descargas.
        <div className="rounded-[12px] border border-dashed border-[#2a2a2a] bg-[#0f0f10] p-8 text-center sm:p-12 kt-reveal">
          <p className="m-0 text-[0.95rem] text-[#aeb5bf]">
            {t('pages.guides.empty', 'Todavía no hay guías publicadas.')}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/contacto"
              className="inline-flex items-center gap-2 rounded-[8px] border-2 border-white px-5 py-3 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-[#090909]"
            >
              {t('support.page.contactCta', 'Contactar soporte técnico')}
            </Link>
            <Link
              to="/descargas"
              className="inline-flex items-center gap-1.5 px-2 py-3 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-primary transition hover:opacity-80"
            >
              {t('support.page.firmwareCta', 'Ver descargas')}
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4]">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      ) : (
        // Con FOTO. Antes eran rectángulos de texto sobre gris: una biblioteca de
        // guías donde todo se ve igual no invita a entrar a ninguna, y la portada
        // (media[] del post en tiendita) ya estaba cargada y sin usar. Sin portada
        // queda el isotipo sobre negro, no un hueco.
        // El reveal va en CADA TARJETA, nunca en el <ul>.
        // El observer global (useScrollReveal) revela con `threshold: 0.12`: hay
        // que ver el 12% del elemento observado. Con 13 tarjetas en una columna
        // el <ul> mide ~5.750px, o sea que ese 12% son ~690px y en un celular de
        // 640-736px de alto NO ENTRA NUNCA: la lista entera se quedaba en
        // opacity 0 para siempre (pantalla negra en iPhone SE/8/8 Plus y en
        // Android 360x640; a 390x844 zafaba por 0.015). Medido: 0 de 13 tarjetas
        // visibles a 414x736 incluso despues de scrollear la pagina completa.
        // Observando cada <li> (que mide ~450px) el 12% son ~54px y siempre
        // entra, sin importar el viewport. Es el mismo criterio documentado en
        // SupportPage con sus 112 tarjetas.
        <ul className="grid gap-5 list-none m-0 p-0 sm:grid-cols-2 xl:grid-cols-3">
          {guides.map((g) => (
            <li key={g.slug} className="kt-reveal">
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
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-3 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-primary">
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
