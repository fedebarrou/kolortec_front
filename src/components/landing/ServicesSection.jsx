function ServicesSection({ services }) {
  return (
    <section className="kt-section kt-container" id="services">
      <h2 className="kt-center-title">{services.title}</h2>
      <div className="kt-cards-3">
        {services.items.map((item) => (
          <article key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ServicesSection
