/**
 * CatalogEmptyState — el ÚNICO estado vacío del catálogo.
 *
 * Había tres, uno por página: distinto radio (0 / 8px / 10px), distinto borde
 * (sólido en uno, punteado en los otros), distinto padding, distinta alineación,
 * y el de la búsqueda era el único título del catálogo SIN el punto amarillo de
 * la marca. Son el mismo objeto —"acá no hay nada"— dibujado tres veces.
 *
 * Rectangular a propósito: en este sitio nada del catálogo tiene esquinas
 * redondeadas (cards, etiquetas, chips y badges son todos rectos). El borde
 * punteado es lo que distingue "vacío" de "contenido".
 *
 * `action` recibe un nodo (normalmente un <Link>) en vez de un href para que cada
 * página decida a dónde vuelve sin que este componente conozca las rutas.
 */
function CatalogEmptyState({ title, body, action, className = '' }) {
  return (
    <div
      className={`border border-dashed border-[#2a2a2a] bg-[#0f0f10] px-6 py-12 text-center ${className}`.trim()}
    >
      <h3 className="title-font m-0 text-[1.4rem] text-white">
        {title}
        <span className="text-primary">.</span>
      </h3>
      {body ? (
        <p className="mx-auto mt-2 max-w-[48ch] text-[0.9rem] leading-[1.55] text-[#aeb5bf]">{body}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export default CatalogEmptyState
