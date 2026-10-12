// Escalonado (stagger) de los hijos de stats y quicklinks. COPIA SINCRONIZADA — idéntico en el `_renderer/` del admin y en el store
// (components/hero-renderer/elements/). Sin imports: se puede copiar byte-idéntico.
//
// `plan` lo arma ElementView ({nombre, ms, curva, retardo, paso}) con valores que YA salieron de sus tablas cerradas (nunca del
// dato guardado). Cada hijo repite la entrada del elemento con `retardo + i × paso` ms: el primero entra primero.
export function estiloEscalonado(plan, i) {
  if (!plan) return undefined
  return { animation: `${plan.nombre} ${plan.ms}ms ${plan.curva} ${plan.retardo + i * plan.paso}ms both` }
}
