# Plan de implementación SEO — Sitio Kolortec (para Claude Code)

> **Cómo usar este archivo:** pegáselo a tu sesión de Claude Code en la terminal,
> dentro del repo del front. Es un brief de trabajo: contexto + tareas concretas
> a nivel de archivo + criterios de aceptación. Ejecutá por fases y verificá con
> el checklist final.

---

## 0) Contexto del proyecto

- **Producto:** sitio de **Kolortec**, **fabricante argentino de iluminación profesional**
  para espectáculo (cabezales móviles, strobes, paneles/flood LED, etc.).
- **Stack real detectado:** **Vite + React (SPA, client-side rendering)**. Un único
  bundle `/assets/index-*.js`, montaje en `#root`. **No es Next.js.**
- **Deploy:** Vercel. Dominio objetivo: **kolortec.com.ar**.
- **Rutas actuales detectadas:** `/`, `/products`, `/producto/:slug`, `/soporte`,
  `/rentals`, `/distribuidores`, `/garantias`.
- **Estado SEO hoy (auditado en vivo):**
  - El `<title>` cambia por ruta (ej. "Inicio | KOLORTEC") → ya hay manejo de head dinámico. ✔
  - `lang="en"` en `<html>` siendo un sitio **en español**. ✗
  - **Sin** meta description, **sin** Open Graph, **sin** canonical. ✗
  - **Sin** datos estructurados JSON-LD (0). ✗
  - **3 `<h1>`** en la home (debe haber 1 por página). ✗
  - **Sin** robots.txt / sitemap.xml verificados. ✗
  - Al ser SPA, el HTML inicial está casi vacío → riesgo de indexación. ✗

### Objetivo
Dejar el sitio **técnicamente indexable y optimizado** para las keywords del plan,
**sin romper la SPA**, y **preparado para que más adelante los datos vengan de un
endpoint/API** (los metadatos de cada producto deben poder poblarse dinámicamente).

### Restricciones / principios
1. **No romper** el funcionamiento actual de la SPA ni el diseño.
2. **Preparar para datos dinámicos:** todo lo de SEO por página debe poder leerse de
   props/datos (hoy mock o estáticos; mañana desde la API). Centralizar, no hardcodear disperso.
3. **Español primero** (mercado Argentina).
4. Cambios **incrementales y verificables**; commits por fase.

---

## FASE 1 — Fixes técnicos base (rápidos, alto impacto)

### 1.1 Idioma correcto
- En `index.html`: `<html lang="es">` (hoy está en `en`).
- Si algún componente setea `lang` dinámicamente, forzar `es` (o `es-AR`).

### 1.2 `<head>` por página con react-helmet-async
- Instalar `react-helmet-async` (si ya hay un mecanismo de head, reutilizarlo en vez de duplicar).
  ```
  npm i react-helmet-async
  ```
- Envolver la app en `<HelmetProvider>` (en `main.tsx`/`App.tsx`).
- Crear un componente único **`src/seo/Seo.tsx`** reutilizable:
  ```tsx
  import { Helmet } from "react-helmet-async";

  type SeoProps = {
    title: string;            // 50–60 caracteres
    description: string;      // 140–160 caracteres
    path: string;             // ej. "/soporte"
    image?: string;           // OG image absoluta
    type?: "website" | "article" | "product";
    jsonLd?: object | object[];
    noindex?: boolean;
  };

  const SITE = "https://kolortec.com.ar"; // cambiar si el dominio final difiere
  const DEFAULT_OG = `${SITE}/og-default.jpg`;

  export default function Seo({ title, description, path, image, type = "website", jsonLd, noindex }: SeoProps) {
    const url = `${SITE}${path}`;
    const img = image || DEFAULT_OG;
    const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
    return (
      <Helmet>
        <html lang="es" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        {noindex
          ? <meta name="robots" content="noindex,follow" />
          : <meta name="robots" content="index,follow,max-image-preview:large" />}
        {/* Open Graph */}
        <meta property="og:type" content={type} />
        <meta property="og:site_name" content="Kolortec" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={img} />
        <meta property="og:locale" content="es_AR" />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={img} />
        {blocks.map((b, i) => (
          <script key={i} type="application/ld+json">{JSON.stringify(b)}</script>
        ))}
      </Helmet>
    );
  }
  ```
