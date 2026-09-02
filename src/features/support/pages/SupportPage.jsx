import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { getDownloads } from '../../../shared/services/contentService'
import {
  abrirArchivo,
  getSesionCacheada,
  guardarIntento,
  propsDeDescarga,
  requiereLogin,
  leerIntento,
  olvidarIntento,
} from '../../../shared/services/downloadService'
import Seo from '../../../shared/seo/Seo'
import LoginRequiredDialog from '../../../shared/components/LoginRequiredDialog'

/**
 * DownloadsPage (/descargas) — manuales y librerías de toda la línea.
 *
 * Dos cambios de fondo respecto de la versión anterior:
 *
 *  1. Los archivos son REALES. Antes eran 16 filas hardcodeadas de productos que
 *     no existen ("KT-X1000 Flood", "Precision Spot Z4") con botones que no
 *     bajaban nada, mientras la API ya emitía los documentos cargados en cada
 *     producto. Ahora sale de `getDownloads()`, la misma fuente que la ficha.
 *
 *  2. Una sola grilla de tarjetas en vez de dos listas paralelas. Las dos listas
 *     obligaban a decidir ANTES de buscar ("¿esto es manual o librería?") y
 *     partían la búsqueda en dos: escribías el nombre de un equipo y tenías que
 *     mirar dos columnas para juntar sus archivos. Ahora se busca en un solo
 *     lugar, las tarjetas del mismo equipo caen juntas, y la FAMILIA se lee por
 *     color: amarillo = manual (se lee), cian = librería (se carga en el equipo).
 *     Los filtros de arriba siguen estando para el que ya sabe qué quiere.
 */

const FAMILIAS = {
  manual: {
    // Amarillo de la marca: lo que se lee es lo que más se busca acá.
    color: '#f4df33',
    tint: 'rgba(244, 223, 51, 0.10)',
    borde: 'rgba(244, 223, 51, 0.42)',
    texto: '#0b0b0b',
    icono: 'M6 4h9l3 3v13H6zM9 11h6M9 15h6M9 7h3',
  },
  libreria: {
    // Cian frío: se distingue del amarillo de un vistazo incluso en miniatura, y
    // no compite con el acento de la marca.
    color: '#5fd0e6',
    tint: 'rgba(95, 208, 230, 0.10)',
    borde: 'rgba(95, 208, 230, 0.42)',
    texto: '#04222a',
    icono: 'M20 12a8 8 0 11-2.3-5.6M20 4v5h-5',
  },
}

