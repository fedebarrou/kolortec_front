import LegalPage from '../components/LegalPage'

/**
 * Términos y Condiciones de uso.
 *
 * LA CLÁUSULA QUE DEFINE TODO ES LA 1: este sitio NO vende online. No hay
 * carrito, ni checkout, ni pasarela de pago — verificado en el código. De ahí
 * se desprende que no corresponde el "botón de arrepentimiento" de la
 * Resolución 424/2020 de la Secretaría de Comercio Interior, que alcanza a
 * "los proveedores que comercialicen bienes y servicios a través de páginas o
 * aplicaciones web". Acá la operación se cierra fuera del sitio.
 *
 * ⚠️ SI ALGÚN DÍA SE PRENDE LA VENTA ONLINE, ESTO CAMBIA: pasan a ser
 * obligatorios el botón de arrepentimiento en la página de inicio (con acceso
 * directo, sin registro previo, y respuesta con código dentro de las 24 horas)
 * y todo el régimen de revocación de 10 días corridos del artículo 34 de la
 * Ley 24.240 y 1110 del Código Civil y Comercial.
 *
 * NO HAY CLÁUSULA DE PRÓRROGA DE JURISDICCIÓN, y no es un olvido: el artículo
 * 1109 del Código Civil y Comercial la tiene POR NO ESCRITA en los contratos
 * celebrados a distancia o por medios electrónicos. Ponerla sería a la vez
 * inútil y una señal de que el texto se copió de una plantilla.
 */

