/**
 * Un fondo atado al scroll necesita poder saltar dentro del video. Si el servidor no atiende `Range` (`php -S` en desarrollo, o un disco mal
 * configurado: ver docs/PENDIENTES-VPS.md del back) el navegador no deja saltar y el video queda quieto en su primer cuadro.
 *
 * Qué hace entonces, sin avisarle nada a quien mira la web: lo baja entero UNA vez a la memoria, con tope, porque un blob sí deja saltar. Si pesa
 * más que el tope o el servidor no lo deja leer (CORS), el video NO corre solo (V1, 06-nov-2026: en bucle ignoraba «con el scroll» y el recorte):
 * `seguirSinSaltar` lo hace avanzar reproduciendo hasta donde va el scroll, dentro del recorte, y lo frena ahí.
 *
 * Volver para atrás sin Range (video 10-nov, defecto 3: con `scrollY` 0 quedaba en 29,91 s): medido en Chrome, sin Range `seekable` es [0,0] y
 * el blob falla por CORS (el storage local no manda `Access-Control-Allow-Origin`), así que la copia en memoria no llega. Entonces, si el scroll
 * quedó más de VUELTA_S detrás del video, se RECARGA (vuelve al cuadro 0, que sí se puede) y se avanza otra vez hasta el objetivo, a hasta 8x.
 * Volver no recarga en cada paso del scroll: espera a que se suelte, y mientras alcanza el objetivo tapa el video (ver seguirSinSaltar).
 * Con Range nada de esto corre: el seek normal manda.
 */
import { useEffect, useState } from "react";

export const TOPE_EN_MEMORIA_BYTES = 40 * 1024 * 1024;

/** Las url que ya no se pudieron bajar (CORS, error, más que el tope): no se piden de nuevo, así la consola no repite el error en cada montaje. */
const SIN_COPIA = new Set();

/** Espera un momento después de `loadedmetadata`: Safari tarda en informar lo que se puede saltar. */
const ESPERA_MS = 300;

export function noDejaSaltar(video) {
  const s = video?.seekable;
  return !s || s.length === 0 || s.end(s.length - 1) <= 0;
}

/** El archivo como Blob, o null si pesa más que el tope (no sigue bajando) o el servidor contesta otra cosa. */
export async function bajarConTope(url, tope = TOPE_EN_MEMORIA_BYTES, { signal, pedir = (u, o) => fetch(u, o) } = {}) {
  const res = await pedir(url, { signal, credentials: "omit" });
  if (!res?.ok) return null;
  const tipo = res.headers?.get?.("content-type") || "video/mp4";
  if (Number(res.headers?.get?.("content-length") || 0) > tope) {
    try { await res.body?.cancel?.(); } catch { /* ya estaba cerrado */ }
    return null;
  }
  const lector = res.body?.getReader?.();
  if (!lector) {
    const entero = await res.blob();
    return entero.size > tope ? null : entero;
  }
  const partes = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.length;
    if (total > tope) {
      try { await lector.cancel(); } catch { /* ya estaba cerrado */ }
      return null;
    }
    partes.push(value);
  }
  return new Blob(partes, { type: tipo });
}

/** Velocidad máxima para alcanzar el scroll sin saltar (Chrome admite hasta 16; a 8 se pasa como mucho ~0,13 s por cuadro). */
export const VELOCIDAD_MAXIMA = 8;
/** Margen para darlo por alcanzado. */
const LLEGO_S = 0.04;
/** Cuánto detrás del video tiene que quedar el scroll para recargar y volver (menos que esto, se queda: recargar cuesta la bajada). */
export const VUELTA_S = 0.5;
/** Una recarga a la vez: mientras vuelve a cargar, el scroll puede seguir subiendo sin pedir otra. */
const ENTRE_RECARGAS_MS = 1200;
/** Video 25-nov, defecto 4: cuánto tiene que quedarse quieto el scroll para darlo por soltado. Recién ahí se recarga: cada recarga baja el video entero. */
export const QUIETO_MS = 250;

/** Una foto del cuadro que se ve, encima del video, mientras recarga y avanza desde el cuadro 0: así no se ven los cuadros de antes del recorte. */
export function congelarCuadro(video) {
  const doc = video?.ownerDocument;
  if (!doc?.createElement || !video.parentNode || !video.videoWidth || !video.videoHeight) return null;
  const lienzo = doc.createElement("canvas");
  lienzo.width = video.videoWidth;
  lienzo.height = video.videoHeight;
  try { lienzo.getContext("2d")?.drawImage(video, 0, 0, lienzo.width, lienzo.height); } catch { return null; }
  lienzo.setAttribute("aria-hidden", "true");
  lienzo.setAttribute("data-scrub-congelado", "");
  lienzo.style.cssText = video.style?.cssText || "";
  lienzo.style.pointerEvents = "none";
  video.parentNode.insertBefore(lienzo, video.nextSibling);
  return lienzo;
}

