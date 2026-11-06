import { cqw, cqwType } from '../responsive'
import { typoStyle } from './typo'
import { cssColor, cssPick, safeHref } from '../cssSafe'

const PAD = { sm: [6, 12], md: [10, 18], lg: [14, 24] }
const FS = { sm: 12, md: 14, lg: 17 }
// Mismo cuadro que RatingView (no se comparte un archivo: cada vista se copia sola a la store y a kolortec).
const ALINEAR = { center: { display: 'flex', width: 'fit-content', marginLeft: 'auto', marginRight: 'auto' }, right: { display: 'flex', width: 'fit-content', marginLeft: 'auto' } }
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
    // D6 (informe Hero 12-nov): a 390 el botón medía 97×24, chico para el dedo. En un escenario de celular (< 768 de ancho,
    // el mismo corte que `MOBILE_BELOW`) mide al menos 44 de alto; en la compu, nada cambia (el clamp da 0).
    minHeight: 'clamp(0px, calc((768px - 100cqw) * 1000), 44px)',
    // D2 (informe Hero 12-nov): el botón se dibujaba pegado al borde izquierdo de su caja (`inline-flex`), así que bajo un título
    // centrado quedaba corrido. Con `align` centro/derecha se vuelve bloque del ancho de su texto y se corre con márgenes; sin
    // `align` (o `left`) se dibuja igual que siempre.
    ...cssPick(ALINEAR, p.align),
  }
  return <a data-fit href={safeHref(p.href)} style={style}>{p.label}</a>
}
