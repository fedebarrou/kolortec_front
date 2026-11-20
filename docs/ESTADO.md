# Estado de kolortec — al 2026-11-20

> Foto del día. Lo que cambia seguido (deploys, pendientes de producción) vive en tiendita:
> `tiendita-back/docs/BITACORA.md` y `tiendita-back/docs/PENDIENTES-VPS.md`.

## En producción

- **Código desplegado:** `10c736d` (main), el 2026-11-20 11:52Z, deploy **20261120b** (segundo del día; sólo `kolortec_web`,
  `--no-deps`). Trae `10c736d`: los tres rojos de la suite arreglados — las 10 claves `productDetail.media.*` en inglés y
  español (la galería de fotos y videos de la ficha ya no muestra español en inglés), el import de `customFonts` con `.js`,
  `alturaDelHero` sin el `heroFrame` que no usaba y la excepción de fast refresh en `msSalidaDelPaso`. **Suite corrida en
  local y VERDE** antes de desplegar (lint, check-i18n-parity, check-lineas, check-ig-video, check-hero-altura,
  check-capas-hero, vite build); joan aprobó el diff. No se corrieron los checks que necesitan un vite en 5173
  (check-blog-marcas, check-filtros, la parte E2E de check-media, check-volver-categoria). Antes de tocar: `/opt/kolortec`
  idéntico a `git archive 0adc558` (697 archivos); disco 35 %. tgz `/opt/_upload/kolortec-20261120b-lf.tar.gz` sha256
  `0fa350cd…` (67.917.237 B, igual local y VPS). Imagen `2255c73871ab` (antes `7600c1575873` = `0adc558`, etiquetada
  `kolortec-web:pre-20261120b`). Restarts 0, `nginx -t` OK, 0 errores en el log; los mismos 25 contenedores y el Caddyfile
  (`2eb2a5dd…`) igual antes y después. Afuera (repetido desde la PC): `/` 200 cartel 1510 B; `/?preview=x` 200 pide
  `index-YZZVdLvn.js` (antes `index-CHZf2KIf.js`) e `index-CU1HKS18.css` (sin cambio); «Ask about this unit» y «Real work
  with» están en `LanguageProvider-JrnGkYDP.js`; siguen el pie 4:5 en el CSS y `data-ig-video` en `HomePage-BZ1hcrJq.js`.
  **No se abrió en un navegador contra producción.** Ventana abierta por Fedev 11:49:05Z, 6 usos 11:50:08Z → 11:51:58Z,
  cerrada 11:58:52Z.
  **Rollback 20261120b:** `mv /opt/kolortec /opt/kolortec.fallido-20261120b && mv /opt/kolortec.prev-20261120b /opt/kolortec
  && docker tag kolortec-web:pre-20261120b kolortec-web:latest && cd /opt/kolortec/deploy && docker compose up -d --no-deps
  --no-build kolortec_web` (vuelve a `7600c1575873`, pide `index-CHZf2KIf.js`).
  **Pendiente de decidir (Fedev):** el compose de kolortec y el de tiendita comparten nombre de proyecto (`deploy`), por eso
  `compose up` avisa huérfanos de tiendita. Hoy no rompe nada, pero un `--remove-orphans` desde `/opt/kolortec/deploy`
  bajaría tiendita: conviene fijar `name:` en el compose.
