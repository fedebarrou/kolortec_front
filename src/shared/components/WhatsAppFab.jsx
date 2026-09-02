import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../i18n/LanguageProvider'
import { getContactChannels } from '../services/contentService'
import { WHATSAPP_NUMBER, WHATSAPP_VISIBLE } from './SocialLinks'

/* ─────────────────────────────────────────────────────────────────────────────
   RESPALDO, no la fuente.
   La fuente del número es la CUENTA: /public/web-config emite
   whatsapp.{ventas,soporte,contacto} como { phone, status }, y los leemos con
   `getContactChannels()`. El respaldo es la casa central de Kolortec y se usa
   cuando la API no contesta, cuando la cuenta todavía no cargó el canal, o
   cuando el número no está habilitado.
   Se importa de SocialLinks, que es la fuente única de los contactos públicos:
   antes esta constante estaba duplicada acá y el sitio llegó a tener DOS
   números distintos (la fila social y el "Consulta" de la ficha apuntaban a un
   relleno inexistente). Un solo lugar para cambiarlo.
   Lo único que sale de la API es el NÚMERO: el flotante se muestra SIEMPRE. En
   particular NO se gatea con `sections.whatsapp`, que hoy viene en false porque
   se deriva de "¿hay algún teléfono cargado?" — atarle la visibilidad borraría
   el botón de kolortec ahora mismo y en producción.
   ────────────────────────────────────────────────────────────────────────── */
const WHATSAPP_RESPALDO_E164 = WHATSAPP_NUMBER
const WHATSAPP_RESPALDO_VISIBLE = WHATSAPP_VISIBLE

/* Los dos botones del panel y de dónde sale el número de cada uno, EN ORDEN.
   Primero el canal propio; si el tenant no lo cargó, el WhatsApp genérico de
   contacto; si tampoco, el otro canal — un único número verificado tiene que
   encender los dos botones, no dejar uno muerto; y recién ahí la casa central.

   Que esto se use no es la excepción: hoy los tres canales de kolortec vienen
   con `phone: null` / `status: "none"`, porque el back manda el número SÓLO
   cuando la conexión está `verified` (whatsappMap → waDigits). Hasta que el
   dueño verifique un WhatsApp desde el admin, el camino normal es el respaldo.
   No es un bug: no lo "arregles" sacando el fallback. */
const CANALES = [
  { id: 'ventas', orden: ['ventas', 'contacto', 'soporte'] },
  { id: 'soporte', orden: ['soporte', 'contacto', 'ventas'] },
]

/**
 * Dígitos E164 → texto legible. Con el número de la casa devolvemos la constante
 * tal cual (es la única forma de garantizar que lo que se lee sea exactamente lo
 * que aprobó el dueño); para cualquier otro número argentino armamos el formato
 * de siempre, y si no matchea, el E164 con '+' adelante antes que un string roto.
 */
function aVisible(digitos) {
  if (!digitos) return WHATSAPP_RESPALDO_VISIBLE
  if (digitos === WHATSAPP_RESPALDO_E164) return WHATSAPP_RESPALDO_VISIBLE
  const ar = digitos.match(/^54(9)?(\d{2,4})(\d{4})(\d{4})$/)
  if (ar) return `+54${ar[1] ? ' 9' : ''} ${ar[2]} ${ar[3]}-${ar[4]}`
  return `+${digitos}`
}

const linkWhatsapp = (numero, mensaje) => `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`

/**
 * Resuelve el número de cada canal contra la API, con la casa central de red.
 *
 * Va por `getContactChannels()` y no con un fetch propio: los GET públicos
 * están cacheados por path dentro del adapter, y ése lee el MISMO
 * /public/web-config que PublishGate ya pide en toda página. O sea: pega en la
 * promesa cacheada y no cuesta una request, ni en la home ni fuera de ella.
 * (Antes tiraba de `getLandingContent()`, que en páginas que no son la home
 * agregaba tres requests sin cachear — productos, hero-config y guías — sólo
 * para leer un teléfono.)
 *
 * Se dispara en `idle` para no competir con la carga de la página: hasta que
 * conteste, el panel ya muestra el número de la casa, no un botón muerto.
 */
