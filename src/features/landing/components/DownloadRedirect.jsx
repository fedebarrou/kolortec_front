import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getDownloadInfo } from '../../../shared/services/contentService'
import { defaultLandingContent } from '../data/landingData'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

/**
 * DownloadRedirect — landing pública que abre el QR único de un producto.
 * Lee `id` de la ruta (/d/:id) y pide la info a la API pública de tiendita
 * (GET /public/download/:id) → { nombre, descripcion, imagen, type, target }.
 *
 * Siempre muestra imagen + nombre + descripción del producto. Comportamiento
 * por tipo de destino:
 * - type 'product' (default) → auto-redirect ~1s al detalle propio (/producto/:id,
 *   target relativo; getProductDetail matchea por id) vía navigate (SPA).
 * - type 'link'    → auto-redirect ~1s a la URL externa (window.location).
 * - type 'file'    → SIN auto-redirect: una descarga nunca arranca sola por
 *   escanear el QR — botón "Descargar" explícito.
 * - target null    → error / QR sin destino.
 */
function DownloadRedirect() {
  const { t } = useLanguage()
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ status: 'loading', data: null })
  const brand = defaultLandingContent.brand

  useEffect(() => {
    let alive = true
    setState({ status: 'loading', data: null })
    getDownloadInfo(id).then((data) => {
      if (!alive) return
      if (!data) {
        setState({ status: 'error', data: null })
      } else {
        setState({ status: 'ready', data })
      }
    })
    return () => {
      alive = false
    }
  }, [id])

  const target = state.data?.target || null
  const tipo = state.data?.type || 'product'
  const esArchivo = tipo === 'file'
  const esProducto = tipo === 'product'

  // Auto-redirect SOLO para detalle/link (~1s de branding antes de saltar).
  // Un archivo espera el click del usuario.
  useEffect(() => {
    if (state.status !== 'ready' || !target || esArchivo) return undefined
    const t = window.setTimeout(() => {
      if (esProducto) {
        navigate(target)
      } else {
        window.location.href = target
      }
    }, 1000)
    return () => window.clearTimeout(t)
  }, [state.status, target, esArchivo, esProducto, navigate])

  const nombre = state.data?.nombre || ''
  const descripcion = state.data?.descripcion || ''
  const imagen = state.data?.imagen || ''

  return (
    <section className="grid min-h-screen place-items-center bg-deep-black px-6 py-16">
      <div className="grid w-full max-w-md gap-8 text-center">
        {/* Marca */}
        <div className="flex justify-center">
          <img
            src={brand.logoUrl}
            alt={brand.name}
            className="h-10 w-auto object-contain"
          />
        </div>

        {state.status === 'loading' ? (
          <div className="grid place-items-center gap-4 py-10">
            <span
              className="material-symbols-outlined animate-spin text-[32px] text-primary"
              aria-hidden="true"
            >
              progress_activity
            </span>
            <p className="m-0 text-sm text-[#aeb5bf]">{t('pages.download.wait', 'Un momento…')}</p>
          </div>
        ) : state.status === 'error' || !target ? (
          <div className="grid place-items-center gap-5 py-8">
            <span
              className="material-symbols-outlined grid h-14 w-14 place-items-center rounded-full border border-[rgba(244,223,51,0.35)] text-[28px] text-primary"
              aria-hidden="true"
            >
              link_off
            </span>
            {nombre ? (
              <h1 className="title-font m-0 text-[clamp(1.4rem,6vw,2rem)] leading-[1.02] text-white">
                {nombre}
              </h1>
            ) : null}
            <p className="m-0 max-w-[32ch] text-[0.95rem] leading-relaxed text-[#aeb5bf]">
              {t('pages.download.notFound', 'No encontramos el destino de este código QR.')}
            </p>
            {/* Home es interno pero mantenemos <a> simple para máxima robustez */}
            <a
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.08em] text-primary transition hover:opacity-80"
            >
              {t('pages.download.home', 'Volver al inicio')}
            </a>
          </div>
        ) : (
          <div className="grid place-items-center gap-6">
            {imagen ? (
              <img
                src={imagen}
                alt={nombre}
                className="h-40 w-40 rounded-2xl border border-[rgba(255,255,255,0.1)] object-cover"
              />
            ) : null}
            <div className="grid gap-2">
              {nombre ? (
                <h1 className="title-font m-0 text-[clamp(1.5rem,7vw,2.4rem)] leading-[1.02] text-white">
                  {nombre}
                </h1>
              ) : null}
              {descripcion ? (
                <p className="m-0 line-clamp-3 text-[0.9rem] leading-relaxed text-[#aeb5bf]">
                  {descripcion}
                </p>
              ) : null}
              <p className="m-0 text-[0.95rem] text-[#aeb5bf]">
                {esArchivo
                  ? t('pages.download.ready', 'Tu descarga está lista')
                  : esProducto
                    ? t('pages.download.toProduct', 'Te llevamos al producto')
                    : t('pages.download.redirecting', 'Te estamos redirigiendo')}
                <span className="text-primary">.</span>
              </p>
            </div>
            <a
              href={target}
              {...(esArchivo ? { download: '' } : {})}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-primary bg-primary px-8 py-3 text-sm font-bold uppercase tracking-[0.08em] text-deep-black transition hover:opacity-90"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                {esArchivo ? 'download' : esProducto ? 'arrow_forward' : 'open_in_new'}
              </span>
              {esArchivo ? t('pages.download.download', 'Descargar') : esProducto ? t('pages.download.viewProduct', 'Ver producto') : t('pages.download.continue', 'Continuar')}
            </a>
            {esArchivo ? (
              <p className="m-0 text-xs text-[#7a828d]">
                {t('pages.download.fileHint', 'Podés bajar el archivo desde acá cuando quieras.')}
              </p>
            ) : (
              <p className="m-0 text-xs text-[#7a828d]">
                {t('pages.download.autoHint', 'Te estamos redirigiendo automáticamente…')}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default DownloadRedirect
