import { expect, test } from '@playwright/test';
import { launchApp, seedSkills } from './helpers';

/**
 * Production headers (public/_headers). Locally they are applied by the preview plugin in
 * vite.config.ts; against a deployed site (E2E_BASE_URL) they come from the host itself, so the
 * same tests check what is really being served.
 */
test('serves security headers and sensible cache policy', async ({ request }) => {
  const home = await request.get('/');
  const h = home.headers();
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['referrer-policy']).toBe('no-referrer');
  expect(h['strict-transport-security']).toMatch(/max-age=\d+/);
  expect(h['content-security-policy']).toContain("script-src 'self'");
  expect(h['content-security-policy']).not.toMatch(/script-src[^;]*unsafe-inline/);
  expect(h['cache-control']).toMatch(/no-cache|max-age=0/);

  const sw = await request.get('/sw.js');
  expect(sw.headers()['cache-control']).toMatch(/no-cache|max-age=0/);

  const html = await home.text();
  const asset = /assets\/index-[A-Za-z0-9_-]+\.js/.exec(html)?.[0];
  expect(asset).toBeTruthy();
  const js = await request.get(`/${asset ?? ''}`);
  expect(js.headers()['cache-control']).toMatch(/immutable/);
  expect(js.headers()['content-type']).toContain('javascript');
});

test('the app works end to end under the Content-Security-Policy (no violations)', async ({
  page,
}) => {
  const violations: string[] = [];
  const errors: string[] = [];
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      (window as unknown as { __csp: string[] }).__csp.push(
        `${e.violatedDirective} blocked ${e.blockedURI}`,
      );
    });
  });
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));

  await launchApp(page);
  await seedSkills(page, ['CSP check']);
  await page.reload();

  // Tour the features most likely to trip a CSP: theme script, sheets, blob download, workers.
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: 'Dark' }).click();
  await page.getByRole('button', { name: 'Back up my data' }).click();
  const sheet = page.getByRole('dialog', { name: 'Back up your data' });
  const downloadPromise = page.waitForEvent('download');
  await sheet.getByRole('button', { name: 'Download file' }).click();
  await downloadPromise;
  await page.keyboard.press('Escape');
  await page.getByRole('radio', { name: 'System' }).click();
  await page.goto('/#/dev/components');
  await page.getByRole('button', { name: 'Open bottom sheet' }).click();
  await page.keyboard.press('Escape');

  violations.push(...(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)));
  expect(violations).toEqual([]);
  expect(errors).toEqual([]);
});

test('the theme script is an external file, so no inline script exists', async ({ page }) => {
  await page.goto('/');
  const inlineScripts = await page.evaluate(
    () => Array.from(document.scripts).filter((s) => !s.src && s.textContent?.trim()).length,
  );
  expect(inlineScripts).toBe(0);
});
