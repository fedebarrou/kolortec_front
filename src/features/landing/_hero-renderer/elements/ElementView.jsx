import { TextView } from './TextView'
import { ButtonView } from './ButtonView'
import { MediaView } from './MediaView'
import { BadgeView } from './BadgeView'
import { CountdownView } from './CountdownView'
import { QuickLinksView } from './QuickLinksView'
import { MessageView } from './MessageView'
import { StatsView } from './StatsView'
import { ShapeView } from './ShapeView'
import { IconView } from './IconView'
import { RatingView } from './RatingView'
import { LogoView } from './LogoView'

export function effectiveProps(el, bp) {
  if (bp === 'mobile' && el.propsMobile) return { ...el.props, ...el.propsMobile }
  if (bp === 'tablet' && el.propsTablet) return { ...el.props, ...el.propsTablet }
  return el.props
}

export function boxAt(el, bp) {
  return bp === 'tablet' ? (el.pos.tablet ?? el.pos.desktop) : el.pos[bp]
}

function inner(el, bp, reveal, accentColor, themePreset) {
  const p = effectiveProps(el, bp)
  switch (el.type) {
    case 'text': return <TextView p={p} accentColor={accentColor} themePreset={themePreset} />
    case 'button': return <ButtonView p={p} />
    case 'media': return <MediaView p={p} />
    case 'badge': return <BadgeView p={p} />
    case 'countdown': return <CountdownView p={p} />
    case 'quicklinks': return <QuickLinksView p={p} />
    case 'message': return <MessageView p={p} accentColor={accentColor} />
    case 'stats': return <StatsView p={p} reveal={reveal} />
    case 'shape': return <ShapeView p={p} />
    case 'icon': return <IconView p={p} />
    case 'rating': return <RatingView p={p} />
    case 'logo': return <LogoView p={p} />
    default: return null
  }
}

// Tipos de animación soportados; un tipo desconocido cae a 'fade' (nunca falla
// silencioso dejando el elemento sin entrada). 'kolortec' = variante literal de
// kolortec (34px + scale .96, ScrollytellingSection.jsx TextBlock) — separada de
// 'slide-up' (45% sin scale) para no alterar diseños existentes que ya la usan.
const ANIM_TYPES = ['none', 'fade', 'slide-up', 'slide-down', 'zoom', 'bounce', 'focus', 'kolortec']

// snapState (modo snap, Fase 1c): transición CSS opacity/transform — reemplaza
// la animation por keyframe cuando el host (SnapStage/ScrollStage) mantiene
// montado el paso saliente ('leaving') y anima el entrante ('pending' → 'in')
// en vez de desmontar/remontar por nonce. Target 'oculto' idéntico para
// pending/leaving (kolortec: setActiveStep(-1) aplica el mismo estilo a
// cualquier bloque no-activo, sin importar si entra o sale).
const SNAP_HIDDEN_TRANSFORM = 'translateY(34px) scale(0.96)'
const SNAP_TRANSITION = 'opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1)'

export function ElementView({ el, bp, reveal, accentColor, themePreset, snapState }) {
  if (el.hidden?.[bp]) return null
  const animType = ANIM_TYPES.includes(el.animation?.type) ? el.animation.type : 'fade'
  const parts = []
  let opacity = el.opacity
  let anim
  let filter
  let transition

  if (snapState !== undefined) {
    transition = SNAP_TRANSITION
    if (snapState !== 'in') {
      opacity = 0
      parts.push(SNAP_HIDDEN_TRANSFORM)
    }
  } else if (reveal === undefined) {
    // Optional chaining: elementos legacy pueden venir sin objeto animation.
    anim = animType !== 'none' ? `hc-${animType} ${el.animation?.durationMs ?? 500}ms ease ${el.animation?.delayMs ?? 0}ms both` : undefined
  } else {
    const r = Math.max(0, Math.min(1, reveal))
    const eo = 1 - Math.pow(1 - r, 3)
    const off = (1 - eo)
    const fadeIn = Math.min(1, r * 1.6)
    switch (animType) {
      case 'fade': opacity *= r; break
      case 'slide-up': opacity *= fadeIn; parts.push(`translateY(${off * 45}%)`); break
      case 'slide-down': opacity *= fadeIn; parts.push(`translateY(${-off * 45}%)`); break
      case 'zoom': opacity *= fadeIn; parts.push(`scale(${0.7 + 0.3 * eo})`); break
      case 'bounce': opacity *= fadeIn; parts.push(`translateY(${off * 45}%) scale(${0.92 + 0.08 * eo})`); break
      case 'kolortec': opacity *= fadeIn; parts.push(`translateY(${off * 34}px) scale(${0.96 + 0.04 * eo})`); break
      case 'focus': opacity *= eo; parts.push(`translateY(${off * 16}px)`); if (eo < 1) filter = `blur(${off * 5}px)`; break
    }
  }

  const tf = parts.join(' ') || undefined
  const persistent = []
  const s = el.scale ?? 1
  if (s !== 1) persistent.push(`scale(${s})`)
  if (el.rotation) persistent.push(`rotate(${el.rotation}deg)`)

  return (
    <div style={{ width: '100%', height: '100%', transform: persistent.join(' ') || undefined, transformOrigin: 'top left' }}>
      {/* data-hero-anim: hook de CSS para neutralizar la animación con prefers-reduced-motion */}
      <div data-hero-anim style={{ width: '100%', height: '100%', opacity, transform: tf, transformOrigin: 'top left', animation: anim, filter, transition }}>
        {inner(el, bp, reveal, accentColor, themePreset)}
      </div>
    </div>
  )
}
