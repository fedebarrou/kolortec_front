/**
 * ScrollRenderer — hero scrolltelling público. Dos modos (settings.interactionMode):
 *  - 'continuous': el timeline sigue proporcionalmente al scroll (comportamiento
 *    histórico); elementos aparecen/desaparecen por timing {from,to}.
 *  - 'snap' (kolortec): un gesto = un paso; el video/frames tweenea del marker
 *    actual al del siguiente step en snap.stepDurationMs y recién al llegar se
 *    revela la info del step. Ver snapEngine.js y scroll-contract.js.
 *
 * PARIDAD: la lógica de reveal y el ScrubVideo coalescente deben coincidir con
 * el preview del admin (tiendita-front/app/(admin)/admin/hero-lab/_renderer/).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Background, animProps } from "./Background";
import { ElementView, boxAt } from "./elements/ElementView";
import { createSnapEngine } from "./snapEngine";
import { SnapChrome } from "./SnapChrome";
import { createBreathing, parallaxFor } from "./snapIdle";
import { SNAP_DEFAULTS, SCROLL_SIZE_COMPAT_DEFAULTS, scrollStepHeight, scrollStepPx, scrollBleedWidth, viewportScale } from "./scroll-contract";

/**
 * Full-bleed del escenario: lo saca del contenedor y lo lleva al ancho real de
 * la pantalla. Se aplica sólo con `settings.scrollFullWidth` encendido.
 *
 * No usa `100vw` (incluye la barra de scroll: dejaría ~10px de overflow, que en
 * kolortec tapa el overflow-x:clip pero en el store sería una barra horizontal
 * en toda la página) ni el 50% del padre (asume que el contenedor está
 * centrado, y el lienzo de kolortec no siempre lo está). Mide y corrige.
 *
 * Hasta que corre, el escenario se ve con el ancho del contenedor, que es el
 * comportamiento de siempre — no hay estado intermedio roto.
 */
function useBleed(enabled, ref) {
  const mlRef = useRef(0);
  useEffect(() => {
    const el = ref.current;
    if (!enabled) {
      mlRef.current = 0;
      if (el) { el.style.width = ""; el.style.maxWidth = ""; el.style.marginLeft = ""; }
      return;
    }
    // El margen NO se calcula con el 50% del padre: eso asume que el contenedor
    // está centrado en la pantalla, y no siempre lo está — el lienzo de kolortec
    // mide 1920 fijos y cuando la ventana es más angosta desborda hacia la
    // derecha en vez de centrarse, así que la cuenta daba 5px corrida.
    // Se corrige contra la posición REAL medida: cada pasada resta lo que al
    // elemento le falta para tocar el borde izquierdo. Converge en un paso y no
    // depende de cómo esté maquetado lo que lo contiene.
    const medir = () => {
      const nodo = ref.current;
      if (!nodo) return;
      const escala = viewportScale();
      const ancho = scrollBleedWidth();
      if (!ancho) return;
      const desvio = nodo.getBoundingClientRect().left / escala;
      const ml = Math.abs(desvio) < 0.5 ? mlRef.current : mlRef.current - desvio;
      mlRef.current = ml;
      nodo.style.width = `${ancho}px`;
      nodo.style.maxWidth = "none";
      nodo.style.marginLeft = `${ml}px`;
    };
    // Se escribe DIRECTO en el nodo en vez de pasar por estado de React.
    // Es una corrección que depende de medir el layout ya pintado, así que no
    // puede salir del render; y sobre todo, no puede depender de
    // requestAnimationFrame: en una pestaña en segundo plano rAF no corre, y el
    // hero quedaría sin el ancho hasta que alguien mire la pestaña.
    // React no las pisa: sólo toca las propiedades que están en su prop `style`,
    // y width/maxWidth/marginLeft nunca están ahí.
    medir();
    // ResizeObserver además del resize: cuando la historia hace crecer el
    // documento aparece la barra de scroll vertical y el ancho útil baja ~10px,
    // pero eso NO dispara `resize`. Sin observarlo el escenario queda 10px más
    // ancho que la pantalla — invisible en kolortec, que clipea el overflow,
    // pero en el store sería una barra horizontal en toda la página.
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(medir) : null;
    ro?.observe(document.documentElement);
    window.addEventListener("resize", medir);
    // Remediciones diferidas además del observer. La primera medición pasa
    // ANTES de que la historia haya estirado el documento, así que todavía no
    // existe la barra de scroll vertical y el ancho útil se lee 10px de más.
    // Los timers cubren ese momento sin depender del ResizeObserver, que no
    // entrega en todos los contextos. medir() es idempotente: si el valor no
    // cambió, reescribe lo mismo.
    const timers = [0, 250, 1000, 2500].map((ms) => setTimeout(medir, ms));
    return () => {
      timers.forEach(clearTimeout);
      ro?.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, [enabled, ref]);
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/* ── ScrubVideo — seek coalescente (espejo del admin _renderer/ScrubVideo.jsx) ──
   No encola seeks: guarda el objetivo y, al terminar el seek en vuelo (`seeked`),
   salta al último objetivo si cambió. Evita el jank del `currentTime=` naive. */
function ScrubVideo({ url, poster, progress, trim, reverse }) {
  const ref = useRef(null);
  const target = useRef(0);
  const seeking = useRef(false);
  const range = trim || { start: 0, end: 1 };

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const onSeeked = () => {
      if (Math.abs(video.currentTime - target.current) > 0.03) {
        try { video.currentTime = target.current; } catch {}
      } else seeking.current = false;
    };
    video.addEventListener("seeked", onSeeked);
    return () => video.removeEventListener("seeked", onSeeked);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const apply = () => {
      if (!video.duration || !Number.isFinite(video.duration)) return;
      const p = reverse ? 1 - progress : progress;
      target.current = clamp((range.start + p * Math.max(0, range.end - range.start)) * video.duration, 0, Math.max(0, video.duration - 0.05));
      if (!seeking.current) {
        seeking.current = true;
        try { video.currentTime = target.current; } catch {}
      }
    };
    if (video.readyState >= 1) apply();
    else video.addEventListener("loadedmetadata", apply, { once: true });
    return () => video.removeEventListener("loadedmetadata", apply);
  }, [progress, range.start, range.end, reverse]);

  return <video ref={ref} src={url} poster={poster} muted playsInline preload="auto" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />;
}

// ⚠ ACA HUBO UN RECORTE DE 0.62 EN MOVIL y se saco a proposito (sep-2026).
// Cerraba el encuadre —los frames traen ~38% de piso vacio abajo y se veia la base del
// producto— pero lo hacia AMPLIANDO el archivo, y ahi estaba el problema: los frames
// moviles son de 540x960 y un telefono de 390pt con dpr3 pide 1170x2532. Sin recorte ya
// se amplian x1.76; con el recorte pasaban a x2.84 (y a x4.26 en dpr3). O sea que el
// encuadre se pagaba con nitidez, y la decision fue priorizar que la imagen se vea como
// se subio.
// EL ARREGLO DE VERDAD es re-exportar la secuencia YA ENCUADRADA y en mas resolucion,
// asi el encuadre viene en el pixel y no hay nada que ampliar. Si eso llega, esto no
// vuelve: se borra la necesidad.

function ScrubFrames({ bg, progress, reverse, breakpoint }) {
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  // En móvil puede haber OTRA secuencia (bg.urlsMobile); sin ella, la de PC.
  const urls = breakpoint === "mobile" && Array.isArray(bg?.urlsMobile) && bg.urlsMobile.length
    ? bg.urlsMobile
    : (Array.isArray(bg?.urls) ? bg.urls : []);
  useEffect(() => {
    imagesRef.current = urls.map((url) => { const image = new Image(); image.decoding = "async"; image.src = url; return image; });
  }, [urls]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const images = imagesRef.current;
    if (!canvas || !images.length) return;
    const p = reverse ? 1 - progress : progress;
    const image = images[Math.max(0, Math.min(images.length - 1, Math.round(p * (images.length - 1))))];
    const paint = () => { if (!image.naturalWidth) return; canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; canvas.getContext("2d")?.drawImage(image, 0, 0); };
    if (image.complete) paint(); else image.addEventListener("load", paint, { once: true });
  }, [progress, reverse, urls.length]);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />;
}

