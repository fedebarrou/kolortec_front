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