const secciones = (r) => [
  {
    id: 'que-es',
    titulo: '1. Qué es este sitio',
    bloques: [
      `kolortec.com.ar es el sitio institucional y el catálogo de productos de ${r.nombre}. Su finalidad es mostrar la línea de equipos, publicar material técnico y facilitar el contacto con nosotros.`,
      'Este sitio no vende online. No hay carrito de compras ni medio de pago: no se puede contratar ni comprar nada desde acá. Toda operación se acuerda por fuera del sitio, por los canales de contacto que publicamos, y se rige por lo que se pacte en ese momento.',
      'Al usar el sitio aceptás estos términos. Si no estás de acuerdo con alguno, no lo uses.',
    ],
  },
  {
    id: 'catalogo',
    titulo: '2. Información del catálogo, precios y disponibilidad',
    bloques: [
      'Ponemos cuidado en que las fichas, las especificaciones técnicas y las imágenes sean correctas y estén al día. Aun así, la información del catálogo es de carácter informativo y orientativo, y no constituye una oferta vinculante.',
      {
        tipo: 'lista',
        items: [
          'Las especificaciones pueden cambiar por actualizaciones del fabricante sin aviso previo.',
          'Las imágenes son ilustrativas y pueden diferir del producto en aspectos no funcionales.',
          'La disponibilidad y los plazos se confirman al momento de cotizar, no en el sitio.',
          'Si se muestran precios, son de referencia, están expresados en la moneda que se indique y no incluyen impuestos, envío ni instalación salvo que se aclare.',
        ],
      },
      'Si detectás un error en una ficha, escribinos y lo corregimos.',
    ],
  },
  {
    id: 'cuenta',
    titulo: '3. Tu cuenta y las descargas',
    bloques: [
      'Parte del material técnico (manuales, fichas y archivos de producto) requiere iniciar sesión. La cuenta es personal: sos responsable de la actividad que se haga desde ella y de mantener el acceso a tu correo protegido.',
      'Podemos suspender o dar de baja una cuenta si detectamos un uso que perjudique el servicio o a terceros, o si se usa para obtener el material de forma masiva o automatizada.',
    ],
  },
  {
    id: 'material',
    titulo: '4. Uso del material descargable',
    bloques: [
      'El material que publicamos para descarga se ofrece para que puedas evaluar, instalar, operar y mantener los equipos. Podés usarlo y compartirlo con ese fin, sin alterarlo.',
      {
        tipo: 'lista',
        items: [
          'No modifiques los documentos ni les saques las marcas de identificación.',
          'No los publiques como propios ni los redistribuyas con fines comerciales.',
          'Los archivos se entregan tal como están: son documentación de referencia y no reemplazan la instalación por personal idóneo.',
        ],
      },
    ],
  },
  {
    id: 'resenas',
    titulo: '5. Reseñas y contenido de usuarios',
    bloques: [
      'Si publicás una reseña, sos responsable de lo que escribas. Al enviarla, nos autorizás a mostrarla en la ficha del producto junto al nombre que hayas indicado.',
      'Revisamos las reseñas antes de publicarlas y podemos no publicar, o dar de baja, las que sean ofensivas, falsas, ajenas al producto, publicidad de terceros o que incluyan datos personales de otras personas. Moderar no significa que hagamos nuestras las opiniones publicadas.',
    ],
  },
  {
    id: 'propiedad',
    titulo: '6. Propiedad intelectual',
    bloques: [
      'Los textos, imágenes, videos, fichas técnicas, el diseño del sitio y su código están protegidos por la Ley N° 11.723 de Propiedad Intelectual. Las marcas, logotipos y nombres comerciales que aparecen son de sus respectivos titulares y están protegidos por la Ley N° 22.362 de Marcas.',
      'Podés citar o enlazar nuestro contenido indicando la fuente. No podés reproducirlo de forma sustancial, adaptarlo ni explotarlo comercialmente sin autorización previa por escrito.',
    ],
  },
  {
    id: 'enlaces',
    titulo: '7. Enlaces a otros sitios',
    bloques: [
      'El sitio puede enlazar a páginas de fabricantes, redes sociales u otros terceros. Esos sitios tienen sus propias condiciones y políticas de privacidad, que no controlamos. Incluir un enlace no implica que respaldemos su contenido.',
    ],
  },
  {
    id: 'disponibilidad',
    titulo: '8. Disponibilidad del sitio',
    bloques: [
      'Procuramos que el sitio esté disponible y funcione correctamente, pero puede haber interrupciones por mantenimiento, fallas técnicas o causas ajenas a nosotros. No garantizamos disponibilidad ininterrumpida.',
      'Nada de lo dicho acá limita los derechos que te reconocen la Ley N° 24.240 de Defensa del Consumidor y el Código Civil y Comercial de la Nación cuando corresponda: esos derechos son irrenunciables y prevalecen sobre estos términos.',
    ],
  },
  {
    id: 'datos',
    titulo: '9. Datos personales',
    bloques: [
      'El tratamiento de los datos personales que se recolectan en el sitio se explica en la Política de Privacidad, que forma parte de estos términos.',
    ],
  },
  {
    id: 'ley',
    titulo: '10. Ley aplicable y reclamos',
    bloques: [
      'Estos términos se rigen por las leyes de la República Argentina.',
      'Si mediara una relación de consumo, resulta competente el juez del lugar donde recibiste o debiste recibir la prestación, conforme al artículo 1109 del Código Civil y Comercial de la Nación. Esa norma es de orden público y por eso este documento no incluye ninguna cláusula que fije otra jurisdicción: sería tenida por no escrita.',
      `Antes de cualquier reclamo formal, escribinos a ${r.email}. La mayoría de las cosas se resuelven así, y más rápido.`,
    ],
  },
  {
    id: 'cambios',
    titulo: '11. Cambios en estos términos',
    bloques: [
      'Podemos actualizar estos términos. La fecha de la última actualización figura al comienzo de esta página, y la versión vigente es siempre la publicada acá. Si el cambio es sustancial, lo vamos a comunicar por un medio visible.',
    ],
  },
]

function TerminosPage() {
  return (
    <LegalPage
      eyebrow="Condiciones de uso"
      titulo="Términos y condiciones"
      bajada="Las reglas de uso de este sitio: qué es y qué no es, qué valor tiene la información del catálogo, cómo se usa el material descargable y qué ley se aplica."
      ruta="/terminos"
      seoTitle="Términos y condiciones · Kolortec"
      seoDesc="Condiciones de uso del sitio de Kolortec: catálogo informativo sin venta online, uso del material técnico descargable, reseñas, propiedad intelectual y ley aplicable."
      secciones={secciones}
    />
  )
}

export default TerminosPage
