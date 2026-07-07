import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { trackEvent } from '../../../shared/services/tracking'
import { getProductDetail } from '../../../shared/services/contentService'
import ImageLightbox from '../../../shared/components/ImageLightbox'
import LoginRequiredDialog from '../../../shared/components/LoginRequiredDialog'
import ProductCard from '../../catalog/components/ProductCard'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import Seo from '../../../shared/seo/Seo'
import { SITE } from '../../../shared/seo/Seo'
import { productJsonLd, breadcrumbJsonLd } from '../../../shared/seo/jsonLd'
import { autoTranslateText, getAutoTranslatedTextTarget } from '../../../shared/services/dynamicTranslationService'

function formatPrice(value, moneda) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return 'Consultar precio'
  return `${moneda || 'USD'} ${n.toLocaleString('es-AR')}`
}

function ProductDetailPage() {
  const { t, lang } = useLanguage()
  const { slug } = useParams()
  // Data-driven: cargamos el producto REAL desde la API de tiendita por su id/slug.
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let mounted = true
    setLoading(true)
    getProductDetail(slug).then((p) => { if (mounted) { setProduct(p); setLoading(false) } })
    return () => { mounted = false }
  }, [slug])
  const detailBodyRef = useRef(null)
  const heroImageRef = useRef(null)
  const lensRef = useRef(null)

  // Lupa cuadrada: magnifica solo la zona de la imagen bajo el cursor.
  const LENS_SIZE = 240
  const LENS_ZOOM = 2.5

  const handleHeroMouseMove = (event) => {
    const fig = heroImageRef.current
    const lens = lensRef.current
    if (!fig || !lens) return
    const img = fig.querySelector('img')
    if (!img) return
    const rect = fig.getBoundingClientRect()
    const half = LENS_SIZE / 2
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const left = Math.max(0, Math.min(rect.width - LENS_SIZE, x - half))
    const top = Math.max(0, Math.min(rect.height - LENS_SIZE, y - half))
    lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`
    lens.style.backgroundSize = `${rect.width * LENS_ZOOM}px ${rect.height * LENS_ZOOM}px`
    lens.style.backgroundPosition = `${-left * LENS_ZOOM}px ${-top * LENS_ZOOM}px`
    lens.style.left = `${left}px`
    lens.style.top = `${top}px`
    lens.style.opacity = '1'
  }

  const handleHeroMouseLeave = () => {
    const lens = lensRef.current
    if (lens) lens.style.opacity = '0'
  }

  const relatedMarqueeCallbackRef = (node) => {
    if (!node) return
    if (node.__ktInfiniteCleanup) return
    const onScroll = () => {
      const half = node.scrollWidth / 2
      if (half <= 0) return
      if (node.scrollLeft >= half) {
        node.scrollLeft -= half
      } else if (node.scrollLeft <= 0) {
        node.scrollLeft += half
      }
    }
    node.addEventListener('scroll', onScroll, { passive: true })
    node.__ktInfiniteCleanup = () => node.removeEventListener('scroll', onScroll)
  }
  const [selectedVariantId] = useState(product?.variants?.[0]?.id ?? '')
  const [activeTab, setActiveTab] = useState('about')
  const [isVideoOpen, setIsVideoOpen] = useState(true)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(true)
  const [isAccessoriesOpen, setIsAccessoriesOpen] = useState(true)
  const [activeDownloadPanel, setActiveDownloadPanel] = useState('manuals')
  const [galleryLightboxIndex, setGalleryLightboxIndex] = useState(-1)
  const [previewActivePage, setPreviewActivePage] = useState(0)
  const [downloadIntent, setDownloadIntent] = useState(null)
  const [translatedShortDescription, setTranslatedShortDescription] = useState(product?.shortDescription ?? '')
  const tabs = useMemo(() => {
    const list = [{ id: 'about', label: t('productDetail.tabs.about', 'About') }]
    if ((product?.gallery?.length ?? 0) > 0) list.push({ id: 'gallery', label: t('productDetail.tabs.gallery', 'Fotos') })
    if ((product?.videos?.length ?? 0) > 0) list.push({ id: 'video', label: t('productDetail.tabs.video', 'Video') })
    if ((product?.downloads?.length ?? 0) > 0) list.push({ id: 'downloads', label: t('productDetail.tabs.downloads', 'Descargas') })
    if ((product?.accessories?.length ?? 0) > 0) list.push({ id: 'accessories', label: t('productDetail.tabs.accessories', 'Accesorios') })
    if ((product?.technicalSpecs?.length ?? 0) > 0) list.push({ id: 'technical-specs', label: t('productDetail.tabs.technicalSpecs', 'Especificaciones') })
    return list
  }, [t, product])

  const getStickyOffset = () => {
    const mainHeader = window.innerWidth <= 640 ? 74 : 88
    const detailHeader = window.innerWidth <= 640 ? 40 : 44
    return mainHeader + detailHeader + 8
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [slug])

  // Track product_view — fire-and-forget, never blocks render.
  useEffect(() => {
    if (!slug) return
    trackEvent({
      event_type: 'product_view',
      path: `/producto/${slug}`,
      product_id: slug,
    })
  }, [slug])

  useEffect(() => {
    const sourceDescription = product?.shortDescription ?? ''
    if (!sourceDescription) {
      setTranslatedShortDescription('')
      return undefined
    }
    const { normalized, sourceLang } = getAutoTranslatedTextTarget(sourceDescription, lang)
    if (!normalized) {
      setTranslatedShortDescription('')
      return undefined
    }

    if (sourceLang === lang) {
      setTranslatedShortDescription(normalized)
      return undefined
    }

    let cancelled = false
    setTranslatedShortDescription(normalized)

    autoTranslateText({ text: normalized, from: sourceLang, to: lang }).then((translated) => {
      if (!cancelled) {
        setTranslatedShortDescription(translated || normalized)
      }
    })

    return () => {
      cancelled = true
    }
  }, [lang, product?.shortDescription, slug])

  useEffect(() => {
    const onScroll = () => {
      const offset = getStickyOffset()
      let current = 'about'

      tabs.forEach((tab) => {
        const section = document.getElementById(tab.id)
        if (section && section.getBoundingClientRect().top - offset <= 0) {
          current = tab.id
        }
      })

      setActiveTab(current)
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [tabs])

  useEffect(() => {
    const scope = detailBodyRef.current
    if (!scope) return undefined

    const animatedNodes = Array.from(
      scope.querySelectorAll('.kt-detail-anim, .kt-graphene-separator'),
    )

    if (animatedNodes.length === 0) return undefined

    animatedNodes.forEach((node, index) => {
      const delay = Math.min(index * 55, 280)
      node.style.setProperty('--reveal-delay', `${delay}ms`)
    })

    const revealNode = (node) => {
      if (node.classList.contains('is-visible')) return
      node.classList.add('is-visible')
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          revealNode(entry.target)
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -14% 0px' },
    )

    animatedNodes.forEach((node) => observer.observe(node))

    return () => {
      observer.disconnect()
    }
  }, [product])

  const selectedVariant = useMemo(
    () => product?.variants?.find((variant) => variant.id === selectedVariantId) ?? product?.variants?.[0],
    [product, selectedVariantId],
  )

  const softwareDownloads = useMemo(
    () => (product?.downloads ?? []).filter((item) => /software|firmware/i.test(item.label || '')),
    [product],
  )
  const manualDownloads = useMemo(
    () => (product?.downloads ?? []).filter((item) => !/software|firmware/i.test(item.label || '')),
    [product],
  )

  const technicalSpecColumns = useMemo(() => {
    const specs = product?.technicalSpecs ?? []
    const mid = Math.ceil(specs.length / 2)
    return [specs.slice(0, mid), specs.slice(mid)]
  }, [product])

  // Marquee de accesorios: repetimos la lista hasta llenar el ancho (al menos
  // ~8 items por mitad) y duplicamos en dos mitades identicas, asi el loop a
  // -50% es continuo y nunca queda espacio en blanco entre el ultimo y el primero.
  const marqueeAccessories = useMemo(() => {
    const base = product?.accessories ?? []
    if (base.length === 0) return []
    const repeats = Math.max(1, Math.ceil(8 / base.length))
    const half = Array.from({ length: repeats }, () => base).flat()
    return [...half, ...half]
  }, [product?.accessories])

  const galleryImages = useMemo(() => {
    const baseGallery = (product?.gallery ?? []).filter(Boolean)
    const primaryCandidate = selectedVariant?.image || product?.heroImage

    if (primaryCandidate && !baseGallery.includes(primaryCandidate)) {
      return [primaryCandidate, ...baseGallery]
    }

    return baseGallery.length > 0 ? baseGallery : [primaryCandidate].filter(Boolean)
  }, [product, selectedVariant])

  const previewImages = useMemo(() => galleryImages.slice(1), [galleryImages])

  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const previewStripRef = useRef(null)

  useEffect(() => {
    setActiveImageIndex(0)
    setPreviewActivePage(0)
    setCurrentVideoIndex(0)
  }, [slug, galleryImages.length])

  const scrollToPage = (ref, pageIndex) => {
    const viewport = ref.current
    if (!viewport) return
    viewport.scrollTo({
      left: viewport.clientWidth * pageIndex,
      behavior: 'smooth',
    })
  }

  const onPreviewScroll = () => {
    const viewport = previewStripRef.current
    if (!viewport) return
    const current = Math.round(viewport.scrollLeft / Math.max(viewport.clientWidth, 1))
    setPreviewActivePage(Math.max(0, Math.min(current, previewImages.length - 1)))
  }

  const goToSection = (id) => {
    const node = document.getElementById(id)
    if (node) {
      const top = node.getBoundingClientRect().top + window.scrollY - getStickyOffset()
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  if (loading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#050505] px-6">
        <p className="animate-pulse text-[#a0a0a0]">Cargando producto…</p>
      </section>
    )
  }

  if (!product) {
    return (
      <section className="min-h-screen bg-[#050505] px-6 py-[42px] lg:px-40">
        <Seo
          title="Producto no encontrado · Kolortec"
          description="Este producto no está publicado o el enlace cambió. Volvé al catálogo para ver toda la línea Kolortec."
          path={`/producto/${slug || ''}`}
          noindex
        />
        <div>
          <h1 className="title-font m-0 mb-2 text-[clamp(3.8rem,10vw,7rem)] leading-[1.02]">
            {t('productDetail.notFoundTitle', 'Producto no encontrado')}
          </h1>
          <p className="mb-3 text-[#a0a0a0]">{t('productDetail.notFoundSubtitle', 'Este detalle aun no esta publicado.')}</p>
          <Link className="font-bold text-primary" to="/products">{t('productDetail.backToShop', 'Volver a tienda')}</Link>
        </div>
      </section>
    )
  }

  const productPath = `/producto/${product.slug}`
  const productUrl = `${SITE}${productPath}`
  const ogImageAbs = product.ogImage && !product.ogImage.startsWith('http')
    ? `${SITE}${product.ogImage.startsWith('/') ? '' : '/'}${product.ogImage}`
    : product.ogImage
  const productLd = productJsonLd({
    name: product.name,
    description: product.seoDescription,
    image: ogImageAbs,
    sku: product.sku || product.slug,
    category: product.category,
    url: productUrl,
  })
  const breadcrumbLd = breadcrumbJsonLd([
    { name: 'Inicio', url: `${SITE}/` },
    { name: 'Productos', url: `${SITE}/products` },
    { name: product.name, url: productUrl },
  ])

  return (
    <section className="kt-detail-page">
      <Seo
        title={product.seoTitle}
        description={product.seoDescription}
        path={productPath}
        image={product.ogImage}
        type="product"
        jsonLd={[productLd, breadcrumbLd]}
      />
      <main className="kt-detail-main">
        <header className="kt-detail-fixed-header">
          <nav className="kt-detail-tabs" aria-label="Product detail sections">
            <div className="kt-detail-tabs-name">
              <strong className="title-font text-[13px] md:text-[14px] leading-none tracking-[0.14em]">{product.name}</strong>
            </div>
            <div className="kt-detail-tabs-links">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={activeTab === tab.id ? 'is-active' : ''}
                  aria-current={activeTab === tab.id ? 'true' : undefined}
                  onClick={() => {
                    setActiveTab(tab.id)
                    goToSection(tab.id)
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <a
              className="hidden lg:inline-flex self-stretch h-full items-center bg-primary text-black font-extrabold uppercase tracking-[0.08em] text-[10px] px-3 border border-primary rounded-none m-0 hover:brightness-105 transition"
              href={`https://wa.me/5491155555555?text=${encodeURIComponent(`Hola, estoy interesado en ${product.name}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              {t('productDetail.inquiry', 'Inquiry')}
            </a>
          </nav>
        </header>

        <div ref={detailBodyRef} className="kt-detail-body">
          <div className="kt-container">
            <section className="kt-detail-hero kt-detail-anim" id="about">
              <figure
                ref={heroImageRef}
                className="kt-detail-image kt-detail-hero-zoom"
                id="gallery"
                onMouseMove={handleHeroMouseMove}
                onMouseLeave={handleHeroMouseLeave}
              >
                <button
                  type="button"
                  className="block w-full cursor-zoom-in border-0 bg-transparent p-0"
                  onClick={() => setGalleryLightboxIndex(activeImageIndex)}
                  aria-label={`Abrir imagen principal de ${product.name}`}
                >
                  <img src={galleryImages[activeImageIndex] || product.heroImage} alt={product.name} />
                </button>
                <span ref={lensRef} className="kt-zoom-lens" aria-hidden="true" />
              </figure>

              <div className="kt-detail-summary">
                <h1 className="title-font kt-detail-name text-[clamp(2.8rem,6vw,4.9rem)] leading-[0.95]">{product.name}</h1>
                {translatedShortDescription ? <p className="kt-detail-intro">{translatedShortDescription}</p> : null}
                <div className="mt-5 flex items-baseline gap-2">
                  <strong className="title-font text-[clamp(1.8rem,3vw,2.6rem)] leading-none text-primary">
                    {formatPrice(product.price, product.moneda)}
                  </strong>
                </div>
                {/* Contenido principal reservado para INNOVACIONES (la ficha técnica va en su tab).
                    Si no hay innovaciones cargadas, no se muestra nada acá. */}
                {product.innovations.length > 0 ? (
                  <div className="mt-8 grid gap-4 border-t border-[#2a2a2a] pt-6">
                    {product.innovations.slice(0, 4).map((inn) => (
                      <article key={inn.title} className="kt-reveal-item flex items-start gap-3.5">
                        {inn.image ? (
                          <img src={inn.image} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg border border-[#2a2a2a] object-cover" />
                        ) : (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                        )}
                        <div className="grid gap-0.5">
                          <span className="text-[0.95rem] font-bold leading-tight text-[#f0f2f5]">{inn.title}</span>
                          {inn.description ? (
                            <span className="text-[0.85rem] leading-[1.5] text-[#aeb4bf]">{inn.description}</span>
                          ) : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="kt-reveal-item kt-detail-preview-strip-wrap mt-4 lg:col-span-2">
                <div ref={previewStripRef} className="kt-detail-preview-strip" onScroll={onPreviewScroll}>
                {previewImages.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    type="button"
                    className={`kt-detail-preview-btn ${activeImageIndex === index + 1 ? 'is-active' : ''}`}
                    onClick={() => setActiveImageIndex(index + 1)}
                    aria-label={`Ver imagen ${index + 2} de ${product.name}`}
                    aria-current={activeImageIndex === index + 1 ? 'true' : undefined}
                  >
                    <img src={img} alt={`${product.name} vista ${index + 2}`} loading="lazy" />
                  </button>
                ))}
                </div>
                {previewImages.length > 1 ? (
                  <div className="mt-3 flex justify-center gap-2 md:hidden" aria-label="Paginacion galeria">
                    {previewImages.map((_, index) => (
                      <button
                        key={`gallery-dot-${index}`}
                        type="button"
                        className={`h-2.5 w-2.5 rounded-full transition ${index === previewActivePage ? 'bg-primary' : 'bg-white/35'}`}
                        onClick={() => scrollToPage(previewStripRef, index)}
                        aria-label={`Ir a imagen ${index + 2}`}
                        aria-current={index === previewActivePage ? 'true' : undefined}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </section>

            {product.videos.length > 0 ? (
            <>
            <div className="kt-graphene-separator" aria-hidden="true" />

            <section className="kt-detail-video-shell kt-detail-anim" id="video">
              <button
                type="button"
                className="kt-detail-video-head"
                aria-expanded={isVideoOpen}
                onClick={() => setIsVideoOpen((prev) => !prev)}
              >
                <h3 className="kt-detail-video-title text-[clamp(2.1rem,3.3vw,3.1rem)] leading-[1.05]">
                  {t('productDetail.sections.video', 'Product Video')}
                  <span className="kt-title-dot">.</span>
                </h3>
                <span className={`kt-detail-video-chevron ${isVideoOpen ? 'is-open' : ''}`} aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                    <path fill="#1e1e1e" d="M8 9.586l6.293-6.293a1 1 0 011.414 1.414l-7 7a1 1 0 01-1.414 0l-7-7a1 1 0 111.414-1.414L8 9.586z" />
                  </svg>
                </span>
              </button>

              {isVideoOpen && (() => {
                const videos = product.videos ?? []
                if (videos.length === 0) return null
                const safeIndex = Math.min(currentVideoIndex, videos.length - 1)
                const currentVideo = videos[safeIndex]
                const hasMultiple = videos.length > 1
                const goPrev = (event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length)
                }
                const goNext = (event) => {
                  event.preventDefault()
                  event.stopPropagation()
                  setCurrentVideoIndex((prev) => (prev + 1) % videos.length)
                }
                return (
                  <div className="kt-detail-video-content mt-8">
                    <div className="kt-detail-video-list">
                      <div className="relative">
                        <a
                          key={currentVideo.title}
                          className="kt-detail-video-feature"
                          href={currentVideo.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img src={currentVideo.thumbnail} alt={currentVideo.title} loading="lazy" />
                          <div className="kt-detail-video-play">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                              <path fill="#fff" d="M5.54 2.16l14 9a1 1 0 010 1.683l-14 9A1 1 0 014 21.002v-18a1 1 0 011.54-.842z" />
                            </svg>
                          </div>
                        </a>
                        {hasMultiple && (
                          <>
                            <button
                              type="button"
                              onClick={goPrev}
                              aria-label="Video anterior"
                              className="absolute left-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-sm transition hover:border-primary hover:bg-primary hover:text-black sm:left-4 sm:h-12 sm:w-12"
                            >
                              <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]">
                                <path d="M15 6l-6 6 6 6" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={goNext}
                              aria-label="Video siguiente"
                              className="absolute right-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-sm transition hover:border-primary hover:bg-primary hover:text-black sm:right-4 sm:h-12 sm:w-12"
                            >
                              <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]">
                                <path d="M9 6l6 6-6 6" />
                              </svg>
                            </button>
                            <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur-sm">
                              {safeIndex + 1} / {videos.length}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </section>
            </>
            ) : null}

            {product.downloads.length > 0 ? (
            <>
            <div className="kt-graphene-separator" aria-hidden="true" />

            <section className="kt-detail-downloads-shell kt-detail-anim" id="downloads">
              <button
                type="button"
                className="kt-detail-downloads-head"
                aria-expanded={isDownloadsOpen}
                onClick={() => setIsDownloadsOpen((prev) => !prev)}
              >
                <h3 className="kt-detail-downloads-title text-[clamp(2.1rem,3.3vw,3.1rem)] leading-[1.05]">
                  {t('productDetail.sections.downloads', 'Downloads')}
                  <span className="kt-title-dot">.</span>
                </h3>
                <span className={`kt-detail-downloads-chevron ${isDownloadsOpen ? 'is-open' : ''}`} aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                    <path fill="#1e1e1e" d="M8 9.586l6.293-6.293a1 1 0 011.414 1.414l-7 7a1 1 0 01-1.414 0l-7-7a1 1 0 111.414-1.414L8 9.586z" />
                  </svg>
                </span>
              </button>

              {isDownloadsOpen && (
                <div className="kt-detail-downloads-content mt-8">
                  <p className="kt-detail-downloads-copy">
                    {t('productDetail.downloads.description', 'Find and download all technical and marketing documents related to this product.')}
                  </p>

                  <div className="kt-detail-downloads-cards mt-8">
                    <button
                      type="button"
                      className={`grid justify-items-center gap-2 border px-4 py-6 transition ${
                        activeDownloadPanel === 'software'
                          ? 'border-primary bg-[rgba(244,223,51,0.08)]'
                          : 'border-[#2f2f2f] bg-transparent hover:border-[rgba(244,223,51,0.55)]'
                      } kt-reveal-item`}
                      onClick={() => setActiveDownloadPanel('software')}
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-black" aria-hidden="true">
                        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8]">
                          <path d="M20 12a8 8 0 11-2.3-5.6M20 4v5h-5" />
                        </svg>
                      </span>
                      <strong className="title-font text-[1.25rem] leading-[1.05] text-center">{t('productDetail.downloads.softwareUpdates', 'Software Updates')}</strong>
                    </button>
                    <button
                      type="button"
                      className={`grid justify-items-center gap-2 border px-4 py-6 transition ${
                        activeDownloadPanel === 'manuals'
                          ? 'border-primary bg-[rgba(244,223,51,0.08)]'
                          : 'border-[#2f2f2f] bg-transparent hover:border-[rgba(244,223,51,0.55)]'
                      } kt-reveal-item`}
                      onClick={() => setActiveDownloadPanel('manuals')}
                    >
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-black" aria-hidden="true">
                        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8]">
                          <path d="M6 4h9l3 3v13H6zM9 11h6M9 15h6M9 7h3" />
                        </svg>
                      </span>
                      <strong className="title-font text-[1.25rem] leading-[1.05] text-center">{t('productDetail.downloads.manuals', 'Manuals')}</strong>
                    </button>
                  </div>

                  <div className="kt-detail-downloads-panel">
                    {activeDownloadPanel === 'software' ? (
                      <div className="border-y border-[#2a2a2a] divide-y divide-[#2a2a2a]">
                        {softwareDownloads.map((item) => (
                          <article key={item.label} className="kt-reveal-item flex items-center justify-between gap-4 py-3.5">
                            <div className="grid gap-1">
                              <span className="text-[0.95rem] font-bold text-[#f2f2f2]">{item.label}</span>
                              <strong className="text-[0.82rem] font-semibold text-[#aeb2ba]">
                                {item.size} - {item.type}
                              </strong>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDownloadIntent(item.label)}
                              className="rounded-full border border-[#383838] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#f2f2f2] transition hover:border-primary hover:bg-primary hover:text-[#090909]"
                            >
                              {t('productDetail.downloads.downloadCta', 'Descargar')}
                            </button>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="border-y border-[#2a2a2a] divide-y divide-[#2a2a2a]">
                        {manualDownloads.map((item) => (
                          <article key={item.label} className="kt-reveal-item flex items-center justify-between gap-4 py-3.5">
                            <div className="grid gap-1">
                              <span className="text-[0.95rem] font-bold text-[#f2f2f2]">{item.label}</span>
                              <strong className="text-[0.82rem] font-semibold text-[#aeb2ba]">
                                {item.size} - {item.type}
                              </strong>
                            </div>
                            <button
                              type="button"
                              onClick={() => setDownloadIntent(item.label)}
                              className="rounded-full border border-[#383838] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#f2f2f2] transition hover:border-primary hover:bg-primary hover:text-[#090909]"
                            >
                              {t('productDetail.downloads.downloadCta', 'Descargar')}
                            </button>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
            </>
            ) : null}

            {product.accessories.length > 0 ? (
            <>
            <div className="kt-graphene-separator" aria-hidden="true" />

            <section className="kt-detail-accessories-shell kt-detail-anim" id="accessories">
              <button
                type="button"
                className="kt-detail-accessories-head"
                aria-expanded={isAccessoriesOpen}
                onClick={() => setIsAccessoriesOpen((prev) => !prev)}
              >
                <h3 className="kt-detail-accessories-title text-[clamp(2.1rem,3.3vw,3.1rem)] leading-[1.05]">
                  {t('productDetail.sections.accessories', 'Accessories')}
                  <span className="kt-title-dot">.</span>
                </h3>
                <span className={`kt-detail-accessories-chevron ${isAccessoriesOpen ? 'is-open' : ''}`} aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                    <path fill="#1e1e1e" d="M8 9.586l6.293-6.293a1 1 0 011.414 1.414l-7 7a1 1 0 01-1.414 0l-7-7a1 1 0 111.414-1.414L8 9.586z" />
                  </svg>
                </span>
              </button>

              {isAccessoriesOpen && (
                <div ref={relatedMarqueeCallbackRef} className="kt-marquee mt-8" style={{ '--kt-marquee-duration': '38s' }}>
                  <div className="kt-marquee-track">
                    {marqueeAccessories.map((item, index) => (
                      <div
                        key={`acc-${item.name}-${index}`}
                        className="kt-marquee-item kt-marquee-item-product"
                      >
                        <ProductCard
                          item={{
                            name: item.name,
                            description: item.description || 'Accessory',
                            image: product.gallery[index % product.gallery.length],
                          }}
                          detailHref={`/producto/${product.slug || slug}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
            </>
            ) : null}

            {product.technicalSpecs.length > 0 ? (
            <>
            <div className="kt-graphene-separator" aria-hidden="true" />

            <section className="kt-detail-tech-shell kt-detail-anim" id="technical-specs">
              <h3 className="kt-detail-tech-title text-[clamp(2.1rem,3.3vw,3.1rem)] leading-[1.05]">
                {t('productDetail.sections.technicalSpecs', 'Technical Specification')}
                <span className="kt-title-dot">.</span>
              </h3>
              <div className="kt-detail-tech-columns mt-8">
                {technicalSpecColumns.map((column, columnIndex) => (
                  <div key={`tech-col-${columnIndex}`} className="kt-tech-list">
                    {column.map(([label, value]) => (
                      <article key={label} className="kt-tech-row">
                        <span>{label}</span>
                        <strong>{value}</strong>
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </section>
            </>
            ) : null}

            {product.related && product.related.length > 0 ? (
              <>
              <div className="kt-graphene-separator" aria-hidden="true" />
              <section className="kt-detail-anim px-6 py-[clamp(48px,7vw,88px)] lg:px-40" id="related">
                <h3 className="kt-detail-tech-title text-[clamp(1.8rem,3vw,2.6rem)] leading-[1.05]">
                  {t('productDetail.related', 'También te puede interesar')}
                  <span className="kt-title-dot">.</span>
                </h3>
                <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {product.related.map((item) => (
                    <ProductCard key={item.slug || item.id} item={item} />
                  ))}
                </div>
              </section>
              </>
            ) : null}
          </div>
        </div>
      </main>

      <ImageLightbox
        images={galleryImages}
        initialIndex={galleryLightboxIndex < 0 ? 0 : galleryLightboxIndex}
        isOpen={galleryLightboxIndex >= 0}
        onClose={() => setGalleryLightboxIndex(-1)}
        label={product.name}
      />

      <LoginRequiredDialog
        isOpen={Boolean(downloadIntent)}
        onClose={() => setDownloadIntent(null)}
        fileName={downloadIntent}
      />
    </section>
  )
}

export default ProductDetailPage
