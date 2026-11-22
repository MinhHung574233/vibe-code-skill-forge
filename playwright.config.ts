import { defineConfig } from '@playwright/test';

/**
 * E2E smoke tests run against the production build served by `vite preview`.
 *
 * Projects:
 *  - edge-mobile: installed Microsoft Edge (Chromium) with an iPhone-sized touch viewport.
 *    Needs no browser download; used for offline / service-worker behaviour.
 *  - webkit-iphone (opt-in, `E2E_WEBKIT=1`): Playwright WebKit with an iPhone profile, the
 *    closest automated proxy for iOS Safari. Requires `npx playwright install webkit`.
 *
 * Neither replaces the real-iPhone checklist in docs/IOS_PWA.md.
 */
const useWebkit = process.env.E2E_WEBKIT === '1';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: useWebkit
    ? [
        {
          name: 'webkit-iphone',
          use: {
            browserName: 'webkit',
            viewport: { width: 390, height: 844 },
            isMobile: true,
            hasTouch: true,
          },
        },
      ]
    : [
        {
          name: 'edge-mobile',
          use: {
            browserName: 'chromium',
            channel: 'msedge',
            viewport: { width: 390, height: 844 },
            isMobile: true,
            hasTouch: true,
          },
        },
      ],
});
