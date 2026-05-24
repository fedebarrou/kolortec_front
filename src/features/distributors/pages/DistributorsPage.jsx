import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import Seo from '../../../shared/seo/Seo'

const PARTNERS = [
  {
    name: 'Sonora Pro Lighting',
    domain: 'sonorapro.mx',
    region: 'Mexico',
    accent: '#f4df33',
    url: 'https://example.com/sonora-pro',
    mark: (
      <>
        <circle cx="12" cy="12" r="3.5" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none">
          <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.4 4.4l2.1 2.1M17.5 17.5l2.1 2.1M4.4 19.6l2.1-2.1M17.5 6.5l2.1-2.1" />
        </g>
      </>
    ),
  },
  {
    name: 'ProStage LATAM',
    domain: 'prostagelatam.com.ar',
    region: 'Argentina',
    accent: '#9efad4',
    url: 'https://example.com/prostage',
    mark: (
      <path d="M3 20l9-15 9 15H3z" stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round" />
    ),
  },
  {
    name: 'Espectro Brasil',
    domain: 'espectro.com.br',
    region: 'Brasil',
    accent: '#a9c4ff',
    url: 'https://example.com/espectro',
    mark: (
      <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round">
        <path d="M2 12c2.5-4 5-4 7.5 0s5 4 7.5 0S22 8 22 8" />
        <path d="M2 17c2.5-4 5-4 7.5 0s5 4 7.5 0S22 13 22 13" opacity="0.5" />
        <path d="M2 7c2.5-4 5-4 7.5 0s5 4 7.5 0S22 3 22 3" opacity="0.5" />
      </g>
    ),
  },
  {
    name: 'Andes Lighting Co.',
    domain: 'andeslighting.cl',
    region: 'Chile',
    accent: '#ffb37a',
    url: 'https://example.com/andes',
    mark: (
      <path d="M2 20l5.5-10 3.5 5 3-6 8 11H2z" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
    ),
  },
]

