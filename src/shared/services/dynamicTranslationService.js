// v2: desde que los nombres de producto se protegen (ver más abajo). Las
// traducciones viejas guardadas podían tener un nombre traducido adentro.
const CACHE_STORAGE_KEY = 'kolortec-dynamic-translation-cache-v2'
const MAX_CACHE_ENTRIES = 400

const runtimeCache = new Map()
let cacheLoaded = false

function readStoredCache() {
  if (cacheLoaded || typeof window === 'undefined') return
  cacheLoaded = true

  try {
    const raw = window.localStorage.getItem(CACHE_STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return
    Object.entries(parsed).forEach(([key, value]) => {
      if (typeof value === 'string' && value.trim()) {
        runtimeCache.set(key, value)
      }
    })
  } catch {
    // Ignore cache corruption and continue with in-memory cache only.
  }
}

function persistCache() {
  if (typeof window === 'undefined') return

  try {
    const entries = Array.from(runtimeCache.entries()).slice(-MAX_CACHE_ENTRIES)
    const serializable = Object.fromEntries(entries)
    window.localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(serializable))
  } catch {
    // Ignore localStorage errors (private mode, quota, etc).
  }
}

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

function detectTextLanguage(text) {
  const normalized = normalizeText(text).toLowerCase()
  if (!normalized) return 'es'

  const spanishHints = [' el ', ' la ', ' de ', ' para ', ' con ', ' y ', ' que ', ' una ', ' producto ', ' tecnico ', ' alta ']
  const englishHints = [' the ', ' for ', ' with ', ' and ', ' high ', ' product ', ' designed ', ' control ', ' output ', ' installation ']

  const padded = ` ${normalized} `
  const spanishScore = spanishHints.reduce((acc, token) => acc + (padded.includes(token) ? 1 : 0), 0)
  const englishScore = englishHints.reduce((acc, token) => acc + (padded.includes(token) ? 1 : 0), 0)

  return englishScore > spanishScore ? 'en' : 'es'
}

/*
 * Nombres de producto: NUNCA se traducen (pedido del cliente, 11-oct: «el nombre
 * es su identidad, esté en el idioma que esté»). Antes de mandar un texto al
 * traductor, cada nombre se cambia por un marcador KTnKT y a la vuelta se
 * repone tal como estaba escrito. Alfanumérico a propósito: con [[n]] el
 * LibreTranslate propio (translate.soytiendita.store) devolvía corchetes de más
 * o de menos en 3 de 5 frases («[[[0]]», «[1]]»); KTnKT pasó 5 de 5 ahí y en
 * MyMemory. Cerrado por los dos lados para que KT1KT no se confunda con KT10KT.
 *
 * La lista la carga contentService (setProtectedTermsLoader) con los nombres
 * del catálogo. Se pide una sola vez y se espera antes de la primera traducción:
 * el hero se traduce antes de que la home pida los productos.
 */
let protectedTerms = []
let termsLoader = null
let termsPromise = null

export function setProtectedTermsLoader(loader) {
  termsLoader = typeof loader === 'function' ? loader : null
  termsPromise = null
}

function ensureProtectedTerms() {
  if (!termsLoader) return Promise.resolve(protectedTerms)
  if (!termsPromise) {
    termsPromise = Promise.resolve()
      .then(() => termsLoader())
      .then((list) => {
        const unicos = new Set((Array.isArray(list) ? list : []).map(normalizeText).filter((t) => t.length >= 3))
        // Lista vacía = el catálogo no respondió (fetchWithFallback devuelve []):
        // se vuelve a pedir en la próxima traducción en vez de quedar sin
        // nombres protegidos toda la sesión (joan REG-002).
        if (unicos.size === 0) termsPromise = null
        // Los más largos primero: «BEAM 5R PRO» antes que «BEAM 5R».
        else protectedTerms = [...unicos].sort((a, b) => b.length - a.length)
        return protectedTerms
      })
      .catch(() => {
        termsPromise = null
        return protectedTerms
      })
  }
  return termsPromise
}

// Tope de espera por la lista de nombres: si el catálogo tarda o se cuelga, la
// traducción sigue con lo que haya (joan REG-001). Antes de este cambio la
// traducción no dependía del catálogo y no tiene que volverse más lenta por él.
const TERMS_TIMEOUT_MS = 2500

function protectedTermsWithTimeout() {
  let timer
  const tope = new Promise((resolve) => { timer = setTimeout(() => resolve(protectedTerms), TERMS_TIMEOUT_MS) })
  return Promise.race([ensureProtectedTerms(), tope]).finally(() => clearTimeout(timer))
}

