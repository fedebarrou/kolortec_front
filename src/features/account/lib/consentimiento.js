/**
 * consentimiento.js — lógica PURA de «Mis datos» (sin fetch, sin React): estados por canal, frases del historial,
 * fechas. Portada del store de tiendita (tiendita-store/lib/consentimiento.js); las frases son las mismas.
 * kolortec NO lleva casillas de checkout ni newsletter: sólo el perfil del cliente con sesión.
 *
 * Contrato del back: tiendita-back/docs/promos/CONTRATO-consentimiento-2026-10-04.md
 *   GET  /public/me/consentimientos  -> { data: { canales:{ email|whatsapp:{ estado, desde, origen, eventos[] } }, texto_version, email, whatsapp } }
 *   POST /public/me/consentimientos  { email?:bool, whatsapp?:bool }  true acepta/reactiva · false da de baja
 *
 * SEC-001: WhatsApp se confirma EN WhatsApp. Tildarlo deja «pendiente», jamás «aceptado».
 * Los fetch viven en consentimientoApi.js (este archivo no importa nada, así se prueba con node a secas).
 */

export const CANALES = ["email", "whatsapp"];

const NOMBRE_CANAL = { email: "email", whatsapp: "WhatsApp" };
const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** «2026-10-09 15:00:00» | ISO -> «9 de octubre de 2026». Sin zona horaria: es el día que guardó el back. */
export function fechaLarga(desde) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(desde ?? ""));
  if (!m) return "";
  const mes = MESES[Number(m[2]) - 1];
  if (!mes) return "";
  return `${Number(m[3])} de ${mes} de ${m[1]}`;
}

/** «2026-10-09…» -> «9 oct 2026» (historial). */
export function fechaCorta(desde) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(desde ?? ""));
  if (!m) return "";
  const mes = MESES[Number(m[2]) - 1];
  if (!mes) return "";
  return `${Number(m[3])} ${mes.slice(0, 3)} ${m[1]}`;
}

/**
 * Cómo se ve un canal en la lista de ajustes. `fila` = canales[canal] de GET /me/consentimientos.
 *  chip: "ok" | "pend" | "baja" | "sin"   (clases cons-chip--*)
 *  encendido: el interruptor sólo está prendido si está ACEPTADO (pendiente = apagado, prenderlo confirma).
 */
export function estadoDeCanal(canal, fila) {
  const estado = fila?.estado || "sin_consentimiento";
  const fecha = fechaLarga(fila?.desde);

  if (estado === "aceptado") {
    return { chip: "ok", etiqueta: "Aceptado", detalle: fecha ? `desde el ${fecha}` : "", encendido: true };
  }
  if (estado === "pendiente") {
    const aviso =
      canal === "whatsapp"
        ? "te mandamos un WhatsApp para confirmar"
        : `te mandamos un mail${fecha ? ` el ${fecha}` : ""}`;
    const cierre = canal === "whatsapp" ? " · prendelo para pedirlo de nuevo" : " · prendelo para confirmar ahora";
    return { chip: "pend", etiqueta: "Pendiente de confirmar", detalle: aviso + cierre, encendido: false };
  }
  if (estado === "baja") {
    return {
      chip: "baja",
      etiqueta: "Dado de baja",
      detalle: `${fecha ? `el ${fecha} · ` : ""}prendelo para volver a suscribirte`,
      encendido: false,
    };
  }
  return { chip: "sin", etiqueta: "Sin suscribir", detalle: "prendelo para recibir promociones", encendido: false };
}

/** Lo que se le manda a POST /me/consentimientos al tocar el interruptor: apagar si estaba aceptado, si no, pedir. */
export function cuerpoDeToggle(canal, fila) {
  const quiere = !(fila?.estado === "aceptado");
  return { [canal]: quiere };
}

