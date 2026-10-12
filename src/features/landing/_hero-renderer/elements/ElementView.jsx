import { cssAngle, cssNumber } from '../cssSafe'
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

// eslint-disable-next-line react-refresh/only-export-components -- helper puro que usa el renderer; el archivo se copia byte-idéntico a la store, no se parte. Sólo afecta al Fast Refresh en dev.
export function effectiveProps(el, bp) {
  if (bp === 'mobile' && el.propsMobile) return { ...el.props, ...el.propsMobile }
  if (bp === 'tablet' && el.propsTablet) return { ...el.props, ...el.propsTablet }
  return el.props
}

// x/y/w/h salen de datos guardados y se interpolan en left/top/width/height: se fuerzan a
// número finito acá, en el único lugar por donde pasan todas las cajas (si falta, NaN: igual que
// el "undefined%" de antes, inválido y descartado por el navegador).
function cleanBox(b) {
  return b && { ...b, x: cssNumber(b.x, NaN), y: cssNumber(b.y, NaN), w: cssNumber(b.w, NaN), h: cssNumber(b.h, NaN) }
}

// eslint-disable-next-line react-refresh/only-export-components -- idem effectiveProps: helper puro de geometría usado por CarouselRenderer/ScrollRenderer.
export function boxAt(el, bp) {
  return cleanBox(bp === 'tablet' ? (el.pos.tablet ?? el.pos.desktop) : el.pos[bp])
}