function useCanalesWhatsapp() {
  const [remotos, setRemotos] = useState(null)

  useEffect(() => {
    let vivo = true
    const pedir = () => {
      getContactChannels()
        .then((canales) => {
          if (vivo) setRemotos(canales)
        })
        .catch(() => {
          /* El adapter ya hace fallback por endpoint; si igual falla, nos
             quedamos con el respaldo y el botón sigue sirviendo. */
        })
    }
    const idle = window.requestIdleCallback
    // El techo de 2s no es decorativo: mientras no conteste, el panel muestra el
    // número de la casa, y si alguien abre el flotante en ese hueco se lleva la
    // casa central en vez del canal del tenant. Sirve, pero no es lo pedido.
    const id = idle ? idle(pedir, { timeout: 2000 }) : window.setTimeout(pedir, 600)
    return () => {
      vivo = false
      if (idle && window.cancelIdleCallback) window.cancelIdleCallback(id)
      else window.clearTimeout(id)
    }
  }, [])

  return useMemo(() => {
    const resuelto = {}
    for (const { id, orden } of CANALES) {
      const numero = orden.map((k) => remotos?.[k]).find(Boolean) || WHATSAPP_RESPALDO_E164
      resuelto[id] = { numero, visible: aVisible(numero) }
    }
    return resuelto
  }, [remotos])
}

/* Geometría del flotante en píxeles FÍSICOS (vive fuera de `.kt-zoom-canvas`,
   así que no lo afecta el zoom del lienzo). De acá sale la zona segura que el
   resto del sitio tiene que respetar; si algún día el botón cambia de tamaño,
   se toca sólo esto y el CSS global se reacomoda solo. */
const FAB_LADO_PX = 64 // h-16 w-16
const FAB_MARGEN_PX = 16 // right-4 / bottom-4
const FAB_RESPIRO_PX = 16 // aire mínimo entre el botón y el contenido de al lado
const FAB_ZONA_SEGURA_PX = FAB_MARGEN_PX + FAB_LADO_PX + FAB_RESPIRO_PX // 96px

/* Cualquier diálogo modal del sitio. Detectamos por CONTRATO de accesibilidad
   (`aria-modal="true"` / `<dialog open>`) y no por una lista de componentes:
   así también quedan cubiertos los modales que todavía no existen. Hoy matchea
   LoginRequiredDialog (z-100), ImageLightbox (z-1800), MaintenanceDetailModal
   (z-2000) y el modal de login del header (z-3000). El panel del propio FAB
   declara `aria-modal="false"`, así que no se auto-oculta. */
const SELECTOR_MODAL = '[aria-modal="true"], dialog[open]'

/* El FAB estaba en z-1400 y el LoginRequiredDialog en z-100: el botón quedaba
   ENCIMA del modal y, al clickearlo, abría WhatsApp sobre un diálogo todavía
   abierto. Ocultarlo mientras hay un modal es la defensa que funciona para
   cualquier z-index; bajarlo por debajo del modal más bajo del sitio (100) es
   la segunda, la que cubre el frame en que el observer todavía no corrió. */
function useHayModalAbierto(alAbrirseUnModal) {
  const [hayModal, setHayModal] = useState(false)

  useEffect(() => {
    let frame = 0
    let ultimo = false
    const medir = () => {
      frame = 0
      const hay = Boolean(document.querySelector(SELECTOR_MODAL))
      if (hay === ultimo) return
      ultimo = hay
      setHayModal(hay)
      // Sólo en el flanco de subida: si se abre un modal con el panel de
      // WhatsApp desplegado, el panel se va con el botón. Si no, al cerrar el
      // modal el panel reaparecería colgado y sin contexto.
      if (hay) alAbrirseUnModal()
    }
    // El observer se dispara muchísimo mientras corre el scrollytelling; lo
    // colapsamos a una sola medición por frame para no pagarlo en cada mutación.
    const agendar = () => {
      if (frame) return
      frame = requestAnimationFrame(medir)
    }

    medir()
    const observer = new MutationObserver(agendar)
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-modal', 'open'],
    })

    return () => {
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [alAbrirseUnModal])

  return hayModal
}

