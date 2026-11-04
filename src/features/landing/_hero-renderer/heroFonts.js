/**
 * heroFonts — carga on-demand las Google Fonts que usa un diseño del hero
 * (theme.fontFamily + fontFamily de cada elemento, incl. overrides mobile/tablet).
 *
 * ⚠ COPIA SINCRONIZADA — misma lógica en:
 *   tiendita-front/app/(admin)/admin/hero-lab/_renderer/heroFonts.js
 *   tiendita-store/components/hero-renderer/heroFonts.js
 */

const SKIP = new Set([
  "sans-serif", "serif", "monospace", "system-ui", "arial", "helvetica",
  "impact", "georgia", "times new roman", "courier new", "verdana", "tahoma",
  // Futura Extra Black Condensed (look "Kolortec"): self-hosted vía @font-face
  // propio (fonts.css del admin / globals.css de la store), NO es Google Font
  // — pedirla a fonts.googleapis devuelve 400 (fuente inexistente ahí).
  "futura extra black condensed",
  // ⚠ DIVERGENCIA DELIBERADA con las otras dos copias: acá NO va sincronizada.
  // En kolortec Manrope se sirve por @font-face propio (/fonts/manrope-latin.woff2), así que
  // pedirla a Google es un round-trip al pedo — y encima falla: el eje real de Manrope es
  // 200..800, el rango 300..900 de abajo devuelve 400 y el reintento cae al peso 400 pelado.
  // En tiendita-store y en el admin Manrope SÍ se pide a Google: allá esta línea no va.
  "manrope",
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
  // «Si no elegiste nada se ve como ya está publicado»: el theme por defecto ('Inter, sans-serif', lo que se publica sin theme) no es una
  // elección y no pide nada, como antes. Cualquier otra tipografía del theme, o Inter elegida en un elemento, sí se pide.
  if (!/^\s*inter\s*,\s*sans-serif\s*$/i.test(config?.theme?.fontFamily ?? "")) add(config?.theme?.fontFamily);
  for (const slide of config?.slides || []) {
    for (const el of slide?.elements || []) {
      for (const p of [el?.props, el?.propsMobile, el?.propsTablet]) for (const fam of familiasElegidas(p)) add(fam);
      for (const fam of familiasPorDefecto(el)) add(fam);
    }
  }
  return [...out];
}

// Las tipografías POR DEFECTO de los Views (MessageView/StatsView: `"Schibsted Grotesk"`, `"Hanken Grotesk"`, `"Archivo"`). Un título que no fija
// `fontFamily` —es lo que dejan la IA y el MCP— se pinta con "Schibsted Grotesk", y NADIE la cargaba (ni next/font, ni fonts.css, ni este
// archivo: medido en el editor, el ancho de un texto en "Schibsted Grotesk" era idéntico al de sans-serif y no había @font-face): caía a la
// genérica sin avisar (QA 32). Se piden SÓLO si el elemento tiene ese texto y no eligió otra, para no sumar pedidos de balde.
function familiasPorDefecto(el) {
  const p = el?.props;
  if (!p || typeof p !== "object") return [];
  const out = [];
  if (el.type === "message") {
    if (p.title && !p.fontFamily) out.push("Schibsted Grotesk");
    if (p.sub && !p.fontFamily && !p.subFontFamily) out.push("Hanken Grotesk");
    if (p.eyebrow && !p.subFontFamily) out.push("Archivo");
  } else if (el.type === "stats" && !p.fontFamily) {
    out.push("Schibsted Grotesk");
  }
  return out;
}

// Las familias que el diseño ELIGIÓ en un elemento (título/texto, subtítulo, etiqueta, eyebrow, botón). Un elemento que no fija ninguna no pide
// nada: los Views usan su tipografía por defecto sin cargarla, como se publicaba (nada elegido = lo ya publicado).
function familiasElegidas(p) {
  return p && typeof p === "object" ? [p.fontFamily, p.subFontFamily, p.labelFontFamily, p.eyebrowFontFamily, p.ctaFontFamily] : [];
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
    // Cadena de pedidos: 300..900 → 400..900 (Schibsted Grotesk empieza en 400: con 300 Google da HTTP 400 y caía a la genérica) → familia pelada.
    const pasos = [`:wght@400..900`, ``];
    link.onerror = () => {
      const paso = pasos.shift();
      if (paso === undefined) { link.onerror = null; return; }
      link.href = `https://fonts.googleapis.com/css2?family=${fam}${paso}&display=swap`;
    };
    link.href = `https://fonts.googleapis.com/css2?family=${fam}:wght@300..900&display=swap`;
    document.head.appendChild(link);
  }
}
