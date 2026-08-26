import { useEffect, useMemo, useState } from 'react'
import { ScrollRenderer } from '../_hero-renderer/ScrollRenderer'
import { ensureHeroFonts } from '../_hero-renderer/heroFonts'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { autoTranslateText, getAutoTranslatedTextTarget } from '../../../shared/services/dynamicTranslationService'

/**
 * ScrolltellingSection — la historia de la landing, renderizada desde el diseño
 * que se configura en el admin de Modora (`active_scroll_id`), NO desde código.
 *
 * Reemplaza al ScrollytellingSection hardcodeado (4 pasos + 180 frames fijos):
 * ahora los pasos, textos, colores, timings y el fondo salen de la config que
 * llega por /public/hero-config. El renderer (`_hero-renderer/`) es byte-idéntico
 * al del admin y al de tiendita-store, así que lo que se ve en el editor es lo
 * que se ve acá.
 *
 * Sin diseño activo NO se renderiza nada (decisión explícita: el admin es la
 * única fuente de verdad; no hay fallback hardcodeado).
 */

const MOBILE_BELOW = 768

// Props traducibles por tipo de elemento del scene-schema. El resto (shape,
// media, iconos) no lleva texto.
const TRANSLATABLE = { text: 'content', button: 'label' }

/**
 * Recolecta los textos únicos del diseño. Único = un mismo string se traduce
 * una sola vez aunque se repita en varios pasos.
 */
function collectTexts(config) {
  const out = new Set()
  for (const slide of config?.slides || []) {
    for (const el of slide?.elements || []) {
      const key = TRANSLATABLE[el?.type]
      const value = key && el?.props?.[key]
      if (typeof value === 'string' && value.trim()) out.add(value)
    }
  }
  return [...out]
}

/**
 * Devuelve una copia del config con los textos reemplazados por su traducción.
 * Los que no estén en el mapa quedan como están (así el render nunca espera).
 */
function applyTranslations(config, dict) {
  if (!dict || dict.size === 0) return config
  return {
    ...config,
    slides: (config.slides || []).map((slide) => ({
      ...slide,
      elements: (slide.elements || []).map((el) => {
        const key = TRANSLATABLE[el?.type]
        const value = key && el?.props?.[key]
        const hit = typeof value === 'string' ? dict.get(value) : null
        return hit ? { ...el, props: { ...el.props, [key]: hit } } : el
      }),
    })),
  }
}

const EMPTY_DICT = new Map()

function ScrolltellingSection({ config, logoUrl = null, isFirst = false }) {
  const { lang } = useLanguage()
  const [bp, setBp] = useState('desktop')
  // Traducciones listas, etiquetadas con el idioma al que corresponden. Se
  // guarda el idioma junto al mapa (en vez de limpiarlo desde el efecto) para
  // no llamar a setState sincrónicamente dentro del efecto: si el visitante
  // cambia de idioma, el mapa viejo simplemente deja de matchear y se ignora
  // en el render hasta que llega el nuevo.
  const [tr, setTr] = useState(() => ({ lang: null, map: EMPTY_DICT }))
  const dict = tr.lang === lang ? tr.map : EMPTY_DICT

  useEffect(() => { ensureHeroFonts(config) }, [config])

  useEffect(() => {
    const update = () => setBp(window.innerWidth < MOBILE_BELOW ? 'mobile' : 'desktop')
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Traducción al vuelo: el diseño se edita en español en el admin, así que en
  // otros idiomas se traduce el texto en runtime (mismo servicio cacheado que
  // usa la ficha de producto). Se renderiza SIEMPRE el original primero y se
  // reemplaza cuando llega la traducción → sin pantalla vacía ni bloqueo si el
  // servicio de traducción tarda o falla.
  useEffect(() => {
    let cancelled = false
    const pending = []
    const next = new Map()

    for (const text of collectTexts(config)) {
      const { normalized, sourceLang } = getAutoTranslatedTextTarget(text, lang)
      if (!normalized || sourceLang === lang) continue
      pending.push(
        autoTranslateText({ text: normalized, from: sourceLang, to: lang })
          .then((translated) => { if (translated && translated !== text) next.set(text, translated) })
          // autoTranslateText ya se traga sus errores y devuelve el original;
          // este catch cubre cualquier rechazo inesperado del fetch.
          .catch(() => {}),
      )
    }

    // Sin nada que traducir (idioma origen == destino) igual se etiqueta el
    // idioma: así el render deja de usar el mapa del idioma anterior.
    Promise.all(pending).then(() => { if (!cancelled) setTr({ lang, map: next }) })
    return () => { cancelled = true }
  }, [config, lang])

  const translated = useMemo(() => applyTranslations(config, dict), [config, dict])

  if (!config || !Array.isArray(config.slides) || config.slides.length === 0) return null

  return (
    <section id="scrolltelling" aria-label="Historia">
      <ScrollRenderer config={translated} breakpoint={bp} logoUrl={logoUrl} isFirst={isFirst} />
    </section>
  )
}

export default ScrolltellingSection
