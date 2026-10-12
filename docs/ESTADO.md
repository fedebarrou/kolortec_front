# Estado de kolortec — al 2026-10-03

> Foto del día. Lo que cambia seguido (deploys, pendientes de producción) vive en tiendita:
> `tiendita-back/docs/BITACORA.md` y `tiendita-back/docs/PENDIENTES-VPS.md`.

## En producción

- **Código desplegado:** `5160a1e` (main), el 2026-10-12 22:35Z, deploy 20261012i (con «Tiendita para diseñadores», CON
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
