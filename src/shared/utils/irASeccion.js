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
  if (typeof document === 'undefined') return false
  const target = document.getElementById(id)
  if (!target) return false

  const body = document.body
  const historiaAlMando =
    body.classList.contains('scrolly-takeover') || body.classList.contains('scrolly-nav-hidden')

  if (historiaAlMando) {
    body.classList.remove('scrolly-takeover', 'scrolly-nav-hidden')
    target.scrollIntoView({ behavior: 'instant', block: 'start' })
    window.dispatchEvent(new Event('scroll'))
    return true
  }

  target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return true
}

/**
 * Igual que irASeccion, pero INSISTE hasta que la sección queda realmente a la
 * vista, no hasta que existe.
 *
 * El bug que resuelve: tocando SOPORTE desde otra página (/products, la ficha de
 * un producto) la URL pasaba a `/#shop` y el visitante quedaba arriba de todo,
 * con el scrolltelling al mando — o sea, obligado a pasar por la historia.
 *
 * La causa NO era irASeccion: llamada con la home ya montada funciona. Y tampoco
 * era que la sección no existiera. Era que su POSICIÓN todavía no era la final:
 * el efecto del hash corre apenas cambia la ruta, cuando el scrolltelling —que
 * mide casi 5000px y va ARRIBA de todo— aún no está maquetado. En ese momento
 * `#shop` está casi en el tope, el salto no mueve nada, y recién después el
 * documento crece y la sección se va a ~7900px. Para entonces el salto ya pasó.
 *
 * Encima, mientras la historia manda, su `updateTakeover` compensa el scroll al
 * montar y lo vuelve a llevar a cero. Un solo intento no le gana a eso.
 *
 * Por eso se reintenta hasta que la sección está arriba de la pantalla y se
 * queda quieta unos ciclos. Converge solo: apenas el scroll pasa el final del
 * recorrido, la historia suelta el control y deja de interferir.
 *
 * Se sondea en vez de usar observers: hay que ver la POSICIÓN, no un cambio en
 * el árbol, y los timers corren en contextos donde los observers no entregan.
 *
 * Devuelve una función de limpieza: si el visitante se va antes, el sondeo se
 * corta y no lo arrastra de vuelta.
 */
export function irASeccionCuandoAparezca(id, { esperaMaxMs = 6000, cadaMs = 100 } = {}) {
  if (typeof document === 'undefined') return () => {}

  const limite = Date.now() + esperaMaxMs
  // Tolerancia amplia: con el navbar fijo el navegador aterriza unas decenas de
  // píxeles corrido, y eso no es "no llegó".
  const CERCA_PX = 120
  let quieto = 0

  const intentar = () => {
    const target = document.getElementById(id)
    if (target) {
      if (Math.abs(target.getBoundingClientRect().top) <= CERCA_PX) {
        quieto += 1
        if (quieto >= 3) return true // tres ciclos seguidos en su lugar: llegó
      } else {
        quieto = 0
        irASeccion(id)
      }
    }
    return Date.now() > limite
  }

  const timer = setInterval(() => { if (intentar()) clearInterval(timer) }, cadaMs)
  if (intentar()) clearInterval(timer)

  return () => clearInterval(timer)
}

export default irASeccion
