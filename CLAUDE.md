# CLAUDE.md — kolortec (storefront)

> ⚠️ **INFRA VPS — el reverse proxy es CADDY (no nginx), desde jun-2026.**
> kolortec **todavía NO está live** en el VPS (sus dominios `kolortec.com.ar` / `kolortec.com` están
> registrados en `account_domains` de tiendita pero NO ruteados aún). **Cuando se suba al VPS**, se
> sirve detrás de **Caddy** (proxy único; reemplazó a nginx). Antes de deployarlo / rutearlo, leé
> `tiendita/.claude/ECOSISTEMA-CADDY.md`.
>
> **Para ponerlo live (cuando toque):**
> 1. DNS: apuntar `kolortec.com.ar` (y `.com`) → `212.85.14.157` (en Hostinger).
> 2. Caddyfile del VPS (`/opt/docker-proxy/caddy/Caddyfile`): agregar
>    `kolortec.com.ar, www.kolortec.com.ar, kolortec.com { reverse_proxy kolortec_web:80 }`
>    y `docker exec caddy_edge caddy validate ... && caddy reload ...`. Caddy emite el cert solo.
> 3. (NO usar el `kolortec/deploy/kolortec.conf` de nginx — quedó obsoleto; el edge es Caddy.)

## Qué es
Storefront público (Vite + React, SPA) de la marca kolortec. **Consume la API PÚBLICA de tiendita**
(no tiene backend propio): manda el header `X-Account-Host` con su dominio y tiendita resuelve la
cuenta (ver adapter `src/shared/services/contentService.js` y `src/shared/services/accountHost.js`).
Es un ejemplo del "Modelo A" (web dedicada/a medida) del ecosistema multi-tenant de tiendita.

## Deploy en el VPS
- Contenedor `kolortec_web` (nginx estático sirviendo el build de Vite, puerto 80) en la red Docker `web`.
- Build: `npx vite build` (el Dockerfile saltea el postbuild de puppeteer).
- Deploy: scp del `src` a `/opt/kolortec` + `docker compose build kolortec_web && up -d` en `/opt/kolortec/deploy`.

## Nota
El header `X-Account-Host` y la API pública son el contrato con tiendita. Si cambia algo del
contrato, ver la auditoría en el repo de tiendita. NO meter secretos/tokens en el repo.
