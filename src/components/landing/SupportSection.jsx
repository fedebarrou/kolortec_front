function SupportSection({ support }) {
  return (
    <section className="kt-section kt-container" id="support">
      <div className="kt-support-grid">
        <div>
          <h2>{support.title}</h2>
          <p>{support.subtitle}</p>
          <ul className="kt-support-list">
            {support.docs.map((doc) => (
              <li key={doc}>{doc}</li>
            ))}
          </ul>
        </div>
        <aside>
          <h3>{support.urgent.title}</h3>
          <p>{support.urgent.description}</p>
          <p>{support.urgent.phone}</p>
          <p>{support.urgent.email}</p>
        </aside>
      </div>
    </section>
  )
}

export default SupportSection
