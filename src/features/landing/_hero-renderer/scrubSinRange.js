/**
 * Un fondo atado al scroll necesita poder saltar dentro del video. Si el servidor no atiende `Range` (`php -S` en desarrollo, o un disco mal
 * configurado: ver docs/PENDIENTES-VPS.md del back) el navegador no deja saltar y el video queda quieto en su primer cuadro.
 *
 * Qué hace entonces, sin avisarle nada a quien mira la web: lo baja entero UNA vez a la memoria, con tope, porque un blob sí deja saltar. Si pesa
 * más que el tope o el servidor no lo deja leer (CORS), se reproduce solo y en bucle: se ve en movimiento en vez de congelado.
 */
import { useEffect, useState } from "react";

export const TOPE_EN_MEMORIA_BYTES = 40 * 1024 * 1024;

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

/** La fuente para el <video>: la misma `url`, o su copia en memoria si el servidor no deja saltar. Baja una sola vez por url. */
export function useFuenteQueDejaSaltar(ref, url) {
  const [copia, setCopia] = useState({ url: null, blob: null });

  useEffect(() => {
    const video = ref.current;
    if (!video || !url) return undefined;
    let vivo = true;
    let enBucle = false;
    let creada = null;
    let espera = 0;
    const corte = new AbortController();

    const revisar = () => {
      espera = setTimeout(async () => {
        if (!vivo || !noDejaSaltar(video)) return;
        const blob = await bajarConTope(url, TOPE_EN_MEMORIA_BYTES, { signal: corte.signal }).catch(() => null);
        if (!vivo) return;
        if (blob) {
          creada = URL.createObjectURL(blob);
          setCopia({ url, blob: creada });
          return;
        }
        enBucle = true;
        video.loop = true;
        video.play?.()?.catch?.(() => {});
      }, ESPERA_MS);
    };

    if (video.readyState >= 1) revisar();
    else video.addEventListener("loadedmetadata", revisar, { once: true });

    return () => {
      vivo = false;
      clearTimeout(espera);
      corte.abort();
      video.removeEventListener("loadedmetadata", revisar);
      if (enBucle) { video.loop = false; video.pause?.(); }
      if (creada) URL.revokeObjectURL(creada);
    };
  }, [ref, url]);

  return copia.url === url && copia.blob ? copia.blob : url;
}