function inner(el, bp, reveal, accentColor, themePreset, escalonado) {
  const p = effectiveProps(el, bp)
  switch (el.type) {
    case 'text': return <TextView p={p} accentColor={accentColor} themePreset={themePreset} />
    case 'button': return <ButtonView p={p} />
    case 'media': return <MediaView p={p} />
    case 'badge': return <BadgeView p={p} />
    case 'countdown': return <CountdownView p={p} />
    case 'quicklinks': return <QuickLinksView p={p} escalonado={escalonado} />
    case 'message': return <MessageView p={p} accentColor={accentColor} />
    case 'stats': return <StatsView p={p} reveal={reveal} escalonado={escalonado} />
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
// Cada uno (menos 'none') tiene su `@keyframes hc-{tipo}`; la lista es la del catálogo del back
// (tiendita-back/resources/hero/catalogo.json) y ParidadDeDisenoTest falla si divergen.
const ANIM_TYPES = ['none', 'fade', 'slide-up', 'slide-down', 'zoom', 'bounce', 'focus', 'kolortec', 'blur-in', 'slide-left', 'slide-right', 'rotate-in', 'mask-reveal']

// Salidas (corren cuando el carrusel cambia de escena) y curvas. El valor que llega al CSS sale de estas
// tablas, NUNCA del dato guardado: un nombre que no está acá cae al default. Cada curva es una variable de
// hero-anim.css / hero-lab.css / globals.css del store (`--hc-ease-*`), con el valor real de respaldo.
const EXIT_TYPES = ['none', 'fade', 'slide-up', 'slide-down', 'zoom-out']
const EASING_CSS = {
  ease: 'var(--hc-ease-ease, ease)',
  'ease-out': 'var(--hc-ease-ease-out, ease-out)',
  'ease-in-out': 'var(--hc-ease-ease-in-out, ease-in-out)',
  spring: 'var(--hc-ease-spring, cubic-bezier(.34,1.56,.64,1))',
  linear: 'var(--hc-ease-linear, linear)',
}
// La salida dura lo que el cruce entre escenas del carrusel (.4s): más larga se cortaría con el desvanecido de la escena.
const EXIT_MAX_MS = 400
// Stagger: el retardo entre hijos sólo existe en estos dos tipos.
const STAGGER_TYPES = ['stats', 'quicklinks']
const STAGGER_MAX_MS = 600

// snapState (modo snap, Fase 1c): transición CSS opacity/transform — reemplaza
// la animation por keyframe cuando el host (SnapStage/ScrollStage) mantiene
// montado el paso saliente ('leaving') y anima el entrante ('pending' → 'in')
// en vez de desmontar/remontar por nonce. Target 'oculto' idéntico para
// pending/leaving (kolortec: setActiveStep(-1) aplica el mismo estilo a
// cualquier bloque no-activo, sin importar si entra o sale).
const SNAP_HIDDEN_TRANSFORM = 'translateY(34px) scale(0.96)'
const SNAP_TRANSITION = 'opacity .7s cubic-bezier(.22,.61,.36,1), transform .7s cubic-bezier(.22,.61,.36,1)'

// `active` (opcional): sólo lo pasa el carrusel. `false` = esta escena NO es la visible (está saliendo o esperando);
// ahí corre la salida del elemento, si tiene. Sin `active` (scroll, snap, preview) no hay momento de salida: se ignora `exit`.
export function ElementView({ el, bp, reveal, accentColor, themePreset, snapState, active }) {
  if (el.hidden?.[bp]) return null
  const animType = ANIM_TYPES.includes(el.animation?.type) ? el.animation.type : 'fade'
  const easing = EASING_CSS[el.animation?.easing] ?? EASING_CSS.ease
  const exitType = EXIT_TYPES.includes(el.animation?.exit) ? el.animation.exit : 'none'
  const saliendo = active === false && exitType !== 'none'
  const staggerMs = STAGGER_TYPES.includes(el.type) ? Math.min(STAGGER_MAX_MS, Math.max(0, cssNumber(el.animation?.stagger ?? 0, 0))) : 0
  const parts = []
  let opacity = el.opacity === undefined ? undefined : cssNumber(el.opacity, 1)
  let anim
  let filter
  let clip
  let transition
  let escalonado

  if (snapState !== undefined) {
    transition = SNAP_TRANSITION
    if (snapState !== 'in') {
      opacity = 0
      parts.push(SNAP_HIDDEN_TRANSFORM)
    }
  } else if (reveal === undefined) {
    // Optional chaining: elementos legacy pueden venir sin objeto animation.
    const durMs = cssNumber(el.animation?.durationMs ?? 500, 500)
    const delayMs = cssNumber(el.animation?.delayMs ?? 0, 0)
    if (saliendo) {
      anim = `hc-out-${exitType} ${Math.min(durMs, EXIT_MAX_MS)}ms ${easing} 0ms both`
    } else if (animType !== 'none' && staggerMs > 0) {
      // Con stagger, la entrada la hace cada hijo (con su retardo escalonado); el contenedor no se anima.
      escalonado = { nombre: `hc-${animType}`, ms: durMs, curva: easing, retardo: delayMs, paso: staggerMs }
    } else if (animType !== 'none') {
      anim = `hc-${animType} ${durMs}ms ${easing} ${delayMs}ms both`
    }
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
      case 'blur-in': opacity *= eo; if (eo < 1) filter = `blur(${off * 14}px)`; break
      case 'slide-left': opacity *= fadeIn; parts.push(`translateX(${off * 45}%)`); break
      case 'slide-right': opacity *= fadeIn; parts.push(`translateX(${-off * 45}%)`); break
      case 'rotate-in': opacity *= fadeIn; parts.push(`rotate(${-8 * off}deg) scale(${0.92 + 0.08 * eo})`); break
      case 'mask-reveal': if (eo < 1) clip = `inset(0 ${off * 100}% 0 0)`; break
    }
  }

  const tf = parts.join(' ') || undefined
  // rotate-in y zoom-out giran/escalan desde el centro; el resto, desde la esquina (como siempre).
  const origen = (saliendo ? exitType === 'zoom-out' : animType === 'rotate-in') ? 'center' : 'top left'
  const persistent = []
  const s = cssNumber(el.scale ?? 1, 1)
  if (s !== 1) persistent.push(`scale(${s})`)
  if (el.rotation) persistent.push(`rotate(${cssAngle(el.rotation)}deg)`)

  return (
    <div style={{ width: '100%', height: '100%', transform: persistent.join(' ') || undefined, transformOrigin: 'top left' }}>
      {/* data-hero-anim: hook de CSS para neutralizar la animación con prefers-reduced-motion */}
      <div data-hero-anim style={{ width: '100%', height: '100%', opacity, transform: tf, transformOrigin: origen, animation: anim, filter, clipPath: clip, transition }}>
        {inner(el, bp, reveal, accentColor, themePreset, escalonado)}
      </div>
    </div>
  )
}
