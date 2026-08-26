import LandingPage from '../../landing/components/LandingPage'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import Seo from '../../../shared/seo/Seo'
import { organizationJsonLd, websiteJsonLd } from '../../../shared/seo/jsonLd'

function HomePage() {
  const { t } = useLanguage()
  return (
    <>
      <Seo
        title={t('seo.homeTitle', 'Kolortec · Iluminación profesional Ready to Work')}
        description={t('seo.homeDesc', 'Fabricante argentino de iluminación profesional para espectáculo. Equipos Ready to Work con respaldo, repuestos y soporte técnico local.')}
        path="/"
        jsonLd={[organizationJsonLd, websiteJsonLd]}
      />
      {/* H1 semántico único para la home (visualmente oculto: el hero usa H2 por carrusel) */}
      <h1 className="sr-only">
        {t('pages.homeH1', 'Kolortec — Iluminación profesional Ready to Work, fabricante argentino con soporte local')}
      </h1>
      <LandingPage />
    </>
  )
}

export default HomePage
