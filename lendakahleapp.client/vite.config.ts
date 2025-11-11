/// <reference types="vite/client" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 50354,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'https://localhost:7176',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})