import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function DistributorsPage() {
  const { t } = useLanguage()
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', email: '', mensaje: '' })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  const eyebrow = t('distributors.eyebrow', 'Programa de distribuidores')
  const title = t('distributors.title', 'Sumate al equipo')
  const subtitle = t(
    'distributors.subtitle',
    'Completá el formulario y nuestro equipo comercial se va a poner en contacto en las proximas 48 horas habiles.',
  )

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
    <section className="min-h-screen bg-[#050505] px-6 py-[clamp(56px,8vw,96px)] lg:px-40">
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
          className="grid max-w-[760px] gap-5 rounded-[12px] border border-[#2a2a2a] bg-[#0a0a0a] p-6 md:p-8"
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
    </section>
  )
}

export default DistributorsPage