function DownloadCard({ item, downloadCta, onDownload }) {
  const familia = FAMILIAS[item.family] || FAMILIAS.manual
  // El archivo abierto va en un <a> DE VERDAD y no en un <button>: así se puede
  // copiar el link, abrirlo en otra pestaña con el botón del medio y lo ve un
  // crawler. El <button> queda sólo para lo que sí pide identificarse.
  const conLogin = requiereLogin(item)
  const claseBoton = 'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#383838] px-3.5 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#f2f2f2] transition'
  const pintar = (e) => {
    e.currentTarget.style.backgroundColor = familia.color
    e.currentTarget.style.borderColor = familia.color
    e.currentTarget.style.color = familia.texto
  }
  const despintar = (e) => {
    e.currentTarget.style.backgroundColor = 'transparent'
    e.currentTarget.style.borderColor = '#383838'
    e.currentTarget.style.color = '#f2f2f2'
  }
  const icono = (
    <span className="material-symbols-outlined text-[15px] leading-none" aria-hidden="true">
      {conLogin ? 'lock' : 'download'}
    </span>
  )
  return (
    <article
      className="group flex flex-col gap-3 rounded-[12px] border bg-[#0d0d0e] p-5 transition hover:-translate-y-1"
      style={{ borderColor: '#242424' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = familia.borde }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#242424' }}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px]"
          style={{ backgroundColor: familia.color, color: familia.texto }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="h-[19px] w-[19px] stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.9]">
            <path d={familia.icono} />
          </svg>
        </span>
        <span
          className="rounded-[4px] px-2 py-1 text-[12px] font-black uppercase tracking-[0.1em]"
          style={{ backgroundColor: familia.tint, color: familia.color }}
        >
          {item.ext}
        </span>
      </div>

      <div className="grid gap-1">
        <Link
          to={`/producto/${item.productSlug}`}
          className="text-[0.75rem] font-extrabold uppercase tracking-[0.14em] text-[#8b909a] transition hover:text-primary"
        >
          {item.product}
        </Link>
        <h3 className="title-font m-0 text-[1.02rem] leading-[1.2] text-[#f2f2f2]">{item.label}</h3>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#232323] pt-3">
        <span className="text-[0.75rem] text-[#8b909a]">{item.size || '—'}</span>
        {conLogin ? (
          <button
            type="button"
            onClick={() => onDownload(item)}
            className={claseBoton}
            style={{ borderColor: '#383838' }}
            onMouseEnter={pintar}
            onMouseLeave={despintar}
          >
            {icono}
            {downloadCta}
          </button>
        ) : (
          <a
            {...propsDeDescarga(item)}
            className={claseBoton}
            style={{ borderColor: '#383838' }}
            onMouseEnter={pintar}
            onMouseLeave={despintar}
          >
            {icono}
            {downloadCta}
          </a>
        )}
      </div>
    </article>
  )
}

function SupportPage() {
  const { t } = useLanguage()
  const [query, setQuery] = useState('')
  const [familia, setFamilia] = useState('todas')
  const [items, setItems] = useState(null) // null = cargando
  const [downloadIntent, setDownloadIntent] = useState(null)
  // Archivo que quedó pendiente ANTES de mandar al usuario al login. Al volver
  // ya logueado le ofrecemos el archivo que pidió, en vez de dejarlo en una
  // página que no le da lo que fue a buscar.
  const [pendiente, setPendiente] = useState(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  useEffect(() => {
    const intento = leerIntento('/descargas')
    if (!intento) return undefined
    let vivo = true
    // Sólo se ofrece si de verdad hay sesión: si el usuario canceló el login,
    // la intención se descarta en silencio y el gate sigue en pie.
    getSesionCacheada().then((sesion) => {
      if (vivo && sesion) setPendiente(intento)
    })
    return () => { vivo = false }
  }, [])

  // El click en "Descargar" de un archivo con gate: se recuerda QUÉ archivo era
  // y recién ahí se abre el diálogo. Si ya hay sesión, ni diálogo: se baja.
  const pedirDescarga = (item) => {
    getSesionCacheada().then((sesion) => {
      if (sesion) {
        abrirArchivo(item)
        return
      }
      guardarIntento(item, '/descargas')
      setDownloadIntent(item)
    })
  }

  useEffect(() => {
    let cancelado = false
    getDownloads().then((data) => {
      if (!cancelado) setItems(Array.isArray(data) ? data : [])
    })
    return () => { cancelado = true }
  }, [])

  const eyebrow = t('support.page.eyebrow', 'Soporte / Descargas')
  const title = t('support.page.title', 'Manuales y librerías')
  const subtitle = t(
    'support.page.subtitle',
    'Encontra manuales tecnicos, actualizaciones de firmware, fotometria y material de referencia de toda la linea Kolortec.',
  )
  const manualsTitle = t('support.page.manualsTitle', 'Manuales')
  const firmwareTitle = t('support.page.firmwareTitle', 'Librerias')
  const allTitle = t('support.page.allTitle', 'Todo')
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
  const emptyAll = t('support.page.emptyAll', 'Todavia no hay archivos publicados. Pedilos por soporte y te los mandamos.')
  const loadingLabel = t('support.page.loading', 'Cargando archivos…')

  // `items ?? []` crea un array NUEVO en cada render mientras la carga no
  // resolvio, y eso invalidaba los useMemo de abajo en cada pasada.
  const lista = useMemo(() => items ?? [], [items])
  const conteos = useMemo(() => ({
    todas: lista.length,
    manual: lista.filter((i) => i.family === 'manual').length,
    libreria: lista.filter((i) => i.family === 'libreria').length,
  }), [lista])

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase()
    return lista.filter((i) => {
      if (familia !== 'todas' && i.family !== familia) return false
      if (!q) return true
      // Se busca por archivo Y por producto: casi siempre se llega buscando el
      // equipo, no el nombre del PDF.
      return `${i.label} ${i.product} ${i.category}`.toLowerCase().includes(q)
    })
  }, [lista, familia, query])

  const filtros = [
    { id: 'todas', label: allTitle, n: conteos.todas, color: '#f2f2f2' },
    { id: 'manual', label: manualsTitle, n: conteos.manual, color: FAMILIAS.manual.color },
    { id: 'libreria', label: firmwareTitle, n: conteos.libreria, color: FAMILIAS.libreria.color },
  ]

  return (
    <section className="min-h-screen bg-[#050505] px-6 py-[clamp(56px,8vw,96px)] lg:px-40">
      <Seo
        title={t('seo.supportTitle', 'Soporte técnico de iluminación escénica · Kolortec')}
        description={t('seo.supportDesc', 'Soporte técnico de iluminación escénica con respuesta inmediata y repuestos en stock local. Diagnóstico y reparación de cabezales móviles.')}
        path="/descargas"
      />

      {/* Hero */}
      <header className="kt-reveal mx-auto mb-10 flex max-w-[760px] flex-col items-center gap-4 text-center">
        <span className="inline-flex items-center gap-2 text-[0.75rem] font-black uppercase tracking-[0.24em] text-primary">
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

        {/* Filtros por familia. El color de cada uno es el mismo que llevan sus
            tarjetas: el filtro enseña el código de color antes de usarlo. */}
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          {filtros.map((f) => {
            const activo = familia === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFamilia(f.id)}
                aria-pressed={activo}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[0.75rem] font-extrabold uppercase tracking-[0.1em] transition"
                style={{
                  borderColor: activo ? f.color : '#2a2a2a',
                  color: activo ? '#0b0b0b' : '#c8ccd4',
                  backgroundColor: activo ? f.color : 'transparent',
                }}
              >
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ backgroundColor: activo ? '#0b0b0b' : f.color }} />
                {f.label}
                <span className="opacity-70">{f.n}</span>
              </button>
            )
          })}
        </div>
      </header>

      {/* Aviso de descarga pendiente: el archivo que el usuario pidió ANTES de
          que lo mandáramos a loguearse. Sin esto, volver del OAuth era volver a
          una página que no le daba lo que fue a buscar. */}
      {pendiente ? (
        <div className="mb-6 flex flex-col items-start gap-3 rounded-[12px] border border-[rgba(244,223,51,0.45)] bg-[rgba(244,223,51,0.07)] p-4 md:flex-row md:items-center md:justify-between md:gap-4">
          <p className="m-0 text-[0.92rem] leading-[1.45] text-[#e9ebef]">
            {t('support.page.pendingDownload', 'Listo, ya podés descargar')}{' '}
            <strong className="font-bold text-white">{pendiente.label}</strong>.
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <a
              {...propsDeDescarga(pendiente)}
              onClick={() => { olvidarIntento(); setPendiente(null) }}
              className="inline-flex items-center gap-2 rounded-[8px] bg-primary px-4 py-2.5 text-[0.75rem] font-extrabold uppercase tracking-[0.1em] text-[#0b0b0b] transition hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[16px] leading-none" aria-hidden="true">download</span>
              {downloadCta}
            </a>
            <button
              type="button"
              onClick={() => { olvidarIntento(); setPendiente(null) }}
              aria-label={t('loginDialog.close', 'Cerrar')}
              className="grid h-9 w-9 place-items-center rounded-full text-[#aeb2ba] transition hover:bg-white/10 hover:text-white"
            >
              <span className="material-symbols-outlined text-[18px] leading-none">close</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Guias tecnicas - callout sobrio.
          `flex-col` hasta md: en 390px el patrón "fila + justify-between" dejaba
          el <p> en 124px de ancho y 8 renglones. Es el mismo remedio que ya usa
          el <aside> de ayuda al pie de esta página. */}
      <Link
        to="/soporte/guias"
        className="kt-reveal group mb-10 flex flex-col items-start justify-between gap-4 rounded-[12px] border border-[#242424] bg-[#0f0f10] p-5 transition hover:border-[rgba(244,223,51,0.5)] md:flex-row md:items-center"
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

      {/* Grilla única de archivos */}
      {items === null ? (
        <p className="m-0 py-16 text-center text-[0.95rem] text-[#aeb2ba]">{loadingLabel}</p>
      ) : filtrados.length > 0 ? (
        // SIN `kt-reveal` en la grilla: el observer global revela con
        // `threshold: 0.12`, o sea cuando el 12% del elemento entra en pantalla.
        // Con 112 tarjetas la grilla mide varios miles de píxeles y ese 12% NO
        // ENTRA NUNCA en el viewport: la grilla se quedaba en opacity 0 para
        // siempre. Una animación de entrada sobre un listado de este largo no
        // aporta nada igual.
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((item) => (
            <DownloadCard key={item.id} item={item} downloadCta={downloadCta} onDownload={pedirDescarga} />
          ))}
        </div>
      ) : (
        <div className="kt-reveal rounded-[12px] border border-dashed border-[#2a2a2a] bg-[#0f0f10] p-12 text-center">
          <p className="m-0 text-[0.95rem] text-[#aeb5bf]">{lista.length === 0 ? emptyAll : emptyResults}</p>
          <Link
            to="/contacto"
            className="mt-5 inline-flex items-center gap-2 rounded-[8px] border-2 border-white px-5 py-3 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-[#090909]"
          >
            {contactCta}
          </Link>
        </div>
      )}

      {/* Ayuda */}
      <aside className="kt-reveal mt-10 flex flex-col items-start justify-between gap-4 rounded-[12px] border border-[#242424] bg-[#0f0f10] p-6 md:flex-row md:items-center">
        <div>
          <h2 className="title-font m-0 text-[1.25rem] leading-[1.2] text-white">{contactTitle}</h2>
          <p className="m-0 mt-1 max-w-[62ch] text-[0.92rem] leading-[1.5] text-[#aeb2ba]">{contactSubtitle}</p>
        </div>
        <Link
          to="/contacto"
          className="inline-flex shrink-0 items-center gap-2 rounded-[8px] bg-primary px-5 py-3.5 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-[#0b0b0b] transition hover:-translate-y-0.5"
        >
          {contactCta}
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4]">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      </aside>

      <LoginRequiredDialog
        isOpen={Boolean(downloadIntent)}
        onClose={() => setDownloadIntent(null)}
        fileName={downloadIntent?.label}
      />
    </section>
  )
}

export default SupportPage
