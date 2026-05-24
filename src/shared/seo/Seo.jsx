/**
 * Componente SEO reutilizable.
 *
 * Aprovecha el hoisting nativo de <title>/<meta>/<link> de React 19
 * (no requiere react-helmet). Los <script type="application/ld+json">
 * inline quedan en el árbol del componente — Google los lee igual.
 *
 * Uso:
 *   <Seo
 *     title="..."
 *     description="..."
 *     path="/soporte"
 *     image="https://kolortec.com.ar/og-default.jpg"
 *     type="website"
 *     jsonLd={{...}}
 *   />
 */

const SITE = 'https://kolortec.com.ar'
const DEFAULT_OG = `${SITE}/og-default.jpg`

function ensureAbsolute(url) {
  if (!url) return DEFAULT_OG
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${SITE}${url.startsWith('/') ? '' : '/'}${url}`
}

function Seo({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  jsonLd,
  noindex = false,
}) {
  const url = `${SITE}${path}`
  const img = ensureAbsolute(image)
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []
  const robots = noindex
    ? 'noindex,follow'
    : 'index,follow,max-image-preview:large'

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={robots} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Kolortec" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta property="og:locale" content="es_AR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />

      {blocks.map((block, i) => (
        <script
          key={`jsonld-${i}`}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}
    </>
  )
}

export { SITE, DEFAULT_OG }
export default Seo
