import { Link } from 'react-router-dom'

function LoginPage() {
  return (
    <main className="kt-page-alt">
      <div className="kt-container alt-header">
        <h1>Iniciar sesión</h1>
        <p>Accedé a tu cuenta para gestionar pedidos y cotizaciones.</p>
        <Link to="/">Volver al inicio</Link>
      </div>
      <div className="kt-container contact-card">
        <label htmlFor="login-email">Email</label>
        <input id="login-email" type="email" placeholder="tu@email.com" />
        <label htmlFor="login-password">Contraseña</label>
        <input id="login-password" type="password" placeholder="********" />
        <button type="button" className="kt-btn-primary">
          Entrar
        </button>
      </div>
    </main>
  )
}

export default LoginPage
