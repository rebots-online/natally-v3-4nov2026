import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const ENV_DIR = '.generated';
const readJson = (path: string) => JSON.parse(readFileSync(path, 'utf8'));

export default defineConfig(({ mode }) => {
  // Settings come from the files scripts/resolve-env.mjs writes; process.env wins, so a build step can set the target.
  const env = loadEnv(mode, ENV_DIR, 'VITE_');
  const appName = env.VITE_APP_NAME ?? '';
  const canvas = readJson('design-system/tokens.json').color.tokens.find((t: { name: string }) => t.name === 'canvas').value;
  // Files under /ort/ keep their names across releases, so that cache follows the pinned package.
  const ortVersion = readJson('package.json').dependencies['onnxruntime-web'];

  return {
    envDir: ENV_DIR,
    server: { port: Number(env.VITE_DEV_PORT) || undefined, strictPort: true },
    build: { outDir: 'dist-web', chunkSizeWarningLimit: 4096 },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        disable: (env.VITE_BUILD_TARGET ?? 'web') !== 'web',
        strategies: 'generateSW',
        registerType: 'autoUpdate',
        injectRegister: false,
        filename: 'sw.js',
        manifest: {
          name: appName,
          short_name: appName,
          id: '/',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          theme_color: canvas,
          background_color: canvas,
          icons: [
            { src: '/brand/192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/brand/512x512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          // App shell, JS, CSS, fonts, icons. The hashed WASM is the ephemeris, which works offline.
          globPatterns: [
            '*.html',
            'assets/**/*.{js,css,wasm}',
            'fonts/*.woff2',
            'brand/{180x180,192x192,512x512,natally-still,natally-guide-512}.*',
          ],
          globIgnores: ['200.html', 'souvenir-runtime/**', 'ort/**', 'atelier/**', 'geo/**'],
          maximumFileSizeToCacheInBytes: 32 * 1024 * 1024,
          navigateFallback: 'index.html',
          // /atelier and /atelier/lesson/* are app routes as well as the art's folder: never deny or cache them as pages.
          navigateFallbackDenylist: [/^\/souvenir-runtime\//, /^\/ort\//, /^\/geo\//, /^\/api\//],
          runtimeCaching: [
            {
              urlPattern: ({ url, request }) => request.mode !== 'navigate' && url.pathname.startsWith('/ort/'),
              handler: 'CacheFirst',
              options: { cacheName: `ort-${ortVersion}`, cacheableResponse: { statuses: [200] } },
            },
            {
              urlPattern: ({ url, request }) => request.mode !== 'navigate' && url.pathname.startsWith('/atelier/'),
              handler: 'CacheFirst',
              options: { cacheName: 'atelier', rangeRequests: true, cacheableResponse: { statuses: [200] } },
            },
            {
              urlPattern: ({ url, request }) => request.mode !== 'navigate' && url.pathname.startsWith('/geo/'),
              handler: 'CacheFirst',
              options: { cacheName: 'geo', cacheableResponse: { statuses: [200] } },
            },
          ],
        },
      }),
    ],
  };
});
