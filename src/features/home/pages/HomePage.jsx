import LandingPage from '../../landing/components/LandingPage'
import Seo from '../../../shared/seo/Seo'
import { organizationJsonLd, websiteJsonLd } from '../../../shared/seo/jsonLd'

function HomePage() {
  return (
    <>
      <Seo
        title="Kolortec · Iluminación profesional Ready to Work"
        description="Fabricante argentino de iluminación profesional para espectáculo. Equipos Ready to Work con respaldo, repuestos y soporte técnico local."
        path="/"
        jsonLd={[organizationJsonLd, websiteJsonLd]}
      />
      {/* H1 semántico único para la home (visualmente oculto: el hero usa H2 por carrusel) */}
      <h1 className="sr-only">
        Kolortec — Iluminación profesional Ready to Work, fabricante argentino con soporte local
      </h1>
      <LandingPage />
    </>
  )
}

export default HomePage
