import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Bindea IPv4 explícito: Vite por defecto escucha en ::1 (IPv6) y Caddy proxya a
    // 127.0.0.1 → no lo alcanzaba. host+strictPort aseguran 127.0.0.1:5173 fijo.
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    // Permitir servir la app detrás de Caddy en el dominio local del tenant
    // (kolortec.dev.tiendita.com.ar → 127.0.0.1:5173). Sin esto Vite 8 rechaza el Host.
    allowedHosts: ['kolortec.dev.tiendita.com.ar', 'localhost', '127.0.0.1'],
  },
})