- **Deploy anterior:** `0adc558` (main), el 2026-11-20 10:42Z, deploy **20261120** (sólo `kolortec_web`, `--no-deps`).
  Trae `9e8f2b7` (los reels de Instagram se reproducen al apoyar el mouse y en el visor; galería del pie 4:5 con el mismo
  ancho) y `0adc558` (el reel que Instagram entrega sin `.mp4` por derechos de autor no se muestra; reaparece solo cuando
  vuelve a llegar el video). **Suite:** se corrió en local antes de desplegar y dio ROJO en tres pasos que no son de este
  cambio y ya estaban en producción (`npm run lint`: 2 errores en `heroAltura.js` y `ElementView.jsx`;
  `check-i18n-parity.mjs`: 14 claves `productDetail.media.*` sin resolver; `check-lineas.mjs` no arranca por el import sin
  extensión de `customFonts` en `contentService.js`); `check:ig-video` y `npx vite build` verdes. Se le avisó a Fedev con la
  recomendación de desplegar igual; **abrió la ventana sin contestar esa pregunta en palabras** y se tomó como un sí. Los
  tres rojos quedan pendientes. Antes de tocar: `/opt/kolortec` idéntico a `git archive be670b1` (694 archivos, sha256 uno a
  uno; sin `.env` ni nada sólo-VPS); disco 34 %. tgz `/opt/_upload/kolortec-20261120-lf.tar.gz` sha256 `ca25bcf1…`
  (67.915.721 B, igual local y VPS, 697 archivos). Imagen `7600c1575873` (antes `779bfeab5942` = `be670b1`, etiquetada
  `kolortec-web:pre-20261120`). Restarts 0, `nginx -t` OK, 0 errores en el log; los mismos 25 contenedores antes y después.
  Afuera (repetido desde la PC): `/` 200 cartel 1510 B; `/?preview=x` 200 pide `index-CHZf2KIf.js` (antes
  `index-DPVQEnkv.js`) e `index-CU1HKS18.css`; el CSS trae `.kt-marquee-item-footer{aspect-ratio:4/5;width:clamp(210px,19vw,340px)}`
  y 0 apariciones de `kt-marquee-item-square`; `data-ig-video` está en el chunk `HomePage-Cell8Xog.js` y la clase del pie
  en `index-CHZf2KIf.js`; `/rentals?preview=x` 301 → `/sumate?preview=x`. **No se volvió a abrir en un navegador contra
  producción** (la reproducción se probó en local contra el API real antes del deploy). Ventana `peligro.py` abierta por
  Fedev, 6 usos 10:39:20Z → 10:43:15Z; venció sola 11:23Z.
  **Rollback 20261120:** `mv /opt/kolortec /opt/kolortec.fallido-20261120 && mv /opt/kolortec.prev-20261120 /opt/kolortec
  && docker tag kolortec-web:pre-20261120 kolortec-web:latest && cd /opt/kolortec/deploy && docker compose up -d --no-deps
  --no-build kolortec_web` (vuelve a `779bfeab5942`, pide `index-DPVQEnkv.js`).
  **Visto en el VPS y no tocado:** tag `kolortec-web:pre-20261116` (= `779bfeab5942`) que este archivo no registraba; el
  Caddyfile ahora es sha256 `2eb2a5dd…` (el 14-nov era `344df18a…`; cambió antes de este deploy, igual antes y después);
  `compose up` avisa contenedores huérfanos de tiendita porque comparten el proyecto `deploy` (no se usó `--remove-orphans`).
- **Deploy 20261114:** `be670b1` (main), el 2026-11-14 20:39Z, deploy **20261114** (sólo `kolortec_web`, `--no-deps`;
  **desplegado sin suite completa, por decisión de Fedev**; vite build local verde). Trae `0d4320c` (innovaciones siempre con
  recuadro + grilla; «Liveshow» sin traducir y debajo de relacionados), `e2a506c` (flechas de la foto fijas) y `be670b1`
  (tilde en «Especificación Técnica»). Antes de tocar: `/opt/kolortec` idéntico a `git archive 9830c6b` (693 archivos,
  sha256 uno a uno; sin `.env` ni nada sólo-VPS); disco 77 %. tgz `/opt/_upload/kolortec-20261114-lf.tar.gz` (borrado el 15-nov) sha256
  `805b42bc…` (67.906.845 B, igual local y VPS; contenido == `git archive be670b1`, 694 archivos). Imagen `779bfeab5942`
  (antes `c0d38a28aaec` = `9830c6b`, etiquetada `kolortec-web:pre-20261114`). Restarts 0, `nginx -t` OK, 0 errores en el log,
  Caddyfile sha256 `344df18a…` igual. Afuera: `/` 200 cartel 1510 B idéntico byte a byte al de ayer; `/?preview=x` 200 pide
  `index-DPVQEnkv.js` (antes `index-DlFlWmB2.js`); el texto «Especificación Técnica» está en el chunk
  `LanguageProvider-BUcaWK8S.js` (200, 2 apariciones), no en `index-*.js`; `/rentals?preview=x` 301 → `/sumate?preview=x`.
  Ventana `peligro.py` 20:36:00Z → 20:41:25Z, 6 usos en `~/.claude/pinky-produccion-registro.jsonl`. Disco después 78 %.
  **Rollback 20261114:** `mv /opt/kolortec /opt/kolortec.fallido-20261114 && mv /opt/kolortec.prev-20261114 /opt/kolortec
  && docker tag kolortec-web:pre-20261114 kolortec-web:latest && cd /opt/kolortec/deploy && docker compose up -d --no-deps
  --no-build kolortec_web` (vuelve a `c0d38a28aaec`, pide `index-DlFlWmB2.js`).
