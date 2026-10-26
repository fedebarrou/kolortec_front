/**
 * scroll-contract.js — contrato del Hero scrolltelling (lado store).
 *
 * ⚠ COPIA SINCRONIZADA — la fuente de verdad de esta lógica vive en el admin:
 *   tiendita-front/app/(admin)/admin/hero-lab/_schema/labHeroAdapter.js
 *   (SNAP_DEFAULTS + normalizeScrollDesign). Si se edita allá, editar acá.
 *   Contrato completo: tiendita-front/docs/scroll-hero-contract.md
 *
 * Shape del labConfig scroll:
 *   settings.interactionMode : 'snap' | 'continuous' (ausente => 'continuous')
 *   settings.snap            : { stepDurationMs, gestureGapMs, revealDelayMs }
 *   background               : fuente ÚNICA global (video | frames)
 *   slides[].marker          : fracción 0..1 del tramo trimmed del video
 */

export const SNAP_DEFAULTS = { stepDurationMs: 1100, gestureGapMs: 130, revealDelayMs: 0, breathing: false, parallax: false, hideNav: false, progress: true, hint: true, stepArrows: false, skipButton: false, logoBar: false, takeover: false };
// Preset de diseños NUEVOS (look kolortec completo). Espejo de SNAP_KOLORTEC_PRESET
// en el admin (_schema/defaults.js); el store no lo usa, se expone por simetría.
// stepArrows:false — kolortec no tiene flechas laterales.
export const SNAP_KOLORTEC_PRESET = { stepDurationMs: 1100, gestureGapMs: 130, revealDelayMs: 0, breathing: true, parallax: true, hideNav: true, progress: true, hint: true, stepArrows: false, skipButton: true, logoBar: true, takeover: true };

/**
 * TAMAÑO del hero (modo CARRUSEL) — espejo de SIZE_COMPAT_DEFAULTS en el admin
 * (tiendita-front/app/(admin)/admin/hero-lab/_schema/defaults.js). Si se edita
 * allá, editar acá.
 *
 * Son DOS MODOS, que en los datos viajan como dos claves:
 *   full      → heroWidth:'full'      + fullHeight:true   (full-bleed + 100vh)
 *   contained → heroWidth:'contained' + fullHeight:false  (márgenes + alto fijo)
 * `contained` es el mismo concepto que el `.hero--contained` del renderer legacy
 * (tiendita-store/app/globals.css) y que `scene.viewport.hero_width`.
 *
 * Estos son los valores con los que se venía renderizando un diseño guardado al
 * que le falten esas claves. Sin este fallback ese diseño rendereaba
 * `height: undefined` (hero colapsado) en la web publicada, mientras el admin
 * lo mostraba a pantalla completa — el admin sí completa las claves ausentes
 * vía normalizeConfig(), el store no tenía equivalente.
 *
 * Un hero NUEVO nace en modo `contained`; eso lo decide el admin al crearlo
 * (newConfig()), no acá.
 */
export const SIZE_COMPAT_DEFAULTS = { heightDesktop: 420, heightMobile: 360, fullHeight: true, heroWidth: "full" };

/**
 * heroSizeMode(settings) -> 'full' | 'contained'
 * Espejo de heroSizeMode() en el admin (_schema/defaults.js). `full` SOLO si las
 * dos claves lo son; cualquier otra combinacion es contenedor.
 *
 * Lo usan los HOSTS que fuerzan un alto propio via `containerHeight`: ese prop
 * gana sobre el alto del diseno, asi que si lo pasan siempre el modo Encabezado
 * no se ve nunca. Deben pasarlo SOLO en modo `full`.
 */
export function heroSizeMode(settings) {
  const s = settings || {};
  const width = s.heroWidth ?? SIZE_COMPAT_DEFAULTS.heroWidth;
  const full = s.fullHeight ?? SIZE_COMPAT_DEFAULTS.fullHeight;
  return full && width === 'full' ? 'full' : 'contained';
}

/**
 * VIS-003 · ¿ELEGISTE «Pantalla completa»? true SOLO si el diseño trae las dos claves explícitas (fullHeight === true y heroWidth === 'full').
 * Un diseño sin esas claves tiene el alto de pantalla completa por COMPAT (heroSizeMode), pero eso no es una elección: se publica con su
 * radio y su sombra como siempre. Lo usa el HeroSection de la tienda para pasar `bleed` (radio 0 y sombra none).
 */
