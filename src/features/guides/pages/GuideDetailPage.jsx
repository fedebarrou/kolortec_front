import { useState, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import Seo, { SITE } from '../../../shared/seo/Seo'
import { articleJsonLd, breadcrumbJsonLd } from '../../../shared/seo/jsonLd'
import { getGuideBySlug, getGuides } from '../../../shared/services/contentService'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import GuideCard from '../components/GuideCard'
import { parseInline } from '../helpers/inlineMarks'

// El adapter (contentService.parseBlogContent) aplana el contenido del blog a
// texto con un renglón por bloque: prefija "•  " a cada <li> y "⚠  " a cada <warn>.
// Renderizar eso como un solo <p whitespace-pre-line> deja VIÑETAS FALSAS —bolitas
// tipografiadas a mano en vez de una lista— y advertencias que no se distinguen del
// cuerpo. Acá se vuelve a agrupar en <ul> y en callouts, igual que ya se ve la MISMA
// guía en /garantias. El texto conserva las marcas *negrita* y _cursiva_: se dibujan
// con <strong>/<em> (InlineText); lo demás es texto, nunca HTML.
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

/**
 * Texto de un bloque con sus marcas: *negrita* → <strong>, _cursiva_ → <em>. Son elementos de React
 * (React escapa el texto): un `<b>` o un `<img onerror>` escrito en la nota se ve como texto, no se ejecuta.
 */
function InlineText({ text }) {
  const tokens = useMemo(() => parseInline(text), [text])
  const dibujar = (tokens2, prefijo) => tokens2.map((tok, i) => {
    const key = `${prefijo}${i}`
    if (tok.type === 'strong') {
      return <strong key={key} className="font-bold text-white">{tok.children ? dibujar(tok.children, `${key}-`) : tok.text}</strong>
    }
    // Manrope no trae cursiva: el navegador inclina la normal y la inclinación se come el espacio que
    // sigue («poco aceite» se leía «pocoaceite»). El margen derecho devuelve ese aire.
    if (tok.type === 'em') return <em key={key} className="mr-[0.08em] italic">{tok.children ? dibujar(tok.children, `${key}-`) : tok.text}</em>
    return tok.text
  })
  return <>{dibujar(tokens, '')}</>
}

function GuideBody({ body }) {
  const blocks = useMemo(() => toBlocks(body), [body])
  if (blocks.length === 0) return null

  return (
    <div className="grid gap-3">
      {blocks.map((block, i) => {
        if (block.type === 'list') {
          return (
            <ul key={`l-${i}`} className="m-0 grid max-w-[52ch] list-none gap-2 p-0 text-[1rem] leading-[1.6] text-[#b7bbc4] xl:max-w-[52rem] xl:text-[1.25rem] xl:leading-[1.7]">
              {block.items.map((item, j) => (
                <li key={`${i}-${j}`} className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-[0.55em] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span><InlineText text={item} /></span>
                </li>
              ))}
            </ul>
          )
        }
        if (block.type === 'warn') {
          return (
            <p
              key={`w-${i}`}
              className="m-0 flex items-start gap-2 rounded-[8px] border border-[rgba(244,223,51,0.35)] bg-[rgba(244,223,51,0.08)] px-3 py-2 text-[0.92rem] leading-[1.5] lg:px-4 lg:py-3 lg:text-[1.0625rem] lg:leading-[1.6] text-[#e7d98a]"
            >
              <span className="material-symbols-outlined text-[18px] leading-none text-primary" aria-hidden="true">
                warning
              </span>
              <span><InlineText text={block.text} /></span>
            </p>
          )
        }
        return (
          <p key={`p-${i}`} className="m-0 max-w-[52ch] text-[1rem] leading-[1.65] text-[#b7bbc4] xl:max-w-[52rem] xl:text-[1.25rem] xl:leading-[1.7]">
            <InlineText text={block.text} />
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

  // Guía cargada junto con el slug para el que se pidió: "cargando" se deriva de
  // que no coincida con el slug actual (sin prender un flag desde el efecto).
  const [loaded, setLoaded] = useState(null)
  const loading = loaded === null || loaded.slug !== slug
  const guide = loaded?.slug === slug ? loaded.guide : null
  const [related, setRelated] = useState([])

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

    getGuideBySlug(slug).then((data) => {
      if (!cancelled) setLoaded({ slug, guide: data || null })
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
      <section className="min-h-screen bg-[color:var(--bg)] px-6 py-[clamp(56px,8vw,96px)] lg:px-10 xl:px-20 2xl:px-40">
        <div className="h-4 w-24 animate-pulse rounded bg-[#1a1a1a]" />
        <div className="mt-6 h-12 w-3/4 max-w-[60ch] animate-pulse rounded bg-[#141414]" />
        <div className="mt-4 h-4 w-2/3 max-w-[50ch] animate-pulse rounded bg-[#111]" />
      </section>
    )
  }

  if (!guide) {
    return (
      <section className="min-h-screen bg-[color:var(--bg)] px-6 py-[42px] lg:px-10 xl:px-20 2xl:px-40">
        <Seo
          title={t('seo.guideNotFound', 'Guía no encontrada · Kolortec')}
          description={t('seo.guideNotFoundDesc', 'Esta guía no existe o se cambió de URL. Volvé al índice de soporte para ver todas las guías técnicas.')}
          path={`/soporte/guias/${slug || ''}`}
          noindex
        />
        <h1 className="title-font m-0 mb-2 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
          {t('pages.guides.notFoundTitle', 'Guía no encontrada')}<span className="text-primary">.</span>
        </h1>
        <p className="mb-3 text-[color:var(--muted)]">{t('pages.guides.notFoundBody', 'No encontramos esta guía en el cluster de soporte.')}</p>
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
    <article className="min-h-screen bg-[color:var(--bg)] px-6 py-[clamp(56px,8vw,96px)] lg:px-10 xl:px-20 2xl:px-40">
      <Seo
        title={guide.seoTitle || `${guide.title} · Kolortec`}
        description={guide.seoDescription || guide.excerpt}
        path={path}
        type="article"
        jsonLd={[articleLd, breadcrumbLd]}
      />

      <nav className="mb-5 flex items-center gap-2 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-[#aab2be]" aria-label="Breadcrumb">
        <Link to="/descargas" className="transition hover:text-primary">{t('pages.guides.breadcrumbSupport', 'Soporte')}</Link>
        <span aria-hidden="true">/</span>
        <Link to="/soporte/guias" className="transition hover:text-primary">{t('pages.guides.breadcrumbGuides', 'Guías')}</Link>
      </nav>

      <header className="mb-8 grid max-w-[80ch] gap-4 kt-reveal">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
          <span className="text-[0.75rem] font-black uppercase tracking-[0.22em] text-primary">
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

      {/* Dos columnas a partir de lg: cuerpo + aside de ayuda, pegajoso mientras
          se lee. El gutter del blog sigue la MISMA escalera que el header
          (24 · lg 40 · xl 80 · 2xl 160), así el h1 queda alineado con el logo en
          todo ancho (ra VIS-002); antes eran 160px fijos y a 1440 el contenido
          ocupaba 1120px. Es sólo el blog: el resto del sitio sigue en 160
          (opción B de Fedev, 19-oct). En mobile stackea. */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-16">
        {/* Debajo de lg el tope de lectura va en cada <p>/<ul> (GuideBody):
            1rem con 52ch también en lg (sin el tope, a 1279 eran 102 caracteres: ra
            VIS-007). Desde xl el texto sube a 1.25rem (interlineado 1,7) y llena
            su columna hasta 52rem (opción B de Fedev, 19-oct): a 1440 son ~87
            caracteres por linea y a 1920 el tope evita las 143 (ra VIS-001). */}
        <div className="grid gap-7">
          {guide.sections.map((section, i) => (
            // El reveal va por SECCION, no en el contenedor: con las guias de
            // limpieza (27 viñetas) el contenedor mide varios viewports y el
            // `threshold: 0.12` del observer global puede no entrar nunca.
            <section key={`${section.heading || 'sec'}-${i}`} className="kt-reveal">
              {section.heading ? (
                <h2 className="title-font m-0 mb-3 text-[1.4rem] leading-[1.2] text-white lg:text-[1.6rem]">
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
        </div>
      </div>

      {/* SEGUI LEYENDO, a todo el ancho y con foto. Antes era una columna de
          tarjetas de texto dentro del aside; ahora son las mismas tarjetas del
          indice (GuideCard) en una fila de tres. El reveal va por tarjeta, no en
          el <ul> (mismo criterio que el indice). Entre sm y lg entran dos: la
          tercera se oculta para no dejar una tarjeta huerfana. */}
      {related.length > 0 ? (
        <section className="mt-16 border-t border-[color:var(--line2)] pt-10 lg:mt-20" aria-labelledby="guide-keep-reading">
          <h2 id="guide-keep-reading" className="title-font m-0 mb-6 text-[1.4rem] leading-[1.1] lg:text-[1.6rem]">
            {t('pages.guides.keepReading', 'Seguí leyendo')}<span className="text-primary">.</span>
          </h2>
          <ul className="m-0 grid list-none gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((g, i) => (
              <li key={g.slug} className={`kt-reveal${i >= 2 ? ' sm:max-lg:hidden' : ''}`}>
                <GuideCard guide={g} headingTag="h3" />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  )
}

export default GuideDetailPage
