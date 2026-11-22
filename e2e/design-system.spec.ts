import { expect, test, type Page } from '@playwright/test';

const GALLERY = '/#/dev/components';

async function openGallery(page: Page, colorScheme: 'light' | 'dark') {
  await page.emulateMedia({ colorScheme });
  await page.goto(GALLERY);
  await expect(page.getByRole('heading', { name: 'Components', level: 1 })).toBeVisible();
}

for (const scheme of ['light', 'dark'] as const) {
  test(`gallery renders in ${scheme} mode without horizontal overflow`, async ({ page }) => {
    await openGallery(page, scheme);

    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe(scheme === 'light' ? 'rgb(242, 243, 247)' : 'rgb(11, 13, 18)');

    const overflow = await page.evaluate(() => {
      const main = document.querySelector('main');
      return {
        page: document.documentElement.scrollWidth - window.innerWidth,
        main: main ? main.scrollWidth - main.clientWidth : 0,
      };
    });
    expect(overflow.page).toBeLessThanOrEqual(0);
    expect(overflow.main).toBeLessThanOrEqual(0);

    // Full-length capture of the scrolling container for visual review (not a baseline diff).
    await page.addStyleTag({
      content: 'main{overflow:visible!important} .fixed{position:static!important}',
    });
    await page.screenshot({ path: `test-results/gallery-${scheme}.png`, fullPage: true });
  });
}

test('interactive controls meet the 44px touch-target minimum', async ({ page }) => {
  await openGallery(page, 'light');
  // Chips have a 32px visual pill with an invisible 44px hit area, so they are excluded here.
  const controls = page.locator('button:not([aria-pressed]), a[href], [role="radio"]');
  const count = await controls.count();
  expect(count).toBeGreaterThan(10);
  const tooSmall: string[] = [];
  for (let i = 0; i < count; i++) {
    const el = controls.nth(i);
    if (!(await el.isVisible())) continue;
    const box = await el.boundingBox();
    if (box && box.height < 43.5) {
      tooSmall.push(`${(await el.innerText()).trim() || 'icon'} (${Math.round(box.height)}px)`);
    }
  }
  expect(tooSmall).toEqual([]);
});

test('theme override applies, persists across reload, and system restores', async ({ page }) => {
  await openGallery(page, 'light');
  const html = page.locator('html');

  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(11, 13, 18)'); // dark even though the OS scheme is light

  await page.getByRole('radio', { name: 'System' }).click();
  await expect(html).not.toHaveAttribute('data-theme', /.+/);
});

test('bottom sheet opens and closes via Escape, scrim tap and drag', async ({ page }) => {
  await openGallery(page, 'light');
  const open = page.getByRole('button', { name: 'Open bottom sheet' });
  const sheet = page.getByRole('dialog', { name: 'Session complete' });

  await open.click();
  await expect(sheet).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();

  await open.click();
  await expect(sheet).toBeVisible();
  await page.mouse.click(195, 40); // scrim, above the sheet
  await expect(sheet).toBeHidden();

  await open.click();
  await expect(sheet).toBeVisible();
  // Let the slide-in animation finish so the handle is where we measure it.
  await expect.poll(() => sheet.evaluate((el) => el.getAnimations().length)).toBe(0);
  const handle = await sheet.locator('div.touch-none').boundingBox();
  if (!handle) throw new Error('sheet drag handle not found');
  const x = handle.x + handle.width / 2;
  const y = handle.y + handle.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + 60, { steps: 4 });
  await page.mouse.move(x, y + 220, { steps: 6 });
  await page.mouse.up();
  await expect(sheet).toBeHidden();
});

test('large title collapses into the compact bar on scroll', async ({ page }) => {
  await openGallery(page, 'light');
  const bar = page.locator('[data-collapsed]').first();
  await expect(bar).toHaveAttribute('data-collapsed', 'false');
  await page.locator('main').evaluate((el) => el.scrollTo(0, 600));
  await expect(bar).toHaveAttribute('data-collapsed', 'true');
  await page.locator('main').evaluate((el) => el.scrollTo(0, 0));
  await expect(bar).toHaveAttribute('data-collapsed', 'false');
});

test('gallery works offline after the first visit (lazy chunk is precached)', async ({
  page,
  context,
}) => {
  await openGallery(page, 'light');
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Components', level: 1 })).toBeVisible();
});
