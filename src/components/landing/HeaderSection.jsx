import { Link } from 'react-router-dom'

function HeaderSection({ brand, nav }) {
  return (
    <header className="kt-header">
      <div className="kt-container kt-header-inner">
        <div className="kt-left">
          <img src={brand.logoUrl} alt={`${brand.name} Logo`} className="kt-logo" />
          <nav className="kt-nav">
            {nav.map((item) => (
              <a key={item.href} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="kt-right">
          <a href="/tienda">Tienda</a>
          <a href="/servicios">Servicios</a>
          <a href="/contacto">Contacto</a>
          <Link className="kt-btn-primary" to="/login">
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  )
}

export default HeaderSection
