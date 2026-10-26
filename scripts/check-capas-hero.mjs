/**
 * Orden de capas de una escena del hero: la oscuridad (`slide.overlay`) y el velo
 * (`slide.scrim`) van ARRIBA de los elementos de fondo (z <= 0, la foto como elemento
 * `media`) y ABAJO del contenido (z >= 1).
 *
 * POR QUÉ EXISTE (oct-2026): el overlay se pintaba antes que TODOS los elementos, así que
 * una foto-elemento a pantalla completa lo tapaba y "la oscuridad" no se veía — en el
 * editor, en el store y en kolortec. Nada lo vigilaba porque el síntoma es visual.
 *
 * Qué mira, sin dependencias ni navegador:
 *  (a) layers.js: el reparto fondo/contenido y los zIndex (bandas que no se pisan).
 *  (b) en cada renderer (kolortec: CarouselRenderer + ScrollRenderer; admin y store si están al
 *      lado) el JSX monta: elementos de fondo → overlay/scrim → elementos de contenido, y
 *      overlay/scrim llevan estiloCapaEscena() (zIndex + pointerEvents:none).
 *  (c) layers.js idéntico en las copias que haya (ignorando CRLF/LF).
 * El render real (pixeles) lo cubre el arnés de capturas; esto evita que vuelva a romperse en silencio.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Dónde están las otras dos copias: checkout normal (tiendita/tiendita-front, tiendita/tiendita-store), worktrees de paridad
// (tiendita/_wt/front-paridad, tiendita/_wt/store-paridad) o por variable de entorno (HERO_ADMIN_DIR —alias HERO_FRONT_DIR— / HERO_STORE_DIR
// = raíz del repo). Misma regla que scripts/_hermanos.mjs del admin:
//   · si la variable está puesta, MANDA ELLA SOLA: apuntada a una ruta que no sirve da null, NO cae a los hermanos de siempre (un override
//     roto que se ignora en silencio compara contra OTRO código y da verde);
//   · HERO_PARIDAD_ESTRICTA=1: una copia ausente es un FALLO (exit 1), no un salto. Sin eso se avisa fuerte y no cuenta como verificada.
const ESTRICTO = process.env.HERO_PARIDAD_ESTRICTA === "1";
const primero = (cands, prueba) => {
  const [explicito, ...porDefecto] = cands;
  const lista = explicito ? [explicito] : porDefecto;
  return lista.filter(Boolean).map((c) => resolve(c)).find((c) => existsSync(resolve(c, prueba))) || null;
};
const ADMIN_DIR = process.env.HERO_ADMIN_DIR || process.env.HERO_FRONT_DIR;
const VARIABLE = { admin: process.env.HERO_ADMIN_DIR ? "HERO_ADMIN_DIR" : "HERO_FRONT_DIR", store: "HERO_STORE_DIR" };
const adminRepo = primero([ADMIN_DIR, `${raiz}/../tiendita/_wt/front-paridad`, `${raiz}/../tiendita/tiendita-front`], "app/(admin)/admin/hero-lab/_renderer");
const storeRepo = primero([process.env.HERO_STORE_DIR, `${raiz}/../tiendita/_wt/store-paridad`, `${raiz}/../tiendita/tiendita-store`], "components/hero-renderer");
const COPIAS = [
  { n: "kolortec", dir: `${raiz}/src/features/landing/_hero-renderer`, obligatoria: true, archivos: ["CarouselRenderer.jsx", "ScrollRenderer.jsx"] },
  { n: "admin", dir: adminRepo && `${adminRepo}/app/(admin)/admin/hero-lab/_renderer`, archivos: ["CarouselRenderer.jsx", "ScrollStage.jsx"] },
  { n: "store", dir: storeRepo && `${storeRepo}/components/hero-renderer`, archivos: ["CarouselRenderer.jsx", "ScrollRenderer.jsx"] },
];
console.log(`  copias: admin=${adminRepo} store=${storeRepo}${ESTRICTO ? " (HERO_PARIDAD_ESTRICTA=1)" : ""}`);

let fallas = 0;
const falla = (m) => { fallas++; console.log("  FALLA " + m); };
const ok = (m) => console.log("  ok    " + m);
const lee = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");

// ── (a) layers.js ─────────────────────────────────────────────────────────────
const L = await import("data:text/javascript;base64," + Buffer.from(lee(`${COPIAS[0].dir}/layers.js`)).toString("base64"));
const el = (id, z) => ({ id, z });
const { fondo, contenido } = L.partirCapas([el("t", 1), el("foto", 0), el("grad", -3), el("btn", 5), el("sinz", undefined), el("raro", "x")]);
const ids = (a) => a.map((e) => e.id).join(",");
ids(fondo) === "grad,foto" ? ok("fondo = z<=0 ordenado por z (grad,foto)") : falla(`fondo = ${ids(fondo)}`);
ids(contenido) === "t,sinz,raro,btn" ? ok("contenido = z>=1 ordenado; sin z / ilegible = contenido") : falla(`contenido = ${ids(contenido)}`);
const maxFondo = Math.max(...[0, -1, -50, -998, -5000].map((z) => L.zIndexCapa(el("x", z))));
const minContenido = Math.min(...[1, 2, 50, 1e12].map((z) => L.zIndexCapa(el("x", z))));
const capaBaja = L.estiloCapaEscena().zIndex, capaAlta = L.estiloCapaEscena(true).zIndex;
maxFondo < capaBaja && capaBaja < capaAlta && capaAlta < minContenido
  ? ok(`bandas: fondo<=${maxFondo} < escena ${capaBaja}/${capaAlta} < contenido>=${minContenido}`)
  : falla(`bandas se pisan: fondo ${maxFondo}, escena ${capaBaja}/${capaAlta}, contenido ${minContenido}`);
L.zIndexCapa(el("a", -3)) < L.zIndexCapa(el("b", 0)) && L.zIndexCapa(el("a", 1)) < L.zIndexCapa(el("b", 2))
  ? ok("el orden relativo dentro de cada grupo se conserva") : falla("orden relativo roto");
L.estiloCapaEscena().pointerEvents === "none" && L.estiloCapaEscena(true).pointerEvents === "none"
  ? ok("overlay/scrim no capturan el mouse (pointerEvents none)") : falla("estiloCapaEscena sin pointerEvents none");

// ── (b) el JSX monta las capas en orden ──────────────────────────────────────
const pos = (txt, re) => { const m = re.exec(txt); return m ? m.index : -1; };
for (const c of COPIAS) {
  if (!c.dir || !existsSync(c.dir + "/layers.js")) {
    const roto = c.n !== "kolortec" && process.env[VARIABLE[c.n]] ? ` (${VARIABLE[c.n]}=${process.env[VARIABLE[c.n]]} no tiene el renderer)` : "";
    if (c.obligatoria) falla(`${c.n}: falta layers.js`);
    else if (ESTRICTO) falla(`falta la copia ${c.n}${roto} (HERO_PARIDAD_ESTRICTA=1)`);
    else console.log(`  salto  ${c.n}: no está al lado${roto} — NO se comparó, esto no cuenta como verde`);
    continue;
  }
  for (const a of c.archivos) {
    const txt = lee(`${c.dir}/${a}`);
    const iFondo = pos(txt, /fondo\.map\(pintar\)|n\.fondo\)\.map/);
    const iOver = pos(txt, /slide\.overlay > 0/);
    const iContenido = pos(txt, /contenido\.map\(pintar\)|!n\.fondo\)\.map/);
    // En ScrollStage/SnapStage los elementos se calculan antes del return; se mira el orden del JSX montado.
    const montaje = txt.slice(Math.max(0, iFondo));
    const dOver = pos(montaje, /slide\.overlay > 0/), dContenido = pos(montaje, /contenido\.map\(pintar\)|!n\.fondo\)\.map/);
    if (iFondo < 0 || iOver < 0 || iContenido < 0) { falla(`${c.n}/${a}: no monta fondo/overlay/contenido separados`); continue; }
    dOver > 0 && dContenido > dOver ? ok(`${c.n}/${a}: fondo -> overlay -> contenido`) : falla(`${c.n}/${a}: orden fondo/overlay/contenido incorrecto`);
    const nOver = (txt.match(/rgba\(0,0,0,\$\{cssNumber\(slide\.overlay\)\}\)`, \.\.\.estiloCapaEscena\(/g) || []).length;
    const nOverTotal = (txt.match(/slide\.overlay > 0/g) || []).length;
    nOver === nOverTotal ? ok(`${c.n}/${a}: ${nOver} overlay(s) con estiloCapaEscena`) : falla(`${c.n}/${a}: overlay sin estiloCapaEscena (${nOver}/${nOverTotal})`);
    const nScrim = (txt.match(/<ScrollScrim [^>]*style=\{estiloCapaEscena\(/g) || []).length;
    const nScrimTotal = (txt.match(/<ScrollScrim breakpoint/g) || []).length;
    nScrim === nScrimTotal ? ok(`${c.n}/${a}: ${nScrim} scrim(s) con estiloCapaEscena`) : falla(`${c.n}/${a}: scrim sin estiloCapaEscena (${nScrim}/${nScrimTotal})`);
  }
}

// ── (c) copias idénticas ─────────────────────────────────────────────────────
const base = lee(`${COPIAS[0].dir}/layers.js`);
for (const c of COPIAS.slice(1)) {
  if (!c.dir || !existsSync(c.dir + "/layers.js")) continue; // la ausencia ya se informó en (b)
  lee(`${c.dir}/layers.js`) === base ? ok(`layers.js ${c.n} idéntico al de kolortec`) : falla(`layers.js ${c.n} DIFIERE de kolortec`);
}

// ── (d) el escenario de scroll aísla sus capas (12-oct-2026) ───────────────────
// Los zIndex de ./layers.js (hasta 1002+) tienen que quedar ADENTRO del escenario: si no, tapan el chrome de
// afuera (Saltar, flechas: zIndex 5) y «Saltar» queda sin clic. Se cuida con `isolation: isolate` en su raíz.
for (const c of COPIAS.slice(0, 1)) { // sólo la copia de ESTE repo: las otras se cuidan en su propio chequeo
  const f = c.dir + "/" + (existsSync(c.dir + "/ScrollRenderer.jsx") ? "ScrollRenderer.jsx" : "ScrollStage.jsx");
  if (!existsSync(f)) continue;
  const txt = lee(f);
  const raices = (txt.match(/overflow: ["']hidden["'],[^}]*background: cssColor\(config\.theme\?\.colors\?\.bg/g) || []);
  const aisladas = raices.filter((r) => /isolation: ["']isolate["']/.test(r)).length;
  raices.length && aisladas === raices.length ? ok(`${c.n}: ${aisladas} escenario(s) de scroll aislados`) : falla(`${c.n}: escenario de scroll SIN isolation (${aisladas}/${raices.length}) — tapa «Saltar»`);
}

console.log(fallas ? `\n${fallas} falla(s)` : "\nOK — el overlay y el scrim van arriba de la foto y abajo del contenido");
process.exit(fallas ? 1 : 0);
