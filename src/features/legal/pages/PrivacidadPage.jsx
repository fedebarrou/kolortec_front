import LegalPage from '../components/LegalPage'

/**
 * Política de Privacidad.
 *
 * NO es una plantilla: describe lo que ESTE sitio hace, verificado en el
 * código. Los cuatro puntos de recolección son el formulario de /sumate, el
 * login con Google para descargar material, las reseñas de producto y la
 * analítica propia (`shared/services/tracking.js`, que guarda un identificador
 * aleatorio en localStorage bajo `kt_session_id`). Si mañana se agrega otro
 * formulario o un pixel de terceros, ESTE ARCHIVO HAY QUE ACTUALIZARLO: una
 * política que no refleja el tratamiento real es peor que no tener ninguna,
 * porque documenta un incumplimiento.
 *
 * Las dos cláusulas dentro de bloques `cita` son de reproducción OBLIGATORIA
 * (Disposición 10/2008, arts. 1 y 2). No se reescriben ni se resumen.
 */

const secciones = (r) => [
  {
    id: 'responsable',
    titulo: '1. Quién es responsable de tus datos',
    bloques: [
      `El responsable del tratamiento de los datos personales que se recolectan en este sitio es ${r.nombre}${r.razonSocial ? ` (${r.razonSocial})` : ''}.`,
      {
        tipo: 'lista',
        items: [
          ...(r.razonSocial ? [`Razón social: ${r.razonSocial}`] : []),
          ...(r.cuit ? [`CUIT: ${r.cuit}`] : []),
          ...(r.domicilio ? [`Domicilio: ${r.domicilio}`] : []),
          `Correo de contacto: ${r.email}`,
          ...(r.telefono ? [`Teléfono: ${r.telefono}`] : []),
        ],
      },
      'Esta política explica qué datos personales recolectamos a través de kolortec.com.ar, con qué finalidad, con quién los compartimos y cómo podés ejercer tus derechos sobre ellos. Se rige por la Ley N° 25.326 de Protección de los Datos Personales y su reglamentación.',
    ],
  },
  {
    id: 'que-datos',
    titulo: '2. Qué datos recolectamos y en qué momento',
    bloques: [
      'Sólo recolectamos datos cuando vos hacés algo que los requiere. No pedimos datos para navegar el catálogo.',
      {
        tipo: 'definiciones',
        items: [
          {
            termino: 'Formulario "Sumate"',
            texto: 'Si te postulás como distribuidor, integrador o quien sea, nos dejás nombre, apellido, teléfono, correo electrónico, el tipo de vínculo que buscás y el mensaje que escribas. Todos esos campos los completás vos.',
          },
          {
            termino: 'Cuenta para descargar material técnico',
            texto: 'Para descargar fichas, manuales y archivos de producto hay que iniciar sesión. Si entrás con Google, recibimos de Google tu nombre, tu dirección de correo y tu foto de perfil. No recibimos ni vemos tu contraseña en ningún caso.',
          },
          {
            termino: 'Reseñas de producto',
            texto: 'Si dejás un comentario sobre un producto, guardamos el nombre que indiques y el texto del comentario. Los comentarios se revisan antes de publicarse y se muestran públicamente en la ficha del producto, así que no incluyas ahí datos que no quieras que se vean.',
          },
          {
            termino: 'Uso del sitio',
            texto: 'Registramos qué páginas y productos se ven y qué se busca, asociado a un identificador aleatorio que se genera en tu navegador y se guarda en el almacenamiento local. Ese identificador no contiene tu nombre ni tu correo, y no lo cruzamos con datos de terceros.',
          },
          {
            termino: 'Datos técnicos',
            texto: 'Como cualquier sitio web, nuestros servidores registran la dirección IP, el tipo de navegador y la fecha y hora de cada visita. Se usan para operar el servicio y detectar abusos.',
          },
        ],
      },
      'No recolectamos datos sensibles en el sentido del artículo 2 de la Ley N° 25.326 (origen racial o étnico, opiniones políticas, convicciones religiosas, información referente a la salud o a la vida sexual) y te pedimos que no los incluyas en los campos de texto libre.',
    ],
  },
  {
    id: 'para-que',
    titulo: '3. Para qué los usamos',
    bloques: [
      {
        tipo: 'lista',
        items: [
          'Responder tu consulta o tu postulación, y contactarte por ese motivo.',
          'Darte acceso al material técnico descargable y saber qué material se descarga.',
          'Publicar y moderar las reseñas de producto.',
          'Entender qué productos y secciones se consultan más, para ordenar mejor el catálogo.',
          'Mantener el sitio en funcionamiento, prevenir el fraude y cumplir obligaciones legales.',
        ],
      },
      'No usamos tus datos para tomar decisiones automatizadas sobre vos, ni los vendemos, alquilamos ni cedemos a terceros con fines comerciales. Si en algún momento quisiéramos usarlos para enviarte comunicaciones comerciales no relacionadas con tu consulta, te lo vamos a pedir aparte y vas a poder negarte sin perder nada.',
    ],
  },
  {
    id: 'consentimiento',
    titulo: '4. Por qué podemos tratarlos',
    bloques: [
      'El tratamiento se basa en tu consentimiento, prestado de forma libre, expresa e informada al completar un formulario, crear una cuenta o publicar una reseña, conforme al artículo 5 de la Ley N° 25.326. También tratamos datos cuando es necesario para ejecutar la relación que vos iniciás con nosotros o para cumplir una obligación legal.',
      'Entregar tus datos es voluntario. Si no los entregás, no vamos a poder responder tu consulta ni darte acceso a las descargas, pero podés seguir navegando el catálogo con normalidad.',
    ],
  },
  {
    id: 'terceros',
    titulo: '5. Quién más accede a tus datos',
    bloques: [
      'No publicamos ni cedemos tus datos. Los únicos terceros que intervienen son los que necesitamos para que el sitio funcione, y sólo en la medida en que hace falta:',
      {
        tipo: 'definiciones',
        items: [
          {
            termino: 'Proveedor de la plataforma web',
            texto: 'El sitio funciona sobre una plataforma contratada que aloja la base de datos y procesa los formularios por cuenta y orden nuestra. Actúa como encargado del tratamiento en los términos del artículo 25 de la Ley N° 25.326: sólo puede usar los datos para prestarnos el servicio, no para fines propios.',
          },
          {
            termino: 'Google',
            texto: 'Si elegís iniciar sesión con Google, Google interviene en la autenticación. Además, el sitio carga tipografías desde los servidores de Google, lo que implica que tu dirección IP llega a ellos al abrir la página. El tratamiento que hace Google de esos datos se rige por sus propias políticas.',
          },
        ],
      },
      'Algunos de estos servicios están alojados fuera de la Argentina, por lo que puede haber una transferencia internacional de datos en los términos del artículo 12 de la Ley N° 25.326. Al usar el sitio y, en particular, al iniciar sesión con Google, prestás tu consentimiento para esa transferencia.',
      'También podemos entregar datos cuando una autoridad judicial o administrativa competente nos lo requiera, en el marco de sus facultades.',
    ],
  },
  {
    id: 'almacenamiento',
    titulo: '6. Cookies y almacenamiento en tu navegador',
    bloques: [
      'Este sitio no usa cookies publicitarias ni de seguimiento de terceros. No hay píxeles de redes sociales ni herramientas de perfilado.',
      {
        tipo: 'lista',
        items: [
          'Una cookie de sesión, necesaria para mantenerte identificado mientras estás con la sesión iniciada. Sin ella no se puede descargar material.',
          'Un identificador aleatorio guardado en el almacenamiento local del navegador, que sirve para contar visitas sin identificarte.',
        ],
      },
      'Podés borrar ambos en cualquier momento desde la configuración de tu navegador. Si los borrás, vas a tener que iniciar sesión de nuevo para descargar material; el resto del sitio funciona igual.',
    ],
  },
  {
    id: 'conservacion',
    titulo: '7. Cuánto tiempo los conservamos',
    bloques: [
      'Conservamos los datos mientras dure la finalidad para la que fueron recolectados, y después durante el plazo en que puedan ser necesarios para atender un reclamo o cumplir una obligación legal. Cumplido eso, los eliminamos o los anonimizamos.',
      'Si pedís la supresión de tus datos, los eliminamos salvo que una norma nos obligue a conservarlos, en cuyo caso te lo informamos.',
    ],
  },
  {
    id: 'seguridad',
    titulo: '8. Cómo los cuidamos',
    bloques: [
      'Adoptamos las medidas técnicas y organizativas necesarias para proteger los datos y evitar su adulteración, pérdida, consulta o tratamiento no autorizado, conforme al artículo 9 de la Ley N° 25.326. Entre otras: el sitio se sirve cifrado, el acceso a la base está restringido y las contraseñas de las cuentas no se almacenan en el sitio.',
      'Ningún sistema es infalible. Si ocurriera un incidente que afecte tus datos personales, vamos a actuar para contenerlo y a informarlo cuando corresponda.',
    ],
  },
  {
    id: 'derechos',
    titulo: '9. Tus derechos y cómo ejercerlos',
    bloques: [
      'Tenés derecho a acceder a tus datos, a rectificarlos si son inexactos, a actualizarlos y a pedir su supresión, conforme a los artículos 14, 15 y 16 de la Ley N° 25.326.',
      `Para ejercerlos, escribinos a ${r.email} desde la dirección de correo con la que nos contactaste, indicando qué querés hacer. Podemos pedirte algún dato adicional para confirmar que sos vos: es una precaución a tu favor, para no entregarle tus datos a otra persona.`,
      'La respuesta al pedido de acceso se brinda dentro de los diez días corridos; la rectificación, actualización o supresión, dentro de los cinco días hábiles.',
      {
        tipo: 'cita',
        texto: 'El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326.',
        fuente: 'Cláusula de inclusión obligatoria — Disposición 10/2008, artículo 1',
      },
    ],
  },
  {
    id: 'organismo',
    titulo: '10. Organismo de control',
    bloques: [
      {
        tipo: 'cita',
        texto: 'La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.',
        fuente: 'Cláusula de inclusión obligatoria — Disposición 10/2008, artículo 2',
      },
      'La Agencia de Acceso a la Información Pública sucedió a la Dirección Nacional de Protección de Datos Personales, que era el órgano de control mencionado en el texto original de la Disposición 10/2008.',
    ],
  },
  {
    id: 'menores',
    titulo: '11. Menores de edad',
    bloques: [
      'Este sitio está dirigido a profesionales y empresas del sector de la iluminación, no a menores de edad. No recolectamos deliberadamente datos de menores. Si detectamos que cargamos datos de una persona menor de edad sin autorización de quien ejerce su responsabilidad parental, los eliminamos.',
    ],
  },
  {
    id: 'cambios',
    titulo: '12. Cambios en esta política',
    bloques: [
      'Podemos actualizar esta política cuando cambien las prácticas del sitio o la normativa aplicable. La fecha de la última actualización figura al comienzo de esta página. Si el cambio afecta de manera sustancial cómo tratamos tus datos, lo vamos a comunicar por un medio visible antes de aplicarlo.',
    ],
  },
]

function PrivacidadPage() {
  return (
    <LegalPage
      eyebrow="Datos personales"
      titulo="Política de privacidad"
      bajada="Qué datos recolecta este sitio, para qué los usa, con quién los comparte y cómo podés acceder a ellos, corregirlos o pedir que los borremos."
      ruta="/privacidad"
      seoTitle="Política de privacidad · Kolortec"
      seoDesc="Cómo Kolortec trata los datos personales recolectados en su sitio web: qué se recolecta, con qué finalidad, quiénes acceden y cómo ejercer los derechos de acceso, rectificación y supresión (Ley 25.326)."
      secciones={secciones}
    />
  )
}

export default PrivacidadPage
