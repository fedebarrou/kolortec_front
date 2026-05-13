import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import usePageTitle from '../../../shared/hooks/usePageTitle'

const PARTNERS = [
  {
    name: 'Vortex Productions',
    domain: 'vortexpro.com.ar',
    region: 'Argentina',
    accent: '#f4df33',
    url: 'https://example.com/vortex',
    mark: (
      <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3a9 9 0 0 1 9 9 6 6 0 0 1-6 6 4 4 0 0 1-4-4 2.5 2.5 0 0 1 2.5-2.5" />
        <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      </g>
    ),
  },
  {
    name: 'Stage Republic',
    domain: 'stagerepublic.com.br',
    region: 'Brasil',
    accent: '#9efad4',
    url: 'https://example.com/stagerepublic',
    mark: (
      <g stroke="currentColor" strokeWidth="1.7" fill="none" strokeLinejoin="round">
        <path d="M4 21V5l8-2 8 2v16" />
        <path d="M4 9h16M4 14h16" />
      </g>
    ),
  },
  {
    name: 'Lumin Live',
    domain: 'luminlive.mx',
    region: 'Mexico',
    accent: '#a9c4ff',
    url: 'https://example.com/luminlive',
    mark: (
      <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M12 2v6" />
        <path d="M5 8l3 4M19 8l-3 4M2.5 14l4.5-1M21.5 14l-4.5-1" />
        <path d="M7 20h10l-1.5-7h-7z" strokeLinejoin="round" />
      </g>
    ),
  },
  {
    name: 'Pulse Events',
    domain: 'pulseevents.cl',
    region: 'Chile',
    accent: '#ffb37a',
    url: 'https://example.com/pulse',
    mark: (
      <path
        d="M2 12h3l2-6 3 12 3-9 2 6 2-3h5"
        stroke="currentColor"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
]

function RentalsPage() {
  const { t } = useLanguage()
  usePageTitle(t('pageTitle.rentals', 'Rentals'))
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

  const eyebrow = t('rentals.eyebrow', 'Programa de rental')
  const title = t('rentals.title', 'Presenta tu proyecto')
  const subtitle = t(
    'rentals.subtitle',
    'Contanos sobre tu evento o produccion y nuestro equipo de rental se va a poner en contacto en las proximas 48 horas habiles.',
  )
  const visitSiteLabel = t('rentals.visitSite', 'Visitar sitio')
  const networkTitle = t('rentals.networkTitle', 'Partners de rental activos')

  const labels = {
    nombre: t('rentals.fields.nombre', 'Nombre'),
    apellido: t('rentals.fields.apellido', 'Apellido'),
    telefono: t('rentals.fields.telefono', 'Telefono'),
    email: t('rentals.fields.email', 'Email'),
    mensaje: t('rentals.fields.mensaje', 'Contanos sobre tu proyecto'),
  }
  const submitCta = t('rentals.submit', 'Enviar propuesta')
  const submittedTitle = t('rentals.submittedTitle', 'Recibimos tu propuesta')
  const submittedBody = t(
    'rentals.submittedBody',
    'Gracias por sumarte. Nuestro equipo de rental se va a poner en contacto pronto al email y telefono que dejaste.',
  )
  const backCta = t('rentals.back', 'Volver al inicio')

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
      <div className="mb-8 grid max-w-[760px] gap-3 lg:ml-auto lg:text-right">
        <div className="flex items-center gap-2 lg:flex-row-reverse">
          <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
          <span className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-primary">{eyebrow}</span>
        </div>
        <h1 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(2.4rem,6vw,4.6rem)] leading-[1.02] lg:self-end">
          {title}
          <span className="text-primary">.</span>
        </h1>
        <p className="m-0 max-w-[68ch] text-[#b7bbc4] leading-[1.55] lg:self-end">{subtitle}</p>
      </div>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(360px,1fr)_minmax(0,760px)] lg:gap-14">
        <aside className="hidden lg:block lg:sticky lg:top-24 lg:order-1 lg:col-start-1 lg:row-start-1">
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

        <div className="lg:order-2 lg:col-start-2 lg:row-start-1">
          {submitted ? (
            <article className="max-w-[640px] rounded-[12px] border border-[rgba(244,223,51,0.4)] bg-[#0f0f10] p-8 lg:ml-auto">
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
                  <label htmlFor="rental-nombre" className={labelClass}>{labels.nombre}</label>
                  <input
                    id="rental-nombre"
                    type="text"
                    required
                    value={form.nombre}
                    onChange={handleChange('nombre')}
                    className={inputClass}
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label htmlFor="rental-apellido" className={labelClass}>{labels.apellido}</label>
                  <input
                    id="rental-apellido"
                    type="text"
                    required
                    value={form.apellido}
                    onChange={handleChange('apellido')}
                    className={inputClass}
                    autoComplete="family-name"
                  />
                </div>
                <div>
                  <label htmlFor="rental-telefono" className={labelClass}>{labels.telefono}</label>
                  <input
                    id="rental-telefono"
                    type="tel"
                    required
                    value={form.telefono}
                    onChange={handleChange('telefono')}
                    className={inputClass}
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label htmlFor="rental-email" className={labelClass}>{labels.email}</label>
                  <input
                    id="rental-email"
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
                <label htmlFor="rental-mensaje" className={labelClass}>{labels.mensaje}</label>
                <textarea
                  id="rental-mensaje"
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
        </div>
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

export default RentalsPage
