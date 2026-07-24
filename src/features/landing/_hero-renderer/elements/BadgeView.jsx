import { cqw } from '../responsive'

export function BadgeView({ p }) {
  return <span data-fit style={{ display: 'inline-block', background: p.bg, color: p.color, fontWeight: 800, fontSize: cqw(13), letterSpacing: '.08em', padding: `${cqw(4)} ${cqw(11)}`, borderRadius: cqw(99), boxShadow: '0 4px 14px rgba(0,0,0,.25)' }}>{p.label}</span>
}
