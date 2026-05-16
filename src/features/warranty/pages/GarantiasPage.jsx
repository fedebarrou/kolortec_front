import { Link } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import usePageTitle from '../../../shared/hooks/usePageTitle'
import { getShopProducts } from '../../../shared/services/contentService'
import { defaultLandingContent } from '../../landing/data/landingData'

function WarrantyCard({ item, onOpen, originRef }) {
  const { t } = useLanguage()
  return (
    <button
      ref={originRef}
      type="button"
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-[14px] border border-[rgba(244,223,51,0.18)] bg-[#0b0b0b] text-left shadow-[0_22px_46px_rgba(0,0,0,0.45)] outline-none transition duration-300 hover:-translate-y-1 hover:border-[rgba(244,223,51,0.45)] hover:shadow-[0_28px_60px_rgba(0,0,0,0.55)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
      aria-label={`${t('common.seeDetail', 'Ver detalle')}: ${item.name}`}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.04]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, rgba(11,11,11,0.28) 0%, rgba(11,11,11,0.5) 55%, rgba(11,11,11,0.95) 100%)',
          }}
        />

        <div
          className="absolute left-4 top-4 inline-flex flex-col items-center bg-[#0b0b0b] px-3 py-3 text-center leading-[1] ring-2 ring-primary"
          style={{ transform: 'rotate(-8deg)' }}
        >
          <span className="text-[0.55rem] font-black uppercase tracking-[0.22em] text-primary">{t('warrantyBadge.label', 'Garantia')}</span>
          <span className="title-font my-[2px] inline-flex items-baseline text-primary">
            <span className="text-[clamp(2rem,3.8vw,2.7rem)] leading-none">12</span>
            <span className="ml-0.5 text-[0.95rem] leading-none">M</span>
          </span>
          <span className="text-[0.55rem] font-black uppercase tracking-[0.22em] text-primary">{t('warrantyBadge.footer', 'de fabrica')}</span>
        </div>

        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-primary/95 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.14em] text-[#0b0b0b] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          {t('common.seeDetail', 'Ver detalle')}
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4]">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>

      <div className="flex flex-col gap-2 border-t-2 border-primary bg-gradient-to-b from-[rgba(11,11,11,0.97)] to-[#050505] px-5 py-5">
        {item.description ? (
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="block h-[2px] w-6 bg-primary" />
            <span className="text-[0.6rem] font-black uppercase tracking-[0.22em] text-primary">
              {item.description}
            </span>
          </div>
        ) : null}
        <h3 className="title-font m-0 text-[clamp(1.2rem,1.8vw,1.65rem)] leading-[1.02] text-white">
          {item.name}<span className="text-primary">.</span>
        </h3>
        {item.longDescription ? (
          <p className="m-0 line-clamp-3 text-[0.86rem] leading-[1.55] text-[#aeb5bf]">
            {item.longDescription}
          </p>
        ) : null}
      </div>
    </button>
  )
}

