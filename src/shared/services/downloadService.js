/**
 * downloadService.js — el camino REAL al archivo.
 *
 * Por qué existe este módulo (y por qué es UNO solo para las dos páginas que
 * ofrecen descargas, /descargas y la ficha de producto):
 *
 *  1. "Descargar" no descargaba NADA. Los dos botones abrían el diálogo de
 *     login, el diálogo mandaba al OAuth de Google y el OAuth vuelve a "/".
 *     En ningún punto de ese viaje se tocaba `item.url` —el archivo real, que
 *     existe y responde 200— ni quedaba registro de QUÉ archivo se había pedido.
 *     El usuario terminaba logueado, en la home, sin su archivo y sin saber por
 *     qué. Acá viven las tres piezas que faltaban: abrir el archivo, recordar la
 *     intención y recuperarla al volver.
 *
 *  2. La política de acceso (qué pide login y qué no) es UNA DECISIÓN, no un
 *     detalle de cada página. Si mañana el cliente dice "el firmware que lo baje
 *     cualquiera", se cambia UNA constante acá y cambia en los dos lados.
 */

import { getSession } from './contentService'

// ---------------------------------------------------------------------------
// Política de acceso
// ---------------------------------------------------------------------------

/**
 * Extensiones que piden identificarse antes de bajar.
 *
 * El corte NO es "documento técnico sí / documento comercial no": es
 * **lo que se lee** contra **lo que se instala en un equipo**.
 *
 * Un manual, una ficha técnica o una carta DMX son material de catálogo: el
 * fabricante los publica abiertos, Google los indexa y son parte de la decisión
 * de compra. Ponerles un muro sólo pierde consultas —y encima es un muro de
 * utilería, porque el archivo vive en una URL pública y responde 200 con o sin
 * sesión—.
 *
 * Un firmware, un instalador o una librería que se carga en la consola sí
 * justifican saber quién se los lleva: son archivos que pueden dejar un equipo
 * inutilizable si se aplican al modelo equivocado, y el distribuidor necesita
 * poder avisar cuando sale una revisión.
 *
 * ⚠️ Esto es una decisión de producto tomada por defecto, no un dato del
 * cliente. Está centralizada acá justamente para que confirmarla o cambiarla
 * sea una línea.
 */
export const EXT_CON_LOGIN = [
  'exe', 'msi', 'dmg', 'pkg', 'apk', // instaladores
  'bin', 'hex', 'fw', 'upd', // firmware
  'zip', 'rar', '7z', // paquetes (casi siempre firmware o librerías)
  'gdtf', 'mvr', 'ies', 'ldt', // perfiles de luminaria / fotometría
  'dwg', 'dxf', 'step', 'stp', // CAD
]

/** Normaliza la extensión venga como venga del adapter (`ext`, `type`, `extension`). */
function extDe(doc) {
  const bruto = doc?.ext ?? doc?.type ?? doc?.extension ?? ''
  return String(bruto).toLowerCase().replace(/^\./, '').trim()
}

/**
 * ¿Este documento pide sesión?
 *
 * QUIÉN MANDA ACÁ CAMBIÓ. La lista de arriba era la única política que existía,
 * y por eso no era una política: el archivo vivía en una URL pública del storage
 * y respondía 200 con o sin sesión, así que el muro lo dibujaba el navegador y
 * lo salteaba cualquiera que leyera el JSON del catálogo.
 *
 * Ahora la decisión la toma el backend (`App\Support\DocAccess`) y viaja en cada
 * documento como `requiere_login`. Lo protegido ya ni siquiera tiene URL de
 * storage: su `url` apunta a `/api/public/docs/{id}`, que exige la cookie de
 * cliente. O sea que este flag no ES la puerta —la puerta está en el servidor—:
 * lo único que hace es que el sitio ofrezca el diálogo de login ANTES de mandar
 * a alguien contra un 401.
 *
 * La lista queda como RESPALDO para los documentos que no traen el flag: un
 * payload viejo cacheado, o un adapter que todavía no lo propague al mapear.
 */
export function requiereLogin(doc) {
  const flag = doc?.requiere_login ?? doc?.requiereLogin ?? doc?.requires_login
  if (typeof flag === 'boolean') return flag

  return EXT_CON_LOGIN.includes(extDe(doc))
}

// ---------------------------------------------------------------------------
// Familia (manual / librería) — para los dos paneles de la ficha
// ---------------------------------------------------------------------------

/**
 * OJO: esto es un eje DISTINTO al de arriba. `requiereLogin` responde "¿hace
 * falta identificarse?"; `familiaDoc` responde "¿en qué panel se muestra?".
 * Una carta DMX en .csv es librería (va al panel de librerías) y NO pide login
 * (se lee, no se instala).
 *
 * El adapter ya clasifica igual en `getDownloads()` (contentService.js), pero
 * el shape de la ficha (`mapProductoDetail`) no emite `family`, así que la
 * ficha tenía que adivinar — y adivinaba con `/software|firmware/i` sobre el
 * label, que no matchea NUNCA con documentos que se llaman "Ficha técnica…" o
 * "Carta DMX…". Resultado: el panel de Librerías quedaba vacío siempre.
 * Si `doc.family` viene del adapter se respeta; si no, se deduce.
 */
