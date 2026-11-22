import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

export default defineConfig({
  // Relative base so the same build works at a domain root or under a sub-path
  // (e.g. github.io/<repo>/). Routing uses HashRouter, so no host rewrite rules are needed.
  base: process.env.VITE_BASE ?? './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt': a new service worker waits until the user accepts the update,
      // so code is never swapped under a running timer or game.
      registerType: 'prompt',
      injectRegister: false,
      pwaAssets: { config: true },
      manifest: {
        name: 'SkillForge',
        short_name: 'SkillForge',
        description: 'Personal growth and training hub. Works fully offline.',
        lang: 'en',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#4F46E5',
        theme_color: '#0B0D12',
        categories: ['education', 'productivity'],
      },
      // Own worker (src/sw.ts) so the page can ask which precached files are missing and repair
      // them (iOS can evict Cache Storage independently of IndexedDB). It never activates an
      // update by itself: the page sends SKIP_WAITING after the user agrees.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        // Do not glob the manifest: vite-plugin-pwa adds it itself, and a duplicate entry with a
        // different revision makes Workbox throw add-to-cache-list-conflicting-entries, which
        // silently disables precaching.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff2,json}'],
        rollupFormat: 'iife',
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    target: 'safari16',
    sourcemap: false,
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
});
