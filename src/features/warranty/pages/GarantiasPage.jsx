import { Link } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import Seo from '../../../shared/seo/Seo'
import { maintenanceGuides } from '../data/maintenanceGuides'
import MaintenanceDetailModal from '../components/MaintenanceDetailModal'

function MaintenanceCard({ guide, onOpen, originRef }) {
  const { t } = useLanguage()
  return (
    <button
      ref={originRef}
      type="button"
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-[14px] border border-[rgba(244,223,51,0.18)] bg-[#0b0b0b] text-left shadow-[0_22px_46px_rgba(0,0,0,0.45)] outline-none transition duration-300 hover:-translate-y-1 hover:border-[rgba(244,223,51,0.45)] hover:shadow-[0_28px_60px_rgba(0,0,0,0.55)] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
      aria-label={`${t('warranty.card.openGuide', 'Ver guia de mantenimiento')}: ${guide.name}`}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        <img
          src={guide.image}
          alt={guide.name}
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
          className="absolute left-4 top-4 inline-flex flex-col items-center bg-[#0b0b0b] px-3 py-2.5 text-center leading-[1] ring-2 ring-primary"
          style={{ transform: 'rotate(-8deg)' }}
        >
          <span className="material-symbols-outlined text-[22px] leading-none text-primary" aria-hidden="true">
            cleaning_services
          </span>
          <span className="mt-1 text-[0.5rem] font-black uppercase tracking-[0.2em] text-primary">
            {t('warranty.modal.badge', 'Limpieza')}
          </span>
        </div>

        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-primary/95 px-3 py-1 text-[0.62rem] font-black uppercase tracking-[0.14em] text-[#0b0b0b] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          {t('warranty.card.guide', 'Ver guia')}
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4]">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>

      <div className="flex flex-col gap-2 border-t-2 border-primary bg-gradient-to-b from-[rgba(11,11,11,0.97)] to-[#050505] px-5 py-5">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="block h-[2px] w-6 bg-primary" />
          <span className="text-[0.6rem] font-black uppercase tracking-[0.22em] text-primary">
            {guide.category}
          </span>
        </div>
        <h3 className="title-font m-0 text-[clamp(1.2rem,1.8vw,1.65rem)] leading-[1.02] text-white">
          {guide.name}<span className="text-primary">.</span>
        </h3>
        <p className="m-0 line-clamp-3 text-[0.86rem] leading-[1.55] text-[#aeb5bf]">
          {guide.intro}
        </p>
        <span className="mt-1 inline-flex w-fit items-center gap-1.5 text-[0.85rem] font-bold text-primary underline decoration-primary/40 decoration-1 underline-offset-[5px] transition group-hover:decoration-primary">
          {t('warranty.card.readFull', 'Leer articulo completo')}
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4] transition-transform group-hover:translate-x-0.5">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </div>
    </button>
  )
}

function GarantiasPage() {
  const { t } = useLanguage()

  const [openGuide, setOpenGuide] = useState(null)
  const [openOrigin, setOpenOrigin] = useState(null)
  const cardRefs = useRef({})

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const handleOpen = (guide) => {
    const node = cardRefs.current[guide.slug]
    if (node) {
      const rect = node.getBoundingClientRect()
      setOpenOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    } else {
      setOpenOrigin(null)
    }
    setOpenGuide(guide)
  }

  const handleClose = () => {
    setOpenGuide(null)
    setOpenOrigin(null)
  }

  const title = t('warranty.page.title', 'Guia de mantenimiento')
  const subtitle = t(
    'warranty.page.subtitle',
    'Como limpiar y cuidar cada equipo Kolortec para conservar el rendimiento, evitar fallas y prolongar la vida util. Toca cada guia para ver el paso a paso completo.',
  )
  const eyebrow = t('warranty.page.eyebrow', 'Mantenimiento y soporte')
  const backLabel = t('warranty.page.back', 'Volver al inicio')

  return (
    <section className="min-h-screen bg-[#050505] px-6 py-[clamp(56px,8vw,96px)] lg:px-40">
      <Seo
        title={t('seo.warrantyTitle', 'Guia de mantenimiento de equipos · Kolortec')}
        description={t('seo.warrantyDesc', 'Como limpiar cabezales Beam y Wash LED, estrobos, barras LED y maquinas de humo. Guias paso a paso de mantenimiento y soporte tecnico local de Kolortec.')}
        path="/garantias"
      />
      <div className="mb-10 flex flex-col gap-4 kt-reveal">
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

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 kt-reveal">
        {maintenanceGuides.map((guide) => (
          <MaintenanceCard
            key={guide.slug}
            guide={guide}
            onOpen={() => handleOpen(guide)}
            originRef={(node) => {
              if (node) cardRefs.current[guide.slug] = node
              else delete cardRefs.current[guide.slug]
            }}
          />
        ))}
      </div>

      {openGuide ? (
        <MaintenanceDetailModal guide={openGuide} origin={openOrigin} onClose={handleClose} />
      ) : null}
    </section>
  )
}

export default GarantiasPage
