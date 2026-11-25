import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development the browser talks to Vite (same origin) and Vite forwards /api to the Spring Boot backend,
// so no CORS setup is needed. Change the target if your backend runs elsewhere.
const backend = process.env.BACKEND_URL || 'http://localhost:8080'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: backend, changeOrigin: true } } },
  preview: { port: 4173, proxy: { '/api': { target: backend, changeOrigin: true } } },
})
