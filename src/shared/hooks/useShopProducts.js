import { useCallback, useEffect, useState } from 'react'
import { loadShopProducts } from '../services/contentService'

/**
 * Los productos de la cuenta + si se pudieron cargar + cómo volver a pedirlos.
 *
 * Existe para que LinePage y CategoryPage distingan lo mismo que ShopPage: `products === null` es «cargando»,
 * `available === false` es «la API falló» (no «la cuenta no tiene productos») y `retry()` vuelve a pedir DE
 * VERDAD (loadShopProducts no deja nada cacheado cuando falla). Con `getShopProducts()` un 500 y una cuenta
 * vacía daban lo mismo: [].
 *
 * `intento` sube en cada reintento: otras cargas de la misma página (categorías) lo usan como dependencia
 * para volver a pedirse juntas.
 */
export function useShopProducts() {
  const [estado, setEstado] = useState({ products: null, available: true })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let mounted = true
    loadShopProducts().then(({ list, available }) => {
      if (mounted) setEstado({ products: list, available })
    })
    return () => { mounted = false }
  }, [intento])

  const retry = useCallback(() => {
    setEstado({ products: null, available: true })
    setIntento((n) => n + 1)
  }, [])

  return { products: estado.products, available: estado.available, retry, intento }
}
