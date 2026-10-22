// Escalonado (stagger) de los hijos de stats y quicklinks. COPIA SINCRONIZADA — idéntico en el `_renderer/` del admin, en el store
// (components/hero-renderer/elements/) y en kolortec. Sólo importa ./revelar (otra copia sincronizada).
//
// `plan` lo arma ElementView con valores que YA salieron de sus tablas cerradas (nunca del dato guardado). Dos formas:
//   · carrusel: {nombre, ms, curva, retardo, paso} — cada hijo repite la entrada del elemento con `retardo + i × paso` ms.
//   · scroll continuo: {revelar: {tipo, r, curva, ms, paso}} — la entrada se escrubea; la ventana se reparte para que el último hijo
//     termine justo cuando termina la del elemento (`ms + (n-1) × paso`), y el primero entra primero.
import { estiloDeReveal } from './revelar'

export function estiloEscalonado(plan, i, n = 1) {
  if (!plan) return undefined
  if (plan.revelar) {
    const { tipo, r, curva, ms, paso } = plan.revelar
    const dur = Math.max(1, ms)
    const t = Math.max(0, Math.min(1, r)) * (dur + Math.max(0, n - 1) * paso)
    const e = estiloDeReveal(tipo, (t - i * paso) / dur, curva)
    return { opacity: e.opacidad, transform: e.transform, filter: e.filter, clipPath: e.clipPath }
  }
  return { animation: `${plan.nombre} ${plan.ms}ms ${plan.curva} ${plan.retardo + i * plan.paso}ms both` }
}
