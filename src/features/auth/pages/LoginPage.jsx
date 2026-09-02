import { Link } from 'react-router-dom'
import Seo from '../../../shared/seo/Seo'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { getGoogleAuthUrl } from '../../../shared/services/contentService'

function GoogleIcon({ className }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8a12 12 0 110-24c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.5-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 5.1 29.3 3 24 3 16.3 3 9.6 7.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.4-4.5 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 40.5 16.2 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 01-4.1 5.6l6.2 5.2C40.9 35.7 45 30.4 45 24c0-1.4-.1-2.5-.4-3.5z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Page — ingreso/registro únicamente con Google.
// El primer inicio de sesión con Google crea la cuenta automáticamente.
// ---------------------------------------------------------------------------
function LoginPage() {
  const { t } = useLanguage()

  function handleGoogleLogin() {
    window.location.href = getGoogleAuthUrl()
  }

  return (
    <section className="min-h-screen bg-[#050505] px-6 py-[42px] lg:px-40">
      <Seo
        title={t('seo.loginTitle', 'Iniciar sesion · Kolortec')}
        description={t('seo.loginDesc', 'Accede a tu cuenta Kolortec para gestionar pedidos, cotizaciones y descargas de documentacion tecnica.')}
        path="/login"
        noindex
      />
      <div className="kt-reveal mb-8">
        <h1 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(3.8rem,10vw,7rem)] leading-[1.02]">
          {t('pages.login.title', 'Iniciar sesion')}
          <span className="text-primary">.</span>
        </h1>
        <p className="mb-3 text-[#a0a0a0]">{t('pages.login.subtitle', 'Entrá o creá tu cuenta con Google para gestionar pedidos y cotizaciones.')}</p>
        <Link to="/" className="font-bold text-primary">{t('pages.login.back', 'Volver al inicio')}</Link>
      </div>

      <div className="kt-reveal max-w-[400px] grid gap-4">
        {/* Google — iniciar sesión / registrarse (la primera vez crea la cuenta) */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="inline-flex items-center justify-center gap-3 rounded-[10px] border border-[#dadce0] bg-white py-3 px-5 text-[0.95rem] font-bold text-[#1f1f1f] transition hover:bg-[#f7f7f7]"
        >
          <GoogleIcon className="h-5 w-5" />
          {t('pages.login.google', 'Entrar o registrarte con Google')}
        </button>

        {/* Acá sí van con <Link>, no en pestaña nueva: es una página propia, no
            hay un flujo a medio hacer que se pierda al navegar. */}
        <p className="text-[0.75rem] leading-[1.5] text-[#7a7e87] text-center">
          {t('pages.login.legalPre', 'Al continuar aceptás nuestros')}{' '}
          <Link to="/terminos" className="text-[#aeb2ba] underline underline-offset-2 transition hover:text-white">
            {t('pages.login.termsLink', 'Términos y Condiciones')}
          </Link>{' '}
          {t('pages.login.legalAnd', 'y nuestra')}{' '}
          <Link to="/privacidad" className="text-[#aeb2ba] underline underline-offset-2 transition hover:text-white">
            {t('pages.login.privacyLink', 'Política de Privacidad')}
          </Link>.
        </p>
      </div>
    </section>
  )
}

export default LoginPage
