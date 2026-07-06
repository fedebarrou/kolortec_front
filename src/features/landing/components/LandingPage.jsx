import Divider from './Divider'
import FeaturedSection from './FeaturedSection'
import HeroSection from './HeroSection'
import InstagramSection from './InstagramSection'
import SupportSection from './SupportSection'
import { useLandingContent } from '../hooks/useLandingContent'

/**
 * Landing DATA-DRIVEN y minimalista: refleja EXACTO lo cargado en tiendita para la cuenta.
 * Solo se muestra el Hero (preservado) + las secciones que tienen datos reales. Las secciones
 * de marketing hardcodeadas (Tienda / Distribuidores / Alquiler) y los fallbacks se quitaron:
 * si una cuenta no tiene datos de una sección, esa sección no aparece.
 */
function LandingPage() {
  const { content } = useLandingContent()

  const hasGallery = (content.gallery?.images?.length ?? 0) > 0
  const hasProducts = (content.products?.items?.length ?? 0) > 0
  const hasSupport = (content.support?.contacts?.length ?? 0) > 0

  return (
    <>
      <HeroSection hero={content.hero} />
      {hasGallery ? (
        <>
          <Divider />
          <InstagramSection gallery={content.gallery} />
        </>
      ) : null}
      {hasProducts ? (
        <>
          <Divider />
          <FeaturedSection products={content.products} />
        </>
      ) : null}
      {hasSupport ? (
        <>
          <Divider />
          <SupportSection support={content.support} />
        </>
      ) : null}
    </>
  )
}

export default LandingPage
