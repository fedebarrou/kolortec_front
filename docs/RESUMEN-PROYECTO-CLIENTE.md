# KOLORTEC — Resumen del proyecto web

*Documento de presentación para el cliente · Julio 2026*

---

## En una frase

**kolortec.com.ar** pasó de ser una página estática a una **plataforma completa de marca**: un sitio premium con identidad propia, catálogo real, centro de soporte, y un **panel de administración** desde el que el equipo de Kolortec puede actualizar todo el contenido sin depender de un programador.

---

## 1. Lo que se pidió y lo que se entregó

| Lo que pidió Kolortec | Lo que se construyó |
| --- | --- |
| Una web moderna, a la altura de la marca | Rediseño integral en el sistema visual negro + amarillo Kolortec: home con secciones editoriales, catálogo, fichas de producto, soporte, distribuidores y alquiler. Bilingüe **español / inglés**. |
| Que impacte al entrar | **Intro cinematográfica (scrollytelling)**: un video del equipo BEAM que avanza con el scroll, cuadro por cuadro, con mensajes de marca sincronizados. Un gesto = un paso, versión propia para celular, y botón para saltearla. |
| Mostrar el catálogo real | Catálogo conectado al panel: productos con **galería, videos, ficha técnica, innovaciones y precios reales** (los precios se pueden mostrar u ocultar con un switch). Categorías propias de la cuenta. |
| Soporte postventa visible | **Centro de soporte**: manuales y librerías descargables, biblioteca de guías de mantenimiento (se cargan como artículos desde el panel), página de garantías y contacto directo. |
| Aparecer en Google | **SEO técnico completo**: cada página se pre-genera como HTML estático, metadata individual, sitemap y robots automáticos, dominio canónico kolortec.com.ar (el .com redirige), y preparación para buscadores con IA (llms.txt). |
| Que cargue rápido | Optimización de rendimiento: el peso de imágenes bajó de **98 MB a 1,5 MB** y el JavaScript inicial se redujo un **48%**. |

---

## 2. El diferencial: la web se administra sola

La web **no tiene contenido "pegado" en el código**. Todo sale del panel de administración, y lo que se carga ahí aparece en la web al instante:

- **Productos**: alta y edición con imágenes, videos, especificaciones técnicas, innovaciones (con links y artículo asociado) y precios. Cada producto tiene además su **QR fijo** que lleva a una página de descarga con la marca Kolortec.
- **Guías y novedades**: las guías de mantenimiento y artículos se escriben en el panel y alimentan la biblioteca de soporte.
- **Portada (hero)**: el carrusel principal de la home se arma desde un editor visual.
- **Instagram**: con la cuenta conectada, el feed aparece solo en la home.
- **Galería, marcas y partners**: las imágenes del pie de página y los logos de clientes/partners se gestionan desde el panel.
- **Contactos y WhatsApp**: teléfonos, mails y el botón flotante de WhatsApp.
- **Publicación**: la web se puede publicar/despublicar con un click, y admite **vista previa privada** (con link con token) para revisar cambios antes de mostrarlos.
- **Acceso de clientes**: login simple con Google para las descargas protegidas.

> Regla de diseño del sitio: si una sección no tiene datos cargados, **se oculta con elegancia** — nunca se muestra contenido inventado ni espacios rotos.

---

## 3. Recorrido por la home (orden actual)

1. **Intro scrollytelling** — el equipo en acción, con mensajes de marca (Calidad → Presencia → Soporte → Ready to work).
2. **Instagram** — feed en vivo de @kolortec.
3. **Productos destacados** — seleccionados desde el panel.
4. **Hero / portada** — carrusel editable (Golden Line, lanzamientos, etc.).
5. **Sumate** — distribuidores oficiales y programa de alquiler/producción.
6. **Centro de soporte** — sección de cierre con la intro animada de la marca (cortina + barrido del logo + flash) que funde a **negro**, con el video de servicio técnico integrado al fondo y los tres accesos: *Manuales y librerías · Comunicate con nosotros · Biblioteca de guías*. *(Rediseñada en julio sobre mockups presentados y elegidos con el cliente.)*
7. **Contactanos** — datos de contacto directo.

---

## 4. Ajustes hechos a pedido durante el proyecto

El proyecto se trabajó de forma iterativa: se presentaron variantes, el cliente eligió, y varios pedidos puntuales se aplicaron tal cual:

- Ocultar las etiquetas de tecnología de la intro (IP65, DMX512, etc.) — quedaron desactivadas con posibilidad de reactivarlas.
- Los logos de medios/productoras donde se usan equipos Kolortec quedaron preparados pero ocultos, listos para activar cuando se confirmen.
- La sección "Guía de Mantenimiento" se renombró **"Centro de soporte"** y su biblioteca de guías se mudó a su propia página (`/soporte/guias`), accesible con un click desde la home.
- El registro por código (OTP) se reemplazó por **login con Google**, más simple para el usuario.
- Reordenamientos de la home y ajustes finos de animaciones, textos y mobile a medida que se revisaba.

---

## 5. Qué sigue (propuesto)

- Reemplazo del video de la sección Centro de soporte por material propio definitivo.
- Activar los logos de medios/productoras cuando estén confirmados.
- Carga continua de guías y productos desde el panel (ya es 100% autogestión).

---

*La web es multi-dominio y multi-idioma, corre sobre infraestructura propia con certificados automáticos, y está preparada para crecer (nuevas secciones, nuevos productos, nuevas líneas) sin rehacer nada.*
