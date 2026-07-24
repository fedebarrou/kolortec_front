/**
 * contentService.js — Adapter layer between kolortec components and the
 * tiendita public API (https://api.soytiendita.store/api/public/*).
 *
 * Contract: the shapes returned by getLandingContent() MUST match the keys
 * expected by landing components (hero, gallery, products, shop, services,
 * support, distributor, rental, footer, brand, nav, action).
 *
 * Rules:
 *  - Every fetch includes X-Account-Host and credentials: 'include'.
 *  - Every remote fetch falls back to the matching key from defaultLandingContent
 *    if the request fails or returns unusable data.
 *  - hero is NEVER fetched remotely; it always comes from landingData defaults.
 */

import { defaultLandingContent } from '../../features/landing/data/landingData.js'
import { resolveAccountHost } from './accountHost.js'

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || ''

/**
 * DEMO_MODE — "modo vidriera". Cuando VITE_DEMO_DATA === 'true' (build de Vercel para mostrarle al
 * cliente), los fallbacks caen a data MOCK para que el sitio se vea "lleno". En el build real/oficial
 * (VPS, flag ausente/false) todo es 100% data-driven: si tiendita no tiene info cargada, NO se inventa
 * nada (sin categorías/hero/líneas fantasma). Un solo codebase, dos builds. Ver categories.js y products.js.
 */
export const DEMO_MODE = import.meta.env?.VITE_DEMO_DATA === 'true'

// Las rutas OAuth públicas viven en el grupo `web` del backend (SIN prefijo /api):
// GET /public/auth/{provider} y su callback (routes/web.php). API_BASE_URL trae el
// sufijo /api, que rompía el redirect (/api/public/auth/google → 404). AUTH_BASE lo
// quita para pegar al path correcto (/public/auth/google → 302).
const AUTH_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '')

// ---------------------------------------------------------------------------
// Core fetch helpers
// ---------------------------------------------------------------------------

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' }
  const host = resolveAccountHost()
  if (host) {
    headers['X-Account-Host'] = host
  }
  return headers
}

