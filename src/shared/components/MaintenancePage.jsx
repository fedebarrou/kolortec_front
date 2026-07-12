/**
 * MaintenancePage — página "en construcción" que se muestra cuando la cuenta despublicó su web
 * desde tiendita (web-config.published === false). Reemplaza el shell completo (sin header/nav).
 * Autocontenida y branded (fondo negro + logo de header), equivalente a la que servía Caddy, pero
 * ahora gobernada desde el admin de tiendita en vez de editar el edge a mano.
 */
function MaintenancePage() {
  return (
    <main
      style={{
        margin: 0,
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#050505',
        color: '#f5f5f5',
        fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif',
        textAlign: 'center',
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 520 }}>
        <img
          alt="Kolortec"
          src="/assets/Grupo-Kolortec-1024x150.jpeg"
          style={{ height: 40, width: 'auto', objectFit: 'contain', margin: '0 auto 22px' }}
        />
        <h1 style={{ fontSize: 26, margin: '14px 0 10px', fontWeight: 800 }}>Sitio en construcción</h1>
        <p style={{ color: '#b9b9b9', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
          Estamos preparando algo grande. Volvé muy pronto.
        </p>
      </div>
    </main>
  )
}

export default MaintenancePage
