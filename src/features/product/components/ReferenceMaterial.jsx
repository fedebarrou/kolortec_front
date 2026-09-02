import { useState } from 'react'
import Rail from '../../../shared/components/Rail'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

/**
 * ReferenceMaterial — el material externo de un producto, como slides CON IMAGEN.
 *
 * Antes era una lista de renglones METIDA ADENTRO del acordeón de Descargas, con
 * la misma pinta que los documentos que se bajan. Y no son lo mismo: estos links
 * SALEN del sitio y muchas veces son páginas web o videos, no archivos.
 *
 * La miniatura se DEDUCE de la URL, porque la API sólo manda `{label, url}`:
 *  - YouTube → el thumbnail real del video (i.ytimg.com).
 *  - Una imagen directa → la imagen.
 *  - Cualquier otra página → el favicon del PROPIO sitio enlazado. A propósito no
 *    se usa un servicio de terceros tipo Google favicons: le contaría a Google
 *    qué está mirando cada visitante de kolortec.
 *  - Si nada carga (el 404 del favicon es común) → isotipo kolortec.
 *
 * Una preview real de página web no se puede hacer desde el navegador (el OG image
 * vive en el HTML del otro dominio y CORS lo bloquea). Si hiciera falta, el camino
 * es un campo de imagen en `productos.material_externo` cargado desde el admin.
 */

const RE_YOUTUBE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/
const RE_IMAGEN = /\.(jpe?g|png|webp|avif|gif)$/i
const RE_VIDEO = /\.(mp4|webm|mov|m4v)$/i

/** Tipo del link, para que se vea si abre una página, un video o baja un archivo. */
function analizar(url) {
  let host = url
  let pathname = ''
  try {
    const u = new URL(url)
    host = u.hostname.replace(/^www\./, '')
    pathname = u.pathname
  } catch {
    // URL relativa o inválida: se muestra tal cual y sin miniatura.
    return { host, kind: null, thumb: null, esVideo: false, origin: null }
  }

  const yt = url.match(RE_YOUTUBE)
  if (yt) {
    return { host, kind: 'VIDEO', thumb: `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`, esVideo: true, origin: null }
  }
  if (RE_VIDEO.test(pathname)) {
    return { host, kind: 'VIDEO', thumb: null, esVideo: true, origin: `${new URL(url).origin}/favicon.ico` }
  }
  if (RE_IMAGEN.test(pathname)) {
    return { host, kind: 'IMAGEN', thumb: url, esVideo: false, origin: null }
  }

  // Extensión del path (ignorando la query, que suele traer puntos).
  const ext = pathname.split('.').pop()
  const kind = ext && ext !== pathname && ext.length <= 4 && /^[a-z0-9]+$/i.test(ext)
    ? ext.toUpperCase()
    : null

  return { host, kind, thumb: null, esVideo: false, origin: `${new URL(url).origin}/favicon.ico` }
}

/**
 * Miniatura de la card. Tres estados en cascada: imagen real → favicon del sitio
 * → isotipo. Cada fallo baja un escalón con onError, así una URL rota nunca deja
 * un hueco blanco.
 */
function Miniatura({ info }) {
  const [paso, setPaso] = useState(0)
  // Candidatas en orden. Cada onError avanza UNA; agotadas, queda el isotipo.
  // (Antes el paso 1 volvía a intentar el favicon que acababa de fallar, así que
  // un 404 —lo más común— se quedaba clavado en el ícono de imagen rota.)
  const fuentes = [info.thumb, info.origin].filter(Boolean)
  const src = fuentes[paso] ?? null
  // El favicon es chico (16-32px): centrado y a tamaño natural, no estirado a todo
  // el ancho, que lo dejaría irreconocible.
  const esMarca = src !== null && src === info.origin

  return (
    <span className="kt-rail-media">
      {src === null ? (
        <img src="/favicon.svg" alt="" aria-hidden="true" className="h-10 w-10 opacity-70" />
      ) : (
        <img
          src={src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className={esMarca ? 'h-9 w-9 object-contain' : 'h-full w-full object-cover'}
          onError={() => setPaso((n) => n + 1)}
        />
      )}
      {info.esVideo ? (
        <span className="kt-rail-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        </span>
      ) : null}
    </span>
  )
}

function ReferenceMaterial({ items }) {
  const { t } = useLanguage()
  const list = Array.isArray(items) ? items.filter((i) => i && i.url) : []
  if (list.length === 0) return null

  const pageLabel = t('productDetail.downloads.externalKindPage', 'Página')

  return (
    <section className="kt-detail-tech-shell kt-detail-shell-short kt-detail-anim" id="reference-material">
      <h3 className="kt-detail-tech-title text-[clamp(2.1rem,3.3vw,3.1rem)] leading-[1.05]">
        {t('productDetail.downloads.externalMaterial', 'Material de referencia')}
        <span className="kt-title-dot">.</span>
      </h3>
      <p className="kt-detail-downloads-copy mt-4 text-[clamp(0.95rem,1.4vw,1.15rem)]">
        {t(
          'productDetail.downloads.externalMaterialCopy',
          'Enlaces a documentación, fichas y sitios de referencia de este equipo. Se abren en una pestaña nueva.',
        )}
      </p>

      <Rail className="mt-8" label={t('productDetail.downloads.externalMaterial', 'Material de referencia')}>
        {list.map((item) => {
          const info = analizar(item.url)
          return (
            <a
              key={item.url}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="kt-rail-card kt-rail-card-media kt-reveal-item"
            >
              <Miniatura info={info} />
              <span className="flex items-center gap-2 px-4 pt-4">
                {/* `.kt-rail-kind` trae 0.6rem (9,6px) desde index.css, que no se
                    toca desde acá. La utilidad de Tailwind vive en @layer
                    utilities y esa capa gana sin necesidad de !important. */}
                <span className="kt-rail-kind text-[0.75rem]">{info.kind || pageLabel}</span>
              </span>
              <strong className="title-font px-4 pt-1 text-[1.1rem] leading-[1.12] text-[#f5f5f5]">
                {item.label}
              </strong>
              <span className="m-4 mt-0 flex items-center justify-between gap-3 border-t border-[#2a2a2a] pt-3 text-[0.75rem] text-[#9aa0aa]">
                <span className="truncate">{info.host}</span>
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#383838]" aria-hidden="true">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.9]">
                    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />
                  </svg>
                </span>
              </span>
            </a>
          )
        })}
      </Rail>
    </section>
  )
}

export default ReferenceMaterial
