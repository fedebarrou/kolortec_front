import Divider from './Divider'
import DistributorTeaserSection from './DistributorTeaserSection'
import FeaturedSection from './FeaturedSection'
import HeroSection from './HeroSection'
import InstagramSection from './InstagramSection'
import RentalTeaserSection from './RentalTeaserSection'
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
      <ScrollytellingSection lines={content.lines} />
      <Divider />
      {/* Reserva el alto del navbar (que aparece al terminar el scrollytelling) para que no tape el
          heading de la primera sección. Compensado por el zoom del .kt-zoom-canvas. */}
      <div style={{ paddingTop: 'calc(84px / var(--kt-canvas-scale, 1))' }}>
        <InstagramSection gallery={content.gallery} />
      </div>
      {hasProducts ? (
        <>
          <Divider />
          <FeaturedSection products={content.products} />
        </>
      ) : null}
      <Divider />
      <HeroSection hero={content.hero} />
      <Divider />
      <DistributorTeaserSection distributor={content.distributor} />
      <Divider />
      <RentalTeaserSection rental={content.rental} />
      <Divider />
      <ShopSection shop={content.shop} />
      <Divider />
      <SupportSection support={content.support} />
    </>
  )
}

export default LandingPage
