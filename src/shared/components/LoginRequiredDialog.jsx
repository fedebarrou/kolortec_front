import { useEffect } from 'react'
import { useLanguage } from '../i18n/LanguageProvider'
import { getGoogleAuthUrl } from '../services/contentService'

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

function OutlookIcon({ className }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#0078D4" d="M28.6 14.4h13.7c.9 0 1.7.8 1.7 1.7V32c0 1-.8 1.7-1.7 1.7H28.6V14.4z" />
      <path fill="#0078D4" d="M28.6 14.4h13.7c.9 0 1.7.8 1.7 1.7v3l-15.4 9-15.4-9v-3c0-.9.8-1.7 1.7-1.7h13.7z" opacity="0.5" />
      <path fill="#0078D4" d="M28.6 23.4l15.4-9V32c0 1-.8 1.7-1.7 1.7H28.6v-10.3z" opacity="0.7" />
      <path fill="#0078D4" d="M3 11.4l22-3v31.2l-22-3V11.4z" />
      <path fill="#FFFFFF" d="M14 18.4c-3.3 0-5.8 2.7-5.8 6s2.4 5.9 5.7 5.9 5.8-2.5 5.8-5.9-2.4-6-5.7-6zm-.1 9.7c-1.8 0-3-1.7-3-3.7s1.2-3.7 3-3.7 3 1.7 3 3.7-1.2 3.7-3 3.7z" />
    </svg>
  )
}

function LoginRequiredDialog({ isOpen, onClose, fileName }) {
  const { t } = useLanguage()
  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleProvider = (provider) => {
    if (provider === 'google') {
      // Vuelve a la MISMA página, no a la home: este diálogo casi siempre se abre
      // desde un "Descargar", y volver al inicio deja a la persona sin su archivo
      // y sin pista de qué pasó. Con la intención guardada aparte, al aterrizar
      // acá el aviso de descarga se dispara solo.
      window.location.href = getGoogleAuthUrl(window.location.pathname + window.location.search)
      return
    }
    // Outlook OAuth not yet configured in tiendita — close dialog
    onClose()
  }

  /* z-1900: este diálogo bloquea una descarga, así que tiene que ganarle a TODO
     lo que flota en el sitio — el nudge de login (1450), el toast de
     "Sincronizando" (1500) y el lightbox de la ficha de producto (1800), que se
     renderiza en la MISMA página que este diálogo. Estaba en z-100: hasta el
     botón flotante de WhatsApp (que estaba en 1400) le pasaba por encima, y
     clickearlo abría el panel de WhatsApp sobre el modal todavía abierto.
     `aria-modal="true"` no es sólo accesibilidad: es el contrato por el que el
     flotante se entera de que hay un modal y se esconde. No sacarlo. */
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-required-title"
      className="fixed inset-0 z-[1900] grid place-items-center px-4 py-6"
    >
      <button
        type="button"
        aria-label={t('loginDialog.close', 'Cerrar')}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
      />
      <div className="relative z-10 w-full max-w-[440px] rounded-[14px] border border-[#2a2a2a] bg-[#0f0f10] p-6 shadow-[0_30px_60px_rgba(0,0,0,0.5)] sm:p-8">
        <button
          type="button"
          onClick={onClose}
          aria-label={t('loginDialog.close', 'Cerrar')}
          className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-[#aeb2ba] transition hover:bg-white/10 hover:text-white"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-black">
          <span className="material-symbols-outlined text-[26px]" aria-hidden="true">lock</span>
        </div>

        <h2
          id="login-required-title"
          className="title-font m-0 mt-3 text-[1.55rem] leading-[1.1]"
        >
          {t('loginDialog.title', 'Inicia sesion para descargar')}<span className="text-primary">.</span>
        </h2>
        <p className="mt-2 mb-6 text-[0.95rem] leading-[1.5] text-[#aeb2ba]">
          {fileName
            ? <>{t('loginDialog.bodyWithFile', 'Necesitamos confirmar tu cuenta antes de descargar')} <span className="font-bold text-white">{fileName}</span>.</>
            : t('loginDialog.body', 'Necesitamos confirmar tu cuenta para acceder a esta descarga.')}
        </p>

        <div className="grid gap-2.5">
          <button
            type="button"
            onClick={() => handleProvider('google')}
            className="inline-flex items-center justify-center gap-3 rounded-[10px] border border-[#dadce0] bg-white py-3 px-4 text-[0.9rem] font-bold text-[#1f1f1f] transition hover:bg-[#f7f7f7]"
          >
            <GoogleIcon className="h-5 w-5" />
            {t('loginDialog.continueGoogle', 'Continuar con Google')}
          </button>
          <button
            type="button"
            onClick={() => handleProvider('outlook')}
            className="inline-flex items-center justify-center gap-3 rounded-[10px] bg-[#0a3a6b] py-3 px-4 text-[0.9rem] font-bold text-white transition hover:bg-[#0d4682]"
          >
            <OutlookIcon className="h-5 w-5" />
            {t('loginDialog.continueOutlook', 'Continuar con Outlook')}
          </button>
        </div>

        <p className="mt-5 text-center text-[0.72rem] leading-[1.4] text-[#7a7e87]">
          {t('loginDialog.terms', 'Al continuar aceptas nuestros Terminos y Politica de Privacidad.')}
        </p>
      </div>
    </div>
  )
}

export default LoginRequiredDialog
