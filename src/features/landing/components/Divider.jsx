/**
 * Divider — hairline de separación entre secciones.
 *
 * `space` existe por un caso puntual: el hero es full-bleed y termina JUSTO en
 * el borde del viewport, así que la línea le queda pegada al filo de la foto y
 * las dos secciones se leen como una sola. Entre dos secciones que ya traen su
 * propio padding eso no pasa. Por eso el aire es opcional y no el default:
 * hoy sólo la costura hero → Instagram lo necesita.
 */
function Divider({ space = false }) {
  return (
    <div className={space ? 'px-6 lg:px-40 py-[clamp(36px,5.5vw,72px)]' : 'px-6 lg:px-40'}>
      <div className="h-px bg-gradient-to-r from-transparent via-[rgba(244,223,51,0.3)] to-transparent" />
    </div>
  )
}

export default Divider
