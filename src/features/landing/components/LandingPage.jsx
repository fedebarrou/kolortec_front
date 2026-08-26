import Divider from './Divider'
import DistributorTeaserSection from './DistributorTeaserSection'
import FeaturedSection from './FeaturedSection'
import HeroSection from './HeroSection'
import InstagramSection from './InstagramSection'
import RentalTeaserSection from './RentalTeaserSection'
import ScrolltellingSection from './ScrolltellingSection'
import ShopSection from './ShopSection'
import SupportSection from './SupportSection'
import SectionErrorBoundary from './SectionErrorBoundary'
import { useLandingContent } from '../hooks/useLandingContent'

// Logo de la barra superior del scrolltelling (SnapChrome). Mismo asset que usaba
// el ScrollytellingSection hardcodeado. OJO: el archivo tiene extensión .jpeg pero
// en realidad es WebP — no cambiar el nombre sin re-exportarlo.
const KOLORTEC_LOGO = '/assets/Grupo-Kolortec-1024x150.jpeg'

/**
 * Landing DATA-DRIVEN: refleja EXACTO lo cargado en tiendita para la cuenta. Cada sección mantiene
 * su ESTRUCTURA (título/leyenda) y oculta solo sus listas de datos vacías (degradado fino):
 *  - Instagram: siempre el "Seguinos en @"; el carrusel solo si hay IG conectado.
 *  - Productos destacados: solo si hay productos (imágenes faltantes → placeholder en ProductCard).
 *  - Soporte (ShopSection, diseño 2c: intro amarilla que funde a negro + video ghost al borde
 *    derecho): siempre; la biblioteca de guías vive en /soporte/guias vía su acceso.
 *  - Contactanos (SupportSection): siempre, con su carrusel de imagen; contactos ocultos si vacío.
 * Las secciones de marketing hardcodeadas (Distribuidores / Alquiler) siguen quitadas.
 */
function LandingPage() {
  const { content, loading } = useLandingContent()

  const hasProducts = (content.products?.items?.length ?? 0) > 0

  return (
    <>
      {/* La historia sale del diseño configurado en el admin de Modora
          (active_scroll_id), no de código. Sin diseño activo no renderiza nada.
          isFirst: es lo primero de la página (takeover + navbar oculto hasta
          que termina). */}
      <SectionErrorBoundary name="Scrolltelling">
        <ScrolltellingSection config={content.hero?.scrollLabConfig} logoUrl={KOLORTEC_LOGO} isFirst />
      </SectionErrorBoundary>
      {/* SIN spacer y SIN Divider entre la historia y el hero: los dos son
          full-bleed y van pegados, uno cubriendo el viewport después del otro.
          Antes acá había un padding-top de 84px "para reservar el alto del
          navbar" — escrito cuando lo que seguía era una sección de texto cuyo
          heading el navbar sticky tapaba. Con un hero a pantalla completa eso
          sólo dejaba una banda negra, y encima se sumaba a la resta que ya hacía
          HeroSection: entre las dos se comían 164px del viewport.
          El navbar es `sticky top-0` y va POR ENCIMA del hero (es translúcido
          con backdrop-blur), que es como se monta un hero full-bleed.
          Orden pedido por el cliente post-scroll: Hero (banner) → Instagram → Productos. */}
      <SectionErrorBoundary name="Hero">
        <HeroSection hero={content.hero} />
      </SectionErrorBoundary>
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
