# Hero — backup del diseño (fallback)

> **El hero LIVE se arma desde tiendita** (`/public/hero-config`, scene-schema). Este archivo es el
> **diseño de fallback/backup** por si se pierde: son los 3 slides que muestra `defaultLandingContent.hero`
> (`src/features/landing/data/landingData.js`) cuando tiendita no tiene un hero cargado (o en el mockup de
> Vercel, sin API). El estilo (Golden Line, overlay cálido, etc.) vive en `HeroSection.jsx`.
>
> Flujo: `getLandingContent()` → `mapHeroConfig(/public/hero-config)` (mapea media imagen/video, título,
> subtítulo, badge, botones/CTA, `textPosition`, detección "golden") → si no hay config, usa estos defaults
> → `<HeroSection hero={content.hero} />` (entre Instagram y Destacados).

## Config general
- `intervalMs: 7000` (auto-rotación cada 7 s; pausa al hover).
- Carrusel con dots de navegación cuando hay > 1 slide.

## Slides (fallback actual)

### 1 — READY TO WORK (`translationKey: 'hero'`)
- badge: `EST 2011`
- title: `READY TO WORK.`
- subtitle: `Industrial-grade illumination for high-stakes environments. When failure is not an option, the world's leading engineers choose Kolortec.`
- primaryCta: `View Products` · secondaryCta: `Follow on Instagram`
- imageUrl: `/assets/hero-bg-BvHCzeSh.jpg` · videoUrl: `null`
- textPosition: `left`

### 2 — GOLDEN LINE (`translationKey: 'hero3'`)  ← estilo especial "golden"
- badge: `LIMITED EDITION`
- title: `Golden Line.`
- subtitle: `Vintage warmth meets touring-grade engineering. A theatrical line of blinders, pars and bars built to glow night after night.`
- primaryCta: `Explorar la linea` → `/products` · secondaryCta: `null`
- imageUrl: `/assets/golden-line/starpar.webp` · videoUrl: `null`
- textPosition: `right`

### 3 — POWER ON STAGE (`translationKey: 'hero2'`)
- badge: `IN ACTION`
- title: `POWER ON STAGE.`
- subtitle: `Trusted by touring productions, broadcasters, and architectural integrators across LATAM. Built to perform night after night.`
- primaryCta: `Soporte` → `/soporte` · secondaryCta: `Contactate con soporte` → `#support`
- imageUrl: `https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1920&q=80` · videoUrl: `null`
- textPosition: `right`

## Estilo "Golden Line" (en `HeroSection.jsx`)
Se activa por `isGolden` (auto-detectado si el imageUrl o el título contienen "golden"):
- Fuente cursiva **Pacifico** para el título.
- Tres líneas divisorias con degradé dorado/naranja (arriba y abajo del título).
- Overlay cálido: base `#1a0d04`.
- Color de texto cálido: `#f5e9c8`.

## Notas
- Los slides soportan `videoUrl` (fondo en video) además de `imageUrl`.
- `textPosition` (`left` | `right`) viene de `scene.layout` o `scene.texts.title.align.h` en tiendita.
- Para restaurar este diseño: los datos están en `landingData.js` (`defaultLandingContent.hero`) y el
  estilo en `HeroSection.jsx` — ambos en git. Este doc es la referencia legible.
