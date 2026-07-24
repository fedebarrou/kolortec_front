import { cqw, cqwType } from '../responsive'

const justify = { top: 'flex-start', center: 'center', bottom: 'flex-end' }
const items = { left: 'flex-start', center: 'center', right: 'flex-end' }
const SHADOW = '0 2px 18px rgba(0,0,0,.45)'

export function TextView({ p }) {
  const text = { fontFamily: p.fontFamily, fontSize: cqwType(p.fontSize), fontWeight: p.weight, color: p.color, textAlign: p.align, lineHeight: p.lineHeight, letterSpacing: cqw(p.letterSpacing), textShadow: p.textShadow || SHADOW, textWrap: 'balance' }
  const chrome = {
    background: p.bg, borderRadius: cqw(p.radius), padding: cqw(p.padding),
    border: p.borderWidth ? `${cqw(p.borderWidth)} solid ${p.borderColor}` : undefined,
  }

  if (p.autoSize) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: justify[p.vAlign], alignItems: items[p.align] }}>
        <div data-fit style={{ ...text, ...chrome, display: 'inline-block', maxWidth: '100%' }}>{p.content}</div>
      </div>
    )
  }
  return (
    <div data-fit style={{ ...text, ...chrome, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: justify[p.vAlign] }}>
      <div>{p.content}</div>
    </div>
  )
}