async function fetchJson(path) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured')
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: buildHeaders(),
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${path}`)
  }
  return response.json()
}

// Cache por sesión de los GET públicos (/public/*): dedupe de llamadas concurrentes/duplicadas
// (ej. getLandingContent y getFooterData piden galeria/instagram/marcas) → la data queda lista al
// instante. Guarda la PROMESA; si falla, la remueve para permitir reintento.
const _publicFetchCache = new Map()
async function fetchWithFallback(path, fallbackValue) {
  let entry = _publicFetchCache.get(path)
  if (!entry) {
    entry = fetchJson(path).catch((err) => {
      _publicFetchCache.delete(path)
      throw err
    })
    _publicFetchCache.set(path, entry)
  }
  try {
    return await entry
  } catch {
    return fallbackValue
  }
}

// ---------------------------------------------------------------------------
// Mappers — raw tiendita API → component-expected shapes
// ---------------------------------------------------------------------------

/**
 * /public/productos → products.items[] shape
 * { name, description, image, category, badge, price, slug }
 */
function mapProducto(p) {
  return {
    id: p.id,
    name: p.nombre,
    description: p.descripcion,
    longDescription: p.descripcion,
    image: p.img_url || (p.media && p.media[0]?.url) || '',
    category: p.categoria,
    badge: p.destacado ? 'Destacado' : undefined,
    price: p.precio,
    moneda: p.moneda,
    stock: p.stock_disponible,
    slug: p.slug || String(p.id),
  }
}

/**
 * Mapea un producto de /public/productos al shape COMPLETO que consume ProductDetailPage.
 * Todo data-driven de la API (galería, precio, specs, docs, variantes). Los campos que la API no
 * tiene (videos, accesorios, family, tagline) quedan vacíos → la página oculta esas secciones.
 */
function mapProductoDetail(p) {
  const heroImage = p.img_url || (Array.isArray(p.media) && p.media[0]?.url) || ''
  const gallery = (Array.isArray(p.media) ? p.media : [])
    .filter((m) => (m.kind === 'image' || m.tipo === 'imagen' || !m.kind) && m.url)
    .map((m) => m.url)
  return {
    slug: String(p.id),
    id: p.id,
    name: p.nombre,
    sku: p.variantes?.[0]?.sku || p.codigo_interno || '',
    shortDescription: p.descripcion || '',
    longDescription: p.ficha_tecnica || p.descripcion || '',
    heroImage,
    gallery: gallery.length > 0 ? gallery : (heroImage ? [heroImage] : []),
    price: p.precio,
    moneda: p.moneda,
    category: p.categoria,
    technicalSpecs: (Array.isArray(p.specs) ? p.specs : [])
      .filter((s) => s && (s.nombre || s.valor))
      .map((s) => [s.nombre || '', s.valor || '']),
    downloads: (Array.isArray(p.docs) ? p.docs : [])
      .filter((d) => d && d.url)
      .map((d) => ({ label: d.title || 'Documento', size: d.size || '', type: String(d.extension || d.tipo || '').toUpperCase(), url: d.url })),
    variants: (Array.isArray(p.variantes) ? p.variantes : [])
      .map((v) => ({ id: v.id, sku: v.sku, price: v.precio, image: heroImage })),
    videos: (Array.isArray(p.media) ? p.media : [])
      .filter((m) => m && m.kind === 'video' && m.url)
      .map((m, i) => ({ title: `${p.nombre} · Video ${i + 1}`, url: m.url, thumbnail: heroImage })),
    innovations: (Array.isArray(p.innovaciones) ? p.innovaciones : [])
      .filter((i) => i && (i.nombre || i.descripcion))
      .map((i) => ({
        title: i.nombre || '',
        description: i.descripcion || '',
        image: i.media_url || i.logo_url || '',
        mediaType: i.media_tipo || 'imagen',
      })),
    related: [],
    accessories: [],
    seoTitle: `${p.nombre} · Kolortec`,
    seoDescription: p.descripcion || p.nombre,
    ogImage: heroImage,
  }
}

/**
 * /public/productos → products section (featured items)
 * Keeps the same structure as defaultLandingContent.products.
 */
function mapProductosToSection(raw) {
  // Data-driven: sin productos en tiendita → items vacío (la sección se oculta).
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ...defaultLandingContent.products, items: [] }
  }
  const mapped = raw.map(mapProducto)
  // Prefer destacado=true; if none, just take all
  const featured = mapped.filter((p) => p.badge === 'Destacado')
  const items = featured.length > 0 ? featured : mapped
  return {
    ...defaultLandingContent.products,
    items,
  }
}

/**
 * /public/instagram/feed or /public/galeria → gallery section
 */
function mapGallery(igData, galeriaData) {
  // Try Instagram first. `connected` = hay un Instagram REAL asociado al tenant (no galería).
  if (igData && igData.connected && Array.isArray(igData.data) && igData.data.length > 0) {
    const images = igData.data
      .map((item) => item.media_url || item.thumbnail_url)
      .filter(Boolean)
    return {
      ...defaultLandingContent.gallery,
      images,
      connected: true,
    }
  }
  // Fallback to /public/galeria (NO es Instagram → connected:false; la landing NO muestra el carrusel
  // de la sección Instagram, esta data se usa en el footer).
  if (Array.isArray(galeriaData) && galeriaData.length > 0) {
    const images = galeriaData
      .filter((item) => item.url)
      .map((item) => item.url)
    return {
      ...defaultLandingContent.gallery,
      images,
      connected: false,
    }
  }
  // Data-driven: sin galería/IG → images vacío.
  return { ...defaultLandingContent.gallery, images: [], connected: false }
}

/**
 * /public/web-config → support.contacts[]
 * Builds WhatsApp + email contact entries from empresa/whatsapp config keys.
 */
function mapWebConfigToSupport(cfg) {
  // Data-driven: sin config → contactos vacío (la sección se oculta).
  if (!cfg) return { ...defaultLandingContent.support, contacts: [] }

  const contacts = []

  // WhatsApp — tiendita: cfg.whatsapp = { contacto:{phone,status}, ventas:{phone,status}, soporte:{phone,status} }
  const wa = cfg.whatsapp || {}
  const waEntry = (node, label, text) => {
    const phone = node && typeof node === 'object' ? node.phone : node
    if (!phone) return
    const num = String(phone).replace(/\D/g, '')
    contacts.push({ label, value: String(phone), href: `https://wa.me/${num}?text=${encodeURIComponent(text)}` })
  }
  waEntry(wa.ventas, 'WhatsApp Ventas', 'Hola Kolortec, quiero info de ventas.')
  waEntry(wa.soporte, 'WhatsApp Soporte', 'Hola Kolortec, necesito soporte tecnico.')
  waEntry(wa.contacto, 'WhatsApp', 'Hola Kolortec!')

  // Email / teléfono — tiendita: cfg.empresa = { email, telefono, ... } (valores únicos)
  const empresa = cfg.empresa || {}
  if (empresa.email) {
    contacts.push({ label: 'Email', value: empresa.email, href: `mailto:${empresa.email}` })
  }
  if (empresa.telefono) {
    const num = String(empresa.telefono).replace(/\D/g, '')
    contacts.push({ label: 'Teléfono', value: empresa.telefono, href: `tel:${num}` })
  }

  if (contacts.length === 0) return { ...defaultLandingContent.support, contacts: [] }

  return {
    ...defaultLandingContent.support,
    contacts,
  }
}

