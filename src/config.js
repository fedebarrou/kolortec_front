/**
 * config.js — Fuente única de flags de build de kolortec.
 *
 * DEMO_MODE — "modo vidriera". Cuando VITE_DEMO_DATA === 'true' (build de Vercel para mostrarle al
 * cliente), los fallbacks caen a data MOCK para que el sitio se vea "lleno". En el build real/oficial
 * (VPS, flag ausente/false) todo es 100% data-driven: si tiendita no tiene info cargada, NO se inventa
 * nada (sin categorías/hero/líneas fantasma). Un solo codebase, dos builds.
 *
 * El guard `typeof import.meta` mantiene el módulo usable desde los scripts Node
 * (sitemap/prerender), que también importan la capa de datos.
 */
export const DEMO_MODE =
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_DEMO_DATA === 'true'
