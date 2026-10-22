import { Link } from 'react-router-dom'
import CatalogEmptyState from './CatalogEmptyState'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

// Destino táctil de 44px y el foco del teclado con el contorno amarillo del sitio (2px primary, offset 2px):
// lo comparten el botón «Reintentar» y el enlace «Volver».
const ACCION = 'inline-flex min-h-[44px] items-center px-3 font-bold hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'

/**
 * RetryButton — el ÚNICO «Reintentar» del catálogo (el estado de error, el aviso de una línea y la página de
 * catálogo caído usan este mismo botón).
 */
export function RetryButton({ onClick }) {
  const { t } = useLanguage()
  return (
    <button type="button" onClick={onClick} className={`${ACCION} text-primary`}>
      {t('catalog.retry', 'Reintentar')}
    </button>
  )
}

/**
 * BackLink — el enlace «Volver a …» del catálogo: la misma acción de 44px y el mismo foco que RetryButton.
 * Por defecto es secundario (tinta de estado, no amarillo: junto a un Reintentar lo principal es Reintentar).
 * `primary`: amarillo (`font-bold text-primary`, la forma publicada del sitio) para las páginas «no encontrada», donde es la única acción.
 */
export function BackLink({ to, children, primary = false }) {
  return (
    <Link to={to} className={`${ACCION} ${primary ? 'text-primary' : 'text-[color:var(--state-ink)] hover:text-primary'}`}>
      {children}
    </Link>
  )
}

/**
 * CatalogLoadError — el ÚNICO estado de «no pudimos cargar» del catálogo.
 *
 * ShopPage, LinePage y CategoryPage distinguen la API caída de «no hay nada» y dicen lo mismo:
 * «No pudimos cargar los productos» + Reintentar (el buscador del header, que no tiene lugar para esto,
 * dice «no se pudo buscar»). Sin esto una línea o una categoría con la API en 500 se leía «no existe» /
 * «Próximamente».
 *
 * `kind`: qué falló. 'products' (por defecto) o 'categories' (la lista de categorías): cada uno con su título y su
 * cuerpo, en UNA sola clave i18n por texto. `title`/`body` los pisan si hace falta. `level`: nivel del título
 * (ver CatalogEmptyState). `onRetry` vuelve a pedir (la página se resetea a «cargando»).
 */
function CatalogLoadError({ onRetry, kind = 'products', title, body, level, className = '' }) {
  const { t } = useLanguage()
  const categorias = kind === 'categories'
  return (
    <CatalogEmptyState
      className={className}
      level={level}
      title={title ?? (categorias
        ? t('catalog.categoriesUnavailableTitle', 'No pudimos cargar el catálogo')
        : t('catalog.productsUnavailableTitle', 'No pudimos cargar los productos'))}
      body={body ?? (categorias
        ? t('catalog.categoriesUnavailableBody', 'Hubo un problema al traer las categorías. Probá de nuevo en un momento.')
        : t('catalog.productsUnavailableBody', 'Hubo un problema al traer los productos. Probá de nuevo en un momento.'))}
      action={onRetry ? <RetryButton onClick={onRetry} /> : null}
    />
  )
}

/**
 * CatalogInlineNotice — el aviso de UNA línea con Reintentar, para cuando falla algo accesorio y el resto de la
 * página sigue sirviendo (en /products: los productos no se pudieron contar, pero las categorías se ven).
 * `role="status"`: se anuncia sin sacar el foco de donde está.
 */
export function CatalogInlineNotice({ children, onRetry, className = '' }) {
  return (
    <div
      role="status"
      data-testid="catalog-inline-notice"
      className={`flex flex-wrap items-center gap-x-1 border border-dashed border-[color:var(--line2)] bg-[color:var(--state-bg)] pl-4 pr-1 text-[0.85rem] text-[color:var(--state-ink)] ${className}`.trim()}
    >
      <span>{children}</span>
      {onRetry ? <RetryButton onClick={onRetry} /> : null}
    </div>
  )
}

export default CatalogLoadError
