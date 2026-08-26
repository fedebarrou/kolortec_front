/**
 * heroFonts — carga on-demand las Google Fonts que usa un diseño del hero
 * (theme.fontFamily + fontFamily de cada elemento, incl. overrides mobile/tablet).
 *
 * ⚠ COPIA SINCRONIZADA — misma lógica en:
 *   tiendita-front/app/(admin)/admin/hero-lab/_renderer/heroFonts.js
 *   tiendita-store/components/hero-renderer/heroFonts.js
 */

const SKIP = new Set([
  "inter", "sans-serif", "serif", "monospace", "system-ui", "arial", "helvetica",
  "impact", "georgia", "times new roman", "courier new", "verdana", "tahoma",
  // Futura Extra Black Condensed (look "Kolortec"): self-hosted vía @font-face
  // propio (fonts.css del admin / globals.css de la store), NO es Google Font
  // — pedirla a fonts.googleapis devuelve 400 (fuente inexistente ahí).
  "futura extra black condensed",
]);

// Fuentes propias (Mi web › Apariencia): id "cf" + 8 hex, NO son Google Fonts
// (se sirven por @font-face propio) → nunca deben pedirse a fonts.googleapis.
const CUSTOM_FONT_ID_RE = /^cf[0-9a-f]{8}$/i;

function familiesOf(config) {
  const out = new Set();
  const add = (fam) => {
    if (typeof fam !== "string") return;
    // "\"Bebas Neue\", sans-serif" → "Bebas Neue"
    const first = fam.split(",")[0].trim().replace(/^["']|["']$/g, "");
    if (!first || SKIP.has(first.toLowerCase())) return;
    if (CUSTOM_FONT_ID_RE.test(first)) return;
    out.add(first);
  };
  add(config?.theme?.fontFamily);
  for (const slide of config?.slides || []) {
    for (const el of slide?.elements || []) {
      add(el?.props?.fontFamily);
      add(el?.props?.subFontFamily);
      add(el?.props?.labelFontFamily);
      add(el?.propsMobile?.fontFamily);
      add(el?.propsMobile?.subFontFamily);
      add(el?.propsMobile?.labelFontFamily);
      add(el?.propsTablet?.fontFamily);
      add(el?.propsTablet?.subFontFamily);
      add(el?.propsTablet?.labelFontFamily);
    }
  }
  return [...out];
}

/**
 * Inyecta <link> de Google Fonts (idempotente por familia).
 * Se pide el rango variable 300..900; la API css2 lo RECHAZA (HTTP 400) para
 * fuentes estáticas de un solo peso (Anton, Bebas Neue…), así que onerror
 * reintenta con la familia pelada (default 400).
 */
export function ensureHeroFonts(config) {
  if (typeof document === "undefined" || !config) return;
  for (const family of familiesOf(config)) {
    const id = `hero-font-${family.toLowerCase().replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) continue;
    const fam = encodeURIComponent(family).replace(/%20/g, "+");
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.onerror = () => {
      link.onerror = null;
      link.href = `https://fonts.googleapis.com/css2?family=${fam}&display=swap`;
    };
    link.href = `https://fonts.googleapis.com/css2?family=${fam}:wght@300..900&display=swap`;
    document.head.appendChild(link);
  }
}
