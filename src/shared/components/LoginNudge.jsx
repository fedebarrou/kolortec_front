import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { useLanguage } from '../i18n/LanguageProvider'
import { useAuth } from '../auth/AuthContext'
import { useLightRigChime } from '../audio/useLightRigChime'

// Flotante global: tras ~45s de navegación, invita a iniciar sesión a usuarios sin sesión.
// Aparece 1 vez por sesión; si se cierra, no vuelve por unos días (localStorage).
const SHOW_DELAY = 70_000
const SESSION_KEY = 'kt-login-nudge-shown'
const DISMISS_KEY = 'kt-login-nudge-dismissed-at'
const SNOOZE_MS = 5 * 24 * 60 * 60 * 1000

// Storage puede tirar (Safari private mode) — nunca romper por eso.
const safeGet = (storage, key) => {
  try {
    return window[storage].getItem(key)
  } catch {
    return null
  }
}
const safeSet = (storage, key, value) => {
  try {
    window[storage].setItem(key, value)
  } catch {
    /* noop */
  }
}

function LoginNudge() {
  const { t } = useLanguage()
  const { user, loading } = useAuth()
  const playChime = useLightRigChime()
  const [open, setOpen] = useState(false)
  const authRef = useRef({ user, loading })
  authRef.current = { user, loading }

  useEffect(() => {
    if (safeGet('sessionStorage', SESSION_KEY)) return undefined
    const dismissedAt = Number(safeGet('localStorage', DISMISS_KEY)) || 0
    if (dismissedAt && Date.now() - dismissedAt < SNOOZE_MS) return undefined

    let cancelled = false
    let scrollCleanup = null
    const reallyShow = () => {
      if (cancelled) return
      safeSet('sessionStorage', SESSION_KEY, '1')
      setOpen(true)
      playChime()
    }
    const show = () => {
      if (cancelled) return
      const { user: u, loading: l } = authRef.current
      if (l || u) return
      if (document.hidden) {
        // Pestaña en background: esperamos a que vuelva a ser visible.
        const onVisible = () => {
          if (!document.hidden) {
            document.removeEventListener('visibilitychange', onVisible)
            show()
          }
        }
        document.addEventListener('visibilitychange', onVisible)
        return
      }
      // Gate: en la home hay un scrollytelling que ocupa el arranque; el aviso aparece SOLO cuando
      // ya lo pasamos (su contenedor quedó por encima del viewport). En páginas sin
      // scrollytelling aparece directo.
      //
      // El atributo era [data-scrolly-spacer], del ScrollytellingSection viejo. El renderer
      // actual emite [data-scroll-hero], así que el selector no encontraba nada nunca y el
      // gate caía siempre a la rama "sin scrollytelling": el aviso de login podía aparecer
      // ENCIMA de la historia.
      const spacer = document.querySelector('[data-scroll-hero]')
      if (spacer && spacer.getBoundingClientRect().bottom > 0) {
        const onScroll = () => {
          const { user: u2, loading: l2 } = authRef.current
          if (l2 || u2) { window.removeEventListener('scroll', onScroll); scrollCleanup = null; return }
          if (spacer.getBoundingClientRect().bottom <= 0) {
            window.removeEventListener('scroll', onScroll)
            scrollCleanup = null
            reallyShow()
          }
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        scrollCleanup = () => window.removeEventListener('scroll', onScroll)
        return
      }
      reallyShow()
    }
    const timer = setTimeout(show, SHOW_DELAY)
    return () => {
      cancelled = true
      clearTimeout(timer)
      if (scrollCleanup) scrollCleanup()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Si la sesión aparece con el nudge abierto (login en otra pestaña), lo cerramos.
  useEffect(() => {
    if (user && open) setOpen(false)
  }, [user, open])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const dismiss = () => {
    safeSet('localStorage', DISMISS_KEY, String(Date.now()))
    setOpen(false)
  }

  if (!open) return null

  // Portal a body: .kt-app-shell es un stacking context z-0 y el layer del scrollytelling
  // (portaleado a body, z-[5]) taparía el flotante; a nivel body el z-[1450] sí manda.
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-[86px] z-[1450] w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-[rgba(244,223,51,0.38)] bg-[#0f0f10] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.42)] motion-safe:animate-[kt-nudge-in_400ms_ease-out] md:top-[96px]"
    >
      {/* Caret apuntando al botón de iniciar sesión del header */}
      <span
        aria-hidden="true"
        className="absolute -top-[7px] right-20 h-3.5 w-3.5 rotate-45 border-l border-t border-[rgba(244,223,51,0.38)] bg-[#0f0f10]"
      />
      <p className="text-[0.9rem] leading-snug text-[#eef0f4]">
        {t('loginNudge.body', 'No estás registrado. ¿Querés iniciar sesión y enterarte de nuestras novedades? Son dos clicks.')}
      </p>
      <div className="mt-3 flex items-center justify-between gap-2">
        <Link
          to="/login"
          onClick={dismiss}
          className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-[0.78rem] font-black uppercase tracking-[0.1em] text-black transition hover:brightness-105"
        >
          {t('loginNudge.cta', 'Iniciar sesión')}
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label={t('loginNudge.closeAria', 'Cerrar aviso')}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] text-[#cfd4dc] transition hover:border-primary hover:text-primary"
        >
          <span className="material-symbols-outlined text-[17px]" aria-hidden="true">close</span>
        </button>
      </div>
    </div>,
    document.body,
  )
}

export default LoginNudge
