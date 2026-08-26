import { cqw, cqwType } from '../responsive'
import { typoStyle } from './typo'

const cross = { left: 'flex-start', center: 'center', right: 'flex-end' }
const SHADOW = '0 2px 18px rgba(0,0,0,.45)'
const TITLE_GLOW = '0 1px 2px rgba(10,6,24,.78), 0 0 22px rgba(255,250,255,.70), 0 0 60px rgba(196,150,255,.5)'
const BACKDROP = 'radial-gradient(ellipse 56% 54% at 50% 50%, rgba(8,4,20,.70) 0%, rgba(8,4,20,.44) 46%, rgba(8,4,20,0) 76%)'

const z1 = { position: 'relative', zIndex: 1 }

// Slots tipográficos (mismas claves que _editor/typoSlots.js#message — no se
// importan desde acá para que este archivo se pueda copiar byte-idéntico a
// la store, que no tiene _editor/).
const TITLE_SLOT = { font: 'fontFamily', weight: 'titleWeight', size: 'titleSize', lh: 'titleLineHeight', ls: 'titleLetterSpacingEm', color: 'color', transform: 'titleTransform' }
const SUB_SLOT = { font: 'subFontFamily', weight: 'subWeight', size: 'subSize', lh: 'subLineHeight', ls: 'subLetterSpacingEm', color: 'subColor', transform: 'subTransform' }
const EYEBROW_SLOT = { font: 'eyebrowFontFamily', weight: 'eyebrowWeight', size: 'eyebrowSize', lh: 'eyebrowLineHeight', ls: 'eyebrowLetterSpacingEm', color: 'eyebrowColor', transform: 'eyebrowTransform' }
const CTA_SLOT = { font: 'ctaFontFamily', weight: 'ctaWeight', size: 'ctaSize', ls: 'ctaLetterSpacingEm', color: 'ctaTextColor', transform: 'ctaTransform' }

// accentDot: si el título termina en . ! ? y el flag está activo, ese último
// carácter se pinta en accentColor (theme.colors.primary) — look kolortec.
function withAccentDot(content, accentDot, accentColor) {
  if (!accentDot || typeof content !== 'string') return content
  const last = content.slice(-1)
  if (last !== '.' && last !== '!' && last !== '?') return content
  return <>{content.slice(0, -1)}<span style={{ color: accentColor }}>{last}</span></>
}

// eyebrowLine: raya de acento (2×36px, .hc-eyebrow-line en hero-lab.css/
// hero-anim.css/globals.css) antepuesta al antetítulo — look kolortec, opt-in
// en CUALQUIER preset (mismo mecanismo que TextView.jsx).
function EyebrowLine({ accentColor }) {
  return <span aria-hidden="true" className="hc-eyebrow-line" style={{ background: accentColor }} />
}

// Sombras/clamps literales de kolortec (ScrollytellingSection.jsx TextBlock,
// líneas 337-398): título más marcada, subtítulo más sutil. `cqw` en vez de
// `vw` porque el stage es container `hc-stage` (contrato scroll-hero.md) — a
// 1440px de ancho de stage el resultado en px es idéntico al de kolortec.
// El título hereda line-height/letter-spacing/uppercase de `.title-font`
// (kolortec/src/index.css, @layer utilities — gana sobre el `leading-[.98]`
// inline por orden de declaración dentro de la misma layer): verificado por
// getComputedStyle contra localhost:5173 (line-height 78.016px = 1.06×73.6,
// letter-spacing 4.416px = .06em×73.6, textTransform uppercase). El subtítulo
// es font-weight 400 (Manrope regular) ahí, no 500.
const KOLORTEC_TITLE_SHADOW = '0 2px 24px rgba(0,0,0,.9), 0 1px 3px rgba(0,0,0,.85)'
const KOLORTEC_SUB_SHADOW = '0 1px 12px rgba(0,0,0,.9)'
const KOLORTEC_TITLE_SIZE = 'clamp(1.9rem, 6cqw, 4.6rem)'
const KOLORTEC_SUB_SIZE = 'clamp(.95rem, 1.6cqw, 1.25rem)'