export function heroPantallaCompletaElegida(settings) {
  const s = settings && typeof settings === 'object' ? settings : {};
  return s.fullHeight === true && s.heroWidth === 'full';
}

/**
 * DEFAULTS DE UN ENCABEZADO (carrusel) QUE LLEGA SIN `settings` O SIN `theme` (o con algunas claves ausentes).
 * Espejo de newConfig() del admin (_schema/defaults.js): ahí normalizeConfig() completa lo ausente con estos valores antes de
 * mostrar el diseño, así que la web publicada tiene que completar lo mismo — si no, el Lab y la web difieren justo en lo que el
 * diseñador nunca tocó. check-hero-roundtrip.mjs compara estas dos tablas con newConfig() del admin.
 *   · theme.fontFamily '' = hereda la tipografía del sitio (--site-font), NO Inter a secas.
 *   · Las claves de tamaño NO van acá: las completa SIZE_COMPAT_DEFAULTS (arriba), igual que en el admin.
 */
export const CAROUSEL_SETTINGS_DEFAULTS = { mode: "carousel", autoplay: true, intervalMs: 5000, transition: "fade", loop: true, arrows: true, dots: true };
export const THEME_DEFAULTS = {
  colors: { primary: "#5b6cff", secondary: "#9c4dff", text: "#ffffff", bg: "#111111", accent: "#ffd54a" },
  fontFamily: "",
  radius: 12,
  shadow: "md",
};

/**
 * VIS-001 · LO QUE SE PUBLICABA cuando un encabezado llegaba SIN `settings` o SIN `theme` (regla del dueño: «si lo elegiste en los Labs
 * se ve eso; si no elegiste nada se ve como ya está publicado»). Salen de HEAD de Kolortec (DEFAULT_SETTINGS de HeroSection y el
 * theme por defecto de contentService); la tienda ni siquiera tenía valor (settings ausente = error), y toma los mismos para que los
 * dos sitios se vean igual. NO son los defaults del Lab (arriba: CAROUSEL_SETTINGS_DEFAULTS / THEME_DEFAULTS = newConfig()): el Lab
 * completa un diseño ausente con ESTOS valores (normalizeConfig, defaults.js) para que la vista previa coincida con el sitio.
 *   · sin settings: autoplay a 7000 ms, sin flechas, con puntos.
 *   · sin theme: tipografía Inter (no la del sitio).
 *   · theme PRESENTE sin colors.primary: no se completa; el renderer usa su acento de siempre (#fff).
 */
export const SETTINGS_PUBLICADOS = { mode: "carousel", autoplay: true, intervalMs: 7000, loop: true, arrows: false, dots: true };
export const THEME_PUBLICADO = {
  colors: { primary: "#5b6cff", secondary: "#9c4dff", text: "#ffffff", bg: "#111111", accent: "#ffd54a" },
  fontFamily: "Inter, sans-serif",
  radius: 12,
  shadow: "md",
};

/**
 * completarAjustes(settings, theme) -> { settings, theme }
 * SOLO rellena lo que falta POR COMPLETO (settings o theme ausentes) y con lo que se publicaba. Un settings o theme que el diseño trae,
 * aunque incompleto, pasa tal cual: completarle claves cambiaría lo ya publicado (flechas, autoplay, acento).
 */
export function completarAjustes(settings, theme) {
  const hay = (v) => v && typeof v === "object";
  const scroll = hay(settings) && settings.mode === "scroll";
  return {
    settings: hay(settings) ? settings : { ...SETTINGS_PUBLICADOS },
    // Sin theme: el publicado. Con theme pero SIN `colors` (REG-003: la tienda caía con 500 en `theme.colors.bg`): sus claves más la paleta publicada.
    // Un theme que trae `colors` pasa tal cual, aunque le falten claves (primary / accent / bg no se completan: es lo que se publicaba). Un scrolltelling
    // con theme sin `colors` tampoco se completa: nunca cayó (su renderer usa #fff de respaldo) y su acento publicado es ese.
    theme: hay(theme) ? (hay(theme.colors) || scroll ? theme : { ...theme, colors: { ...THEME_PUBLICADO.colors } }) : { ...THEME_PUBLICADO, colors: { ...THEME_PUBLICADO.colors } },
  };
}

