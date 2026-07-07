/**
 * accountHost.js — Resuelve a qué cuenta (tenant) de tiendita pertenece esta
 * storefront, para mandar el header X-Account-Host en cada request.
 *
 * Multi-tenant por dominio: el MISMO build/contenedor sirve N dominios. Cada
 * dominio público (kolortec.com, kolortec.com.ar, cliente.com, ...) se resuelve
 * por su propio hostname, que debe estar registrado en `account_domains` del
 * backend (DetectAccount lo mapea a la cuenta).
 *
 * En localhost/dev cae al valor de VITE_TIENDITA_ACCOUNT_HOST (la cuenta con la
 * que probás), así el desarrollo local sigue funcionando.
 */
const FALLBACK_HOST = import.meta.env?.VITE_TIENDITA_ACCOUNT_HOST || ''

export function resolveAccountHost() {
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const h = window.location.hostname.toLowerCase()
    if (h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local')) {
      return FALLBACK_HOST || h
    }
    return h.replace(/^www\./, '')
  }
  return FALLBACK_HOST
}
