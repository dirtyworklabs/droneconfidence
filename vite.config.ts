import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    rollupOptions: {
      output: {
        // Matched on resolved paths so deep entry points (react-dom/client,
        // motion-dom, scheduler) land in the vendor chunk they belong to
        // instead of the main bundle.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) {
            return 'react'
          }
          if (/node_modules\/(motion|motion-dom|motion-utils|framer-motion)\//.test(id)) {
            return 'motion'
          }
          return undefined
        },
      },
    },
  },
})
