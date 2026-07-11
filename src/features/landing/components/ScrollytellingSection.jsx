import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { SCROLLY_BRANDS } from './scrollyBrands'
import { useLanguage } from '../../../shared/i18n/LanguageProvider'

// Frame-sequence: en vez de scrubbear el <video> (que hace jank al hacer seek), pre-cargamos los
// frames como imágenes y swapeamos la que corresponde al progreso del scroll (swap cacheado = suave).
const FRAME_COUNT = 180
const LOGO = '/assets/Grupo-Kolortec-1024x150.jpeg'
const SHOW_SCROLLY_BRANDS = false // logos del step 2 (luzu/telefe/olga/vorterix) ocultos "de momento"
// Scrollytelling POR PASOS (aprobado en prototipo): cada cruce de umbral dispara una animación de frames
// de DURACIÓN FIJA con curva lineal → la imagen no "vuela" por scrollear rápido; rate-limited a 1 paso.
const STEP_DURATION = 1100 // ms por transición entre pasos (el lock dura esto: no se avanza mientras anima)
const IDLE_DELAY    = 5000 // ms quieto antes de activar el breathing
const BREATHE_PERIOD = 4200 // ms por ciclo color→gris→color
const GUIDE_DELAY   = 7000 // ms ADICIONALES en breathing antes de mostrar el panel guía lateral
const SPACER_VH = 450      // alto del spacer (define el rango de scroll del intro)
const GESTURE_GAP = 130    // ms de silencio entre eventos = nuevo gesto (evita que 1 swipe con inercia larga avance 2 steps)

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

