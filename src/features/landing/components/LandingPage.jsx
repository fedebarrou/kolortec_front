import Divider from './Divider'
import FeaturedSection from './FeaturedSection'
import HeroSection from './HeroSection'
import InstagramSection from './InstagramSection'
import ScrolltellingSection from './ScrolltellingSection'
import ClosingPhoto from './ClosingPhoto'
import StackOver from './StackOver'
import JoinTeaserSection from './JoinTeaserSection'
import ShopSection from './ShopSection'
import SupportSection from './SupportSection'
import SectionErrorBoundary from './SectionErrorBoundary'
import { useLandingContent } from '../hooks/useLandingContent'
import { useHideBootScreen } from '../../../shared/hooks/useHideBootScreen'

// Logo de la barra superior del scrolltelling (SnapChrome). Mismo asset que usaba
// el ScrollytellingSection hardcodeado. OJO: el archivo tiene extensión .jpeg pero
// en realidad es WebP — no cambiar el nombre sin re-exportarlo.
const KOLORTEC_LOGO = '/assets/Grupo-Kolortec-1024x150.jpeg'

// Foto de cierre: el frame del estadio lleno con los haces cruzados, el mismo
// material del scrolltelling. Para cambiarla, cambiá esta ruta (o cargá fotos de
// evento en la galería de la cuenta, que van de respaldo).
const FOTO_CIERRE = '/assets/scrolly-frames/f150.jpg'

/**
 * Landing DATA-DRIVEN: refleja EXACTO lo cargado en tiendita para la cuenta. Cada sección mantiene
 * su ESTRUCTURA (título/leyenda) y oculta solo sus listas de datos vacías (degradado fino):
 *  - Instagram: siempre el "Seguinos en @"; el carrusel solo si hay IG conectado.
 *  - Productos destacados: solo si hay productos (imágenes faltantes → placeholder en ProductCard).
 *  - Soporte (ShopSection, diseño 2c: intro amarilla que funde a negro + video ghost al borde
 *    derecho): siempre; la biblioteca de guías vive en /soporte/guias vía su acceso.
 *  - Contactanos (SupportSection): siempre, con su carrusel de imagen; contactos ocultos si vacío.
 * Las secciones de marketing hardcodeadas (Distribuidores / Alquiler) siguen quitadas.
 *
 * ORDEN (pedido del cliente): historia → Instagram → Hero → Destacados → Centro de soporte →
 * Sumate → Contactanos. La tira de marcas volvió al FOOTER (FooterSection), donde estaba antes.
 */
function LandingPage() {
  const { content, loading } = useLandingContent()

  // La pantalla de carga (index.html) se baja recien con el contenido resuelto:
  // hasta ese momento el documento no tiene ni scrolltelling ni hero, y cambia de
  // alto tres veces seguidas. `loading` pasa a false tambien si la API falla (el
  // finally de useLandingContent), asi que no puede quedarse trabada.
  useHideBootScreen(!loading)

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
      {/* SIN spacer propio entre la historia y lo que sigue: el ScrollRenderer ya
          se deja un margin-bottom de `--site-header-h + --story-gap`, o sea el alto
          REAL del navbar medido en vivo más aire. Agregarle un padding acá (había
          uno de 84px hardcodeado) duplicaba la reserva y dejaba una banda negra. */}
      <SectionErrorBoundary name="Instagram">
        <InstagramSection gallery={content.gallery} />
      </SectionErrorBoundary>
      <Divider />
      {/* El hero es full-bleed y arranca justo en el filo de la foto: el navbar es
          `sticky top-0` y va POR ENCIMA (es translúcido con backdrop-blur), que es
          como se monta un hero a pantalla completa. Por eso HeroSection NO le resta
          el alto del navbar al viewport. */}
      <SectionErrorBoundary name="Hero">
        <HeroSection hero={content.hero} />
      </SectionErrorBoundary>
      {/* Divider CON aire: el hero termina a sangre en el borde del viewport y la
          línea pegada al filo de la foto hace que las dos secciones se lean como una. */}
      <Divider space />
      {hasProducts ? (
        <>
          <SectionErrorBoundary name="Featured">
            <FeaturedSection products={content.products} />
          </SectionErrorBoundary>
        </>
      ) : null}
      {/* SIN hairline antes de la amarilla: la sección entra con su propia
          cortina y arranca a sangre. Una raya justo arriba le dibujaba un borde
          superior a un bloque que no tiene bordes. */}
      {/* APILADO: la amarilla se queda clavada al tope y Sumate sube por encima,
          en vez de empujarla. Es el momento inmersivo de la home — la sección ya
          ocupa la pantalla entera, así que el recurso cae natural ahí y no hace
          falta tocar el resto. Se fue el spacer que había acá: ahora no hay
          costura que suavizar, una tapa a la otra. */}
      <div className="kt-stack-pin">
        <SectionErrorBoundary name="Shop">
          <ShopSection shop={content.shop} ready={!loading} />
        </SectionErrorBoundary>
      </div>
      {/* "Sumate" va DESPUÉS de la sección amarilla: primero se muestra lo que
          Kolortec hace por vos (soporte, garantía, guías) y recién ahí se invita
          a sumarse. Antes eran DOS teasers espejados —distribuidores y rental—
          arriba del amarillo, compitiendo entre sí por la misma decisión.
          `kt-stack-over` + su fondo opaco es lo que la deja tapar a la amarilla. */}
      <StackOver>
        <SectionErrorBoundary name="Join">
          <JoinTeaserSection join={content.join} />
        </SectionErrorBoundary>
        {/* Contactanos cierra la página: Sumate ya trae su border-b, así que no hace
            falta Divider en la costura. */}
        <SectionErrorBoundary name="Support">
          <SupportSection support={content.support} loading={loading} />
        </SectionErrorBoundary>
        {/* Foto a sangre antes del pie: el cierre venía siendo texto sobre negro
            hasta el footer. Va el SHOW —el estadio con los haces, frame f150 de la
            historia— y no la galería de la cuenta: esa son fotos de producto (un
            clamp, un bidón de líquido de humo) y de cierre no dicen nada. La
            galería queda de respaldo por si algún día cargan fotos de eventos. */}
        <SectionErrorBoundary name="ClosingPhoto">
          <ClosingPhoto
            images={[FOTO_CIERRE, ...(content.gallery?.images ?? [])]}
            alt=""
          />
        </SectionErrorBoundary>
      </StackOver>
    </>
  )
}

export default LandingPage
