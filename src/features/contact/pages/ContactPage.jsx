import { Link } from 'react-router-dom'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import usePageTitle from '../../../shared/hooks/usePageTitle'

function ContactPage() {
  const { t } = useLanguage()
  usePageTitle(t('pageTitle.contact', 'Contacto'))
  return (
    <section className="min-h-screen bg-[#050505] px-6 py-[42px] lg:px-40">
      <div className="mb-5">
        <h1 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(4.2rem,11.2vw,8.8rem)] leading-[1.02]">
          Contacto
          <span className="text-primary">.</span>
        </h1>
        <p className="mb-3 text-[#a0a0a0]">Formulario base para conectar luego con endpoint real.</p>
        <Link to="/" className="font-bold text-primary">Volver al landing</Link>
      </div>
      <div className="grid max-w-[640px] gap-2">
        <label htmlFor="name" className="text-sm text-[#d7dbe2]">Nombre</label>
        <input id="name" placeholder="Tu nombre" className="rounded-[8px] border border-[#2c2c2c] bg-[#101010] p-3 text-white" />
        <label htmlFor="mail" className="text-sm text-[#d7dbe2]">Email</label>
        <input id="mail" placeholder="hola@dominio.com" className="rounded-[8px] border border-[#2c2c2c] bg-[#101010] p-3 text-white" />
        <label htmlFor="msg" className="text-sm text-[#d7dbe2]">Mensaje</label>
        <textarea id="msg" rows="5" placeholder="Contanos qué necesitás..." className="rounded-[8px] border border-[#2c2c2c] bg-[#101010] p-3 text-white" />
        <button type="button" className="mt-2 w-fit rounded-[8px] bg-primary px-6 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#090909]">
          Enviar
        </button>
      </div>
    </section>
  )
}

export default ContactPage
