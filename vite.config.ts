import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Minimal typing for the one environment variable read below (avoids adding Node type definitions).
declare const process: { env: Record<string, string | undefined> };

// `base` is the path the site is served from. On GitHub Pages that is /<repository-name>/.
// The deploy workflow sets VITE_BASE from the repository name, so nothing here needs editing.
// Locally (dev server, plain `npm run build`) it stays '/'.
const base = process.env.VITE_BASE ?? '/';

export default defineConfig(({ command, isPreview }) => ({
  // The dev server always serves from '/'. A build, and 'vite preview' of that build, use the Pages path.
  base: command === 'build' || isPreview ? base : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon-48.png', 'icons/apple-touch-icon.png', 'fonts/OFL.txt'],
      manifest: {
        name: 'Trip Tracker',
        short_name: 'Trip Tracker',
        description: 'Spending tracker for trips, with your real exchange rates. Works offline.',
        display: 'standalone',
        orientation: 'any',
        start_url: base,
        scope: base,
        theme_color: '#ffffff',
        background_color: '#f4f4f1',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
      workbox: {
        // Cache the whole app (including the font files) so it opens with no network.
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,txt,webmanifest}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
}));
