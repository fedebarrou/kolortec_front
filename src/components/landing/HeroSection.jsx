function HeroSection({ hero }) {
  return (
    <section className="kt-hero">
      <img src={hero.imageUrl} alt="" className="kt-hero-bg" />
      <div className="kt-overlay" />
      <div className="kt-hero-beam" />
      <div className="kt-container kt-hero-content">
        <div className="kt-badge">{hero.badge}</div>
        <h1>{hero.title}</h1>
        <p>{hero.subtitle}</p>
        <div className="kt-actions">
          <button className="kt-btn-primary" type="button">
            {hero.primaryCta}
          </button>
          <button className="kt-btn-outline" type="button">
            {hero.secondaryCta}
          </button>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
