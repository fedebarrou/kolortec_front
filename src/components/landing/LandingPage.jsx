import ActionSection from './ActionSection'
import Divider from './Divider'
import FeaturedSection from './FeaturedSection'
import FooterSection from './FooterSection'
import HeaderSection from './HeaderSection'
import HeroSection from './HeroSection'
import InstagramSection from './InstagramSection'
import ServicesSection from './ServicesSection'
import ShopSection from './ShopSection'
import SupportSection from './SupportSection'
import { useLandingContent } from '../../hooks/useLandingContent'

function LandingPage() {
  const { content, loading } = useLandingContent()

  return (
    <div className="kt-page">
      <HeaderSection brand={content.brand} nav={content.nav} />
      <main>
        <HeroSection hero={content.hero} />
        <Divider />
        <InstagramSection gallery={content.gallery} />
        <Divider />
        <FeaturedSection products={content.products} />
        <ShopSection shop={content.shop} />
        <ServicesSection services={content.services} />
        <SupportSection support={content.support} />
        <ActionSection action={content.action} />
      </main>
      <FooterSection brand={content.brand} footer={content.footer} />
      {loading ? <div className="kt-loading-pill">Syncing from API...</div> : null}
    </div>
  )
}

export default LandingPage
