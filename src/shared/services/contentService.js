/**
 * contentService.js — Adapter layer between kolortec components and the
 * tiendita public API (https://api.soytiendita.store/api/public/*).
 *
 * Contract: the shapes returned by getLandingContent() MUST match the keys
 * expected by landing components (hero, gallery, products, shop, support,
 * distributor, rental, footer, brand, nav, action).
 *
 * Rules:
 *  - Every fetch includes X-Account-Host and credentials: 'include'.
 *  - Every remote fetch falls back to the matching key from defaultLandingContent
 *    if the request fails or returns unusable data.
 *  - hero is NEVER fetched remotely; it always comes from landingData defaults.
 */

import { defaultLandingContent } from '../../features/landing/data/landingData.js'
import { resolveAccountHost } from './accountHost.js'
import { DEMO_MODE } from '../../config.js'
import { normalizeScrollDesign } from '../../features/landing/_hero-renderer/scroll-contract.js'

// Valores admitidos de `slide.scrim`. 'kolortec' = 4 capas NEGRAS (look original);
// 'kolortec-light' = las mismas capas en crema, para escenas sobre fondo claro.
// Agregar un valor acá obliga a agregarlo en TODAS las whitelists (ver el
// contrato scroll-hero-contract.md, "regla de oro").
export const SCRIM_VALUES = ['kolortec', 'kolortec-light']


const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || ''

// Re-export para no romper los consumidores que ya importan DEMO_MODE desde este adapter
// (categories.js, useLandingContent.js). Fuente única en src/config.js.
export { DEMO_MODE }

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
/**
 * Etiquetas del producto. La API las emite como `badges` ([{label,color}], saneadas
 * por BadgeSanitizer: máximo 3, label ≤ 20 chars). Están a nivel producto (salen de
 * la variante principal) y también dentro de cada variante; se lee lo primero que
 * haya para no depender de que el producto tenga variantes cargadas.
 */
function mapBadges(p) {
  const raw = Array.isArray(p?.badges) && p.badges.length > 0
    ? p.badges
    : (Array.isArray(p?.variantes) ? p.variantes[0]?.badges : null)
  if (!Array.isArray(raw)) return []
  return raw
    .filter((b) => b && typeof b.label === 'string' && b.label.trim() !== '')
    .map((b) => ({ label: b.label.trim(), color: b.color || null }))
    .slice(0, 3)
}

/**
 * ¿Este item de `media` es una FOTO?
 *
 * La API emite `kind` ('image' | 'video') para cada item y `tipo` es el valor crudo
 * de la DB ('imagen' | 'video'), que se mira sólo de respaldo. Existe porque el
 * adapter venía tomando `media[0]` a ciegas: desde que la cuenta tiene videos
 * cargados, el primer media de un producto SIN fotos es un .mp4 y terminaba de
 * `src` de un <img> (naturalWidth 0, ícono de imagen rota) y hasta de `ogImage`.
 */
function esImagen(m) {
  if (!m || !m.url) return false
  if (m.kind) return m.kind === 'image'
  return String(m.tipo || 'imagen').toLowerCase() !== 'video'
}

/** URLs de las FOTOS del producto, en el orden que manda la API (principal primero). */
function imagenesDe(p) {
  return (Array.isArray(p?.media) ? p.media : []).filter(esImagen).map((m) => m.url)
}

function mapProducto(p) {
  return {
    id: p.id,
    name: p.nombre,
    description: p.descripcion,
    longDescription: p.descripcion,
    tags: mapBadges(p),
    // Sólo fotos: un producto sin fotos devuelve '' y la tarjeta muestra su
    // placeholder, en vez de intentar pintar el .mp4 como imagen.
    image: p.img_url || imagenesDe(p)[0] || '',
    category: p.categoria,
    // line: la LINEA de producto (campo libre en el admin). Se mapeaba a nada, asi
    // que /linea/:slug no tenia con que filtrar y content.lines quedaba huerfano.
    line: (p.linea ?? '').trim() || undefined,
    badge: p.destacado ? 'Destacado' : undefined,
    price: p.precio,
    moneda: p.moneda,
    stock: p.stock_disponible,
    slug: p.slug || String(p.id),
  }
}