// Fallbacks tipográficos del preset Kolortec, uno por slot — EN SYNC con
// KOLORTEC_MESSAGE_PROPS de ../../_schema/defaults.js (duplicado a propósito:
// este archivo se copia byte-idéntico a la store, que no tiene `_schema/`, y
// defaults.js no puede importar de `_renderer/` porque
// check-hero-roundtrip.mjs lo carga como texto plano sin resolver imports).
// Si se toca un valor acá, tocar también KOLORTEC_MESSAGE_PROPS.
const KOLORTEC_TITLE_FALLBACKS = { fontFamily: 'Anton, sans-serif', fontWeight: 900, fontSize: KOLORTEC_TITLE_SIZE, lineHeight: 1.06, letterSpacing: '.06em', textTransform: 'uppercase' }
const KOLORTEC_SUB_FALLBACKS = { fontSize: KOLORTEC_SUB_SIZE, lineHeight: 1.55, fontWeight: 400, color: '#eef0f4' }
// lineHeight:1.5 — literal (ScrollytellingSection.jsx no fija leading en el
// antetítulo, así que hereda `.title-font`/body ≈1.5 en kolortec). Antes esta
// constante no traía `lineHeight` → typoStyle() lo dejaba sin setear y el
// span heredaba el 1.55 del subtítulo vecino en vez de 1.5 (getComputedStyle
// localhost:5173). EN SYNC con KOLORTEC_MESSAGE_PROPS (defaults.js).
const KOLORTEC_EYEBROW_FALLBACKS = { fontSize: '0.72rem', fontWeight: 700, lineHeight: 1.5, letterSpacing: '.24em', textTransform: 'uppercase' }
const KOLORTEC_CTA_FALLBACKS = { fontSize: '.82rem', fontWeight: 900, letterSpacing: '.1em', textTransform: 'uppercase', color: '#000' }

// margin-left/right para forzar el align EXPLÍCITO del usuario en el
// subtítulo cuando difiere del default kolortec ('right'): 'left' → pegado
// al borde izquierdo; 'center' → centrado; 'right' no llega acá (ver
// explicitAlign en KolortecMessage — con align default el sub sigue el
// align-items responsive de .hc-kt-block, sin margin inline).
const alignMargin = (align) => ({
  marginLeft: align === 'left' ? 0 : 'auto',
  marginRight: align === 'right' ? 0 : 'auto',
})

/** Clon literal del TextBlock de kolortec (preset:'kolortec'). */
function KolortecMessage({ p, accentColor }) {
  // explicitAlign: sólo distinto de null cuando el usuario tocó `align` desde
  // el Inspector a algo != 'right' (default kolortec). En ese caso fuerza ese
  // align en TODOS los tiers vía las custom properties --hc-kt-h/--hc-kt-text
  // que leen .hc-kt-block y sus hijos (hero-lab.css/hero-anim.css/
  // globals.css) — pisando el responsive propio de kolortec (center en
  // mobile, right en desktop: `text-center md:text-right`). Sin override, el
  // bloque completo (posición Y alineación de texto) sigue ese responsive.
  const explicitAlign = p.align && p.align !== 'right' ? p.align : null
  const titleTypo = typoStyle(p, TITLE_SLOT, KOLORTEC_TITLE_FALLBACKS)
  const subTypo = typoStyle(p, SUB_SLOT, KOLORTEC_SUB_FALLBACKS)
  // eyebrow: color por defecto = accentColor (dinámico, no puede vivir en la
  // constante KOLORTEC_EYEBROW_FALLBACKS de arriba).
  const eyebrowTypo = typoStyle(p, EYEBROW_SLOT, { ...KOLORTEC_EYEBROW_FALLBACKS, color: accentColor })
  const ctaTypo = typoStyle(p, CTA_SLOT, KOLORTEC_CTA_FALLBACKS)
  const ktVars = explicitAlign ? { '--hc-kt-h': cross[explicitAlign], '--hc-kt-text': explicitAlign } : undefined
  return (
    // hc-kt-block: clon del contenedor kolortec (ScrollytellingSection.jsx
    // TextBlock L340-343) — ocupa 100%×100% de la caja del elemento (pos =
    // {x:0,y:0,w:100,h:100}, CloneKolortecScroll.php messageEl()) y se
    // posiciona con flex+padding en tiers vía @container hc-stage, no con el
    // rect en % de siempre (a otro ancho de stage que no fuera 1440px el
    // borde derecho quedaba a una distancia distinta de la de kolortec:
    // pr-40=160px fijo + max-w-[40rem], no proporcional).
    <div className="hc-kt-block" style={ktVars}>
      <div data-fit style={{ display: 'inline-flex', flexDirection: 'column', maxWidth: 'min(40rem, 100%)' }}>
        {p.eyebrow && (
          <span className="hc-kt-eyebrow-wrap" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {p.eyebrowLine && <EyebrowLine accentColor={accentColor} />}
            <span style={eyebrowTypo}>{p.eyebrow}</span>
          </span>
        )}
        {/* kolortec NO usa text-wrap:balance (corta 'CONSTRUIDOS PARA / RENDIR.'); wrap normal. */}
        <div style={{ marginTop: 12, ...titleTypo, whiteSpace: 'pre-line', textShadow: KOLORTEC_TITLE_SHADOW }}>
          {withAccentDot(p.title || 'Tu mensaje acá', p.accentDot, accentColor)}
        </div>
        {p.sub && (
          <div style={{ marginTop: 16, maxWidth: '42ch', ...(explicitAlign ? alignMargin(explicitAlign) : null), ...subTypo, whiteSpace: 'pre-line', textShadow: KOLORTEC_SUB_SHADOW }}>
            {p.sub}
          </div>
        )}
        {p.cta && (
          <a href={p.ctaHref || '#'} style={{ marginTop: 32, display: 'inline-flex', minHeight: 44, alignItems: 'center', background: accentColor, padding: '0 28px', textDecoration: 'none', boxShadow: '0 10px 30px rgba(0,0,0,.4)', borderRadius: 0, ...ctaTypo }}>
            {p.cta}
          </a>
        )}
      </div>
    </div>
  )
}

