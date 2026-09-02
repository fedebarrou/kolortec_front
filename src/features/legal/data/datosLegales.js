/**
 * datosLegales.js — los datos de identificación que la API NO puede dar.
 *
 * ⚠️ ESTE ES EL ÚNICO ARCHIVO QUE HAY QUE COMPLETAR. Las páginas legales leen
 * el nombre y el mail de contacto desde la cuenta (`/public/web-config`), pero
 * la razón social, el CUIT y el domicilio no viven en tiendita: van acá.
 *
 * POR QUÉ IMPORTA: identificar al responsable no es una formalidad. La Ley
 * 25.326 se apoya en que el titular de los datos sepa A QUIÉN reclamarle, y la
 * Ley 24.240 (art. 4) obliga a informar de forma cierta y detallada. Una
 * política de privacidad sin responsable identificado es una política de
 * privacidad incompleta.
 *
 * MIENTRAS ESTÉN EN `null` las páginas NO imprimen un `[COMPLETAR]` en pantalla
 * —eso queda peor que no decir nada— sino que omiten la línea. Está hecho a
 * propósito así: el sitio no miente, pero tampoco simula que el dato existe.
 *
 * Para completarlo: pedirle al cliente la constancia de inscripción de AFIP
 * (razón social exacta, CUIT y domicilio fiscal) y pegarlo tal cual figura ahí.
 */

export const DATOS_LEGALES = {
  /**
   * Quién es el responsable, TAL CUAL figura en AFIP.
   *
   * Si hay sociedad, va la razón social: 'Kolortec S.R.L.'.
   * Si es persona humana (monotributo o responsable inscripto sin sociedad),
   * NO hay razón social: va el nombre y apellido completo del titular, que es
   * lo que identifica al responsable en ese caso. No dejarlo vacío por no
   * tener sociedad — el dato que importa es a quién se le reclama.
   */
  razonSocial: null,

  /** CUIT o CUIT/CUIL del titular, con guiones. Ej: '30-71234567-8' */
  cuit: null,

  /**
   * Domicilio. El mismo que se declare ante la AAIP para ejercer derechos
   * (ver `docs/AAIP-REGISTRO-BASES.md`): si no coinciden, la política de
   * privacidad y la inscripción dicen cosas distintas.
   */
  domicilio: null,

  /**
   * Fecha de la última revisión de los textos. Se muestra en las dos páginas.
   * Cambiarla CADA VEZ que se toque el contenido legal: es lo que le permite a
   * alguien saber qué versión aceptó.
   */
  ultimaActualizacion: '2 de septiembre de 2026',

  /**
   * Mail de respaldo para ejercer derechos, sólo si la cuenta no tiene uno
   * cargado. El bueno es el de la cuenta (se edita desde el admin).
   */
  emailRespaldo: 'kolortec@gmail.com',
}

/**
 * Los datos del responsable, mezclando lo que dice la cuenta con lo de acá.
 * Lo de la cuenta gana: es lo que el dueño mantiene y ve.
 */
export function armarResponsable(desdeLaCuenta = {}) {
  return {
    nombre: desdeLaCuenta.nombre || 'Kolortec',
    email: desdeLaCuenta.email || DATOS_LEGALES.emailRespaldo,
    telefono: desdeLaCuenta.telefono || null,
    razonSocial: DATOS_LEGALES.razonSocial,
    cuit: DATOS_LEGALES.cuit,
    domicilio: DATOS_LEGALES.domicilio,
  }
}
