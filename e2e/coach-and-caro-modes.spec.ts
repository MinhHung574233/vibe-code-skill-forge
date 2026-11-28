import { expect, test, type Page } from '@playwright/test';
import { launchApp } from './helpers';

const square = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^${name}, `) });

test('Chess coach mode rates your move and the engine still replies', async ({ page }) => {
  await launchApp(page);
  await page.goto('/#/practice/chess/play');
  await page.getByRole('radio', { name: 'Easy' }).click();
  await page.getByRole('checkbox', { name: /Coach mode/ }).check();
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.getByText('Your move')).toBeVisible();

  await square(page, 'e2').click();
  await square(page, 'e4').click();

  // the coach card names a grade in words (not colour only) and the engine then answers
  const card = page
    .locator('[aria-live="polite"]')
    .filter({ hasText: /Best|Good|Inaccuracy|Mistake|Blunder/ });
  await expect(card.first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('list', { name: 'Moves' })).toContainText(/1\. e4 \S+/, {
    timeout: 15_000,
  });
  await expect(page.getByRole('button', { name: 'Show me a good move' })).toBeVisible();
});

test('Caro Tournament preset starts a 19x19 game with three blocked squares', async ({ page }) => {
  await launchApp(page);
  await page.goto('/#/practice/caro');
  await page.getByRole('radio', { name: /Tournament/ }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  const grid = page.getByRole('grid');
  await expect(grid).toBeVisible();
  await expect(grid.getByRole('button')).toHaveCount(19 * 19 - 3);
  await expect(page.getByLabel('blocked square')).toHaveCount(3);
});

test('the Caro handbook opens from the module home and shows a chapter', async ({ page }) => {
  await launchApp(page);
  await page.goto('/#/practice/caro');
  await page.getByText('Caro handbook').click();
  await expect(page.getByRole('heading', { name: 'Caro handbook', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: /Rule variants/ }).click();
  await expect(page.getByRole('img').first()).toBeVisible();
});