/**
 * Sin `Range` ni copia en memoria: avanza el video reproduciéndolo hasta `objetivo()` (en segundos, ya dentro del recorte) y lo pausa al llegar.
 * Mientras se pueda saltar no hace nada: el seek normal manda. Devuelve la función que lo apaga.
 *
 * Video 25-nov, defecto 4: al volver para atrás espera a que el scroll se suelte (QUIETO_MS) y recarga UNA vez, no en cada paso (antes bajaba el
 * video entero hasta 3 veces por subida). Y desde que carga o recarga hasta llegar al objetivo, el video no se ve: encima queda la foto del último
 * cuadro (al recargar) o el video transparente (al cargar por primera vez, cuando el cuadro 0 todavía está fuera del recorte).
 */
export function seguirSinSaltar(video, objetivo, {
  cuadro = (f) => requestAnimationFrame(f),
  cancelar = (id) => cancelAnimationFrame(id),
  recargar = (v) => v.load?.(),
  ahora = () => (typeof performance !== "undefined" ? performance.now() : Date.now()),
  congelar = congelarCuadro,
} = {}) {
  if (!video) return () => {};
  let id = 0;
  let ultimaRecarga = -Infinity;
  let visto = NaN;
  let quietoDesde = 0;
  let subioEn = -Infinity;
  let velo = null;
  let oculto = false;
  let alcanzando = true;
  const tapar = (conFoto) => {
    if (velo || oculto) return;
    velo = conFoto ? congelar(video) : null;
    if (!velo && video.style) { video.style.opacity = "0"; oculto = true; }
  };
  const destapar = () => {
    if (velo) { velo.remove?.(); velo = null; }
    if (oculto && video.style) video.style.opacity = "";
    oculto = false;
  };
  const paso = () => {
    id = cuadro(paso);
    if (!noDejaSaltar(video) || !video.duration || !Number.isFinite(video.duration)) return;
    const meta = objetivo();
    const t = ahora();
    if (!(Math.abs(meta - visto) < 0.02)) { if (meta < visto) subioEn = t; visto = meta; quietoDesde = t; }
    const falta = meta - video.currentTime;
    // Informe 26-nov defecto 5: mientras el scroll sube, el video no avanza (antes seguía de 27 a 29,9 s alcanzando un objetivo viejo): queda
    // congelado en su último cuadro y, al soltar, recarga y va al cuadro pedido (abajo) o avanza hasta él si quedó detrás.
    if (t - subioEn < QUIETO_MS) {
      if (!video.paused) video.pause?.();
      return;
    }
    if (falta < -VUELTA_S) {
      // El scroll volvió para atrás y no se puede saltar: se queda en su cuadro (dentro del recorte) hasta que se suelte el scroll.
      if (!video.paused) video.pause?.();
      if (t - quietoDesde < QUIETO_MS || t - ultimaRecarga <= ENTRE_RECARGAS_MS) return;
      ultimaRecarga = t;
      tapar(true);
      alcanzando = true;
      recargar(video);
      return;
    }
    if (falta > LLEGO_S) {
      if (alcanzando) tapar(false);
      const velocidad = Math.min(VELOCIDAD_MAXIMA, Math.max(1, Math.round(falta * 2)));
      if (video.playbackRate !== velocidad) video.playbackRate = velocidad;
      if (video.paused) video.play?.()?.catch?.(() => {});
    } else {
      if (!video.paused) video.pause?.();
      if (alcanzando) { alcanzando = false; destapar(); }
    }
  };
  id = cuadro(paso);
  return () => { cancelar(id); video.pause?.(); destapar(); };
}

/** La fuente para el <video>: la misma `url`, o su copia en memoria si el servidor no deja saltar. Baja una sola vez por url. */
export function useFuenteQueDejaSaltar(ref, url) {
  const [copia, setCopia] = useState({ url: null, blob: null });

  useEffect(() => {
    const video = ref.current;
    if (!video || !url) return undefined;
    let vivo = true;
    let creada = null;
    let espera = 0;
    const corte = new AbortController();

    const revisar = () => {
      espera = setTimeout(async () => {
        if (!vivo || !noDejaSaltar(video) || SIN_COPIA.has(url)) return;
        const blob = await bajarConTope(url, TOPE_EN_MEMORIA_BYTES, { signal: corte.signal }).catch(() => null);
        if (!vivo) return;
        if (!blob) SIN_COPIA.add(url);
        if (blob) {
          creada = URL.createObjectURL(blob);
          setCopia({ url, blob: creada });
        }
        // Sin copia: no se pone en bucle ni corre solo. ScrubVideo lo sigue con `seguirSinSaltar`.
      }, ESPERA_MS);
    };

    if (video.readyState >= 1) revisar();
    else video.addEventListener("loadedmetadata", revisar, { once: true });

    return () => {
      vivo = false;
      clearTimeout(espera);
      corte.abort();
      video.removeEventListener("loadedmetadata", revisar);
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [ref, url]);

  return copia.url === url && copia.blob ? copia.blob : url;
}
