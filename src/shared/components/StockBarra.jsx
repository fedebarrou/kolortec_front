import { useLanguage } from '../i18n/LanguageProvider'
import { decidirStockBarra } from '../utils/stock-barra'

/**
 * StockBarra — «barra de 3 segmentos» + texto (mockup 2026-10-20-stock, opción B).
 * `nivel` = `stock_nivel` de la API pública. null → no dibuja nada.
 * Los segmentos son decorativos (aria-hidden): el estado lo dice el texto, que es lo que lee un lector de pantalla.
 * Los colores viven en variables de :root (index.css, `--kt-stock-*`).
 */
function StockBarra({ nivel, className = '' }) {
  const { t } = useLanguage()
  const d = decidirStockBarra(nivel)
  if (!d) return null
  return (
    <div className={`kt-stock kt-stock--${d.nivel} ${className}`.trim()} data-stock-nivel={d.nivel}>
      <span className="kt-stock-segs" aria-hidden="true">
        {d.segmentos.map((on, i) => (
          <i key={i} className={on ? 'is-on' : undefined} />
        ))}
      </span>
      <span className="kt-stock-tx">{t(d.clave, d.texto)}</span>
    </div>
  )
}

export default StockBarra
