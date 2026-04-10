import { defaultLandingContent } from '../../features/landing/data/landingData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

async function fetchJson(path) {
  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured')
  }
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`)
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

export async function getLandingContent() {
  const [
    brand,
    nav,
    hero,
    gallery,
    products,
    shop,
    services,
    support,
    action,
    footer,
  ] = await Promise.all([
    fetchWithFallback('/landing/brand', defaultLandingContent.brand),
    fetchWithFallback('/landing/nav', defaultLandingContent.nav),
    fetchWithFallback('/landing/hero', defaultLandingContent.hero),
    fetchWithFallback('/landing/gallery', defaultLandingContent.gallery),
    fetchWithFallback('/landing/products', defaultLandingContent.products),
    fetchWithFallback('/landing/shop', defaultLandingContent.shop),
    fetchWithFallback('/landing/services', defaultLandingContent.services),
    fetchWithFallback('/landing/support', defaultLandingContent.support),
    fetchWithFallback('/landing/action', defaultLandingContent.action),
    fetchWithFallback('/landing/footer', defaultLandingContent.footer),
  ])

  return {
    brand,
    nav,
    hero,
    gallery,
    products,
    shop,
    services,
    support,
    action,
    footer,
  }
}

export async function getShopProducts() {
  return fetchWithFallback('/products', defaultLandingContent.products.items)
}
