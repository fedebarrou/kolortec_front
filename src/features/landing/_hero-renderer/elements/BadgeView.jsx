import { cqw } from '../responsive'
import { typoStyle } from './typo'

// Slot tipográfico (mismas claves que _editor/typoSlots.js#badge — no se
// importa desde acá para que este archivo se pueda copiar byte-idéntico a
// la store, que no tiene _editor/).
const BADGE_SLOT = { font: 'fontFamily', weight: 'weight', size: 'fontSize', ls: 'letterSpacingEm', color: 'color', transform: 'textTransform' }

export function BadgeView({ p }) {
  // fontSize: fallback = cqw(13), NO cqwType(13) — hoy es `cqw`, no clamp; si
  // el prop viene seteado (número), typo.js sí lo pasa por cqwType (nuevo
  // comportamiento sólo para quien edite el tamaño desde el Inspector).
  const typo = typoStyle(p, BADGE_SLOT, { fontFamily: 'inherit', fontWeight: 800, fontSize: cqw(13), letterSpacing: '.08em' })
  return <span data-fit style={{ display: 'inline-block', background: p.bg, ...typo, padding: `${cqw(4)} ${cqw(11)}`, borderRadius: cqw(99), boxShadow: '0 4px 14px rgba(0,0,0,.25)' }}>{p.label}</span>
}
