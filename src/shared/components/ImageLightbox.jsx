import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../i18n/LanguageProvider'

function ImageLightbox({ images, initialIndex = 0, isOpen, onClose, label = 'Imagen' }) {
  const { t } = useLanguage()
  const safeImages = useMemo(() => images?.filter(Boolean) ?? [], [images])
  const [offset, setOffset] = useState(0)

  const handleClose = useCallback(() => {
    setOffset(0)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event) => {
      if (event.key === 'Escape') handleClose()
      if (event.key === 'ArrowRight') {
        setOffset((prev) => prev + 1)
      }
      if (event.key === 'ArrowLeft') {
        setOffset((prev) => prev - 1)
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, handleClose, safeImages.length])

  if (!isOpen || safeImages.length === 0) return null

  const activeIndex = ((initialIndex + offset) % safeImages.length + safeImages.length) % safeImages.length
  const currentImage = safeImages[activeIndex]
  const goNext = () => setOffset((prev) => prev + 1)
  const goPrev = () => setOffset((prev) => prev - 1)

  const lightboxContent = (
    <div
      className="fixed inset-0 z-[1800] grid place-items-center bg-[rgba(0,0,0,0.9)] p-2 md:p-3"
      role="dialog"
      aria-modal="true"
      aria-label={`${label} ${t('common.fullscreen', 'en pantalla completa')}`}
      onClick={handleClose}
    >
      <div className="relative grid h-[94vh] w-[min(1040px,94vw)] place-items-center overflow-hidden rounded-[12px] border border-[rgba(255,255,255,0.14)] bg-[rgba(10,10,10,0.98)]" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="absolute right-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,255,255,0.22)] bg-[rgba(10,10,10,0.9)] text-white shadow-[0_8px_18px_rgba(0,0,0,0.34)] transition hover:scale-[1.03] hover:bg-primary hover:text-black"
          onClick={handleClose}
          aria-label={t('common.close', 'Cerrar')}
        >
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </button>

        {safeImages.length > 1 ? (
          <button type="button" className="absolute left-3 top-1/2 z-20 inline-flex h-[42px] w-[42px] -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(255,255,255,0.22)] bg-[rgba(18,18,18,0.88)] text-[#f2f4f8]" onClick={goPrev} aria-label={t('common.previousImage', 'Imagen anterior')}>
            <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
          </button>
        ) : null}

        <figure className="relative m-0 h-full w-full">
          <div className="absolute inset-x-4 bottom-2 top-[44px] md:inset-x-6 md:top-[48px]">
            <img src={currentImage} alt={`${label} ${activeIndex + 1}`} className="h-full w-full object-contain" />
          </div>
          <figcaption className="pointer-events-none absolute bottom-2 rounded-full bg-black/55 px-2.5 py-1 text-[0.75rem] font-bold uppercase tracking-[0.08em] text-[#d7dbe2]">
            {activeIndex + 1} / {safeImages.length}
          </figcaption>
        </figure>

        {safeImages.length > 1 ? (
          <button type="button" className="absolute right-3 top-1/2 z-20 inline-flex h-[42px] w-[42px] -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(255,255,255,0.22)] bg-[rgba(18,18,18,0.88)] text-[#f2f4f8]" onClick={goNext} aria-label={t('common.nextImage', 'Imagen siguiente')}>
            <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
          </button>
        ) : null}
      </div>
    </div>
  )

  return createPortal(lightboxContent, document.body)
}

export default ImageLightbox
