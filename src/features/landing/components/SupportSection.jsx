import { useLanguage } from '../../../shared/i18n/LanguageProvider'

// La acción de cada tarjeta sale del href, que es lo que arma contentService:
// wa.me (WhatsApp), mailto: o tel:. Antes el teléfono mostraba el ícono de chat.
function contactAction(href = '') {
  if (href.startsWith('mailto')) return { icon: 'mail', key: 'landing.support.actionEmail', fallback: 'Escribir' }
  if (href.startsWith('tel')) return { icon: 'call', key: 'landing.support.actionPhone', fallback: 'Llamar' }
  return { icon: 'chat', key: 'landing.support.actionChat', fallback: 'Abrir chat' }
}

// Un email largo no entra en una línea de tarjeta: le damos un punto de corte
// natural después de la arroba (<wbr>) para que no se parta a mitad de palabra.
function breakableValue(value = '') {
  const text = String(value)
  const at = text.indexOf('@')
  if (at < 0) return text
  return (
    <>
      {text.slice(0, at + 1)}
      <wbr />
      {text.slice(at + 1)}
    </>
  )
}

function SupportSection({ support, loading = false }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.support.title', support.title)
  const sectionSubtitle = t('landing.support.subtitle', support.subtitle)

  const contactOptions = support.contacts ?? []
  // La data ya traía una imagen para esta sección; el componente la ignoraba.
  const imagen = support.carouselImages?.[0] ?? null

  return (
    <section className="kt-support-section px-6 py-[clamp(84px,11vw,128px)] lg:px-[calc(10rem+var(--kt-bleed-inset,0px))] kt-section-reveal" id="support" style={{ '--reveal-delay': '240ms' }}>
      {/* Ghost lateral: la foto sangra por el borde derecho y se disuelve hacia
          la izquierda con una máscara — la misma técnica del video de la sección
          amarilla (cuando tenía video). Sin borde duro no se lee como una foto
          pegada al costado sino como parte del fondo. Decorativa: aria-hidden. */}
      {imagen ? (
        <div className="kt-support-ghost" aria-hidden="true">
          <img src={imagen} alt="" loading="lazy" decoding="async" />
        </div>
      ) : null}
      {/* Contactanos en TARJETAS (opción 2 del mockup 2026-10-03, pedido del
          cliente: no le gustaba el panel de vidrio con la lista). Cada contacto
          es su propia tarjeta oscura con la acción escrita ("Escribir →"): el
          piso de contraste lo pone cada tarjeta, así el texto no depende de qué
          tan clara sea la foto de fondo. */}
      <div className="kt-support-inner grid gap-9">
        <div className="kt-landing-reveal-item kt-support-head">
          <h2 className="title-font mb-2 text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02]">
            {sectionTitle}<span className="text-primary">.</span>
          </h2>
          <p className="m-0 text-[#d7dbe2]">{sectionSubtitle}</p>
        </div>
        {loading ? (
          // Mientras carga: tarjetas fantasma (evita el flash de contactos fantasma → empty).
          <div className="kt-support-cards" aria-hidden="true">
            {[0, 1].map((i) => (
              <div key={i} className="kt-support-card">
                <div className="h-12 w-12 animate-pulse bg-white/10" />
                <div className="h-3 w-24 animate-pulse rounded bg-white/10" />
                <div className="h-4 w-40 animate-pulse rounded bg-white/[0.06]" />
              </div>
            ))}
          </div>
        ) : contactOptions.length > 0 ? (
          <ul className="kt-support-cards list-none p-0 m-0">
            {contactOptions.map((item) => {
              const accion = contactAction(item.href)
              return (
                <li key={item.label} className="kt-landing-reveal-item">
                  <a
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                    className="kt-support-card"
                  >
                    <span className="material-symbols-outlined kt-support-card-icon" aria-hidden="true">
                      {accion.icon}
                    </span>
                    <strong className="text-[0.75rem] uppercase tracking-[0.14em] text-[#8d949f]">
                      {item.label}
                    </strong>
                    <span className="kt-support-card-value">{breakableValue(item.value)}</span>
                    <span className="kt-support-card-go">
                      {t(accion.key, accion.fallback)} <span aria-hidden="true">→</span>
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="kt-support-card mx-auto max-w-[420px] place-items-center text-center">
            <span className="material-symbols-outlined kt-support-card-icon" aria-hidden="true">
              forum
            </span>
            <p className="m-0 max-w-[30ch] text-[0.9rem] leading-relaxed text-[#aeb5bf]">
              {t('landing.support.emptyContacts', 'Todavía no cargamos los datos de contacto. Pronto vas a poder escribirnos por acá.')}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

export default SupportSection
