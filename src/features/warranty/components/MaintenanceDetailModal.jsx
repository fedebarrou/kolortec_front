import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { maintenanceContact } from '../data/maintenanceGuides'

/**
 * Genero del articulo a partir de la TERMINACION del sustantivo nucleo (la
 * primera palabra del nombre), no de una lista de excepciones: en castellano el
 * articulo lo manda el nucleo, no el resto del nombre. "Barra LED" -> una barra
 * LED; "Cabezal Beam" -> un cabezal Beam. Sirve para cualquier equipo que se
 * cargue despues, sin tocar codigo.
 *
 * La tilde no molesta: las terminaciones femeninas del castellano no la llevan
 * al final salvo "-cion/-sion", que se contemplan con y sin ella ("maquina" y
 * "máquina" terminan las dos en "a").
 *
 * Limite conocido: los cultismos griegos en -ma ("problema", "sistema") caerian
 * en femenino. No hay ninguno en el catalogo de equipos, y una excepcion por
 * "-ma" romperia "plataforma" y "forma", que si son femeninas.
 */
const NUCLEO_FEMENINO = /(a|ci[oó]n|si[oó]n|dad|tad|tud|umbre|ie|z)$/

// Partido una sola vez: se usa para meter un <wbr> antes del @ (ver el boton de
// mail mas abajo).
const [emailLocal, emailDominio] = String(maintenanceContact.email || '').split('@')

function articuloPara(name) {
  const nucleo = String(name || '').trim().split(/\s+/)[0] || ''
  return NUCLEO_FEMENINO.test(nucleo.toLowerCase()) ? 'una' : 'un'
}

/**
 * Baja SOLO la inicial: el nucleo es un sustantivo comun ("cabezal") pero lo que
 * sigue suele ser la designacion del modelo ("Beam", "LED") y no se escribe en
 * minuscula. `.toLowerCase()` sobre el nombre entero rompia eso.
 */
function conInicialMinuscula(name) {
  const s = String(name || '').trim()
  return s ? s[0].toLowerCase() + s.slice(1) : s
}

/**
 * Modal de guia de mantenimiento. Renderiza una guia completa (intro, secciones
 * con vinetas, cierre y contacto de soporte). Se usa tanto en la pagina
 * /garantias como en el carrusel de la seccion Soporte del landing.
 */