/** El aviso de éxito tras un cambio en el perfil (nota verde). `fila` = el estado que devolvió el back. */
export function mensajeTrasCambio(canal, queria, fila, destino) {
  const nombre = NOMBRE_CANAL[canal];
  if (!queria) return `Listo: ya no te mandamos promociones por ${nombre}.`;
  if (fila?.estado === "aceptado") return `Listo: vas a recibir promociones por ${nombre}.`;
  if (canal === "whatsapp") {
    return destino
      ? `Te mandamos un WhatsApp a ${destino} para confirmar. Hasta que lo confirmes, no te mandamos promociones.`
      : "Te mandamos un WhatsApp para confirmar. Hasta que lo confirmes, no te mandamos promociones.";
  }
  return "Listo: guardamos tu cambio.";
}

/** ISO con zona («2026-10-12T21:30:00+00:00») -> «12 oct 2026» en hora de Argentina. */
export function fechaCortaAR(iso) {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return fechaCorta(iso);
  const partes = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).formatToParts(d);
  const v = (t) => Number(partes.find((p) => p.type === t)?.value);
  return `${v("day")} ${MESES[v("month") - 1].slice(0, 3)} ${v("year")}`;
}

/** La frase de UN evento de la bitácora. `ref_numero` (id de la venta, sólo ventas propias) se muestra como en /mis-pedidos. */
export function fraseDeEvento(canal, ev) {
  const nombre = NOMBRE_CANAL[canal];
  const pedido = ev?.ref_numero ? ` del pedido #${ev.ref_numero}` : "";
  const origen = {
    checkout: ` en el checkout${pedido}`,
    reserva: " al reservar un turno",
    registro: " desde tu perfil",
    newsletter: " desde el newsletter",
    reconfirmacion: " al confirmar el mail",
    admin: " a pedido del comercio",
  }[ev?.origen] || "";
  switch (ev?.estado) {
    case "aceptado":
      return ev.origen === "reactivacion" ? `Volviste a suscribirte por ${nombre}.` : `Aceptaste recibir por ${nombre}${origen}.`;
    case "pendiente":
      return `Pediste recibir por ${nombre}${origen}; falta confirmarlo.`;
    case "baja":
      return ev.origen === "admin" ? `El comercio te dio de baja de ${nombre}.` : `Te diste de baja de ${nombre}.`;
    case "sin_consentimiento":
      return `Cambió tu ${canal === "email" ? "email" : "teléfono"}: volvé a aceptar para recibir promociones por ${nombre}.`;
    default:
      return null;
  }
}

/**
 * Historial chico al pie: los eventos de la bitácora (`canales.X.eventos[]`, últimos 10 por canal, más nuevo
 * primero) de los dos canales mezclados, más nuevo primero, hasta `limite` líneas. Si el back no manda
 * `eventos`, se usa el último cambio de cada canal (estado + desde + origen).
 */
export function historialDe(canales, { limite = 6 } = {}) {
  const filas = [];
  for (const canal of CANALES) {
    const f = canales?.[canal];
    if (!f) continue;
    if (Array.isArray(f.eventos)) {
      f.eventos.forEach((ev, i) => {
        const texto = fraseDeEvento(canal, ev);
        if (texto && ev.created_at) {
          filas.push({ clave: `${canal}-${i}`, canal, orden: String(ev.created_at), fecha: fechaCortaAR(ev.created_at), texto });
        }
      });
    } else if (f.estado && f.estado !== "sin_consentimiento" && f.desde) {
      const texto = fraseDeEvento(canal, { estado: f.estado, origen: f.origen });
      if (texto) filas.push({ clave: `${canal}-0`, canal, orden: String(f.desde).replace(" ", "T"), fecha: fechaCorta(f.desde), texto });
    }
  }
  // Orden por instante real (los ISO vienen con zona, los `desde` sin ella: se comparan como Date si se puede).
  const t = (x) => { const d = new Date(x.orden); return Number.isNaN(d.getTime()) ? 0 : d.getTime(); };
  return filas.sort((a, b) => t(b) - t(a)).slice(0, limite);
}

/** Sólo los 3 datos del perfil que el cliente tiene cargados (nombre, email, teléfono). */
export function datosDelPerfil(user) {
  return [
    { clave: "nombre", etiqueta: "Nombre", valor: user?.nombre || "" },
    { clave: "email", etiqueta: "Email", valor: user?.email || "" },
    { clave: "telefono", etiqueta: "Teléfono", valor: user?.telefono || "" },
  ].filter((d) => d.valor);
}
