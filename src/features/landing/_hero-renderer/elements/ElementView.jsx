import { useEffect, useState } from 'react'
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
import { curvaDe, entradaSnap, estadoSnap, estiloDeReveal, msSalidaSnap, retardoAcotado, SNAP_CON_KEYFRAMES, SNAP_CURVA_POR_DEFECTO } from './revelar'

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

// snapState (modo snap, Fase 1c): transición CSS — reemplaza la animation por keyframe cuando el host (SnapStage/ScrollStage)
// mantiene montado el paso saliente ('leaving') y anima el entrante ('pending' → 'in') en vez de desmontar/remontar por nonce.
// Target 'oculto' idéntico para pending/leaving (kolortec: setActiveStep(-1) aplica el mismo estilo a cualquier bloque no-activo,
// sin importar si entra o sale).
// La transición sale de la animación del elemento, igual que en el carrusel: el TIPO decide desde dónde entra (estadoSnap), y
// durationMs / delayMs / easing los fija el panel. Sólo cuando el diseño no fijó duración o curva rige la de kolortec (0,7 s), y un
// elemento sin animación ('none' o ausente) entra con el movimiento de kolortec (entradaSnap en ./revelar).
// VIS-101: lo guardado SÓLO cuenta si el panel de «Por pasos» lo marcó (`animation.enSnap: true`, ver entradaSnap). Sin la marca —las
// plantillas, los diseños anteriores, lo que genera la IA— rige el movimiento de kolortec, que es lo que se publicaba.
// Al SALIR (paso saliente, 'leaving') el elemento se monta VISIBLE y recién después de pintar ese primer frame ejecuta su salida: el
// reverso de su entrada, con la misma duración y curva pero SIN retardo (VIS-102: todos salen juntos, así nunca se corta por el techo
// de msSalidaDelPaso). `animation.exit` es del carrusel y acá se ignora (VIS-103). Si se montara ya en el estado oculto no habría
// nada que interpolar y el elemento desaparecería de golpe (el nodo seguía montado, pero invisible).
// El escalonado no existe acá (el panel no lo ofrece en este modo).

/** Cuánto (ms) debe seguir montado el paso saliente en «Por pasos»: lo que tarda su salida más lenta (piso 700, techo 2000). */
export function msSalidaDelPaso(elementos) {
  return msSalidaSnap(elementos, ANIM_TYPES)
}

// `active` (opcional): sólo lo pasa el carrusel. `false` = esta escena NO es la visible (está saliendo o esperando);
// ahí corre la salida del elemento, si tiene. Sin `active` (scroll, snap, preview) no hay momento de salida: se ignora `exit`.
/**
 * ¿El elemento está oculto en este breakpoint? La ÚNICA regla (ElementView la usa para no pintar y el ojo de cada capa del Lab para mostrar el estado).
 * `tabletComoEscritorio` lo pasa SÓLO el scrolltelling: allí la tablet se veía como escritorio, así que sin `hidden.tablet` explícito rige `hidden.desktop` (lo que
 * se publicaba). El carrusel no lo pasa y sigue como estaba; con `hidden.tablet` explícito manda ese.
 */
// eslint-disable-next-line react-refresh/only-export-components -- helper puro de visibilidad que comparten el renderer y el ojo de las capas del Lab; el archivo se copia byte-idéntico, no se parte.
export function estaOculto(el, bp, tabletComoEscritorio) {
  return !!(el.hidden?.[bp] ?? (tabletComoEscritorio && bp === 'tablet' ? el.hidden?.desktop : undefined))
}

