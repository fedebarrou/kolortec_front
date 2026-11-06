# Estado de kolortec — al 2026-11-06

> Foto del día. Lo que cambia seguido (deploys, pendientes de producción) vive en tiendita:
> `tiendita-back/docs/BITACORA.md` y `tiendita-back/docs/PENDIENTES-VPS.md`.

## En producción

- **Código desplegado:** `fcff78b` (main), el 2026-11-06 14:07Z, deploy **20261106** (sólo `kolortec_web`; **sin suite completa,
  por decisión de Fedev; vite build local verde**): logo del navbar a 24px (`HeaderSection.jsx:449` `h-8 md:h-9` → `h-6`).
  Imagen `1ef922bb4900` (antes `9d372b618818` = `1223dfd`). Afuera: `/?preview=x` 200 pide `index-BI97VjFz.js` (antes
  `index-BSDvYkkP.js`) con 1 × `h-6 w-auto object-contain` y 0 × `h-8 md:h-9`; `/` sigue con el cartel (1510 B, igual byte a
  byte); restarts 0; Caddyfile igual antes/después. tgz `git -c core.autocrlf=false archive fcff78b` (el tgz con autocrlf=true
  metía CRLF en 222 archivos). Detalle: `tiendita-back/docs/BITACORA.md` (2026-11-06).
  **Rollback 20261106:** `mv /opt/kolortec /opt/kolortec.fallido-20261106 && mv /opt/kolortec.prev-20261106 /opt/kolortec
  && docker tag kolortec-web:pre-20261106 kolortec-web:latest && cd /opt/kolortec/deploy && docker compose up -d --no-deps
  --no-build kolortec_web` (vuelve a pedir `index-BSDvYkkP.js`).
- **Restos de rollback en el VPS (no se borró nada):** tags `kolortec-web:pre-20261106/-20261026/-20261020d/-20261020b/-20261014b`,
  carpetas `/opt/kolortec.prev-` con esos mismos sufijos, y `/opt/_upload/kolortec-20261106-lf.tar.gz`. La limpieza queda para
  otra sesión, fuera del modo automático.
- **Deploy anterior:** `1223dfd`, el 2026-10-26 18:53Z, deploy 20261026 «todo junto». Detalle: `tiendita-back/docs/BITACORA.md`.
- **Dominio:** `kolortec.com.ar` ya responde (200). Muestra el cartel **«Sitio en construcción»**
  porque la cuenta de kolortec en tiendita **no está publicada** (`published=false` en
  `/api/public/web-config`). Con `?preview=<token>` se ve el sitio entero.
- **Hero:** cargado en la cuenta de prod (3 carruseles en `hero_config`).
- **Sección amarilla:** modelo 3D del HOT SPOT CMY (v4, Draco + WebP, 593 KB), loop de despiece.
  Las descripciones por pieza están apagadas (`PIEZAS_INTERACTIVAS=false`) hasta tener los textos.
- **Instagram:** desde el 2026-10-03 el feed público responde 200 (antes 401 en todos los sitios,
  arreglado en tiendita `a80aaa1`). El carrusel usa `preview_url` (los videos ya no salen rotos).
  **Todavía no hay cuenta de Instagram conectada**, así que la sección muestra sólo el link a @kolortec.

## Suite (la que se corre antes de desplegar)

`npm run lint` (0 errores) · `npx vite build` · `node scripts/check-i18n-parity.mjs` (432 claves, en/es) ·
`node scripts/check-lineas.mjs` (21). Verde al 2026-10-03.

## Pendiente

| Qué | Depende de |
| --- | --- |
| **Publicar** la cuenta de kolortec en tiendita (saca el cartel) | Fede: decidir cuándo |
| Conectar el Instagram de Kolortec (Integraciones → Instagram) | Fede: agregar la cuenta como *Instagram Tester* en la app de Meta y aceptar la invitación, hasta que Meta apruebe la revisión |
| Meta App Review de `instagram_business_basic` | Enviada el 2026-10-03. Si la rechazan por el screencast, regrabar el flujo completo (login → Permitir → @usuario → carrusel en la web) |
| Textos de cada pieza del 3D, para volver a prender el zoom con descripción | Kolortec |
| (Opcional) agrandar el 3D cerrado en celular | Fede |
| Borrar restos de rollback en el VPS: imágenes `kolortec-web:pre-20261003`, `:pre-20261003b` y carpetas `/opt/kolortec.prev-20261003`, `/opt/kolortec.prev-20261003b` | Cuando el deploy esté asentado |