/* ── Fondo compartido: la FUENTE ÚNICA global del scrolltelling ──
   En móvil puede usarse OTRO video (bg.urlMobile); si no está, se usa el mismo. */
const videoUrlFor = (bg, breakpoint) => (breakpoint === "mobile" && bg?.urlMobile ? bg.urlMobile : bg?.url);

function ScrollBackdrop({ config, progress, breakpoint, scrubAlways = false }) {
  const globalBg = config.background;
  // Los fondos con scrub pintan su propio <canvas>/<video> y NO pasan por
  // Background, asi que la animacion hay que ponersela desde afuera. Son
  // ortogonales: el scrub elige QUE frame se ve, la animacion transforma el
  // elemento entero. Sin esto, elegir una animacion para un fondo de frames o
  // de video en el admin no hacia absolutamente nada.
  const anim = animProps(globalBg);
  const conAnim = (nodo) => (anim
    ? <div className={anim.className} style={{ position: "absolute", inset: 0, ...anim.style }}>{nodo}</div>
    : nodo);
  if (globalBg?.type === "frames") return conAnim(<ScrubFrames bg={globalBg} progress={progress} reverse={config.settings.reverseVideo} breakpoint={breakpoint} />);
  if (globalBg?.type === "video" && (scrubAlways || config.settings.scrollScrubVideo)) {
    return conAnim(<ScrubVideo url={videoUrlFor(globalBg, breakpoint)} poster={globalBg.poster} progress={progress} trim={config.settings.videoTrim} reverse={config.settings.reverseVideo} />);
  }
  // Este camino SI pasa por Background, que ya se pone la clase solo.
  return <Background bg={globalBg} />;
}

/* ── Modo CONTINUO (histórico) ─────────────────────────────────────────────── */

