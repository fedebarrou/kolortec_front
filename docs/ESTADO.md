# Estado de kolortec — al 2026-10-14

> Foto del día. Lo que cambia seguido (deploys, pendientes de producción) vive en tiendita:
> `tiendita-back/docs/BITACORA.md` y `tiendita-back/docs/PENDIENTES-VPS.md`.

## En producción

- **Código desplegado:** `22cef7d` (feat/efectos-disenadores), el 2026-10-15 02:27:30Z (14-oct 23:27 ART), deploy
  **20261014b** (sólo `kolortec_web`; suite local `eslint` + `vite build` en verde, corrida por el hilo principal): texto del
  pie bajo el logo → «Iluminación profesional para espectáculos. Fabricación propia, soporte técnico local y repuestos en
  stock» (EN «Professional lighting for live shows. In-house manufacturing, local technical support and spare parts in
  stock»). Imagen `1f14592ba9c9` (antes `b318835b71ce`). tgz `git archive 22cef7d` = `1998bc5d…8f2b32` (local = remoto);
  árbol nuevo vs viejo = exactamente `git diff fa3f0b4..22cef7d` (4 archivos), nada sólo-VPS. Afuera: `/?preview=x` 200
  24710 B pide `index-Cc7ZJ1ox.js` (antes `index-ChDtjRRb.js`); el texto ES vive en el chunk `LanguageProvider-Kiv2_oWH.js`
  que importa el index (1 «Fabricación propia», 0 «Global leaders», 0 «Líderes globales»); el EN también está en el index.
  `/` sigue con el cartel (1510 B). Caddyfile `e1c23681…1a1d1a` antes = después; restarts 0. Ventana `ventas-vps`
  02:25:07Z → cerrada 02:29:16Z, 14 usos (deploy + limpieza).
  **Rollback 20261014b:** `mv /opt/kolortec /opt/kolortec.fallido-20261014b && mv /opt/kolortec.prev-20261014b /opt/kolortec
  && docker tag kolortec-web:pre-20261014b kolortec-web:latest && cd /opt/kolortec/deploy && docker compose up -d --no-deps
  --no-build kolortec_web` (`pre-20261014b` = `b318835b71ce` = `fa3f0b4`; vuelve a pedir `index-ChDtjRRb.js`).
- **Limpieza del VPS (20261014b):** borrados los tags `kolortec-web:pre-20261011b/-20261012/-20261012g/h/i/-20261014a`, las
  carpetas `/opt/kolortec.prev-*` viejas (6) y los paquetes `/opt/_upload/kolortec-*` (7). Quedan sólo `kolortec-web:latest`,
  `:pre-20261014b`, `/opt/kolortec` y `/opt/kolortec.prev-20261014b`: **no hay rollback más atrás que `fa3f0b4`.**
  Liberado ~1,04 GB (`df` 64G → 63G usados). Lo de tiendita y otros no se tocó.
- **Deploy anterior:** `fa3f0b4`, el 2026-10-15 00:38Z, deploy 20261014a: footer y favicon con los logos originales
  (`Grupo-Kolortec-1024x150.jpeg`, `logo_minimal.png`). Detalle: `tiendita-back/docs/BITACORA.md`.
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
