import Divider from './Divider'
import FeaturedSection from './FeaturedSection'
import HeroSection from './HeroSection'
import InstagramSection from './InstagramSection'
import SupportSection from './SupportSection'
import { useLandingContent } from '../hooks/useLandingContent'

/**
 * Landing DATA-DRIVEN: refleja EXACTO lo cargado en tiendita para la cuenta. Cada sección mantiene
 * su ESTRUCTURA (título/leyenda) y oculta solo sus listas de datos vacías (degradado fino):
 *  - Instagram: siempre el "Seguinos en @"; el carrusel solo si hay IG conectado.
 *  - Productos destacados: solo si hay productos (imágenes faltantes → placeholder en ProductCard).
 *  - Contactanos (amarilla): siempre; contactos y guías se ocultan si están vacíos.
 * Las secciones de marketing hardcodeadas (Tienda / Distribuidores / Alquiler) siguen quitadas.
 */
function LandingPage() {
  const { content } = useLandingContent()

  const hasProducts = (content.products?.items?.length ?? 0) > 0

  return (
    <>
      <HeroSection hero={content.hero} />
      <Divider />
      <InstagramSection gallery={content.gallery} />
      {hasProducts ? (
        <>
          <Divider />
          <FeaturedSection products={content.products} />
        </>
      ) : null}
      <Divider />
      <SupportSection support={content.support} />
    </>
  )
}

export default LandingPage
