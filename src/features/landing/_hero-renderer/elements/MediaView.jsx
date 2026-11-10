import { useRef } from 'react'
import { cssLength, cssObjectFit, safeSrc } from '../cssSafe'
import { useCercaDeVerse } from '../Background'
export function MediaView({ p }) {
  // X (pilares 04-dic): las escenas de video debajo de la primera pantalla no llevan fuente (ni bajan nada) hasta estar a una pantalla.
  const ref = useRef(null)
  const cerca = useCercaDeVerse(ref, p.kind === 'video' && Boolean(p.url))
  const common = { width: '100%', height: '100%', objectFit: cssObjectFit(p.fit), borderRadius: cssLength(p.radius) }
  if (!p.url) {
    // Sin foto no se dibuja nada: en la web no puede aparecer un cartel «imagen». El lienzo del editor le pone el suyo por CSS (hero-lab.css).
    return <div data-fit data-hero-media-vacia={p.kind === 'video' ? 'video' : 'imagen'} aria-hidden="true" style={{ width: '100%', height: '100%', borderRadius: cssLength(p.radius), background: 'transparent' }} />
  }
  if (p.kind === 'video') {
    return <video ref={ref} data-fit src={safeSrc(cerca ? p.url : undefined)} preload={cerca ? 'metadata' : 'none'} poster={safeSrc(p.poster)} style={common} autoPlay={p.autoplay} loop={p.loop} muted={p.muted} playsInline />
  }
  return <img data-fit src={safeSrc(p.url)} alt={p.alt} style={common} />
}
