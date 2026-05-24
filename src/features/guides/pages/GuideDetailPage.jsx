import { Link, useParams } from 'react-router-dom'
import Seo, { SITE } from '../../../shared/seo/Seo'
import { articleJsonLd, breadcrumbJsonLd } from '../../../shared/seo/jsonLd'
import { getGuideBySlug, listGuides } from '../data/guides'

function GuideDetailPage() {
  const { slug } = useParams()
  const guide = getGuideBySlug(slug)

  if (!guide) {
    return (
      <section className="min-h-screen bg-[#050505] px-6 py-[42px] lg:px-40">
        <Seo
          title="Guía no encontrada · Kolortec"
          description="Esta guía no existe o se cambió de URL. Volvé al índice de soporte para ver todas las guías técnicas."
          path={`/soporte/guias/${slug || ''}`}
          noindex
        />
        <h1 className="title-font m-0 mb-2 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
          Guía no encontrada<span className="text-primary">.</span>
        </h1>
        <p className="mb-3 text-[#a0a0a0]">No encontramos esta guía en el cluster de soporte.</p>
        <Link to="/soporte/guias" className="font-bold text-primary">Volver a guías</Link>
      </section>
    )
  }

  const path = `/soporte/guias/${guide.slug}`
  const url = `${SITE}${path}`

  const related = listGuides()
    .filter((g) => g.slug !== guide.slug)
    .slice(0, 3)

  const articleLd = articleJsonLd({
    title: guide.title,
    description: guide.seoDescription || guide.excerpt,
    datePublished: guide.publishedAt,
    url,
  })
  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'Inicio', url: `${SITE}/` },
    { name: 'Soporte', url: `${SITE}/soporte` },
    { name: 'Guías', url: `${SITE}/soporte/guias` },
    { name: guide.title, url },
  ])

  return (
    <article className="min-h-screen bg-[#050505] px-6 py-[clamp(56px,8vw,96px)] lg:px-40">
      <Seo
        title={guide.seoTitle || `${guide.title} · Kolortec`}
        description={guide.seoDescription || guide.excerpt}
        path={path}
        type="article"
        jsonLd={[articleLd, breadcrumbLd]}
      />

      <nav className="mb-5 flex items-center gap-2 text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-[#aab2be]" aria-label="Breadcrumb">
        <Link to="/soporte" className="transition hover:text-primary">Soporte</Link>
        <span aria-hidden="true">/</span>
        <Link to="/soporte/guias" className="transition hover:text-primary">Guías</Link>
      </nav>

      <header className="mb-8 grid max-w-[80ch] gap-4">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
          <span className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-primary">
            Guía técnica
          </span>
        </div>
        <h1 className="title-font m-0 text-[clamp(2.2rem,5.4vw,3.8rem)] leading-[1.04]">
          {guide.title}
          <span className="text-primary">.</span>
        </h1>
        <p className="m-0 text-[1.05rem] leading-[1.55] text-[#cfd4dc]">{guide.excerpt}</p>
      </header>

      <div className="grid max-w-[78ch] gap-7">
        {guide.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="title-font m-0 mb-2 text-[1.4rem] leading-[1.2] text-white">
              {section.heading}
            </h2>
            <p className="m-0 text-[1rem] leading-[1.65] text-[#b7bbc4]">{section.body}</p>
          </section>
        ))}
      </div>

      <aside className="mt-12 max-w-[78ch] rounded-[12px] border border-[rgba(244,223,51,0.4)] bg-[#0f0f10] p-6">
        <p className="m-0 mb-4 text-[0.95rem] leading-[1.5] text-[#cfd4dc]">
          ¿Necesitás ayuda directa? Nuestro equipo de soporte responde con repuestos en stock local y diagnóstico en 48-72h.
        </p>
        <Link
          to={guide.cta.href}
          className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-primary px-6 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#090909] transition hover:-translate-y-0.5"
        >
          {guide.cta.label}
        </Link>
      </aside>

      {related.length > 0 ? (
        <section className="mt-14 border-t border-[#2a2a2a] pt-8">
          <h2 className="title-font m-0 mb-4 text-[1.4rem] leading-[1.05]">
            Seguí leyendo<span className="text-primary">.</span>
          </h2>
          <ul className="grid gap-3 list-none m-0 p-0 md:grid-cols-3">
            {related.map((g) => (
              <li key={g.slug}>
                <Link
                  to={`/soporte/guias/${g.slug}`}
                  className="block rounded-[10px] border border-[#2a2a2a] bg-[#0f0f10] p-4 transition hover:border-primary/50"
                >
                  <strong className="title-font block text-[1rem] leading-[1.25] text-white">{g.title}</strong>
                  <span className="mt-1 block text-[0.85rem] leading-[1.45] text-[#9ca3af]">{g.excerpt}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}

export default GuideDetailPage