function ScrollStage({ config, slide, breakpoint, time, duration, videoProgress = null }) {
  // videoProgress (0..1, mapping por marker) manda sobre el progreso local del step.
  const progress = videoProgress !== null ? videoProgress : clamp(time / duration, 0, 1);
  const globalBg = config.background;
  const themePreset = config.theme?.preset;
  // Curva de reveal UNIFICADA con el admin (_renderer/ScrollStage.jsx):
  // la duración de la animación del elemento define la ventana de entrada
  // (clamp 0.15s..mitad del rango; default 600ms), salida hasta .4s; persiste
  // si to >= duration.
  const reveal = (el) => {
    if (!el.timing) return 1;
    const { from, to } = el.timing;
    const enter = Math.min(Math.max((el.animation?.durationMs ?? 600) / 1000, 0.15), Math.max(0.01, (to - from) / 2));
    if (time <= from) return 0;
    if (time >= to) return to >= duration ? 1 : 0;
    if (time < from + enter) return (time - from) / enter;
    const exit = Math.min(0.4, Math.max(0.01, (to - from) / 2));
    if (time > to - exit) return (to - time) / exit;
    return 1;
  };
  return <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: config.theme?.colors?.bg || "#111", fontFamily: config.theme?.fontFamily || "var(--site-font, Inter, sans-serif)", containerType: "inline-size", containerName: "hc-stage" }}>
    <ScrollBackdrop config={config} progress={progress} breakpoint={breakpoint} />
    {slide.background?.type !== "none" && (!globalBg || globalBg.type === "none") ? <Background bg={slide.background} /> : null}
    {slide.overlay > 0 ? <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${slide.overlay})` }} /> : null}
    {/* El scrim es una propiedad del SLIDE, no del modo: hasta ahora el modo
        continuous no lo montaba y el preview del admin si, asi que una escena
        continuous con scrim se veia distinta en el editor que publicada. Se
        alinea hacia el editor —que es el que respeta la configuracion— porque
        hoy no hay ninguna escena continuous en produccion: riesgo cero. */}
    {slide.scrim && slide.scrim !== "none" ? <ScrollScrim breakpoint={breakpoint} variant={slide.scrim} /> : null}
    {[...(slide.elements || [])].filter((el) => !el.timing || (time >= el.timing.from && time <= el.timing.to)).sort((a, b) => a.z - b.z).map((el) => { const box = boxAt(el, breakpoint); return <div key={el.id} style={{ position: "absolute", left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`, zIndex: el.z }}><ElementView el={el} bp={breakpoint} reveal={reveal(el)} accentColor={config.theme?.colors?.primary} themePreset={themePreset} /></div>; })}
  </div>;
}

function ContinuousScrollRenderer({ config, breakpoint }) {
  const ref = useRef(null);
  const [time, setTime] = useState(0);
  const stepH = scrollStepHeight(config.settings, breakpoint);
  useBleed(config.settings?.scrollFullWidth ?? SCROLL_SIZE_COMPAT_DEFAULTS.scrollFullWidth, ref);
  const slides = (config.slides || []).filter((slide) => !slide.hidden);
  const fallbackDuration = config.settings.scrollDurationSec || 8;
  const durations = slides.map((slide) => config.settings.stepDurations?.[slide.id] || fallbackDuration);
  const totalDuration = durations.reduce((total, duration) => total + duration, 0) || fallbackDuration;
  useEffect(() => {
    let raf = 0;
    // Todo en píxeles FÍSICOS: getBoundingClientRect ya viene con el zoom del
    // contenedor aplicado, así que el alto del sticky tiene que venir de
    // scrollStepPx y no de innerHeight — si no, el recorrido termina antes o
    // después de donde se ve.
    const update = () => { const el = ref.current; if (!el) return; const rect = el.getBoundingClientRect(); const total = rect.height - scrollStepPx(config.settings, breakpoint); const p = total > 0 ? clamp(-rect.top / total, 0, 1) : 0; setTime(p * totalDuration); };
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update(); window.addEventListener("scroll", onScroll, true); window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll, true); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, [totalDuration, config.settings, breakpoint]);
  let stepIndex = 0;
  let stepStart = 0;
  for (let index = 0; index < durations.length; index += 1) {
    const stepEnd = stepStart + durations[index];
    if (time < stepEnd || index === durations.length - 1) { stepIndex = index; break; }
    stepStart = stepEnd;
  }
  const slide = slides[stepIndex];
  const duration = durations[stepIndex] || fallbackDuration;
  const stepTime = Math.max(0, Math.min(duration, time - stepStart));
  if (!slide) return null;
  // VIDEO MAPEADO POR PASO: durante el step i el video va de marker[i] a
  // marker[i+1] (último step → videoEndFraction; el resto del video no se usa).
  const markers = slides.map((s) => (typeof s.marker === "number" ? clamp(s.marker, 0, 1) : null));
  const haveMarkers = markers.length > 0 && markers.every((m) => m !== null);
  const videoEnd = typeof config.settings.videoEndFraction === "number" ? clamp(config.settings.videoEndFraction, 0, 1) : 1;
  let videoProgress = null;
  if (haveMarkers) {
    const segStart = markers[stepIndex];
    const segEnd = stepIndex < slides.length - 1 ? markers[stepIndex + 1] : Math.max(videoEnd, segStart);
    const u = duration > 0 ? clamp(stepTime / duration, 0, 1) : 0;
    videoProgress = clamp(segStart + u * (segEnd - segStart), 0, 1);
  }
  return <div ref={ref} data-scroll-hero style={{ position: "relative", height: Math.max(1, totalDuration) * 200 }}><div style={{ position: "sticky", top: 0, height: stepH }}><ScrollStage config={config} slide={slide} breakpoint={breakpoint} time={stepTime} duration={duration} videoProgress={videoProgress} /></div></div>;
}

/* ── Modo SNAP (kolortec) ──────────────────────────────────────────────────── */

// Scrim kolortec (4 capas fijas de legibilidad, ScrollytellingSection.jsx:435-444).
// Geometría/gradientes: app/globals.css bloque "Hero Labs: SnapChrome".
export function ScrollScrim({ breakpoint, variant }) {
  return (
    <div className={`scrolly-scrim${breakpoint === "mobile" ? " scrolly-scrim--mobile" : ""}${variant === "kolortec-light" ? " scrolly-scrim--light" : ""}`} aria-hidden="true">
      <span className="scrolly-scrim-1" />
      <span className="scrolly-scrim-2" />
      <span className="scrolly-scrim-3" />
      <span className="scrolly-scrim-4" />
    </div>
  );
}

