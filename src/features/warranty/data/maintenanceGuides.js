/**
 * Guias de limpieza y mantenimiento por tipo de equipo.
 *
 * Fuente: "DATA MANTENIMIENTO WEB" (Beam, Wash LED, Estrobo LED, Barra LED,
 * Maquina de humo). Cada guia alimenta:
 *   - las cards de la pagina /garantias (una card por guia)
 *   - el carrusel de la seccion Soporte del landing (cada imagen abre su guia)
 *
 * Estructura de cada seccion: { heading, note?, items[] }.
 * Para reemplazar la imagen de una guia, editar el campo `image`.
 */

export const maintenanceContact = {
  phone: '+54 9 11-6898-5633',
  phoneHref:
    'https://wa.me/5491168985633?text=Hola%20Kolortec%2C%20necesito%20ayuda%20con%20el%20mantenimiento%20de%20un%20equipo.',
  email: 'kolortec.soporte@gmail.com',
  emailHref: 'mailto:kolortec.soporte@gmail.com',
}

const ELEMENTOS_BASICOS = [
  'Pano de microfibra suave.',
  'Aire comprimido o sopladora de baja presion.',
  'Pincel antiestatico suave.',
  'Alcohol isopropilico (preferentemente 99%).',
  'Hisopos o panos sin pelusa.',
]

