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

function SupportPage() {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [downloadIntent, setDownloadIntent] = useState(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const title = t('support.page.title', 'Manuales y librerias')
  const subtitle = t(
    'support.page.subtitle',
    'Encontra manuales tecnicos, actualizaciones de firmware, fotometria y material de referencia de toda la linea Kolortec.',
  )
  const manualsTitle = t('support.page.manualsTitle', 'Manuales')
  const firmwareTitle = t('support.page.firmwareTitle', 'Librerias')
  const contactTitle = t('support.page.contactTitle', 'Necesitas ayuda?')
  const contactCta = t('support.page.contactCta', 'Contactar soporte tecnico')
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
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-10">
        <div className="grid gap-3">
          <h1 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
            {title}
            <span className="text-primary">.</span>
          </h1>
          <p className="m-0 max-w-[70ch] text-[#b7bbc4] leading-[1.55]">{subtitle}</p>
        </div>

        <aside className="w-full rounded-[10px] border border-[rgba(244,223,51,0.35)] bg-[#0f0f10] p-5 shadow-[0_8px_22px_rgba(0,0,0,0.28)] md:w-auto md:min-w-[260px] md:max-w-[320px] md:shrink-0">
          <div className="mb-3 flex items-center gap-2.5">
            <span aria-hidden="true" className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-black">
              <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]">
                <path d="M12 2a8 8 0 00-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 00-8-8zm0 5v3m0 3h.01" />
              </svg>
            </span>
            <h3 className="title-font m-0 text-[1.05rem] leading-[1.05]">{contactTitle}</h3>
          </div>
          <div className="flex flex-col gap-2">
            <a
              href="https://wa.me/5491155555555?text=Hola%20equipo%20de%20soporte%2C%20necesito%20ayuda%20tecnica."
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-primary px-4 py-2.5 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-[#090909] transition hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">chat</span>
              {contactCta}
            </a>
            <Link
              to="/contacto"
              className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-white/30 bg-transparent px-4 py-2.5 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-white transition hover:border-white hover:bg-white hover:text-[#090909]"
            >
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">mail</span>
              Email
            </Link>
          </div>
        </aside>
      </div>

      <div className="mb-10">
        <label className="relative block">
          <span className="sr-only">{searchPlaceholder}</span>
          <span className="material-symbols-outlined pointer-events-none absolute inset-y-0 left-4 inline-flex items-center text-[20px] leading-none text-[#aeb2ba]" aria-hidden="true">
            search
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-[10px] border border-[#2a2a2a] bg-[#0f0f10] py-3 pl-12 pr-4 text-[0.95rem] text-[#f2f2f2] placeholder:text-[#7a7e87] outline-none transition focus:border-primary"
          />
        </label>
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <article className="border border-[#2a2a2a] bg-[#0f0f10] p-6 rounded-[10px]">
          <header className="flex items-center gap-3 mb-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-black" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-[20px] w-[20px] stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8]">
                <path d="M6 4h9l3 3v13H6zM9 11h6M9 15h6M9 7h3" />
              </svg>
            </span>
            <h2 className="title-font m-0 text-[1.55rem] leading-[1.05]">{manualsTitle}</h2>
          </header>
          {filteredManuals.length > 0 ? (
            <ul className="border-y border-[#2a2a2a] divide-y divide-[#2a2a2a] list-none m-0 p-0">
              {filteredManuals.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="grid gap-1">
                    <span className="text-[0.95rem] font-bold text-[#f2f2f2]">{item.label}</span>
                    <strong className="text-[0.82rem] font-semibold text-[#aeb2ba]">
                      {item.size} - {item.type}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDownloadIntent(item.label)}
                    className="rounded-full border border-[#383838] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#f2f2f2] transition hover:border-primary hover:bg-primary hover:text-[#090909]"
                  >
                    {downloadCta}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 py-8 text-center text-[0.9rem] text-[#aeb2ba]">{emptyResults}</p>
          )}
        </article>

        <article className="border border-[#2a2a2a] bg-[#0f0f10] p-6 rounded-[10px]">
          <header className="flex items-center gap-3 mb-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-black" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-[20px] w-[20px] stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8]">
                <path d="M20 12a8 8 0 11-2.3-5.6M20 4v5h-5" />
              </svg>
            </span>
            <h2 className="title-font m-0 text-[1.55rem] leading-[1.05]">{firmwareTitle}</h2>
          </header>
          {filteredFirmware.length > 0 ? (
            <ul className="border-y border-[#2a2a2a] divide-y divide-[#2a2a2a] list-none m-0 p-0">
              {filteredFirmware.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="grid gap-1">
                    <span className="text-[0.95rem] font-bold text-[#f2f2f2]">{item.label}</span>
                    <strong className="text-[0.82rem] font-semibold text-[#aeb2ba]">
                      {item.size} - {item.type}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDownloadIntent(item.label)}
                    className="rounded-full border border-[#383838] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#f2f2f2] transition hover:border-primary hover:bg-primary hover:text-[#090909]"
                  >
                    {downloadCta}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 py-8 text-center text-[0.9rem] text-[#aeb2ba]">{emptyResults}</p>
          )}
        </article>
      </div>

      <LoginRequiredDialog
        isOpen={Boolean(downloadIntent)}
        onClose={() => setDownloadIntent(null)}
        fileName={downloadIntent}
      />
    </section>
  )
}

export default SupportPage
