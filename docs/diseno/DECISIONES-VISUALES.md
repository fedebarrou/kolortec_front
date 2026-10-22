# Decisiones visuales — kolortec.com.ar

Lo más nuevo arriba. Mockups congelados en `docs/diseno/mockups/`.

---

### 2026-10-20 · Ficha de producto: muchas innovaciones — elegida: B «grilla de íconos» + carrusel en celular (Fedev)

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

## Límite conocido VIS-026 (22-oct-2026) — se resuelve después del deploy

El texto suelto (`text`) sin `lineHeight` propio hereda el `line-height` de la página: en el Lab da `normal`, en la tienda 24,8px (1,55 × 16 de `globals.css`) y en Kolortec 24px (1,5 × 16). Es el mismo mecanismo que VIS-012 (antes `normalizeElement` escribía `lineHeight: 1.1`). Medido en el banco: font-family, letter-spacing, peso, align y estilo ya coinciden en las tres sedes; sólo difiere el line-height del texto suelto.
- **NO se arregla en esta rama.** Propuesta de ra: el lienzo del Lab declara lo que el sitio hereda (line-height 1,55 en la tienda / 1,5 en Kolortec) y lo mismo para `font-weight`, `letter-spacing`, el align y el transform, de modo que lo heredado se vea igual en el editor y en la web.
- Se hace después del deploy.
