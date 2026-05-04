import { useEffect } from 'react'
import Divider from './Divider'
import FeaturedSection from './FeaturedSection'
import HeroSection from './HeroSection'
import InstagramSection from './InstagramSection'
import ServicesSection from './ServicesSection'
import ShopSection from './ShopSection'
import SupportSection from './SupportSection'
import { useLandingContent } from '../hooks/useLandingContent'

function LandingPage() {
  const { content } = useLandingContent()

  useEffect(() => {
    const sections = Array.from(document.querySelectorAll('.kt-section-reveal'))
    if (sections.length === 0) return undefined

    const reveal = (node) => node.classList.add('is-visible')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          reveal(entry.target)
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.18, rootMargin: '0px 0px -10% 0px' },
    )

    sections.forEach((section) => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <HeroSection hero={content.hero} />
      <Divider />
      <InstagramSection gallery={content.gallery} />
      <Divider />
      <FeaturedSection products={content.products} />
      <ShopSection shop={content.shop} products={content.products.items} />
      <ServicesSection services={content.services} />
      <SupportSection support={content.support} />
    </>
  )
}

export default LandingPage