const EXT_LIBRERIA = ['csv', 'gdtf', 'mvr', 'ies', 'ldt', 'zip', 'exe', 'dmg', 'dwg', 'step', 'stp', 'bin', 'hex', 'xml']
const RE_LIBRERIA = /dmx|gdtf|fotometr|photometr|firmware|librer|library|perfil|profile|\bcad\b|driver|controlador/i

export function familiaDoc(doc) {
  if (doc?.family === 'manual' || doc?.family === 'libreria') return doc.family
  if (EXT_LIBRERIA.includes(extDe(doc))) return 'libreria'
  if (RE_LIBRERIA.test(String(doc?.label || doc?.title || ''))) return 'libreria'
  return 'manual'
}

// ---------------------------------------------------------------------------
// Abrir el archivo
// ---------------------------------------------------------------------------

/** Nombre sugerido para el archivo guardado: "Carta DMX.csv" y no "carta-dmx-demo.csv". */
function nombreSugerido(doc) {
  const ext = extDe(doc)
  const base = String(doc?.label || 'documento').replace(/[\\/:*?"<>|]/g, '-').trim()
  if (!ext || base.toLowerCase().endsWith(`.${ext}`)) return base
  return `${base}.${ext}`
}

/**
 * Dispara la bajada. Se usa como fallback programático (por ejemplo al
 * recuperar una intención); donde se puede, la UI renderiza un <a> de verdad
 * —con href, `download` y target— para que el archivo sea copiable, abrible en
 * pestaña nueva y visible para un crawler.
 *
 * NOTA: los documentos viven en otro origen (api.…), así que el atributo
 * `download` lo ignora el navegador. Los PROTEGIDOS ya no sufren eso: salen por
 * `/api/public/docs/{id}`, que los sirve Laravel con `Content-Disposition:
 * attachment` y se guardan solos. Los ABIERTOS siguen viniendo del storage
 * crudo (que no manda ese header) y se ABREN en una pestaña — para una ficha
 * .pdf o una carta .csv eso es más bien lo que la gente espera.
 */
export function abrirArchivo(doc) {
  if (!doc?.url || typeof document === 'undefined') return false
  const a = document.createElement('a')
  a.href = doc.url
  a.download = nombreSugerido(doc)
  a.target = '_blank'
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  a.remove()
  return true
}

/** Props listos para un <a> real. Mismo criterio que `abrirArchivo`. */
export function propsDeDescarga(doc) {
  return {
    href: doc?.url || '#',
    download: nombreSugerido(doc),
    target: '_blank',
    rel: 'noopener noreferrer',
  }
}

// ---------------------------------------------------------------------------
// Intención pendiente (sobrevive al viaje al OAuth)
// ---------------------------------------------------------------------------

const INTENT_KEY = 'kt:download-intent'
// 20 min: suficiente para loguearse con calma, corto para que una intención
// vieja no reviva sola tres horas después.
const INTENT_TTL_MS = 20 * 60 * 1000

function safeSession() {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null
  } catch {
    return null // modo privado / storage bloqueado
  }
}

/** Se llama JUSTO ANTES de abrir el diálogo de login. */
export function guardarIntento(doc, volverA) {
  const ss = safeSession()
  if (!ss || !doc?.url) return
  try {
    ss.setItem(INTENT_KEY, JSON.stringify({
      url: doc.url,
      label: doc.label || '',
      ext: extDe(doc),
      volverA: volverA || (typeof window !== 'undefined' ? window.location.pathname : ''),
      ts: Date.now(),
    }))
  } catch {
    /* quota / storage bloqueado: se pierde la intención, no se rompe nada */
  }
}

/**
 * Lee la intención pendiente SIN borrarla. Devuelve null si no hay, si venció,
 * o si era para otra página.
 *
 * No consume a propósito: leer-y-borrar dentro de un efecto se rompe solo con
 * `<StrictMode>`, que monta el componente dos veces —la primera pasada se
 * llevaba la intención y la segunda ya no encontraba nada, así que el aviso no
 * aparecía nunca—. La intención la borra `olvidarIntento()` cuando el usuario
 * se lleva el archivo o cierra el aviso; si no, la mata el TTL.
 */
export function leerIntento(rutaActual) {
  const ss = safeSession()
  if (!ss) return null
  let crudo = null
  try {
    crudo = ss.getItem(INTENT_KEY)
  } catch {
    return null
  }
  if (!crudo) return null
  try {
    const intento = JSON.parse(crudo)
    if (!intento?.url) return null
    if (Date.now() - (intento.ts || 0) > INTENT_TTL_MS) {
      olvidarIntento()
      return null
    }
    if (rutaActual && intento.volverA && intento.volverA !== rutaActual) return null
    return intento
  } catch {
    return null
  }
}

export function olvidarIntento() {
  const ss = safeSession()
  if (!ss) return
  try {
    ss.removeItem(INTENT_KEY)
  } catch { /* noop */ }
}

// ---------------------------------------------------------------------------
// Sesión
// ---------------------------------------------------------------------------

/**
 * Una sola consulta a /public/me por carga de sitio, compartida por las dos
 * páginas. Sin esto, alguien YA logueado seguía viendo el diálogo de login para
 * siempre: el gate no miraba nunca si la sesión existía.
 */
let sesionPromesa = null

export function getSesionCacheada() {
  if (!sesionPromesa) sesionPromesa = getSession().catch(() => null)
  return sesionPromesa
}

/** Después de loguearse hay sesión nueva: el cache viejo miente. */
export function olvidarSesionCacheada() {
  sesionPromesa = null
}