function WarrantyDetailModal({ item, origin, onClose }) {
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

  const transformOrigin = origin
    ? `${origin.x}px ${origin.y}px`
    : '50% 50%'

  const isOpen = phase === 'open'

  const maintenance = item.maintenance || t('warranty.maintenance.defaults', [
    'Limpieza periodica de optica con pano de microfibra seco.',
    'Verificacion de conexiones DMX y cableado de alimentacion antes de cada uso.',
    'Inspeccion de ventiladores y disipadores cada 6 meses.',
    'Actualizacion de firmware desde la seccion Descargas cuando este disponible.',
  ])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detalle de ${item.name}`}
      onClick={onClose}
      className="fixed inset-0 z-[2000] flex items-start justify-center overflow-y-auto p-4 sm:p-8"
      style={{
        background: isOpen ? 'rgba(5,5,5,0.78)' : 'rgba(5,5,5,0)',
        backdropFilter: isOpen ? 'blur(6px)' : 'blur(0px)',
        WebkitBackdropFilter: isOpen ? 'blur(6px)' : 'blur(0px)',
        transition: 'background 320ms cubic-bezier(0.22, 0.7, 0.25, 1), backdrop-filter 320ms ease-out, -webkit-backdrop-filter 320ms ease-out',
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
        <button
          type="button"
          onClick={onClose}
          aria-label={t('warranty.modal.closeAria', 'Cerrar detalle')}
          className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-[#0b0b0b]/85 text-white backdrop-blur-sm transition hover:border-primary hover:text-primary"
        >
          <span className="material-symbols-outlined text-[20px] leading-none">close</span>
        </button>

        <div className="grid overflow-hidden rounded-[18px] border border-[rgba(244,223,51,0.28)] bg-[#0b0b0b] shadow-[0_40px_80px_rgba(0,0,0,0.6)] md:grid-cols-[1.05fr_1fr]">
          <div className="relative aspect-[4/5] w-full md:aspect-auto md:min-h-[560px]">
            <img
              src={item.image}
              alt={item.name}
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
              <span className="text-[0.55rem] font-black uppercase tracking-[0.22em] text-primary">{t('warrantyBadge.label', 'Garantia')}</span>
              <span className="title-font my-[2px] inline-flex items-baseline text-primary">
                <span className="text-[clamp(2.2rem,4vw,3rem)] leading-none">12</span>
                <span className="ml-0.5 text-[1rem] leading-none">M</span>
              </span>
              <span className="text-[0.55rem] font-black uppercase tracking-[0.22em] text-primary">{t('warrantyBadge.footer', 'de fabrica')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-5 bg-gradient-to-b from-[#0b0b0b] to-[#050505] px-6 py-8 md:px-8 md:py-10">
            {item.description ? (
              <div className="flex items-center gap-2">
                <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
                <span className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-primary">
                  {item.description}
                </span>
              </div>
            ) : null}
            <h2 className="title-font m-0 text-[clamp(1.85rem,3.6vw,3rem)] leading-[1.02] text-white">
              {item.name}<span className="text-primary">.</span>
            </h2>
            {item.longDescription ? (
              <p className="m-0 text-[0.95rem] leading-[1.6] text-[#c4cad4]">
                {item.longDescription}
              </p>
            ) : null}

            <div className="mt-2 border-t border-[rgba(255,255,255,0.1)] pt-5">
              <h3 className="title-font m-0 mb-3 text-[1.05rem] leading-[1.05] text-white">
                {t('warranty.modal.maintenanceTitle', 'Mantenimiento recomendado')}<span className="text-primary">.</span>
              </h3>
              <ul className="m-0 grid list-none gap-2 p-0 text-[0.86rem] leading-[1.5] text-[#aeb5bf]">
                {maintenance.map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <span aria-hidden="true" className="mt-[0.5em] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-2 flex flex-wrap gap-2.5">
              <Link
                to={item.category ? `/products/${item.category}` : '/products'}
                className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-5 py-3 text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-[#0b0b0b] transition hover:-translate-y-0.5"
              >
                {t('warranty.modal.seeProducts', 'Ver productos')}
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4]">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <Link
                to="/soporte"
                className="inline-flex items-center gap-2 rounded-[10px] border-2 border-primary bg-transparent px-5 py-3 text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-primary transition hover:-translate-y-0.5 hover:bg-primary hover:text-[#0b0b0b]"
              >
                <span className="material-symbols-outlined text-[18px] leading-none" aria-hidden="true">download</span>
                {t('warranty.modal.manuals', 'Manuales')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function GarantiasPage() {
  const { t } = useLanguage()
  usePageTitle(t('pageTitle.warranty', 'Guia de Mantenimiento'))

  const [items, setItems] = useState(defaultLandingContent.products.items)
  const [openItem, setOpenItem] = useState(null)
  const [openOrigin, setOpenOrigin] = useState(null)
  const cardRefs = useRef({})

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    let mounted = true
    getShopProducts().then((response) => {
      if (mounted && Array.isArray(response) && response.length > 0) {
        setItems(response)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  const handleOpen = (item) => {
    const node = cardRefs.current[item.name]
    if (node) {
      const rect = node.getBoundingClientRect()
      setOpenOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    } else {
      setOpenOrigin(null)
    }
    setOpenItem(item)
  }

  const handleClose = () => {
    setOpenItem(null)
    setOpenOrigin(null)
  }

  const title = t('warranty.page.title', 'Guia de mantenimiento')
  const subtitle = t(
    'warranty.page.subtitle',
    'Toda la linea Kolortec con respaldo de fabrica, repuestos originales y soporte tecnico local. Mira en detalle cada producto, su mantenimiento recomendado y como cuidar tu equipo.',
  )
  const eyebrow = t('warranty.page.eyebrow', 'Mantenimiento y soporte')
  const backLabel = t('warranty.page.back', 'Volver al inicio')

  return (
    <section className="min-h-screen bg-[#050505] px-6 py-[clamp(56px,8vw,96px)] lg:px-40">
      <div className="mb-10 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
          <span className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-primary">{eyebrow}</span>
        </div>
        <h1 className="title-font m-0 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
          {title}<span className="text-primary">.</span>
        </h1>
        <p className="m-0 max-w-[70ch] text-[1rem] leading-[1.55] text-[#b7bbc4]">{subtitle}</p>
        <Link
          to="/#shop"
          className="inline-flex w-fit items-center gap-2 text-sm font-extrabold uppercase tracking-[0.12em] text-primary transition hover:opacity-80"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4]">
            <path d="M15 6l-6 6 6 6" />
          </svg>
          {backLabel}
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <WarrantyCard
            key={item.name}
            item={item}
            onOpen={() => handleOpen(item)}
            originRef={(node) => {
              if (node) cardRefs.current[item.name] = node
              else delete cardRefs.current[item.name]
            }}
          />
        ))}
      </div>

      {openItem ? (
        <WarrantyDetailModal item={openItem} origin={openOrigin} onClose={handleClose} />
      ) : null}
    </section>
  )
}

export default GarantiasPage