const escapeRegex = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Cambia cada nombre protegido por KTnKT. Devuelve el texto y lo que se sacó. */
export function maskProtectedTerms(text, terms = protectedTerms) {
  const sacados = []
  if (!terms.length) return { masked: text, sacados }
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(?:${terms.map(escapeRegex).join('|')})(?![\\p{L}\\p{N}])`, 'giu')
  const masked = text.replace(re, (m) => {
    sacados.push(m)
    return `KT${sacados.length - 1}KT`
  })
  return { masked, sacados }
}

/** Repone los nombres. Tolera mayúsculas cambiadas o espacios: «kt 0 kt». */
export function unmaskProtectedTerms(text, sacados) {
  if (!sacados.length) return text
  return text.replace(/KT\s*(\d+)\s*KT/gi, (m, i) => (sacados[Number(i)] ?? m))
}

function getCacheKey(text, from, to) {
  return `${from}->${to}:${normalizeText(text)}`
}

function getMyMemoryTranslatedText(payload) {
  if (!payload || typeof payload !== 'object') return ''
  // MyMemory devuelve a veces HTTP 200 con el error DENTRO del body
  // (`responseStatus: 429` al agotarse la cuota diaria) y mete el aviso en
  // `translatedText`. Sin este guard ese cartel se muestra como si fuera la
  // traducción — y peor, queda cacheado en localStorage para siempre.
  const status = Number(payload.responseStatus)
  if (Number.isFinite(status) && status !== 200) return ''
  const text = payload?.responseData?.translatedText || ''
  if (/^\s*MYMEMORY\s+WARNING/i.test(text)) return ''
  return text
}

function getLibreTranslatedText(payload) {
  if (!payload || typeof payload !== 'object') return ''
  return payload?.translatedText || ''
}

export async function autoTranslateText({ text, from = 'es', to = 'en' }) {
  const original = normalizeText(text)
  if (!original || from === to) return original

  readStoredCache()
  const { masked: normalized, sacados } = maskProtectedTerms(original, await protectedTermsWithTimeout())
  // Si el texto ES un nombre (o sólo nombres), no hay nada que traducir.
  if (!normalized.replace(/KT\d+KT/g, '').replace(/[\s\p{P}]/gu, '')) return original
  // La clave lleva el texto ENMASCARADO: «Fluido para KT0KT» se traduce una vez
  // y sirve para cualquier producto.
  const cacheKey = getCacheKey(normalized, from, to)
  const cached = runtimeCache.get(cacheKey)
  if (cached) return unmaskProtectedTerms(cached, sacados)

  try {
    let translated = ''
    const customEndpoint = import.meta.env.VITE_TRANSLATE_API_URL
    const customApiKey = import.meta.env.VITE_TRANSLATE_API_KEY

    if (customEndpoint) {
      // El endpoint custom (LibreTranslate/Argos) puede estar caído o bloqueado
      // por CORS. Su error NO debe tumbar la traducción: se captura acá adentro
      // para poder caer a MyMemory abajo, en vez de propagar al catch general
      // (que devolvía el texto sin traducir). Esto pasaba de verdad:
      // translate.argosopentech.com — el valor de .env.example y .env.development —
      // dejó de responder, y la traducción quedó silenciosamente rota.
      try {
        const headers = { 'Content-Type': 'application/json' }
        if (customApiKey) {
          headers.Authorization = `Bearer ${customApiKey}`
        }

        const response = await fetch(customEndpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            q: normalized,
            source: from,
            target: to,
            format: 'text',
          }),
        })

        if (response.ok) {
          const data = await response.json()
          translated = getLibreTranslatedText(data)
        }
      } catch {
        translated = ''
      }
    }

    // Sin endpoint custom, o si ese no devolvió nada: MyMemory (público, sin key).
    if (!normalizeText(translated)) {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(normalized)}&langpair=${from}|${to}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        translated = getMyMemoryTranslatedText(data)
      }
    }

    const finalText = normalizeText(translated) || normalized
    runtimeCache.set(cacheKey, finalText)
    persistCache()
    return unmaskProtectedTerms(finalText, sacados)
  } catch {
    return original
  }
}

export function getAutoTranslatedTextTarget(text, targetLang) {
  const normalized = normalizeText(text)
  if (!normalized) return { normalized: '', sourceLang: targetLang }
  const sourceLang = detectTextLanguage(normalized)
  return { normalized, sourceLang }
}
