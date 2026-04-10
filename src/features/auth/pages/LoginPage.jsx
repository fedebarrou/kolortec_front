import { Link } from 'react-router-dom'

function LoginPage() {
  return (
    <section className="min-h-screen bg-[#050505] px-6 py-[42px] lg:px-40">
      <div className="mb-5">
        <h1 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(3.8rem,10vw,7rem)] leading-[1.02] tracking-[0]">
          Iniciar sesión
          <span className="text-primary">.</span>
        </h1>
        <p className="mb-3 text-[#a0a0a0]">Accedé a tu cuenta para gestionar pedidos y cotizaciones.</p>
        <Link to="/" className="font-bold text-primary">Volver al inicio</Link>
      </div>
      <div className="grid max-w-[640px] gap-2">
        <label htmlFor="login-email" className="text-sm text-[#d7dbe2]">Email</label>
        <input id="login-email" type="email" placeholder="tu@email.com" className="rounded-[8px] border border-[#2c2c2c] bg-[#101010] p-3 text-white" />
        <label htmlFor="login-password" className="text-sm text-[#d7dbe2]">Contraseña</label>
        <input id="login-password" type="password" placeholder="********" className="rounded-[8px] border border-[#2c2c2c] bg-[#101010] p-3 text-white" />
        <button type="button" className="mt-2 w-fit rounded-[8px] bg-primary px-6 py-3 text-sm font-extrabold uppercase tracking-[0.12em] text-[#090909]">
          Entrar
        </button>
      </div>
    </section>
  )
}

export default LoginPage
