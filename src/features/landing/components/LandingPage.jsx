import Divider from './Divider'
import DistributorTeaserSection from './DistributorTeaserSection'
import FeaturedSection from './FeaturedSection'
import HeroSection from './HeroSection'
import InstagramSection from './InstagramSection'
import RentalTeaserSection from './RentalTeaserSection'
import ScrollytellingSection from './ScrollytellingSection'
import ShopSection from './ShopSection'
import SupportSection from './SupportSection'
import SectionErrorBoundary from './SectionErrorBoundary'
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
  const { content, loading } = useLandingContent()

  const hasProducts = (content.products?.items?.length ?? 0) > 0

  return (
    <>
      <SectionErrorBoundary name="Scrollytelling">
        <ScrollytellingSection lines={content.lines} />
      </SectionErrorBoundary>
      <Divider />
      {/* Reserva el alto del navbar (que aparece al terminar el scrollytelling) para que no tape el
          heading de la primera sección. Compensado por el zoom del .kt-zoom-canvas.
          Orden pedido por el cliente post-scroll: Hero (banner) → Instagram → Productos. */}
      <div style={{ paddingTop: 'calc(84px / var(--kt-canvas-scale, 1))' }}>
        <SectionErrorBoundary name="Hero">
          <HeroSection hero={content.hero} />
        </SectionErrorBoundary>
      </div>
      <Divider />
      <SectionErrorBoundary name="Instagram">
        <InstagramSection gallery={content.gallery} />
      </SectionErrorBoundary>
      {hasProducts ? (
        <>
          <Divider />
          <SectionErrorBoundary name="Featured">
            <FeaturedSection products={content.products} />
          </SectionErrorBoundary>
        </>
      ) : null}
      <Divider />
      <SectionErrorBoundary name="Distributor">
        <DistributorTeaserSection distributor={content.distributor} />
      </SectionErrorBoundary>
      <Divider />
      <SectionErrorBoundary name="Rental">
        <RentalTeaserSection rental={content.rental} />
      </SectionErrorBoundary>
      <Divider />
      <SectionErrorBoundary name="Shop">
        <ShopSection shop={content.shop} />
      </SectionErrorBoundary>
      <Divider />
      <SectionErrorBoundary name="Support">
        <SupportSection support={content.support} loading={loading} />
      </SectionErrorBoundary>
    </>
  )
}

export default LandingPage