/**
 * /public/marcas → footer.clientLogos[]
 * Converts { nombre, logo_url, link } → { name, logo, link }.
 * Components that render SVG shapes fall back to the hardcoded logos when
 * logo_url is absent; if logo_url is present, the component should render an <img>.
 */
function mapMarcasToClientLogos(raw) {
  // Data-driven: sin marcas cargadas → sin logos (no se muestran los hardcodeados).
  if (!Array.isArray(raw) || raw.length === 0) {
    return []
  }
  return raw
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .map((m) => ({
      name: m.nombre,
      logo: m.logo_url || null,
      link: m.link || null,
      // Keep shapes undefined so the FooterSection can branch on logo presence
    }))
}

/**
 * /public/servicios → services section
 * { title, items:[{title, subtitle, image}] }
 * NOTE: ServicesSection is currently commented-out in LandingPage; data is
 * mapped and available but not rendered. Do not uncomment the section.
 */
function mapServicios(raw) {
  // Data-driven: sin servicios → items vacío.
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ...defaultLandingContent.services, items: [] }
  }
  return {
    title: defaultLandingContent.services.title,
    items: raw.map((s) => ({
      title: s.nombre,
      subtitle: s.descripcion,
      image: s.img_url || (s.imagenes && s.imagenes[0]?.url) || '',
    })),
  }
}

/**
 * /public/blog?tipo=guia → guides[]
 * Maps to the shape used by GuidesIndexPage and GuideDetailPage:
 * { slug, title, excerpt, publishedAt, sections[], cta, seoTitle, seoDescription }
 *
 * `contenido` from the API is expected to be one of:
 *  - Array of { heading, body } objects (ideal)
 *  - A markdown/HTML string (we wrap it as a single section)
 *  - undefined/null (sections will be empty)
 */
function stripInlineMarks(s) {
  return String(s || '')
    .replace(/\{([^}]*)\}/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .trim()
}

/**
 * Parsea el `contenido` de un blog de tiendita (mini-sintaxis por línea: <h2>/<p>/<li>/<warn>/<spec>/...)
 * a secciones [{ heading, body }] que renderiza GuideDetailPage. Los <li> se vuelven viñetas y el body
 * conserva saltos de línea (se renderiza con whitespace-pre-line).
 */
function parseBlogContent(str) {
  const sections = []
  let cur = { heading: '', body: [] }
  const flush = () => {
    const body = cur.body.join('\n').trim()
    if (cur.heading || body) sections.push({ heading: cur.heading, body })
    cur = { heading: '', body: [] }
  }
  for (const rawLine of String(str).split('\n')) {
    const line = rawLine.trim()
    if (!line) continue
    const m = line.match(/^<(h[1-4]|p|li|oli|warn|note|hr|spec)>\s*(.*)$/i)
    if (!m) { cur.body.push(stripInlineMarks(line)); continue }
    const tag = m[1].toLowerCase()
    const text = stripInlineMarks(m[2])
    if (tag[0] === 'h') { flush(); cur.heading = text }
    else if (tag === 'li') cur.body.push('•  ' + text)
    else if (tag === 'oli') cur.body.push(text)
    else if (tag === 'warn' || tag === 'note') cur.body.push('⚠  ' + text)
    else if (tag === 'hr') { /* separador: ignorar */ }
    else if (tag === 'spec') { const [k, v] = text.split('|'); cur.body.push(`${(k || '').trim()}: ${(v || '').trim()}`) }
    else cur.body.push(text)
  }
  flush()
  return sections.filter((s) => s.heading || s.body)
}

