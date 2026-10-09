import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Service worker dimatikan: sw.js lama sempat ter-cache CDN Hostinger
      // seminggu sehingga browser terus menyajikan build lama. selfDestroying
      // menerbitkan sw.js yang menghapus cache & unregister dirinya sendiri.
      selfDestroying: true,
      registerType: 'autoUpdate',
      includeAssets: ['favicon-32.png', 'favicon-16.png', 'apple-touch-icon.png', 'logo.png'],
      manifest: {
        id: '/',
        name: 'Yapinet',
        short_name: 'Yapinet',
        description: 'Portal pengawasan lintas unit untuk BPH, Pembina, dan Pengawas Yayasan.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#F7F9FB',
        theme_color: '#2E6DA4',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Shell + aset statis di-cache untuk pemakaian offline; data ringkasan
        // dashboard sengaja TIDAK di-cache Workbox — selalu diambil segar dari
        // /api/dashboard/summary (yang sendiri sudah dibaca dari cache table
        // MySQL di backend, lihat Bab 04 blueprint).
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /\/api\/dashboard\/summary/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dashboard-summary',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 1, maxAgeSeconds: 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
})
