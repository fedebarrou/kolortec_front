import { useEffect, useRef, useState } from 'react'
import { cqw } from '../responsive'
import { typoStyle } from './typo'

const cross = { left: 'flex-start', center: 'center', right: 'flex-end' }
const BACKDROP = 'radial-gradient(ellipse 56% 54% at 50% 50%, rgba(8,4,20,.70) 0%, rgba(8,4,20,.44) 46%, rgba(8,4,20,0) 76%)'
const NUM_GLOW = '0 1px 2px rgba(10,6,24,.78), 0 0 22px rgba(255,250,255,.55), 0 0 50px rgba(196,150,255,.45)'
// Slots tipográficos (mismas claves que _editor/typoSlots.js#stats — no se
// importan desde acá para que este archivo se pueda copiar byte-idéntico a
// la store, que no tiene _editor/).
const NUM_SLOT = { font: 'fontFamily', weight: 'numWeight', size: 'numSize', lh: 'numLineHeight', ls: 'numLetterSpacingEm', color: 'color' }
const LABEL_SLOT = { font: 'labelFontFamily', weight: 'labelWeight', size: 'labelSize', ls: 'labelLetterSpacingEm', color: 'labelColor', transform: 'labelTransform' }

function parseValue(raw) {
  const m = raw.match(/^(\D*)([\d.,]+)(.*)$/)
  if (!m) return null
  const [, prefix, num, suffix] = m
  const dot = num.replace(',', '.')
  const n = parseFloat(dot)
  if (!isFinite(n)) return null
  const decimals = (dot.split('.')[1] || '').length
  return { prefix, n, suffix, decimals }
}
function formatCount(raw, r) {
  const p = parseValue(raw)
  if (!p) return raw
  const eased = 1 - Math.pow(1 - Math.max(0, Math.min(1, r)), 3)
  const v = p.n * eased
  const s = p.decimals > 0 ? v.toFixed(p.decimals).replace('.', ',') : String(Math.round(v))
  return `${p.prefix}${s}${p.suffix}`
}

export function StatsView({ p, reveal }) {
  const visible = (reveal ?? 1) > 0.02
  const [prog, setProg] = useState(1)
  const raf = useRef(0)
  useEffect(() => {
    if (!p.countUp) { setProg(1); return }
    if (!visible) { setProg(0); return }
    let t0 = 0
    const dur = 1100
    const tick = (ts) => {
      if (!t0) t0 = ts
      const t = Math.min(1, (ts - t0) / dur)
      setProg(t)
      if (t < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [visible, p.countUp])
  const shown = (v) => (p.countUp ? formatCount(v, prog) : v)
  // numSize/numLineHeight/numLetterSpacingEm/labelSize/labelLetterSpacingEm/
  // labelTransform ya vienen bakeados en defaults.js (42/1/-.01/11/.2/
  // 'uppercase') — acá sólo el fallback de fontFamily (y, para la etiqueta,
  // de color, que hoy comparte el `color` de la cifra).
  const numTypo = typoStyle(p, NUM_SLOT, { fontFamily: '"Schibsted Grotesk", sans-serif' })
  const labelTypo = typoStyle(p, LABEL_SLOT, { fontFamily: '"Archivo", system-ui, sans-serif', color: p.color })
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: cross[p.align] }}>
      <div data-fit style={{ position: 'relative', display: 'inline-flex', alignItems: 'stretch', gap: 0, maxWidth: '100%' }}>
        {p.glow && (
          <span aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '128%', height: '210%', background: BACKDROP, filter: 'blur(9px)', zIndex: 0, pointerEvents: 'none' }} />
        )}
        {p.items.map((it, i) => (
          <div key={i} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: `0 ${cqw(26)}`, borderLeft: p.divider && i > 0 ? `1px solid ${p.color}59` : undefined }}>
            <span style={{ ...numTypo, textShadow: p.glow ? NUM_GLOW : '0 2px 18px rgba(0,0,0,.45)' }}>
              {shown(it.value)}
            </span>
            <span style={{ ...labelTypo, opacity: .76, marginTop: cqw(7), textShadow: '0 1px 10px rgba(10,6,24,.7)' }}>
              {it.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
