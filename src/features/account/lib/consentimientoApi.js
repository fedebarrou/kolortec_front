/**
 * consentimientoApi.js — los dos fetch de «Mis datos» (el resto de la lógica es pura: consentimiento.js).
 *   GET  /public/me/consentimientos        -> { ok, estado, message }
 *   POST /public/me/consentimientos {canal:bool} -> { ok, estado, message }
 * Cambia sólo el transporte respecto del store (tiendita-store/lib/consentimiento.js): acá sale por
 * publicRequest del adapter de kolortec (X-Account-Host + cookie de sesión).
 */
import { publicRequest } from '../../../shared/services/contentService'

const SIN_RED = 'Sin conexión. Verificá tu red e intentá de nuevo.'

function mensajeDe(status, data, porDefecto) {
  if (status === 401) return 'Tu sesión expiró. Volvé a ingresar.'
  if (status === 429) return 'Hiciste muchos intentos seguidos. Esperá un minuto e intentá de nuevo.'
  // Un 5xx puede traer texto interno del servidor: nunca se le muestra al cliente.
  if (status >= 500) return porDefecto
  return (data && (data.message || data.error)) || porDefecto
}

export async function getMisConsentimientos() {
  try {
    const { ok, status, data } = await publicRequest('/public/me/consentimientos')
    if (!ok) return { ok: false, estado: null, message: mensajeDe(status, data, 'No pudimos cargar tus preferencias. Intentá de nuevo.') }
    return { ok: true, estado: data?.data || null }
  } catch {
    return { ok: false, estado: null, message: SIN_RED }
  }
}

export async function setMisConsentimientos(cuerpo) {
  try {
    const { ok, status, data } = await publicRequest('/public/me/consentimientos', { method: 'POST', body: cuerpo })
    if (!ok) return { ok: false, estado: null, message: mensajeDe(status, data, 'No pudimos guardar el cambio. Intentá de nuevo.') }
    return { ok: true, estado: data?.data || null }
  } catch {
    return { ok: false, estado: null, message: SIN_RED }
  }
}
