import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import Seo from '../../../shared/seo/Seo'
import LoginRequiredDialog from '../../../shared/components/LoginRequiredDialog'

const FALLBACK_MANUALS = [
  { label: 'Manual de Usuario - KT-X1000 Flood', size: '11 MB', type: 'PDF' },
  { label: 'Manual Tecnico - KT-X1000 Flood', size: '14 MB', type: 'PDF' },
  { label: 'Manual de Usuario - Precision Spot Z4', size: '9 MB', type: 'PDF' },
  { label: 'Manual de Servicio - Precision Spot Z4', size: '13 MB', type: 'PDF' },
  { label: 'Guia Rapida - Modular Array L2', size: '6 MB', type: 'PDF' },
  { label: 'Manual de Instalacion - Architectural Wash A8', size: '10 MB', type: 'PDF' },
  { label: 'Manual de Usuario - Portable Beam P3', size: '7 MB', type: 'PDF' },
  { label: 'Manual Tecnico - Studio Fresnel F6', size: '12 MB', type: 'PDF' },
]

const FALLBACK_FIRMWARE = [
  { label: 'Firmware Pack v3.4.1 - KT-X1000 Flood', size: '132 MB', type: 'ZIP' },
  { label: 'Pack de Fotometria IES - KT-X1000 Flood', size: '18 MB', type: 'ZIP' },
  { label: 'Perfil DMX GDTF - Precision Spot Z4', size: '4 MB', type: 'GDTF' },
  { label: 'Pack de Fotometria IES - Precision Spot Z4', size: '16 MB', type: 'ZIP' },
  { label: 'Fixture Config Utility - Modular Array L2', size: '28 MB', type: 'EXE / DMG' },
  { label: 'CAD 2D / 3D - Modular Array L2', size: '9 MB', type: 'DWG / STEP' },
  { label: 'Firmware v2.1 - Architectural Wash A8', size: '88 MB', type: 'ZIP' },
  { label: 'Pack de Fotometria IES - Studio Fresnel F6', size: '14 MB', type: 'ZIP' },
]

function filterByQuery(items, query) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return items
  return items.filter((item) => item.label.toLowerCase().includes(normalized))
}

