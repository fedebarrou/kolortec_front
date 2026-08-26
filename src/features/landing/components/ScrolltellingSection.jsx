import { useEffect, useState } from 'react'
import { ScrollRenderer } from '../_hero-renderer/ScrollRenderer'
// CSS del renderer (hc-kt-block, scrims, chrome del snap, keyframes hc-*): es
// la mitad CSS del renderer byte-idéntico, que kolortec no tenía. Sin esto el
// widget `message` (preset kolortec) renderiza sin posicionar y los scrims no
// pintan. Va FUERA de @layer a propósito — ver el header de hero-anim.css.
import '../_hero-renderer/hero-anim.css'
import { ensureHeroFonts } from '../_hero-renderer/heroFonts'
import { useHeroTranslation } from '../../../shared/services/useHeroTranslation'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

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

function ScrolltellingSection({ config, logoUrl = null, isFirst = false }) {
  const { t } = useLanguage()
  const [bp, setBp] = useState('desktop')
  // Traducción al vuelo de TODOS los textos del diseño. La lógica vive en
  // useHeroTranslation/heroTranslate para que el carrusel del Encabezado use
  // exactamente el mismo camino — antes estaba acá y cubría 2 widgets de 12.
  const translated = useHeroTranslation(config)

  useEffect(() => { ensureHeroFonts(config) }, [config])

  useEffect(() => {
    const update = () => setBp(window.innerWidth < MOBILE_BELOW ? 'mobile' : 'desktop')
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])


  if (!config || !Array.isArray(config.slides) || config.slides.length === 0) return null

  return (
    <section id="scrolltelling" aria-label={t('a11y.story', 'Historia')}>
      <ScrollRenderer config={translated} breakpoint={bp} logoUrl={logoUrl} isFirst={isFirst} />
    </section>
  )
}

export default ScrolltellingSection
