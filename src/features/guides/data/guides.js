/**
 * Cluster Soporte — guías técnicas (Fase 3.2 del plan SEO).
 *
 * Cada guía sigue la estructura: H1 = pregunta/keyword, intro con
 * solución corta, pasos detallados, y CTA a /soporte. Pensadas para
 * tráfico de alta intención (troubleshooting + mantenimiento).
 *
 * Cuando llegue el CMS / API:
 *   - mover este array a un fetch en src/data/guides.mjs
 *   - el sitemap (scripts/gen-sitemap.mjs) ya consume la lista
 *     desde routes.mjs → listGuideRoutes()
 */

export const guides = [
  {
    slug: 'cabezal-movil-no-enciende',
    title: 'Mi cabezal móvil no enciende: guía de diagnóstico paso a paso',
    seoTitle: 'Cabezal móvil no enciende: diagnóstico paso a paso · Kolortec',
    seoDescription:
      'Tu cabezal móvil no enciende y necesitás llegar al show. Guía rápida para identificar la causa: fuente, fusible, control y motor. Soporte local de Kolortec.',
    excerpt:
      'Antes de mandarlo a service: revisá fuente, fusible y línea de datos en este orden. El 80% de los "no enciende" se resuelve en el rack.',
    publishedAt: '2026-05-20',
    sections: [
      {
        heading: '1. ¿Tenés tensión real en el equipo?',
        body:
          'Probá la línea con un tester en el conector del cabezal. Si la línea tiene 220V pero el LCD no enciende, andá al fusible interno (lado fuente). Si la línea no tiene tensión, revisá la regleta, el power-in y el cable IEC — son la causa más frecuente en gira.',
      },
      {
        heading: '2. Fusible quemado: cuál cambiar y por qué saltó',
        body:
          'Los cabezales Kolortec usan dos fusibles: principal (cerca del power-in, suele ser cerámico 6.3x32) y secundario en placa de fuente. Si reemplazás y vuelve a saltar al primer encendido, no insistas: hay un corto en la fuente. Documentalo y abrí ticket en /soporte con el modelo y N° de serie.',
      },
      {
        heading: '3. La fuente enciende pero el cabezal no homea',
        body:
          'Si escuchás los motores arrancar y se cuelga a mitad del homing, el problema suele ser el encoder de pan o tilt. Probá apagar 30s, encender en frío y observar qué eje se traba primero. Ese dato acelera el diagnóstico cuando contactás soporte.',
      },
      {
        heading: '4. Pantalla negra y ningún sonido de motor',
        body:
          'Apunta a la placa de control (mainboard). Antes de asumir lo peor, desconectá DMX y todos los addons. Si con el cabezal aislado sigue sin dar señal, agendá repuesto: tenemos mainboards en stock local para los modelos vigentes.',
      },
    ],
    cta: {
      label: 'Abrir caso con soporte técnico',
      href: '/contacto',
    },
  },
  {
    slug: 'cabezal-movil-no-responde-dmx',
    title: 'Cabezal móvil que no responde a DMX: causas y solución',
    seoTitle: 'Cabezal móvil no responde a DMX: causas y solución · Kolortec',
    seoDescription:
      '¿El cabezal homea bien pero no recibe DMX? Repasamos cableado, terminación, dirección, modo y conflicto de canales. Diagnóstico real para escenario.',
    excerpt:
      'Si el cabezal enciende pero ignora la consola, el problema está en la cadena DMX o en la dirección. Cuatro chequeos antes de revolver el rack.',
    publishedAt: '2026-05-20',
    sections: [
      {
        heading: '1. Terminación y polaridad — lo primero que falla',
        body:
          'Confirmá que tenés un terminador 120Ω al final de la cadena DMX. La polaridad pin 2/pin 3 también suele venir invertida si el cableado lo armó otra persona. Probá con un cable corto directo de la consola al cabezal: si funciona, el problema es la línea, no el equipo.',
      },
      {
        heading: '2. Dirección DMX y modo personality',
        body:
          'Verificá que la dirección que cargaste en consola coincida con la del cabezal y que el modo (8ch / 16ch / 24ch / extended) sea exactamente el mismo. Un mismo cabezal en "16ch standard" y la consola patcheada en "24ch extended" da el clásico "enciende pero no responde".',
      },
      {
        heading: '3. Splitter o cadena DMX larga',
        body:
          'Más de 30 equipos en serie o cables muy largos pierden señal. Si usás splitter, revisá que sea ópticamente aislado y que cada rama tenga su terminador. En instalaciones permanentes, agregar un splitter cada 16 fixtures es la regla práctica.',
      },
      {
        heading: '4. RDM activo y conflictos',
        body:
          'Algunas consolas envían tramas RDM que confunden cabezales viejos. Desactivá RDM y volvé a probar. Si recuperás control, el cabezal está en buen estado y podés re-activar RDM con el modo correcto.',
      },
    ],
    cta: {
      label: 'Pedir asesoramiento DMX',
      href: '/contacto',
    },
  },
  {
    slug: 'errores-direccionamiento-dmx',
    title: 'Errores de direccionamiento DMX más comunes y cómo evitarlos',
    seoTitle: 'Errores de direccionamiento DMX comunes y cómo evitarlos · Kolortec',
    seoDescription:
      'Los 7 errores de direccionamiento DMX que vemos en producciones todas las semanas. Patches superpuestos, offsets mal calculados y modos mezclados.',
    excerpt:
      'El 90% de los problemas DMX no son de hardware: son de patcheo. Lista de los errores que vemos en tour y cómo prevenirlos.',
    publishedAt: '2026-05-20',
    sections: [
      {
        heading: '1. Patch superpuesto entre dos fixtures',
        body:
          'Si pateaste un cabezal de 24ch en 001 y otro de 16ch en 016, los últimos 8 canales del primero pisan los primeros 8 del segundo. Usá la utilidad de overlap-check de tu consola antes del show.',
      },
      {
        heading: '2. Dirección fuera del modo',
        body:
          'Un fixture en 24ch no entra en 489 (488+24>512). Cargá el offset correcto cuando hagas el plan y respetá el límite del universo.',
      },
      {
        heading: '3. Personality diferente entre consola y fixture',
        body:
          'Es el error invisible: el cabezal responde pero los canales no son los que esperás. Confirmá la versión exacta de personality (16ch v1.2 != 16ch v1.4) y descargá el GDTF más reciente desde /soporte.',
      },
      {
        heading: '4. Más de un universo cruzado',
        body:
          'Si manejás dos universos por sACN o Art-Net y tenés un fixture asignado a universe 1 pero conectado físicamente al puerto 2, no va a responder nunca. Etiquetá los nodos.',
      },
      {
        heading: '5. Direcciones por defecto al hacer reset',
        body:
          'Después de un reset de fábrica, todos los fixtures vuelven a 001. En un montaje con 40 cabezales, eso es media hora de re-direccionar a las apuradas. Documentá las direcciones en el rider.',
      },
    ],
    cta: {
      label: 'Descargar perfiles GDTF',
      href: '/contacto',
    },
  },
  {
    slug: 'mantenimiento-cabezas-moviles-rental',
    title: 'Mantenimiento preventivo de cabezas móviles para rentals',
    seoTitle: 'Mantenimiento preventivo de cabezas móviles para rentals · Kolortec',
    seoDescription:
      'Checklist de mantenimiento preventivo para cabezas móviles en rental: limpieza, lubricación, calibración y reemplazo de consumibles. Reducí downtime.',
    excerpt:
      'En rental, una hora de downtime es un cliente perdido. Plan de mantenimiento que aplicamos a la flota Kolortec, fixture por fixture.',
    publishedAt: '2026-05-20',
    sections: [
      {
        heading: 'Cada show: chequeo de 5 minutos',
        body:
          'Limpieza externa con paño microfibra, revisión visual de tornillos de yugo y base, prueba de homing y verificación de pan/tilt completos. Si un eje hace ruido nuevo, marcalo para inspección.',
      },
      {
        heading: 'Cada 50 horas: limpieza interna y óptica',
        body:
          'Abrí el cabezal con la rutina del manual, limpiá lentes y gobos con aire comprimido + paño humedecido en alcohol isopropílico. Reemplazá filtros si los tiene. Una lente sucia te cuesta hasta 30% de output.',
      },
      {
        heading: 'Cada 200 horas: lubricación y firmware',
        body:
          'Lubricá rodamientos de pan/tilt con la grasa recomendada por el fabricante (NUNCA WD-40). Actualizá firmware desde /soporte si hay versión más reciente — solemos liberar patches que mejoran estabilidad de motor.',
      },
      {
        heading: 'Cada 500 horas: lámpara, fuente, calibración',
        body:
          'Si el cabezal usa lámpara de descarga, planificá reemplazo a las 700-800h (no esperes a que se apague). Calibrá colores y zoom con el patrón de fábrica para nivelar la flota. Tené 1-2 fuentes de repuesto en stock para no parar la operación.',
      },
    ],
    cta: {
      label: 'Plan de mantenimiento Kolortec',
      href: '/garantias',
    },
  },
  {
    slug: 'mantenimiento-consola-iluminacion',
    title: 'Cómo mantener tu consola para que nunca falle en escena',
    seoTitle: 'Mantenimiento de consola de iluminación para no fallar en vivo · Kolortec',
    seoDescription:
      'Una consola que se cuelga arruina un show. Buenas prácticas de mantenimiento: backups, firmware, faders, encoders y refrigeración.',
    excerpt:
      'La consola es el único equipo que no se reemplaza por backup en vivo. Cinco hábitos para que llegue al último bis sin colgarse.',
    publishedAt: '2026-05-20',
    sections: [
      {
        heading: '1. Backup del showfile antes y después de cada función',
        body:
          'Guardá el .show en USB y en una segunda consola o laptop. Si la consola se cuelga, podés cargarlo en 2 minutos en el backup. Si nunca lo hiciste y la consola muere, perdiste el show.',
      },
      {
        heading: '2. Firmware: actualizá entre giras, NO antes del show',
        body:
          'Nunca actualices firmware el día del show. Hacelo entre giras, con un showfile de prueba, y validá toda la cadena durante 24h.',
      },
      {
        heading: '3. Faders y encoders: limpieza periódica',
        body:
          'El polvo es el enemigo. Cada 3 meses limpiá faders con aire comprimido y, si están sucios, contact cleaner de electrónica (nunca WD-40). Los encoders se aflojan con uso: ajustalos si "saltan" valores.',
      },
      {
        heading: '4. Refrigeración: el calor mata consolas',
        body:
          'Una consola en un rack cerrado se cuece. Asegurá flujo de aire y, si el rack es ciego, sumá ventilación forzada. Si la consola tiene fan interno, revisá que no esté trabado por polvo.',
      },
      {
        heading: '5. UPS pequeño: salva la sesión',
        body:
          'Un UPS de 600VA aguanta una consola y un par de nodos durante un corte de 5-10 minutos. Lo suficiente para salvar el showfile o terminar un tema.',
      },
    ],
    cta: {
      label: 'Servicio técnico de consolas',
      href: '/contacto',
    },
  },
  {
    slug: 'servicio-tecnico-iluminacion-escenica',
    title: 'Servicio técnico de iluminación escénica: cómo elegir y qué pedir',
    seoTitle: 'Servicio técnico de iluminación escénica: guía 2026 · Kolortec',
    seoDescription:
      'Cómo evaluar un servicio técnico para tus equipos de iluminación: stock de repuestos, tiempo de respuesta, garantía, capacidades de reparación.',
    excerpt:
      'Un buen service no es el más barato: es el que tiene repuestos hoy. Qué preguntar antes de mandar tu cabezal a reparar.',
    publishedAt: '2026-05-20',
    sections: [
      {
        heading: '1. ¿Tienen el repuesto en stock local?',
        body:
          'La diferencia entre 48h y 6 semanas es saber si la fuente, mainboard o motor está en Argentina o hay que importarlo. Preguntá antes y exigí confirmación escrita.',
      },
      {
        heading: '2. ¿Trabajan con tu marca?',
        body:
          'Cabezales de marcas con representación local en Argentina (como Kolortec) tienen ventaja: el service de fábrica conoce cada placa. Para marcas sin soporte local, busca service-third-party con experiencia documentada.',
      },
      {
        heading: '3. Tiempo de diagnóstico y presupuesto',
        body:
          'Un service serio te entrega diagnóstico en 48-72h con presupuesto detallado (mano de obra + repuestos + garantía del trabajo). Si te piden 2 semanas para diagnóstico, buscá otro.',
      },
      {
        heading: '4. Garantía sobre el trabajo',
        body:
          'Un service profesional garantiza 6 meses sobre la reparación. Si no, dudá. En Kolortec ofrecemos 6 meses sobre repuestos originales instalados por nuestro equipo.',
      },
    ],
    cta: {
      label: 'Solicitar diagnóstico Kolortec',
      href: '/contacto',
    },
  },
  {
    slug: 'reparacion-cabezal-movil-profesional',
    title: 'Reparación de cabezal móvil profesional: qué se puede y qué no',
    seoTitle: 'Reparación profesional de cabezal móvil: qué se repara y qué no · Kolortec',
    seoDescription:
      'Mainboard, fuente, motor, encoder, óptica: qué se puede reparar y qué conviene reemplazar. Costos típicos y tiempos reales del taller.',
    excerpt:
      'No todo cabezal "se arregla". Mapa de reparaciones por componente con costos típicos y cuándo conviene cambiar la unidad entera.',
    publishedAt: '2026-05-20',
    sections: [
      {
        heading: 'Fuente quemada',
        body:
          'Casi siempre se reemplaza completa (más rápido y confiable que reparar componentes SMD). Costo típico 8-15% del precio del cabezal nuevo. Disponible en stock local para modelos Kolortec vigentes.',
      },
      {
        heading: 'Mainboard / placa de control',
        body:
          'Se reemplaza completa. En cabezales discontinuados puede ser difícil de conseguir; ahí es donde marca la diferencia comprar fixtures con soporte de larga vida (Kolortec mantiene placas de modelos hasta 7 años post-discontinuación).',
      },
      {
        heading: 'Motores y encoders',
        body:
          'Se reemplazan individualmente. Costo bajo (5-8% del precio del cabezal) pero requiere desarmar el yugo o cabeza, lo que suma mano de obra. Buen candidato para mantenimiento preventivo.',
      },
      {
        heading: 'Óptica y gobos',
        body:
          'Lentes rotas se reemplazan; rueda de gobos completa o gobo individual también. Costos bajos. Aprovechá la apertura para limpiar todo el camino óptico.',
      },
      {
        heading: 'Cuándo NO conviene reparar',
        body:
          'Si el cabezal tiene 8+ años, la suma de reparaciones excede el 60% del precio de uno nuevo, y la fábrica ya no fabrica repuestos: es momento de retirarlo. Te ayudamos a evaluar caso por caso.',
      },
    ],
    cta: {
      label: 'Cotizar reparación',
      href: '/contacto',
    },
  },
  {
    slug: 'repuestos-iluminacion-stock-local',
    title: 'Repuestos de iluminación con stock local: qué tener siempre',
    seoTitle: 'Repuestos de iluminación con stock local en Argentina · Kolortec',
    seoDescription:
      'Lista de repuestos críticos que conviene tener en stock para iluminación profesional: fusibles, lámparas, fuentes, gobos. Disponibilidad real desde Kolortec.',
    excerpt:
      'En gira, esperar 6 semanas un repuesto importado no es opción. Inventario mínimo recomendado para que nunca te quedes parado.',
    publishedAt: '2026-05-20',
    sections: [
      {
        heading: 'Inventario crítico — siempre',
        body:
          'Fusibles (todos los formatos de tu flota), lámparas de descarga (al menos 1 cada 4 cabezales en operación), cable IEC y power-in spares. Esto cubre el 70% de las paradas inesperadas.',
      },
      {
        heading: 'Inventario táctico — para casas de alquiler',
        body:
          'Fuentes de repuesto (1 cada 6 cabezales), mainboards (1 cada 10), set completo de gobos y filtros. Pensalo como seguro: el costo del stock se paga solo evitando un downtime de show.',
      },
      {
        heading: 'Por qué stock local importa',
        body:
          'Importar repuestos desde Asia o Europa tarda 4-8 semanas más nacionalización. Marcas con stock local en Argentina (como Kolortec) entregan en 24-72h. Verificá esto antes de comprar cualquier fixture.',
      },
      {
        heading: 'Cómo armar un kit de repuestos por flota',
        body:
          'Nuestro equipo arma kits personalizados por casa de rental basados en historial de uso. Si tenés 20+ cabezales, escribinos: te armamos el kit que minimiza paradas con la mínima inversión.',
      },
    ],
    cta: {
      label: 'Consultar disponibilidad de repuestos',
      href: '/contacto',
    },
  },
]

export function getGuideBySlug(slug) {
  if (!slug) return null
  return guides.find((g) => g.slug === slug) ?? null
}

export function listGuides() {
  return guides
}
