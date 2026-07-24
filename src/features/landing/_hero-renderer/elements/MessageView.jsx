import { cqw, cqwType } from '../responsive'

const cross = { left: 'flex-start', center: 'center', right: 'flex-end' }
const SHADOW = '0 2px 18px rgba(0,0,0,.45)'
const TITLE_GLOW = '0 1px 2px rgba(10,6,24,.78), 0 0 22px rgba(255,250,255,.70), 0 0 60px rgba(196,150,255,.5)'
const BACKDROP = 'radial-gradient(ellipse 56% 54% at 50% 50%, rgba(8,4,20,.70) 0%, rgba(8,4,20,.44) 46%, rgba(8,4,20,0) 76%)'

const z1 = { position: 'relative', zIndex: 1 }

export function MessageView({ p }) {
  const titleSize = cqwType((p.accent ? 48 : 38) * (p.titleScale ?? 1))
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: cross[p.align] }}>
      <div data-fit style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: cross[p.align], gap: cqw(10), maxWidth: '100%', textAlign: p.align }}>
        {p.glow && (
          <span aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '124%', height: '186%', background: BACKDROP, filter: 'blur(9px)', zIndex: 0, pointerEvents: 'none' }} />
        )}
        {p.eyebrow && (
          <span style={{ ...z1, fontFamily: '"Archivo", system-ui, sans-serif', fontWeight: 800, fontSize: cqwType(13), letterSpacing: '.32em', textTransform: 'uppercase', color: p.color, opacity: .94, textShadow: '0 1px 10px rgba(10,6,24,.7)' }}>{p.eyebrow}</span>
        )}
        {p.accent && (
          <span style={{ ...z1, display: 'inline-block', background: '#EE5237', color: '#fff', fontWeight: 800, fontSize: cqw(13), letterSpacing: '.08em', padding: `${cqw(4)} ${cqw(11)}`, borderRadius: cqw(99) }}>OFERTA</span>
        )}
        <div className={p.glow ? 'rl-aura' : undefined} style={{ ...z1, fontFamily: p.fontFamily || '"Schibsted Grotesk", sans-serif', fontWeight: 800, fontSize: titleSize, lineHeight: 1.05, color: p.color, textShadow: p.glow ? TITLE_GLOW : SHADOW, WebkitTextStroke: p.glow ? '0.6px rgba(12,6,28,.22)' : undefined, paintOrder: 'stroke fill', textWrap: 'balance', letterSpacing: '-.02em' }}>{p.title || 'Tu mensaje aca'}</div>
        {p.sub && <div style={{ ...z1, fontFamily: p.fontFamily || '"Hanken Grotesk", sans-serif', fontWeight: 500, fontSize: cqwType(17), lineHeight: 1.3, color: p.color, opacity: .92, textShadow: SHADOW, textWrap: 'balance' }}>{p.sub}</div>}
        {p.cta && (
          <a href={p.ctaHref || '#'} style={{ ...z1, marginTop: cqw(4), display: 'inline-flex', alignItems: 'center', background: '#EE5237', color: '#fff', fontWeight: 700, fontSize: cqwType(15), padding: `${cqw(11)} ${cqw(22)}`, borderRadius: cqw(99), textDecoration: 'none', boxShadow: '0 8px 22px rgba(238,82,55,.4)' }}>{p.cta}</a>
        )}
      </div>
    </div>
  )
}
