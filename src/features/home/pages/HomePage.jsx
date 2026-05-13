import LandingPage from '../../landing/components/LandingPage'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import usePageTitle from '../../../shared/hooks/usePageTitle'

function HomePage() {
  const { t } = useLanguage()
  usePageTitle(t('pageTitle.home', 'Inicio'))
  return <LandingPage />
}

export default HomePage
