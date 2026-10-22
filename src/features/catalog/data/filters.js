/**
 * Facetas del catálogo (/products).
 *
 * ANTES esto era una taxonomía inventada —ejes "tipo / aplicación / fuente" con
 * opciones como `wash`, `teatro` o `discharge`— que se cruzaba contra unas `tags`
 * que cada categoría heredaba de un array de diseño local buscando POR SLUG. Los
 * slugs del tenant son `cabezal-movil`, `barras-de-led`, `strobo-blinder`… y los
 * del array decían `cabezales-moviles`, `barras-led`: el único que coincidía era
 * `laser`. Sin tags, el matcher devolvía `false` siempre y CUALQUIER opción daba
 * "sin coincidencias". La barra era decorativa.
 *
 * AHORA los ejes se DERIVAN del catálogo real: las categorías de la cuenta y las
 * etiquetas que los productos traen de la API. Es el mismo criterio que ya se
 * había tomado para las categorías ("en el build real NO se muestran las
 * hardcodeadas: eran data fantasma"). Un eje sin datos no se ofrece, así que no
 * puede existir una opción que no filtre nada.
 *
 * POR QUÉ `export let` + `syncFilterAxes()`: `CatalogFilterBar` importa
 * `FILTER_AXES` directamente del módulo y no recibe los ejes por prop (ese
 * archivo es de otro agente en esta tanda). Un `export let` es un binding VIVO de
 * ESM: reasignarlo acá lo actualiza en el importador, y el próximo render de la
 * barra —que ocurre igual, porque ShopPage hace setState con los mismos datos—
 * ya lee los ejes nuevos. Cuando se pueda tocar la barra, esto se reemplaza por
 * `<CatalogFilterBar axes={...}>` y `syncFilterAxes` desaparece.
 */

function slugifyFacet(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Las etiquetas llegan como [{label,color}] desde el adapter; se aceptan strings sueltos. */
function tagLabels(product) {
  if (!Array.isArray(product?.tags)) return []
  return product.tags
    .map((tag) => (typeof tag === 'string' ? tag : tag?.label))
    .filter((label) => typeof label === 'string' && label.trim() !== '')
    .map((label) => label.trim())
}

/**
 * Etiquetas de un producto como pares `{ id, label }` YA alineados. El id es el slug del label; una
 * etiqueta cuyo slug queda vacío («***») se descarta JUNTO con su label. Antes los ids y los labels se
 * armaban en dos listas y se emparejaban por índice: filtrar una y no la otra corría todos los labels.
 */
export function productTagOptions(product) {
  const out = []
  tagLabels(product).forEach((label) => {
    const id = slugifyFacet(label)
    if (id) out.push({ id, label })
  })
  return out
}

/** Ids de etiqueta de un producto, para cruzar contra lo elegido en la barra. */
export function productTagIds(product) {
  return productTagOptions(product).map((o) => o.id)
}

/**
 * Texto para buscar: sin acentos ni mayúsculas ni signos («movil» encuentra «Móvil»,
 * «cabezal-movil» se lee «cabezal movil»).
 */
export function normalizeSearch(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/**
 * ¿El producto coincide con lo escrito en el buscador? Busca en nombre, descripción, insignia,
 * ETIQUETAS y CATEGORÍA (su nombre en es/en y su slug). Cada palabra escrita tiene que aparecer
 * en alguna parte («cabezal rental» = cabezales con la etiqueta Rental). `categories` es la lista
 * de la cuenta (`{ slug, name, nameEn }`) para resolver el nombre de la categoría del producto.
 */
export function productMatchesQuery(product, query, categories = []) {
  const palabras = normalizeSearch(query).split(' ').filter(Boolean)
  if (palabras.length === 0) return true
  if (!product) return false
  const cat = (Array.isArray(categories) ? categories : []).find((c) => c && c.slug === product.category)
  const haystack = normalizeSearch(
    [
      product.name,
      product.description,
      product.badge,
      ...tagLabels(product),
      product.category,
      cat?.name,
      cat?.nameEn,
    ]
      .filter(Boolean)
      .join(' '),
  )
  return palabras.every((p) => haystack.includes(p))
}

/**
 * Deja sólo los valores de filtro que EXISTEN en los ejes que ofrece la barra: un `?etiqueta=xyz` o un
 * `?categoria=inventada` (link viejo o escrito a mano) se ignoran en vez de dar «Sin coincidencias».
 * Mismo criterio que CategoryPage con su etiqueta.
 */
export function sanitizeFilters(activeFilters, axes) {
  const out = {}
  Object.entries(activeFilters ?? {}).forEach(([key, ids]) => {
    const eje = (Array.isArray(axes) ? axes : []).find((a) => a.id === key)
    if (!eje) return
    const validos = new Set(eje.options.map((o) => o.id))
    const keep = (ids ?? []).filter((id) => validos.has(id))
    if (keep.length) out[key] = keep
  })
  return out
}

/**
 * Un eje con UNA sola opción no filtra nada (elegirla devuelve todo), así que no
 * se ofrece: es un control muerto disfrazado de control.
 */
const MIN_OPCIONES = 2

function buildAxes(categories, products) {
  const axes = []

  const catOptions = (Array.isArray(categories) ? categories : [])
    .filter((c) => c && c.slug)
    .map((c) => ({
      id: c.slug,
      label: c.name || c.slug,
      labelEn: c.nameEn || c.name || c.slug,
    }))
  if (catOptions.length >= MIN_OPCIONES) {
    axes.push({ id: 'categoria', label: 'Categoría', labelEn: 'Category', options: catOptions })
  }

  const vistas = new Set()
  const tagOptions = []
  ;(Array.isArray(products) ? products : []).forEach((product) => {
    productTagOptions(product).forEach(({ id, label }) => {
      if (vistas.has(id)) return
      vistas.add(id)
      tagOptions.push({ id, label, labelEn: label })
    })
  })
  tagOptions.sort((a, b) => a.label.localeCompare(b.label, 'es'))
  if (tagOptions.length >= MIN_OPCIONES) {
    axes.push({ id: 'etiqueta', label: 'Etiqueta', labelEn: 'Tag', options: tagOptions })
  }

  return axes
}

export let FILTER_AXES = []

// Firma barata para no reconstruir (ni cambiar la identidad de) los ejes cuando
// los datos que llegan son los mismos: reconstruir en cada render haría parpadear
// el desplegable abierto.
let firmaActual = ''

export function syncFilterAxes({ categories = [], products = [] } = {}) {
  const next = buildAxes(categories, products)
  const firma = next.map((a) => `${a.id}:${a.options.map((o) => o.id).join(',')}`).join('|')
  if (firma !== firmaActual) {
    firmaActual = firma
    FILTER_AXES = next
  }
  return FILTER_AXES
}

/**
 * Dentro de un eje las opciones suman (OR); entre ejes se cruzan (AND). Es lo que
 * espera cualquiera que marque dos categorías: quiere las dos, no la intersección
 * vacía.
 */
export function productMatchesFilters(product, activeFilters) {
  if (!product) return false

  const categorias = activeFilters?.categoria ?? []
  if (categorias.length > 0 && !categorias.includes(product.category)) return false

  const etiquetas = activeFilters?.etiqueta ?? []
  if (etiquetas.length > 0) {
    const propias = productTagIds(product)
    if (!etiquetas.some((id) => propias.includes(id))) return false
  }

  return true
}

export function countActiveFilters(activeFilters) {
  if (!activeFilters) return 0
  return Object.values(activeFilters).reduce((sum, arr) => sum + (arr?.length ?? 0), 0)
}
