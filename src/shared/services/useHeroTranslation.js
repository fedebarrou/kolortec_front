import { useMemo } from 'react'
import { applyHeroTranslations, collectHeroTexts } from './heroTranslate'
import { useAutoTranslatedDict } from './useAutoTranslatedDict'

/**
 * useHeroTranslation — devuelve el config de un diseño de Hero Labs con TODOS
 * sus textos traducidos al idioma activo. Sirve igual para el carrusel del
 * Encabezado y para el scrolltelling: los dos usan este camino.
 *
 * Es una capa fina sobre useAutoTranslatedDict: lo único propio del hero es
 * saber QUÉ props de cada widget llevan texto visible (heroTranslate.js).
 */
export function useHeroTranslation(config) {
  const texts = useMemo(() => collectHeroTexts(config), [config])
  const dict = useAutoTranslatedDict(texts)
  return useMemo(() => applyHeroTranslations(config, dict), [config, dict])
}
