const CACHE_STORAGE_KEY = 'kolortec-dynamic-translation-cache-v1'
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

function getCacheKey(text, from, to) {
  return `${from}->${to}:${normalizeText(text)}`
}

function getMyMemoryTranslatedText(payload) {
  if (!payload || typeof payload !== 'object') return ''
  return payload?.responseData?.translatedText || ''
}

function getLibreTranslatedText(payload) {
  if (!payload || typeof payload !== 'object') return ''
  return payload?.translatedText || ''
}

export async function autoTranslateText({ text, from = 'es', to = 'en' }) {
  const normalized = normalizeText(text)
  if (!normalized || from === to) return normalized

  readStoredCache()
  const cacheKey = getCacheKey(normalized, from, to)
  const cached = runtimeCache.get(cacheKey)
  if (cached) return cached

  try {
    let translated = ''
    const customEndpoint = import.meta.env.VITE_TRANSLATE_API_URL
    const customApiKey = import.meta.env.VITE_TRANSLATE_API_KEY

    if (customEndpoint) {
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
    } else {
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
    return finalText
  } catch {
    return normalized
  }
}

export function getAutoTranslatedTextTarget(text, targetLang) {
  const normalized = normalizeText(text)
  if (!normalized) return { normalized: '', sourceLang: targetLang }
  const sourceLang = detectTextLanguage(normalized)
  return { normalized, sourceLang }
}
