import { useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { videoFrameSrc } from '../helpers/mediaHelpers'

/**
 * MediaViewer — el visor de «En obra» (mockup C: lightbox con tira de miniaturas).
 *
 * Capa a pantalla completa. Se cierra con Esc, la X o tocando afuera; flechas del
 * teclado, botones y deslizar pasan de ítem (dentro del filtro activo, con vuelta).
 * Los videos se reproducen con los controles nativos del navegador.
 *
 * Lleva «Consultar por este equipo» (WhatsApp de la cuenta, el mismo link que arma
 * la ficha), rescatado de la opción B: quien mira un trabajo real y se entusiasma
 * tiene el contacto a un toque, sin cerrar el visor ni volver al resumen.
 *
 * Foco: al abrir va a la X, Tab queda adentro del visor y al cerrar vuelve al ítem
 * que lo abrió. El scroll de la página se bloquea mientras está abierto.
 */
const PLAY = 'M7 4.5v15l12.5-7.5z'
const SWIPE_MIN = 50

function Icono({ d, fill }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d={d}
        fill={fill ? 'currentColor' : 'none'}
        stroke={fill ? undefined : 'currentColor'}
        strokeWidth={fill ? undefined : 2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MediaViewer({ items, index, onIndex, onClose, consultaHref, label }) {
  const { t } = useLanguage()
  const total = items.length
  const item = items[index]
  const rootRef = useRef(null)
  const closeRef = useRef(null)
  const stripRef = useRef(null)
  const touchX = useRef(null)

  const ir = useCallback(
    (delta) => {
      if (total < 2) return
      onIndex((index + delta + total) % total)
    },
    [index, total, onIndex],
  )

  // Foco: entra a la X, vuelve al ítem que abrió el visor.
  useEffect(() => {
    const previo = document.activeElement
    closeRef.current?.focus()
    return () => {
      if (previo && typeof previo.focus === 'function') previo.focus()
    }
  }, [])

  // Scroll de la página bloqueado mientras el visor está abierto.
  useEffect(() => {
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previo
    }
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowRight') ir(1)
      else if (e.key === 'ArrowLeft') ir(-1)
      else if (e.key === 'Tab' && rootRef.current) {
        const foco = rootRef.current.querySelectorAll('button, a[href], video[controls]')
        if (foco.length === 0) return
        const primero = foco[0]
        const ultimo = foco[foco.length - 1]
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault()
          ultimo.focus()
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault()
          primero.focus()
        }
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [ir, onClose])

  // La miniatura activa siempre a la vista, sin mover la página.
  useEffect(() => {
    const tira = stripRef.current
    const activa = tira?.children[index]
    if (!tira || !activa) return
    tira.scrollTo({ left: activa.offsetLeft - (tira.clientWidth - activa.clientWidth) / 2, behavior: 'smooth' })
  }, [index])

  if (!item) return null
  const esVideo = item.type === 'video'
  const tipo = esVideo ? t('productDetail.media.video', 'Video') : t('productDetail.media.photo', 'Foto')

  const contenido = (
    <div
      className="kt-media-viewer"
      role="dialog"
      aria-modal="true"
      aria-label={`${label} · ${t('productDetail.media.title', 'En obra')}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="kt-media-lb"
        ref={rootRef}
        onTouchStart={(e) => {
          touchX.current = e.target.closest('video') ? null : e.touches[0].clientX
        }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return
          const dx = e.changedTouches[0].clientX - touchX.current
          touchX.current = null
          if (Math.abs(dx) >= SWIPE_MIN) ir(dx < 0 ? 1 : -1)
        }}
      >
        <button
          type="button"
          ref={closeRef}
          className="kt-media-x"
          onClick={onClose}
          aria-label={t('common.close', 'Cerrar')}
        >
          <Icono d="M6 6l12 12M18 6L6 18" />
        </button>

        {total > 1 ? (
          <>
            <button
              type="button"
              className="kt-media-arrow is-prev"
              onClick={() => ir(-1)}
              aria-label={t('common.previousImage', 'Anterior')}
            >
              <Icono d="M15 5l-7 7 7 7" />
            </button>
            <button
              type="button"
              className="kt-media-arrow is-next"
              onClick={() => ir(1)}
              aria-label={t('common.nextImage', 'Siguiente')}
            >
              <Icono d="M9 5l7 7-7 7" />
            </button>
          </>
        ) : null}

        <div className="kt-media-stage">
          {esVideo ? (
            <video key={item.id} src={item.url} controls autoPlay playsInline preload="metadata" aria-label={item.title || label} />
          ) : (
            <img key={item.id} src={item.url} alt={item.title || `${label} · ${tipo} ${index + 1}`} />
          )}
        </div>

        {item.title ? <p className="kt-media-title">{item.title}</p> : null}
        <p className="kt-media-count" aria-live="polite">
          {index + 1} / {total} · {tipo}
        </p>

        {consultaHref ? (
          <a className="kt-media-cta" href={consultaHref} target="_blank" rel="noreferrer">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3a9 9 0 00-7.8 13.5L3 21l4.6-1.2A9 9 0 1012 3z" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            {t('productDetail.media.consult', 'Consultar por este equipo')}
          </a>
        ) : null}

        {total > 1 ? (
          <div className="kt-media-strip" ref={stripRef}>
            {items.map((m, i) => (
              <button
                key={m.id}
                type="button"
                className={`kt-media-thumb${i === index ? ' is-on' : ''}`}
                aria-label={`${i + 1} / ${total}${m.title ? `: ${m.title}` : ''}`}
                aria-current={i === index ? 'true' : undefined}
                onClick={() => onIndex(i)}
              >
                {m.type === 'video' ? (
                  <>
                    <video src={videoFrameSrc(m.url)} preload="metadata" muted playsInline tabIndex={-1} aria-hidden="true" />
                    <i>
                      <Icono d={PLAY} fill />
                    </i>
                  </>
                ) : (
                  <img src={m.url} alt="" loading="lazy" decoding="async" />
                )}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )

  return createPortal(contenido, document.body)
}

export default MediaViewer
