import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const appVersion = '0.2.4'
const buildId = process.env.GITHUB_SHA?.slice(0, 7) || 'local'

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_BUILD__: JSON.stringify(buildId)
  },
  optimizeDeps: { exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'] },
  base: '/AUDIOX/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      manifest: {
        name: 'AUDIOX | Nexus Works Digital',
        short_name: 'AUDIOX',
        description: 'Conversão profissional de áudio e vídeo da Nexus Works Digital.',
        theme_color: '#08131f',
        background_color: '#07111c',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: 'pwa-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        runtimeCaching: [{
          urlPattern: /\/AUDIOX\/ffmpeg\/.*\.(?:js|wasm)$/i,
          handler: 'CacheFirst',
          options: { cacheName: 'audiox-ffmpeg-assets', expiration: { maxEntries: 4, maxAgeSeconds: 2592000 }, cacheableResponse: { statuses: [0, 200] } }
        }]
      }
    })
  ]
})
