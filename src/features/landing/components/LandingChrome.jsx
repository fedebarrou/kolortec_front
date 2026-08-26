import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import FooterSection from './FooterSection'
import { useScrollReveal } from '../../../shared/hooks/useScrollReveal'
import { useHideBootScreen } from '../../../shared/hooks/useHideBootScreen'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function LandingChrome({ loading, children }) {
  const { t } = useLanguage()
  useScrollReveal()
  const { pathname } = useLocation()
  // La home baja la pantalla de carga cuando resuelve su contenido (LandingPage,
  // que espera a la API). El resto de las rutas no espera nada: apenas montan, se
  // muestran. Sin esto una pagina interna se quedaria con la pantalla puesta hasta
  // la red de seguridad de 6s.
  useHideBootScreen(pathname !== '/')

  return (
    <div className="bg-[rgba(5,5,5,0.9)]">
      <main>
        {children ?? (
          <Suspense fallback={<div className="min-h-[60vh] bg-deep-black" />}>
            <Outlet />
          </Suspense>
        )}
      </main>
      <FooterSection />

      {loading ? <div className="fixed bottom-3 left-1/2 z-[1500] -translate-x-1/2 rounded-full border border-[#3a3a3a] bg-[rgba(20,20,20,0.92)] px-3 py-2 text-xs text-[#d0d0d0]">{t('pages.syncing', 'Sincronizando…')}</div> : null}
    </div>
  )
}

export default LandingChrome
