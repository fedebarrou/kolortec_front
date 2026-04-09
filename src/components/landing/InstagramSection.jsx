function InstagramSection({ gallery }) {
  return (
    <section className="kt-section kt-instagram">
      <div className="kt-container">
        <div className="kt-section-head">
          <div>
            <h2>{gallery.title}</h2>
            <p>{gallery.subtitle}</p>
          </div>
          <button className="kt-btn-primary" type="button">
            {gallery.cta}
          </button>
        </div>
        <div className="kt-grid-six">
          {gallery.images.map((src) => (
            <article key={src} className="kt-shot">
              <img src={src} alt="" />
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default InstagramSection
