# Decisiones visuales — kolortec.com.ar

Lo más nuevo arriba. Mockups congelados en `docs/diseno/mockups/`.

---

### 2026-10-20 · Tira de marcas: nombre de la marca — elegida: B «sólo logo, +15 %» (Fedev)

**Qué se eligió.** En Kolortec la tira muestra **sólo los logos**, sin el nombre al lado, y **un 15 % más grandes**: el alto base de la tira (`ALTO_BASE.tira`) pasa de 72 a 83 px. Un logo cuadrado mide 108×108.
- Nueva opción por cuenta en el panel (Mi web → Marcas): «Nombre de la marca: No mostrar · A la derecha · Abajo». Vive en `section_card_styles.marcas.name_position`.
- Kolortec la usa en «No mostrar». Sin elegir (null), cada sitio queda como antes, con el nombre a la derecha.
- Una marca sin logo muestra igual su nombre, porque es lo único que tiene. Con «No mostrar», el nombre queda como `aria-label` del link.

**Qué se descartó y por qué.**
- **A (logo + nombre a la derecha, como estaba)**: el nombre repite lo que ya dice el logo y ocupa el doble de ancho.
- **B+ (sólo logo, +25 %)**: más grande de lo que hacía falta; la tira ganaba alto sin ganar lectura.
- **C (nombre chico abajo)**: queda como tercera opción del panel, para tiendas cuyos logos no se leen solos. Los nombres se anclan abajo para quedar alineados.

**Mockup congelado:** `docs/diseno/mockups/2026-10-20-marcas-nombre/index.html`.
**Medido:** cuadrados a 108×108 y sin `<span>` de nombre, a 1440 y a 390 (ra 92/100).

### 2026-10-17 · Ficha de producto: «En obra» (media asociada) — elegida: C «el cruce» (Fedev)

**Qué se eligió.** Grilla pareja «En obra» justo después de «Video del producto», con lengüeta propia.
- Filtro Todo / Fotos / Videos, sólo si hay de los dos tipos.
- Grilla 4:3: 4 columnas en compu y 2 en celular. En celular se ven 6 ítems y el botón «Ver los N».
- Visor con tira de miniaturas. Se cierra con Esc o clic afuera, y se navega con flechas o swipe.
- Del descarte B se rescata el botón «Consultar por este equipo» dentro del visor, con el mismo WhatsApp que la barra de la ficha.
- Sin media asociada no se dibuja ni la sección ni la lengüeta.

**Datos.** `GET /public/galeria?producto_id=`: es la media de la galería que el comercio asocia a ese producto desde el panel. No reemplaza la galería principal del producto.

**Por qué.** Pone la media arriba, al lado del otro video, donde se ve. La grilla aguanta igual 1 ítem que 30. Si el comercio asocia fotos de producto en vez de trabajos, se sigue leyendo como galería de obras y no como una segunda galería principal.

**Qué se descartó y por qué.**
- **A (riel al final, gemelo de «Notas relacionadas»)**: queda enterrado al fondo de una ficha de unos 7.000 px.
- **B (mosaico «Visto en vivo» con protagonista)**: necesita reglas de armado según la cantidad, se ve pobre con 1 o 2 ítems y se confunde con la galería principal.

**Desvíos aceptados del mockup** (los mira ra):
- Títulos centrados, como el resto de las secciones de la ficha.
- Subtítulo «Trabajos reales con {nombre}», sin artículo, porque el género no vale para todos los equipos.
- El visor usa `contain`, para no recortar fotos verticales.
- La consulta va entre el contador y la tira.

**Mockup congelado:** `docs/diseno/mockups/2026-10-17-media-producto/c.html`.

### 2026-10-17 · Tira de marcas: tamaño — elegida: B «el hueco» (Fedev)

**Qué se eligió.** Los logos se igualan solos por ÁREA, no por alto: con su proporción natural y topes de ancho y alto, todos pesan lo mismo a la vista. El comercio puede retocar cada marca con `escala` de 0,70 a 1,40, desde el panel de Marcas, y llega por `/public/marcas`. No hay tamaño general.

**Fórmula.** `src/shared/utils/marcas-tamano.js`, copia idéntica de `tiendita-store/lib/marcas-tamano.js`. La igualdad la vigila `npm run check:marcas`.

**Qué se descartó y por qué.**
- **A (Chico / Mediano / Grande para toda la tira)**: con el mismo alto, un logo 6:1 sigue pesando mucho más que uno cuadrado, y lo desparejo no se arregla.
- **C (general + igualado + ajuste fino)**: más controles de los que hacen falta. El igualado automático ya resuelve lo desparejo, y el retoque por marca cubre el resto.

**Mockup:** `tiendita-front/docs/diseno/mockups/2026-10-17-tamano-marcas/b.html`.
