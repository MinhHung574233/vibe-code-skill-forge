import { expect, test } from '@playwright/test';
import { launchApp, seedSkills } from './helpers';

test('Home shows a skill grid and one tap starts a timer for that skill', async ({ page }) => {
  await launchApp(page);
  await seedSkills(page, ['Rubik', 'Java', 'Chess']);
  await page.reload();

  const grid = page.getByRole('list', { name: 'Your skills' });
  await expect(grid.getByText('Java')).toBeVisible();
  await expect(grid.getByRole('link', { name: /Start timer/ })).toHaveCount(3);

  await grid.getByText('Java').click();
  await expect(page.getByRole('timer', { name: 'Elapsed time' })).toBeVisible();
  await expect(page.getByText('Java', { exact: true })).toBeVisible();

  // a reload keeps the same single running timer
  await page.reload();
  await expect(page.getByRole('timer', { name: 'Elapsed time' })).toBeVisible();
});
