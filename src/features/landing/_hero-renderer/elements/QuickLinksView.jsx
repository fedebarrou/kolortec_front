import { cqw } from '../responsive'

export function QuickLinksView({ p }) {
  const items = Array.isArray(p.items) ? p.items : []
  return (
    <div data-fit style={{ display: 'flex', flexWrap: p.layout === 'wrap' ? 'wrap' : 'nowrap', gap: cqw(p.gap) }}>
      {items.map((it, i) => (
        <a key={i} href={it.href} style={{ background: 'rgba(255,255,255,.9)', color: '#111', padding: `${cqw(6)} ${cqw(12)}`, borderRadius: cqw(999), fontWeight: 600, fontSize: cqw(13), textDecoration: 'none', whiteSpace: 'nowrap' }}>
          {it.icon ? `${it.icon} ` : ''}{it.label}
        </a>
      ))}
    </div>
  )
}