function WhatsAppFab() {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  // `setIsOpen` es estable entre renders, así que el observer se suscribe una vez.
  const cerrarPanel = useCallback(() => setIsOpen(false), [])
  const hayModalAbierto = useHayModalAbierto(cerrarPanel)
  const canales = useCanalesWhatsapp()

  /* Publicamos la zona segura como variables CSS para que las secciones que
     terminan debajo del flotante reserven el lugar en vez de quedar tapadas.
     `--kt-fab-safe-canvas` es la misma medida dividida por el zoom del lienzo:
     adentro de `.kt-zoom-canvas` un `96px` se dibuja como 72px reales a 1440,
     y la reserva quedaría corta. Las custom properties se resuelven en el punto
     de uso, así que el calc() sigue al scale sin necesidad de otro listener. */
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--kt-fab-size', `${FAB_LADO_PX}px`)
    root.style.setProperty('--kt-fab-gap', `${FAB_MARGEN_PX}px`)
    root.style.setProperty('--kt-fab-safe', `${FAB_ZONA_SEGURA_PX}px`)
    root.style.setProperty('--kt-fab-safe-canvas', 'calc(var(--kt-fab-safe) / var(--kt-canvas-scale, 1))')
    return () => {
      root.style.removeProperty('--kt-fab-size')
      root.style.removeProperty('--kt-fab-gap')
      root.style.removeProperty('--kt-fab-safe')
      root.style.removeProperty('--kt-fab-safe-canvas')
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen])

  // Nada de render mientras hay un modal: no hay botón que clickear por error.
  // El componente sigue montado, así que las variables CSS no se despublican.
  if (hayModalAbierto) return null

  return (
    <>
      <button
        type="button"
        data-kt-fab="whatsapp"
        className="fixed right-4 bottom-4 z-[90] inline-flex h-16 w-16 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_14px_30px_rgba(0,0,0,0.34)] transition hover:-translate-y-0.5 hover:scale-[1.02]"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={t('whatsappFab.openAria', 'Abrir chat de WhatsApp')}
        title={t('whatsappFab.dialogTitle', 'WhatsApp')}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-8 w-8 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </button>

      {isOpen ? (
        <>
          <button
            type="button"
            aria-label={t('whatsappFab.closeAria', 'Cerrar panel de WhatsApp')}
            className="fixed inset-0 z-[91] cursor-default bg-transparent"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed right-4 bottom-[108px] z-[92] w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[rgba(244,223,51,0.38)] bg-[#0f0f10] shadow-[0_18px_40px_rgba(0,0,0,0.42)]"
            role="dialog"
            aria-modal="false"
            aria-label={t('whatsappFab.dialogTitle', 'WhatsApp')}
          >
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.1)] bg-[#131315] px-4 py-3">
              <h3 className="title-font text-[1.1rem] text-[#f2f4f8]">{t('whatsappFab.dialogTitle', 'WhatsApp')}</h3>
              <button
                type="button"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] text-[#cfd4dc] transition hover:border-primary hover:text-primary"
                onClick={() => setIsOpen(false)}
                aria-label={t('whatsappFab.closeWhatsapp', 'Cerrar WhatsApp')}
              >
                <span className="material-symbols-outlined text-[17px]" aria-hidden="true">close</span>
              </button>
            </div>
            <div className="grid gap-2 p-3">
              <a
                className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.14)] bg-[#17181b] px-3 py-3 text-left transition hover:border-[rgba(244,223,51,0.5)] hover:bg-[#1c1d21]"
                href={linkWhatsapp(canales.ventas.numero, 'Hola equipo de ventas, quiero asesoramiento comercial.')}
                target="_blank"
                rel="noreferrer"
              >
                <span className="grid">
                  <strong className="text-[0.78rem] font-black uppercase tracking-[0.1em] text-[#f5f6f8]">{t('whatsappFab.sales', 'Ventas')}</strong>
                  <small className="text-[0.78rem] text-[#aeb5bf]">{canales.ventas.visible}</small>
                </span>
                <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">chat</span>
              </a>
              <a
                className="flex items-center justify-between rounded-xl border border-[rgba(255,255,255,0.14)] bg-[#17181b] px-3 py-3 text-left transition hover:border-[rgba(244,223,51,0.5)] hover:bg-[#1c1d21]"
                href={linkWhatsapp(canales.soporte.numero, 'Hola equipo de soporte, necesito ayuda tecnica.')}
                target="_blank"
                rel="noreferrer"
              >
                <span className="grid">
                  <strong className="text-[0.78rem] font-black uppercase tracking-[0.1em] text-[#f5f6f8]">{t('whatsappFab.support', 'Soporte')}</strong>
                  <small className="text-[0.78rem] text-[#aeb5bf]">{canales.soporte.visible}</small>
                </span>
                <span className="material-symbols-outlined text-[20px] text-primary" aria-hidden="true">build_circle</span>
              </a>
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}

export default WhatsAppFab
