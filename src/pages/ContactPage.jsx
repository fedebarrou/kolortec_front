import { Link } from 'react-router-dom'

function ContactPage() {
  return (
    <main className="kt-page-alt">
      <div className="kt-container alt-header">
        <h1>Contacto</h1>
        <p>Formulario base para conectar luego con endpoint real.</p>
        <Link to="/">Volver al landing</Link>
      </div>
      <div className="kt-container contact-card">
        <label htmlFor="name">Nombre</label>
        <input id="name" placeholder="Tu nombre" />
        <label htmlFor="mail">Email</label>
        <input id="mail" placeholder="hola@dominio.com" />
        <label htmlFor="msg">Mensaje</label>
        <textarea id="msg" rows="5" placeholder="Contanos qué necesitás..." />
        <button type="button" className="kt-btn-primary">
          Enviar
        </button>
      </div>
    </main>
  )
}

export default ContactPage