function DistributorsPage() {
  const { t } = useLanguage()
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', email: '', mensaje: '' })
  const [submitted, setSubmitted] = useState(false)
  const [partnerIndex, setPartnerIndex] = useState(0)
  const [partnerPaused, setPartnerPaused] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  useEffect(() => {
    if (partnerPaused) return undefined
    const id = setInterval(() => {
      setPartnerIndex((i) => (i + 1) % PARTNERS.length)
    }, 4200)
    return () => clearInterval(id)
  }, [partnerPaused])

  const eyebrow = t('distributors.eyebrow', 'Programa de distribuidores')
  const title = t('distributors.title', 'Sumate al equipo')
  const subtitle = t(
    'distributors.subtitle',
    'Completá el formulario y nuestro equipo comercial se va a poner en contacto en las proximas 48 horas habiles.',
  )
  const visitSiteLabel = t('distributors.visitSite', 'Visitar sitio')
  const networkTitle = t('distributors.networkTitle', 'Distribuidores autorizados')

  const labels = {
    nombre: t('distributors.fields.nombre', 'Nombre'),
    apellido: t('distributors.fields.apellido', 'Apellido'),
    telefono: t('distributors.fields.telefono', 'Telefono'),
    email: t('distributors.fields.email', 'Email'),
    mensaje: t('distributors.fields.mensaje', 'Contanos sobre tu negocio'),
  }
  const submitCta = t('distributors.submit', 'Enviar postulacion')
  const submittedTitle = t('distributors.submittedTitle', 'Recibimos tu postulacion')
  const submittedBody = t(
    'distributors.submittedBody',
    'Gracias por tu interes en sumarte. Vamos a estar contactandote pronto al email y telefono que dejaste.',
  )
  const backCta = t('distributors.back', 'Volver al inicio')

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
  }

  const inputClass =
    'w-full rounded-[10px] border border-[#2a2a2a] bg-[#0f0f10] px-4 py-3 text-[0.95rem] text-[#f2f2f2] placeholder:text-[#7a7e87] outline-none transition focus:border-primary'
  const labelClass = 'mb-1.5 block text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-[#cfd4dc]'

  return (
    <section className="flex min-h-screen flex-col bg-[#050505] px-6 py-[clamp(56px,8vw,96px)] lg:px-40">
      <Seo
        title="Distribuidores y partners · Kolortec"
        description="Sumate a la red de partners de Kolortec: fabricante de línea propia con respaldo, márgenes y soporte local para tu negocio."
        path="/distribuidores"
      />
      <div className="mb-8 grid max-w-[760px] gap-3">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
          <span className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-primary">{eyebrow}</span>
        </div>
        <h1 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02]">
          {title}
          <span className="text-primary">.</span>
        </h1>
        <p className="m-0 max-w-[68ch] text-[#b7bbc4] leading-[1.55]">{subtitle}</p>
      </div>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,760px)_minmax(360px,1fr)] lg:gap-14">
      {submitted ? (
        <article className="max-w-[640px] rounded-[12px] border border-[rgba(244,223,51,0.4)] bg-[#0f0f10] p-8">
          <div className="mb-4 flex items-center gap-3">
            <span aria-hidden="true" className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-black">
              <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.6]">
                <path d="M5 12.5l4 4 10-10" />
              </svg>
            </span>
            <h2 className="title-font m-0 text-[1.55rem] leading-[1.05]">{submittedTitle}</h2>
          </div>
          <p className="m-0 mb-5 text-[#b7bbc4]">{submittedBody}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-[8px] border-2 border-white/30 bg-transparent px-5 py-3 text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-white transition hover:border-white hover:bg-white hover:text-[#090909]"
          >
            {backCta}
          </Link>
        </article>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="grid gap-5 rounded-[12px] border border-[#2a2a2a] bg-[#0a0a0a] p-6 md:p-8"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="distrib-nombre" className={labelClass}>{labels.nombre}</label>
              <input
                id="distrib-nombre"
                type="text"
                required
                value={form.nombre}
                onChange={handleChange('nombre')}
                className={inputClass}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label htmlFor="distrib-apellido" className={labelClass}>{labels.apellido}</label>
              <input
                id="distrib-apellido"
                type="text"
                required
                value={form.apellido}
                onChange={handleChange('apellido')}
                className={inputClass}
                autoComplete="family-name"
              />
            </div>
            <div>
              <label htmlFor="distrib-telefono" className={labelClass}>{labels.telefono}</label>
              <input
                id="distrib-telefono"
                type="tel"
                required
                value={form.telefono}
                onChange={handleChange('telefono')}
                className={inputClass}
                autoComplete="tel"
              />
            </div>
            <div>
              <label htmlFor="distrib-email" className={labelClass}>{labels.email}</label>
              <input
                id="distrib-email"
                type="email"
                required
                value={form.email}
                onChange={handleChange('email')}
                className={inputClass}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="distrib-mensaje" className={labelClass}>{labels.mensaje}</label>
            <textarea
              id="distrib-mensaje"
              rows={5}
              value={form.mensaje}
              onChange={handleChange('mensaje')}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-primary px-7 py-3.5 text-sm font-extrabold uppercase tracking-[0.12em] text-[#090909] transition hover:-translate-y-0.5"
            >
              <span>{submitCta}</span>
              <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4]">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </form>
      )}

        <aside className="hidden lg:block lg:sticky lg:top-24">
          <div
            className="rounded-[6px] border border-white/15 bg-[#0a0a0a] p-6"
            onMouseEnter={() => setPartnerPaused(true)}
            onMouseLeave={() => setPartnerPaused(false)}
          >
            <h3 className="title-font mb-6 m-0 text-[0.78rem] font-black uppercase tracking-[0.18em] text-white/70">
              {networkTitle}
            </h3>

            {(() => {
              const total = PARTNERS.length
              const prevIdx = (partnerIndex - 1 + total) % total
              const nextIdx = (partnerIndex + 1) % total
              const activeP = PARTNERS[partnerIndex]
              const prevP = PARTNERS[prevIdx]
              const nextP = PARTNERS[nextIdx]

              const renderSibling = (p, targetIdx) => (
                <button
                  type="button"
                  onClick={() => setPartnerIndex(targetIdx)}
                  aria-label={`${visitSiteLabel}: ${p.name}`}
                  className="group flex min-w-0 flex-col items-center px-2 text-center text-white/35 transition-colors hover:text-white/75"
                >
                  <span
                    aria-hidden="true"
                    className="mb-3 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/[0.03] transition-transform group-hover:scale-[1.05]"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5">
                      {p.mark}
                    </svg>
                  </span>
                  <span className="title-font text-[0.7rem] font-black uppercase leading-[1.1] tracking-[0.14em] break-words">
                    {p.name}
                  </span>
                  <span className="mt-1.5 max-w-full truncate font-mono text-[0.55rem] uppercase tracking-[0.16em] text-[#5e636c] group-hover:text-[#828893] transition-colors">
                    {p.domain}
                  </span>
                </button>
              )

              return (
                <div className="grid grid-cols-[1fr_auto_1.25fr_auto_1fr] items-start gap-1">
                  {renderSibling(prevP, prevIdx)}

                  <span aria-hidden="true" className="self-stretch w-px bg-white/10" />

                  <a
                    key={`partner-slide-${partnerIndex}`}
                    href={activeP.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${visitSiteLabel}: ${activeP.name} (${activeP.region})`}
                    className="kt-partner-slide group flex min-w-0 flex-col items-center px-2 text-center"
                  >
                    <span
                      aria-hidden="true"
                      className="mb-3 grid h-14 w-14 place-items-center rounded-full border transition-transform group-hover:scale-[1.06]"
                      style={{
                        color: activeP.accent,
                        borderColor: `${activeP.accent}66`,
                        backgroundColor: `${activeP.accent}14`,
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="h-7 w-7">
                        {activeP.mark}
                      </svg>
                    </span>
                    <span className="title-font text-[0.92rem] font-black uppercase leading-[1.05] tracking-[0.16em] text-white break-words">
                      {activeP.name}
                    </span>
                    <span
                      className="mt-1.5 max-w-full truncate font-mono text-[0.62rem] uppercase tracking-[0.16em]"
                      style={{ color: activeP.accent }}
                    >
                      {activeP.domain}
                    </span>
                  </a>

                  <span aria-hidden="true" className="self-stretch w-px bg-white/10" />

                  {renderSibling(nextP, nextIdx)}
                </div>
              )
            })()}

            <div className="mt-5 flex items-center justify-center gap-2 pt-2">
              {PARTNERS.map((p, i) => (
                <button
                  key={`partner-dot-${p.name}`}
                  type="button"
                  aria-label={`${visitSiteLabel}: ${p.name}`}
                  aria-current={i === partnerIndex || undefined}
                  onClick={() => setPartnerIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === partnerIndex ? 'w-6 bg-primary' : 'w-1.5 bg-white/20 hover:bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="mt-auto -mx-6 pt-16 lg:hidden">
        <div
          className="kt-marquee border-y border-[rgba(244,223,51,0.18)] bg-[#070707]"
          style={{ '--kt-marquee-duration': '50s' }}
        >
          <div className="kt-marquee-track" style={{ gap: 0 }}>
            {[...PARTNERS, ...PARTNERS].map((p, i) => {
              const isClone = i >= PARTNERS.length
              return (
                <a
                  key={`${p.name}-${i}`}
                  href={p.url}
                  target={isClone ? undefined : '_blank'}
                  rel={isClone ? undefined : 'noreferrer'}
                  aria-label={isClone ? undefined : `${visitSiteLabel}: ${p.name} (${p.region})`}
                  aria-hidden={isClone || undefined}
                  tabIndex={isClone ? -1 : 0}
                  className="kt-marquee-item group inline-flex h-[88px] shrink-0 items-center gap-4 whitespace-nowrap border-l border-[rgba(244,223,51,0.18)] px-6 transition first:border-l-0 hover:bg-[#0d0d0d] sm:gap-5 sm:px-8"
                >
                  <span
                    aria-hidden="true"
                    className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] border transition group-hover:scale-[1.06]"
                    style={{
                      color: p.accent,
                      borderColor: `${p.accent}55`,
                      backgroundColor: `${p.accent}14`,
                    }}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7">
                      {p.mark}
                    </svg>
                  </span>
                  <span className="flex flex-col items-start gap-1">
                    <span className="title-font text-[1.05rem] uppercase leading-[1] tracking-[0.08em] text-white">
                      {p.name}
                    </span>
                    <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[#7a818c]">
                      {p.domain}
                    </span>
                  </span>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

export default DistributorsPage
