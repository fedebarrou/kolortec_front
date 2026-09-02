import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { useFullBleed } from '../../../shared/hooks/useFullBleed'
import { irASeccion } from '../../../shared/utils/irASeccion'

// Accesos de la sección de soporte (data estática en landingData) → key i18n por icono (ES/EN).
const ACCESS_KEY_BY_ICON = {
  download: 'landing.shop.access.downloads',
  forum: 'landing.shop.access.contact',
  verified: 'landing.shop.access.guides',
}

// Diseño "2c" del mockup de la sección amarilla, invertido: la intro (cortina + barrido del
// logo + flash) arranca en amarillo y al terminar el fondo funde a NEGRO con tipografía blanca
// (en el mockup fundía a blanco con tipografía negra). El video vive en el borde derecho con
// máscara ghost que lo mezcla con el fondo; la biblioteca de guías salió de la sección y queda
// accesible por su acceso "Biblioteca de guías" (/soporte/guias).
function ShopSection({ shop, ready = true }) {
  const { t } = useLanguage()
  const sectionTitle = t('landing.shop.title', shop.title)
  const sectionSubtitle = t('landing.shop.subtitle', shop.subtitle)
  const sectionEyebrow = t('landing.shop.eyebrow', 'Warranty Program')
  const videoBadge = t('landing.shop.videoBadge', 'Repuestos originales')
  const ctas = shop.ctas ?? []

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const sectionRef = useRef(null)
  // A pantalla completa: rompe el lienzo de 1920 para tocar los dos bordes de la
  // pantalla (en un 2K el lienzo se centra y quedaban bandas negras a los lados).
  useFullBleed(sectionRef)
  const videoRef = useRef(null)
  const [introPhase, setIntroPhase] = useState(prefersReducedMotion ? 'done' : 'priming')

  // Video: se reproduce UNA vez al entrar la sección al viewport y queda en el último frame
  // (equipo encendido). Sin loop.
  useEffect(() => {
    const vid = videoRef.current
    const el = sectionRef.current
    if (!vid || !el) return undefined
    if (!ready) return undefined
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            vid.play?.()?.catch(() => {})
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.25 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [ready])

  // Animación de entrada (cortina + barrido + flash → fundido a negro). Se dispara al entrar
  // la sección al viewport; el contenido se revela mientras el fondo oscurece.
  useEffect(() => {
    const el = sectionRef.current
    if (!el) return undefined
    if (prefersReducedMotion) return undefined
    // GATE (ago-26): hasta que no llego el contenido, el scrolltelling y el hero
    // devuelven null y esta seccion nace DENTRO del viewport, a ~400px del tope.
    // El observer disparaba a los ~0ms, arrancaba el setTimeout de 7700ms y hacia
    // unobserve: para cuando el usuario bajaba hasta aca, ya estaba negra y
    // terminada. Con el contenido cargado la seccion esta a miles de px de ahi.
    if (!ready) return undefined

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIntroPhase('playing')
            // 3200ms en amarillo + 4500ms de fundido = 7700ms. El estado `done`
            // tiene que llegar DESPUES de que termine la animacion del CSS
            // (index.css, .kt-shop-dark): si llega antes, su opacity:1 corta el
            // fundido de golpe. Si tocas uno de los tres numeros, tocá los tres.
            window.setTimeout(() => setIntroPhase('done'), 7700)
            obs.unobserve(entry.target)
          }
        })
      },
      // rootMargin NEGATIVO: encoge el area de deteccion y dispara cuando la
      // seccion entro de verdad. Era +12%, que la EXPANDE y adelanta el disparo
      // (signo invertido respecto de useScrollReveal -8% y ProductDetailPage -14%).
      { threshold: 0.2, rootMargin: '0px 0px -12% 0px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [prefersReducedMotion, ready])

  const phaseClass =
    introPhase === 'playing' ? 'is-playing' : introPhase === 'done' ? 'is-done' : 'is-priming'

  // `orden` es la posición del acceso dentro de la entrada escalonada del bloque
  // de texto: los tres primeros lugares se los llevan volanta, título y bajada,
  // así que los accesos arrancan en el 3.
  const renderAccess = (cta, orden) => {
    const isExternal = /^https?:\/\//.test(cta.href)
    const hashMatch = cta.href.match(/^\/?#([\w-]+)$/) || cta.href.match(/^\/#([\w-]+)$/)
    const targetId = hashMatch ? hashMatch[1] : null
    const isInternal = cta.href.startsWith('/') && !targetId

    const className =
      // Separador NEGRO entre accesos, y sólo entre ellos: `last:border-b-0` deja
      // el último sin línea, así la lista no termina en un borde suelto. Lo que
      // no lleva la sección es borde propio —ni arriba ni abajo— ni línea sobre
      // el <nav> que los envuelve; eso le dibujaba un marco al bloque.
      'kt-shop-in group/access flex items-center justify-between gap-4 border-b border-[rgba(11,11,11,0.22)] py-4 text-left transition last:border-b-0 hover:pl-1'
    const orderStyle = { '--kt-in': 3 + orden }
    const inner = (
      <>
        <span className="flex items-center gap-3">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-full kt-shop-chip transition group-hover/access:scale-105">
            <span className="material-symbols-outlined text-[20px] leading-none" aria-hidden="true">
              {cta.icon || 'arrow_forward'}
            </span>
          </span>
          <span className="flex flex-col">
            <strong className="kt-shop-ink text-[0.95rem] font-extrabold uppercase tracking-[0.06em]">
              {t(ACCESS_KEY_BY_ICON[cta.icon] ?? '', cta.label)}
            </strong>
            {cta.description ? (
              <span className="kt-shop-ink kt-shop-ink--soft text-[0.8rem]">{cta.description}</span>
            ) : null}
          </span>
        </span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="kt-shop-ink h-5 w-5 flex-none stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4] transition-transform group-hover/access:translate-x-1 group-hover/access:stroke-primary"
        >
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </>
    )

    if (targetId) {
      return (
        <Link
          key={cta.label}
          to={cta.href}
          className={className}
          style={orderStyle}
          onClick={(event) => {
            // Mismo camino que el SOPORTE del navbar: si el scrolltelling
            // todavía tiene tomado el scroll, hay que liberarlo antes de saltar
            // o el recorrido se queda adentro de la historia.
            if (!document.getElementById(targetId)) return
            event.preventDefault()
            irASeccion(targetId)
          }}
        >
          {inner}
        </Link>
      )
    }
    if (isInternal) {
      return (
        <Link key={cta.label} to={cta.href} className={className} style={orderStyle}>
          {inner}
        </Link>
      )
    }
    return (
      <a
        key={cta.label}
        href={cta.href}
        className={className}
        style={orderStyle}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noreferrer' : undefined}
      >
        {inner}
      </a>
    )
  }

  return (
    <section
      id="shop"
      ref={sectionRef}
      className={`kt-shop-section ${phaseClass} relative isolate flex items-center overflow-hidden bg-primary py-[clamp(72px,10vw,128px)]`}
      style={{
        // Alto = pantalla ENTERA. Dividido por la escala del lienzo por lo mismo
        // que el hero: adentro de un `zoom: s` hay que pedir 1/s para ocupar el
        // alto real. Es `min-height` y no `height` para que en una pantalla baja
        // el contenido pueda empujar en vez de recortarse.
        minHeight: 'calc(100dvh / var(--kt-canvas-scale, 1))',
      }}
    >
      {/* Ya no hay fundido a negro: la sección se queda AMARILLA. El contraste del
          cierre lo dan las secciones que suben encima (Sumate en negro,
          Contactanos sobre la foto), no un cambio de color acá adentro. */}

      {/* Video al borde derecho, mezclado con el fondo por máscara ghost (en mobile pasa a
          fondo full-bleed atenuado). El asset se va a reemplazar; el comportamiento queda. */}
      <div className="kt-shop-video-edge kt-shop-from-right" aria-hidden="true">
        <video
          ref={videoRef}
          src="/assets/shop-section-bg.mp4"
          muted
          playsInline
          preload="auto"
        />
        <span className="kt-shop-video-badge">{videoBadge}</span>
      </div>

      {introPhase !== 'done' ? (
        <>
          <div className={`kt-shop-curtain ${introPhase === 'playing' ? 'is-playing' : ''}`} aria-hidden="true" />
          <div
            aria-hidden="true"
            className={`kt-shop-logo-sweep ${introPhase === 'playing' ? 'is-playing' : ''}`}
          />
          <div className={`kt-shop-flash ${introPhase === 'playing' ? 'is-playing' : ''}`} aria-hidden="true" />
        </>
      ) : null}

      <div className="kt-shop-content relative z-10 w-full px-6 lg:pl-[calc(10rem+var(--kt-bleed-inset,0px))] lg:pr-[min(620px,46vw)]">
        {/* El contenido ya no entra como UN bloque desde el costado: cada
            elemento aparece por su cuenta, de abajo hacia arriba y escalonado
            (.kt-shop-in). El orden lo declara `--kt-in` y no el DOM porque los
            accesos viven dentro del <nav> — no son hermanos de la volanta ni del
            título, así que ningún :nth-child los podría contar en la misma
            serie. */}
        <div className="flex max-w-[660px] flex-col gap-5">
          <div className="kt-shop-in flex items-center gap-2" style={{ '--kt-in': 0 }}>
            <span aria-hidden="true" className="block h-[2px] w-8 kt-shop-accent" />
            <span className="kt-shop-ink text-[0.75rem] font-black uppercase tracking-[0.22em]">
              {sectionEyebrow}
            </span>
          </div>

          <h2
            className="kt-shop-in kt-shop-ink title-font m-0 whitespace-pre-line text-left text-[clamp(2.4rem,7vw,5.4rem)] leading-[0.88]"
            style={{ '--kt-in': 1 }}
          >
            {sectionTitle}
            <span className="kt-shop-accent-text">.</span>
          </h2>

          <p
            className="kt-shop-in kt-shop-ink kt-shop-ink--soft max-w-[52ch] text-[1.05rem] leading-[1.55]"
            style={{ '--kt-in': 2 }}
          >
            {sectionSubtitle}
          </p>

          {ctas.length > 0 ? (
            <nav className="mt-2" aria-label={sectionEyebrow}>
              {ctas.map((cta, i) => renderAccess(cta, i))}
            </nav>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default ShopSection
