import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getShopProducts } from '../services/contentService'
import { defaultLandingContent } from '../data/landingData'

function ShopPage() {
  const [products, setProducts] = useState(defaultLandingContent.products.items)

  useEffect(() => {
    let mounted = true
    getShopProducts().then((response) => {
      if (mounted) {
        setProducts(response)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <main className="kt-page-alt">
      <div className="kt-container alt-header">
        <h1>Tienda</h1>
        <p>Productos desde API (fallback automático al clon).</p>
        <Link to="/">Volver al landing</Link>
      </div>
      <div className="kt-container alt-grid">
        {products.map((item) => (
          <article key={item.name} className="kt-product">
            <div className="kt-product-image">
              <img src={item.image} alt={item.name} />
              {item.badge ? <span>{item.badge}</span> : null}
            </div>
            <h3>{item.name}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </main>
  )
}

export default ShopPage

