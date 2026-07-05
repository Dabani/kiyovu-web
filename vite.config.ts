import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'kiyovu-crest.png'],
      manifest: {
        name: 'Kiyovu Sports — Internal Rules Portal',
        short_name: 'Kiyovu IRMS',
        description: 'Kiyovu Sports Association internal governance & records system',
        theme_color: '#006400',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Never cache API calls — this is a live records system, always fetch fresh.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\/api\/lookups\//,
            handler: 'NetworkFirst',
            options: { cacheName: 'lookups-cache', expiration: { maxAgeSeconds: 3600 } },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://kiyovu-api.test',
        changeOrigin: true,
      },
      '/sanctum': {
        target: 'http://kiyovu-api.test',
        changeOrigin: true,
      },
    },
  },
});
