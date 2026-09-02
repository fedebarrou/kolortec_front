import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { trackEvent } from '../../../shared/services/tracking'
import { getProductBlogs, getProductDetail, getSiteConfig } from '../../../shared/services/contentService'
import {
  abrirArchivo,
  familiaDoc,
  getSesionCacheada,
  guardarIntento,
  propsDeDescarga,
  requiereLogin,
  leerIntento,
  olvidarIntento,
} from '../../../shared/services/downloadService'
import ImageLightbox from '../../../shared/components/ImageLightbox'
import { WHATSAPP_URL } from '../../../shared/components/SocialLinks'
import LoginRequiredDialog from '../../../shared/components/LoginRequiredDialog'
import ProductCard from '../../catalog/components/ProductCard'
import ProductBlogs from '../components/ProductBlogs'
import ProductReviews from '../components/ProductReviews'
import ReferenceMaterial from '../components/ReferenceMaterial'
import { buildMarqueeLoop, marqueeDuration } from '../../../shared/utils/marquee'
import { useMarqueeFill } from '../../../shared/hooks/useMarqueeFill'
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

/**
 * Una lista de documentos descargables (manuales o librerías).
 *
 * Dos cosas que antes no estaban:
 *  - El botón lleva AL ARCHIVO. Antes abría el diálogo de login y ahí moría el
 *    viaje: `item.url` no se usaba en ninguna parte de la ficha. Lo que se
 *    puede bajar sin identificarse va en un <a> real (copiable, abrible en
 *    pestaña nueva, visible para un crawler); lo que pide sesión sigue siendo
 *    un <button>, ahora con candado en vez de flecha, para que se vea ANTES de
 *    clickear que va a pedir algo.
 *  - Estado vacío. El panel de librerías quedaba en 2px de alto: un rectángulo
 *    invisible que no decía nada.
 */
function ListaDescargas({ items, downloadCta, onGated, vacio }) {
  if (!items || items.length === 0) {
    return (
      <div className="border border-dashed border-[#2a2a2a] px-5 py-8 text-center">
        <p className="m-0 text-[0.9rem] leading-[1.5] text-[#aeb2ba]">{vacio}</p>
      </div>
    )
  }

  const claseCta = 'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#383838] px-3 py-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#f2f2f2] transition hover:border-primary hover:bg-primary hover:text-[#090909]'

  return (
    <div className="border-y border-[#2a2a2a] divide-y divide-[#2a2a2a]">
      {items.map((item) => {
        const conLogin = requiereLogin(item)
        const icono = (
          <span className="material-symbols-outlined text-[15px] leading-none" aria-hidden="true">
            {conLogin ? 'lock' : 'download'}
          </span>
        )
        return (
          <article key={item.url || item.label} className="kt-reveal-item flex items-center justify-between gap-4 py-3.5">
            {/* `min-w-0`: el nombre del archivo es lo único elástico del renglón
                (el botón es shrink-0). Sin esto un nombre largo empuja al CTA
                fuera de la caja en vez de partirse, y eso se nota en 390. */}
            <div className="grid min-w-0 gap-1">
              <span className="text-[0.95rem] font-bold text-[#f2f2f2]">{item.label}</span>
              <strong className="text-[0.82rem] font-semibold text-[#aeb2ba]">
                {[item.size, item.type].filter(Boolean).join(' · ') || '—'}
              </strong>
            </div>
            {conLogin ? (
              <button type="button" onClick={() => onGated(item)} className={claseCta}>
                {icono}
                {downloadCta}
              </button>
            ) : (
              <a {...propsDeDescarga(item)} className={claseCta}>
                {icono}
                {downloadCta}
              </a>
            )}
          </article>
        )
      })}
    </div>
  )
}