- **Deploy anterior:** `9830c6b` (main), el 2026-11-14 00:01Z, deploy **20261113** (sólo `kolortec_web`; **sin suite
  completa, por decisión de Fedev**; vite build, `nginx -t` y redirecciones probados en local). Trae las 8 redirecciones 301
  de `deploy/nginx-spa.conf` (+ `absolute_redirect off`, Cache-Control), quitafondo de innovaciones, tira de marcas y SEO.
  Imagen `c0d38a28aaec` (antes `1ef922bb4900` = `fcff78b`). Afuera: `/?preview=x` 200 pide `index-DlFlWmB2.js` (antes
  `index-BI97VjFz.js`); `/` sigue con el cartel (1510 B, igual byte a byte); `/rentals?preview=x` 301 → `/sumate?preview=x`,
  `/soporte?a=1&preview=x` 301 → `/descargas?a=1&preview=x`; **sin `?preview` Caddy responde el cartel (200) antes de llegar
  a nginx**, así que las 301 públicas recién se ven cuando la cuenta se publique y se saque el `handle` del cartel. Contra el
  contenedor directo: `/soporte?a=1`→`/descargas?a=1`, `/rentals`→`/sumate`, `/legales`→`/terminos`, `/home`→`/` (301),
  `/producto/x` y `/` 200. `ProductDetailPage-BQY7PYf-.js` servido contiene `sin-fondo-liso`. Restarts 0; Caddyfile sha256
  `344df18a…` igual antes/después. tgz `kolortec-20261113-lf.tar.gz` sha256 `8f2a65dd…` (mismo en local y VPS).
  **Rollback 20261113:** `mv /opt/kolortec /opt/kolortec.fallido-20261113 && mv /opt/kolortec.prev-20261113 /opt/kolortec
  && docker tag kolortec-web:pre-20261113 kolortec-web:latest && cd /opt/kolortec/deploy && docker compose up -d --no-deps
  --no-build kolortec_web` (vuelve a pedir `index-BI97VjFz.js`). Detalle: `tiendita-back/docs/BITACORA.md` (2026-11-14).
- **Rollbacks de kolortec disponibles en el VPS (tras la limpieza del 2026-11-14 20:50–20:58Z, pedida por Fedev):**
  sólo los dos de arriba — tags `kolortec-web:pre-20261114` (`c0d38a28aaec`) y `:pre-20261113` (`1ef922bb4900`), carpetas
  `/opt/kolortec.prev-20261114` y `.prev-20261113`. (Los tgz `/opt/_upload/kolortec-2026111{3,4}-lf.tar.gz` **ya no
  existen**: se borraron en la limpieza profunda del 2026-11-15, ver abajo. Para rearmar uno: `git -c core.autocrlf=false
  archive` del commit.)
  Se borraron los de 20261106, 20261026, 20261020d, 20261020b y 20261014b (tags, carpetas y el tgz de 20261106): ya no se
  puede volver a `fcff78b` ni antes desde el VPS. En la misma limpieza se borraron los rollbacks viejos de tiendita (se
  conservaron los 2 más recientes por grupo), el caché de build colgado (8 GB) y nada más. Disco 78 % → 62 % (22 → 37 GB
  libres). Contenedores, ids de imagen, restarts y códigos HTTP de los 20 dominios del Caddyfile iguales antes y después;
  Caddyfile sha256 `344df18a…` igual. Ventana `peligro.py` 20:49:39Z → 20:58:19Z, 14 usos en el registro.