function ScrollytellingSection({ lines = [] }) {
  const { t } = useLanguage()
  // Mensajes de MARCA (pilares KOLORTEC) vía i18n (ES/EN). Step 4 eyebrow "Ready to work" queda FIJO.
  const MESSAGES = useMemo(
    () => [
      { eyebrow: t('landing.scrolly.step1.eyebrow', 'Calidad'), title: t('landing.scrolly.step1.title', 'Construidos para rendir'), subtitle: t('landing.scrolly.step1.subtitle', 'Línea propia, testeada y fabricada para aguantar giras, clima y uso intensivo.') },
      { eyebrow: t('landing.scrolly.step2.eyebrow', 'Presencia'), title: t('landing.scrolly.step2.title', 'Presencia en escena'), subtitle: t('landing.scrolly.step2.subtitle', 'Óptica y potencia que definen el espacio y se imponen en cualquier escenario.') },
      { eyebrow: t('landing.scrolly.step3.eyebrow', 'Soporte'), title: t('landing.scrolly.step3.title', 'Respaldo que no falla'), subtitle: t('landing.scrolly.step3.subtitle', 'Soporte técnico, repuestos y mantenimiento de fábrica: tu equipo, siempre listo.'), cta: { label: t('landing.scrolly.step3.cta', 'Ir a soporte'), href: '/soporte' } },
      { eyebrow: 'Ready to work', title: t('landing.scrolly.step4.title', 'Listos para usar'), subtitle: t('landing.scrolly.step4.subtitle', 'Salen de fábrica listos para trabajar — los conectás y el show arranca.'), cta: { label: t('landing.scrolly.step4.cta', 'Ver productos'), href: '/products' } },
    ],
    [t],
  )
  const spacerRef = useRef(null)
  const layerRef = useRef(null)
  const imgRef = useRef(null)
  const hintRef = useRef(null)
  const segRefs = useRef([])
  const blockRefs = useRef([])
  const lastFrameRef = useRef(-1)
  const rafRef = useRef(0)
  const stepRef = useRef(-1)        // paso actual (0..N-1); -1 = sin inicializar
  const frameFloatRef = useRef(0)   // frame mostrado (float) que el tween anima
  const tweenRef = useRef(null)     // { from, to, start } | null (null = pausado en un paso)
  const tweenRafRef = useRef(0)
  const idleTimerRef = useRef(0)
  const breatheRafRef = useRef(0)
  // Panel guía: aparece tras GUIDE_DELAY de breathing; cualquier interacción lo cierra (vía stopBreathing).
  const [guideOpen, setGuideOpen] = useState(false)
  const guideTimerRef = useRef(0)
  const stopIdleExternalRef = useRef(() => {})

  // Set de frames por viewport: mobile = video PORTRAIT (scrolly-frames-mobile); desktop = landscape.
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const framesDir = isMobile ? 'scrolly-frames-mobile' : 'scrolly-frames'
  const frameUrl = (i) => `/assets/${framesDir}/f${String(i).padStart(3, '0')}.jpg`

  const reduced =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false

  // Pre-cargar todos los frames (para que el swap sea instantáneo/suave).
  useEffect(() => {
    if (reduced) return undefined
    const imgs = []
    for (let i = 0; i < FRAME_COUNT; i++) {
      const im = new Image()
      im.src = frameUrl(i)
      imgs.push(im)
    }
    return () => { imgs.length = 0 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, framesDir])

  // Scroll → PASO discreto → tween EASED del frame (desacoplado de la velocidad del scroll: la imagen
  // no "vuela") + crossfade del mensaje + indicador + release del navbar. Rate-limited a 1 paso por vez.
  useEffect(() => {
    if (reduced) return undefined
    const N = MESSAGES.length
    // Frame objetivo de cada paso, repartido en 0..179.
    const STOP_FRAMES = Array.from({ length: N }, (_, i) => Math.round((i / (N - 1)) * (FRAME_COUNT - 1)))
    stepRef.current = -1
    frameFloatRef.current = STOP_FRAMES[0]
    lastFrameRef.current = -1

    // ── BREATHING: fondo pulsa grayscale cuando el usuario queda quieto 5s en un paso ────────────────
    const startBreathing = () => {
      const t0 = window.performance.now()
      const tick = (now) => {
        const phase = ((now - t0) % BREATHE_PERIOD) / BREATHE_PERIOD
        const g = (1 - Math.cos(phase * 2 * Math.PI)) / 2 // 0→1→0, sin salto al arrancar
        if (imgRef.current) imgRef.current.style.filter = `grayscale(${g})`
        breatheRafRef.current = window.requestAnimationFrame(tick)
      }
      breatheRafRef.current = window.requestAnimationFrame(tick)
      // Si sigue respirando GUIDE_DELAY más, entra el panel guía desde la izquierda.
      clearTimeout(guideTimerRef.current)
      guideTimerRef.current = setTimeout(() => setGuideOpen(true), GUIDE_DELAY)
    }
    const stopBreathing = () => {
      if (breatheRafRef.current) { window.cancelAnimationFrame(breatheRafRef.current); breatheRafRef.current = 0 }
      if (imgRef.current) imgRef.current.style.filter = ''
      clearTimeout(guideTimerRef.current)
      setGuideOpen(false)
    }
    const armIdle = () => {
      stopBreathing()
      clearTimeout(idleTimerRef.current)
      if (reduced) return
      idleTimerRef.current = setTimeout(() => {
        if (!reduced && !tweenRef.current) startBreathing()
      }, IDLE_DELAY)
    }
    const stopIdle = () => {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = 0
      stopBreathing()
    }
    stopIdleExternalRef.current = stopIdle // los clicks del panel guía cortan el ciclo idle
    // ─────────────────────────────────────────────────────────────────────────────────────────────────

    const showFrame = (f) => {
      const fi = clamp(Math.round(f), 0, FRAME_COUNT - 1)
      if (imgRef.current && fi !== lastFrameRef.current) { imgRef.current.src = frameUrl(fi); lastFrameRef.current = fi }
    }
    const scheduleUpdate = () => { if (!rafRef.current) rafRef.current = window.requestAnimationFrame(update) }
    const tweenTick = (now) => {
      tweenRafRef.current = 0
      const tw = tweenRef.current
      if (!tw) return
      const t = Math.min(1, (now - tw.start) / STEP_DURATION) // curva LINEAL (aprobada en prototipo)
      frameFloatRef.current = tw.from + (tw.to - tw.from) * t
      showFrame(frameFloatRef.current)
      if (t < 1) tweenRafRef.current = window.requestAnimationFrame(tweenTick)
      else { frameFloatRef.current = tw.to; tweenRef.current = null; setActiveStep(stepRef.current); scheduleUpdate(); armIdle() } // escena ya cambió → recién ahí aparece el mensaje del paso nuevo
    }
    const startTween = (toFrame) => {
      tweenRef.current = { from: frameFloatRef.current, to: toFrame, start: window.performance.now() }
      if (!tweenRafRef.current) tweenRafRef.current = window.requestAnimationFrame(tweenTick)
    }
    const setActiveStep = (s) => {
      for (let i = 0; i < N; i++) {
        const block = blockRefs.current[i]
        if (block) { block.style.opacity = i === s ? '1' : '0'; block.style.transform = `translateY(${i === s ? 0 : 26}px)` }
      }
    }

    const update = () => {
      rafRef.current = 0
      const spacer = spacerRef.current
      const layer = layerRef.current
      if (!spacer || !layer) return
      const r = spacer.getBoundingClientRect()
      const vh = window.innerHeight
      const total = r.height - vh
      const p = total > 0 ? clamp(-r.top / total, 0, 1) : 0

      // Salida suave: al salir el spacer, el layer se desliza (scroll-away) revelando la sección siguiente
      // + el navbar. `releaseY` = 0 mientras está pinned, negativo cuando `r.bottom < vh`.
      const releaseY = Math.min(0, r.bottom - vh)
      const visible = r.bottom > 0 && r.top < vh
      layer.style.transform = `translate3d(0, ${releaseY}px, 0)`
      layer.style.opacity = visible ? '1' : '0'
      // La capa es `pointer-events-none`: "Inicio" y los CTA quedan clickeables por su pointer-events-auto.

      // El PASO lo maneja el snap (rueda/touch/teclado) de forma directa — update() NO lo avanza por
      // posición de scroll (eso causaba salteos al variar el timing por pantalla). Acá solo el init.
      if (stepRef.current < 0) {
        const s0 = clamp(Math.round(p * (N - 1)), 0, N - 1)
        stepRef.current = s0; frameFloatRef.current = STOP_FRAMES[s0]; showFrame(STOP_FRAMES[s0]); setActiveStep(s0)
      }

      // Indicador (progreso continuo por p) + hint.
      for (let i = 0; i < N; i++) { const seg = segRefs.current[i]; if (seg) seg.style.width = `${(clamp(p * N - i, 0, 1) * 100).toFixed(1)}%` }
      if (hintRef.current) hintRef.current.style.opacity = p > 0.03 ? '0' : '1'
    }

    const onScroll = () => scheduleUpdate()

    // ── SNAP 1-scroll-1-paso (feel del prototipo): mientras el intro está "pinned", cada gesto de scroll
    //    NO scrollea libre — hace snap al anchor del paso siguiente/anterior (sin scroll muerto). En los
    //    bordes (último+abajo / primero+arriba) NO se intercepta → el scroll sale normal (a Instagram / arriba).
    let lockUntil = 0       // fin de la animación en curso: no se avanza mientras corre
    let lastInputAt = -1    // ts del último evento de rueda/teclado → detectar fin de gesto (hueco de silencio)
    const inIntro = () => {
      const s = spacerRef.current
      if (!s) return false
      const r = s.getBoundingClientRect()
      // El intro "captura" mientras el spacer solape el viewport (el visual fixed está en pantalla).
      return r.bottom > 1 && r.top < window.innerHeight - 1
    }
    const snap = (dir) => {
      stopBreathing() // durante la transición el fondo va siempre en color
      const cur = clamp(stepRef.current < 0 ? 0 : stepRef.current, 0, N - 1)
      const target = cur + dir
      if (target < 0 || target > N - 1) return
      // El paso lo maneja el SNAP directo (no update()/scroll) → 1 gesto = 1 step exacto, sin salteos ni
      // dependencia del timing del scroll (que variaba por pantalla). Lock inmediato por toda la transición.
      stepRef.current = target
      startTween(STOP_FRAMES[target])
      setActiveStep(-1) // ocultar el mensaje actual (fade-out); el nuevo aparece al terminar el tween
      // Reposicionar el scroll a la FRACCIÓN del rango pinneado REAL (medido en vivo) → cada paso queda
      // pinned (releaseY=0), y el último cae EXACTO en el borde (no se pasa/revela Instagram). Zoom-agnóstico.
      const sp = spacerRef.current
      if (sp) {
        const r = sp.getBoundingClientRect()
        const vh = window.innerHeight
        const spacerTopDoc = window.scrollY + r.top      // offset del spacer en el documento (consistente)
        const pinned = Math.max(0, r.height - vh)        // rango donde el portal queda pinned (releaseY=0)
        const targetY = spacerTopDoc + (N > 1 ? target / (N - 1) : 0) * pinned
        window.scrollTo({ top: targetY, behavior: 'smooth' })
      }
      lockUntil = window.performance.now() + STEP_DURATION
    }
    const wantsCapture = (dir) => inIntro() && !(dir > 0 && stepRef.current >= N - 1) && !(dir < 0 && stepRef.current <= 0)
    const onWheel = (e) => {
      stopIdle() // cualquier actividad corta el breathing y resetea; el próximo settle lo re-arma
      const dir = e.deltaY > 0 ? 1 : e.deltaY < 0 ? -1 : 0
      if (!dir || !wantsCapture(dir)) return
      e.preventDefault()
      const now = window.performance.now()
      const gap = lastInputAt < 0 ? Infinity : now - lastInputAt
      lastInputAt = now
      if (now < lockUntil) return    // animando (o inercia mientras corre la animación)
      if (gap < GESTURE_GAP) return  // mismo gesto continuo (cola de inercia tras la animación)
      snap(dir)                       // gesto nuevo + animación terminada → 1 step
    }
    // Touch: 1 swipe = 1 step (flag por-toque; el touchmove para al levantar el dedo, sin cola de inercia).
    let touchY = null
    let touchArmed = false
    const onTouchStart = (e) => { touchY = e.touches[0].clientY; touchArmed = true }
    const onTouchMove = (e) => {
      stopIdle()
      if (touchY === null) return
      const dy = touchY - e.touches[0].clientY
      const dir = dy > 0 ? 1 : dy < 0 ? -1 : 0
      if (!dir || !wantsCapture(dir)) return
      if (Math.abs(dy) > 6) e.preventDefault()
      if (touchArmed && Math.abs(dy) > 42 && window.performance.now() >= lockUntil) { snap(dir); touchArmed = false }
    }
    const onTouchEnd = () => { touchY = null; touchArmed = false }
    const onKey = (e) => {
      stopIdle()
      const down = e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' '
      const up = e.key === 'ArrowUp' || e.key === 'PageUp'
      const dir = down ? 1 : up ? -1 : 0
      if (!dir || !wantsCapture(dir)) return
      e.preventDefault()
      const now = window.performance.now()
      const gap = lastInputAt < 0 ? Infinity : now - lastInputAt
      lastInputAt = now
      if (now < lockUntil || gap < GESTURE_GAP) return
      snap(dir)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKey)
    showFrame(STOP_FRAMES[0])
    setActiveStep(0)
    update()
    armIdle() // si el usuario no scrollea, a los 5s el step 0 también respira
    // Robustez: re-correr tras el paint del portal (refs/layout listos) para fijar el estado inicial.
    const initRaf = window.requestAnimationFrame(() => window.requestAnimationFrame(update))
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKey)
      window.cancelAnimationFrame(initRaf)
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
      if (tweenRafRef.current) window.cancelAnimationFrame(tweenRafRef.current)
      clearTimeout(idleTimerRef.current)
      if (breatheRafRef.current) window.cancelAnimationFrame(breatheRafRef.current)
      if (imgRef.current) imgRef.current.style.filter = ''
      clearTimeout(guideTimerRef.current)
      stopIdleExternalRef.current = () => {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, framesDir])

  const closeGuide = () => {
    stopIdleExternalRef.current()
    setGuideOpen(false)
  }
  // "Destacados": mismo patrón que skipIntro — scroll programático (el hash #products no es confiable
  // con el spacer fixed encima); el scroll dispara update() y el layer se apaga solo.
  const goToFeatured = () => {
    closeGuide()
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // "Inicio" saltea el scrollytelling: scrollea a la sección que sigue al spacer (Instagram).
  const skipIntro = () => {
    const next = spacerRef.current?.nextElementSibling
    if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else window.scrollTo({ top: window.innerHeight * 3.6, behavior: 'smooth' })
  }

  // Bloque de mensaje. El reveal (opacity + rise) lo maneja update() por scroll, seteando `opacity` y
  // la var `--ty` en el div raíz; cada línea aplica un factor distinto de --ty → parallax por capas.
  const TextBlock = ({ m, index }) => (
    <div
      ref={(el) => { blockRefs.current[index] = el }}
      className="pointer-events-none absolute inset-0 flex items-end justify-center px-5 pb-16 will-change-[transform,opacity] transition-[opacity,transform] duration-[600ms] ease-out md:items-center md:justify-end md:px-6 md:pb-0 lg:px-16 xl:pl-24 xl:pr-40"
      style={{ opacity: index === 0 ? 1 : 0, transform: index === 0 ? 'translateY(0)' : 'translateY(26px)' }}
    >
      <div className="max-w-[40rem] text-center md:text-right will-change-[filter]" style={{ filter: 'blur(var(--blur, 0px))' }}>
        <span
          className="flex items-center justify-center gap-2.5 md:justify-end"
          style={{ transform: 'translateY(calc(var(--ty, 0px) * 0.6))' }}
        >
          <span className="h-[2px] w-9 origin-center bg-primary md:origin-right" style={{ transform: 'scaleX(var(--rv, 1))' }} aria-hidden="true" />
          <span className="text-[0.72rem] font-bold uppercase tracking-[0.24em] text-primary">{m.eyebrow}</span>
        </span>
        <h2
          className="title-font mt-3 text-[clamp(1.9rem,6vw,4.6rem)] font-black leading-[0.98] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.9),0_1px_3px_rgba(0,0,0,0.85)]"
          style={{ transform: 'translateY(var(--ty, 0px))' }}
        >
          {m.title}<span className="text-primary">.</span>
        </h2>
        <p
          className="mt-4 mx-auto max-w-[42ch] text-[clamp(0.95rem,1.6vw,1.25rem)] leading-[1.55] text-[#eef0f4] [text-shadow:0_1px_12px_rgba(0,0,0,0.9)] md:ml-auto md:mx-0"
          style={{ transform: 'translateY(calc(var(--ty, 0px) * 1.35))' }}
        >
          {m.subtitle}
        </p>

        {/* Step 1 (Calidad): chips con las líneas de producto (#linea). */}
        {index === 0 && lines.length > 0 ? (
          <ul
            className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1.5 md:justify-end"
            style={{ transform: 'translateY(calc(var(--ty, 0px) * 1.5))' }}
          >
            {lines.map((l) => (
              <li key={l} className="text-[0.82rem] font-semibold text-white/70">
                <span className="text-primary">#</span>
                {l}
              </li>
            ))}
          </ul>
        ) : null}

        {/* Step 2 (Presencia): logos (blancos) de dónde se usan equipos KOLORTEC. Ocultos de momento. */}
        {index === 1 && SHOW_SCROLLY_BRANDS ? (
          <div
            className="mt-6 flex flex-col items-center gap-2.5 md:items-end"
            style={{ transform: 'translateY(calc(var(--ty, 0px) * 1.5))' }}
          >
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-white/75 md:justify-end">
              {SCROLLY_BRANDS.map((b) => (
                <span key={b.name} className={b.className} aria-label={b.name}>
                  {b.text}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {m.cta ? (
          <Link
            to={m.cta.href}
            className="pointer-events-auto mt-8 inline-flex min-h-11 items-center bg-primary px-7 text-[0.82rem] font-black uppercase tracking-[0.1em] text-black shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition hover:brightness-105"
            style={{ transform: 'translateY(calc(var(--ty, 0px) * 1.1))' }}
          >
            {m.cta.label}
          </Link>
        ) : null}
      </div>
    </div>
  )

  // Reduced-motion: sección simple full-screen (primer frame + primer mensaje), sin scrub.
  if (reduced) {
    const m = MESSAGES[0]
    return (
      <section className="relative h-[100dvh] w-full overflow-hidden bg-deep-black">
        <img src={frameUrl(0)} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 hidden bg-gradient-to-l from-black/85 via-black/45 to-transparent md:block" />
        <div aria-hidden="true" className="absolute inset-0 hidden md:block" style={{ backgroundImage: 'radial-gradient(ellipse 58% 62% at 78% 50%, rgba(0,0,0,0.6), transparent 72%)' }} />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent md:hidden" />
        <div className="absolute inset-0 flex items-end justify-center px-5 pb-16 md:items-center md:justify-end md:px-6 md:pb-0 lg:px-16 xl:pr-40">
          <div className="max-w-[40rem] text-center md:text-right">
            <span className="block text-[0.72rem] font-bold uppercase tracking-[0.24em] text-primary">{m.eyebrow}</span>
            <h2 className="title-font mt-3 text-[clamp(1.9rem,6vw,4.6rem)] font-black leading-[0.98] text-white">
              {m.title}<span className="text-primary">.</span>
            </h2>
            <p className="mt-4 mx-auto max-w-[42ch] text-[clamp(0.95rem,1.6vw,1.25rem)] leading-[1.55] text-[#e6e9ef] md:ml-auto md:mx-0">{m.subtitle}</p>
            {lines.length > 0 ? (
              <ul className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1.5 md:justify-end">
                {lines.map((l) => (
                  <li key={l} className="text-[0.82rem] font-semibold text-white/70">
                    <span className="text-primary">#</span>
                    {l}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>
    )
  }

  // Layer VISUAL portaleado a document.body → escapa el `.kt-zoom-canvas` (zoom/overflow-clip/width fijo)
  // que rompía el sticky y el full-bleed. `position: fixed` full-viewport real.
  const layer =
    typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={layerRef}
            className="pointer-events-none fixed inset-0 z-[5] opacity-0 transition-opacity duration-200"
            style={{ willChange: 'transform, opacity' }}
            aria-label="Kolortec — iluminación profesional"
          >
            <img ref={imgRef} src={frameUrl(0)} alt="" draggable="false" className="absolute inset-0 h-full w-full object-cover" />
            {/* Scrims para legibilidad. Desktop: gradiente derecho + spotlight (texto a la derecha).
                Mobile: gradiente INFERIOR fuerte (texto abajo). Vertical (top-bar/indicador) en ambos. */}
            <div aria-hidden="true" className="absolute inset-0 hidden bg-gradient-to-l from-black/85 via-black/45 to-transparent md:block" />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/50" />
            <div
              aria-hidden="true"
              className="absolute inset-0 hidden md:block"
              style={{ backgroundImage: 'radial-gradient(ellipse 58% 62% at 78% 50%, rgba(0,0,0,0.6), transparent 72%)' }}
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent md:hidden" />

            {/* Mini top-bar: branding + Inicio (el navbar real queda tapado por el portal) */}
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-6 py-4 lg:px-10 xl:px-20">
              <button type="button" onClick={scrollTop} className="pointer-events-auto flex items-center transition hover:opacity-80" aria-label="Kolortec — ir al inicio">
                <img src={LOGO} alt="Kolortec" className="h-6 w-auto object-contain" />
              </button>
              <button
                type="button"
                onClick={skipIntro}
                className="pointer-events-auto inline-flex min-h-11 items-center text-[0.72rem] font-bold uppercase tracking-[0.14em] text-slate-100 transition hover:text-primary xl:text-sm"
              >
                {t('landing.scrolly.skip', 'Inicio')}
              </button>
            </div>

            {/* Mensajes (uno visible por vez, reveal escalonado) */}
            {MESSAGES.map((m, i) => (
              <TextBlock key={m.title} m={m} index={i} />
            ))}

            {/* Indicador de progreso por pasos */}
            <div className="pointer-events-none absolute bottom-8 right-6 flex gap-2 lg:right-16 xl:right-40" aria-hidden="true">
              {MESSAGES.map((_, i) => (
                <div key={i} className="h-[3px] w-9 overflow-hidden rounded-full bg-white/20 sm:w-14">
                  <div ref={(el) => { segRefs.current[i] = el }} className="h-full w-0 bg-primary" />
                </div>
              ))}
            </div>

            {/* Panel guía lateral: entra desde la izquierda tras un rato de breathing (usuario quieto).
                Siempre montado para animar el slide; cerrado queda invisible y fuera del tab order. */}
            <aside
              aria-label={t('landing.scrolly.guide.aria', 'Guía rápida')}
              aria-hidden={!guideOpen}
              className={`absolute left-0 top-1/2 z-[8] w-[min(280px,78vw)] -translate-y-1/2 rounded-r-2xl border-y border-r border-[rgba(244,223,51,0.38)] bg-[rgba(15,15,16,0.92)] px-5 py-6 shadow-[0_18px_40px_rgba(0,0,0,0.42)] backdrop-blur-sm transition-[transform,opacity] duration-500 ease-out ${
                guideOpen
                  ? 'translate-x-0 opacity-100 pointer-events-auto'
                  : '-translate-x-full opacity-0 pointer-events-none invisible'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span className="h-[2px] w-6 bg-primary" aria-hidden="true" />
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary">
                  {t('landing.scrolly.guide.eyebrow', '¿Seguimos?')}
                </span>
              </span>
              <nav className="mt-3 grid gap-1">
                <Link
                  to="/login"
                  onClick={closeGuide}
                  className="flex min-h-11 items-center justify-between gap-3 text-[0.82rem] font-semibold text-[#eef0f4] transition hover:text-primary"
                >
                  {t('landing.scrolly.guide.join', '¿Querés formar parte?')}
                  <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">arrow_forward</span>
                </Link>
                <Link
                  to="/distribuidores"
                  onClick={closeGuide}
                  className="flex min-h-11 items-center justify-between gap-3 text-[0.82rem] font-semibold text-[#eef0f4] transition hover:text-primary"
                >
                  {t('landing.scrolly.guide.distributor', '¿Querés ser distribuidor?')}
                  <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">arrow_forward</span>
                </Link>
                <button
                  type="button"
                  onClick={goToFeatured}
                  className="flex min-h-11 items-center justify-between gap-3 text-left text-[0.82rem] font-semibold text-[#eef0f4] transition hover:text-primary"
                >
                  {t('landing.scrolly.guide.featured', '¿Querés ver nuestros destacados?')}
                  <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">arrow_downward</span>
                </button>
              </nav>
            </aside>

            {/* Hint "Scrolleá" (se desvanece al empezar) */}
            <div
              ref={hintRef}
              className="pointer-events-none absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-white/70 transition-opacity duration-500"
              aria-hidden="true"
            >
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.22em]">{t('landing.scrolly.hint', 'Scrolleá')}</span>
              <svg viewBox="0 0 24 24" className="h-5 w-5 animate-bounce stroke-current fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2]">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      {layer}
      {/* Spacer: crea la distancia de scroll; el visual va en el layer fixed portaleado a body. */}
      <div ref={spacerRef} data-scrolly-spacer className="w-full bg-deep-black" style={{ height: `${SPACER_VH}vh` }} aria-hidden="true" />
    </>
  )
}

export default ScrollytellingSection