function DownloadColumn({ icon, title, items, downloadCta, emptyResults, onDownload }) {
  return (
    <article className="kt-reveal-item rounded-[12px] border border-[#242424] bg-[#0f0f10] p-6">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-black" aria-hidden="true">
            {icon}
          </span>
          <h2 className="title-font m-0 text-[1.5rem] leading-[1.05]">{title}</h2>
        </div>
        <span className="rounded-full border border-[#2f2f2f] px-2.5 py-1 text-[11px] font-bold text-[#aeb2ba]">
          {items.length}
        </span>
      </header>
      {items.length > 0 ? (
        <ul className="m-0 list-none border-t border-[#242424] p-0">
          {items.map((item) => (
            <li
              key={item.label}
              className="group flex items-center justify-between gap-4 border-b border-[#242424] py-3.5 transition hover:bg-[rgba(244,223,51,0.04)]"
            >
              <div className="grid gap-1">
                <span className="text-[0.95rem] font-bold text-[#f2f2f2]">{item.label}</span>
                <span className="text-[0.78rem] font-semibold uppercase tracking-[0.06em] text-[#8b909a]">
                  {item.type} · {item.size}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onDownload(item.label)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#383838] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#f2f2f2] transition hover:border-primary hover:bg-primary hover:text-[#090909]"
              >
                <span className="material-symbols-outlined text-[15px] leading-none" aria-hidden="true">
                  download
                </span>
                {downloadCta}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 py-8 text-center text-[0.9rem] text-[#aeb2ba]">{emptyResults}</p>
      )}
    </article>
  )
}

function SupportPage() {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [downloadIntent, setDownloadIntent] = useState(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const eyebrow = t('support.page.eyebrow', 'Soporte / Descargas')
  const title = t('support.page.title', 'Centro de Soporte')
  const subtitle = t(
    'support.page.subtitle',
    'Encontra manuales tecnicos, actualizaciones de firmware, fotometria y material de referencia de toda la linea Kolortec.',
  )
  const manualsTitle = t('support.page.manualsTitle', 'Manuales')
  const firmwareTitle = t('support.page.firmwareTitle', 'Librerias')
  const contactTitle = t('support.page.contactTitle', 'Necesitas ayuda?')
  const contactSubtitle = t(
    'support.page.contactSubtitle',
    'No encontras lo que buscas? Nuestro equipo tecnico responde rapido y mantiene repuestos en stock local.',
  )
  const contactCta = t('support.page.contactCta', 'Contactar soporte tecnico')
  const guidesTitle = t('support.page.guidesTitle', 'Guias tecnicas')
  const guidesCta = t('support.page.guidesCta', 'Ver guias')
  const downloadCta = t('productDetail.downloads.downloadCta', 'Descargar')
  const searchPlaceholder = t('support.page.searchPlaceholder', 'Buscar por producto (ej: KT-X1000)')
  const emptyResults = t('support.page.emptyResults', 'Sin resultados para esta busqueda.')

  const filteredManuals = useMemo(() => filterByQuery(FALLBACK_MANUALS, query), [query])
  const filteredFirmware = useMemo(() => filterByQuery(FALLBACK_FIRMWARE, query), [query])

  return (
    <section className="min-h-screen bg-[#050505] px-6 py-[clamp(56px,8vw,96px)] lg:px-40">
      <Seo
        title="Soporte técnico de iluminación escénica · Kolortec"
        description="Soporte técnico de iluminación escénica con respuesta inmediata y repuestos en stock local. Diagnóstico y reparación de cabezales móviles."
        path="/soporte"
      />

      {/* Hero */}
      <header className="kt-reveal mx-auto mb-10 flex max-w-[760px] flex-col items-center gap-4 text-center">
        <span className="inline-flex items-center gap-2 text-[0.7rem] font-black uppercase tracking-[0.24em] text-primary">
          <span aria-hidden="true" className="block h-[2px] w-7 bg-primary" />
          {eyebrow}
        </span>
        <h1 className="title-font m-0 text-[clamp(2.6rem,6.5vw,4.8rem)] leading-[1.0]">
          {title}
          <span className="text-primary">.</span>
        </h1>
        <p className="m-0 max-w-[64ch] text-[1.02rem] leading-[1.55] text-[#b7bbc4]">{subtitle}</p>

        <label className="relative mt-3 block w-full max-w-[560px]">
          <span className="sr-only">{searchPlaceholder}</span>
          <span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-5 inline-flex items-center text-[22px] leading-none text-[#aeb2ba]" aria-hidden="true">
            search
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-full border border-[#2a2a2a] bg-[#0f0f10] py-4 pl-14 pr-5 text-[1rem] text-[#f2f2f2] placeholder:text-[#7a7e87] outline-none transition focus:border-primary focus:shadow-[0_0_0_4px_rgba(244,223,51,0.12)]"
          />
        </label>
      </header>

      {/* Guias tecnicas - callout sobrio */}
      <Link
        to="/soporte/guias"
        className="kt-reveal group mb-10 flex items-center justify-between gap-4 rounded-[12px] border border-[#242424] bg-[#0f0f10] p-5 transition hover:border-[rgba(244,223,51,0.5)]"
      >
        <div className="flex items-center gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(244,223,51,0.4)] text-primary" aria-hidden="true">
            <span className="material-symbols-outlined text-[22px] leading-none">menu_book</span>
          </span>
          <div>
            <h2 className="title-font m-0 text-[1.15rem] leading-[1.2] text-white">{guidesTitle}</h2>
            <p className="m-0 mt-0.5 text-[0.9rem] leading-[1.45] text-[#aeb2ba]">
              Diagnóstico de cabezales móviles, errores DMX, mantenimiento de consolas y reparación profesional.
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[0.8rem] font-extrabold uppercase tracking-[0.1em] text-primary">
          {guidesCta}
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4] transition-transform group-hover:translate-x-1">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </Link>

      {/* Descargas */}
      <div className="kt-reveal grid gap-8 lg:grid-cols-2">
        <DownloadColumn
          title={manualsTitle}
          items={filteredManuals}
          downloadCta={downloadCta}
          emptyResults={emptyResults}
          onDownload={setDownloadIntent}
          icon={
            <svg viewBox="0 0 24 24" className="h-[20px] w-[20px] stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8]">
              <path d="M6 4h9l3 3v13H6zM9 11h6M9 15h6M9 7h3" />
            </svg>
          }
        />
        <DownloadColumn
          title={firmwareTitle}
          items={filteredFirmware}
          downloadCta={downloadCta}
          emptyResults={emptyResults}
          onDownload={setDownloadIntent}
          icon={
            <svg viewBox="0 0 24 24" className="h-[20px] w-[20px] stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8]">
              <path d="M20 12a8 8 0 11-2.3-5.6M20 4v5h-5" />
            </svg>
          }
        />
      </div>

      {/* Banda de ayuda al pie */}
      <aside className="kt-reveal mt-12 overflow-hidden rounded-[16px] border border-[rgba(244,223,51,0.28)] bg-gradient-to-br from-[#121212] to-[#0c0c0c] p-8 lg:p-10">
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span aria-hidden="true" className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-black">
              <span className="material-symbols-outlined text-[24px] leading-none">support_agent</span>
            </span>
            <div className="max-w-[52ch]">
              <h2 className="title-font m-0 text-[clamp(1.4rem,2.4vw,1.9rem)] leading-[1.1] text-white">
                {contactTitle}
              </h2>
              <p className="m-0 mt-1.5 text-[0.95rem] leading-[1.5] text-[#c2c6cf]">{contactSubtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 lg:shrink-0">
            <a
              href="https://wa.me/5491155555555?text=Hola%20equipo%20de%20soporte%2C%20necesito%20ayuda%20tecnica."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary px-5 py-3 text-[0.8rem] font-extrabold uppercase tracking-[0.1em] text-[#090909] transition hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chat</span>
              {contactCta}
            </a>
            <Link
              to="/contacto"
              className="inline-flex items-center justify-center gap-2 rounded-[10px] border border-white/30 bg-transparent px-5 py-3 text-[0.8rem] font-extrabold uppercase tracking-[0.1em] text-white transition hover:border-white hover:bg-white hover:text-[#090909]"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">mail</span>
              Email
            </Link>
          </div>
        </div>
      </aside>

      <LoginRequiredDialog
        isOpen={Boolean(downloadIntent)}
        onClose={() => setDownloadIntent(null)}
        fileName={downloadIntent}
      />
    </section>
  )
}

export default SupportPage
