import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Bar & Resto Flow - Gestión de Mesas y Reservas',
        short_name: 'BarFlow',
        description: 'Sistema PWA offline-first para gestión de croquis, mesas y reservas en bares y gastrobares',
        theme_color: '#0f172a',
        background_color: '#020617',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  test: {
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/dist/**', 'backend/**'],
  }
});
