import { useMemo, useState } from 'react'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import MediaViewer from './MediaViewer'
import { contarYFiltrar, formatearDuracion, hayMedia, mostrarVerLos, videoFrameSrc } from '../helpers/mediaHelpers'

/**
 * ProductMedia — «En obra»: las fotos y videos de trabajos reales ASOCIADOS a este
 * producto (GET /public/galeria?producto_id=X → contentService.getProductMedia).
 *
 * Mockup C congelado: docs/diseno/mockups/2026-10-17-media-producto/c.html. Decisión,
 * medidas y descartes (A «riel», B «mosaico + visor lateral») en docs/diseno/DECISIONES-VISUALES.md.
 *
 *  - Va PEGADA a «Video del producto» (el video de la ficha NO se toca: es otra cosa,
 *    `media` de /public/productos).
 *  - Sin media → no se dibuja nada (ni sección ni lengüeta): mismo criterio que ProductBlogs.
 *  - Filtro Todo / Fotos / Videos: aparece sólo si hay de los dos tipos — un filtro de
 *    una sola opción no filtra nada.
 *  - Grilla pareja 4:3. En celular, 6 ítems y «Ver los N».
 *  - Tocar un ítem abre MediaViewer (lightbox con tira de miniaturas y «Consultar por este equipo»).
 */
const PLAY = 'M7 4.5v15l12.5-7.5z'

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={PLAY} fill="currentColor" />
    </svg>
  )
}

function ProductMedia({ items, productName, consultaHref }) {
  const { t } = useLanguage()
  const [filtro, setFiltro] = useState('all')
  const [expandido, setExpandido] = useState(false)
  const [abierto, setAbierto] = useState(-1)
  const [duraciones, setDuraciones] = useState({})
  const [rotas, setRotas] = useState({})

  // La lógica (filtrar, contar, «Ver los N», sin media → null) vive en helpers/mediaHelpers.js, pura y con
  // test (scripts/check-media.mjs). Acá sólo se dibuja.
  const { fotos, videos, total, hayDeAmbos, activo, visibles } = useMemo(() => contarYFiltrar(items, filtro), [items, filtro])
  if (!hayMedia(items)) return null

  const chips = [
    { id: 'all', label: t('productDetail.media.filterAll', 'Todo'), n: total },
    { id: 'image', label: t('productDetail.media.filterPhotos', 'Fotos'), n: fotos },
    { id: 'video', label: t('productDetail.media.filterVideos', 'Videos'), n: videos },
  ]
  const titulo = t('productDetail.media.title', 'En obra')

  return (
    <section className="kt-media kt-detail-tech-shell kt-detail-shell-short kt-detail-anim" id="media" aria-label={titulo}>
      <h3 className="kt-detail-tech-title text-[clamp(2.1rem,3.3vw,3.1rem)] leading-[1.05]">
        {titulo}
        <span className="kt-title-dot">.</span>
      </h3>
      <p className="kt-detail-downloads-copy mt-4 text-[clamp(0.95rem,1.4vw,1.15rem)]">
        {t('productDetail.media.subtitle', 'Trabajos reales con')} <span translate="no">{productName}</span>.
      </p>

      {hayDeAmbos ? (
        <div className="kt-media-filter" role="group" aria-label={t('productDetail.media.filterLabel', 'Filtrar por tipo')}>
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              className="kt-media-chip"
              aria-pressed={activo === chip.id}
              onClick={() => setFiltro(chip.id)}
            >
              {chip.label} · {chip.n}
            </button>
          ))}
        </div>
      ) : null}

      <div className={`kt-media-grid${expandido ? ' is-expanded' : ''}`}>
        {visibles.map((m, i) => {
          const esVideo = m.type === 'video'
          const dur = formatearDuracion(duraciones[m.id])
          const etiqueta = m.title || (esVideo ? t('productDetail.media.video', 'Video') : t('productDetail.media.photo', 'Foto'))
          return (
            <div className="kt-media-card" key={m.id}>
              <button
                type="button"
                className="kt-media-item"
                aria-label={`${t('productDetail.media.open', 'Abrir')}: ${etiqueta}`}
                onClick={() => setAbierto(i)}
              >
                {esVideo ? (
                  <video
                    src={videoFrameSrc(m.url)}
                    preload="metadata"
                    muted
                    playsInline
                    tabIndex={-1}
                    aria-hidden="true"
                    onLoadedMetadata={(e) => {
                      const d = e.currentTarget.duration
                      setDuraciones((prev) => (prev[m.id] === d ? prev : { ...prev, [m.id]: d }))
                    }}
                  />
                ) : rotas[m.id] ? (
                  <span className="flex h-full w-full items-center justify-center">
                    <img src="/assets/logo_minimal.png" alt="" aria-hidden="true" className="h-10 w-10 opacity-70 object-contain" />
                  </span>
                ) : (
                  <img
                    src={m.url}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={() => setRotas((prev) => ({ ...prev, [m.id]: true }))}
                  />
                )}
                <span className="kt-media-badge">
                  {esVideo ? <PlayIcon /> : null}
                  {esVideo
                    ? `${t('productDetail.media.video', 'Video')}${dur ? ` · ${dur}` : ''}`
                    : t('productDetail.media.photo', 'Foto')}
                </span>
                {esVideo ? (
                  <span className="kt-media-play" aria-hidden="true">
                    <PlayIcon />
                  </span>
                ) : null}
              </button>
              {m.title ? <p className="kt-media-caption">{m.title}</p> : null}
            </div>
          )
        })}
        {!expandido && mostrarVerLos(visibles.length) ? (
          <button type="button" className="kt-media-more" onClick={() => setExpandido(true)}>
            {t('productDetail.media.seeAll', 'Ver los')} {visibles.length}
          </button>
        ) : null}
      </div>

      {abierto >= 0 && abierto < visibles.length ? (
        <MediaViewer
          items={visibles}
          index={abierto}
          onIndex={setAbierto}
          onClose={() => setAbierto(-1)}
          consultaHref={consultaHref}
          label={productName}
        />
      ) : null}
    </section>
  )
}

export default ProductMedia
