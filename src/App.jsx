import { lazy, Suspense } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import LandingChrome from './features/landing/components/LandingChrome'
import Seo from './shared/seo/Seo'
import { useLanguage } from './shared/i18n/LanguageProvider'
import { usePageTracking } from './shared/services/tracking'

const HomePage = lazy(() => import('./features/home/pages/HomePage'))
const ShopPage = lazy(() => import('./features/catalog/pages/ShopPage'))
const CategoryPage = lazy(() => import('./features/catalog/pages/CategoryPage'))
const LinePage = lazy(() => import('./features/catalog/pages/LinePage'))
const ProductDetailPage = lazy(() => import('./features/product/pages/ProductDetailPage'))
const ServicesPage = lazy(() => import('./features/services/pages/ServicesPage'))
const SupportPage = lazy(() => import('./features/support/pages/SupportPage'))
const GarantiasPage = lazy(() => import('./features/warranty/pages/GarantiasPage'))
const ContactPage = lazy(() => import('./features/contact/pages/ContactPage'))
const JoinPage = lazy(() => import('./features/join/pages/JoinPage'))
const LoginPage = lazy(() => import('./features/auth/pages/LoginPage'))
const GuidesIndexPage = lazy(() => import('./features/guides/pages/GuidesIndexPage'))
const GuideDetailPage = lazy(() => import('./features/guides/pages/GuideDetailPage'))
const DownloadRedirect = lazy(() => import('./features/landing/components/DownloadRedirect'))

/**
 * 404 — no existía. Cualquier URL mal tipeada caía en un <Routes> sin comodín:
 * ni ruta, ni layout, ni footer. La pantalla quedaba en negro con el header
 * flotando arriba (900px de alto, <title> vacío) y sin una sola forma de volver.
 *
 * Vive acá adentro y no en su propio archivo porque es la contracara del ruteo:
 * es la rama "ninguna de las anteriores" de esta misma tabla.
 */
function NotFoundPage() {
  const { t } = useLanguage()

  return (
    /* Mismo contenedor que /servicios y /garantias (px-6 / lg:px-40) para que el
       título arranque en la misma guía vertical que el resto del sitio. */
    <section className="min-h-[52vh] bg-[#050505] px-6 py-[clamp(56px,8vw,96px)] lg:px-40">
      <Seo
        title={t('seo.notFound', 'Página no encontrada · Kolortec')}
        description={t('seo.notFoundDesc', 'La página que buscás no existe o cambió de dirección. Volvé al inicio o entrá al catálogo completo de iluminación Kolortec.')}
        noindex
      />
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
        <span className="text-[0.75rem] font-black uppercase tracking-[0.22em] text-primary">404</span>
      </div>
      <h1 className="title-font m-0 mt-4 text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02] text-white">
        {t('pages.notFound.title', 'Esta página no existe')}
        <span className="text-primary">.</span>
      </h1>
      <p className="body-font mt-5 max-w-[52ch] text-[0.95rem] leading-relaxed text-slate-400">
        {t('pages.notFound.body', 'El enlace que seguiste no lleva a ningún lado: la dirección cambió o nunca existió. Desde acá volvés a lo que sí está.')}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          to="/"
          className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-black uppercase tracking-[0.08em] text-[#0b0b0b] transition hover:brightness-105"
        >
          {t('a11y.home', 'Ir al inicio')}
        </Link>
        <Link
          to="/products"
          className="inline-flex h-12 items-center justify-center rounded-lg border border-white/20 px-6 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:border-primary hover:text-primary"
        >
          {t('pageTitle.products', 'Productos')}
        </Link>
        <Link
          to="/descargas"
          className="inline-flex h-12 items-center justify-center rounded-lg border border-white/20 px-6 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:border-primary hover:text-primary"
        >
          {t('header.nav.support', 'Soporte')}
        </Link>
      </div>
    </section>
  )
}

function App() {
  usePageTracking()

  return (
    <Routes>
      <Route element={<LandingChrome />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ShopPage />} />
        <Route path="/products/:categorySlug" element={<CategoryPage />} />
        {/* Linea de producto: existe para que los accesos del hero y del
            scrolltelling (href de texto libre) tengan a donde apuntar. */}
        <Route path="/linea/:lineSlug" element={<LinePage />} />
        <Route path="/lineas/:lineSlug" element={<LinePage />} />
        <Route path="/producto/:slug" element={<ProductDetailPage />} />
        <Route path="/servicios" element={<ServicesPage />} />
        {/* La pagina dejo de ser "soporte" a secas: es el catalogo de manuales y
            librerias, y /descargas dice eso. /soporte redirige en vez de romper
            los links que ya existan afuera (y los que sigue habiendo en guias). */}
        <Route path="/descargas" element={<SupportPage />} />
        <Route path="/soporte" element={<Navigate to="/descargas" replace />} />
        {/* Las guias NO se mudan: sus URLs estan indexadas y son contenido, no
            descargas. Siguen colgando de /soporte/guias. */}
        <Route path="/soporte/guias" element={<GuidesIndexPage />} />
        <Route path="/soporte/guias/:slug" element={<GuideDetailPage />} />
        <Route path="/garantias" element={<GarantiasPage />} />
        <Route path="/contacto" element={<ContactPage />} />
        <Route path="/sumate" element={<JoinPage />} />
        {/* Las dos rutas viejas siguen funcionando: eran dos formularios casi
            idénticos y ahora el tipo se elige dentro de /sumate. Redirigen en
            vez de romper links que ya existan afuera. */}
        <Route path="/distribuidores" element={<Navigate to="/sumate" replace />} />
        <Route path="/rentals" element={<Navigate to="/sumate" replace />} />
        <Route path="/login" element={<LoginPage />} />
        {/* Comodín DENTRO del layout: el 404 tiene que traer header y footer,
            que son justamente la forma de salir de él. */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      {/* Landing de descarga (abre el QR del producto) — clean full-screen, sin chrome */}
      <Route
        path="/d/:id"
        element={
          <Suspense fallback={<div className="min-h-screen bg-deep-black" />}>
            <DownloadRedirect />
          </Suspense>
        }
      />
      <Route path="/editable" element={<Navigate to="/" replace />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
