import { cqw, cqwType } from '../responsive'
import { typoStyle } from './typo'
import { cssColor, cssPick, safeHref } from '../cssSafe'

const PAD = { sm: [6, 12], md: [10, 18], lg: [14, 24] }
const FS = { sm: 12, md: 14, lg: 17 }
// Slot tipográfico (mismas claves que _editor/typoSlots.js#button — no se
// importa desde acá para que este archivo se pueda copiar byte-idéntico a
// la store, que no tiene _editor/).
const BUTTON_SLOT = { font: 'fontFamily', weight: 'weight', size: 'fontSize', ls: 'letterSpacingEm', color: 'textColor', transform: 'textTransform' }

export function ButtonView({ p }) {
  const [py, px] = cssPick(PAD, p.size) || PAD.md
  const solid = p.variant === 'solid'
  const ghost = p.variant === 'ghost'
  // fontSize hoy depende de `size` (sm/md/lg) — no hay un único valor
  // "hardcodeado" para bakear en defaults.js; el fallback se calcula acá
  // mismo, igual que antes.
  const typo = typoStyle(p, BUTTON_SLOT, { fontFamily: 'inherit', fontWeight: 700, fontSize: cqwType(cssPick(FS, p.size) || 14) })
  const style = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: `${cqw(py)} ${cqw(px)}`, borderRadius: cqw(p.radius),
    background: solid ? cssColor(p.color) : 'transparent', textDecoration: 'none',
    ...typo,
    border: ghost ? 'none' : solid ? 'none' : (cssColor(p.color) ? `${cqw(1)} solid ${cssColor(p.color)}` : undefined),
    boxShadow: solid ? '0 8px 22px rgba(0,0,0,.28)' : undefined,
  }
  return <a data-fit href={safeHref(p.href)} style={style}>{p.label}</a>
}
