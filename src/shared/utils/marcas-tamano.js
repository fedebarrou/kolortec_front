/**
 * marcas-tamano — cuánto mide cada logo de «Marcas asociadas».
 *
 * Opción B del 17-oct-2026 (docs/diseno/DECISIONES-VISUALES-ADMIN.md): cada logo se iguala por ÁREA, no por alto.
 * Un logo muy ancho y bajo, a igual alto que uno cuadrado, se come la tira; con la raíz de la proporción natural
 * (naturalWidth / naturalHeight) el área visual —lo que el ojo lee como «tamaño»— queda pareja. Encima de eso, cada
 * marca se retoca con `escala` (0,70 a 1,40; por defecto 1). No hay un «tamaño general».
 *
 * FUNCIÓN PURA: sin DOM, sin React. LA MISMA COPIA vive en tiendita-front/lib/marcas-tamano.js (panel) y en
 * tiendita-store/lib/marcas-tamano.js (tienda): si se cambia una, se cambia la otra IDÉNTICA.
 * `node scripts/check-marcas-tamano.mjs` (front) lo verifica: mismo texto y mismos números.
 */

export const ESCALA_MIN = 0.7;
export const ESCALA_MAX = 1.4;
export const ESCALA_DEFECTO = 1;

/** Alto base (px) de un logo «promedio» según dónde se muestra: tira de la web externa, grilla de la tienda, ticker. */
export const ALTO_BASE = { tira: 72, tienda: 48, ticker: 36 };

const PROPORCION_REFERENCIA = 2.5; // un logo 2,5 veces más ancho que alto mide exactamente el alto base
const ALTO_MIN = 0.62; // tope de alto: nunca menos del 62 % del base…
const ALTO_MAX = 1.3; // …ni más del 130 %
const ANCHO_MAX = 3.7; // tope de ancho: 3,7 veces el alto base

/** `escala` válida (0,70–1,40, de a 0,05 en el panel; acá sólo se acota y se redondea a 2 decimales). Falta o basura → 1. */
export function normalizarEscala(valor) {
  const n = typeof valor === "string" ? Number(valor.replace(",", ".")) : Number(valor);
  if (valor == null || valor === "" || !Number.isFinite(n) || n <= 0) return ESCALA_DEFECTO;
  return Math.round(Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, n)) * 100) / 100;
}

/** Proporción natural ancho/alto, o null si todavía no se conoce (imagen sin cargar, SVG sin medidas). */
export function proporcionNatural(ancho, alto) {
  const w = Number(ancho);
  const h = Number(alto);
  return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 ? w / h : null;
}

/**
 * Medida final del logo en px.
 * `igualar: false` es «como subí los logos» (vista previa del panel): alto base fijo, sin igualar ni escala.
 * @param {{ proporcion: number|null, escala?: number, contexto?: "tira"|"tienda"|"ticker", igualar?: boolean }} p
 * @returns {{ w: number|null, h: number }} sin proporción conocida no se puede igualar: sólo `h` (el ancho sale solo).
 */
export function medirLogo({ proporcion, escala, contexto = "tienda", igualar = true } = {}) {
  const base = ALTO_BASE[contexto] ?? ALTO_BASE.tienda;
  const k = igualar === false ? 1 : normalizarEscala(escala);
  const r = Number(proporcion);
  if (!Number.isFinite(r) || r <= 0) return { w: null, h: Math.round(base * k) };

  let h = base;
  if (igualar !== false) h = Math.min(Math.max(base * Math.sqrt(PROPORCION_REFERENCIA / r), base * ALTO_MIN), base * ALTO_MAX);
  h *= k;
  let w = h * r;
  const tope = base * ANCHO_MAX * k;
  if (w > tope) {
    w = tope;
    h = w / r;
  }
  return { w: Math.round(w), h: Math.round(h) };
}
