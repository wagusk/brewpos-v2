import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8000,
    // Proxy API + WebSocket to the backend. Default is the dev backend on
    // 8765; override with BREWPOS_BACKEND_URL or BREWPOS_BACKEND_WS_URL.
    proxy: {
      '/api': {
        target: process.env.BREWPOS_BACKEND_URL ?? 'http://127.0.0.1:8765',
        changeOrigin: true,
      },
      '/ws': {
        target: process.env.BREWPOS_BACKEND_WS_URL ?? 'ws://127.0.0.1:8765',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
