import { useLanguage } from '../../../shared/i18n/LanguageProvider'

/**
 * GridSkeleton — la ÚNICA «grilla cargando» del catálogo.
 *
 * Había tres: un esqueleto en LinePage, otro en CategoryPage y un texto («Cargando categorías…») en ShopPage.
 * Dibujan lo mismo —«acá van a venir cosas»— y cada una reservaba un alto distinto, así que al llegar los datos
 * la grilla saltaba (en la línea, 223px a 1440 y 182px a 390).
 *
 *  - `header`: dibuja también el ENCABEZADO fantasma de la página, con las MISMAS clases (mismos paddings,
 *    márgenes y tipografía) que el encabezado real, para que la grilla caiga en el mismo lugar cuando llegan los
 *    datos y no haya salto:
 *      'line'     breadcrumb + eyebrow + título de LinePage, y el renglón del conteo.
 *      'category' hero de CategoryPage y el renglón del conteo.
 *    Sin `header` sólo se dibuja la grilla (la página ya tiene su encabezado real).
 *  - `ratio`: 'product' (4/5, las cards de producto) o 'square' (las cards de categoría).
 *  - `label`: texto para lectores de pantalla (no se ve): lo único que antes decían los «Cargando…» visibles.
 *
 * Mismas celdas y misma grilla que el resto del catálogo (ProductCard / CategoryCard).
 */
export const CATALOG_GRID = 'grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4'

const CELDA = 'w-full animate-pulse bg-[color:var(--skeleton)]'

/** Un tramo de texto fantasma: ocupa el alto de una línea de la tipografía que hereda, sin dibujar letras. */
function Ghost({ className = '', children = ' ' }) {
  return (
    <span aria-hidden="true" className={`inline-block animate-pulse select-none overflow-hidden whitespace-nowrap bg-[color:var(--skeleton)] align-top text-transparent ${className}`.trim()}>
      {children}
    </span>
  )
}

/** El renglón del conteo («12 items») mientras no se sabe cuántos hay: reserva su alto sin decir «0 items». */
export function CountGhost() {
  return (
    <strong className="text-[0.8rem] font-extrabold uppercase tracking-[0.08em]">
      <Ghost className="w-16">00 items</Ghost>
    </strong>
  )
}

function LineHeaderGhost() {
  return (
    <div className="px-6 pt-[clamp(56px,8vw,96px)] lg:px-40" aria-hidden="true">
      <div className="mb-3 flex items-center gap-2 text-[0.75rem] font-extrabold uppercase tracking-[0.12em]">
        <Ghost className="w-24">Productos</Ghost>
      </div>
      <div className="mb-1 flex items-center gap-2">
        <span className="block h-[2px] w-8 bg-[color:var(--skeleton)]" />
        <Ghost className="w-12 text-[0.75rem] font-black tracking-[0.22em]">Línea</Ghost>
      </div>
      <div className="title-font m-0 text-[clamp(2.4rem,6vw,4.8rem)] leading-[1.02]">
        <Ghost className="w-[min(70%,12ch)]">.</Ghost>
      </div>
    </div>
  )
}

function CategoryHeroGhost() {
  return (
    <div className="relative h-[clamp(240px,52vw,360px)] w-full overflow-hidden bg-deep-black lg:h-[520px]" aria-hidden="true">
      <div className="relative z-[1] flex h-full flex-col justify-end px-6 pb-8 lg:px-40">
        <div className="mb-3 flex items-center gap-2 text-[0.75rem] font-extrabold uppercase tracking-[0.12em]">
          <Ghost className="w-24">Productos</Ghost>
        </div>
        <div className="title-font m-0 text-[clamp(2.4rem,6vw,4.8rem)] leading-[1.02]">
          <Ghost className="w-[min(70%,12ch)]">.</Ghost>
        </div>
      </div>
    </div>
  )
}

function Celdas({ ratio, className, label }) {
  return (
    <div className={`${CATALOG_GRID} ${className}`.trim()} aria-busy="true" role="status">
      {label ? <span className="sr-only">{label}</span> : null}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} aria-hidden="true" className={`${CELDA} ${ratio === 'square' ? 'aspect-square' : 'aspect-[4/5]'}`} />
      ))}
    </div>
  )
}

function GridSkeleton({ header, ratio = 'product', label, className = '' }) {
  const { t } = useLanguage()
  const texto = label ?? t('catalog.loadingProducts', 'Cargando productos…')
  const celdas = <Celdas ratio={ratio} className={header ? 'kt-reveal' : className} label={texto} />

  if (header === 'line') {
    return (
      <>
        <LineHeaderGhost />
        <div className="px-6 py-[42px] lg:px-40">
          <div className="mb-6 inline-flex items-center gap-2.5 text-[0.82rem]"><CountGhost /></div>
          {celdas}
        </div>
      </>
    )
  }
  if (header === 'category') {
    return (
      <>
        <CategoryHeroGhost />
        <div className="px-6 py-[42px] lg:px-40">
          <div className="mb-6 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
            <div className="inline-flex items-center gap-2.5 text-[0.82rem]"><CountGhost /></div>
          </div>
          {celdas}
        </div>
      </>
    )
  }
  return celdas
}

/**
 * La barra de filtros mientras cargan los datos: sus ejes salen de los productos y las categorías, así que
 * hasta que llegan no se sabe cuáles hay, y dibujarla recién entonces empujaba la grilla hacia abajo. Misma
 * estructura y alto que `CatalogFilterBar` (rótulo + desplegable de 48px, `mb-10`), con DOS ejes (Categoría y
 * Etiqueta: lo que ofrece una cuenta con datos). Va deshabilitada: no es un control, no entra en el orden de foco.
 */
export function FilterBarGhost() {
  return (
    <div className="mb-10" aria-hidden="true">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
        {[0, 1].map((i) => (
          <div key={i}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <Ghost className="w-20 text-[0.75rem] font-extrabold tracking-[0.16em]">Categoría</Ghost>
            </div>
            <div className="h-12 w-full animate-pulse border border-[color:var(--line-control)] bg-[color:var(--control-bg)]" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default GridSkeleton