- Usar `<Seo .../>` en **cada página/route**. (Mapa de títulos/descriptions en la Fase 3.)

### 1.3 Un solo `<h1>` por página
- Auditar cada vista. La **home** tiene 3 `<h1>` ("READY TO WORK.", "Golden Line",
  "POWER ON STAGE.") → dejar **un** `<h1>` (ej. "Kolortec — Iluminación profesional
  Ready to Work, fabricante con soporte local") y bajar los otros a `<h2>`/`<p>` de diseño.
- Regla general: H1 = tema de la página; subtítulos = H2/H3 jerárquicos.

### 1.4 Atributos de imágenes
- `alt` descriptivo en todas las imágenes de producto (incluir modelo + tipo, ej.
  `alt="Cabezal móvil KT-... wash para iluminación de escenario"`).
- `width`/`height` o aspect-ratio para evitar CLS; `loading="lazy"` salvo el hero.

---

## FASE 2 — Hacer que el SPA SEA INDEXABLE (lo más importante)

Un SPA Vite sirve un HTML vacío; Google a veces ejecuta JS pero es lento e inseguro.
**Hay que entregar HTML pre-renderizado por ruta.** Elegir UNA de estas vías:

### Opción A (recomendada, bajo riesgo): pre-render estático en el build
- Usar **`vite-react-ssg`** (o `react-snap`) para generar HTML estático de las rutas
  conocidas en `npm run build`, manteniendo la app igual en runtime.
  ```
  npm i vite-react-ssg
  ```
  - Migrar el router a `vite-react-ssg` (usa React Router por debajo). Exportar la lista
    de rutas estáticas (incluidas las de producto, ver 2.1).
  - Resultado: `/`, `/products`, `/soporte`, etc. se sirven como HTML real con su `<head>`.
- Alternativa sin tocar router: **`react-snap`** (post-build con Puppeteer):
  ```
  npm i -D react-snap
  ```
  `package.json`: `"postbuild": "react-snap"`, y en `main.tsx` usar `hydrateRoot` si hay
  HTML pre-renderizado. Pre-renderiza las rutas que le indiques en `reactSnap.include`.

### Opción B (ideal a futuro, mayor lift): migrar a SSR/SSG real
- Migrar a **Astro** (islas React) o **Next.js**. Mejor SEO y control de `<head>` nativo.
- **No bloquear** las mejoras de Fase 1/3 por esto; dejarlo como recomendación de roadmap.

### 2.1 Rutas de producto para el pre-render
- Hoy `/producto/:slug` es dinámica. Para pre-render necesitás la lista de slugs.
  - **Ahora:** exportar un array estático `src/data/products.ts` (slugs + datos mínimos).
  - **Cuando conectes la API:** generar esa lista en build-time desde el endpoint
    (fetch en el script de SSG/sitemap). Dejar el punto de extensión documentado (ver Fase 5).

---

## FASE 3 — Keywords → páginas (mapa de contenidos)

Aplicar las **20 keywords calificadas** (archivo `matriz_palabras_clave_iluminacion.csv`
en esta misma carpeta) a páginas concretas. Estrategia: **alta intención, baja
competencia** — no pelear por volumen.

### 3.1 Metadatos de las páginas existentes
| Ruta | Title (≈55c) | Description (≈155c) | Keyword foco |
|---|---|---|---|
| `/` | `Kolortec · Iluminación profesional Ready to Work` | `Fabricante argentino de iluminación profesional para espectáculo. Equipos Ready to Work con respaldo, repuestos y soporte técnico local.` | fabricante de iluminación profesional argentina |
| `/products` | `Productos · Iluminación profesional Kolortec` | `Cabezales móviles, strobes y paneles LED de línea propia, testeados y listos para escena. Durabilidad y soporte de fábrica.` | iluminación profesional de alta gama con soporte local |
| `/producto/:slug` | `{modelo} · {tipo} Kolortec` (dinámico) | `{descripción del modelo}. Equipo Ready to Work con repuestos y soporte local.` (dinámico) | (según producto) |
| `/soporte` | `Soporte técnico de iluminación escénica · Kolortec` | `Soporte técnico de iluminación escénica con respuesta inmediata y repuestos en stock local. Diagnóstico y reparación de cabezales móviles.` | soporte técnico de iluminación escénica |
| `/rentals` | `Iluminación para rentals y productoras · Kolortec` | `Equipos confiables para casas de alquiler y productoras: uptime, mantenimiento y soporte que evita downtime en cada show.` | cabezal móvil para rental confiable |
| `/distribuidores` | `Distribuidores y partners · Kolortec` | `Sumate a la red de partners de Kolortec: fabricante de línea propia con respaldo, márgenes y soporte local para tu negocio.` | (canal / B2B) |
| `/garantias` | `Garantía de fábrica 12 meses · Kolortec` | `Garantía de fábrica y política de soporte de Kolortec: repuestos en stock y respaldo real del fabricante.` | marca de iluminación confiable para eventos |

### 3.2 Nuevas páginas de contenido (cluster Soporte/Troubleshooting = tráfico rápido)
Crear una sección de artículos (ej. `/soporte/guias/:slug` o `/blog/:slug`). Una página
por keyword del cluster A y Service. Estructura por artículo: H1 = la pregunta/keyword,
intro con la solución corta, pasos, y CTA a soporte/producto. Primeras a crear:

1. `cabezal-movil-no-enciende` → "Mi cabezal móvil no enciende: guía de diagnóstico paso a paso"
2. `cabezal-movil-no-responde-dmx` → "Cabezal móvil que no responde a DMX: causas y solución"
3. `errores-direccionamiento-dmx` → "Errores de direccionamiento DMX más comunes y cómo evitarlos"
4. `mantenimiento-cabezas-moviles-rental` → "Mantenimiento preventivo de cabezas móviles para rentals"
5. `mantenimiento-consola-iluminacion` → "Cómo mantener tu consola para que nunca falle en escena"
6. `servicio-tecnico-iluminacion-escenica` → (transaccional, enlaza a /soporte)
7. `reparacion-cabezal-movil-profesional`
8. `repuestos-iluminacion-stock-local`

> El CSV adjunto trae las 20 con intención y título propuesto. Cluster A/Service primero
> (tráfico de alta intención), luego Durabilidad, Ready to Work, Alternativa Premium e Institucional.

### 3.3 Interlinking
- Artículos de soporte (tráfico) → enlazan a páginas de producto y a `/soporte` (conversión).
- Home y `/products` → enlazan a las guías destacadas.
- Breadcrumbs visibles en producto y artículos (y su JSON-LD, ver 4.3).

---

## FASE 4 — Archivos de rastreo y datos estructurados

### 4.1 `public/robots.txt`
```
User-agent: *
Allow: /
Sitemap: https://kolortec.com.ar/sitemap.xml
```

### 4.2 `sitemap.xml`
- Generarlo en build-time (script `scripts/gen-sitemap.mjs`) a partir de la lista de rutas
  estáticas + slugs de producto + slugs de guías. Escribir a `public/sitemap.xml`.
- **Preparado para API:** cuando los productos vengan del endpoint, el script hace fetch
  de los slugs y los agrega. Dejar la función `getDynamicRoutes()` lista para conectar.

### 4.3 JSON-LD (vía el componente `<Seo jsonLd={...}/>`)
- **Global (home/layout):** `Organization` + `WebSite`.
  ```json
  {"@context":"https://schema.org","@type":"Organization","name":"Kolortec",
   "url":"https://kolortec.com.ar","logo":"https://kolortec.com.ar/logo.png",
   "description":"Fabricante argentino de iluminación profesional para espectáculo.",
   "areaServed":"AR","sameAs":["https://www.instagram.com/...","https://www.facebook.com/..."]}
  ```
- **Páginas de producto:** `Product` (name, description, brand=Kolortec, image, sku/model;
  `offers` cuando haya precio desde la API).
- **Artículos de soporte:** `Article` + `BreadcrumbList`.

---

## FASE 5 — Dejar preparado para los endpoints futuros (datos dinámicos)

> Objetivo: cuando conectes la API, los metadatos y el sitemap se pueblan solos.

1. **Capa de datos única:** `src/data/` con funciones `getProducts()`, `getProduct(slug)`,
   `getGuides()`. Hoy devuelven mock/estático; mañana hacen `fetch` al endpoint. Las páginas
   y el componente `<Seo>` consumen SIEMPRE estas funciones (no hardcodear textos SEO en JSX).
2. **Metadata derivada del dato:** cada `Product`/`Guide` debe incluir campos
   `seoTitle`, `seoDescription`, `ogImage` (con fallback si vienen vacíos desde la API).
3. **Sitemap dinámico:** `scripts/gen-sitemap.mjs` usa `getProducts()/getGuides()` para
   incluir todas las URLs. Correrlo en `prebuild`/`build`.
4. **Pre-render dinámico:** la lista de rutas para SSG/`react-snap` se arma desde las mismas
   funciones. Documentar el punto exacto donde se cambia mock→fetch.
5. **Revalidación:** si la API es dinámica, considerar build hooks de Vercel (rebuild al
   actualizar catálogo) o, a futuro, migrar a SSR (Fase 2-B) para datos en tiempo real.

---

## Criterios de aceptación (verificá todo esto al final)

- [ ] `<html lang="es">` en el HTML servido (no en `en`).
- [ ] Cada ruta tiene `<title>` único (50–60c) y `<meta name="description">` (140–160c).
- [ ] Cada ruta tiene `canonical`, Open Graph completo y `twitter:card`.
- [ ] `robots` = `index,follow` en páginas públicas (y `noindex` sólo donde corresponda).
- [ ] **1 solo `<h1>` por página**; jerarquía H2/H3 correcta.
- [ ] `view-source:` de cada ruta principal muestra el **contenido y el `<head>` ya
      renderizados** (pre-render/SSG funcionando), no un HTML vacío.
- [ ] `public/robots.txt` y `sitemap.xml` accesibles; el sitemap lista todas las rutas + productos.
- [ ] JSON-LD válido (Organization + WebSite global; Product en producto; Article+Breadcrumb en guías) — validar con el Rich Results Test.
- [ ] Las 7 páginas base tienen los títulos/descripciones de la tabla 3.1.
- [ ] Al menos las primeras 5 guías del cluster Soporte creadas e interlinkeadas.
- [ ] `alt` en imágenes; sin errores de consola; Lighthouse SEO ≥ 95.
- [ ] La capa `src/data/` está centralizada y lista para cambiar mock→API sin tocar las vistas.

## Orden sugerido de ejecución
1. Fase 1 (lang, Seo.tsx, H1) → commit.
2. Fase 4 (robots, sitemap, JSON-LD) → commit.
3. Fase 2 (pre-render/SSG) → commit y verificar `view-source`.
4. Fase 3 (metadatos por página + primeras guías) → commits.
5. Fase 5 (capa de datos lista para API) → commit.

## Anexos en esta carpeta
- `matriz_palabras_clave_iluminacion.csv` — 20 keywords con intención y título propuesto.
- Documentos de estrategia (PDFs 01–11): posicionamiento "Ready to Work", competencia,
  clusters de contenido y guía de Fase 0.
