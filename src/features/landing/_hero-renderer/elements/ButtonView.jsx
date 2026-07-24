import { cqw, cqwType } from '../responsive'

const PAD = { sm: [6, 12], md: [10, 18], lg: [14, 24] }
const FS = { sm: 12, md: 14, lg: 17 }

export function ButtonView({ p }) {
  const [py, px] = PAD[p.size] || PAD.md
  const solid = p.variant === 'solid'
  const ghost = p.variant === 'ghost'
  const style = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: `${cqw(py)} ${cqw(px)}`, borderRadius: cqw(p.radius),
    background: solid ? p.color : 'transparent', color: p.textColor, fontWeight: 700, textDecoration: 'none', fontSize: cqwType(FS[p.size] || 14),
    border: ghost ? 'none' : solid ? 'none' : `${cqw(1)} solid ${p.color}`,
    boxShadow: solid ? '0 8px 22px rgba(0,0,0,.28)' : undefined,
  }
  return <a data-fit href={p.href} style={style}>{p.label}</a>
}
