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

import { defaultLandingContent } from '../../features/landing/data/landingData'
import { guides as hardcodedGuides } from '../../features/guides/data/guides'
import { resolveAccountHost } from './accountHost'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

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

async function fetchWithFallback(path, fallbackValue) {
  try {
    return await fetchJson(path)
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
 * /public/productos → products section (featured items)
 * Keeps the same structure as defaultLandingContent.products.
 */
function mapProductosToSection(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaultLandingContent.products
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
  // Try Instagram first
  if (igData && igData.connected && Array.isArray(igData.data) && igData.data.length > 0) {
    const images = igData.data
      .map((item) => item.media_url || item.thumbnail_url)
      .filter(Boolean)
    return {
      ...defaultLandingContent.gallery,
      images,
    }
  }
  // Fallback to /public/galeria
  if (Array.isArray(galeriaData) && galeriaData.length > 0) {
    const images = galeriaData
      .filter((item) => item.url)
      .map((item) => item.url)
    return {
      ...defaultLandingContent.gallery,
      images,
    }
  }
  return defaultLandingContent.gallery
}

/**
 * /public/web-config → support.contacts[]
 * Builds WhatsApp + email contact entries from empresa/whatsapp config keys.
 */
function mapWebConfigToSupport(cfg) {
  if (!cfg) return defaultLandingContent.support

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

  if (contacts.length === 0) return defaultLandingContent.support

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
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaultLandingContent.footer.clientLogos
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
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaultLandingContent.services
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
      // Fallback: wrap whole content in one section
      sections = [{ heading: '', body: post.contenido }]
    }

    return {
      slug: post.slug,
      title: post.titulo,
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

function mapHeroConfig(heroCfg) {
  const carousels = heroCfg?.carousels
  const scenes =
    Array.isArray(carousels) && carousels.length ? carousels[0]?.scenes : null
  if (!Array.isArray(scenes) || scenes.length === 0) {
    return defaultLandingContent.hero
  }

  const hrefOf = (b) =>
    b?.destination?.href || (b?.destination?.key ? `/${b.destination.key}` : null)

  const slides = scenes.map((scene, i) => {
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

  return {
    intervalMs: defaultLandingContent.hero?.intervalMs || 7000,
    slides,
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
export async function getLandingContent() {
  const [
    webConfig,
    productosRaw,
    igFeed,
    galeriaRaw,
    marcasRaw,
    serviciosRaw,
    heroCfgRaw,
  ] = await Promise.all([
    fetchWithFallback('/public/web-config', null),
    fetchWithFallback('/public/productos', null),
    fetchWithFallback('/public/instagram/feed', null),
    fetchWithFallback('/public/galeria', null),
    fetchWithFallback('/public/marcas', null),
    fetchWithFallback('/public/servicios', null),
    fetchWithFallback('/public/hero-config', null),
  ])

  const products = mapProductosToSection(productosRaw)
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
    // shop: static copy from defaults (text/cards are editorial, not from API)
    shop: defaultLandingContent.shop,
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
  const raw = await fetchWithFallback('/public/productos', null)
  if (!Array.isArray(raw) || raw.length === 0) {
    return defaultLandingContent.products.items
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
  return match ? mapProducto(match) : null
}

/**
 * getGuides()
 * Fetches /public/blog?tipo=guia and maps to the guide shape.
 * Falls back to the hardcoded guides from features/guides/data/guides.js.
 */
export async function getGuides() {
  const raw = await fetchWithFallback('/public/blog?tipo=guia', null)
  const mapped = mapBlogToGuides(raw)
  return mapped || hardcodedGuides
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
