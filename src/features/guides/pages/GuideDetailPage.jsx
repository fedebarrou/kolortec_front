import { useState, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import Seo, { SITE } from '../../../shared/seo/Seo'
import { articleJsonLd, breadcrumbJsonLd } from '../../../shared/seo/jsonLd'
import { getGuideBySlug, getGuides } from '../../../shared/services/contentService'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

// El adapter (contentService.parseBlogContent) aplana el contenido del blog a
// texto plano: prefija "•  " a cada <li> y "⚠  " a cada <warn>. Renderizar eso
// como un solo <p whitespace-pre-line> deja VIÑETAS FALSAS —bolitas tipografiadas
// a mano en vez de una lista— y advertencias que no se distinguen del cuerpo.
// Acá se vuelve a agrupar en <ul> y en callouts, igual que ya se ve la MISMA
// guía en /garantias.
const BULLET_RE = /^[•·]\s*/
const WARN_RE = /^⚠\s*/

function toBlocks(body) {
  const blocks = []
  for (const raw of String(body || '').split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (WARN_RE.test(line)) {
      blocks.push({ type: 'warn', text: line.replace(WARN_RE, '').trim() })
      continue
    }
    if (BULLET_RE.test(line)) {
      const text = line.replace(BULLET_RE, '').trim()
      const last = blocks[blocks.length - 1]
      // Viñetas consecutivas = una sola <ul>, no una lista por ítem.
      if (last && last.type === 'list') last.items.push(text)
      else blocks.push({ type: 'list', items: [text] })
      continue
    }
    blocks.push({ type: 'p', text: line })
  }
  return blocks
}

function GuideBody({ body }) {
  const blocks = useMemo(() => toBlocks(body), [body])
  if (blocks.length === 0) return null

  return (
    <div className="grid gap-3">
      {blocks.map((block, i) => {
        if (block.type === 'list') {
          return (
            <ul key={`l-${i}`} className="m-0 grid list-none gap-2 p-0 text-[1rem] leading-[1.6] text-[#b7bbc4]">
              {block.items.map((item, j) => (
                <li key={`${i}-${j}`} className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-[0.55em] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )
        }
        if (block.type === 'warn') {
          return (
            <p
              key={`w-${i}`}
              className="m-0 flex items-start gap-2 rounded-[8px] border border-[rgba(244,223,51,0.35)] bg-[rgba(244,223,51,0.08)] px-3 py-2 text-[0.92rem] leading-[1.5] text-[#e7d98a]"
            >
              <span className="material-symbols-outlined text-[18px] leading-none text-primary" aria-hidden="true">
                warning
              </span>
              <span>{block.text}</span>
            </p>
          )
        }
        return (
          <p key={`p-${i}`} className="m-0 text-[1rem] leading-[1.65] text-[#b7bbc4]">
            {block.text}
          </p>
        )
      })}
    </div>
  )
}

/**
 * Data-driven: las guías salen de tiendita (/public/blog?tipo=guia). Empezamos
 * en loading (sin data local hardcodeada) para no "inventar" una guía; mientras
 * el fetch está en vuelo mostramos un placeholder en vez del "no encontrada".
 */
function GuideDetailPage() {
  const { slug } = useParams()
  const { t } = useLanguage()

  const [guide, setGuide] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)

  // React Router conserva el scroll al cambiar de ruta: entrando desde el indice
  // (scrollY 6264 medido en celular) la ficha abria en scrollY 987, con el <h1>
  // en top -775 — o sea arrancabas leyendo por la mitad, y de guia a guia lo
  // primero que se veia era el footer. Va por `slug` para cubrir tambien el salto
  // entre guias de "Segui leyendo".
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [slug])

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
          title={t('seo.guideNotFound', 'Guía no encontrada · Kolortec')}
          description={t('seo.guideNotFoundDesc', 'Esta guía no existe o se cambió de URL. Volvé al índice de soporte para ver todas las guías técnicas.')}
          path={`/soporte/guias/${slug || ''}`}
          noindex
        />
        <h1 className="title-font m-0 mb-2 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
          {t('pages.guides.notFoundTitle', 'Guía no encontrada')}<span className="text-primary">.</span>
        </h1>
        <p className="mb-3 text-[#a0a0a0]">{t('pages.guides.notFoundBody', 'No encontramos esta guía en el cluster de soporte.')}</p>
        <Link to="/soporte/guias" className="font-bold text-primary">{t('pages.guides.back', 'Volver a guías')}</Link>
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
    { name: t('pages.guides.breadcrumbHome', 'Inicio'), url: `${SITE}/` },
    // /soporte es un <Navigate> a /descargas (App.jsx): apuntar el breadcrumb al
    // redirect metia un salto de mas para el lector y una URL 302 en el JSON-LD.
    { name: t('pages.guides.breadcrumbSupport', 'Soporte'), url: `${SITE}/descargas` },
    { name: t('pages.guides.breadcrumbGuides', 'Guías'), url: `${SITE}/soporte/guias` },
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
        <Link to="/descargas" className="transition hover:text-primary">{t('pages.guides.breadcrumbSupport', 'Soporte')}</Link>
        <span aria-hidden="true">/</span>
        <Link to="/soporte/guias" className="transition hover:text-primary">{t('pages.guides.breadcrumbGuides', 'Guías')}</Link>
      </nav>

      <header className="mb-8 grid max-w-[80ch] gap-4 kt-reveal">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
          <span className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-primary">
            {t('pages.guides.badge', 'Guía técnica')}
          </span>
        </div>
        <h1 className="title-font m-0 text-[clamp(2.2rem,5.4vw,3.8rem)] leading-[1.04]">
          {guide.title}
          <span className="text-primary">.</span>
        </h1>
        {/* El tope de ancho va en el <p>, no en el <header>: el h1 es una
            display condensada y se lee mejor usando todo el ancho. */}
        <p className="m-0 max-w-[56ch] text-[1.05rem] leading-[1.55] text-[#cfd4dc]">{guide.excerpt}</p>
      </header>

      {/* PORTADA. El indice pinta la foto de cada guia (mapper: `image`/`video`)
          y la ficha no tenia un solo <img>: se clickeaba una tarjeta con foto y
          se aterrizaba en una pagina de puro texto. Es la misma imagen que la
          tarjeta, asi que ya viene del cache del navegador. */}
      {guide.image ? (
        <figure className="mb-10 overflow-hidden rounded-[14px] border border-[#1f1f1f] bg-deep-black kt-reveal">
          <img
            src={guide.image}
            alt=""
            aria-hidden="true"
            decoding="async"
            className="block aspect-[16/9] w-full object-cover lg:aspect-[21/9]"
          />
        </figure>
      ) : null}

      {/* Dos columnas a partir de lg. Antes el cuerpo era una unica columna de
          `max-w-[78ch]` pegada a la izquierda: a 1440 iba de x=120 a x=691 y el
          footer llegaba a x=1320, o sea 52% del viewport vacio. Ahora el aside
          (ayuda + seguí leyendo) ocupa esa banda y queda pegajoso mientras se
          lee. En mobile stackea, con el aside al final como estaba. */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-14">
        {/* 78ch daba 93 caracteres por linea (el `ch` es el ancho del "0", no el
            del glifo promedio). Medido carácter por carácter con un Range:
            52ch da 73 en el cuerpo a 1rem, bajo el tope comodo de lectura
            (~75). El excerpt del header va a 56ch porque es 1.05rem. */}
        <div className="grid max-w-[52ch] gap-7">
          {guide.sections.map((section, i) => (
            // El reveal va por SECCION, no en el contenedor: con las guias de
            // limpieza (27 viñetas) el contenedor mide varios viewports y el
            // `threshold: 0.12` del observer global puede no entrar nunca.
            <section key={`${section.heading || 'sec'}-${i}`} className="kt-reveal">
              {section.heading ? (
                <h2 className="title-font m-0 mb-3 text-[1.4rem] leading-[1.2] text-white">
                  {section.heading}
                </h2>
              ) : null}
              <GuideBody body={section.body} />
            </section>
          ))}
        </div>

        <div className="grid gap-8 lg:sticky lg:top-28">
          <aside className="rounded-[12px] border border-[rgba(244,223,51,0.4)] bg-[#0f0f10] p-6 kt-reveal">
            <p className="m-0 mb-4 text-[0.95rem] leading-[1.5] text-[#cfd4dc]">
              {t('pages.guides.helpCta', '¿Necesitás ayuda directa? Nuestro equipo de soporte responde con repuestos en stock local y diagnóstico en 48-72h.')}
            </p>
            <Link
              to={guide.cta?.href || '/contacto'}
              className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-primary px-6 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#090909] transition hover:-translate-y-0.5"
            >
              {guide.cta?.label || t('pages.guides.helpButton', 'Contactar soporte')}
            </Link>
          </aside>

          {related.length > 0 ? (
            <section className="border-t border-[#2a2a2a] pt-6 kt-reveal">
              <h2 className="title-font m-0 mb-4 text-[1.25rem] leading-[1.05]">
                {t('pages.guides.keepReading', 'Seguí leyendo')}<span className="text-primary">.</span>
              </h2>
              <ul className="grid gap-3 list-none m-0 p-0 sm:grid-cols-3 lg:grid-cols-1">
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
        </div>
      </div>
    </article>
  )
}

export default GuideDetailPage
