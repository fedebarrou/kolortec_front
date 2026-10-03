export function LogoView({ p }) {
  if (!p.url) {
    return (
      <div data-fit style={{ width: '100%', height: '100%', minWidth: 60, minHeight: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: '1px dashed rgba(255,255,255,.5)', color: 'rgba(255,255,255,.8)', fontSize: 11, fontWeight: 600, padding: '0 8px' }}>
        Logo
      </div>
    )
  }
  return <img data-fit src={p.url} alt={p.alt} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
}
