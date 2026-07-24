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

function inner(el, bp, reveal) {
  const p = effectiveProps(el, bp)
  switch (el.type) {
    case 'text': return <TextView p={p} />
    case 'button': return <ButtonView p={p} />
    case 'media': return <MediaView p={p} />
    case 'badge': return <BadgeView p={p} />
    case 'countdown': return <CountdownView p={p} />
    case 'quicklinks': return <QuickLinksView p={p} />
    case 'message': return <MessageView p={p} />
    case 'stats': return <StatsView p={p} reveal={reveal} />
    case 'shape': return <ShapeView p={p} />
    case 'icon': return <IconView p={p} />
    case 'rating': return <RatingView p={p} />
    case 'logo': return <LogoView p={p} />
    default: return null
  }
}

export function ElementView({ el, bp, reveal }) {
  if (el.hidden?.[bp]) return null
  const parts = []
  let opacity = el.opacity
  let anim
  let filter

  if (reveal === undefined) {
    anim = el.animation.type !== 'none' ? `hc-${el.animation.type} ${el.animation.durationMs}ms ease ${el.animation.delayMs}ms both` : undefined
  } else {
    const r = Math.max(0, Math.min(1, reveal))
    const eo = 1 - Math.pow(1 - r, 3)
    const off = (1 - eo)
    const fadeIn = Math.min(1, r * 1.6)
    switch (el.animation.type) {
      case 'fade': opacity *= r; break
      case 'slide-up': opacity *= fadeIn; parts.push(`translateY(${off * 45}%)`); break
      case 'slide-down': opacity *= fadeIn; parts.push(`translateY(${-off * 45}%)`); break
      case 'zoom': opacity *= fadeIn; parts.push(`scale(${0.7 + 0.3 * eo})`); break
      case 'bounce': opacity *= fadeIn; parts.push(`translateY(${off * 45}%) scale(${0.92 + 0.08 * eo})`); break
      case 'focus': opacity *= eo; parts.push(`translateY(${off * 16}px)`); if (eo < 1) filter = `blur(${off * 5}px)`; break
    }
  }

  const s = el.scale ?? 1
  if (s !== 1) parts.push(`scale(${s})`)
  if (el.rotation) parts.push(`rotate(${el.rotation}deg)`)
  const tf = parts.join(' ') || undefined

  return (
    <div style={{ width: '100%', height: '100%', opacity, transform: tf, transformOrigin: 'top left', animation: anim, filter }}>
      {inner(el, bp, reveal)}
    </div>
  )
}
