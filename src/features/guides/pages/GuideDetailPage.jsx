import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Seo, { SITE } from '../../../shared/seo/Seo'
import { articleJsonLd, breadcrumbJsonLd } from '../../../shared/seo/jsonLd'
import { getGuideBySlug, getGuides } from '../../../shared/services/contentService'

/**
 * Data-driven: las guías salen de tiendita (/public/blog?tipo=guia). Empezamos
 * en loading (sin data local hardcodeada) para no "inventar" una guía; mientras
 * el fetch está en vuelo mostramos un placeholder en vez del "no encontrada".
 */
function GuideDetailPage() {
  const { slug } = useParams()

  const [guide, setGuide] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return undefined
    let cancelled = false
    setLoading(true)

    getGuideBySlug(slug).then((data) => {
      if (!cancelled) {
        setGuide(data || null)
        setLoading(false)
      }
    })

    getGuides().then((all) => {
      if (!cancelled && Array.isArray(all)) {
        setRelated(all.filter((g) => g.slug !== slug).slice(0, 3))
      }
    })

    return () => { cancelled = true }
  }, [slug])

  if (loading) {
    return (
      <section className="min-h-screen bg-[#050505] px-6 py-[clamp(56px,8vw,96px)] lg:px-40">
        <div className="h-4 w-24 animate-pulse rounded bg-[#1a1a1a]" />
        <div className="mt-6 h-12 w-3/4 max-w-[60ch] animate-pulse rounded bg-[#141414]" />
        <div className="mt-4 h-4 w-2/3 max-w-[50ch] animate-pulse rounded bg-[#111]" />
      </section>
    )
  }

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

      <header className="mb-8 grid max-w-[80ch] gap-4 kt-reveal">
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

      <div className="grid max-w-[78ch] gap-7 kt-reveal">
        {guide.sections.map((section, i) => (
          <section key={`${section.heading || 'sec'}-${i}`} className="kt-reveal-item">
            {section.heading ? (
              <h2 className="title-font m-0 mb-2 text-[1.4rem] leading-[1.2] text-white">
                {section.heading}
              </h2>
            ) : null}
            <p className="m-0 whitespace-pre-line text-[1rem] leading-[1.65] text-[#b7bbc4]">{section.body}</p>
          </section>
        ))}
      </div>

      <aside className="mt-12 max-w-[78ch] rounded-[12px] border border-[rgba(244,223,51,0.4)] bg-[#0f0f10] p-6 kt-reveal">
        <p className="m-0 mb-4 text-[0.95rem] leading-[1.5] text-[#cfd4dc]">
          ¿Necesitás ayuda directa? Nuestro equipo de soporte responde con repuestos en stock local y diagnóstico en 48-72h.
        </p>
        <Link
          to={guide.cta?.href || '/soporte'}
          className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-primary px-6 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#090909] transition hover:-translate-y-0.5"
        >
          {guide.cta?.label || 'Contactar soporte'}
        </Link>
      </aside>

      {related.length > 0 ? (
        <section className="mt-14 border-t border-[#2a2a2a] pt-8 kt-reveal">
          <h2 className="title-font m-0 mb-4 text-[1.4rem] leading-[1.05]">
            Seguí leyendo<span className="text-primary">.</span>
          </h2>
          <ul className="grid gap-3 list-none m-0 p-0 md:grid-cols-3">
            {related.map((g) => (
              <li key={g.slug} className="kt-reveal-item">
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
