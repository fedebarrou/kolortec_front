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
 * `level` es el nivel del título (h2 por defecto: el estado vive dentro de una página que ya tiene su h1, así no hay saltos de nivel). Una página entera que
 * sólo muestra este estado (catálogo caído) pasa `level={1}` para no quedarse sin h1; el aspecto no cambia.
 *
 * Superficie, borde y tinta salen de tokens (--state-bg, --line2, --state-ink): los comparte CatalogInlineNotice.
 *
 * `action` recibe un nodo (normalmente un <Link>) en vez de un href para que cada
 * página decida a dónde vuelve sin que este componente conozca las rutas.
 */
function CatalogEmptyState({ title, body, action, level = 2, className = '' }) {
  const Heading = `h${level}`
  return (
    <div
      className={`border border-dashed border-[color:var(--line2)] bg-[color:var(--state-bg)] px-6 py-12 text-center ${className}`.trim()}
    >
      <Heading className="title-font m-0 text-[1.4rem] text-white">
        {title}
        <span className="text-primary">.</span>
      </Heading>
      {body ? (
        <p className="mx-auto mt-2 max-w-[48ch] text-[0.9rem] leading-[1.55] text-[color:var(--state-ink)]">{body}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export default CatalogEmptyState
