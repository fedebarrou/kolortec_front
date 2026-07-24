export function MediaView({ p }) {
  const common = { width: '100%', height: '100%', objectFit: p.fit, borderRadius: p.radius }
  if (!p.url) {
    return (
      <div data-fit aria-label="media" style={{ width: '100%', height: '100%', borderRadius: p.radius, background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.75)', fontSize: 12 }}>
        {p.kind === 'video' ? 'video' : 'imagen'}
      </div>
    )
  }
  if (p.kind === 'video') {
    return <video data-fit src={p.url} poster={p.poster} style={common} autoPlay={p.autoplay} loop={p.loop} muted={p.muted} playsInline />
  }
  return <img data-fit src={p.url} alt={p.alt} style={common} />
}
