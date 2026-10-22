import { useEffect } from 'react'
import { customFontFaceCss } from '../utils/customFonts'

/**
 * Inyecta los @font-face de las fuentes propias de la cuenta en un <style id="tt-custom-fonts"> (el mismo id que usa la tienda).
 * Sin fuentes propias, no deja nada.
 */
export function useCustomFonts(fonts) {
  useEffect(() => {
    const css = customFontFaceCss(fonts)
    let el = document.getElementById('tt-custom-fonts')
    if (!css) {
      if (el) el.remove()
      return
    }
    if (!el) {
      el = document.createElement('style')
      el.id = 'tt-custom-fonts'
      document.head.appendChild(el)
    }
    el.textContent = css
  }, [fonts])
}
