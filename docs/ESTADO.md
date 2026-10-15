# Estado de kolortec — al 2026-10-14

> Foto del día. Lo que cambia seguido (deploys, pendientes de producción) vive en tiendita:
> `tiendita-back/docs/BITACORA.md` y `tiendita-back/docs/PENDIENTES-VPS.md`.

## En producción

- **Código desplegado:** `fa3f0b4` (feat/efectos-disenadores), el 2026-10-15 00:38:15Z (14-oct 21:38 ART), deploy
  **20261014a** (sólo `kolortec_web`; suite local `npm run lint` + `npx vite build` en verde, por pedido de Fedev): footer y
  favicon con los logos originales (`Grupo-Kolortec-1024x150.jpeg`, `logo_minimal.png`), sello y placeholders con
  `logo_minimal.png`, fuera `public/favicon.svg`. Imagen `b318835b71ce` (antes `0cc97d00ad0a`). tgz `git archive fa3f0b4` =
  `39416fdd…e65359a` (local = remoto, `/opt/_upload/kolortec-20261014a/`); árbol nuevo vs viejo = exactamente
  `git diff 5160a1e..fa3f0b4`, nada sólo-VPS. Afuera: `/?preview=x` 200 24710 B con `rel="icon" type="image/png"
  href="/assets/logo_minimal.png"` y `index-ChDtjRRb.js` (227600 B, `kt-footer-logo` con `src` Grupo-Kolortec, 0
  `favicon.svg`); `logo_minimal.png` 200 `image/png` 7126 B; `Grupo-Kolortec-1024x150.jpeg` 200 `image/jpeg` 12274 B;
  `/favicon.svg` ahora 404; `/` y `www.` siguen con el cartel (1510 B). Caddyfile `e1c23681…1a1d1a` antes = después; restarts 0.
  Ventana `ventas-vps` 00:35:48Z → vencida 00:50:48Z (cierre explícito 02:03:09Z), 5 usos, último 00:38:08Z.
  **Rollback 20261014a:** `mv /opt/kolortec /opt/kolortec.fallido-20261014a && mv /opt/kolortec.prev-20261014a /opt/kolortec
  && docker tag kolortec-web:pre-20261014a kolortec-web:latest && cd /opt/kolortec/deploy && docker compose up -d --no-deps
  --no-build kolortec_web` (`pre-20261014a` = `0cc97d00ad0a` = `5160a1e`; vuelve a pedir `index-BSa3_cDD.js`).
- **Deploy anterior:** `5160a1e` (main), el 2026-10-12 22:35Z, deploy 20261012i (con «Tiendita para diseñadores», CON
  suite completa por pedido de Fedev): los efectos nuevos del editor (motion, stagger, scroll reveal) se ven igual que en el store.
  Contenedor `kolortec_web`, imagen `0cc97d00ad0a`. Afuera: `?preview` 200, chunk `HomePage-CHNHJnnU.js` con «Saltar» y `stagger`;
  `kolortec.com.ar` sigue con el cartel. Cuenta: plan hasta 2027-09-28, `site_mode=external`, `mcp-addon` activo; Asistente IA
  NO (plan `ai-addon` en `draft`, decide Fedev). Rollback: `kolortec-web:pre-20261012i` (`eb59cf7802fa`, = `a597feb`) +
  `/opt/kolortec.prev-20261012i`; `FECHA=20261012i bash /opt/tiendita/_upload/20261012i/remoto.sh rollback` (vuelve los 4 árboles).
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
