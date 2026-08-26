import { cqw } from '../responsive'
import { typoStyle } from './typo'

const justify = { top: 'flex-start', center: 'center', bottom: 'flex-end' }
const items = { left: 'flex-start', center: 'center', right: 'flex-end' }
// Slot tipográfico (mismas claves que _editor/typoSlots.js#text — no se
// importa desde acá para que este archivo se pueda copiar byte-idéntico a
// la store, que no tiene _editor/).
const TEXT_SLOT = { font: 'fontFamily', weight: 'weight', size: 'fontSize', lh: 'lineHeight', ls: 'letterSpacingEm', color: 'color', transform: 'textTransform' }
const SHADOW = '0 2px 18px rgba(0,0,0,.45)'
// Sombras kolortec (ScrollytellingSection.jsx TextBlock): título más marcada,
// resto más sutil. Solo se aplican como DEFAULT (p.textShadow ausente) y con
// themePreset==='kolortec' — así no cambia el look de diseños existentes.
const SHADOW_KOLORTEC_TITLE = '0 2px 24px rgba(0,0,0,.9), 0 1px 3px rgba(0,0,0,.85)'
const SHADOW_KOLORTEC_BODY = '0 1px 12px rgba(0,0,0,.9)'

// accentDot: si el texto termina en . ! ? y el flag está activo, ese último
// carácter se pinta en accentColor (theme.colors.primary) — look kolortec
// ("Construidos para rendir." con el punto en el color de marca).
function withAccentDot(content, accentDot, accentColor) {
  if (!accentDot || typeof content !== 'string') return content
  const last = content.slice(-1)
  if (last !== '.' && last !== '!' && last !== '?') return content
  return <>{content.slice(0, -1)}<span style={{ color: accentColor }}>{last}</span></>
}

export function TextView({ p, accentColor, themePreset }) {
  const fs = Number(p.fontSize) || 0
  const isTitleLike = p.role === 'title' || fs >= 40
  // kolortec: el eyebrow (texto chico, ≤ 14px) NO lleva sombra; solo título y cuerpo.
  const isEyebrowLike = !isTitleLike && fs > 0 && fs <= 14
  const kolortecShadow = isTitleLike ? SHADOW_KOLORTEC_TITLE : (isEyebrowLike ? 'none' : SHADOW_KOLORTEC_BODY)
  const defaultShadow = themePreset === 'kolortec' ? kolortecShadow : SHADOW
  // letterSpacingEm (nuevo, opcional) gana sobre letterSpacing (px/cqw) — kolortec
  // usa em (eyebrow .24em, título .06em), no px, para escalar con el tamaño de letra.
  // typoStyle resuelve ese "em gana sobre px legacy" vía el fallback: si
  // letterSpacingEm está ausente, cae al `cqw(p.letterSpacing)` de siempre.
  const typo = typoStyle(p, TEXT_SLOT, { letterSpacing: cqw(p.letterSpacing) })
  const text = { ...typo, textAlign: p.align, textShadow: p.textShadow || defaultShadow, textWrap: themePreset === 'kolortec' ? undefined : 'balance', whiteSpace: 'pre-line' }
  const chrome = {
    background: p.bg, borderRadius: cqw(p.radius), padding: cqw(p.padding),
    border: p.borderWidth ? `${cqw(p.borderWidth)} solid ${p.borderColor}` : undefined,
  }
  const content = withAccentDot(p.content, p.accentDot, accentColor)
  // eyebrowLine (nuevo, opcional): raya de acento antes del texto (kolortec:
  // eyebrow con línea corta a la izquierda, 2px×36px, gap 10px, color de marca).
  const eyebrowLine = p.eyebrowLine ? <span aria-hidden="true" className="hc-eyebrow-line" style={{ background: accentColor }} /> : null
  const fitStyle = eyebrowLine
    ? { ...text, ...chrome, display: 'inline-flex', alignItems: 'center', gap: 10, maxWidth: '100%' }
    : { ...text, ...chrome, display: 'inline-block', maxWidth: '100%' }

  // data-fit SIEMPRE en el <div> interno (autoSize o no): así Canvas.jsx mide el
  // contenido REAL (hug) para el bounding box de selección/drag, nunca la caja
  // completa 100%×100% del wrapper — ver contrato Fase 3 (bounding box fiel).
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: justify[p.vAlign], alignItems: items[p.align] }}>
      <div data-fit style={fitStyle}>{eyebrowLine}{content}</div>
    </div>
  )
}
