# ---- build (Vite) ----
FROM node:20-alpine AS build
WORKDIR /app
# Evita que puppeteer descargue Chromium (no se usa el prerender en el contenedor).
ENV PUPPETEER_SKIP_DOWNLOAD=true
COPY package*.json ./
RUN npm ci
COPY . .
# API de tiendita (build-time, Vite lo inlinea). El tenant se resuelve por dominio
# en runtime (accountHost.js); el fallback de cuenta queda vacío en prod.
ARG VITE_API_BASE_URL=https://api.soytiendita.store/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG VITE_TIENDITA_ACCOUNT_HOST=
ENV VITE_TIENDITA_ACCOUNT_HOST=$VITE_TIENDITA_ACCOUNT_HOST
# Generadores opcionales (no fatal) + build. Saltea el postbuild de puppeteer.
RUN node scripts/gen-sitemap.mjs || true
RUN node scripts/gen-llms-txt.mjs || true
RUN npx vite build

# ---- serve (nginx estático, SPA fallback) ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY deploy/nginx-spa.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
