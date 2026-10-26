# Decisiones visuales — kolortec.com.ar

Lo más nuevo arriba. Mockups congelados en `docs/diseno/mockups/`.

---

### 2026-10-21 · «No encontrada» de categoría y línea: el título grande del sitio (decisión del hilo, 7.ª vuelta)

**Qué se decidió.** La página «Categoría no encontrada» / «Línea no encontrada» vuelve a la **forma publicada del sitio**: el título grande (h1 `title-font`, `clamp(2.4rem,6vw,4.6rem)`, punto amarillo) + el cuerpo en `--muted` + el enlace «Volver a productos». Es la misma que ya usan el 404 de `App.jsx`, la guía no encontrada y la ficha del producto, y la que tenían categoría y línea en HEAD. La variante **«catálogo caído»** sigue siendo la caja punteada con Reintentar (`CatalogLoadError`).
- **Motivo.** En la 5.ª vuelta se había unificado «no encontrada» con la caja de «caída»: quedaba una caja chica, distinta del resto del sitio. ra (VIS-026) lo marcó; no se inventa un diseño nuevo.
- **Dónde vive.** Una sola vez, en `CatalogUnavailablePage` (variantes `category-not-found` / `line-not-found`). No hay un componente de 404 exportado que reutilizar (`NotFoundPage` está dentro de `App.jsx` y trae eyebrow «404» y tres botones), por eso se igualan medidas y clases; `scripts/check-filtros.mjs` (caso 29) compara el tamaño y la tipografía del h1 contra el 404 real.
- **Regla.** Cambiar el título de un «no encontrado» en un lugar es cambiarlo en todos: el test falla si el catálogo se separa del 404 del sitio.
- **Variante `product-not-found` (8.ª vuelta).** La ficha de un producto que no existe (`/producto/<slug>` con la lista de productos cargada y el slug ausente) usa esta misma página: «Producto no encontrado», título grande, `noindex,follow`. Sólo un 404 REAL es «no encontrado»: con la API de productos caída la ficha sigue con «No pudimos mostrar este producto» + Reintentar.
- **Enlace amarillo (VIS-029).** En todas las «no encontrada», «Volver a productos» es `font-bold text-primary` (#f4df33), la forma publicada (HEAD en categoría y línea, la guía), con destino de 44px y foco. El «Volver» gris queda sólo en la caja de «caída», junto a Reintentar.
- **Padding de página (VIS-036).** `py-[42px]` es el padding publicado del 404 (App.jsx), de la guía y del catálogo: se conserva a propósito.
- **Una escala de título de error (VIS-033).** El h1 de «No pudimos mostrar este producto» (API caída) pasa a `clamp(2.4rem,6vw,4.6rem)`, la misma de «Producto no encontrado»: la ficha no tiene dos escalas de título de error. `check-volver-categoria.mjs` mide los dos estados con `scripts/forma-no-encontrada.mjs`, la misma medición que usa `check-filtros.mjs` para categoría y línea.

---

### 2026-10-21 · Favicon: el logo real sobre un círculo negro (Fedev)

**Qué se eligió.** La pestaña muestra el **asterisco real de la marca** (`public/assets/logo_minimal.png`, 248×232, amarillo sin fondo) centrado y a **~66 % del diámetro**, sobre un **círculo `#050505` que llena el lienzo**; afuera del círculo es transparente. Salidas: `favicon.png` (512), `favicon-48.png`, `favicon-32.png` y `apple-touch-icon.png` (180), todas generadas por `scripts/generar-favicon.mjs` (canvas dentro de puppeteer, sin dependencias nuevas). `index.html` declara los 32 y 48 con `sizes`, el 512 como ícono general y el de 180 como `apple-touch-icon`.
- **Motivo.** Fedev: «el asterisco de la pestaña quiero que esté dentro de un círculo de fondo negro como estaba antes, sólo que ahora respetamos realmente el logo». Se vuelve al círculo negro que ya tenía la pestaña, pero con el PNG real del logo compuesto encima (no una réplica): el trazo es el de la marca. El `apple-touch-icon` dejó de apuntar a `logo_minimal.png` suelto (amarillo sin fondo) y usa el mismo círculo.
- **Regla.** No se vuelve a dibujar el asterisco con un polígono: si cambia el logo, se cambia `logo_minimal.png` y se corre `node scripts/generar-favicon.mjs`.

---

### 2026-10-19 · Margen del blog: la misma escalera que el header — elegida: B (Fedev)

**Qué se eligió.** El blog (índice, nota, estado cargando y «nota no encontrada») usa la **escalera de margen del header**: **24 px · `lg` 40 · `xl` 80 · `2xl` 160**. A 1440 son **80 px por lado** (antes 160). El resto del sitio no cambia. Implementado en el commit `02db642`.
- **Texto de la nota:** desde `xl` pasa a **20 px** y llena su columna hasta 52 rem (~87 caracteres a 1440); debajo de `xl` sigue en 1 rem con 52 ch.
- **«Seguí leyendo»** usa `GuideCard` (foto + título + extracto), la misma tarjeta del índice.
- **Descartada: A** (80 px por lado en todo el sitio: secciones, contenedor de producto y footer), por tocar páginas que nadie pidió. Mockup A/B congelado en `docs/diseno/mockups/2026-10-19-blog-margen/`.
- **Deuda declarada en el commit:** no hay un contenedor único de margen (24 archivos lo repiten a mano) y el footer sigue a 160 px.

---

### 2026-10-21 · Innovaciones: imagen + nombre, detalle en un recuadro arriba — elegida: C1 (Fedev)

**Qué se eligió.** En la ficha de producto con 5 o más innovaciones, la grilla muestra cada una como **imagen (44 px) + nombre**, y **arriba de la grilla** hay un **recuadro de detalle fijo** con la innovación señalada: imagen grande (84×84, `object-fit: contain`), título en mayúsculas y descripción. Reemplaza al globo flotante de la opción B del 20-oct.
- **Quién señala:** con el mouse, la ficha bajo el puntero (queda la última si el puntero se va); con el teclado, la que tiene el foco; en el celular, la que se toca. Al cargar, la primera. La señalada lleva el borde en `--primary`.
- **Alto estable:** el recuadro mide siempre lo de la descripción **más larga de todas** (una capa invisible y `aria-hidden` apila el contenido de todas en la misma celda de grilla), así que cambiar de ficha no mueve la grilla bajo el puntero. Piso estructural único de 118 px (84 de imagen + 2×16 de padding + 2 de borde, como el mockup); lo que pase de ahí lo cubre la capa de medida, no un piso a mano (ra VIS-003: se sacó el 164 de celular). Medido en la ficha real con las 9 innovaciones de Kolortec antes de N2: 1440 → 164, 1280 → 185, 1920 → 122, 320 → 227, 1024 → 351 (la columna mide 232 px ahí).
- **Celular:** conserva el carrusel de 6 por página (2×3), con el recuadro arriba del carrusel. Al cambiar de página se señala la primera ficha con descripción de la página nueva (salvo que el foco ya haya señalado una de ella), así el recuadro nunca muestra una que no está a la vista. Con 4 innovaciones o menos queda la lista completa de siempre.
- **Accesibilidad:** el recuadro es `role="region"` con `aria-label` y **sin** `aria-live` (una región viva anunciaba cada ficha que cruzaba el mouse y repetía lo que el foco ya anuncia). Las fichas son `<button>` con `aria-controls` hacia el recuadro y `aria-current="true"` la señalada (no `aria-pressed`: no es un interruptor, es «una entre varias»); su nombre accesible es el título. Se sacó el globo (`role="tooltip"`, `aria-describedby`, `aria-expanded`) y Escape. Una innovación sin descripción sigue siendo una ficha sin botón; si ninguna tiene descripción no hay recuadro y el texto de ayuda sólo dice «N innovaciones».
- **Columna angosta — N2 (elegida por Fedev, «1 - ok»):** en un notebook de 1024 la columna de la ficha mide 232 px y la imagen de 84 deja el texto apretado. Con `@container` sobre `.kt-innov` y el corte en 250 px de ancho del contenedor (1024 → 232 px: N2; celular de 320 → 272 px y de 390 → 342 px: C1), la imagen pasa a 48×48 al lado del título (gap 12, centrados en vertical) y la descripción va debajo a todo el ancho del recuadro (margin-top 6). A 1440 (382 px) y en celular, incluso a 320 de ancho, queda C1 sin cambios. Descartadas: **Hoy** (imagen al lado, texto apretado) y **N1** (imagen de 84 arriba y texto debajo: el recuadro queda muy alto). Mockup: sección «En una pantalla de notebook» del `index.html`.
- **Desvío — ficha apilada en celular angosto:** cuando la columna mide 338 px o menos —o sea en celulares de hasta ~386 px de ancho (SE, mini, 375, 360, 320), porque la columna es el ancho de pantalla menos 48— (a 320 la ficha mide ~117 px y al texto le quedaban ~47 px: «CAUDAL» se partía sin guion y «PROTECCIÓN Y CONSTRUCCIÓN» ocupaba 6 renglones), la ficha apila la imagen (44, sin cambio) arriba y centrada, y el nombre debajo, centrado y a todo el ancho de la ficha, con gap 8; las imágenes de una misma fila quedan a la misma altura (`justify-content: flex-start`, ra VIS-008). A 390 (ficha ~152 px) queda como el mockup. Es un `@container` sobre `.kt-innov` y sólo en <768 px.
- **Desvío — fondo de la ficha:** es `--panel` (#0d0d0e, token del sitio) y no el #111 que traía el mockup (ra VIS-011).
- **Desvío — recuadro clavado en compu (ra VIS-010, decisión del hilo):** a 1024 la columna de la ficha mide 232 px y la grilla queda en 1 columna, más alta que la pantalla; al pasar el mouse por las fichas de abajo el recuadro se iba de la vista y no se veía qué se estaba señalando. Sólo cuando hace falta: la clase `kt-innov--clavable` la pone InnovacionesGrilla cuando la grilla más el recuadro no entran en el alto de la ventana menos las barras (a 1440×900 con 9 innovaciones no hace falta y queda todo en flujo normal, sin sticky ni vacío; a 1024×768 sí). Con la clase, en ≥768 px el recuadro es `position: sticky`, con `top` = navbar + barra de secciones de la ficha + 12 px (`--kt-detail-top`, lo mide ProductDetailPage; siempre queda debajo de las dos barras) y las fichas suman su alto a `scroll-margin-top` para que el foco de teclado no quede tapado. La franja de 12 px entre la barra y el recuadro se tapa con un `::before` del color de la tarjeta (ra VIS-013); al final de la grilla el recuadro se apoya en un espacio (su alto + 12 px, `padding-bottom` de la grilla, sólo con la clase) y no pisa la última fila (ra VIS-014); y en compu las fichas se señalan por movimiento del puntero y no porque pasen por debajo con la rueda (ra VIS-016). En celular no aplica (el recuadro va arriba de un carrusel corto). El mockup no lo traía.
- **Costo aceptado del recuadro clavado (ra VIS-018, decisión del hilo):** mientras el recuadro está clavado y la última fila está en pantalla queda un vacío de apoyo debajo de ella, de alto del recuadro + 12 px: 142 px a 1024×768 medido con las descripciones del check (recuadro de 130 px), y ~205 px con las 9 reales de Kolortec (recuadro de 193 px). Es lo que evita que el recuadro pise la última ficha al soltarse, y sólo pasa cuando la grilla no entra en la ventana (con la clase `kt-innov--clavable`; a 1440×900 con 9 innovaciones no hay vacío).
- **Imagen que no carga (404):** cae a la inicial, en la ficha y en el recuadro.
- Se mantiene el silabeo con guiones (`conGuiones`, `lang="es"`) en los títulos de las fichas y del recuadro.

**Qué se descartó y por qué.**
- **A · globo flotante** (lo que había): tapa las fichas vecinas.
- **B · la ficha se da vuelta**: el texto queda apretado en una caja chica y es incómodo de leer si es largo.
- **C · recuadro abajo**: se lee después de la grilla, lejos de lo que se señala.
- **C2 · la señalada se agranda a todo el ancho**: deja huecos en la grilla y mueve las fichas que están bajo el puntero.

**Tokens** (`src/index.css`, `:root`):
- Recuadro: fondo `--innov-detalle-bg` (#1b1b1b = panel2; reemplaza a `--innov-globo-bg`), borde 1px `--primary`, padding 16, gap 16, margin-bottom 12 (el mockup lo escribe `margin: 0 0 12px`), título con margin-bottom 6.
- Título y descripción, **compartidos** entre el recuadro y la lista de 4 o menos (ProductDetailPage): `--innov-titulo-size` 15px, `--innov-titulo-lh` 1.5, `--innov-titulo-peso` 700, `--innov-titulo-color` `--ink`; `--innov-texto-size` 13.5px, `--innov-texto-lh` 1.55, `--innov-texto-color` `--soft` (antes la lista tenía 15.2px/1.5/#aeb4bf crudo y el recuadro 15px/1.3 y 13.5/1.55; ra VIS-004/005).
- Medidas que el mockup traía sin anotar (ra VIS-006): **padding 10** vertical de la ficha (`10px 12px`, 8 en ≤480) y **margin 6** (debajo del título del recuadro y encima de los puntos del carrusel); gap de la grilla 10.
- Imágenes: `--innov-img-ficha` 44px y `--innov-img-detalle` 84px (48px en N2); piso de alto `--innov-detalle-alto` 118px (82px en N2: 48 + 32 + 2).
- Ficha: fondo `--panel`, borde `--line2` (en `--primary` si está señalada o con el mouse encima), 13px/700/mayúsculas (12px en ≤480), radio `--innov-radio` (0).
- Se eliminaron `--innov-globo-borde`, `--innov-globo-sombra` e `--innov-icono-globo`; sigue `--innov-punto` (carrusel).

**Mockup congelado:** `docs/diseno/mockups/2026-10-21-innovaciones-imagen/index.html` (sección «C1 · Panel de detalle ARRIBA»; captura `op-C1-arriba.png`).

**Palabras de Fedev:** «probemos con C, cualquier cosa el cliente lo cambia».

**Desvíos respecto del mockup:** en la ficha real la columna es angosta (382 px a 1440, 2 columnas de fichas), no los 620 px del mockup; el recuadro queda más alto por eso. Las imágenes de la grilla son cuadradas y enteras (como el mockup), no los círculos recortados de la lista de 4 o menos, que no se tocó.

---

### 2026-10-20 · Indicador de stock — elegida: B «barra de 3 segmentos» (Fedev)

**Qué se eligió.** Una barra de 3 segmentos más el estado en palabras, en la tarjeta del listado y en la ficha del producto (junto al precio y las presentaciones; con presentaciones, la de la elegida).
- Verde con 3 segmentos y «En stock»; naranja con 2 y «Pocas unidades»; rojo con 1 y «Últimas unidades»; sin stock con 0 segmentos y el texto apagado «Sin stock».
- Medidas del mockup: segmentos de 18×6, gap de 3, separación barra-texto 10 px (mockup .stB), texto de 13px a 600. Los colores viven como variables en `:root` (`--kt-stock-alto`, `-medio`, `-bajo`, `-apagado`).
- Se activa y se afinan los umbrales desde el panel (`stock.indicador`). Con el indicador apagado, o con un back viejo, `stock_nivel` es null y no se dibuja nada.

**Qué se descartó y por qué.**
- **A (punto + texto)**: es la convención, pero obliga a distinguir el color del punto para saber el nivel.
- **C (barra continua)**: el porcentaje de llenado es una escala sin cortes; no dice dónde empieza lo «poco».

**Por qué B.** Es lo que pidió el cliente (rojo llena uno, naranja dos, verde tres) y se lee de un vistazo, también sin distinguir colores: la cantidad de segmentos dice el nivel por sí sola.

**Desvío menor del mockup.** El texto usa los tokens del sitio `--ink` (#f5f5f5) y `--soft` (#aeb2ba) en vez de los #f0f2f5 / #aeb4bf del mockup. En la tarjeta del listado la barra va debajo del nombre y de la categoría, fuera de la fila del «Ver producto».

**Mockup congelado:** `docs/diseno/mockups/2026-10-20-stock/index.html` (capturas `stock-A/B/C.png`).

---

### (REEMPLAZADA por C1, 21-oct) 2026-10-20 · Ficha de producto: muchas innovaciones — elegida: B «grilla de íconos» + carrusel en celular (Fedev)

**Qué se eligió.** Con 5 o más innovaciones, grilla de fichas compactas (ícono redondo + título); la explicación aparece al pasar el mouse o con el foco, en un globo que no mueve el layout. En celular, la misma grilla en **carrusel de 6 por página** (Fedev: «grilla con carrusel, sino chorizo»), con puntos y «n / N». Con 4 o menos queda la lista completa de siempre.

**Qué se descartó y por qué.**
- **A (4 completas + «Ver las N restantes»)**: al desplegar vuelve a ser una lista de 20.
- **C (3 destacadas + grilla)**: decide por el cliente cuáles son «las importantes» con el orden de carga.

**Desvío aceptado (ra 95/100):** en la ficha real la columna es angosta y entran 2 columnas en compu, no 3 (`auto-fill minmax(160px)`): con 3 se cortaban títulos largos.

**Mockup congelado:** `docs/diseno/mockups/2026-10-20-innovaciones/index.html` (incluye la sección «B elegida · celular»).

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

## Hero · 4ª vuelta de paridad (21-oct-2026): «si lo elegiste en los Labs se ve eso; si no elegiste nada se ve como ya está publicado»

Regla del dueño. Cada ítem de abajo la aplica; ninguno cambia lo que un diseño ya publicado muestra si no trae la marca o la clave.

- **VIS-001** · un encabezado SIN `settings` se publica con autoplay a 7000 ms, sin flechas y con puntos; SIN `theme`, con Inter y la paleta de siempre (`SETTINGS_PUBLICADOS` / `THEME_PUBLICADO` en scroll-contract.js). Un `settings` o `theme` incompleto pasa tal cual (el acento sin `colors.primary` sigue siendo #fff). La vista previa del Lab muestra los mismos valores (normalizeConfig en defaults.js). Los defaults del Lab (`CAROUSEL_SETTINGS_DEFAULTS` / `THEME_DEFAULTS` = newConfig) quedan sólo para diseños NUEVOS.
- **VIS-002** · el paso saliente de «Por pasos» se ve salir (desvanece y baja 34px) SOLO con `animation.enSnap`; sin la marca desaparece de golpe, como antes.
- **VIS-003** · el hero de la tienda va a sangre (radio 0, sombra none) SOLO si el diseño trae `fullHeight === true` y `heroWidth === 'full'` explícitos (`heroPantallaCompletaElegida`). Sin esas claves se publica con el radio y la sombra del tema. Medido en navegador (mock de joan, 1440 y 390): Pantalla completa explícita → radio 0 / sombra none; sin claves → radio 24 y sombra; Encabezado → conserva radio y sombra. (El límite que se anotó acá en su día ya se cerró: ver «VIS-003 (corregido)» más abajo.)
- **VIS-004** · (REEMPLAZADO por «Kolortec celular = Pantalla completa», abajo.) Kolortec: sin `hero_frame.gutter` numérico el celular quedaba en 65svh.

## Kolortec celular = Pantalla completa (Fedev 22-oct)

Decisión del dueño: en el celular el Hero de Kolortec va a **pantalla completa**, no al 65 %. Reemplaza a VIS-004 (65svh sin marco) y al `mobile_height_vh` del marco para el alto del celular.
- Kolortec: `heroAltura.js` → `alturaDelHero` devuelve `ALTO_PANTALLA` (100dvh / escala del lienzo) en el celular cuando el diseño no eligió nada. Lo ELEGIDO (`heightMobile` / `aspectMobile`) se sigue viendo.
- Lab: `marcoDelSitio.js` → `altoMovilDelSitio`; el Canvas dibuja el celular de una cuenta con marco declarado a pantalla completa.
- Pruebas: `scripts/check-hero-altura.mjs` (Kolortec) y `scripts/check-hero-roundtrip.mjs` (Lab).

## Hero · vueltas 5 a 9 (22-oct-2026)

- **Regla de bleed: a sangre (pantalla completa) radio 0; contenido, el radio elegido** · una cuenta que declara `appearance.hero_frame` con `gutter` numérico (Kolortec) pasa `bleed` fijo (su HeroSection): en pantalla completa el hero va a SANGRE (radio 0, sin sombra: «Kolortec siempre a sangre» en pantalla completa); en un Encabezado CONTENIDO conserva el radio y la sombra elegidos (CarouselRenderer: `contained` gana sobre `bleed`, VIS-021). La tienda estándar va a sangre sólo con «Pantalla completa» ELEGIDA (`heroPantallaCompletaElegida`). Es UNA regla en el Lab: `heroVaASangre(settings, heroFrame)` (`sitioDeclaraMarco` en defaults.js) para el Canvas, `LiveCarouselPreview` y `TemplatesButton`, y `heroRadioNoAplica` para el panel de Ajustes.
- **VIS-003 (corregido)** · el «Límite conocido» que decía que la vista previa del Lab mostraba a sangre un diseño viejo ya NO es cierto: `normalizeConfig` no completa las claves de tamaño (REG-004 / VIS-012), el Lab usa `heroVaASangre` y un diseño legacy mide radio 12 con sombra en el Lab igual que en la tienda (banco v9, diseño «a»: Lab 12px = tienda 12px).
- **VIS-012** · el Lab NO completa elementos al cargar (`normalizeElement` devuelve el elemento tal cual): el texto suelto mide 16px en el Lab igual que en las sedes (antes 17,36 por el 28px / peso 800 de `propsFor`). Los valores explícitos se escriben al CREAR un elemento (`newElement`, `completarElementoNuevo` para la IA); el Inspector lee con el default del tipo de respaldo, sin escribirlo.
- **VIS-013** · la misma regla del bleed en todas las vistas del Lab (ver arriba).
- **VIS-014** · el ojo de cada capa del Lab usa la misma función que `ElementView` para saber si un elemento está oculto (`estaOculto`; en scroll la tablet hereda `hidden.desktop`).
- **VIS-015** · los cortes de breakpoint (768 / 1024) viven UNA vez por repo en `responsive.js` (`MOBILE_BELOW`, `TABLET_BELOW`, `breakpointDeAncho`) y check-hero-paridad exige el mismo valor en los tres repos.
- **VIS-016 / VIS-021** · el panel de Ajustes (esquinas redondeadas / radio) usa `heroRadioNoAplica(set, heroFrame)`: los controles se deshabilitan sólo si el hero va de verdad a sangre (regla del sitio Y modo pantalla completa); un Encabezado contenido en una cuenta con marco conserva el radio y la sombra elegidos, como lo publicado.
- **VIS-017** · el Canvas en tablet usa 4:3 (`PANTALLA_SUPUESTA.tablet`, `PANTALLAS_REALES.tablet`: 5:4 a 16:10): a 768 mide 1024, no 432.
- **VIS-018** · el lienzo del carrusel dibuja las flechas y los puntos REALES del renderer (placas fantasma sin elementos), para ver que la flecha izquierda puede tapar un botón a 375.
- **VIS-019** · este documento: corregido el «Límite conocido» y sumados VIS-012 a VIS-020 y la regla de Kolortec.
- **VIS-020** · los cortes de los container queries del hero (640 / 768 / 1024 / 1280) se nombran en `responsive.js` (`CQ_*`) y check-hero-paridad exige que todo corte de las hojas de las tres sedes sea uno de ellos.

## VIS-026 · el interlineado del texto suelto, fijado en la raíz del renderer (23-oct-2026)

El texto suelto (`text`) sin `lineHeight` propio hereda el `line-height` de la página: en el Lab daba `normal`, en la tienda 24,8px (1,55 × 16) y en Kolortec 24px (1,5 × 16). Ahora la raíz de cada renderer (CarouselRenderer y los stages del scroll) declara `lineHeight: var(--hero-line-height, 1.55)` y cada sede define la variable con el valor que YA veía lo publicado, así que lo publicado no cambia:
- Kolortec: `--hero-line-height: 1.5` en `index.css` (el 1,5 que Tailwind le pone al `html`).
- Lab: `marcoDelSitio.js` → `lineHeightDelSitio(heroFrame)` (1,55 la tienda estándar, 1,5 una cuenta con marco declarado = Kolortec), puesto como `--hero-line-height` en el lienzo (`varsDelSitio`) y en las pruebas «Probar».
- VIS-028: el contenedor sticky del scroll (donde vive el chrome del modo «Por pasos») también fija `lineHeight: var(--hero-line-height, 1.55)`; en el Lab, el contenedor del lienzo y el de «Probar».
- El Lab, las miniaturas y Mi web dan las variables del sitio con un solo helper (`vistaDelSitio` de `marcoDelSitio.js`: `--hero-line-height`, `--hero-hint-size` y `--hero-skip-size`).
- VIS-032/033/034: el «Scrolleá» del snap mide .62rem en la tienda y .75rem en Kolortec; el «Saltar», .72rem y .75rem (piso de 12 px). El Lab y Mi web con marco declarado usan los de Kolortec (`--hero-hint-size` / `--hero-skip-size`), leídos por las reglas BASE de `hero-anim.css` del admin (la hoja que cargan los dos; la copia de `hero-lab.css` dice lo mismo). Los overrides responsive del «Saltar» (14 px en escritorio) siguen mandando. La tienda no cambia.
- Pendiente del back (no hecho acá): que `appearance.hero_frame` traiga un `line_height` opcional; hoy `sanitizeHeroFrame` descarta las claves que no conoce, así que el Lab deduce 1,5 de «la cuenta declara marco».
- `check-hero-paridad` exige el mismo texto en las tres raíces y el valor de cada sede.
- Quedan fuera (no se midieron diferentes): `font-family`, `letter-spacing`, peso, align y estilo ya coinciden en las tres sedes.

