export function Background({ bg }) {
  const base = { position: 'absolute', inset: 0 }
  if (!bg || bg.type === 'none') return null
  if (bg.type === 'color') return <div style={{ ...base, backgroundColor: bg.value }} />
  if (bg.type === 'gradient') return <div style={{ ...base, backgroundImage: `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})` }} />
  if (bg.type === 'image')
    return <div style={{ ...base, backgroundImage: `url(${bg.url})`, backgroundSize: bg.fit, backgroundPosition: `${bg.focalX}% ${bg.focalY}%`, backgroundRepeat: 'no-repeat' }} />
  if (bg.type === 'frames') {
    const src = bg.poster || bg.urls[0] || ''
    return src ? <div style={{ ...base, backgroundImage: `url(${src})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }} /> : null
  }
  return (
    <video style={{ ...base, width: '100%', height: '100%', objectFit: 'cover' }} src={bg.url} poster={bg.poster} autoPlay loop muted playsInline />
  )
}
