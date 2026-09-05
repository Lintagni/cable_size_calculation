import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png', 'logo.svg'],
      manifest: {
        name: 'BS7671 Cable Sizing',
        short_name: 'Cable Sizing',
        description: 'Free BS7671:2018+A2 cable size calculator. LV cable sizing, voltage drop, short circuit, motor cables, board schedules, ABC overhead and busbars.',
        theme_color: '#1a1625',
        background_color: '#faf9f7',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/?source=pwa',
        categories: ['utilities', 'productivity'],
        icons: [
          { src: 'pwa-64x64.png',             sizes: '64x64',    type: 'image/png' },
          { src: 'pwa-192x192.png',            sizes: '192x192',  type: 'image/png' },
          { src: 'pwa-512x512.png',            sizes: '512x512',  type: 'image/png', purpose: 'any' },
          { src: 'maskable-icon-512x512.png',  sizes: '512x512',  type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache all static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // The navigate fallback serves dist/index.html — which is the
        // prerendered HOME PAGE, not an empty shell. Falling back to it for
        // every navigation meant a returning visitor with the SW installed got
        // the home page at /calculator and at every content URL. Only the four
        // client-only routes have no HTML file of their own, so only they may
        // use the fallback; everything else hits the network and gets its own
        // prerendered file (or a real 404).
        //
        // Keep in sync with the SPA rewrites in vercel.json.
        navigateFallbackAllowlist: [/^\/(ai|dashboard|admin|payment-success)\/?$/],
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Google Fonts stylesheets — cache for a year
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts files — cache for a year
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