/**
 * La API manda `size` en BYTES (número). La ficha lo imprime tal cual junto al tipo
 * ("597 - PDF"), así que sin formatear se lee como un número suelto sin unidad.
 * Devuelve '' cuando no hay dato, para que la ficha no muestre "0 B".
 */
function formatBytes(size) {
  const n = Number(size)
  if (!Number.isFinite(n) || n <= 0) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1).replace('.', ',')} KB`
  return `${(n / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`
}

/**
 * Mapea un producto de /public/productos al shape COMPLETO que consume ProductDetailPage.
 * Todo data-driven de la API (galería, precio, specs, docs, variantes). Los campos que la API no
 * tiene (videos, accesorios, family, tagline) quedan vacíos → la página oculta esas secciones.
 */
function mapProductoDetail(p) {
  // heroImage sale SIEMPRE de las fotos (ver esImagen). Si el producto no tiene
  // ninguna, queda '' a propósito: es el único valor con el que la ficha puede
  // saber que no hay foto y dibujar un placeholder en vez de un <img> roto.
  const gallery = imagenesDe(p)
  const heroImage = p.img_url || gallery[0] || ''
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
    tags: mapBadges(p),
    technicalSpecs: (Array.isArray(p.specs) ? p.specs : [])
      .filter((s) => s && (s.nombre || s.valor))
      .map((s) => [s.nombre || '', s.valor || '']),
    // `family` ('manual' | 'libreria') sale del MISMO clasificador que /descargas
    // (clasificarDoc, más abajo — es una function declaration, así que está hoisted).
    // La ficha venía separando los dos paneles con un /software|firmware/i sobre el
    // label, que no matchea ningún documento real de la cuenta: el panel "Librerías"
    // quedaba siempre vacío aunque el doc estuviera tipificado como 'controlador'.
    downloads: (Array.isArray(p.docs) ? p.docs : [])
      .filter((d) => d && d.url)
      .map((d) => ({
        label: d.title || 'Documento',
        size: formatBytes(d.size),
        type: String(d.extension || d.tipo || '').toUpperCase(),
        url: d.url,
        family: clasificarDoc(d),
      })),
    // Material externo: links de referencia cargados en el admin (productos.material_externo).
    // La API los venía emitiendo y tiendita-store ya los mostraba, pero este adapter no los
    // leía, así que en kolortec no se veían nunca por más que estuvieran cargados.
    materialExterno: (Array.isArray(p.material_externo) ? p.material_externo : [])
      .filter((l) => l && l.url)
      .map((l) => ({ label: l.label || l.url, url: l.url })),
    variants: (Array.isArray(p.variantes) ? p.variantes : [])
      .map((v) => ({ id: v.id, sku: v.sku, price: v.precio, image: heroImage })),
    // La API no guarda un poster del video, así que `thumbnail` es la foto del
    // producto: sirve de tapa provisoria, pero es un retrato y la ficha la recorta
    // a 16:9. `null` cuando no hay foto — antes caía en `heroImage`, que en un
    // producto sin fotos era la URL del .mp4 metida en un <img>.
    // La tapa REAL la tiene que dar el propio archivo (<video preload="metadata">):
    // eso vive en el componente, no acá.
    videos: (Array.isArray(p.media) ? p.media : [])
      .filter((m) => m && m.kind === 'video' && m.url)
      .map((m, i) => ({ title: `${p.nombre} · Video ${i + 1}`, url: m.url, thumbnail: heroImage || null })),
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
 * /public/servicios → services section
 *
 * NO EXISTÍA: /servicios era la única página del sitio que se dibujaba con
 * `defaultLandingContent.services` —tres fotos de Unsplash y los títulos
 * LIGHTING / QUALITY / SUPPORT—, así que no se podía editar desde el admin ni
 * cambiaba con ES/EN. El endpoint del back estaba desde siempre; lo que faltaba
 * era este mapeo.
 *
 * La API manda { id, nombre, descripcion, duracion_min, precio, img_url, imagenes[] }.
 * Se emite el texto en `subtitle` Y en `description` a propósito: la data mock usa
 * `subtitle` y la ServicesPage lee `description`, así que hoy la página imprime un
 * párrafo vacío. Mandando los dos, el arreglo de la página no depende de este archivo.
 */
function mapServicios(raw) {
  if (!Array.isArray(raw) || raw.length === 0) {
    // Data-driven, igual que el resto del adapter: sin servicios cargados NO se
    // caen los tres mock (eran "servicios inventados"). En vidriera sí, es la demo.
    return DEMO_MODE
      ? defaultLandingContent.services
      : { ...defaultLandingContent.services, items: [] }
  }
  return {
    ...defaultLandingContent.services,
    items: raw
      .filter((s) => s && s.nombre)
      .map((s) => ({
        id: s.id,
        title: s.nombre,
        subtitle: s.descripcion || '',
        description: s.descripcion || '',
        image: s.img_url || s.imagenes?.find((i) => i?.url)?.url || '',
        precio: s.precio ?? null,
      })),
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
        // A CONTACTO, no a /descargas: el boton dice "contactar", no "descargar".
        label: 'Contactar soporte técnico',
        href: '/contacto',
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

/**
 * labConfigFromCarousel — arma el config del renderer a partir de un design
 * (carrusel O scrolltelling) del payload de /public/hero-config.
 *
 * ⚠ ESPEJO de tiendita-store/lib/api.js#labConfigFromCarousel. El renderer de
 * kolortec es byte-idéntico al del store/admin, así que el mapeo de entrada
 * también tiene que serlo: si cambia allá, cambiar acá.
 *
 * `marker` (fracción 0..1 del tramo de video/frames) y `scrim` ('kolortec' = las
 * 4 capas fijas de legibilidad) solo se propagan cuando vienen: un design de
 * carrusel no los trae y el renderer los trata como ausentes.
 */
function labConfigFromCarousel(carousel) {
  const scenes = Array.isArray(carousel?.scenes) ? carousel.scenes : []
  const isLab = scenes.some((s) => s?.builder === 'lab' || Array.isArray(s?.elements))
  if (!isLab) return null
  // filter por objeto: el back puede emitir null para scenes corruptas en DB.
  const publicScenes = scenes.filter((s) => s && typeof s === 'object' && !s.hidden)
  if (publicScenes.length === 0) return null
  return normalizeScrollDesign({
    version: 1,
    settings: carousel?.settings ?? null,
    theme: carousel?.theme ?? DEFAULT_THEME,
    background: carousel?.background ?? { type: 'none' },
    slides: publicScenes.map((s) => ({
      id: s.id,
      overlay: s.overlay ?? 0.2,
      background: s.background ?? null,
      elements: Array.isArray(s.elements) ? s.elements : [],
      ...(typeof s.marker === 'number' ? { marker: s.marker } : {}),
      ...(SCRIM_VALUES.includes(s.scrim) ? { scrim: s.scrim } : {}),
    })),
  })
}

function mapHeroConfig(heroCfg) {
  const carousels = heroCfg?.carousels
  const hasVisibleScene = (item) => Array.isArray(item?.scenes) && item.scenes.some((scene) => !scene?.hidden)
  // Un design de scrolltelling NUNCA puede usarse como Encabezado: son cosas
  // distintas (la historia se renderiza con ScrollRenderer, no con el carrusel).
  const isCarouselDesign = (item) => item?.settings?.mode !== 'scroll'
  // El Encabezado usa el design de `active_carousel_id`. ANTES se tomaba
  // carousels[0], que funcionaba de casualidad mientras hubo un solo design;
  // desde que el payload trae también el scrolltelling, tomar el primero podía
  // renderizar la historia como carrusel. Si el activo no tiene escenas
  // visibles, caemos al primero que sí las tenga (misma decisión que el store:
  // preferimos mostrar otro design antes que dejar el hero en blanco), pero
  // SOLO entre los de carrusel: una cuenta que tiene únicamente scrolltelling
  // (el caso de kolortec) caía en el scroll y lo pintaba como hero estático —
  // y encima el guard anti-doble-render dejaba la historia sin renderizar.
  const activeCarousel = Array.isArray(carousels)
    ? carousels.find((item) => item?.id === heroCfg?.active_carousel_id && isCarouselDesign(item))
    : null
  const carousel = hasVisibleScene(activeCarousel)
    ? activeCarousel
    : (Array.isArray(carousels) ? carousels.find((c) => isCarouselDesign(c) && hasVisibleScene(c)) : null) || activeCarousel || null

  // ── Sección Scrolltelling (independiente del Encabezado) ──────────────────
  // Design de `active_scroll_id`. Guard anti-doble-render: si es el MISMO
  // design que ya muestra el Encabezado, la sección no recibe config (null).
  const scrollList = Array.isArray(carousels) ? carousels.filter((c) => c?.settings?.mode === 'scroll') : []
  const scrollDesign = scrollList.find((c) => c?.id === heroCfg?.active_scroll_id) || null
  const scrollLabConfig = scrollDesign && scrollDesign.id !== carousel?.id
    ? labConfigFromCarousel(scrollDesign)
    : null

  const scenes = carousel?.scenes
  if (!Array.isArray(scenes) || scenes.length === 0) {
    // Sin carrusel creado en tiendita: mock solo en modo vidriera; en real, hero sin slides
    // (la sección se oculta) en vez de mostrar los 3 slides hardcodeados (data fantasma).
    // OJO: el scrolltelling es independiente del Encabezado — se devuelve igual
    // aunque no haya carrusel, si no la historia desaparecería con él.
    return DEMO_MODE
      ? { ...defaultLandingContent.hero, scrollLabConfig }
      : { intervalMs: defaultLandingContent.hero?.intervalMs || 7000, slides: [], labConfig: null, scrollLabConfig }
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
  // Usa el MISMO helper que el scrolltelling para que el mapeo de entrada sea
  // uno solo (antes esto estaba duplicado inline y se quedaba atrás).
  const labConfig = isLab ? labConfigFromCarousel(carousel) : null

  return {
    intervalMs: defaultLandingContent.hero?.intervalMs || 7000,
    slides,
    labConfig,
    scrollLabConfig,
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
/**
 * slugifyLinea(nombre) — la MISMA cuenta en los dos lados.
 *
 * La linea es un campo libre del admin ("Golden Line", "Beam"), no una entidad
 * con slug propio. La URL se deriva del nombre, asi que esta funcion tiene que
 * ser la unica fuente: si la pagina slugifica distinto de quien arma el link, el
 * acceso del hero apunta a una pagina que no existe.
 */
export function slugifyLinea(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * getLines() — las lineas de producto de la cuenta, con su slug y cuantos productos
 * tiene cada una. Es lo que hace falta para armar /linea/:slug y para saber que URL
 * pegar en el acceso de un hero.
 *
 * Devuelve [] si ningun producto tiene `linea` cargada: no se inventan lineas.
 */
export async function getLines() {
  const raw = await fetchWithFallback('/public/productos', null)
  if (!Array.isArray(raw)) return []
  const porSlug = new Map()
  for (const p of raw) {
    const nombre = (p?.linea ?? '').trim()
    if (!nombre) continue
    const slug = slugifyLinea(nombre)
    if (!slug) continue
    const actual = porSlug.get(slug)
    if (actual) actual.count += 1
    else porSlug.set(slug, { name: nombre, slug, count: 1 })
  }
  return [...porSlug.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function deriveLines(raw) {
  const list = Array.isArray(raw)
    ? Array.from(new Set(raw.map((p) => (p?.linea ?? '').trim()).filter(Boolean)))
    : []
  if (list.length) return list
  // Sin líneas reales: solo mock en modo vidriera; en real no se inventan líneas.
  return DEMO_MODE ? (defaultLandingContent.lines ?? []) : []
}

/**
 * POST /public/contact — consulta o postulacion desde un formulario publico.
 *
 * Reusa el endpoint de contacto que ya existe en vez de tener uno propio: ese
 * ya guarda la consulta y avisa al tenant por mail y WhatsApp. Lo unico que
 * distingue una postulacion de una consulta comun es `origen`, que el back
 * valida contra una whitelist.
 *
 * @param {{nombre:string, email?:string, telefono?:string, mensaje?:string, origen?:string}} datos
 */
export async function enviarConsultaPublica(datos) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured')
  }
  const response = await fetch(`${API_BASE_URL}/public/contact`, {
    method: 'POST',
    headers: buildHeaders(),
    credentials: 'include',
    body: JSON.stringify(datos),
  })
  if (!response.ok) {
    const cuerpo = await response.json().catch(() => null)
    throw new Error(cuerpo?.message || `Request failed: ${response.status}`)
  }
  return response.json()
}

export async function getLandingContent() {
  const [
    webConfig,
    productosRaw,
    igFeed,
    galeriaRaw,
    marcasRaw,
    heroCfgRaw,
    guides,
  ] = await Promise.all([
    fetchWithFallback('/public/web-config', null),
    fetchWithFallback('/public/productos', null),
    fetchWithFallback('/public/instagram/feed', null),
    fetchWithFallback('/public/galeria', null),
    fetchWithFallback('/public/marcas', null),
    fetchWithFallback('/public/hero-config', null),
    getGuides(),
  ])

  const products = mapProductosToSection(productosRaw)
  const lines = deriveLines(productosRaw)
  const gallery = mapGallery(igFeed, galeriaRaw)
  const support = mapWebConfigToSupport(webConfig)
  const clientLogos = mapMarcasToClientLogos(marcasRaw)
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
 * getServicios()
 * Los servicios de la cuenta para /servicios. Shape: { title, items[] } — el mismo
 * que `defaultLandingContent.services`, así que la página cambia una línea
 * (`defaultLandingContent.services` → lo que devuelve esto) y nada más.
 * Sin servicios cargados devuelve items: [] (la página muestra su empty state).
 */
export async function getServicios() {
  const raw = await fetchWithFallback('/public/servicios', null)
  return mapServicios(raw)
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
  // 10 y no 4: los relacionados pasaron de ser una grilla fija de 4 a un carrusel.
  // Con 4 items el track no llena la pantalla y la tira gira medio vacía.
  detail.related = [...sameCat, ...rest].slice(0, 10).map(mapProducto)
  return detail
}

/**
 * getGuides()
 * Fetches /public/blog?tipo=guia and maps to the guide shape.
 * Falls back to the hardcoded guides from features/guides/data/guides.js.
 */
/**
 * getSiteConfig()
 * Config pública de la web (flags): showPrices, showReviews, published. Los flags que
 * faltan se asumen en TRUE — la misma regla que aplica el back cuando la cuenta
 * todavía no los configuró.
 */
/**
 * Path de /public/web-config, con el token de vista previa si lo hay.
 *
 * Vive aparte porque el path ES la clave de `_publicFetchCache`: todo el que
 * quiera un dato del web-config tiene que armarlo IGUAL para pegar en la misma
 * promesa. Si un llamador arma el path a mano y se olvida el token, no sólo
 * paga una request de más: pide una config distinta (sin autorizar) y puede
 * llevarse el sitio despublicado.
 *
 * Vista previa: un token en la URL (?preview=<token>) se persiste en
 * sessionStorage para que sobreviva la navegación del SPA; se lo mandamos al
 * backend, que devuelve preview_authorized si matchea el token secreto de la
 * cuenta. Con eso el PublishGate saltea el "en construcción".
 */
function webConfigPath() {
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

  return previewToken
    ? `/public/web-config?preview_token=${encodeURIComponent(previewToken)}`
    : '/public/web-config'
}

/**
 * Canales de WhatsApp de la cuenta, en dígitos E164: { ventas, soporte, contacto }.
 *
 * Lee el mapa CRUDO de /public/web-config en vez de reconocer contactos por su
 * `label` dentro de `support.contacts`: el label es texto de presentación (y
 * traducible), así que atar el canal a él es atarlo a una decisión de copy.
 *
 * El gate de habilitación lo hace el backend, no nosotros: en `whatsappMap()`
 * el `phone` sale en null salvo que la conexión esté `verified`. Un canal con
 * número es un canal habilitado; los demás no llegan.
 *
 * Sale por el MISMO path que getSiteConfig(), que PublishGate ya pide en toda
 * página: pega en la promesa cacheada y no cuesta una sola request extra.
 */
export async function getContactChannels() {
  const cfg = await fetchWithFallback(webConfigPath(), null)
  const crudo = cfg?.whatsapp
  if (!crudo || typeof crudo !== 'object') return {}

  const canales = {}
  for (const canal of ['ventas', 'soporte', 'contacto']) {
    const digitos = String(crudo[canal]?.phone ?? '').replace(/\D+/g, '')
    if (digitos.length >= 6) canales[canal] = digitos
  }
  return canales
}

export async function getSiteConfig() {
  const cfg = await fetchWithFallback(webConfigPath(), null)
  return {
    showPrices: cfg ? cfg.show_prices !== false : true,
    // Comentarios de producto: el tenant los puede apagar desde el admin.
    showReviews: cfg ? cfg.show_reviews !== false : true,
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
 * Busca una nota por slug. Primero en las guías (/public/blog?tipo=guia); si no
 * está, pide el post por slug directo.
 *
 * El fallback existe porque las notas que se linkean desde la ficha de producto
 * (getProductBlogs) NO son necesariamente `tipo=guia`: son cualquier post asociado
 * al producto en el admin. Sin esto, esos links caían en un 404 del detalle.
 */
export async function getGuideBySlug(slug) {
  if (!slug) return null
  const all = await getGuides()
  const found = all.find((g) => g.slug === slug)
  if (found) return found

  const raw = await fetchWithFallback(`/public/blog?slug=${encodeURIComponent(slug)}`, null)
  const mapped = mapBlogToGuides(raw)
  return mapped?.[0] ?? null
}

// ---------------------------------------------------------------------------
// Descargas (manuales y librerías de toda la línea)
// ---------------------------------------------------------------------------

/**
 * Clasifica un documento en las DOS familias que la marca ofrece al público:
 *
 *  - `manual`   → lo que se LEE: manuales, fichas técnicas, guías rápidas. PDFs.
 *  - `libreria` → lo que se CARGA en un equipo o en una consola: cartas DMX,
 *                 perfiles GDTF, fotometría IES, firmware, CAD.
 *
 * Se mira primero el `tipo` que puso el tenant en el admin (en kolortec hoy son
 * `pdf` y `controlador`) y después la extensión y el nombre, porque `tipo` es un
 * campo libre y otra cuenta puede llenarlo distinto. Ante la duda cae en manual:
 * es lo que más se busca y lo que menos molesta si está mal clasificado.
 */
const EXT_LIBRERIA = ['csv', 'gdtf', 'ies', 'ldt', 'zip', 'exe', 'dmg', 'dwg', 'step', 'stp', 'bin', 'hex']
const RE_LIBRERIA = /dmx|gdtf|fotometr|photometr|firmware|librer|library|perfil|profile|cad|driver|controlador/i

function clasificarDoc(doc) {
  const tipo = String(doc?.tipo || '').toLowerCase()
  if (tipo === 'controlador' || RE_LIBRERIA.test(tipo)) return 'libreria'
  const ext = String(doc?.extension || '').toLowerCase()
  if (EXT_LIBRERIA.includes(ext)) return 'libreria'
  if (RE_LIBRERIA.test(String(doc?.title || ''))) return 'libreria'
  return 'manual'
}

/**
 * getDownloads()
 * Todos los documentos descargables de la cuenta, aplanados desde los productos
 * (`productos.docs`) y con el producto al que pertenecen adentro de cada fila.
 *
 * La página de descargas antes listaba 16 archivos HARDCODEADOS —nombres de
 * productos que no existen y botones que no bajaban nada—, mientras la API ya
 * emitía los documentos reales de cada equipo. Esto es la misma fuente que usa
 * la ficha de producto: un documento cargado en el admin aparece en los dos lados.
 *
 * Shape: [{ id, label, product, productSlug, category, family, ext, size, url }]
 */
export async function getDownloads() {
  const raw = await fetchWithFallback('/public/productos', null)
  if (!Array.isArray(raw)) return []

  const out = []
  raw.forEach((p) => {
    const docs = Array.isArray(p.docs) ? p.docs : []
    docs.forEach((d) => {
      if (!d || !d.url) return
      out.push({
        id: `${p.id}-${d.id || d.url}`,
        label: d.title || 'Documento',
        product: p.nombre || '',
        productSlug: p.slug || String(p.id),
        category: p.categoria || '',
        family: clasificarDoc(d),
        ext: String(d.extension || d.tipo || '').toUpperCase(),
        size: formatBytes(d.size),
        url: d.url,
      })
    })
  })

  // Por producto y, dentro de cada uno, manuales antes que librerías: es el orden
  // en el que alguien busca ("el manual del BEAM 5R, y de paso su carta DMX").
  return out.sort((a, b) => {
    const porProducto = a.product.localeCompare(b.product, 'es')
    if (porProducto !== 0) return porProducto
    if (a.family !== b.family) return a.family === 'manual' ? -1 : 1
    return a.label.localeCompare(b.label, 'es')
  })
}

/**
 * getProductBlogs(productId)
 * Notas del blog ASOCIADAS a un producto (relación productos ↔ blog_posts que ya
 * existe en tiendita): GET /public/blog?producto_id=X. Sin notas asociadas → [],
 * y la ficha oculta la sección.
 */
export async function getProductBlogs(productId) {
  if (!productId) return []
  const raw = await fetchWithFallback(
    `/public/blog?producto_id=${encodeURIComponent(productId)}`,
    null,
  )
  return mapBlogToGuides(raw) || []
}

// ---------------------------------------------------------------------------
// Reseñas de producto (comentarios)
// ---------------------------------------------------------------------------

/**
 * getProductReviews(productId)
 * GET /public/productos/{id}/resenas → { avg_rating, count, reviews[], mine }.
 *
 * NO pasa por fetchWithFallback a propósito: esa cache guarda la promesa por toda
 * la sesión, y acá hace falta releer justo después de publicar un comentario.
 * `credentials: include` es lo que hace que el back reconozca la sesión y devuelva
 * `mine` (tu propio comentario, aunque todavía esté pendiente de aprobación).
 */
export async function getProductReviews(productId) {
  if (!productId) return { avgRating: 0, count: 0, reviews: [], mine: null }
  try {
    const data = await fetchJson(`/public/productos/${encodeURIComponent(productId)}/resenas`)
    return {
      avgRating: Number(data?.avg_rating) || 0,
      count: Number(data?.count) || 0,
      reviews: Array.isArray(data?.reviews) ? data.reviews : [],
      mine: data?.mine ?? null,
    }
  } catch {
    return { avgRating: 0, count: 0, reviews: [], mine: null }
  }
}

/**
 * submitProductReview({ productId, rating, comentario })
 * POST /public/resenas. Requiere sesión pública (el back exige auth.public): la
 * ficha sólo muestra el formulario a quien está logueado.
 * La reseña nace con aprobado=false — se ve en la web recién cuando la aprueban
 * desde el admin de tiendita. Devuelve { ok } o lanza con el mensaje del server.
 */
export async function submitProductReview({ productId, rating, comentario }) {
  const res = await fetch(`${API_BASE_URL}/public/resenas`, {
    method: 'POST',
    headers: buildHeaders(),
    credentials: 'include',
    body: JSON.stringify({
      producto_id: productId,
      rating: Number(rating),
      ...(comentario ? { comentario } : {}),
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || `Error ${res.status}`)
    err.status = res.status
    throw err
  }
  return data
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
 * Arma la URL de OAuth con Google.
 *
 * `redirect` es a DÓNDE vuelve la persona después de identificarse. Antes estaba
 * clavado en '/': quien hacía click en "Descargar" iba a Google y volvía a la
 * home, sin su archivo y sin nada que le explicara por qué. La intención se
 * guarda aparte (downloadService), pero recién se cobra cuando vuelve sola a esa
 * página; devolviéndola al lugar donde estaba, se cobra de una.
 *
 * Sólo se acepta un PATH del propio sitio. Una URL absoluta acá sería un open
 * redirect: bastaría con mandar a alguien a
 * `…/auth/google?redirect=https://sitio-falso` para que termine ahí después de
 * loguearse, con la confianza de venir de una pantalla de Google. Se descarta
 * todo lo que no arranque con una sola barra ('//host' es protocol-relative y
 * también apunta afuera).
 *
 * El backend TIENE que validar lo mismo: esto es defensa del lado del cliente y
 * no impide que alguien arme la URL a mano.
 *
 * Uso: window.location.href = getGoogleAuthUrl(window.location.pathname)
 */
export function getGoogleAuthUrl(redirect = '/') {
  const front = encodeURIComponent(window.location.origin)
  const destino = typeof redirect === 'string' && /^\/(?!\/)/.test(redirect) ? redirect : '/'
  return `${AUTH_BASE_URL}/public/auth/google?front=${front}&redirect=${encodeURIComponent(destino)}`
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
