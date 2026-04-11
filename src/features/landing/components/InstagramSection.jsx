import { useEffect, useRef, useState } from 'react'
import ImageLightbox from '../../../shared/components/ImageLightbox'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

function InstagramSection({ gallery }) {
  const { t } = useLanguage()
  const title = t('landing.instagram.title', 'KOLORTEC on Instagram')
  const subtitle = t('landing.instagram.subtitle', gallery.subtitle)

  const [lightboxIndex, setLightboxIndex] = useState(-1)
  const [visibleCount, setVisibleCount] = useState(1)
  const [pageCount, setPageCount] = useState(1)
  const [activePage, setActivePage] = useState(0)
  const [cardWidth, setCardWidth] = useState(170)
  const viewportRef = useRef(null)

  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return undefined

    const gap = 8

    const recalc = () => {
      const width = viewport.clientWidth
      const nextVisible =
        window.innerWidth >= 1280 ? 6 :
        window.innerWidth >= 1024 ? 5 :
        window.innerWidth >= 768 ? 4 :
        2
      const nextCardWidth = Math.max(140, (width - gap * (nextVisible - 1)) / nextVisible)
      const nextPages = Math.max(1, Math.ceil(gallery.images.length / nextVisible))
      setVisibleCount(nextVisible)
      setCardWidth(nextCardWidth)
      setPageCount(nextPages)
      setActivePage((prev) => Math.min(prev, nextPages - 1))
    }

    recalc()
    const observer = new ResizeObserver(recalc)
    observer.observe(viewport)

    return () => observer.disconnect()
  }, [gallery.images.length])

  const scrollToPage = (pageIndex) => {
    const viewport = viewportRef.current
    if (!viewport) return

    viewport.scrollTo({
      left: viewport.clientWidth * pageIndex,
      behavior: 'smooth',
    })
    setActivePage(pageIndex)
  }

  const onViewportScroll = () => {
    const viewport = viewportRef.current
    if (!viewport) return
    const current = Math.round(viewport.scrollLeft / Math.max(viewport.clientWidth, 1))
    setActivePage(Math.max(0, Math.min(current, pageCount - 1)))
  }

  return (
    <section className="px-6 py-[clamp(84px,11vw,128px)] lg:px-40 kt-section-reveal" style={{ '--reveal-delay': '80ms' }}>
      <div>
        <div className="mb-7 flex flex-col items-start justify-between gap-3 text-left md:flex-row md:items-end">
          <div className="kt-landing-reveal-item">
            <h2 className="title-font m-0 inline-flex items-baseline gap-[0.08em] text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02] tracking-[0]">
              {title}
              <span className="text-primary">.</span>
            </h2>
            <p className="m-0 text-[#a0a0a0]">{subtitle}</p>
          </div>
          <a className="kt-landing-reveal-item mt-3 inline-flex items-center gap-2 text-[0.82rem] font-extrabold uppercase tracking-[0.18em] text-primary underline underline-offset-4" href="#">
            {gallery.cta}
          </a>
        </div>

        <div
          ref={viewportRef}
          className="overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden snap-x snap-mandatory"
          onScroll={onViewportScroll}
        >
          <div className="flex w-max gap-2">
            {gallery.images.map((src, index) => (
              <article
                key={`${src}-${index}`}
                className="kt-landing-reveal-item flex-none aspect-square overflow-hidden snap-start"
                style={{ width: `${cardWidth}px` }}
              >
                <button
                  type="button"
                  className="block h-full w-full cursor-pointer border-0 bg-transparent p-0"
                  onClick={() => setLightboxIndex(index)}
                  aria-label={`Abrir imagen ${index + 1} de Instagram`}
                >
                  <img
                    className="h-full w-full object-cover grayscale transition duration-300 hover:scale-105 hover:grayscale-0"
                    src={src}
                    alt="Kolortec en Instagram"
                    loading="lazy"
                  />
                </button>
              </article>
            ))}
          </div>
        </div>

        {pageCount > 1 ? (
          <div className="mt-4 flex justify-center gap-2" aria-label="Paginación de carrusel Instagram">
            {Array.from({ length: pageCount }).map((_, index) => (
              <button
                key={`ig-dot-${index}`}
                type="button"
                className={`h-2.5 w-2.5 rounded-full transition ${index === activePage ? 'bg-primary' : 'bg-white/35 hover:bg-white/55'}`}
                onClick={() => scrollToPage(index)}
                aria-label={`Ir al grupo ${index + 1}`}
                aria-current={index === activePage ? 'true' : undefined}
              />
            ))}
          </div>
        ) : null}
      </div>
      <ImageLightbox
        images={gallery.images}
        initialIndex={lightboxIndex < 0 ? 0 : lightboxIndex}
        isOpen={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
        label="Instagram"
      />
    </section>
  )
}

export default InstagramSection
