import { useMemo, useState } from 'react'
import ImageLightbox from '../../../shared/components/ImageLightbox'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'
import { SOCIAL_LINKS } from '../../../shared/components/SocialLinks'
import { buildMarqueeLoop, marqueeDuration } from '../../../shared/utils/marquee'
import { useMarqueeFill } from '../../../shared/hooks/useMarqueeFill'
import { aItemDeGaleria } from '../../../shared/utils/igMedia'

const INSTAGRAM = SOCIAL_LINKS.find((s) => s.key === 'instagram')

/**
 * Una publicación del carrusel. Si es un reel con .mp4: muestra el ícono de
 * play, se reproduce (sin sonido) al apoyar el mouse o al enfocarla con el
 * teclado, y al hacer click abre el reproductor con controles y sonido.
 * El <video> se monta recién al apuntar: con la tira repetida para llenar la
 * pantalla, montarlos todos serían decenas de videos descargando a la vez.
 */
function IgTile({ item, alt, ariaLabel, onOpen, onVideoVencido }) {
  const [activo, setActivo] = useState(false)
  const esVideo = !!item.video
  const prender = () => {
    if (!esVideo) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    setActivo(true)
  }
  const apagar = () => setActivo(false)

  return (
    <button
      type="button"
      className="kt-marquee-item kt-marquee-item-portrait group relative m-0 cursor-pointer overflow-hidden border-0 bg-transparent p-0"
      onClick={onOpen}
      onMouseEnter={prender}
      onMouseLeave={apagar}
      onFocus={prender}
      onBlur={apagar}
      aria-label={ariaLabel}
      data-ig-video={esVideo ? 'true' : undefined}
    >
      <img
        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        src={item.src}
        alt={alt}
        loading="lazy"
      />
      {esVideo && activo ? (
        <video
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          src={item.video}
          poster={item.src}
          autoPlay
          muted
          loop
          playsInline
          // Las urls del CDN de Instagram vencen: si el .mp4 ya no responde, la
          // publicación vuelve a ser la foto de tapa en vez de un cuadro negro —
          // en la tira y también en el reproductor (por eso se avisa para arriba).
          onError={() => onVideoVencido(item.video)}
        />
      ) : null}
      {esVideo ? (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition-opacity duration-200 ${activo ? 'opacity-0' : 'opacity-100'}`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M8 5v14l11-7z" /></svg>
        </span>
      ) : null}
    </button>
  )
}

function InstagramSection({ gallery }) {
  const { t } = useLanguage()
  const followText = t(
    'landing.instagram.followText',
    'Follow {handle} on Instagram and never miss a story again!',
  )
  const handle = t('landing.instagram.handle', '@kolortec')
  const [followBefore, followAfter = ''] = followText.split('{handle}')

  const [lightboxIndex, setLightboxIndex] = useState(-1)
  // El carrusel se muestra SOLO si hay un Instagram REAL conectado al tenant (no galería).
  // `items` trae el .mp4 de los reels; si no vino, las fotos sueltas de `images`.
  // Un .mp4 que falló al cargar (url vencida) deja de ser video: queda la tapa.
  const [vencidos, setVencidos] = useState(() => new Set())
  const marcarVencido = (url) => setVencidos((prev) => (prev.has(url) ? prev : new Set(prev).add(url)))
  const items = useMemo(
    () => (gallery.items?.length ? gallery.items : gallery.images)
      .map(aItemDeGaleria)
      .filter(Boolean)
      .map((item) => (item.video && vencidos.has(item.video) ? { ...item, video: null } : item)),
    [gallery.items, gallery.images, vencidos],
  )
  const showCarousel = !!gallery.connected && items.length > 0
  // Repetido hasta llenar la tira (ver marquee.js): con pocas fotos de IG el track
  // medía menos que la pantalla y se veía el hueco girando.
  const [marqueeRef, repeats] = useMarqueeFill(showCarousel ? items.length : 0, 14)
  const loopImages = useMemo(
    () => (showCarousel ? buildMarqueeLoop(items, repeats) : []),
    [showCarousel, items, repeats],
  )
  const igDuration = marqueeDuration(items.length, 8, 44)

  return (
    <section className="px-6 pt-[clamp(40px,6vw,72px)] pb-[clamp(84px,11vw,128px)] lg:px-40 kt-section-reveal" style={{ '--reveal-delay': '80ms' }}>
      <div>
        <div className="kt-landing-reveal-item mb-9 flex flex-col items-center gap-4 text-center sm:mb-12">
          <a
            href={INSTAGRAM?.href ?? '#'}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="text-white transition hover:text-primary"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-9 w-9 fill-current">
              <path d={INSTAGRAM?.path} />
            </svg>
          </a>
          <p className="m-0 max-w-[60ch] text-[clamp(0.95rem,1.6vw,1.15rem)] leading-[1.45] text-[#cfd2d8]">
            {followBefore}
            <a
              href={INSTAGRAM?.href ?? '#'}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline decoration-2 underline-offset-[6px] transition hover:opacity-80"
            >
              {handle}
            </a>
            {followAfter}
          </p>
        </div>

        {showCarousel ? (
        <div ref={marqueeRef} className="kt-marquee" style={{ '--kt-marquee-duration': igDuration }}>
          <div className="kt-marquee-track">
            {loopImages.map((item, index) => (
              <IgTile
                key={`${item.src}-${index}`}
                item={item}
                alt={t('a11y.instagramAlt', 'Kolortec en Instagram')}
                ariaLabel={`Abrir ${item.video ? 'video' : 'imagen'} ${(index % items.length) + 1} de Instagram`}
                onOpen={() => setLightboxIndex(index % items.length)}
                onVideoVencido={marcarVencido}
              />
            ))}
          </div>
        </div>
        ) : null}
      </div>
      <ImageLightbox
        images={items}
        initialIndex={lightboxIndex < 0 ? 0 : lightboxIndex}
        isOpen={lightboxIndex >= 0}
        onClose={() => setLightboxIndex(-1)}
        label="Instagram"
      />
    </section>
  )
}

export default InstagramSection
