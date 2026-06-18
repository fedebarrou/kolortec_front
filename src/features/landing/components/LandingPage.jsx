import Divider from './Divider'
import FeaturedSection from './FeaturedSection'
import HeroSection from './HeroSection'
import InstagramSection from './InstagramSection'
import ServicesSection from './ServicesSection'
import ShopSection from './ShopSection'
import SupportSection from './SupportSection'
import DistributorTeaserSection from './DistributorTeaserSection'
import RentalTeaserSection from './RentalTeaserSection'
import { useLandingContent } from '../hooks/useLandingContent'

function LandingPage() {
  const { content } = useLandingContent()

  return (
    <>
      <HeroSection hero={content.hero} />
      <Divider />
      <InstagramSection gallery={content.gallery} />
      <Divider />
      <FeaturedSection products={content.products} />
      <ShopSection shop={content.shop} />
      {/* Seccion "Tres Pilares, Una Promesa" oculta temporalmente a pedido */}
      {/* <ServicesSection services={content.services} /> */}
      <SupportSection support={content.support} />
      <DistributorTeaserSection distributor={content.distributor} />
      <RentalTeaserSection rental={content.rental} />
    </>
  )
}

export default LandingPage
