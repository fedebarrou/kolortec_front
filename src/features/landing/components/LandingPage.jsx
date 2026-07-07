import Divider from './Divider'
import DistributorTeaserSection from './DistributorTeaserSection'
import FeaturedSection from './FeaturedSection'
import HeroSection from './HeroSection'
import InstagramSection from './InstagramSection'
import ScrollytellingSection from './ScrollytellingSection'
import ShopSection from './ShopSection'
import SupportSection from './SupportSection'
import { useLandingContent } from '../hooks/useLandingContent'

/**
 * Landing DATA-DRIVEN: refleja EXACTO lo cargado en tiendita para la cuenta. Cada sección mantiene
 * su ESTRUCTURA (título/leyenda) y oculta solo sus listas de datos vacías (degradado fino):
 *  - Instagram: siempre el "Seguinos en @"; el carrusel solo si hay IG conectado.
 *  - Productos destacados: solo si hay productos (imágenes faltantes → placeholder en ProductCard).
 *  - Soporte (ShopSection, amarilla con efecto visual): siempre; su "Biblioteca de guías" (blogs)
 *    a la derecha se oculta si no hay guías cargadas.
 *  - Contactanos (SupportSection): siempre, con su carrusel de imagen; contactos ocultos si vacío.
 * Las secciones de marketing hardcodeadas (Distribuidores / Alquiler) siguen quitadas.
 */
function LandingPage() {
  const { content } = useLandingContent()

  const hasProducts = (content.products?.items?.length ?? 0) > 0

  return (
    <>
      <ScrollytellingSection />
      <Divider />
      <InstagramSection gallery={content.gallery} />
      <Divider />
      <HeroSection hero={content.hero} />
      {hasProducts ? (
        <>
          <Divider />
          <FeaturedSection products={content.products} />
        </>
      ) : null}
      <Divider />
      <ShopSection shop={content.shop} />
      <Divider />
      <SupportSection support={content.support} />
      <Divider />
      <DistributorTeaserSection distributor={content.distributor} />
    </>
  )
}

export default LandingPage
