import { expect, test, type Page } from '@playwright/test';
import { launchApp } from './helpers';

/**
 * Go module end to end. These run against the real build, so the AI runs in its Web Worker.
 * They need the route `#/practice/go` to be wired by the app (not part of the module itself).
 */

const OPENINGS = ['E5', 'C3', 'G7', 'C7', 'G3', 'E3', 'E7', 'C5', 'G5', 'E1', 'E9'];

async function openGo(page: Page) {
  await launchApp(page);
  await page.goto('/#/practice/go');
  await expect(page.getByRole('heading', { name: 'Go', level: 1 })).toBeVisible();
}

async function startNineByNine(page: Page) {
  await page.getByRole('radio', { name: '9×9' }).click();
  await page.getByRole('radio', { name: 'Easy' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.getByRole('group', { name: '9 by 9 Go board' })).toBeVisible();
}

/** Plays the first free opening point once the computer has answered. */
async function humanMove(page: Page) {
  await expect(page.getByText(/Your turn/)).toBeVisible({ timeout: 20_000 });
  for (const name of OPENINGS) {
    const point = page.getByRole('button', { name: `${name}, empty` });
    if (!(await point.count())) continue;
    await point.click();
    // A rejected move (suicide, ko) leaves the point empty; then try the next point.
    const placed = await expect(point)
      .toHaveCount(0, { timeout: 2_000 })
      .then(() => true)
      .catch(() => false);
    if (placed) return;
  }
  throw new Error('no free opening point left');
}

test.describe('Go', () => {
  test('plays a game against the engine and survives a reload', async ({ page }) => {
    test.setTimeout(60_000);
    await openGo(page);
    await startNineByNine(page);

    await humanMove(page);
    await humanMove(page);
    await expect(page.getByText(/Your turn/)).toBeVisible({ timeout: 20_000 });

    await page.reload();
    await page.goto('/#/practice/go');
    await expect(page.getByRole('link', { name: 'Resume game' })).toBeVisible();
    await page.getByRole('link', { name: 'Resume game' }).click();
    await expect(page.getByText('1. Black E5')).toBeAttached();
  });

  test('passes to the scoring screen, marks stones and records the result', async ({ page }) => {
    test.setTimeout(120_000);
    await openGo(page);
    await startNineByNine(page);

    for (let i = 0; i < 5; i++) await humanMove(page);

    // keep passing until the computer also passes (it does once nothing sensible is left)
    const scoring = page.getByRole('region', { name: 'Scoring' });
    for (let i = 0; i < 60 && !(await scoring.isVisible()); i++) {
      const pass = page.getByRole('button', { name: 'Pass', exact: true });
      await expect(pass)
        .toBeEnabled({ timeout: 20_000 })
        .catch(() => undefined);
      if (await pass.isEnabled()) await pass.click();
    }
    await expect(scoring).toBeVisible();

    await scoring.getByRole('button', { name: 'Auto-mark dead stones (estimate)' }).click();
    await scoring.getByRole('button', { name: 'Accept result' }).click();

    const result = page.getByRole('dialog', { name: /^(You won|You lost|Draw)$/ });
    await expect(result).toBeVisible();
    await result.getByRole('button', { name: 'Continue' }).click();
    const saved = page.getByRole('dialog', { name: 'Session saved' });
    await expect(saved).toBeVisible();
    await saved.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('heading', { name: 'Go', level: 1 })).toBeVisible();
    await expect(page.getByText('Recent games')).toBeVisible();
  });

  test('solves a tsumego problem and gets the tick', async ({ page }) => {
    await openGo(page);
    await page.getByRole('link', { name: /Life-and-death problems/ }).click();
    await page.getByRole('link', { name: /Straight three: kill/ }).click();

    await page.getByRole('button', { name: 'column 3, row 1, empty' }).click(); // the end: wrong
    await expect(page.getByText('Not this move')).toBeVisible();
    await page.getByRole('button', { name: 'Try again' }).click();
    await page.getByRole('button', { name: 'column 4, row 1, empty' }).click(); // the vital point
    await expect(page.getByText('Correct!')).toBeVisible();

    const saved = page.getByRole('dialog', { name: 'Session saved' });
    await expect(saved).toBeVisible();
    await saved.getByRole('button', { name: 'Done' }).click();

    await page.getByRole('link', { name: 'Back to Problems' }).click();
    const row = page.getByRole('link', { name: /Straight three: kill/ });
    await expect(row.getByRole('img', { name: 'Solved' })).toBeVisible();
  });
});
