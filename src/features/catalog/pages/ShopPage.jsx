import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { defaultLandingContent } from '../../landing/data/landingData'
import { getShopProducts } from '../../../shared/services/contentService'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function ShopPage() {
  const { t } = useLanguage()
  const [products, setProducts] = useState(defaultLandingContent.products.items)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [selectedBadge, setSelectedBadge] = useState('all')
  const [searchParams] = useSearchParams()
  const query = (searchParams.get('q') ?? '').trim().toLowerCase()

  useEffect(() => {
    let mounted = true
    getShopProducts().then((response) => {
      if (mounted) {
        setProducts(response)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [query])

  const filteredProducts = useMemo(() => {
    const searched = !query
      ? products
      : products.filter((item) => {
          const haystack = [item.name, item.description, item.badge]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
          return haystack.includes(query)
        })

    if (selectedBadge === 'all') return searched
    return searched.filter((item) => (item.badge ?? '').toLowerCase() === selectedBadge)
  }, [products, query, selectedBadge])

  const availableBadges = useMemo(() => {
    const unique = Array.from(
      new Set(
        products
          .map((item) => (item.badge ?? '').trim().toLowerCase())
          .filter(Boolean),
      ),
    )
    return ['all', ...unique]
  }, [products])

  const activeQuery = searchParams.get('q')
  const catalogTitle = t('shop.title', 'Catalogo')
  const catalogSubtitle = t(
    'shop.subtitle',
    'Explora nuestra linea completa con fichas tecnicas, imagenes y acceso directo al detalle de cada producto.',
  )

  return (
    <section className="min-h-screen bg-[#050505] px-6 py-[42px] lg:px-40">
      <div className="mb-8 grid gap-3">
        <h1 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02] tracking-[0]">
          {catalogTitle}
          <span className="text-primary">.</span>
        </h1>
        <p className="m-0 max-w-[70ch] text-[#b7bbc4] leading-[1.55]">{catalogSubtitle}</p>

        <div className="mt-1 flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
          <div className="inline-flex items-center gap-2.5 text-[0.82rem] tracking-[0.03em] text-[#9ca3af]">
            {activeQuery ? <span>Busqueda: "{activeQuery}"</span> : <span>Todos los productos</span>}
            <strong className="text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-[#f4f4f5]">{filteredProducts.length} items</strong>
          </div>
          <button
            type="button"
            className={`inline-flex h-[38px] items-center gap-1.5 rounded-full border px-3.5 text-[0.76rem] font-extrabold uppercase tracking-[0.09em] transition ${isFiltersOpen ? 'border-[rgba(244,223,51,0.5)] bg-[rgba(244,223,51,0.08)] text-white' : 'border-[#2d3440] bg-[rgba(11,15,23,0.55)] text-[#e6e8ec] hover:border-[rgba(244,223,51,0.5)]'}`}
            onClick={() => setIsFiltersOpen((prev) => !prev)}
            aria-expanded={isFiltersOpen ? 'true' : 'false'}
            aria-controls="catalogFilterPanel"
          >
            <span className="material-symbols-outlined" aria-hidden="true">tune</span>
            Filtros
          </button>
        </div>

        {isFiltersOpen ? (
          <div id="catalogFilterPanel" className="flex flex-wrap gap-2 pt-1">
            {availableBadges.map((badge) => {
              const label = badge === 'all' ? 'Todos' : badge
              const isActive = selectedBadge === badge
              return (
                <button
                  key={badge}
                  type="button"
                  className={`h-[34px] rounded-full border px-3 text-[0.72rem] font-extrabold uppercase tracking-[0.08em] transition ${isActive ? 'border-[rgba(244,223,51,0.72)] bg-[rgba(244,223,51,0.13)] text-white' : 'border-[#303743] bg-transparent text-[#c8ced8] hover:border-[rgba(244,223,51,0.48)]'}`}
                  onClick={() => setSelectedBadge(badge)}
                >
                  {label}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-4">
        {filteredProducts.map((item) => (
          <ProductCard
            key={`${selectedBadge}-${query || 'all'}-${item.name}`}
            item={item}
            className="opacity-100"
          />
        ))}

        {filteredProducts.length === 0 ? (
          <article className="rounded-[8px] border border-[#2a2a2a] bg-[#111] p-4">
            <h3 className="title-font text-[1.35rem]">Sin resultados</h3>
            <p className="text-sm text-[#c4c8ce]">No encontramos productos para esa busqueda.</p>
          </article>
        ) : null}
      </div>
    </section>
  )
}

export default ShopPage
