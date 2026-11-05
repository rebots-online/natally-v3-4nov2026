import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The frozen atelier page (§14.6): relative paths, its own folder, no public files, no configuration.
export default defineConfig({
  base: './',
  publicDir: false,
  envDir: '.generated',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist-web/souvenir-runtime',
    emptyOutDir: true,
    rolldownOptions: { input: 'souvenir.html' },
  },
});
