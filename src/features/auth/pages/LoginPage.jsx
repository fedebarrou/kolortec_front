import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Seo from '../../../shared/seo/Seo'
import { getGoogleAuthUrl, requestOtp, verifyOtp } from '../../../shared/services/contentService'
import { useAuth } from '../../../shared/auth/AuthContext'

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
// OTP step 1 — channel selector + identifier input
// ---------------------------------------------------------------------------
function OtpRequestStep({ onSent }) {
  const [channel, setChannel] = useState('email')
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const placeholder = channel === 'email' ? 'tu@email.com' : '+54 9 11 1234-5678'
  const inputType = channel === 'email' ? 'email' : 'tel'

  async function handleSubmit(e) {
    e.preventDefault()
    const value = identifier.trim()
    if (!value) {
      setError('Ingresá tu ' + (channel === 'email' ? 'email' : 'numero de WhatsApp') + '.')
      return
    }

    // Client-side format validation — mirrors back-end enum rules.
    if (channel === 'email') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        setError('Ingresá un email válido (ej: nombre@dominio.com).')
        return
      }
    } else {
      // whatsapp / tel: strip non-digits and check length 7–15
      const digits = value.replace(/\D/g, '')
      if (digits.length < 7 || digits.length > 15) {
        setError('Ingresá un numero de WhatsApp válido (entre 7 y 15 digitos).')
        return
      }
    }

    setError('')
    setLoading(true)
    try {
      await requestOtp({ channel, identifier: value })
      onSent({ channel, identifier: value })
    } catch (err) {
      setError(err.message || 'No se pudo enviar el codigo. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3" noValidate>
      {/* Channel selector */}
      <div className="flex gap-2" role="group" aria-label="Canal de verificacion">
        {['email', 'whatsapp'].map((ch) => (
          <button
            key={ch}
            type="button"
            onClick={() => { setChannel(ch); setIdentifier(''); setError('') }}
            className={`flex-1 rounded-[8px] border py-2.5 text-[0.82rem] font-bold uppercase tracking-[0.08em] transition ${
              channel === ch
                ? 'border-primary bg-primary text-[#090909]'
                : 'border-[#2e2e2e] bg-transparent text-[#a0a0a0] hover:border-[#555]'
            }`}
          >
            {ch === 'email' ? 'Email' : 'WhatsApp'}
          </button>
        ))}
      </div>

      {/* Identifier input */}
      <div className="grid gap-1.5">
        <label htmlFor="otp-identifier" className="text-[0.78rem] font-semibold uppercase tracking-[0.07em] text-[#a0a0a0]">
          {channel === 'email' ? 'Correo electronico' : 'Numero de WhatsApp'}
        </label>
        <input
          id="otp-identifier"
          type={inputType}
          autoComplete={channel === 'email' ? 'email' : 'tel'}
          value={identifier}
          onChange={(e) => { setIdentifier(e.target.value); setError('') }}
          placeholder={placeholder}
          disabled={loading}
          className="w-full rounded-[8px] border border-[#2e2e2e] bg-[#0e0e0e] px-4 py-3 text-[0.95rem] text-[#f0f0f0] placeholder-[#555] outline-none transition focus:border-primary disabled:opacity-50"
        />
      </div>

      {error && (
        <p role="alert" className="text-[0.8rem] text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-[8px] bg-primary py-3 text-[0.9rem] font-bold uppercase tracking-[0.08em] text-[#090909] transition hover:brightness-105 disabled:opacity-60"
      >
        {loading ? 'Enviando...' : 'Enviar codigo'}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// OTP step 2 — 6-digit code input
// ---------------------------------------------------------------------------
function OtpVerifyStep({ channel, identifier, onBack, setUser }) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const channelLabel = channel === 'email' ? 'email' : 'WhatsApp'

  async function handleSubmit(e) {
    e.preventDefault()
    const value = code.trim()
    if (value.length !== 6) {
      setError('El codigo debe tener 6 digitos.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await verifyOtp({ channel, identifier, code: value })
      if (data?.user) {
        setUser(data.user)
      }
      navigate('/')
    } catch (err) {
      setError(err.message || 'Codigo invalido. Revisalo e intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3" noValidate>
      <p className="text-[0.85rem] text-[#a0a0a0] leading-[1.5]">
        Te enviamos un codigo de 6 digitos a tu {channelLabel}{' '}
        <strong className="text-[#e0e0e0]">{identifier}</strong>.
      </p>

      <div className="grid gap-1.5">
        <label htmlFor="otp-code" className="text-[0.78rem] font-semibold uppercase tracking-[0.07em] text-[#a0a0a0]">
          Codigo de verificacion
        </label>
        <input
          id="otp-code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError('') }}
          placeholder="123456"
          disabled={loading}
          className="w-full rounded-[8px] border border-[#2e2e2e] bg-[#0e0e0e] px-4 py-3 text-center text-[1.4rem] font-bold tracking-[0.35em] text-[#f0f0f0] placeholder-[#555] outline-none transition focus:border-primary disabled:opacity-50"
        />
      </div>

      {error && (
        <p role="alert" className="text-[0.8rem] text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || code.length !== 6}
        className="rounded-[8px] bg-primary py-3 text-[0.9rem] font-bold uppercase tracking-[0.08em] text-[#090909] transition hover:brightness-105 disabled:opacity-60"
      >
        {loading ? 'Verificando...' : 'Ingresar'}
      </button>

      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        className="text-[0.8rem] text-[#7a7e87] underline-offset-2 hover:text-primary hover:underline disabled:opacity-50"
      >
        Volver / cambiar {channelLabel}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function LoginPage() {
  // OTP state: null = step 1, { channel, identifier } = step 2
  const [otpSent, setOtpSent] = useState(null)
  const { setUser } = useAuth()

  function handleGoogleLogin() {
    window.location.href = getGoogleAuthUrl()
  }

  return (
    <section className="min-h-screen bg-[#050505] px-6 py-[42px] lg:px-40">
      <Seo
        title="Iniciar sesion · Kolortec"
        description="Accede a tu cuenta Kolortec para gestionar pedidos, cotizaciones y descargas de documentacion tecnica."
        path="/login"
        noindex
      />
      <div className="kt-reveal mb-8">
        <h1 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(3.8rem,10vw,7rem)] leading-[1.02]">
          Iniciar sesion
          <span className="text-primary">.</span>
        </h1>
        <p className="mb-3 text-[#a0a0a0]">Accede a tu cuenta para gestionar pedidos y cotizaciones.</p>
        <Link to="/" className="font-bold text-primary">Volver al inicio</Link>
      </div>

      <div className="kt-reveal max-w-[400px] grid gap-4">
        {/* OTP section */}
        <div className="rounded-[12px] border border-[#1e1e1e] bg-[#0a0a0a] p-5 grid gap-4">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[#5a5e67]">
            Ingreso con codigo
          </p>

          {otpSent === null ? (
            <OtpRequestStep onSent={setOtpSent} />
          ) : (
            <OtpVerifyStep
              channel={otpSent.channel}
              identifier={otpSent.identifier}
              onBack={() => setOtpSent(null)}
              setUser={setUser}
            />
          )}
        </div>

        {/* Separator */}
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-[#1e1e1e]" />
          <span className="text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-[#555]">o</span>
          <span className="h-px flex-1 bg-[#1e1e1e]" />
        </div>

        {/* Google — preserved exactly */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="inline-flex items-center justify-center gap-3 rounded-[10px] border border-[#dadce0] bg-white py-3 px-5 text-[0.95rem] font-bold text-[#1f1f1f] transition hover:bg-[#f7f7f7]"
        >
          <GoogleIcon className="h-5 w-5" />
          Entrar con Google
        </button>

        <p className="text-[0.72rem] leading-[1.5] text-[#7a7e87] text-center">
          Al continuar aceptas nuestros Terminos y Politica de Privacidad.
        </p>
      </div>
    </section>
  )
}

export default LoginPage
