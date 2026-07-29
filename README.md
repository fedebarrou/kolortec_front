# kolortec — storefront

Storefront público (SPA) de **kolortec**. No tiene backend ni base de datos propia:
consume la **API pública de tiendita** (`/api/public/*`) a través de una capa adaptadora
(`src/shared/services/contentService.js`) que traduce las respuestas crudas de tiendita
a las formas que esperan los componentes de la landing y las páginas de producto/guías.

## Multi-tenant

Un mismo build/contenedor sirve **N dominios**. La cuenta (tenant) de tiendita se resuelve
**por hostname** y se envía en cada request en el header `X-Account-Host`
(ver `src/shared/services/accountHost.js`). En producción cada dominio
(`kolortec.com`, `kolortec.com.ar`, `cliente.com`, …) debe estar registrado en
`account_domains` del backend. En dev/localhost se usa el fallback
`VITE_TIENDITA_ACCOUNT_HOST`.

## Stack

- **Vite** (build/dev server)
- **React 19** + **React Router** (`react-router-dom`)
- **Tailwind CSS 4** (`@tailwindcss/vite`)
- `lucide-react` para íconos

## Setup local

```bash
npm install
npm run dev
```

Variables de entorno (ver `.env.example`):

| Variable | Descripción |
| --- | --- |
| `VITE_API_BASE_URL` | Base de la API pública de tiendita (incluye el sufijo `/api`). |
| `VITE_TIENDITA_ACCOUNT_HOST` | Host de la cuenta usado como fallback en dev/localhost. |
| `VITE_TRANSLATE_API_URL` | Endpoint de traducción (LibreTranslate/Argos). |
| `VITE_DEMO_DATA` | `true` → **modo vidriera**: los fallbacks usan data MOCK para que el sitio se vea "lleno" (build de Vercel para mostrarle al cliente). Ausente/`false` → build real: 100% data-driven, sin categorías/hero/productos inventados si tiendita no tiene info cargada. Fuente única del flag: `src/config.js`. |

> Dev tras Caddy: el server de Vite queda fijo en `127.0.0.1:5173` y acepta el host
> `kolortec.dev.tiendita.com.ar` (ver `vite.config.js`).

## Build / deploy

```bash
npm run build     # genera dist/ (prebuild: sitemap + llms.txt; postbuild: pre-render)
npm run preview   # sirve el build localmente
```

En producción el sitio se sirve **detrás de Caddy**, el reverse proxy / edge único del VPS
desde **junio de 2026** (TLS automático + on-demand por tenant). La config nginx bajo
`deploy/kolortec.conf` quedó **deprecada** y se conserva solo como referencia histórica.

## Integración con tiendita (endpoints públicos)

Todos los GET públicos incluyen `X-Account-Host` y `credentials: 'include'`, y caen a un
fallback (o a data mock en modo vidriera) si la request falla. Endpoints consumidos por
`contentService.js`:

| Endpoint | Uso |
| --- | --- |
| `GET /public/web-config` | Config del sitio (contactos/WhatsApp, `show_prices`, `published`, preview). |
| `GET /public/productos` | Catálogo (landing destacados, listado de tienda, detalle de producto). |
| `GET /public/categorias` | Categorías por cuenta (lista autoritativa). |
| `GET /public/hero-config` | Carrusel del hero (scene-schema; fallback al hero por defecto). |
| `GET /public/instagram/feed` | Feed de Instagram para la galería (si está conectado). |
| `GET /public/galeria` | Galería de imágenes (fallback cuando no hay Instagram). |
| `GET /public/marcas` | Logos de partners/clientes del footer. |
| `GET /public/blog?tipo=guia` | Guías/soporte (biblioteca de guías). |
| `GET /public/download/{id}` | Info de descarga con branding (redirect por producto). |
| `GET /public/me` · `POST /public/logout` | Sesión del cliente. |
| `GET /public/auth/google` (grupo `web`, sin `/api`) | OAuth con Google. |
| `POST /public/auth/otp/request` · `POST /public/auth/otp/verify` | Login por OTP (email/WhatsApp). |
