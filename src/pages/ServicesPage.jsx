import { Link } from 'react-router-dom'
import { defaultLandingContent } from '../data/landingData'

function ServicesPage() {
  return (
    <main className="kt-page-alt">
      <div className="kt-container alt-header">
        <h1>Servicios</h1>
        <p>Preparado para consumir `/landing/services` desde API.</p>
        <Link to="/">Volver al landing</Link>
      </div>
      <div className="kt-container kt-cards-3">
        {defaultLandingContent.services.items.map((item) => (
          <article key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </main>
  )
}

export default ServicesPage

