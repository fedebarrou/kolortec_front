# Buscador por producto en Soporte — Diseño

## Contexto

La página de Soporte (`src/features/support/pages/SupportPage.jsx`) muestra hoy dos columnas con listas hardcoded de 3 ítems cada una:

- **Manuales** (`FALLBACK_MANUALS`)
- **Firmware y Software** (`FALLBACK_FIRMWARE`)

Cada ítem tiene `label`, `size`, `type` y un botón "Descargar" sin acción real. Las listas no están conectadas con el catálogo y son demasiado cortas como para que un usuario tenga que filtrar.

## Objetivo

Agregar un input de búsqueda arriba de las dos columnas que filtre los ítems en vivo por nombre de producto. La intervención es **solo visual / front-only**: no se conecta a `productDetails.js` ni se reemplaza la fuente de datos. Sirve como base navegable para iterar más adelante.

## Cambios funcionales

### 1. Renombrado de sección

- "Firmware y Software" → **"Librerías"**.
- Actualizar la key `support.page.firmwareTitle` en `src/shared/i18n/translations.js` (todos los idiomas presentes) para reflejar el nuevo nombre. Si la key se sigue usando en otros lugares, mantener el id pero cambiar solo el valor de texto.
- El título de la página ("Librería y Manuales") se mantiene como está.

### 2. Buscador

- Input full-width ubicado **entre el subtítulo y el grid de columnas**.
- Placeholder: *"Buscar por producto (ej: KT-X1000)"*.
- Icono de lupa a la izquierda del input (estilo consistente con el resto del sitio: borde `#2a2a2a`, fondo `#0f0f10`, texto claro, focus en color primario).
- Estado local con `useState` en `SupportPage`. No se persiste.
- Filtrado en vivo sobre el `label` de cada ítem: case-insensitive, match parcial (`label.toLowerCase().includes(query.toLowerCase().trim())`). Si `query` está vacío, se muestran todos los ítems.
- El mismo `query` filtra ambas columnas simultáneamente.

### 3. Datos mock ampliados

Para que el buscador se vea funcionando, ampliar los arrays a ~6-8 ítems por columna repartidos entre varios productos distintos (mantener el formato actual `"<Tipo de doc> - <Producto>"`):

Productos sugeridos (ya presentes en el sitio): KT-X1000 Flood, Precision Spot Z4, Modular Array L2. Agregar 2-3 productos más con nombres consistentes con la línea Kolortec.

Estructura de cada ítem sin cambios: `{ label, size, type }`.

### 4. Empty state por columna

Si el filtro deja una columna sin ítems, en lugar de la lista mostrar un texto sutil dentro del card:

> "Sin resultados para esta búsqueda."

Color `#aeb2ba` (mismo que la metadata actual), padding vertical similar a un par de filas para que el card no colapse.

### 5. Comportamiento responsive

Sin cambios estructurales. El input ocupa el ancho disponible y las columnas se apilan en mobile como ya lo hacen (`lg:grid-cols-2`).

## Lo que NO cambia

- Botón "Descargar" sigue sin acción real.
- Bloque de contacto al pie (WhatsApp + Email) intacto.
- Estilos generales, tipografías, colores.
- Datos reales de productos en `productDetails.js`.

## Archivos a tocar

- `src/features/support/pages/SupportPage.jsx` — input, estado, filtro, empty states, datos mock ampliados, render del título renombrado.
- `src/shared/i18n/translations.js` — valor de `support.page.firmwareTitle` (todos los idiomas) y, opcional, agregar key para placeholder del buscador y mensaje de empty state.

## Criterio de éxito

1. Al cargar `/soporte`, se ve el input vacío y ambas columnas con todos sus ítems.
2. Al tipear "KT-X1000", quedan visibles solo los ítems de ese producto en cada columna; las que no tengan ítems muestran el empty state.
3. Borrar el input restaura las listas completas.
4. La sección antes llamada "Firmware y Software" ahora dice "Librerías".
5. El layout en mobile sigue siendo usable (input cómodo de tipear, columnas apiladas).
