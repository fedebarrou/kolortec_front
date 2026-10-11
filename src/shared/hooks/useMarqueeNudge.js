import { useCallback, useRef } from 'react'

/**
 * useMarqueeNudge — flechas para un carrusel .kt-marquee que gira solo.
 *
 * La tira es una animación CSS (`kt-marquee-scroll`), no un scroll: no hay
 * `scrollLeft` que mover. Lo que se mueve es el RELOJ de esa animación
 * (Web Animations API, `currentTime`), así el loop infinito y la costura del
 * -50% siguen intactos y el giro automático sigue desde donde quedó.
 *
 * Un toque = una card (ancho del item + gap), en ~420ms con ease-out para que
 * se lea como un deslizamiento y no como un salto.
 *
 * Con `prefers-reduced-motion` la animación no existe (`animation: none`) y el
 * contenedor pasa a tener scroll horizontal (index.css): ahí la flecha mueve el
 * scroll de a una card, sin deslizamiento animado.
 *
 * @param {import('react').RefObject<HTMLElement>} containerRef el .kt-marquee
 * @returns {(dir: 1 | -1) => void}
 */
export function useMarqueeNudge(containerRef) {
  const rafRef = useRef(0)
  // Lo que el deslizamiento en curso todavía no aplicó: un segundo clic antes
  // de que termine el primero lo suma, en vez de perderlo (joan REG-003).
  const restanteRef = useRef(0)

  return useCallback((dir) => {
    const track = containerRef.current?.querySelector('.kt-marquee-track')
    const anim = track?.getAnimations?.()[0]
    const item = track?.firstElementChild
    if (!track || !item) return
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0

    if (!anim) {
      // Reducir movimiento: la tira está quieta y se scrollea. Salto directo,
      // sin animación, que es justamente lo que pidió el usuario al sistema.
      containerRef.current.scrollBy({ left: (item.getBoundingClientRect().width + gap) * dir, behavior: 'auto' })
      return
    }

    const duracion = Number(anim.effect?.getComputedTiming?.().duration) || 0
    if (!duracion) return
    // Recorrido de una vuelta del keyframe: la mitad del track más medio gap
    // (translateX(calc(-50% - 0.25rem))).
    const recorrido = track.scrollWidth / 2 + gap / 2
    if (recorrido <= 0) return
    const paso = ((item.getBoundingClientRect().width + gap) / recorrido) * duracion * dir + restanteRef.current

    restanteRef.current = paso
    cancelAnimationFrame(rafRef.current)
    const inicio = performance.now()
    const DUR = 420
    let aplicado = 0
    const tick = (ahora) => {
      const t = Math.min(1, (ahora - inicio) / DUR)
      const objetivo = paso * (1 - (1 - t) ** 3)
      // Se suma la DIFERENCIA de cada cuadro, no un valor absoluto: la tira
      // puede seguir girando sola durante el deslizamiento.
      const actual = Number(anim.currentTime) || 0
      // Vuelta completa en vez de un tiempo negativo: antes del 0 la animación
      // queda fuera de su intervalo y la tira se planta en el origen.
      anim.currentTime = (((actual + objetivo - aplicado) % duracion) + duracion) % duracion
      aplicado = objetivo
      restanteRef.current = paso - aplicado
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [containerRef])
}