export function ElementView({ el, bp, reveal, accentColor, themePreset, snapState, active, tabletComoEscritorio }) {
  // Paso saliente: false = primer frame (visible); true = ya pintado, ahora ejecuta la salida. Dos rAF = el frame visible llegó a pantalla.
  const [salidaIniciada, setSalidaIniciada] = useState(false)
  useEffect(() => {
    if (snapState !== 'leaving') return undefined
    let r2 = 0
    const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setSalidaIniciada(true)) })
    return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2) }
  }, [snapState])
  if (estaOculto(el, bp, tabletComoEscritorio)) return null
  // VIS-002 · el paso saliente se ve SALIR sólo si lo elegiste (`animation.enSnap`). Sin la marca, como se publicaba: desaparece de golpe.
  if (snapState === 'leaving' && el.animation?.enSnap !== true) return null
  const animType = ANIM_TYPES.includes(el.animation?.type) ? el.animation.type : 'fade'
  const easing = EASING_CSS[el.animation?.easing] ?? EASING_CSS.ease
  // `exit` es del carrusel: en «Por pasos» (snapState definido) se ignora aunque el diseño lo traiga; la salida es el reverso de la entrada.
  const exitType = snapState === undefined && EXIT_TYPES.includes(el.animation?.exit) ? el.animation.exit : 'none'
  const saleYa = snapState === 'leaving' && salidaIniciada
  const saliendo = (active === false || saleYa) && exitType !== 'none'
  // El escalonado rige en el carrusel y en el scroll continuo; en «Por pasos» no (ver SNAP_*).
  const staggerMs = snapState === undefined && STAGGER_TYPES.includes(el.type) ? Math.min(STAGGER_MAX_MS, Math.max(0, cssNumber(el.animation?.stagger ?? 0, 0))) : 0
  const parts = []
  let opacity = el.opacity === undefined ? undefined : cssNumber(el.opacity, 1)
  let anim
  let filter
  let clip
  let transition
  let escalonado

  if (snapState !== undefined) {
    // 'none' o sin animación = el movimiento de kolortec (lo publicado hoy); un tipo elegido en el Lab se ve tal cual.
    const { tipo, ms: durSnap, retardo, easing: easingSnap } = entradaSnap(el.animation, ANIM_TYPES)
    const retraso = snapState === 'in' ? retardo : 0 // sólo la ENTRADA lleva el retardo; el que espera y el que sale, no (VIS-102)
    const curvaSnap = Object.prototype.hasOwnProperty.call(EASING_CSS, easingSnap) ? EASING_CSS[easingSnap] : SNAP_CURVA_POR_DEFECTO
    // En pie (visible): entrando, o saliente que todavía no ejecutó su salida.
    const enPie = snapState === 'in' || (snapState === 'leaving' && !saleYa)
    const estado = estadoSnap(tipo, enPie)
    if (snapState === 'in' && SNAP_CON_KEYFRAMES.includes(tipo)) {
      // bounce / mask-reveal al ENTRAR: el mismo @keyframes del carrusel (rebote; máscara que termina al final, sin fundido de opacidad).
      anim = `hc-${tipo} ${durSnap}ms ${curvaSnap} ${retraso}ms both`
    } else {
      transition = ['opacity', ...Object.keys(estado).map((k) => (k === 'clipPath' ? 'clip-path' : k))]
        .map((prop) => `${prop} ${durSnap}ms ${curvaSnap} ${retraso}ms`).join(', ')
    }
    if (estado.transform) parts.push(estado.transform)
    filter = estado.filter
    clip = estado.clipPath
    if (!enPie) opacity = 0
  } else if (reveal === undefined) {
    // Optional chaining: elementos legacy pueden venir sin objeto animation.
    const durMs = cssNumber(el.animation?.durationMs ?? 500, 500)
    const delayMs = retardoAcotado(el.animation?.delayMs)
    if (saliendo) {
      anim = `hc-out-${exitType} ${Math.min(durMs, EXIT_MAX_MS)}ms ${easing} 0ms both`
    } else if (animType !== 'none' && staggerMs > 0) {
      // Con stagger, la entrada la hace cada hijo (con su retardo escalonado); el contenedor no se anima.
      escalonado = { nombre: `hc-${animType}`, ms: durMs, curva: easing, retardo: delayMs, paso: staggerMs }
    } else if (animType !== 'none') {
      anim = `hc-${animType} ${durMs}ms ${easing} ${delayMs}ms both`
    }
  } else {
    // Scroll continuo: la entrada se escrubea con el progreso `reveal`. La curva (easing) le da la forma y el escalonado reparte la
    // ventana entre los hijos de stats / quicklinks (el contenedor no se anima: lo hace cada hijo, como en el carrusel).
    const curva = curvaDe(el.animation?.easing)
    if (staggerMs > 0 && animType !== 'none') {
      escalonado = { revelar: { tipo: animType, r: reveal, curva, ms: cssNumber(el.animation?.durationMs ?? 600, 600), paso: staggerMs } }
    } else {
      const e = estiloDeReveal(animType, reveal, curva)
      if (e.opacidad !== 1) opacity = (opacity ?? 1) * e.opacidad
      if (e.transform) parts.push(e.transform)
      filter = e.filter
      clip = e.clipPath
    }
  }

  const tf = parts.join(' ') || undefined
  // rotate-in y zoom-out giran/escalan desde el centro; el resto, desde la esquina (como siempre).
  const tipoEntrada = snapState !== undefined ? entradaSnap(el.animation, ANIM_TYPES).tipo : animType
  const origen = (saliendo ? exitType === 'zoom-out' : tipoEntrada === 'rotate-in') ? 'center' : 'top left'
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
