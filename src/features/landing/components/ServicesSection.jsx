import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

const DEFAULT_PILLAR_LABELS = ['Primer Pilar', 'Segundo Pilar', 'Tercer Pilar']
const TRAIL_WORDS = ['LIGHTING', 'QUALITY', 'SUPPORT', 'READY TO WORK', 'WARRANTY']

function PillarCard({ item, index, eyebrowLabel }) {
  const videoRef = useRef(null)
  const numberLabel = String(index + 1).padStart(2, '0')

  const play = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0
    const promise = v.play()
    if (promise && typeof promise.catch === 'function') promise.catch(() => {})
  }, [])

  const pause = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    v.currentTime = 0
  }, [])

  return (
    <article
      onMouseEnter={play}
      onMouseLeave={pause}
      onFocus={play}
      onBlur={pause}
      tabIndex={0}
      className="kt-pillar-card kt-landing-reveal-item group flex flex-col gap-3 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[10px] bg-[#0a0a0a]">
        {item.video ? (
          <video
            ref={videoRef}
            src={item.video}
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <img
            src={item.image}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.05]"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
        />
        <span
          aria-hidden="true"
          className="title-font pointer-events-none absolute bottom-2 left-3 text-[clamp(2.2rem,3.6vw,3.2rem)] font-black leading-none text-primary drop-shadow-[0_4px_18px_rgba(0,0,0,0.55)]"
        >
          {numberLabel}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="block h-[2px] w-5 bg-primary" />
          <span className="text-[0.6rem] font-black uppercase tracking-[0.22em] text-primary">
            {eyebrowLabel}
          </span>
        </div>
        <h3 className="title-font m-0 inline-flex items-baseline gap-[0.04em] text-[clamp(1.05rem,1.7vw,1.45rem)] uppercase tracking-[0.05em] leading-[1.02] text-white">
          {item.title}
          <span className="text-primary">.</span>
        </h3>
        {item.subtitle ? (
          <p className="m-0 text-[0.78rem] leading-[1.4] text-[#aeb5bf]">
            {item.subtitle}
          </p>
        ) : null}
      </div>
    </article>
  )
}

function ServicesSection({ services }) {
  const { t } = useLanguage()
  const items = services.items ?? []
  const sectionTitle = t('landing.services.title', services.title)
  const sectionEyebrow = t('landing.services.eyebrow', 'Why Kolortec')
  const translatedItems = t('landing.services.items', null)
  const pillarLabels = t('landing.services.pillarLabels', DEFAULT_PILLAR_LABELS)

  const [tickIndex, setTickIndex] = useState(0)
  const wordRef = useRef(null)

  useEffect(() => {
    const el = wordRef.current
    if (!el) return undefined

    let timeouts = []

    const scheduleMidCycle = () => {
      timeouts = [
        window.setTimeout(() => setTickIndex((t) => t + 1), 1620),
        window.setTimeout(() => setTickIndex((t) => t + 1), 4680),
      ]
    }

    const onIteration = () => {
      setTickIndex((t) => t + 1)
      timeouts.forEach((id) => window.clearTimeout(id))
      scheduleMidCycle()
    }

    scheduleMidCycle()
    el.addEventListener('animationiteration', onIteration)
    return () => {
      el.removeEventListener('animationiteration', onIteration)
      timeouts.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  const isLogoTick = tickIndex % 2 === 1
  const currentWord = TRAIL_WORDS[Math.floor(tickIndex / 2) % TRAIL_WORDS.length]

  const mergedItems = items.map((item, i) => ({
    ...item,
    title: translatedItems?.[i]?.title ?? item.title,
    subtitle: translatedItems?.[i]?.subtitle ?? item.subtitle,
  }))

  return (
    <section
      className="kt-pillars-section px-6 pt-[clamp(72px,10vw,112px)] pb-[clamp(8px,1.5vw,20px)] lg:px-40 kt-section-reveal"
      id="services"
      style={{ '--reveal-delay': '200ms' }}
    >
      <div className="kt-pillar-title kt-landing-reveal-item mb-10 flex flex-col gap-2 sm:mb-14">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="block h-[2px] w-8 bg-primary" />
          <span className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-primary">
            {sectionEyebrow}
          </span>
        </div>
        <h2 className="title-font m-0 text-left text-[clamp(1.6rem,4.1vw,3.1rem)] leading-[1.02]">
          {sectionTitle}
          <span className="text-primary">.</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6 lg:gap-7">
        {mergedItems.map((item, i) => (
          <PillarCard
            key={item.title}
            item={item}
            index={i}
            eyebrowLabel={pillarLabels?.[i] ?? `Pilar ${String(i + 1).padStart(2, '0')}`}
          />
        ))}
      </div>

      <div
        className="kt-stair-trail pointer-events-none relative -mx-6 mt-12 h-8 sm:mt-20 lg:-mx-40 lg:mt-24 lg:h-10"
        aria-hidden="true"
      >
        <svg
          className="absolute inset-0 h-full w-full overflow-visible"
          viewBox="0 0 300 80"
          preserveAspectRatio="none"
          style={{
            filter: 'drop-shadow(0 0 4px rgba(244,223,51,0.45))',
          }}
        >
          <path
            d="M 0 80 L 100 80 L 100 40 L 200 40 L 200 0 L 300 0"
            fill="none"
            stroke="#f4df33"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            opacity="0.55"
          />
        </svg>
        <span ref={wordRef} className="kt-stair-trail-word">
          {isLogoTick ? (
            <span
              aria-hidden="true"
              className="inline-block h-3.5 w-3.5"
              style={{
                backgroundColor: '#f4df33',
                WebkitMask: "url('/assets/logo_minimal.png') center / contain no-repeat",
                mask: "url('/assets/logo_minimal.png') center / contain no-repeat",
              }}
            />
          ) : (
            currentWord
          )}
        </span>
      </div>
    </section>
  )
}

export default ServicesSection
