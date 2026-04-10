import { useCallback, useEffect, useMemo, useState } from 'react'

function ImageLightbox({ images, initialIndex = 0, isOpen, onClose, label = 'Imagen' }) {
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

  return (
    <div
      className="fixed inset-0 z-[1800] grid place-items-center bg-[rgba(0,0,0,0.86)] p-5"
      role="dialog"
      aria-modal="true"
      aria-label={`${label} en pantalla completa`}
      onClick={handleClose}
    >
      <div className="relative grid h-[min(90vh,820px)] w-[min(1120px,100%)] place-items-center overflow-hidden rounded-[14px] border border-[rgba(255,255,255,0.14)] bg-[rgba(10,10,10,0.96)]" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="absolute right-[10px] top-[10px] inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(255,255,255,0.2)] bg-[rgba(22,22,22,0.9)] text-white" onClick={handleClose} aria-label="Cerrar">
          <span className="material-symbols-outlined" aria-hidden="true">close</span>
        </button>

        {safeImages.length > 1 ? (
          <button type="button" className="absolute left-3 top-1/2 inline-flex h-[42px] w-[42px] -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(255,255,255,0.22)] bg-[rgba(18,18,18,0.88)] text-[#f2f4f8]" onClick={goPrev} aria-label="Imagen anterior">
            <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
          </button>
        ) : null}

        <figure className="m-0 grid h-full w-full content-center justify-items-center gap-2.5 px-16 pb-6 pt-[52px]">
          <img src={currentImage} alt={`${label} ${activeIndex + 1}`} className="max-h-full max-w-full object-contain" />
          <figcaption className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#c6cbd3]">
            {activeIndex + 1} / {safeImages.length}
          </figcaption>
        </figure>

        {safeImages.length > 1 ? (
          <button type="button" className="absolute right-3 top-1/2 inline-flex h-[42px] w-[42px] -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(255,255,255,0.22)] bg-[rgba(18,18,18,0.88)] text-[#f2f4f8]" onClick={goNext} aria-label="Imagen siguiente">
            <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default ImageLightbox
