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

/** Modules that open from Practice (the rest still say "Coming soon"). */
const BUILT_MODULES = ['Rubik’s Cube', 'English'];

async function goTab(page: Page, name: string) {
  await page.getByRole('link', { name, exact: true }).click();
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
}

test('Home for a new user is an honest empty dashboard', async ({ page }) => {
  await launchApp(page);
  const today = page.getByRole('region', { name: 'Today' });
  await expect(today.getByText('0/20')).toBeVisible();
  await expect(today.getByText(/No training yet/)).toBeVisible();
  await expect(page.getByText('No streak yet')).toBeVisible();
  await expect(page.getByText('Add your first skill')).toBeVisible();
  await expect(page.getByText('No activity yet')).toBeVisible();
});

test('Practice lets you train today and lists all seven modules as coming soon', async ({
  page,
}) => {
  await launchApp(page);
  await goTab(page, 'Practice');
  const train = page.getByRole('region', { name: 'Train' });
  await expect(train.getByRole('link', { name: 'Start a session' })).toBeVisible();
  await expect(train.getByRole('button', { name: 'Log a session' })).toBeVisible();
  for (const title of MODULE_TITLES)
    await expect(page.getByText(title, { exact: true })).toBeVisible();
  await expect(page.getByText('Coming soon')).toHaveCount(
    MODULE_TITLES.length - BUILT_MODULES.length,
  );
  for (const title of BUILT_MODULES)
    await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible();
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

test('every tappable control on every tab is at least 44px tall', async ({ page }) => {
  await launchApp(page);
  const tooSmall: string[] = [];
  for (const tab of ['Home', 'Skills', 'Practice', 'Progress', 'Settings']) {
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
  test(`all tabs render in ${scheme} mode without horizontal overflow`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await launchApp(page);
    for (const tab of ['Home', 'Skills', 'Practice', 'Progress', 'Settings']) {
      await goTab(page, tab);
      const overflow = await page.evaluate(() => {
        const main = document.querySelector('main');
        return main ? main.scrollWidth - main.clientWidth : 0;
      });
      expect(overflow, `${tab} overflows horizontally`).toBeLessThanOrEqual(0);
    }
  });
}