/**
 * TAMAÑO del escenario (modo SCROLLTELLING). Dos ajustes INDEPENDIENTES —
 * espejo de SCROLL_SIZE_COMPAT_DEFAULTS en el admin (_schema/defaults.js).
 * Si se edita allá, editar acá.
 *
 *   (RETIRADO 18-oct-2026, decisión de Fedev) scrollFullWidth: el escenario
 *                      SIEMPRE se sale del contenedor y ocupa el ancho real de
 *                      la pantalla. El valor guardado se IGNORA (los diseños
 *                      viejos con `false` se ven a todo el ancho, sin migrar).
 *   scrollFullHeight : cada paso ocupa el alto real de la pantalla. Default
 *                      TRUE = como venía (el sticky siempre fue 100vh).
 *                      En false, cada paso mide scrollHeight{Desktop,Mobile}.
 *
 * Los defaults preservan el render de cualquier diseño ya guardado.
 *
 * `--hero-viewport-scale`: factor de zoom del contenedor que envuelve al
 * renderer, para los sitios que escalan el layout entero. Sin declarar vale 1
 * y todo esto se comporta como antes. Existe porque kolortec mete TODO el
 * sitio en un lienzo de 1920px con `zoom` (.kt-zoom-canvas): adentro de un
 * `zoom: s`, `100dvh` se dibuja al s por ciento del alto real, así que el
 * escenario quedaba MÁS CORTO que la pantalla en cualquier monitor de menos
 * de 1920 — y el JS, que mide con window.innerHeight, calculaba los umbrales
 * de cada paso sobre un alto que no era el que se estaba pintando.
 */
export const SCROLL_SIZE_COMPAT_DEFAULTS = {
  scrollFullHeight: true,
  scrollHeightDesktop: 720,
  scrollHeightMobile: 560,
};

