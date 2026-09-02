import { useEffect } from 'react'

/**
 * useHeroExitZoom — el hero se agranda "hacia el espectador" mientras sale de
 * pantalla y entran los Destacados.
 *
 * Publica en el nodo una variable `--kt-hero-out` de 0 a 1 con el progreso del
 * scroll; el escalado lo hace el CSS (.kt-hero-exit-stage). Acá NO se toca
 * ninguna propiedad de layout: sólo se escribe un número.
 *
 * El progreso se mide contra el borde superior del hero, no contra el de los
 * Destacados, porque los Destacados sólo existen si la cuenta tiene productos
 * cargados (LandingPage los renderiza condicionalmente) y el efecto no puede
 * depender de una sección que puede no estar. Cuando el tope del hero toca el
 * tope de la pantalla el progreso es 0; cuando el hero terminó de salir por
 * arriba, es 1 — que es exactamente la ventana en la que los Destacados ocupan
 * la pantalla.
 *
 * Se escribe DIRECTO en el nodo (misma decisión que useFullBleed): esto corre en
 * cada cuadro de scroll y pasarlo por estado de React sería re-renderizar el
 * carrusel entero sesenta veces por segundo para mover un decimal.
 *
 * `prefers-reduced-motion`: no se engancha nada. Sin listener no hay variable,
 * y sin variable el CSS cae a su valor por defecto (0 → escala 1).
 *
 * `activo` NO es un lujo: el hero no existe en el primer render (la landing
 * espera la respuesta de la API y hasta entonces HeroSection devuelve null), así
 * que un efecto que dependiera sólo del ref correría UNA vez con `ref.current`
 * en null y no volvería a correr nunca — el ref es un objeto estable, no
 * dispara nada al llenarse. La bandera es lo que hace que el efecto se rearme
 * cuando el nodo por fin está en el DOM.
 */
export function useHeroExitZoom(ref, activo = true) {
  useEffect(() => {
    const el = ref.current
    if (!activo || !el) return undefined
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    let frame = 0
    let ultimo = -1

    const medir = () => {
      frame = 0
      const nodo = ref.current
      if (!nodo) return
      const r = nodo.getBoundingClientRect()
      if (r.height <= 0) return
      // r.top vale 0 con el hero apoyado en el tope y se vuelve negativo a
      // medida que sube. Dividido por su propio alto da el 0→1 buscado.
      const p = Math.min(1, Math.max(0, -r.top / r.height))
      // Dos decimales: mover la variable por milésimas repinta sin que se note.
      const redondeado = Math.round(p * 100) / 100
      if (redondeado === ultimo) return
      ultimo = redondeado
      nodo.style.setProperty('--kt-hero-out', String(redondeado))
    }

    const alScrollear = () => {
      if (frame) return
      frame = requestAnimationFrame(medir)
    }

    medir()
    window.addEventListener('scroll', alScrollear, { passive: true })
    window.addEventListener('resize', alScrollear, { passive: true })

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', alScrollear)
      window.removeEventListener('resize', alScrollear)
      el.style.removeProperty('--kt-hero-out')
    }
  }, [ref, activo])
}

export default useHeroExitZoom
