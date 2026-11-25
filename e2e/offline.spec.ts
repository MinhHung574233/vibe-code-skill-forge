import { expect, test, type Page } from '@playwright/test';

async function precachedUrlCount(page: Page): Promise<number> {
  return page.evaluate(async () => {
    let total = 0;
    for (const name of await caches.keys())
      total += (await (await caches.open(name)).keys()).length;
    return total;
  });
}

test.describe('offline-first shell', () => {
  test('precaches the app, then loads and navigates with no network', async ({ page, context }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

    // First install: wait for the service worker to activate and finish precaching.
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    await expect.poll(() => precachedUrlCount(page), { timeout: 15_000 }).toBeGreaterThan(10);

    // Reload once so the page is controlled (clientsClaim is off by design).
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

    await page.getByRole('link', { name: 'Skills', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Skills', level: 1 })).toBeVisible();
    await expect(page).toHaveURL(/#\/skills$/);
  });

  test('serves a valid manifest and apple-touch-icon', async ({ page, request }) => {
    await page.goto('/');
    const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(manifestHref).toBeTruthy();
    const manifest = (await (await request.get(`/${manifestHref ?? ''}`)).json()) as {
      display: string;
      start_url: string;
      icons: { sizes: string }[];
    };
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.map((i) => i.sizes)).toEqual(
      expect.arrayContaining(['192x192', '512x512']),
    );

    const touchIcon = await page.locator('link[rel="apple-touch-icon"]').getAttribute('href');
    expect(touchIcon).toBeTruthy();
    const res = await request.get(`/${touchIcon ?? ''}`);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('image/png');
  });
});
