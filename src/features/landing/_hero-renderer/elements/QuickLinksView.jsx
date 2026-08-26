import { cqw } from '../responsive'
import { typoStyle } from './typo'

// Slot tipográfico (mismas claves que _editor/typoSlots.js#quicklinks — no
// se importa desde acá para que este archivo se pueda copiar byte-idéntico
// a la store, que no tiene _editor/).
const QUICKLINKS_SLOT = { font: 'fontFamily', weight: 'weight', size: 'fontSize', ls: 'letterSpacingEm', color: 'color', transform: 'textTransform' }

export function QuickLinksView({ p }) {
  const typo = typoStyle(p, QUICKLINKS_SLOT, { fontFamily: 'inherit', fontWeight: 600, fontSize: cqw(13), color: '#111111' })
  return (
    <div data-fit style={{ display: 'flex', flexWrap: p.layout === 'wrap' ? 'wrap' : 'nowrap', gap: cqw(p.gap) }}>
      {p.items.map((it, i) => (
        <a key={i} href={it.href} style={{ background: 'rgba(255,255,255,.9)', padding: `${cqw(6)} ${cqw(12)}`, borderRadius: cqw(999), textDecoration: 'none', whiteSpace: 'nowrap', ...typo }}>
          {it.icon ? `${it.icon} ` : ''}{it.label}
        </a>
      ))}
    </div>
  )
}
