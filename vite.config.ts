import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'AUDIOX | A NEXUS Product',
        short_name: 'AUDIOX',
        description: 'Conversão profissional de áudio e vídeo.',
        theme_color: '#08131f',
        background_color: '#07111c',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/pwa-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        runtimeCaching: [{
          urlPattern: /^https:\/\/unpkg\\.com\/\\@ffmpeg\\/core\\@0\\.12\\.6\//,
          handler: 'CacheFirst',
          options: { cacheName: 'audiox-ffmpeg-core', expiration: { maxEntries: 4, maxAgeSeconds: 2592000 }, cacheableResponse: { statuses: [0, 200] } }
        }]
      }
    })
  ]
})