function ProductDetailPage() {
  const { t, lang } = useLanguage()
  const navigate = useNavigate()

  // Volver SIEMPRE al listado de categorias, no al historial. history.back() te
  // devolvia a donde vinieras: desde el buscador del navbar, desde un link
  // compartido o desde otra ficha, "volver" te sacaba a cualquier lado o
  // directamente afuera del sitio. Desde una ficha de producto el destino que
  // siempre tiene sentido es el catalogo.
  const volver = () => navigate('/products')
  const { slug } = useParams()
  // Data-driven: cargamos el producto REAL desde la API de tiendita por su id/slug.
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPrices, setShowPrices] = useState(true)
  const [showReviews, setShowReviews] = useState(true)
  // Contador de reintentos: el adapter no distingue "no existe" de "no contesta"
  // (fetchWithFallback se traga el error y devuelve null en los dos casos), así
  // que la pantalla vacía ofrece REINTENTAR en vez de afirmar que el producto
  // no existe. Cambiar el contador vuelve a disparar el efecto.
  const [reintento, setReintento] = useState(0)
  useEffect(() => {
    let mounted = true
    setLoading(true)
    getProductDetail(slug).then((p) => { if (mounted) { setProduct(p); setLoading(false) } })
    return () => { mounted = false }
  }, [slug, reintento])
  useEffect(() => {
    let mounted = true
    getSiteConfig().then((c) => {
      if (!mounted) return
      setShowPrices(c.showPrices)
      setShowReviews(c.showReviews)
    })
    return () => { mounted = false }
  }, [])
  // Notas del blog asociadas a ESTE producto (relación ya cargada en tiendita).
  // Va por el id interno, que es lo que filtra /public/blog?producto_id=.
  //
  // Se guarda { id, posts } y no una lista suelta: navegando de un producto a otro,
  // una lista suelta seguiría mostrando las notas del ANTERIOR hasta que resuelva el
  // fetch nuevo. Con el id adentro, el render descarta lo que no es de este producto
  // sin necesidad de vaciar el estado en el cuerpo del efecto.
  const [blogsByProduct, setBlogsByProduct] = useState({ id: null, posts: [] })
  useEffect(() => {
    const productId = product?.id
    if (!productId) return undefined
    let mounted = true
    getProductBlogs(productId).then((posts) => {
      if (mounted) setBlogsByProduct({ id: productId, posts })
    })
    return () => { mounted = false }
  }, [product?.id])
  const productBlogs = blogsByProduct.id && blogsByProduct.id === product?.id ? blogsByProduct.posts : []
  // Relacionados: el carrusel se repite hasta tapar el ancho de pantalla (ver
  // useMarqueeFill). Con 10 productos y un monitor ancho, duplicar el set dejaba
  // media pista más angosta que el viewport y se veía el hueco girando.
  const relatedCount = product?.related?.length ?? 0
  const [relatedFillRef, relatedRepeats] = useMarqueeFill(relatedCount, 12)
  const detailBodyRef = useRef(null)
  const heroImageRef = useRef(null)
  const lensRef = useRef(null)
  // Sección a la que estamos yendo por un click de tab (el spy se calla hasta
  // que el scroll suave termina). Se limpia solo, ver goToSection.
  const destinoTabRef = useRef(null)
  const destinoTimerRef = useRef(null)
  useEffect(() => () => { if (destinoTimerRef.current) clearTimeout(destinoTimerRef.current) }, [])

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
    // El fondo se muestrea desde el cursor REAL (no desde la posición clampeada de la lupa):
    // así en los bordes la ventana llega hasta el borde de la imagen zoomeada.
    const bgX = Math.max(0, Math.min(rect.width * LENS_ZOOM - LENS_SIZE, x * LENS_ZOOM - half))
    const bgY = Math.max(0, Math.min(rect.height * LENS_ZOOM - LENS_SIZE, y * LENS_ZOOM - half))
    lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`
    lens.style.backgroundSize = `${rect.width * LENS_ZOOM}px ${rect.height * LENS_ZOOM}px`
    lens.style.backgroundPosition = `${-bgX}px ${-bgY}px`
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

  // La galería se calcula ACÁ ARRIBA, antes que `tabs`: el tab "Imágenes" sólo
  // tiene sentido si existe la tira de miniaturas, y para saberlo hay que tener
  // la galería armada. Antes el tab dependía de `product.gallery.length > 0`
  // (una sola foto ya lo mostraba) y apuntaba a un ancla que ni existía.
  const selectedVariant = useMemo(
    () => product?.variants?.find((variant) => variant.id === selectedVariantId) ?? product?.variants?.[0],
    [product, selectedVariantId],
  )

  const galleryImages = useMemo(() => {
    const baseGallery = (product?.gallery ?? []).filter(Boolean)
    const primaryCandidate = selectedVariant?.image || product?.heroImage

    if (primaryCandidate && !baseGallery.includes(primaryCandidate)) {
      return [primaryCandidate, ...baseGallery]
    }

    return baseGallery.length > 0 ? baseGallery : [primaryCandidate].filter(Boolean)
  }, [product, selectedVariant])

  const [activeTab, setActiveTab] = useState('about')
  const [isVideoOpen, setIsVideoOpen] = useState(true)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [isDownloadsOpen, setIsDownloadsOpen] = useState(true)
  const [isAccessoriesOpen, setIsAccessoriesOpen] = useState(true)
  const [activeDownloadPanel, setActiveDownloadPanel] = useState('manuals')
  const [galleryLightboxIndex, setGalleryLightboxIndex] = useState(-1)
  const [downloadIntent, setDownloadIntent] = useState(null)
  // Archivo pedido antes de mandar al usuario a loguearse (ver downloadService).
  const [descargaPendiente, setDescargaPendiente] = useState(null)
  // Alto REAL del navbar del sitio: es el `top` de la barra sticky de móvil.
  // Medido y no hardcodeado porque el navbar cambia de alto con el idioma y el
  // ancho, y una barra 4px corrida se lee como un error de maquetado.
  const [navTop, setNavTop] = useState(68)
  const [translatedShortDescription, setTranslatedShortDescription] = useState(product?.shortDescription ?? '')
  const tabs = useMemo(() => {
    const list = [{ id: 'about', label: t('productDetail.tabs.about', 'About') }]
    // > 1 y no > 0: con una sola foto no hay tira de miniaturas, o sea que
    // #gallery no existe en el DOM y el tab llevaba a la nada.
    if (galleryImages.length > 1) list.push({ id: 'gallery', label: t('productDetail.tabs.gallery', 'Fotos') })
    if ((product?.videos?.length ?? 0) > 0) list.push({ id: 'video', label: t('productDetail.tabs.video', 'Video') })
    if ((product?.downloads?.length ?? 0) > 0) list.push({ id: 'downloads', label: t('productDetail.tabs.downloads', 'Descargas') })
    if ((product?.accessories?.length ?? 0) > 0) list.push({ id: 'accessories', label: t('productDetail.tabs.accessories', 'Accesorios') })
    if ((product?.technicalSpecs?.length ?? 0) > 0) list.push({ id: 'technical-specs', label: t('productDetail.tabs.technicalSpecs', 'Especificaciones') })
    return list
  }, [t, product, galleryImages.length])

  // Se MIDE la altura real de las dos barras en vez de hardcodear 74/88 + 40/44.
  // Los números fijos ya no coincidían con nada: en 1440 el lienzo tiene
  // zoom 0.75, así que la barra de tabs que en CSS dice 52px mide 40 en
  // pantalla, y en móvil la barra de la ficha directamente no existía. Un
  // offset equivocado es justamente lo que dejaba al spy peleando por décimas.
  const getStickyOffset = () => {
    // SUMA de todos los matches, no el primero: `[data-kt-detail-nav]` lo llevan
    // la barra de escritorio y la de móvil, y en el DOM la de escritorio va
    // primera. Con querySelector, en el celu medíamos la barra OCULTA (0px) y la
    // sección quedaba metida debajo de la que sí se ve.
    const alto = (sel) => Array.from(document.querySelectorAll(sel))
      .reduce((acc, el) => acc + el.getBoundingClientRect().height, 0)
    return alto('.site-header') + alto('[data-kt-detail-nav]') + 8
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [slug])

  useEffect(() => {
    const medir = () => {
      const h = document.querySelector('.site-header')?.getBoundingClientRect().height
      if (h) setNavTop(Math.round(h))
    }
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])

  // Vuelta del login: si quedó un archivo pedido para ESTA ficha y ahora hay
  // sesión, se lo ofrecemos en un aviso arriba de Descargas. No se dispara solo
  // porque una bajada sin gesto del usuario la bloquea el navegador.
  useEffect(() => {
    const intento = leerIntento(`/producto/${slug || ''}`)
    if (!intento) return undefined
    let vivo = true
    getSesionCacheada().then((sesion) => {
      if (vivo && sesion) setDescargaPendiente(intento)
    })
    return () => { vivo = false }
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
      // Mientras corre un scroll pedido por un click de tab, el tab lo manda el
      // click y no el spy: durante la animación suave el spy iba marcando todas
      // las secciones intermedias y terminaba peleando con el destino.
      if (destinoTabRef.current) return

      const offset = getStickyOffset()
      let current = tabs[0]?.id ?? 'about'

      // TOLERANCIA, y no `<= 0` pelado. El lienzo con zoom deja el layout en
      // coordenadas fraccionarias (medido: top 140.25 contra offset 140), así
      // que al aterrizar justo sobre una sección la resta daba +0.25 y ganaba
      // la ANTERIOR: clickeabas "Descargas" y se encendía "Video". 3px cubre el
      // redondeo del scroll y sigue siendo mucho menos que cualquier sección.
      const TOLERANCIA = 3
      tabs.forEach((tab) => {
        const section = document.getElementById(tab.id)
        if (section && section.getBoundingClientRect().top - offset <= TOLERANCIA) {
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
    // productBlogs.length en las deps: "Notas relacionadas" se monta cuando resuelve
    // SU propio fetch, después de este efecto. Sin volver a correr, esa sección nunca
    // entraba al observer, se quedaba en opacity:0 para siempre y el bloque existía en
    // el DOM pero no se veía. Va .length y no el array: el ternario que lo calcula
    // devuelve un [] nuevo en cada render y colgaría el efecto en loop.
  }, [product, productBlogs.length])

  // El filtro viejo era /software|firmware/i SOBRE EL LABEL, y los documentos
  // que carga el tenant se llaman "Ficha técnica…" y "Carta DMX…": no matcheaba
  // NUNCA. El panel de Librerías medía 2px de alto en todos los productos.
  // familiaDoc() clasifica por extensión primero (csv/gdtf/ies/zip… = librería)
  // y usa el mismo criterio que la página /descargas.
  const softwareDownloads = useMemo(
    () => (product?.downloads ?? []).filter((item) => familiaDoc(item) === 'libreria'),
    [product],
  )
  const manualDownloads = useMemo(
    () => (product?.downloads ?? []).filter((item) => familiaDoc(item) !== 'libreria'),
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

  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const previewStripRef = useRef(null)

  useEffect(() => {
    setActiveImageIndex(0)
    setCurrentVideoIndex(0)
  }, [slug, galleryImages.length])

  // Centra la miniatura en la tira sin mover el scroll de la PÁGINA
  // (scrollIntoView movía las dos cosas).
  const centrarMiniatura = (index) => {
    const strip = previewStripRef.current
    const btn = strip?.children?.[index]
    if (!strip || !btn) return
    strip.scrollTo({
      left: btn.offsetLeft - (strip.clientWidth - btn.offsetWidth) / 2,
      behavior: 'smooth',
    })
  }

  const elegirImagen = (index) => {
    setActiveImageIndex(index)
    centrarMiniatura(index)
  }

  const goToSection = (id) => {
    const node = document.getElementById(id)
    if (!node) return
    const top = node.getBoundingClientRect().top + window.scrollY - getStickyOffset()
    // El spy queda mudo hasta que el scroll suave frena. Sin esto el propio
    // viaje encendía y apagaba cada tab intermedio.
    destinoTabRef.current = id
    window.scrollTo({ top, behavior: 'smooth' })
    if (destinoTimerRef.current) clearTimeout(destinoTimerRef.current)
    destinoTimerRef.current = setTimeout(() => { destinoTabRef.current = null }, 900)
  }

  // Sólo para los archivos con gate (firmware, instaladores, librerías de
  // carga): si ya hay sesión se baja derecho —el diálogo se le mostraba hasta a
  // quien ya estaba logueado, porque nadie miraba nunca la sesión—, y si no,
  // se ANOTA qué archivo era antes de mandarlo al login.
  const pedirDescarga = (item) => {
    getSesionCacheada().then((sesion) => {
      if (sesion) {
        abrirArchivo(item)
        return
      }
      guardarIntento(item, `/producto/${slug || ''}`)
      setDownloadIntent(item)
    })
  }

  if (loading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#050505] px-6">
        <p className="animate-pulse text-[#a0a0a0]">Cargando producto…</p>
      </section>
    )
  }

  if (!product) {
    // No afirmamos "no existe": el adapter devuelve null tanto cuando el
    // producto no está publicado como cuando la API no contestó, y decirle a
    // alguien que su producto no existe porque se le cayó el wifi es mentirle.
    // Se nombran las dos causas posibles y se ofrece la acción de cada una.
    return (
      <section className="min-h-screen bg-[#050505] px-6 py-[42px] lg:px-40">
        <Seo
          title={t('seo.productNotFound', 'Producto no encontrado · Kolortec')}
          description={t('seo.productNotFoundDesc', 'Este producto no está publicado o el enlace cambió. Volvé al catálogo para ver toda la línea Kolortec.')}
          path={`/producto/${slug || ''}`}
          noindex
        />
        <div>
          <h1 className="title-font m-0 mb-2 text-[clamp(3.2rem,8vw,5.6rem)] leading-[1.02]">
            {t('productDetail.unavailableTitle', 'No pudimos mostrar este producto')}
          </h1>
          <p className="mb-6 max-w-[62ch] text-[#a0a0a0]">
            {t('productDetail.unavailableSubtitle', 'Puede que ya no esté publicado, o que la conexión se haya cortado justo ahora. Probá de nuevo; si sigue igual, mirá el catálogo completo.')}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setReintento((n) => n + 1)}
              className="inline-flex items-center gap-2 rounded-[8px] bg-primary px-5 py-3 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-[#0b0b0b] transition hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[17px] leading-none" aria-hidden="true">refresh</span>
              {t('productDetail.retry', 'Reintentar')}
            </button>
            <Link
              className="inline-flex items-center rounded-[8px] border-2 border-white px-5 py-3 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-white hover:text-[#090909]"
              to="/products"
            >
              {t('productDetail.backToShop', 'Volver a tienda')}
            </Link>
          </div>
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
        {/* `data-kt-detail-nav` lo miran getStickyOffset() y el spy: es "la barra
            de secciones que está visible ahora", sea esta o la de móvil. */}
        <header className="kt-detail-fixed-header" data-kt-detail-nav>
          <nav className="kt-detail-tabs" aria-label={t('a11y.sections', 'Secciones del producto')}>
            <div className="kt-detail-tabs-name">
              <button type="button" className="kt-detail-back" onClick={volver} aria-label={t('a11y.back', 'Volver')} title={t('a11y.back', 'Volver')}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <strong className="title-font text-[13px] md:text-[14px] leading-none tracking-[0.14em]">{product.name}</strong>
            </div>
            {/* Dos ajustes para que subir los rótulos de 11 a 12px no cueste ancho:
                - `gap` de 22 a 14px hasta xl, que devuelve los ~40px que suma la
                  tipografía. De 1280 para arriba sobra lugar y vuelve el respiro.
                - `safe center`: la tira es `justify-content:center` con
                  `overflow-x:auto` y la barra de scroll escondida. Centrado +
                  desbordado = el excedente se reparte a los DOS lados y el de la
                  izquierda queda fuera del alcance del scroll (scrollLeft no puede
                  ser negativo): en 1024 el primer rótulo estaba recortado y no
                  había forma de traerlo. Con `safe` centra sólo mientras entra y
                  se pega al inicio cuando no. */}
            <div className="kt-detail-tabs-links gap-[14px] xl:gap-[22px] [justify-content:safe_center]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`text-[12px] ${activeTab === tab.id ? 'is-active' : ''}`}
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
              className="hidden lg:inline-flex self-stretch h-full items-center bg-primary text-black font-extrabold uppercase tracking-[0.08em] text-[12px] px-3 border border-primary rounded-none m-0 hover:brightness-105 transition"
              /* El número sale de SocialLinks, la fuente única de contactos.
                 Estaba escrito acá a mano y era el relleno 55-5555: este botón
                 —el CTA de consulta de cada producto— linkeaba a un WhatsApp
                 inexistente en producción. */
              href={`${WHATSAPP_URL}?text=${encodeURIComponent(`Hola, estoy interesado en ${product.name}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              {t('productDetail.inquiry', 'Inquiry')}
            </a>
          </nav>
        </header>

        {/* Barra de secciones para CELULAR.
            La barra de escritorio la apaga `index.css` con
            `@media (max-width:640px){ .kt-detail-fixed-header{display:none} }`,
            que no es de este archivo. Resultado: en 390px una ficha de ~7100px
            de alto no tenía ni tabs ni "Volver" — ninguna forma de saltar a
            Descargas ni de salir al catálogo salvo scrollear todo y usar el
            botón del navegador.
            Va `sticky` bajo el header del sitio (que es sticky top-0) y se
            apaga a partir de 641px con `min-[641px]:hidden`, o sea justo donde
            la otra barra vuelve a aparecer: nunca hay dos, nunca hay ninguna. */}
        <nav
          data-kt-detail-nav
          aria-label={t('a11y.sections', 'Secciones del producto')}
          style={{ top: `${navTop}px` }}
          className="sticky z-30 flex items-center gap-2 border-b border-white/10 bg-[#1a1a1ae0] px-4 backdrop-blur-[8px] min-[641px]:hidden"
        >
          <button
            type="button"
            onClick={volver}
            aria-label={t('a11y.back', 'Volver')}
            title={t('a11y.back', 'Volver')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 text-white/75 transition active:scale-95"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[15px] w-[15px] fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.2]">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {tabs.map((tab) => (
              <button
                key={`m-${tab.id}`}
                type="button"
                aria-current={activeTab === tab.id ? 'true' : undefined}
                onClick={() => {
                  setActiveTab(tab.id)
                  goToSection(tab.id)
                }}
                className={`h-11 shrink-0 whitespace-nowrap border-b-2 text-[12px] font-bold uppercase tracking-[0.1em] transition ${
                  activeTab === tab.id ? 'border-primary text-[#f4f7fb]' : 'border-transparent text-[#c6ccd7]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        <div ref={detailBodyRef} className="kt-detail-body">
          <div className="kt-container">
            <section className="kt-detail-hero kt-detail-anim" id="about">
              <figure
                ref={heroImageRef}
                className="kt-detail-image kt-detail-hero-zoom"
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
                {showPrices ? (
                  <div className="mt-5 flex items-baseline gap-2">
                    <strong className="title-font text-[clamp(1.8rem,3vw,2.6rem)] leading-none text-primary">
                      {formatPrice(product.price, product.moneda)}
                    </strong>
                  </div>
                ) : null}
                {/* Contenido principal reservado para INNOVACIONES (la ficha técnica va en su tab).
                    Si no hay innovaciones cargadas, no se muestra nada acá. */}
                {product.innovations.length > 0 ? (
                  <div className="mt-8 grid gap-4 border-t border-[#2a2a2a] pt-6">
                    {/* Sin `.slice(0, 4)`: recortaba desde la quinta innovación
                        sin avisar ni dar forma de ver el resto. Hoy el máximo
                        cargado son 4, así que el corte no se veía —pero cuando
                        el tenant cargue la quinta, desaparecía en silencio. */}
                    {product.innovations.map((inn) => (
                      <article key={inn.title} className="kt-reveal-item flex items-start gap-3.5">
                        {/* CUADRADO (con esquinas suaves) y no círculo: estos íconos
                            los sube el tenant desde el admin y son logos o marcas
                            de forma libre —muchas veces un logotipo horizontal o
                            un pictograma rectangular—. Un círculo les recorta las
                            esquinas y parte cualquier cosa que no sea una marca
                            redonda centrada. Además va `object-contain` y no
                            `object-cover`: cover RECORTABA el ícono para llenar el
                            cuadro, o sea que la marca del fabricante se veía a
                            medias. Con contain entra entera y el marco la sostiene. */}
                        {inn.image ? (
                          <img
                            src={inn.image}
                            alt=""
                            loading="lazy"
                            className="h-14 w-14 shrink-0 rounded-[10px] border border-[#2a2a2a] bg-[#0d0d0e] object-contain p-2"
                          />
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

                {/* Las miniaturas van al PIE DE LA COLUMNA DERECHA, debajo del
                    nombre, el precio y las innovaciones. Estuvieron apoyadas sobre
                    el borde inferior de la foto, y ahí le comían el remate justo a
                    la imagen que están para cambiar. Acá cierran la ficha de datos
                    y dejan la foto entera. */}
                {/* La tira lleva TODAS las imágenes, la portada incluida. Antes
                    era `galleryImages.slice(1)`: 6 fotos y 5 miniaturas, y una
                    vez que cambiabas de foto no había forma de volver a la
                    portada salvo abriendo el lightbox.
                    Acá vive también el ancla #gallery: el tab "Imágenes"
                    apuntaba a la MISMA coordenada que "Acerca de" (el id estaba
                    en la <figure>, anidada dentro de #about), así que los dos
                    tabs llevaban al mismo lugar y "Acerca de" no se podía
                    marcar nunca. */}
                {galleryImages.length > 1 ? (
                  <div id="gallery" className="kt-detail-preview-rail kt-reveal-item">
                    <div ref={previewStripRef} className="kt-detail-preview-strip">
                      {galleryImages.map((img, index) => (
                        <button
                          key={`${img}-${index}`}
                          type="button"
                          className={`kt-detail-preview-btn ${activeImageIndex === index ? 'is-active' : ''}`}
                          onClick={() => elegirImagen(index)}
                          aria-label={`Ver imagen ${index + 1} de ${product.name}`}
                          aria-current={activeImageIndex === index ? 'true' : undefined}
                        >
                          <img src={img} alt={`${product.name} vista ${index + 1}`} loading="lazy" />
                        </button>
                      ))}
                    </div>
                    {/* Un punto = UNA IMAGEN, no una página de scroll. Antes eran
                        5 puntos para ~2,4 páginas reales: tocar el último
                        encendía el 2º y no cambiaba la foto grande, porque el
                        mismo control mezclaba índice de imagen con posición de
                        scroll. Ahora el punto hace lo único que se espera:
                        cambiar la foto (y traer su miniatura a la vista). */}
                    {/* Clave NUEVA a propósito: `a11y.gallery` dice "Paginación de
                        la galería" y esto ya no pagina, elige imagen. */}
                    <div className="mt-2.5 flex flex-wrap justify-center gap-2 md:hidden" role="group" aria-label={t('a11y.galleryImages', 'Imágenes del producto')}>
                      {galleryImages.map((_, index) => (
                        <button
                          key={`gallery-dot-${index}`}
                          type="button"
                          className={`h-2.5 w-2.5 rounded-full transition ${index === activeImageIndex ? 'bg-primary' : 'bg-white/35'}`}
                          onClick={() => elegirImagen(index)}
                          aria-label={`Ver imagen ${index + 1}`}
                          aria-current={index === activeImageIndex ? 'true' : undefined}
                        />
                      ))}
                    </div>
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
                              aria-label={t('a11y.prevVideo', 'Video anterior')}
                              className="absolute left-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-sm transition hover:border-primary hover:bg-primary hover:text-black sm:left-4 sm:h-12 sm:w-12"
                            >
                              <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]">
                                <path d="M15 6l-6 6 6 6" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={goNext}
                              aria-label={t('a11y.nextVideo', 'Video siguiente')}
                              className="absolute right-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-sm transition hover:border-primary hover:bg-primary hover:text-black sm:right-4 sm:h-12 sm:w-12"
                            >
                              <svg viewBox="0 0 24 24" className="h-5 w-5 stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]">
                                <path d="M9 6l6 6-6 6" />
                              </svg>
                            </button>
                            <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.08em] text-white backdrop-blur-sm">
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

                  {descargaPendiente ? (
                    <div className="mt-6 flex flex-col items-start gap-3 rounded-[10px] border border-[rgba(244,223,51,0.45)] bg-[rgba(244,223,51,0.07)] p-4 md:flex-row md:items-center md:justify-between md:gap-4">
                      <p className="m-0 text-[0.92rem] leading-[1.45] text-[#e9ebef]">
                        {t('productDetail.downloads.pending', 'Listo, ya podés descargar')}{' '}
                        <strong className="font-bold text-white">{descargaPendiente.label}</strong>.
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        <a
                          {...propsDeDescarga(descargaPendiente)}
                          onClick={() => { olvidarIntento(); setDescargaPendiente(null) }}
                          className="inline-flex items-center gap-2 rounded-[8px] bg-primary px-4 py-2.5 text-[0.75rem] font-extrabold uppercase tracking-[0.1em] text-[#0b0b0b] transition hover:-translate-y-0.5"
                        >
                          <span className="material-symbols-outlined text-[16px] leading-none" aria-hidden="true">download</span>
                          {t('productDetail.downloads.downloadCta', 'Descargar')}
                        </a>
                        <button
                          type="button"
                          onClick={() => { olvidarIntento(); setDescargaPendiente(null) }}
                          aria-label={t('loginDialog.close', 'Cerrar')}
                          className="grid h-9 w-9 place-items-center rounded-full text-[#aeb2ba] transition hover:bg-white/10 hover:text-white"
                        >
                          <span className="material-symbols-outlined text-[18px] leading-none">close</span>
                        </button>
                      </div>
                    </div>
                  ) : null}

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
                    <ListaDescargas
                      items={activeDownloadPanel === 'software' ? softwareDownloads : manualDownloads}
                      downloadCta={t('productDetail.downloads.downloadCta', 'Descargar')}
                      onGated={pedirDescarga}
                      vacio={activeDownloadPanel === 'software'
                        ? t('productDetail.downloads.emptyLibraries', 'Este equipo todavía no tiene librerías ni firmware publicados. Pedilos por soporte y te los mandamos.')
                        : t('productDetail.downloads.emptyManuals', 'Este equipo todavía no tiene manuales publicados. Pedilos por soporte y te los mandamos.')}
                    />
                  </div>

                </div>
              )}
            </section>
            </>
            ) : null}

            {/* Material de referencia: sección PROPIA, no un apéndice del acordeón de
                Descargas. Son links que SALEN del sitio y muchas veces son páginas,
                no archivos: mezclarlos con los documentos descargables hacía que se
                leyeran como un "Descargar" más. Ver ReferenceMaterial.jsx. */}
            {product.materialExterno.length > 0 ? (
              <>
              <div className="kt-graphene-separator" aria-hidden="true" />
              <ReferenceMaterial items={product.materialExterno} />
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
                <div ref={relatedMarqueeCallbackRef} className="kt-marquee kt-marquee-cards mt-8" style={{ '--kt-marquee-duration': '38s' }}>
                  <div className="kt-marquee-track">
                    {marqueeAccessories.map((item, index) => (
                      <div
                        key={`acc-${item.name}-${index}`}
                        className="kt-marquee-item kt-marquee-item-product"
                      >
                        <ProductCard
                          item={{
                            name: item.name,
                            category: item.category || t('productDetail.tabs.accessories', 'Accesorios'),
                            // Con la galería vacía, `index % 0` es NaN y
                            // `gallery[NaN]` es undefined: la tarjeta quedaba sin
                            // imagen y sin explicación. El accesorio trae la suya
                            // cuando la tiene; si no, cae en la foto del producto.
                            image: item.image
                              || (product.gallery.length > 0 ? product.gallery[index % product.gallery.length] : product.heroImage),
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
              {/* Mismo caparazón que Descargas / Especificación técnica: el gutter
                  lateral lo pone .kt-container, una sola vez. Antes esta sección
                  agregaba SU PROPIO `px-6 lg:px-40` encima del contenedor, así que
                  el carrusel arrancaba 10rem más adentro que todo el resto de la
                  ficha y se leía como un bloque ajeno. */}
              <section className="kt-detail-tech-shell kt-detail-shell-short kt-detail-anim" id="related">
                <h3 className="kt-detail-tech-title text-[clamp(2.1rem,3.3vw,3.1rem)] leading-[1.05]">
                  {t('productDetail.related', 'También te puede interesar')}
                  <span className="kt-title-dot">.</span>
                </h3>
                {/* Carrusel, no grilla fija de 4: mismo tratamiento que Destacados
                    (pausa + agrandado al hover, velocidad constante en px/s). */}
                <div
                  ref={relatedFillRef}
                  className="kt-marquee kt-marquee-cards mt-8"
                  style={{ '--kt-marquee-duration': marqueeDuration(product.related.length, 11, 54) }}
                >
                  <div className="kt-marquee-track">
                    {buildMarqueeLoop(product.related, relatedRepeats).map((item, index) => (
                      <div
                        key={`related-${item.slug || item.id || item.name}-${index}`}
                        className="kt-marquee-item kt-marquee-item-product"
                        aria-hidden={index >= product.related.length ? 'true' : undefined}
                      >
                        <ProductCard item={item} focusable={index < product.related.length} />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
              </>
            ) : null}

            {/* Orden del cierre pedido por el cliente: relacionados → notas →
                comentarios. Va de lo más comercial (otros equipos) a lo más
                editorial (cómo se usa) y termina en la voz de otros clientes. */}
            {productBlogs.length > 0 ? (
              <>
              <div className="kt-graphene-separator" aria-hidden="true" />
              <ProductBlogs posts={productBlogs} />
              </>
            ) : null}

            {/* Comentarios: sólo clientes registrados comentan, y lo publicado es lo
                aprobado desde el admin de tiendita. La cuenta los puede apagar
                entera desde el admin (web_config.show_reviews). */}
            {showReviews ? (
              <>
              <div className="kt-graphene-separator" aria-hidden="true" />
              <ProductReviews productId={product.id} />
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
        fileName={downloadIntent?.label}
      />
    </section>
  )
}

export default ProductDetailPage
