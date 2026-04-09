function FeaturedSection({ products }) {
  return (
    <section className="kt-section kt-container" id="products">
      <div className="kt-featured-head">
        <h2>{products.title}</h2>
        <a href="#shop">{products.cta}</a>
      </div>
      <div className="kt-featured-grid">
        {products.items.map((item) => (
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
    </section>
  )
}

export default FeaturedSection
