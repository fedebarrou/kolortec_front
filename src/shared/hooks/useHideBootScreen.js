import { useEffect } from 'react'

/**
 * useHideBootScreen — bajar la pantalla de carga que vive en index.html.
 *
 * La pantalla NO es un componente de React a propósito: el Dockerfile del VPS
 * saltea el pre-render, así que `#root` sale vacío y sin ella la primera
 * pantalla real es un negro pelado. Tiene que existir antes de que React monte.
 *
 * Toda la lógica —mínimo visible, `scrollTo(0,0)`, fundido, red de seguridad de
 * 6s— vive del otro lado, en el script inline. Desde acá sólo se avisa "ya está".
 * Llamarlo de más es inofensivo: el segundo llamado no hace nada.
 */
export function hideBootScreen() {
  if (typeof window !== 'undefined' && typeof window.__ktHideBoot === 'function') {
    window.__ktHideBoot()
  }
}

/** @param {boolean} ready - mientras sea false la pantalla se mantiene. */
export function useHideBootScreen(ready = true) {
  useEffect(() => {
    if (ready) hideBootScreen()
  }, [ready])
}