/** Lee el factor de zoom del contenedor. Sin la var declarada devuelve 1. */
export function viewportScale() {
  if (typeof window === "undefined") return 1;
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--hero-viewport-scale");
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/**
 * Alto CSS de UN paso. Con full height se divide por la escala del contenedor,
 * que es lo que hace que el paso mida la pantalla ENTERA y no un porcentaje.
 */
export function scrollStepHeight(settings, breakpoint) {
  const s = settings || {};
  const full = s.scrollFullHeight ?? SCROLL_SIZE_COMPAT_DEFAULTS.scrollFullHeight;
  if (full) return "calc(var(--vh-full, 100vh) / var(--hero-viewport-scale, 1))";
  const px = breakpoint === "mobile"
    ? (s.scrollHeightMobile ?? SCROLL_SIZE_COMPAT_DEFAULTS.scrollHeightMobile)
    : (s.scrollHeightDesktop ?? SCROLL_SIZE_COMPAT_DEFAULTS.scrollHeightDesktop);
  // Dato guardado que termina en `height:` del escenario: se fuerza a número finito. SIN importar
  // cssSafe a propósito: check-hero-roundtrip carga este archivo suelto (data: URL), sin imports.
  const n = Number(px);
  return `${Number.isFinite(n) && px !== "" && px !== null ? n : (breakpoint === "mobile" ? SCROLL_SIZE_COMPAT_DEFAULTS.scrollHeightMobile : SCROLL_SIZE_COMPAT_DEFAULTS.scrollHeightDesktop)}px`;
}

/**
 * Alto FÍSICO de un paso en píxeles de scroll, que es contra lo que el JS
 * compara los umbrales. Con full height es el viewport real; con alto fijo es
 * el valor en px multiplicado por la escala, porque eso es lo que ocupa en
 * pantalla una vez aplicado el zoom del contenedor.
 */
export function scrollStepPx(settings, breakpoint) {
  const s = settings || {};
  const full = s.scrollFullHeight ?? SCROLL_SIZE_COMPAT_DEFAULTS.scrollFullHeight;
  if (full) return (typeof window !== "undefined" && window.innerHeight) || 800;
  const px = breakpoint === "mobile"
    ? (s.scrollHeightMobile ?? SCROLL_SIZE_COMPAT_DEFAULTS.scrollHeightMobile)
    : (s.scrollHeightDesktop ?? SCROLL_SIZE_COMPAT_DEFAULTS.scrollHeightDesktop);
  return px * viewportScale();
}

/**
 * Ancho del escenario cuando va a pantalla completa, medido en JS.
 *
 * NO se usa `100vw`: incluye la barra de scroll, así que romper con vw deja
 * ~15px de overflow horizontal. En kolortec lo tapa el `overflow-x: clip` del
 * lienzo, pero el store NO lo tiene y aparecería una barra horizontal en toda
 * la página. `documentElement.clientWidth` es el viewport sin la barra.
 *
 * Se divide por la escala por lo mismo que el alto: adentro de un `zoom: s`
 * hay que pedir 1/s para ocupar el ancho real.
 */
export function scrollBleedWidth() {
  if (typeof window === "undefined") return null;
  const w = document.documentElement.clientWidth;
  if (!w) return null;
  return w / viewportScale();
}

const clamp01 = (n) => Math.min(1, Math.max(0, n));

/**
 * Migración PEREZOSA del scrolltelling: completa los campos nuevos en configs
 * viejos para que rendericen idéntico a antes.
 *  1. interactionMode ausente → 'continuous' (comportamiento histórico).
 *  2. settings.snap ausente → SNAP_DEFAULTS.
 *  3. markers ausentes → proporcionales a stepDurations (equiespaciados si
 *     todas las duraciones son iguales). Fracción 0..1.
 *  4. Fuente ÚNICA: si no hay fondo global video/frames pero un slide lo
 *     tiene, se promueve el del primer slide que tenga uno.
 */
export function normalizeScrollDesign(labConfig) {
  if (!labConfig || labConfig?.settings?.mode !== "scroll") return labConfig;

  const settings = { ...labConfig.settings };
  if (settings.interactionMode !== "snap" && settings.interactionMode !== "continuous") {
    settings.interactionMode = "continuous";
  }
  settings.snap = {
    ...SNAP_DEFAULTS,
    ...(settings.snap && typeof settings.snap === "object" ? settings.snap : {}),
  };
  // Clamp: el input permite tipear libre; un tween de 0ms o 60s rompe la UX.
  settings.snap.stepDurationMs = Math.min(5000, Math.max(100, Number(settings.snap.stepDurationMs) || 1100));

  // videoTrim corrupto (colapsado o invertido) congelaría el video en un frame:
  // volver al tramo completo.
  const vt = settings.videoTrim;
  if (vt && typeof vt === "object" && !(Number(vt.end) > Number(vt.start))) {
    settings.videoTrim = { start: 0, end: 1 };
  }

  const slides = (Array.isArray(labConfig.slides) ? labConfig.slides : []).map((s) => ({ ...s }));

  // 4. Fuente única: promover el primer video/frames por-slide a global.
  const isMedia = (bg) => !!bg && (bg.type === "video" || bg.type === "frames");
  let background = labConfig.background;
  if (!isMedia(background)) {
    const donor = slides.find((s) => isMedia(s?.background));
    if (donor) background = donor.background;
  }

  // 3. Markers: defaults proporcionales a stepDurations; se respetan los existentes.
  if (slides.length) {
    const fallbackSec = Number(settings.scrollDurationSec) > 0 ? Number(settings.scrollDurationSec) : 8;
    const durations = slides.map((s) => {
      const d = Number(settings.stepDurations?.[s?.id]);
      return d > 0 ? d : fallbackSec;
    });
    const spanTotal = durations.slice(0, -1).reduce((acc, d) => acc + d, 0);
    let acc = 0;
    slides.forEach((s, i) => {
      const def = spanTotal > 0 ? clamp01(acc / spanTotal) : 0;
      if (typeof s.marker !== "number" || Number.isNaN(s.marker)) s.marker = def;
      else s.marker = clamp01(s.marker);
      acc += durations[i];
    });
  }

  // 5. Fin del video (continuo): dónde termina el recorrido; nunca antes del
  // último marker. Ausente → 1 (comportamiento histórico: usa todo el tramo).
  const lastMarker = slides.length ? Math.max(...slides.map((s) => (typeof s.marker === "number" ? s.marker : 0))) : 0;
  const rawEnd = Number(settings.videoEndFraction);
  settings.videoEndFraction = Number.isFinite(rawEnd) ? Math.max(clamp01(rawEnd), lastMarker) : 1;

  return { ...labConfig, settings, background: background ?? labConfig.background, slides };
}
