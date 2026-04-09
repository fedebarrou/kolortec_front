function FooterSection({ brand, footer }) {
  return (
    <footer className="kt-footer">
      <div className="kt-container kt-footer-grid">
        <div>
          <img src={brand.logoUrl} alt={`${brand.name} Logo`} className="kt-logo" />
          <p>{footer.about}</p>
        </div>
        {footer.columns.map((column) => (
          <div key={column.title}>
            <h4>{column.title}</h4>
            {column.links.map((link) => (
              <p key={link}>{link}</p>
            ))}
          </div>
        ))}
        <div>
          <h4>Updates</h4>
          <div className="kt-inline-form">
            <input type="email" placeholder="Email address" />
            <button type="button">Send</button>
          </div>
        </div>
      </div>
      <div className="kt-container kt-copy">
        <p>{footer.copyright}</p>
        <div>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </footer>
  )
}

export default FooterSection