function MaintenanceDetailModal({ guide, origin, onClose }) {
  const { t } = useLanguage()
  const [phase, setPhase] = useState('opening')

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => setPhase('open'))
    return () => window.cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  const transformOrigin = origin ? `${origin.x}px ${origin.y}px` : '50% 50%'
  const isOpen = phase === 'open'
  // "Como limpiar un barra led" era el titulo real que se leia: el articulo
  // estaba fijo en masculino y `.toLowerCase()` se comia el modelo. Y le faltaba
  // la tilde de "Cómo" (la misma guia en /soporte/guias/barra-led si la tiene).
  const tituloGuia = `Cómo limpiar ${articuloPara(guide.name)} ${conInicialMinuscula(guide.name)}`
  const cerrarLabel = t('warranty.modal.closeAria', 'Cerrar detalle')

  return createPortal(
    <>
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tituloGuia}
      onClick={onClose}
      className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      style={{
        background: isOpen ? 'rgba(5,5,5,0.78)' : 'rgba(5,5,5,0)',
        backdropFilter: isOpen ? 'blur(6px)' : 'blur(0px)',
        WebkitBackdropFilter: isOpen ? 'blur(6px)' : 'blur(0px)',
        transition:
          'background 320ms cubic-bezier(0.22, 0.7, 0.25, 1), backdrop-filter 320ms ease-out, -webkit-backdrop-filter 320ms ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[1100px]"
        style={{
          transformOrigin,
          transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.86) translateY(12px)',
          opacity: isOpen ? 1 : 0,
          transition:
            'transform 460ms cubic-bezier(0.22, 0.7, 0.25, 1), opacity 380ms cubic-bezier(0.22, 0.7, 0.25, 1)',
        }}
      >
        {/* En md+ la X vive pegada a la esquina del panel. En celular el panel
            pasa a scrollear entero dentro del overlay (ver abajo) y esta X se
            iria 2.000px hacia arriba: ahi manda la X fija que se renderiza
            fuera del overlay, al final del portal. */}
        <button
          type="button"
          onClick={onClose}
          aria-label={cerrarLabel}
          className="absolute right-3 top-3 z-10 hidden h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#0b0b0b]/85 text-white backdrop-blur-sm transition hover:border-primary hover:text-primary md:inline-flex"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">close</span>
        </button>

        <div className="grid overflow-hidden rounded-[18px] border border-[rgba(244,223,51,0.28)] bg-[#0b0b0b] shadow-[0_40px_80px_rgba(0,0,0,0.6)] md:grid-cols-[0.95fr_1.05fr]">
          {/* Imagen del equipo */}
          <div className="relative aspect-[4/5] w-full md:aspect-auto md:min-h-[560px]">
            <img
              src={guide.image}
              alt={guide.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(11,11,11,0.2) 0%, rgba(11,11,11,0.45) 50%, rgba(11,11,11,0.92) 100%)',
              }}
            />
            <div
              className="absolute left-5 top-5 inline-flex flex-col items-center bg-[#0b0b0b] px-4 py-3 text-center leading-[1] ring-2 ring-primary"
              style={{ transform: 'rotate(-8deg)' }}
            >
              <span className="material-symbols-outlined text-[26px] leading-none text-primary" aria-hidden="true">
                cleaning_services
              </span>
              <span className="mt-1 text-[0.75rem] font-black uppercase tracking-[0.22em] text-primary">
                {t('warranty.modal.badge', 'Limpieza')}
              </span>
            </div>
          </div>

          {/* Contenido de la guia.
              El alto tope + scroll propio SOLO desde md. En celular esto y el
              overlay (que tambien tiene overflow-y-auto) eran DOS scrollers
              anidados: el dedo movia el de afuera, el panel no bajaba y el CTA
              de contacto quedaba fuera de alcance. Ahora en celular scrollea uno
              solo —el overlay— y el panel crece lo que haga falta; en escritorio
              se mantiene el panel scrolleando al lado de la foto fija. */}
          <div className="flex min-w-0 flex-col gap-5 bg-gradient-to-b from-[#0b0b0b] to-[#050505] px-6 py-8 md:max-h-[85vh] md:overflow-y-auto md:px-8 md:py-10">
            <div className="flex items-center gap-2">
              <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
              <span className="text-[0.75rem] font-black uppercase tracking-[0.22em] text-primary">
                {guide.category}
              </span>
            </div>
            <h2 className="title-font m-0 text-[clamp(1.7rem,3.4vw,2.7rem)] leading-[1.04] text-white">
              {tituloGuia}<span className="text-primary">.</span>
            </h2>
            <p className="m-0 text-[0.95rem] leading-[1.6] text-[#c4cad4]">{guide.intro}</p>

            <div className="grid gap-5 border-t border-[rgba(255,255,255,0.1)] pt-5">
              {guide.sections.map((section) => (
                <div key={section.heading}>
                  <h3 className="title-font m-0 mb-2 text-[1.02rem] leading-[1.1] text-white">
                    {section.heading}<span className="text-primary">.</span>
                  </h3>
                  {section.note ? (
                    <p className="m-0 mb-2 inline-flex items-start gap-2 rounded-[8px] border border-[rgba(244,223,51,0.35)] bg-[rgba(244,223,51,0.08)] px-3 py-2 text-[0.8rem] leading-[1.45] text-[#e7d98a]">
                      <span className="material-symbols-outlined text-[16px] leading-none text-primary" aria-hidden="true">
                        warning
                      </span>
                      <span>{section.note}</span>
                    </p>
                  ) : null}
                  <ul className="m-0 grid list-none gap-1.5 p-0 text-[0.86rem] leading-[1.5] text-[#aeb5bf]">
                    {section.items.map((line) => (
                      <li key={line} className="flex items-start gap-2.5">
                        <span aria-hidden="true" className="mt-[0.5em] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {guide.closing ? (
              <p className="m-0 border-t border-[rgba(255,255,255,0.1)] pt-5 text-[0.9rem] italic leading-[1.6] text-[#c4cad4]">
                {guide.closing}
              </p>
            ) : null}

            <div className="rounded-[12px] border border-[rgba(244,223,51,0.22)] bg-[#0b0b0b] px-5 py-4">
              <p className="m-0 mb-3 text-[0.78rem] font-black uppercase tracking-[0.14em] text-primary">
                {t('warranty.modal.needHelp', 'Todavia necesitas ayuda?')}
              </p>
              <div className="flex flex-wrap gap-2.5">
                <a
                  href={maintenanceContact.phoneHref}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-3 text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-[#0b0b0b] transition hover:-translate-y-0.5"
                >
                  <span className="material-symbols-outlined text-[18px] leading-none" aria-hidden="true">chat</span>
                  {maintenanceContact.phone}
                </a>
                {/* El mail es un token sin espacios y con tracking: en celular
                    su min-content (~380px) no entra en la columna y empujaba el
                    panel entero fuera de pantalla. `max-w-full` lo contiene, el
                    <wbr> antes del @ le da un corte con sentido
                    (KOLORTEC.SOPORTE / @GMAIL.COM) y `overflow-wrap:anywhere`
                    queda de red por si aparece un dominio larguisimo. */}
                <a
                  href={maintenanceContact.emailHref}
                  className="inline-flex max-w-full items-center gap-2 rounded-[10px] border-2 border-primary bg-transparent px-5 py-3 text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-primary transition [overflow-wrap:anywhere] hover:-translate-y-0.5 hover:bg-primary hover:text-[#0b0b0b]"
                >
                  <span className="material-symbols-outlined shrink-0 text-[18px] leading-none" aria-hidden="true">mail</span>
                  <span className="min-w-0">
                    {emailLocal}
                    {emailDominio ? <><wbr />{`@${emailDominio}`}</> : null}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* X fija de celular. Va FUERA del overlay a proposito: el overlay tiene
        `backdrop-filter`, y un ancestro con filtro se vuelve el bloque
        contenedor de sus descendientes `fixed` — adentro, esta X scrollearia
        junto con el contenido y volveria a irse de pantalla. */}
    <button
      type="button"
      onClick={onClose}
      aria-label={cerrarLabel}
      className="fixed right-4 top-4 z-[2001] inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#0b0b0b]/85 text-white backdrop-blur-sm md:hidden"
      style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 320ms ease-out' }}
    >
      <span className="material-symbols-outlined text-[22px] leading-none">close</span>
    </button>
    </>,
    document.body,
  )
}

export default MaintenanceDetailModal