function SnapStage({ config, slide, breakpoint, progress, arrived, leavingSlide = null, breatheG = 0, parallaxY = 0 }) {
  const themePreset = config.theme?.preset;
  const accentColor = config.theme?.colors?.primary;
  return <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: config.theme?.colors?.bg || "#111", fontFamily: config.theme?.fontFamily || "var(--site-font, Inter, sans-serif)", containerType: "inline-size", containerName: "hc-stage" }}>
    {/* Breathing (idle, kolortec): el fondo pulsa a grayscale y vuelve al color. */}
    <div style={{ position: "absolute", inset: 0, filter: breatheG > 0.01 ? `grayscale(${breatheG.toFixed(3)})` : undefined }}>
      <ScrollBackdrop config={config} progress={progress} breakpoint={breakpoint} scrubAlways />
    </div>
    {slide.overlay > 0 ? <div style={{ position: "absolute", inset: 0, background: `rgba(0,0,0,${slide.overlay})` }} /> : null}
    {slide.scrim && slide.scrim !== "none" ? <ScrollScrim breakpoint={breakpoint} variant={slide.scrim} /> : null}
    {/* Paso SALIENTE (Fase 1c, kolortec: bloques saliente/entrante montados a la
        vez): se mantiene ~700ms animando afuera (snapState="leaving") mientras
        el entrante hace lo mismo al revés — ver ElementView SNAP_TRANSITION. */}
    {leavingSlide ? [...(leavingSlide.elements || [])]
      .filter((el) => (el.z ?? 1) > 0)
      .sort((a, b) => a.z - b.z)
      .map((el, i) => {
        const box = boxAt(el, breakpoint);
        const drift = parallaxY ? (0.6 + i * 0.35) * parallaxY : 0;
        return <div key={`leaving:${el.id}`} style={{ position: "absolute", left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`, zIndex: Math.max(el.z ?? 1, 0), transform: drift ? `translateY(${drift.toFixed(1)}px)` : undefined }}>
          <ElementView el={el} bp={breakpoint} snapState="leaving" accentColor={accentColor} themePreset={themePreset} />
        </div>;
      }) : null}
    {[...(slide.elements || [])].sort((a, b) => a.z - b.z).map((el, i) => {
      const box = boxAt(el, breakpoint);
      // Capa de FONDO (z <= 0, p.ej. scrims/gradientes de legibilidad kolortec):
      // persiste durante el tween — sin fade-out, sin remount, sin parallax.
      const bgLayer = (el.z ?? 1) <= 0;
      // Parallax sutil (kolortec): cada capa deriva con un factor distinto.
      const drift = !bgLayer && parallaxY ? (0.6 + i * 0.35) * parallaxY : 0;
      // snapState (Fase 1c): key ESTABLE (sin nonce) — la transición CSS
      // pending→in anima en vez de desmontar/remontar por keyframe.
      const snapState = bgLayer ? undefined : (arrived ? "in" : "pending");
      return <div key={el.id} style={{
        position: "absolute", left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`, zIndex: Math.max(el.z ?? 1, 0),
        transform: drift ? `translateY(${drift.toFixed(1)}px)` : undefined,
        pointerEvents: bgLayer ? "none" : (arrived ? "auto" : "none"),
      }}><ElementView el={el} bp={breakpoint} snapState={snapState} accentColor={accentColor} themePreset={themePreset} /></div>;
    })}
  </div>;
}

// Debe coincidir con SNAP_TRANSITION de ElementView.jsx (.7s): cuánto se
// mantiene montado el paso saliente animando afuera (Fase 1c, snapState="leaving").
const LEAVE_MS = 700;

