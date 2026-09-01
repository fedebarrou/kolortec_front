/**
 * irASeccion(id) — lleva a una sección de la home, incluso con el scrolltelling
 * todavía al mando.
 *
 * El bug que resuelve: tocando SOPORTE desde arriba de todo no pasaba NADA.
 * Mientras la historia tiene el control (body.scrolly-takeover /
 * .scrolly-nav-hidden), su motor de scroll intercepta el recorrido: un
 * `scrollIntoView` suave pasa por ADENTRO de la historia y ella lo vuelve a fijar
 * en el paso donde estaba, así que el visitante quedaba clavado en el
 * scrolltelling en vez de llegar a la sección amarilla.
 *
 * Por eso, si la historia está al mando: primero se la libera —las mismas clases
 * que el renderer quita al salir del recorrido; volver a subir se las hace poner
 * de nuevo— y recién ahí se salta, INSTANT y no suave, para que no haya recorrido
 * que interceptar.
 *
 * El `scroll` sintético del final no es de adorno: el navbar de la home decide si
 * mostrarse dentro de un rAF colgado del evento scroll, y sin empujarlo el header
 * podía quedar oculto después del salto — llegabas a la sección sin barra.
 *
 * Fuera de la historia se comporta como siempre: scroll suave.
 */
export function irASeccion(id) {
  if (typeof document === 'undefined') return
  const target = document.getElementById(id)
  if (!target) return

  const body = document.body
  const historiaAlMando =
    body.classList.contains('scrolly-takeover') || body.classList.contains('scrolly-nav-hidden')

  if (historiaAlMando) {
    body.classList.remove('scrolly-takeover', 'scrolly-nav-hidden')
    target.scrollIntoView({ behavior: 'instant', block: 'start' })
    window.dispatchEvent(new Event('scroll'))
    return
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default irASeccion