export const maintenanceGuides = [
  {
    slug: 'cabezal-beam',
    name: 'Cabezal Beam',
    category: 'Cabezal movil',
    image: '/assets/products/prod-013.webp',
    intro:
      'Mantener un cabezal Beam limpio ayuda a conservar el brillo, evitar sobrecalentamientos y prolongar la vida util del equipo. Una limpieza periodica tambien mejora la calidad del haz de luz y reduce fallas por acumulacion de polvo.',
    sections: [
      {
        heading: 'Antes de comenzar',
        items: [
          'Apaga el equipo y desconectalo de la corriente.',
          'Espera unos minutos hasta que se enfrie completamente.',
          'Trabaja en un lugar limpio y sin humedad.',
        ],
      },
      {
        heading: 'Elementos recomendados',
        items: ELEMENTOS_BASICOS,
      },
      {
        heading: 'Limpieza exterior',
        items: [
          'Retira el polvo de las rejillas y ventiladores con aire comprimido.',
          'Limpia la carcasa con un pano seco o apenas humedecido.',
          'Revisa que las entradas de ventilacion esten libres de suciedad.',
        ],
      },
      {
        heading: 'Limpieza de lentes y opticas',
        items: [
          'Utiliza aire comprimido para sacar el polvo superficial.',
          'Limpia las lentes con un pano de microfibra y unas gotas de alcohol isopropilico.',
          'Hace movimientos suaves y circulares, sin presionar demasiado.',
          'Evita tocar las opticas con los dedos.',
        ],
      },
      {
        heading: 'Limpieza interna (mantenimiento tecnico)',
        note: 'Abri el equipo unicamente si tenes conocimientos tecnicos.',
        items: [
          'Elimina el polvo acumulado en placas, disipadores y ventiladores.',
          'Revisa conectores, cables y estado de los coolers.',
          'Nunca uses agua ni productos abrasivos.',
          'Evita tocar los gobos dicroicos y ruedas de color, ya que puede afectar la proyeccion.',
        ],
      },
      {
        heading: 'Frecuencia recomendada',
        items: [
          'Uso ocasional: cada 3 a 6 meses.',
          'Uso profesional o en eventos: una vez por mes.',
          'Ambientes con humo o polvo: limpieza mas frecuente.',
        ],
      },
      {
        heading: 'Recomendaciones importantes',
        items: [
          'No uses limpiavidrios comunes ni solventes fuertes.',
          'No pulverices liquidos directamente sobre el equipo.',
          'Evita golpes o movimientos bruscos sobre las lentes y motores.',
          'Verifica que el equipo este completamente seco antes de volver a encenderlo.',
        ],
      },
    ],
    closing:
      'Un mantenimiento correcto mejora el rendimiento del cabezal, evita perdidas de luminosidad y ayuda a prevenir reparaciones costosas.',
  },
  {
    slug: 'cabezal-wash-led',
    name: 'Cabezal Wash LED',
    category: 'Cabezal movil',
    image: '/assets/products/prod-015.webp',
    intro:
      'Mantener un cabezal Wash LED limpio ayuda a conservar la calidad de color, mejorar la proyeccion de luz y prolongar la vida util del equipo. Realizar una limpieza periodica tambien ayuda a evitar sobrecalentamientos y reducir fallas provocadas por acumulacion de polvo y suciedad.',
    sections: [
      {
        heading: 'Antes de comenzar',
        items: [
          'Apaga el equipo y desconectalo de la corriente.',
          'Espera unos minutos hasta enfriarse completamente.',
          'Trabaja en un lugar limpio y seco.',
        ],
      },
      {
        heading: 'Elementos recomendados',
        items: ELEMENTOS_BASICOS,
      },
      {
        heading: 'Limpieza exterior',
        items: [
          'Retira el polvo de las rejillas y ventiladores con aire comprimido.',
          'Limpia la carcasa con un pano seco o apenas humedecido.',
          'Revisa que las entradas y salidas de ventilacion esten libres de suciedad.',
          'Verifica el estado de soportes, trabas y tornillos.',
        ],
      },
      {
        heading: 'Limpieza de lentes y opticas',
        items: [
          'Utiliza aire comprimido para eliminar el polvo superficial.',
          'Limpia las lentes frontales con un pano de microfibra y unas gotas de alcohol isopropilico.',
          'Realiza movimientos suaves y circulares para evitar marcas.',
          'Evita tocar directamente los LEDs o las opticas con los dedos.',
        ],
      },
      {
        heading: 'Limpieza interna (mantenimiento tecnico)',
        note: 'Abri el equipo unicamente si tenes conocimientos tecnicos.',
        items: [
          'Elimina el polvo acumulado en placas electronicas, disipadores y ventiladores.',
          'Revisa conectores, cables y funcionamiento de los coolers.',
          'No utilices agua ni productos abrasivos.',
          'Evita ejercer presion sobre las placas LED o componentes opticos.',
        ],
      },
      {
        heading: 'Frecuencia recomendada',
        items: [
          'Uso ocasional: limpieza cada 3 a 6 meses.',
          'Uso profesional o en eventos: limpieza una vez por mes.',
          'Ambientes con humo, polvo o efectos atmosfericos: limpieza con mayor frecuencia.',
        ],
      },
      {
        heading: 'Recomendaciones importantes',
        items: [
          'No utilices limpiavidrios comunes ni solventes fuertes.',
          'No pulverices liquidos directamente sobre el equipo.',
          'Evita golpes o movimientos bruscos sobre lentes y mecanismos moviles.',
          'Verifica que el equipo este completamente seco antes de volver a encenderlo.',
        ],
      },
    ],
    closing:
      'Realizar un mantenimiento correcto ayuda a mejorar el rendimiento del cabezal Wash LED, mantener colores mas uniformes y prevenir fallas o reparaciones innecesarias.',
  },
  {
    slug: 'estrobo-led',
    name: 'Estrobo LED',
    category: 'Efectos',
    image: '/assets/products/prod-017.webp',
    intro:
      'Mantener un estrobo LED limpio ayuda a conservar la intensidad luminica, evitar sobrecalentamientos y prolongar la vida util del equipo. Una limpieza periodica tambien mejora la ventilacion y reduce fallas ocasionadas por polvo y suciedad acumulada.',
    sections: [
      {
        heading: 'Antes de comenzar',
        items: [
          'Apaga el equipo y desconectalo de la corriente.',
          'Espera unos minutos hasta que se enfrie completamente.',
          'Trabaja en un lugar limpio y seco.',
        ],
      },
      {
        heading: 'Elementos recomendados',
        items: ELEMENTOS_BASICOS,
      },
      {
        heading: 'Limpieza exterior',
        items: [
          'Retira el polvo de las rejillas y ventiladores con aire comprimido.',
          'Limpia la carcasa con un pano seco o apenas humedecido.',
          'Revisa que las entradas y salidas de ventilacion esten libres de suciedad.',
          'Verifica que los soportes y tornillos esten firmes.',
        ],
      },
      {
        heading: 'Limpieza de lentes y difusores',
        items: [
          'Utiliza aire comprimido para eliminar el polvo superficial.',
          'Limpia el frente del estrobo con un pano de microfibra y unas gotas de alcohol isopropilico.',
          'Realiza movimientos suaves y circulares para evitar marcas.',
          'Evita presionar excesivamente sobre los LEDs o difusores.',
        ],
      },
      {
        heading: 'Limpieza interna (mantenimiento tecnico)',
        note: 'Abri el equipo unicamente si tenes conocimientos tecnicos.',
        items: [
          'Elimina el polvo acumulado en placas electronicas, ventiladores y disipadores.',
          'Revisa conectores, cables y estado general de los componentes.',
          'Nunca uses agua ni productos abrasivos.',
          'Evita tocar directamente los LEDs o componentes electronicos con las manos.',
        ],
      },
      {
        heading: 'Frecuencia recomendada',
        items: [
          'Uso ocasional: cada 3 a 6 meses.',
          'Uso profesional o en eventos: una vez por mes.',
          'Ambientes con humo, polvo o efectos atmosfericos: limpieza mas frecuente.',
        ],
      },
      {
        heading: 'Recomendaciones importantes',
        items: [
          'No uses limpiavidrios comunes ni solventes fuertes.',
          'No pulverices liquidos directamente sobre el equipo.',
          'Evita golpes o movimientos bruscos durante la limpieza.',
          'Verifica que el equipo este completamente seco antes de volver a encenderlo.',
        ],
      },
    ],
    closing:
      'Un mantenimiento correcto mejora el rendimiento del estrobo, ayuda a mantener una iluminacion uniforme y reduce el riesgo de fallas o reparaciones innecesarias.',
  },
  {
    slug: 'barra-led',
    name: 'Barra LED',
    category: 'Iluminacion lineal',
    image: '/assets/products/prod-011.webp',
    intro:
      'Mantener una barra LED limpia ayuda a conservar la intensidad luminica, mejorar la uniformidad de color y prolongar la vida util del equipo. Una limpieza periodica tambien evita sobrecalentamientos y reduce fallas causadas por polvo y suciedad acumulada.',
    sections: [
      {
        heading: 'Antes de comenzar',
        items: [
          'Apaga el equipo y desconectalo de la corriente.',
          'Espera unos minutos hasta que se enfrie completamente.',
          'Trabaja en un lugar limpio y seco.',
        ],
      },
      {
        heading: 'Elementos recomendados',
        items: ELEMENTOS_BASICOS,
      },
      {
        heading: 'Limpieza exterior',
        items: [
          'Retira el polvo de la carcasa y rejillas de ventilacion con aire comprimido.',
          'Limpia la estructura exterior con un pano seco o apenas humedecido.',
          'Revisa que las conexiones y conectores esten limpios y libres de suciedad.',
          'Verifica el estado de soportes y tornillos de montaje.',
        ],
      },
      {
        heading: 'Limpieza de lentes y difusores',
        items: [
          'Utiliza aire comprimido para eliminar el polvo superficial.',
          'Limpia las lentes o difusores frontales con un pano de microfibra y unas gotas de alcohol isopropilico.',
          'Realiza movimientos suaves y circulares para evitar marcas.',
          'Evita presionar directamente sobre los LEDs o difusores.',
        ],
      },
      {
        heading: 'Limpieza interna (mantenimiento tecnico)',
        note: 'Abri el equipo unicamente si tenes conocimientos tecnicos.',
        items: [
          'Elimina el polvo acumulado en placas electronicas, ventiladores y disipadores.',
          'Revisa conectores, cables y estado general de los componentes.',
          'Nunca uses agua ni productos abrasivos.',
          'Evita tocar directamente los LEDs o componentes electronicos con las manos.',
        ],
      },
      {
        heading: 'Frecuencia recomendada',
        items: [
          'Uso ocasional: cada 3 a 6 meses.',
          'Uso profesional o en eventos: una vez por mes.',
          'Ambientes con humo, polvo o efectos atmosfericos: limpieza mas frecuente.',
        ],
      },
      {
        heading: 'Recomendaciones importantes',
        items: [
          'No uses limpiavidrios comunes ni solventes fuertes.',
          'No pulverices liquidos directamente sobre el equipo.',
          'Evita golpes o movimientos bruscos durante la limpieza.',
          'Verifica que el equipo este completamente seco antes de volver a encenderlo.',
        ],
      },
    ],
    closing:
      'Un mantenimiento correcto mejora el rendimiento de la barra LED, mantiene una iluminacion uniforme y ayuda a prevenir fallas o reparaciones innecesarias.',
  },
  {
    slug: 'maquina-de-humo',
    name: 'Maquina de humo',
    category: 'Efectos',
    image:
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1200&q=80',
    intro:
      'Mantener una maquina de humo limpia es fundamental para asegurar un funcionamiento correcto, evitar obstrucciones y prolongar la vida util del equipo. Una limpieza periodica tambien ayuda a mantener una salida de humo uniforme y reduce fallas en la bomba o el sistema de calefaccion.',
    sections: [
      {
        heading: 'Antes de comenzar',
        items: [
          'Apaga el equipo y desconectalo de la corriente.',
          'Espera a que la maquina se enfrie completamente.',
          'Trabaja en un lugar limpio y ventilado.',
        ],
      },
      {
        heading: 'Elementos recomendados',
        items: [
          'Pano de microfibra suave.',
          'Aire comprimido o sopladora de baja presion.',
          'Pincel antiestatico suave.',
          'Agua destilada.',
          'Liquido limpiador especifico para maquinas de humo.',
          'Recipiente limpio para vaciar el tanque.',
        ],
      },
      {
        heading: 'Limpieza exterior',
        items: [
          'Retira el polvo de rejillas y ventiladores con aire comprimido.',
          'Limpia la carcasa con un pano seco o apenas humedecido.',
          'Revisa que las entradas de ventilacion esten libres de suciedad.',
          'Verifica el estado de conectores, cables y soportes.',
        ],
      },
      {
        heading: 'Limpieza del sistema interno',
        items: [
          'Vacia completamente el tanque de liquido antes de guardar el equipo.',
          'Nunca dejes liquido almacenado durante largos periodos dentro de la maquina.',
          'Utiliza liquido limpiador especifico o agua destilada para limpiar el circuito interno.',
          'Hace funcionar la maquina unos minutos con el liquido limpiador para eliminar residuos y obstrucciones.',
          'Luego del proceso, vacia nuevamente el tanque.',
        ],
      },
      {
        heading: 'Limpieza de boquillas y conductos',
        items: [
          'Revisa que la salida de humo no tenga residuos o suciedad acumulada.',
          'Utiliza aire comprimido cuidadosamente para limpiar la boquilla.',
          'No introduzcas objetos metalicos o punzantes en la salida de humo.',
        ],
      },
      {
        heading: 'Frecuencia recomendada',
        items: [
          'Uso ocasional: limpieza cada 2 a 3 meses.',
          'Uso profesional o en eventos: limpieza mensual.',
          'Uso intensivo o ambientes con mucho polvo: limpieza mas frecuente.',
        ],
      },
      {
        heading: 'Recomendaciones importantes',
        items: [
          'Utiliza unicamente liquidos de humo de buena calidad y recomendados para el equipo.',
          'No mezcles diferentes tipos de liquidos.',
          'No uses agua corriente ni productos abrasivos en el sistema interno.',
          'Siempre vacia el liquido restante antes de transportar o guardar la maquina.',
          'Verifica que el tanque y las mangueras esten completamente limpios antes de volver a utilizar el equipo.',
        ],
      },
    ],
    closing:
      'Un mantenimiento correcto mejora el rendimiento de la maquina de humo, evita obstrucciones internas y ayuda a prevenir reparaciones costosas o fallas prematuras.',
  },
]

export function getMaintenanceGuideBySlug(slug) {
  if (!slug) return null
  return maintenanceGuides.find((g) => g.slug === slug) ?? null
}

export function listMaintenanceGuides() {
  return maintenanceGuides
}