- **Limpieza profunda del VPS, 2026-11-15 02:17–02:26Z (pedida por Fedev: «hacé todo, incluso quitá manual-creator»).**
  Disco 60,7 → 26,2 GB usados (62 % → 27 %, 37 → 71 GB libres). Se quitó: caché de build (25 GB, −19,9 GB de disco);
  **manual-creator dado de baja con su base, por decisión de Fedev** (6 contenedores `ops`, 4 imágenes, volúmenes
  `ops_clamav/minio/postgres/redis_data`, releases en `/opt`; −2,9 GB); rollbacks únicos `giro-app:pre-6dc0cf7`/`:5ebd9f4`,
  `modelate_web:anterior`/`pre-20261023`, `fedev_web:pre-20261023`, `repartia-web:pre-20261023` y `/opt/fedev.pre-20261023`
  (−9,9 GB): **giro, modelate, fedev y repartia quedan SIN rollback en el VPS hasta su próximo deploy**; volumen MySQL
  huérfano `201f59…` (restore de prueba del 12-oct: esquemas `mysql`, `performance_schema`, `sys` y `r` con tablas de
  tiendita) y 4 anónimos vacíos; `/root/archivo-20260929`, `/root/apt-rollback-20261023`, `/opt/modelate.viejo`,
  `/opt/nfc-cloud.viejo`; `/opt/_upload/*` (tgz de kolortec 13 y 14-nov) y `/opt/tiendita/_upload/*`; dumps: 39
  `tiendita-db-*` de `/opt/backups` (incluido el `…CON-TOKENS-vence-20261115`; quedan `20261027b-0403` y `20261028-0540`),
  `herocreator-20260802`, `/opt/bw-backups`, y en `/root/backups` los `bw_db` de mayo/junio y `herocreator-final`.
  Quedaron: `/opt/manual-creator-backups` y `/opt/backups/manual-creator-db-20260831…` (últimas copias de su base), la red
  `ops_internal` (la usa `nfc_web`), `/root/backups/kolortec-hero-20261112*.sql`, imágenes `clamav/clamav:stable` y
  `redis:7.4-alpine` ya sin uso. Caddyfile intacto (`344df18a…`): `sitiodeprueba.online` → `manual_creator_web:3000`
  sigue dando 502. **El rollback de kolortec sigue siendo `kolortec-web:pre-20261114` + `/opt/kolortec.prev-20261114`.**
  25 contenedores con mismo id de imagen, StartedAt y restarts; 29 dominios del Caddyfile con el mismo código desde afuera.
  Ventana `peligro.py` 02:17:03Z → 02:26:07Z, 17 usos en el registro.
- **Antes:** `fcff78b`, el 2026-11-06 14:07Z, deploy **20261106** (sólo `kolortec_web`; **sin suite completa,
  por decisión de Fedev; vite build local verde**): logo del navbar a 24px (`HeaderSection.jsx:449` `h-8 md:h-9` → `h-6`).
  Imagen `1ef922bb4900` (antes `9d372b618818` = `1223dfd`). Afuera: `/?preview=x` 200 pide `index-BI97VjFz.js` (antes
  `index-BSDvYkkP.js`) con 1 × `h-6 w-auto object-contain` y 0 × `h-8 md:h-9`; `/` sigue con el cartel (1510 B, igual byte a
  byte); restarts 0; Caddyfile igual antes/después. tgz `git -c core.autocrlf=false archive fcff78b` (el tgz con autocrlf=true
  metía CRLF en 222 archivos). Su entrada en `tiendita-back/docs/BITACORA.md` no está (no aparece en el archivo ni en su
  historia git; el detalle de ese deploy es este párrafo). Antes de él: `1223dfd`, 2026-10-26 18:53Z, deploy 20261026.
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
