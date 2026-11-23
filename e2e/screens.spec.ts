import { expect, test, type Page } from '@playwright/test';
import { launchApp } from './helpers';

const MODULE_TITLES = [
  'Rubik’s Cube',
  'English',
  'Java & Spring Boot',
  'Developer Tools',
  'Caro',
  'Chess',
  'Go',
];

async function goTab(page: Page, name: string) {
  await page.getByRole('link', { name, exact: true }).click();
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
}

test('Home shows today’s goal and honest empty states', async ({ page }) => {
  await launchApp(page);
  const today = page.getByRole('region', { name: 'Today' });
  await expect(today.getByText('0/20')).toBeVisible();
  await expect(today.getByText(/No training recorded yet/)).toBeVisible();
  await expect(page.getByText('Nothing recommended yet')).toBeVisible();
  await expect(page.getByText('No activity yet')).toBeVisible();
  // Nothing invented: no streak or XP figures before a training engine exists.
  await expect(page.getByText(/streak/i)).toHaveCount(0);
});

test('Practice lists all seven modules as coming soon', async ({ page }) => {
  await launchApp(page);
  await page.getByRole('link', { name: 'Browse practice' }).click();
  await expect(page.getByRole('heading', { name: 'Practice', level: 1 })).toBeVisible();
  for (const title of MODULE_TITLES)
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  await expect(page.getByText('Coming soon')).toHaveCount(7);
});

test('the daily goal set in Settings persists and shows on Home', async ({ page }) => {
  await launchApp(page);
  await goTab(page, 'Settings');
  await expect(page.getByText('20 min', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Increase daily goal' }).click();
  await page.getByRole('button', { name: 'Increase daily goal' }).click();
  await expect(page.getByText('30 min', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText('30 min', { exact: true })).toBeVisible();
  await goTab(page, 'Home');
  await expect(page.getByText('0/30')).toBeVisible();
});

test('every tappable control on Home, Practice and Settings is at least 44px tall', async ({
  page,
}) => {
  await launchApp(page);
  const tooSmall: string[] = [];
  for (const tab of ['Home', 'Practice', 'Settings']) {
    await goTab(page, tab);
    const controls = page.locator('button:not([aria-pressed]), a[href], [role="radio"]');
    const count = await controls.count();
    for (let i = 0; i < count; i++) {
      const el = controls.nth(i);
      if (!(await el.isVisible())) continue;
      const box = await el.boundingBox();
      if (box && box.height < 43.5) {
        const name = (
          (await el.innerText()) ||
          (await el.getAttribute('aria-label')) ||
          'icon'
        ).trim();
        tooSmall.push(`${tab}: ${name} (${Math.round(box.height)}px)`);
      }
    }
  }
  expect(tooSmall).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`main screens render in ${scheme} mode without horizontal overflow`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await launchApp(page);
    for (const tab of ['Home', 'Practice', 'Settings']) {
      await goTab(page, tab);
      const overflow = await page.evaluate(() => {
        const main = document.querySelector('main');
        return main ? main.scrollWidth - main.clientWidth : 0;
      });
      expect(overflow, `${tab} overflows horizontally`).toBeLessThanOrEqual(0);
      await page.addStyleTag({
        content: 'main{overflow:visible!important} .fixed{position:static!important}',
      });
      await page.screenshot({
        path: `test-results/screen-${tab.toLowerCase()}-${scheme}.png`,
        fullPage: true,
      });
    }
  });
}