function mapBlogToGuides(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null

  return raw.map((post) => {
    let sections = []

    if (Array.isArray(post.contenido)) {
      // Already the right shape
      sections = post.contenido.map((block) => ({
        heading: block.heading || block.titulo || '',
        body: block.body || block.cuerpo || block.contenido || '',
      }))
    } else if (typeof post.contenido === 'string' && post.contenido.trim()) {
      // Blog de tiendita: contenido = mini-sintaxis por línea → parsear a secciones.
      sections = parseBlogContent(post.contenido)
    }

    // media[] de tiendita: items { tipo:'imagen'|'video', url, is_primary, orden } (hasta 2 por guía).
    const media = Array.isArray(post.media) ? post.media : []
    const cover = media.find((m) => m?.is_primary) || media.find((m) => m?.tipo === 'imagen') || null
    const video = media.find((m) => m?.tipo === 'video') || null

    return {
      slug: post.slug,
      title: post.titulo,
      image: post.img_url || cover?.url || media[0]?.url || '',
      video: video?.url || '',
      seoTitle: `${post.titulo} · Kolortec`,
      seoDescription: post.excerpt || post.titulo,
      excerpt: post.excerpt || '',
      publishedAt: post.published_at || '',
      sections,
      cta: {
        label: 'Contactar soporte técnico',
        href: '/soporte',
      },
    }
  })
}

// ---------------------------------------------------------------------------
// Hero — /public/hero-config (scene-schema moderno) -> slides de kolortec.
// Si no hay carrusel creado en tiendita, cae al hero actual (defaults). NO se pierde.
// ---------------------------------------------------------------------------
function textValue(block) {
  return (block && typeof block === 'object' ? block.value : block) || ''
}

// Default theme para CarouselRenderer cuando el backend no envía theme.
const DEFAULT_THEME = {
  colors: { primary: '#5b6cff', secondary: '#9c4dff', text: '#ffffff', bg: '#111111', accent: '#ffd54a' },
  fontFamily: 'Inter, sans-serif',
  radius: 12,
  shadow: 'md',
}

