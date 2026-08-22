import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8000,
    // Backend is reached directly via VITE_API_URL (see .env.development).
    // Backend CORS allows all origins in dev, so no proxy is needed.
  },
})