export function MessageView({ p, accentColor }) {
  if (p.preset === 'kolortec') return <KolortecMessage p={p} accentColor={accentColor} />

  // titleSize ausente → sigue la fórmula relativa a titleScale de siempre
  // (esto es lo que garantiza que el preset 'default' no cambie: si el
  // usuario nunca tocó el tamaño desde el Inspector, sigue escalando con
  // "tamaño del título" como hoy).
  const titleSizeFallback = cqwType((p.accent ? 48 : 38) * (p.titleScale ?? 1))
  const titleTypo = typoStyle(p, TITLE_SLOT, { fontFamily: '"Schibsted Grotesk", sans-serif', fontWeight: 800, fontSize: titleSizeFallback, lineHeight: 1.05, letterSpacing: '-.02em' })
  // subFontFamily encadena a fontFamily del título antes de caer al genérico
  // — mismo orden que el código de siempre.
  const subFontFamilyFallback = p.fontFamily || '"Hanken Grotesk", sans-serif'
  const subTypo = typoStyle(p, SUB_SLOT, { fontFamily: subFontFamilyFallback, fontWeight: 500, fontSize: cqwType(17), lineHeight: 1.3, color: p.color })
  const eyebrowFontFamilyFallback = p.subFontFamily || '"Archivo", system-ui, sans-serif'
  const eyebrowTypo = typoStyle(p, EYEBROW_SLOT, { fontFamily: eyebrowFontFamilyFallback, fontWeight: 800, fontSize: cqwType(13), letterSpacing: '.32em', textTransform: 'uppercase', color: p.color })
  const ctaTypo = typoStyle(p, CTA_SLOT, { fontWeight: 700, fontSize: cqwType(15), color: '#fff' })

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: cross[p.align] }}>
      <div data-fit style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: cross[p.align], gap: cqw(10), maxWidth: '100%', textAlign: p.align }}>
        {p.glow && (
          <span aria-hidden style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: '124%', height: '186%', background: BACKDROP, filter: 'blur(9px)', zIndex: 0, pointerEvents: 'none' }} />
        )}
        {p.eyebrow && (
          <span style={{ ...z1, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            {p.eyebrowLine && <EyebrowLine accentColor={accentColor} />}
            <span style={{ ...eyebrowTypo, opacity: .94, textShadow: '0 1px 10px rgba(10,6,24,.7)' }}>{p.eyebrow}</span>
          </span>
        )}
        {p.accent && (
          <span style={{ ...z1, display: 'inline-block', background: '#EE5237', color: '#fff', fontWeight: 800, fontSize: cqw(13), letterSpacing: '.08em', padding: `${cqw(4)} ${cqw(11)}`, borderRadius: cqw(99) }}>OFERTA</span>
        )}
        <div className={p.glow ? 'rl-aura' : undefined} style={{ ...z1, ...titleTypo, textShadow: p.glow ? TITLE_GLOW : SHADOW, WebkitTextStroke: p.glow ? '0.6px rgba(12,6,28,.22)' : undefined, paintOrder: 'stroke fill', textWrap: 'balance', whiteSpace: 'pre-line' }}>{withAccentDot(p.title || 'Tu mensaje acá', p.accentDot, accentColor)}</div>
        {p.sub && <div style={{ ...z1, ...subTypo, opacity: .92, textShadow: SHADOW, textWrap: 'balance', whiteSpace: 'pre-line' }}>{p.sub}</div>}
        {p.cta && (
          <a href={p.ctaHref || '#'} style={{ ...z1, marginTop: cqw(4), display: 'inline-flex', alignItems: 'center', background: '#EE5237', padding: `${cqw(11)} ${cqw(22)}`, borderRadius: cqw(99), textDecoration: 'none', boxShadow: '0 8px 22px rgba(238,82,55,.4)', ...ctaTypo }}>{p.cta}</a>
        )}
      </div>
    </div>
  )
}