function mapHeroConfig(heroCfg) {
  const carousels = heroCfg?.carousels
  const carousel = Array.isArray(carousels) && carousels.length ? carousels[0] : null
  const scenes = carousel?.scenes
  if (!Array.isArray(scenes) || scenes.length === 0) {
    // Sin carrusel creado en tiendita: mock solo en modo vidriera; en real, hero sin slides
    // (la sección se oculta) en vez de mostrar los 3 slides hardcodeados (data fantasma).
    return DEMO_MODE
      ? defaultLandingContent.hero
      : { intervalMs: defaultLandingContent.hero?.intervalMs || 7000, slides: [], labConfig: null }
  }

  // Detectar si alguna scene es del hero-lab (tiene elementos libres).
  const isLab = scenes.some((s) => s?.builder === 'lab' || Array.isArray(s?.elements))

  // Escenas ocultas (draft en el editor) NO se publican en la web.
  const publicScenes = scenes.filter((s) => !s?.hidden)

  const hrefOf = (b) =>
    b?.destination?.href || (b?.destination?.key ? `/${b.destination.key}` : null)

  const slides = publicScenes.map((scene, i) => {
    const media = scene?.media || {}
    const buttons = Array.isArray(scene?.buttons)
      ? scene.buttons.filter((b) => b && b.visible !== false)
      : []
    const primary = buttons.find((b) => b.primary) || buttons[0] || null
    const secondary = buttons.find((b) => b !== primary) || null
    const alignH = scene?.texts?.title?.align?.h
    const textPosition =
      alignH === 'right' || scene?.layout === 'right' ? 'right' : 'left'

    // Detección del slide "Golden Line": el HeroSection le aplica un estilado
    // bespoke (título Pacifico cursiva + dividers triple-línea + overlay cálido).
    // El clon a la DB pierde el translationKey 'hero3' original, así que lo
    // re-derivamos por la imagen (/assets/golden-line/...) o el título.
    const titleStr = textValue(scene?.texts?.title)
    const imgStr = String(media.url || '')
    const isGolden = /golden-line|golden/i.test(imgStr) || /golden/i.test(titleStr)

    // translationKey ÚNICO y fuera del catálogo i18n (cms-*) para que el
    // HeroSection use SIEMPRE el contenido real de la DB de tiendita (editable)
    // y no pise con las traducciones hardcodeadas del kolortec original.
    const translationKey = `cms-${scene?.id || i}`

    return {
      translationKey,
      isGolden,
      badge: textValue(scene?.texts?.description) || undefined,
      title: titleStr,
      subtitle: textValue(scene?.texts?.subtitle),
      primaryCta: primary?.label || null,
      primaryCtaHref: hrefOf(primary),
      secondaryCta: secondary?.label || null,
      secondaryCtaHref: hrefOf(secondary),
      imageUrl: media.kind === 'video' ? null : media.url || null,
      videoUrl: media.kind === 'video' ? media.url || null : null,
      textPosition,
    }
  })

  // Config para el CarouselRenderer (path lab). Solo se incluye cuando hay scenes lab.
  const labConfig = isLab && publicScenes.length
    ? {
        version: 1,
        settings: carousel.settings ?? null,
        theme: carousel.theme ?? DEFAULT_THEME,
        slides: publicScenes.map((s) => ({
          id: s.id,
          overlay: s.overlay ?? 0.2,
          background: s.background ?? null,
          elements: Array.isArray(s.elements) ? s.elements : [],
        })),
      }
    : null

  return {
    intervalMs: defaultLandingContent.hero?.intervalMs || 7000,
    slides,
    labConfig,
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * getLandingContent()
 * Fetches all sections in parallel from the tiendita public API and maps
 * them to the shape expected by landing components.
 * Fallback is always the matching key from defaultLandingContent.
 */
/**
 * deriveLines()
 * Líneas de producto distintas a partir del payload de /public/productos (cada producto puede o no
 * tener `linea`, un string freeform). Si no hay ninguna (o falla la API → mockup Vercel), usa las
 * líneas mock de defaultLandingContent.
 */
function deriveLines(raw) {
  const list = Array.isArray(raw)
    ? Array.from(new Set(raw.map((p) => (p?.linea ?? '').trim()).filter(Boolean)))
    : []
  if (list.length) return list
  // Sin líneas reales: solo mock en modo vidriera; en real no se inventan líneas.
  return DEMO_MODE ? (defaultLandingContent.lines ?? []) : []
}

export async function getLandingContent() {
  const [
    webConfig,
    productosRaw,
    igFeed,
    galeriaRaw,
    marcasRaw,
    serviciosRaw,
    heroCfgRaw,
    guides,
  ] = await Promise.all([
    fetchWithFallback('/public/web-config', null),
    fetchWithFallback('/public/productos', null),
    fetchWithFallback('/public/instagram/feed', null),
    fetchWithFallback('/public/galeria', null),
    fetchWithFallback('/public/marcas', null),
    fetchWithFallback('/public/servicios', null),
    fetchWithFallback('/public/hero-config', null),
    getGuides(),
  ])

  const products = mapProductosToSection(productosRaw)
  const lines = deriveLines(productosRaw)
  const gallery = mapGallery(igFeed, galeriaRaw)
  const support = mapWebConfigToSupport(webConfig)
  const clientLogos = mapMarcasToClientLogos(marcasRaw)
  const services = mapServicios(serviciosRaw)
  const hero = mapHeroConfig(heroCfgRaw)

  const footer = {
    ...defaultLandingContent.footer,
    clientLogos,
  }

  return {
    // hero: from /public/hero-config (carrusel creado en tiendita); fallback al hero actual
    hero,
    // brand & nav: from defaults (no dedicated tiendita endpoint yet)
    brand: defaultLandingContent.brand,
    nav: defaultLandingContent.nav,
    // gallery: IG feed if connected, else /public/galeria, else default
    gallery,
    // products: from /public/productos mapped to featured items
    products,
    // lines: líneas de producto distintas (campo `linea`); mock si no hay API (Vercel)
    lines,
    // shop: static copy from defaults + guías (blog tipo=guia) precargadas con el contenido
    // para que la "Biblioteca de guías" aparezca al instante con la sección amarilla.
    // Data-driven: si la cuenta no tiene guías cargadas → [] (la ShopSection oculta la columna),
    // NUNCA se cae a las guías hardcodeadas de defaults (eran "guías inventadas").
    shop: {
      ...defaultLandingContent.shop,
      guides: Array.isArray(guides) ? guides : [],
    },
    // services: from /public/servicios — section is commented-out in LandingPage
    services,
    // support: contacts from /public/web-config
    support,
    // action: static — no API source yet
    action: defaultLandingContent.action,
    // distributor / rental: static editorial sections
    distributor: defaultLandingContent.distributor,
    rental: defaultLandingContent.rental,
    // footer: clientLogos from /public/marcas; rest is default
    footer,
  }
}

/**
 * getShopProducts()
 * Returns the full products list for ShopPage/CatalogPage.
 * Shape: same as mapProducto() output.
 */
export async function getShopProducts() {
  // Data-driven: sin productos en tiendita → lista vacía (las páginas muestran su empty state).
  const raw = await fetchWithFallback('/public/productos', null)
  if (!Array.isArray(raw) || raw.length === 0) {
    return []
  }
  return raw.map(mapProducto)
}

/**
 * getCategorias()
 * Categorías definidas en tiendita para esta cuenta (fuente de verdad de la LISTA).
 * Shape crudo: [{ id, slug, nombre, orden, image_url }]. El merge con el diseño local
 * (imagen/tags/nameEn) se hace en src/data/categories.js. Fallback: [] si falla.
 */
export async function getCategorias() {
  const raw = await fetchWithFallback('/public/categorias', [])
  return Array.isArray(raw) ? raw : []
}

/**
 * getProductDetail(slug)
 * No dedicated single-product endpoint yet — searches within /public/productos.
 * Falls back to null if not found (caller should handle 404 state).
 */
export async function getProductDetail(slug) {
  if (!slug) return null
  const raw = await fetchWithFallback('/public/productos', null)
  if (!Array.isArray(raw)) return null
  const match = raw.find(
    (p) => (p.slug && p.slug === slug) || String(p.id) === String(slug),
  )
  if (!match) return null
  const detail = mapProductoDetail(match)
  // Relacionados: misma categoría (excluye el actual), completa con otros hasta 4.
  const others = raw.filter((p) => String(p.id) !== String(match.id))
  const sameCat = others.filter((p) => p.categoria && p.categoria === match.categoria)
  const rest = others.filter((p) => !sameCat.includes(p))
  detail.related = [...sameCat, ...rest].slice(0, 4).map(mapProducto)
  return detail
}

/**
 * getGuides()
 * Fetches /public/blog?tipo=guia and maps to the guide shape.
 * Falls back to the hardcoded guides from features/guides/data/guides.js.
 */
/**
 * getSiteConfig()
 * Config pública de la web (flags). Hoy: showPrices (mostrar/ocultar precios). Fallback: showPrices=true.
 */
export async function getSiteConfig() {
  // Vista previa: un token en la URL (?preview=<token>) se persiste en sessionStorage para que
  // sobreviva la navegación del SPA; se lo mandamos al backend, que devuelve preview_authorized
  // si matchea el token secreto de la cuenta. Con eso el PublishGate saltea el "en construcción".
  let previewToken = ''
  try {
    if (typeof window !== 'undefined') {
      const fromUrl = new URL(window.location.href).searchParams.get('preview')
      if (fromUrl) {
        previewToken = fromUrl
        window.sessionStorage.setItem('kt:preview', fromUrl)
      } else {
        previewToken = window.sessionStorage.getItem('kt:preview') || ''
      }
    }
  } catch {
    /* sessionStorage bloqueado (modo privado): sin preview persistente */
  }

  const path = previewToken
    ? `/public/web-config?preview_token=${encodeURIComponent(previewToken)}`
    : '/public/web-config'
  const cfg = await fetchWithFallback(path, null)
  return {
    showPrices: cfg ? cfg.show_prices !== false : true,
    // published: si la cuenta despublicó su web desde tiendita → false. Fail-open: si no hay
    // config (API caída) asumimos publicado para no dejar un sitio sano en "mantenimiento".
    published: cfg ? cfg.published !== false : true,
    // preview_authorized: el link de vista previa trae el token correcto → ver el sitio real.
    previewAuthorized: !!(cfg && cfg.preview_authorized === true),
  }
}

export async function getGuides() {
  // Data-driven: sin guías cargadas en tiendita → lista vacía (la página muestra empty state),
  // en vez de las guías hardcodeadas.
  const raw = await fetchWithFallback('/public/blog?tipo=guia', null)
  const mapped = mapBlogToGuides(raw)
  return mapped || []
}

/**
 * getFooterData()
 * Data del footer (que va en TODAS las páginas): logos de partners (marcas) + galería.
 * Data-driven: si la cuenta no tiene marcas/galería, devuelve arrays VACÍOS (el footer oculta
 * esas tiras) en vez de mostrar los partners/imágenes hardcodeados.
 */
export async function getFooterData() {
  const [igFeed, galeriaRaw, marcasRaw] = await Promise.all([
    fetchWithFallback('/public/instagram/feed', null),
    fetchWithFallback('/public/galeria', null),
    fetchWithFallback('/public/marcas', null),
  ])
  const gallery = mapGallery(igFeed, galeriaRaw) // { ..., images: [] } si no hay
  const clientLogos = mapMarcasToClientLogos(marcasRaw) // [] si no hay
  return {
    gallery: Array.isArray(gallery?.images) ? gallery.images : [],
    clientLogos: Array.isArray(clientLogos) ? clientLogos : [],
  }
}

/**
 * getGuideBySlug(slug)
 * Finds a single guide by slug from the remote list.
 * Falls back to the hardcoded entry if remote fails or slug is not found.
 */
export async function getGuideBySlug(slug) {
  if (!slug) return null
  const all = await getGuides()
  return all.find((g) => g.slug === slug) ?? null
}

/**
 * getDownloadInfo(id)
 * Fetches the branded download-redirect info for a product from the tiendita
 * public API: GET /public/download/{id}.
 * Uses the SAME base URL + X-Account-Host handling as the rest of the adapter.
 * Returns { nombre, imagen, target } (target may be null) or null if it fails.
 */
export async function getDownloadInfo(id) {
  if (!id) return null
  try {
    return await fetchJson(`/public/download/${encodeURIComponent(id)}`)
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Auth helpers (Fase 3)
// ---------------------------------------------------------------------------

/**
 * Builds the Google OAuth redirect URL.
 * Usage: window.location.href = getGoogleAuthUrl()
 */
export function getGoogleAuthUrl() {
  const front = encodeURIComponent(window.location.origin)
  return `${AUTH_BASE_URL}/public/auth/google?front=${front}&redirect=/`
}

/**
 * getSession()
 * Calls /public/me with session cookie. Returns user object or null.
 */
export async function getSession() {
  try {
    const res = await fetch(`${API_BASE_URL}/public/me`, {
      headers: buildHeaders(),
      credentials: 'include',
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

/**
 * logout()
 * POSTs to /public/logout to invalidate the session cookie.
 */
export async function logout() {
  try {
    await fetch(`${API_BASE_URL}/public/logout`, {
      method: 'POST',
      headers: buildHeaders(),
      credentials: 'include',
    })
  } catch {
    // Swallow — best-effort logout
  }
}

/**
 * requestOtp({ channel, identifier })
 * POSTs to /public/auth/otp/request.
 * channel: 'email' | 'whatsapp'
 * identifier: email address or phone number.
 * Always returns { ok: true } per contract — throws on network error.
 */
export async function requestOtp({ channel, identifier }) {
  const res = await fetch(`${API_BASE_URL}/public/auth/otp/request`, {
    method: 'POST',
    headers: buildHeaders(),
    credentials: 'include',
    body: JSON.stringify({ channel, identifier }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.message || `Error ${res.status}`)
  }
  return res.json()
}

/**
 * verifyOtp({ channel, identifier, code })
 * POSTs to /public/auth/otp/verify.
 * 200 → { ok: true, user: { nombre, email, telefono } } + sets httpOnly session cookie.
 * 422 → { ok: false, message } — throws an Error with that message.
 */
export async function verifyOtp({ channel, identifier, code }) {
  const res = await fetch(`${API_BASE_URL}/public/auth/otp/verify`, {
    method: 'POST',
    headers: buildHeaders(),
    credentials: 'include',
    body: JSON.stringify({ channel, identifier, code }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.ok === false) {
    throw new Error(data.message || `Error ${res.status}`)
  }
  return data
}