function SnapScrollRenderer({ config, breakpoint, logoUrl = null, brandLabel = null, isFirst = false }) {
  const wrapRef = useRef(null);
  const engineRef = useRef(null);
  const arrivedTimerRef = useRef(0);
  const leaveTimerRef = useRef(0);
  const touchAccRef = useRef(0);
  const touchYRef = useRef(null);
  // navRevealedRef: body.scrolly-nav-reveal se agrega UNA sola vez (kolortec:
  // la raya de entrada del navbar no se repite en cada pin/unpin, solo la
  // primera vez que se libera el takeover/hideNav del recorrido).
  const navRevealedRef = useRef(false);
  // Takeover (snap.takeover, sección PRIMERA de la página): null = todavía sin
  // aplicar (mount), true/false = estado ACTUAL de la clase body.scrolly-takeover.
  // lastYRef / reentryArmedRef: la historia se puede volver a entrar POR ABAJO
  // (el usuario sube desde el hero). Para eso hace falta saber la direccion del
  // scroll, que hasta ahora no se rastreaba en ningun lado. Ver onScroll.
  const lastYRef = useRef(0);
  const reentryArmedRef = useRef(true);
  const takeoverActiveRef = useRef(null);
  const skippingRef = useRef(false); // "Saltar" en curso (animación propia de scroll)
  const updateTakeoverRef = useRef(null);

  const slides = (config.slides || []).filter((slide) => !slide.hidden);
  const slidesRef = useRef(slides);
  slidesRef.current = slides;
  const markers = useMemo(
    () => slides.map((slide, i) => (typeof slide.marker === "number" ? clamp(slide.marker, 0, 1) : (slides.length > 1 ? i / (slides.length - 1) : 0))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slides.map((s) => `${s.id}:${s.marker}`).join("|")],
  );
  const snap = { ...SNAP_DEFAULTS, ...(config.settings.snap || {}) };
  // Takeover solo tiene efecto si ESTA historia es lo primero de la página
  // (isFirst, prop derivada en app/page.jsx del orden de secciones visibles).
  const takeoverEnabled = !!(isFirst && snap.takeover);

  const [stepIndex, setStepIndex] = useState(0);
  const [arrived, setArrived] = useState(true);
  // leavingSlide (Fase 1c, release step 1f): paso saliente montado ~700ms
  // mientras anima afuera — ver SnapStage. Release step (kolortec: gesto extra
  // que aterriza EXACTO al final del recorrido, snapEngine.js releaseStep):
  // pastEnd fuerza el paso "entrante" a quedar oculto también (nada llega
  // realmente al final) evitando el flash de arrived=true por el batching de
  // React cuando onStep/onArrived del release disparan sincrónicos.
  const [leavingSlide, setLeavingSlide] = useState(null);
  const pastEnd = stepIndex >= slides.length;
  const [progress, setProgress] = useState(markers[0] ?? 0);
  // Posición CONTINUA 0..1 del recorrido completo (kolortec "p"), derivada del
  // tween del engine (from/to = índices, t = fracción lineal) — alimenta el
  // fill continuo de SnapChrome y el hint (independiente del marker/video).
  const [position, setPosition] = useState(0);
  // Tamaño del escenario. `stepH` es el alto CSS de UN paso y `pasoPx()` el
  // mismo alto en píxeles FÍSICOS de scroll, que es contra lo que se comparan
  // los umbrales. Los dos salen del contrato para que no se separen: si el CSS
  // dice una cosa y el JS otra, los pasos disparan corridos.
  const stepH = scrollStepHeight(config.settings, breakpoint);
  useBleed(config.settings?.scrollFullWidth ?? SCROLL_SIZE_COMPAT_DEFAULTS.scrollFullWidth, wrapRef);
  const pasoPx = () => scrollStepPx(config.settings, breakpoint);

  // Efectos idle (kolortec): breathing (grayscale pulsante) + parallax sutil.
  const [breatheG, setBreatheG] = useState(0);
  const [parallaxY, setParallaxY] = useState(0);

  // --site-header-h: alto REAL del navbar del sitio. Se publica como var en el
  // wrap para que el spacer de la historia reserve ESE espacio fisico, de modo
  // que al terminar el recorrido la seccion siguiente no quede debajo del
  // navbar. Se mide (no se hardcodea) porque cambia entre desktop y movil.
  const [headerH, setHeaderH] = useState(0);
  useEffect(() => {
    const medir = () => {
      const el = document.querySelector(".site-header");
      setHeaderH(el ? Math.round(el.getBoundingClientRect().height) : 0);
    };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);
  // Chrome kolortec: hint hasta el primer gesto + gesto programático (flechas/Saltar).
  const [started, setStarted] = useState(false);
  const gestureRef = useRef(null);
  const logoClickRef = useRef(null);
  const arrivedRef = useRef(true);
  const fromIndexRef = useRef(0); // último step ARRIBADO (punto de partida del tween en curso)
  const toIndexRef = useRef(0);   // step destino del tween en curso

  useEffect(() => {
    if (!slides.length) return;
    const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const engine = createSnapEngine({
      markers,
      stepDurationMs: snap.stepDurationMs,
      gestureGapMs: snap.gestureGapMs,
      reducedMotion,
      releaseStep: true, // Fase 1f: paso virtual N — un gesto más tras el último
                          // step aterriza EXACTO al final del recorrido en vez de
                          // liberar el scroll de inmediato (kolortec :227-254).
      onProgress: (p, meta) => {
        setProgress(p);
        if (markers.length > 1) {
          const t = meta?.t ?? 1;
          const from = fromIndexRef.current;
          const to = toIndexRef.current;
          setPosition(clamp((from + t * (to - from)) / (markers.length - 1), 0, 1));
        }
      },
      onStep: (i) => {
        toIndexRef.current = i;
        setStepIndex(i);
        setArrived(false);
        arrivedRef.current = false;
        // Fase 1c: capturar el paso SALIENTE (el último arribado) y mantenerlo
        // montado LEAVE_MS animando afuera — kolortec: saliente/entrante
        // conviven mientras dura la transición.
        const outgoing = slidesRef.current[fromIndexRef.current];
        setLeavingSlide(outgoing || null);
        if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
        leaveTimerRef.current = setTimeout(() => setLeavingSlide(null), LEAVE_MS);
        if (arrivedTimerRef.current) clearTimeout(arrivedTimerRef.current);
      },
      onArrived: () => {
        if (arrivedTimerRef.current) clearTimeout(arrivedTimerRef.current);
        const land = () => { fromIndexRef.current = toIndexRef.current; setArrived(true); arrivedRef.current = true; };
        if (snap.revealDelayMs > 0) arrivedTimerRef.current = setTimeout(land, snap.revealDelayMs);
        else land();
      },
    });
    engineRef.current = engine;

    // Alto de un paso en píxeles reales de scroll. Antes era window.innerHeight
    // a secas, que solo coincide con lo pintado cuando el contenedor no escala.
    const vh = () => pasoPx();
    // Takeover: activo desde el MONTAJE (no recién al pinear) mientras
    // window.scrollY < wrapTop + N*vh, es decir, mientras no se haya scrolleado
    // por completo más allá del recorrido. wrapTop se mide en vivo (posición
    // documental actual del wrapper) — con la clase ya aplicada (header fuera
    // del flujo) da ~0, así que el corte real es "scrollY < N*vh".
    // El header (.site-header) pasa a position:fixed (CSS .scrolly-takeover) y
    // deja de reservar altura: el wrapper arranca en y=0 sin hueco. Para que
    // reaparecer no salte, compensamos el scroll en el mismo tick que togglea
    // la clase (excepto en el montaje, donde no hay nada previo que preservar).
    const updateTakeover = () => {
      if (!takeoverEnabled) return;
      if (skippingRef.current) return; // durante "Saltar" la animación propia decide cuándo togglear
      const wrap = wrapRef.current;
      if (!wrap) return;
      const wrapTop = window.scrollY + wrap.getBoundingClientRect().top;
      const active = window.scrollY < wrapTop + slides.length * vh();
      if (active === takeoverActiveRef.current) return;
      // headerH se mide SIEMPRE, tambien en el montaje. Antes se salteaba el
      // primer run (`!firstRun`) y el header salia del flujo sin compensar: el
      // documento perdia ~70px de un frame al otro y todo lo de abajo subia.
      // A scrollY=0 la compensacion es un no-op (queda clampeada), asi que no
      // cambia nada en la carga normal; solo deja de romper si no arranca en 0.
      const header = typeof document !== "undefined" ? document.querySelector(".site-header") : null;
      const headerH = header ? header.getBoundingClientRect().height : 0;
      const beforeY = window.scrollY;
      document.body.classList.toggle("scrolly-takeover", active);
      takeoverActiveRef.current = active;
      if (headerH > 0) {
        window.scrollTo({ top: Math.max(0, beforeY + (active ? -headerH : headerH)), behavior: "instant" });
      }
    };
    // Pinned = el sticky interno está fijo (el spacer cubre el viewport completo).
    const pinned = () => {
      const el = wrapRef.current;
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.top <= 1 && r.bottom >= vh() - 1;
    };
    const scrollToStep = (i) => {
      const el = wrapRef.current;
      if (!el) return;
      const top = window.scrollY + el.getBoundingClientRect().top;
      window.scrollTo({ top: top + i * vh(), behavior: reducedMotion ? "auto" : "smooth" });
    };
    // Tween manual por rAF (mismo que "Saltar" más abajo): un scrollTo nativo
    // se cancela si updateTakeover dispara SU PROPIO scrollTo de compensación
    // al cruzar el umbral del takeover — y el gesto release (Fase 1f) SIEMPRE
    // lo cruza (aterriza justo en el borde). skippingRef en true evita que
    // updateTakeover interfiera mientras dura; se recalcula al terminar.
    const smoothLandingTo = (targetY, onDone) => {
      // Sin animacion cuando NO PUEDE haberla: reduced-motion, o la pestaña en
      // segundo plano, donde rAF no corre y el tween no arrancaria nunca.
      const oculta = typeof document !== "undefined" && document.visibilityState === "hidden";
      if (reducedMotion || oculta) { window.scrollTo({ top: targetY, behavior: "instant" }); onDone?.(); return; }
      const startY = window.scrollY;
      const dur = 650;
      const t0 = performance.now();
      let terminado = false;
      const fin = () => { if (terminado) return; terminado = true; window.clearTimeout(guarda); onDone?.(); };
      // RED DE SEGURIDAD: si rAF se frena a mitad —el usuario cambia de pestaña—
      // el tween nunca llamaria a onDone, y quien lo invoca deja skippingRef en
      // true PARA SIEMPRE. Con eso updateTakeover sale por la puerta de atras en
      // cada scroll y el navbar se queda encima de la historia sin arreglo posible.
      const guarda = window.setTimeout(() => { window.scrollTo({ top: targetY, behavior: "instant" }); fin(); }, dur + 400);
      const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
      const tick = (now) => {
        if (terminado) return;
        const t = Math.min(1, (now - t0) / dur);
        window.scrollTo({ top: startY + (targetY - startY) * ease(t), behavior: "instant" });
        if (t < 1) requestAnimationFrame(tick); else fin();
      };
      requestAnimationFrame(tick);
    };
    // Logo del chrome (SnapChrome onLogoClick, kolortec: scrollTop): vuelve al
    // inicio de la historia (wrapTop), no al tope absoluto de la página.
    const scrollToTop = () => {
      const el = wrapRef.current;
      if (!el) return;
      const top = window.scrollY + el.getBoundingClientRect().top;
      window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
    };
    logoClickRef.current = scrollToTop;
    // Gesto → engine. Devuelve true si el evento debe capturarse (preventDefault).
    const gesture = (dir) => {
      setStarted(true);
      const result = engine.input(dir);
      if (result === "stepped") {
        if (engine.isReleaseStep()) {
          const el = wrapRef.current;
          if (el) {
            const top = window.scrollY + el.getBoundingClientRect().top;
            const targetY = top + engine.getStep() * vh();
            skippingRef.current = true;
            smoothLandingTo(targetY, () => { skippingRef.current = false; updateTakeover(); });
          }
        } else {
          scrollToStep(engine.getStep());
        }
      }
      return result !== "released"; // en los bordes se libera el scroll de la página
    };
    gestureRef.current = gesture;

    const onWheel = (e) => {
      if (!pinned()) return;
      if (gesture(e.deltaY > 0 ? 1 : -1)) e.preventDefault();
    };
    const onKey = (e) => {
      if (!pinned()) return;
      const down = e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey);
      const up = e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey);
      if (!down && !up) return;
      if (gesture(down ? 1 : -1)) e.preventDefault();
    };
    const onTouchStart = (e) => { touchYRef.current = e.touches[0]?.clientY ?? null; touchAccRef.current = 0; };
    const onTouchMove = (e) => {
      if (!pinned() || touchYRef.current == null) return;
      const y = e.touches[0]?.clientY ?? touchYRef.current;
      touchAccRef.current += touchYRef.current - y; // positivo = scrollear hacia abajo
      touchYRef.current = y;
      const dir = touchAccRef.current > 0 ? 1 : -1;
      if (Math.abs(touchAccRef.current) > 24) {
        touchAccRef.current = 0;
        if (gesture(dir)) e.preventDefault();
      } else if (engine.isLocked()) {
        e.preventDefault(); // mantener el pin mientras anima
      }
    };
    // Sync pasivo: scrollbar / anchors / entrar desde otra sección.
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrapRef.current;
        if (!el) return;
        updateTakeover();
        // Geometria del recorrido, en coordenadas de documento.
        const y = window.scrollY;
        const goingUp = y < lastYRef.current;
        lastYRef.current = y;
        const wrapTopY = y + el.getBoundingClientRect().top;
        const lastStepY = wrapTopY + Math.max(0, slides.length - 1) * vh();
        const endY = wrapTopY + slides.length * vh();
        // insideStory incluye la ULTIMA pantalla del spacer, donde pinned() ya es
        // false porque el sticky se esta despegando de forma nativa. La historia
        // sigue ocupando la pantalla ahi, asi que el navbar no puede aparecer.
        const insideStory = y >= wrapTopY - 1 && y < endY;
        document.body.classList.toggle("scrolly-nav-hidden", snap.hideNav && (pinned() || insideStory));

        // scrolly-nav-reveal solo tiene sentido FUERA de la historia, y hay que
        // sacarlo apenas volvemos a entrar. Su regla CSS es una `animation` con
        // fill-mode:both, y una animacion le gana a las declaraciones normales de
        // scrolly-takeover / scrolly-nav-hidden: mientras la clase siguiera puesta,
        // el navbar se quedaba visible ENCIMA del scrolltelling por mas que el
        // takeover se reactivara. Antes esto se limpiaba solo dentro del enganche
        // de re-entrada, que no corre si el usuario sube de un saque y se saltea
        // la banda de release.
        if (insideStory && document.body.classList.contains("scrolly-nav-reveal")) {
          navRevealedRef.current = false;
          document.body.classList.remove("scrolly-nav-reveal");
        }

        // Re-entrada POR ABAJO (ago-26). onWheel devuelve en seco si !pinned(), asi
        // que en la ultima pantalla del spacer el scroll quedaba nativo: al subir
        // desde el hero se veia la historia a medias, el texto del ultimo step
        // re-entraba con su transicion de 700ms y el primer gesto saltaba DOS
        // pantallas. Aca se detecta que el usuario vuelve a entrar y se lo aterriza
        // en el ultimo step real, con el engine sincronizado SIN animar (instant).
        if (goingUp && reentryArmedRef.current && !skippingRef.current && y > lastStepY && y < endY) {
          reentryArmedRef.current = false;
          skippingRef.current = true;
          engine.syncToStep(Math.max(0, slides.length - 1), { instant: true });
          smoothLandingTo(lastStepY, () => {
            skippingRef.current = false;
            updateTakeover();
          });
          return;
        }
        if (y >= endY) reentryArmedRef.current = true; // salio al hero: rearmar
        // Entrada del navbar con línea (Fase 1e, kolortec index.css:198-210):
        // solo si el menú estuvo oculto durante la historia (hideNav/takeover);
        // se agrega UNA sola vez, al liberar el recorrido por completo.
        if (!navRevealedRef.current && (snap.hideNav || takeoverEnabled)) {
          if (y >= endY) {
            navRevealedRef.current = true;
            document.body.classList.add("scrolly-nav-reveal");
          }
        }
        // Parallax sutil (kolortec): deriva de la distancia al punto pinned del step.
        if (snap.parallax && !reducedMotion) {
          const rel = -el.getBoundingClientRect().top - engine.getStep() * vh();
          setParallaxY(parallaxFor(rel));
        }
        if (engine.isLocked()) return; // scroll suave propio del snap
        const p = clamp(-el.getBoundingClientRect().top / vh(), 0, Math.max(0, slides.length - 1));
        const nearest = Math.round(p);
        if (nearest !== engine.getStep()) engine.syncToStep(nearest);
      });
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("scroll", onScroll, true);
    // Aplicar el takeover YA al montar (sin esperar el primer scroll): la
    // historia debe tapar el menú desde y=0, no recién al primer gesto.
    lastYRef.current = typeof window !== "undefined" ? window.scrollY : 0;
    updateTakeoverRef.current = updateTakeover;
    updateTakeover();
    // Lo mismo para hideNav: hasta ahora solo se aplicaba dentro de onScroll, asi
    // que una historia con hideNav pero SIN takeover (o que no fuera la primera
    // seccion) dejaba el navbar a la vista hasta el primer gesto de scroll.
    if (snap.hideNav) document.body.classList.toggle("scrolly-nav-hidden", pinned());
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("scroll", onScroll, true);
      if (arrivedTimerRef.current) clearTimeout(arrivedTimerRef.current);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
      cancelAnimationFrame(raf);
      document.body.classList.remove("scrolly-nav-hidden");
      document.body.classList.remove("scrolly-takeover");
      document.body.classList.remove("scrolly-nav-reveal");
      takeoverActiveRef.current = null;
      engine.destroy();
      engineRef.current = null;
      updateTakeoverRef.current = null;
      skippingRef.current = false;
      gestureRef.current = null;
      logoClickRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, slides.length, snap.stepDurationMs, snap.gestureGapMs, snap.revealDelayMs, takeoverEnabled]);

  // Breathing (idle): tras 5s sin interacción con el paso ya revelado, el fondo
  // pulsa a grayscale y vuelve (ciclo 4.2s) — kolortec. Cualquier gesto lo corta
  // (arrivedRef pasa a false apenas arranca un nuevo tween).
  useEffect(() => {
    if (!snap.breathing || !slides.length) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;
    const breathing = createBreathing({ isIdle: () => arrivedRef.current, onValue: setBreatheG });
    return () => breathing.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap.breathing, slides.length]);

  // "Saltar" (kolortec skipIntro): sale de la historia y aterriza en lo que
  // sigue. Animación propia por rAF (no `behavior:"smooth"`): un scrollTo
  // nativo se cancela con cualquier otro scrollTo intermedio (el snap, la
  // compensación del takeover) y quedaba a mitad de camino.
  const skip = () => {
    const wrap = wrapRef.current;
    const engine = engineRef.current;
    if (!wrap || !engine || skippingRef.current) return;
    const last = markers.length - 1;
    if (last < 0) return;
    const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const vh = pasoPx();
    const startY = window.scrollY;
    const wrapTop = startY + wrap.getBoundingClientRect().top;
    // MISMO punto que la salida natural: el final del spacer, ni un pixel mas.
    // NO se resta el alto del navbar — ese espacio ya lo reserva el margin-bottom
    // del wrap. Restarlo aca hacia que "Saltar" aterrizara headerH mas arriba que
    // scrollear hasta el final (medido: heroTop 184 vs 116), o sea dos resultados
    // distintos para la misma accion.
    const endY = wrapTop + slides.length * vh;
    setStarted(true);
    engine.syncToStep(last, { instant: true });
    skippingRef.current = true;
    const finish = () => {
      skippingRef.current = false;
      // Recalcular el takeover con la posición final (el header vuelve a ocupar
      // espacio → la compensación mantiene el punto de aterrizaje).
      updateTakeoverRef.current?.();
    };
    if (reducedMotion) { window.scrollTo({ top: endY, behavior: "instant" }); finish(); return; }
    const dur = 650;
    const t0 = performance.now();
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      window.scrollTo({ top: startY + (endY - startY) * ease(t), behavior: "instant" });      if (t < 1) requestAnimationFrame(tick); else finish();
    };
    requestAnimationFrame(tick);
  };

  // pastEnd (release step, Fase 1f): no hay slide propio en N — se clampea al
  // último real (sigue en pantalla, deslizándose por el sticky-unpin nativo).
  const slide = slides[Math.min(stepIndex, slides.length - 1)];
  if (!slide) return null;
  const accent = config.theme?.colors?.primary || "#fff";
  return <div ref={wrapRef} data-scroll-hero data-scroll-mode="snap" style={{
      "--site-header-h": `${headerH}px`,
      position: "relative",
      height: `calc(${Math.max(1, slides.length)} * ${stepH})`,
      // ESPACIO FISICO entre la historia y lo que sigue = alto del navbar + un
      // margen. Va como margin-bottom (FUERA del wrap) a proposito: sumarlo al
      // `height` no sirve — ahi el colchon queda DENTRO del spacer y solo alarga
      // el recorrido, la seccion siguiente igual termina apoyando en viewport 0.
      // Como margen exterior corre el inicio del proximo elemento en el
      // documento, asi que al terminar la historia queda debajo del navbar y con
      // aire. `--story-gap` para ajustar el margen por sitio.
      marginBottom: `calc(var(--site-header-h, 0px) + var(--story-gap, 2rem))`,
    }}>
    <div style={{ position: "sticky", top: 0, height: stepH, fontFamily: config.theme?.fontFamily || "var(--site-font, Inter, sans-serif)", containerType: "inline-size", containerName: "hc-stage" }}>
      <SnapStage config={config} slide={slide} breakpoint={breakpoint} progress={progress} arrived={arrived && !pastEnd} leavingSlide={leavingSlide} breatheG={snap.breathing ? breatheG : 0} parallaxY={snap.parallax ? parallaxY : 0} />
      <SnapChrome
        snap={snap}
        count={slides.length}
        index={Math.min(stepIndex, slides.length - 1)}
        position={position}
        started={started}
        breakpoint={breakpoint}
        accent={accent}
        logoUrl={logoUrl}
        brandLabel={brandLabel}
        onGesture={(dir) => gestureRef.current?.(dir)}
        onSkip={skip}
        onLogoClick={() => logoClickRef.current?.()}
        navHidden={snap.hideNav || takeoverEnabled}
      />
    </div>
  </div>;
}

/* ── Entry point ───────────────────────────────────────────────────────────── */

export function ScrollRenderer({ config, breakpoint, logoUrl = null, brandLabel = null, isFirst = false }) {
  if (config?.settings?.interactionMode === "snap") return <SnapScrollRenderer config={config} breakpoint={breakpoint} logoUrl={logoUrl} brandLabel={brandLabel} isFirst={isFirst} />;
  return <ContinuousScrollRenderer config={config} breakpoint={breakpoint} />;
}
