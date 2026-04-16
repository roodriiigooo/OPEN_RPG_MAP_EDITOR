import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    allowedHosts: true, // allowedHosts: ['d4cc-186-236-130-87.ngrok-free.app'], 
    fs: {
      allow: ['..']
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    server: {
      deps: {
        inline: ['@exodus/bytes', 'html-encoding-sniffer'],
      },
    },
  },
})
