function ActionSection({ action }) {
  return (
    <section className="kt-section">
      <div className="kt-container">
        <div className="kt-inline-head">
          <h2>{action.title}</h2>
          <span>{action.tag}</span>
        </div>
        <div className="kt-grid-six kt-small-gap">
          {action.images.map((src) => (
            <img key={src + '-action'} src={src} alt="" className="kt-mono" />
          ))}
        </div>
      </div>
    </section>
  )
}

export default ActionSection
