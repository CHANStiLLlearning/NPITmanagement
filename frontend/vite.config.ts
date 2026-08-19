import path from "path"
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://127.0.0.1:8000',
      '/users': 'http://127.0.0.1:8000',
      '/students': 'http://127.0.0.1:8000',
      '/teachers': 'http://127.0.0.1:8000',
      '/attendance': 'http://127.0.0.1:8000',
      '/teaching-reports': 'http://127.0.0.1:8000',
      '/scores': 'http://127.0.0.1:8000',
      '/academic': 'http://127.0.0.1:8000',
      '/analytics': 'http://127.0.0.1:8000',
      '/files': 'http://127.0.0.1:8000',
      '/search': 'http://127.0.0.1:8000',
      '/system-logs': 'http://127.0.0.1:8000',
      '/reports-center': 'http://127.0.0.1:8000',
      '/settings': 'http://127.0.0.1:8000',
      '/finance': 'http://127.0.0.1:8000',
      '/announcements': 'http://127.0.0.1:8000',
      '/exams': 'http://127.0.0.1:8000',
      '/api': 'http://127.0.0.1:8000',
      '/static': 'http://127.0.0.1:8000',
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
  },
})
