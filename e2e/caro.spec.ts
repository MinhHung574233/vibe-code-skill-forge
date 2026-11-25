import { expect, test, type Page } from '@playwright/test';
import { launchApp } from './helpers';

/**
 * Caro, end to end against the production build: the engine worker under the real CSP, moves and
 * resume across a reload, resigning, and a finished game feeding XP and the record.
 *
 * Needs the module mounted at `#/practice/caro` (route + registry entry added by the app).
 */

const cell = (page: Page, row: number, col: number, state = 'empty') =>
  page.getByRole('button', { name: new RegExp(`^Row ${row}, column ${col}, ${state}`) });

/**
 * Touch devices default to "confirm each move" (a 15x15 cell is ~23 px wide), so a tap only aims
 * and Place stone commits; with a mouse a click places directly. Handle both.
 */
async function placeStone(page: Page, row: number, col: number) {
  await cell(page, row, col).click();
  const confirm = page.getByRole('button', { name: 'Place stone' });
  if (await confirm.isVisible()) await confirm.click();
}

/** Writes the saved game exactly as the app stores it, so a scenario can start mid-game. */
async function seedGame(page: Page, game: { level: string; moves: number[] }) {
  await page.evaluate(
    (seed) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('skillforge');
        open.onerror = () => reject(new Error('open failed'));
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('drafts', 'readwrite');
          tx.objectStore('drafts').put({
            key: 'caro-game',
            value: {
              id: `e2e-caro-${Date.now()}`,
              size: 15,
              level: seed.level,
              humanStone: 1,
              startedAt: Date.now() - 5 * 60_000,
              moves: seed.moves,
              undos: 0,
            },
            updatedAt: Date.now(),
          });
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(new Error('write failed'));
        };
      }),
    game,
  );
}

test('play Caro: worker engine replies, game resumes after reload, resign records nothing', async ({
  page,
}) => {
  // A blocked worker would be hidden by the main-thread fallback; the browser still logs it.
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && /content security policy|worker/i.test(message.text())) {
      problems.push(message.text());
    }
  });

  await launchApp(page);
  await page.goto('/#/practice/caro');
  await expect(page.getByRole('heading', { name: 'Caro', level: 1 })).toBeVisible();
  await expect(page.getByText('No games yet')).toBeVisible();

  await page.getByRole('radio', { name: 'Easy' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.getByRole('grid', { name: 'Caro board, 15 by 15' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Your move.');

  await placeStone(page, 8, 8);
  await expect(cell(page, 8, 8, 'your stone')).toBeVisible();
  await expect(page.getByRole('button', { name: /computer stone/ })).toHaveCount(1);
  await expect(page.getByRole('status')).toHaveText('Your move.');
  // The engine ran in a real Worker (not the main-thread fallback), which the CSP allows.
  expect(page.workers().length).toBeGreaterThan(0);

  // Reload mid-game: the game is still there and can be resumed.
  await page.reload();
  await page.goto('/#/practice/caro');
  await expect(page.getByRole('heading', { name: 'Game in progress' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(cell(page, 8, 8, 'your stone')).toBeVisible();
  await expect(page.getByRole('button', { name: /computer stone/ })).toHaveCount(1);

  // Resign asks first and records nothing.
  await page.getByRole('button', { name: 'Resign' }).click();
  const confirm = page.getByRole('dialog', { name: 'Resign this game?' });
  await confirm.getByRole('button', { name: 'Resign' }).click();
  await expect(page.getByRole('heading', { name: 'Caro', level: 1 })).toBeVisible();
  await expect(page.getByText('Game in progress')).toBeHidden();
  await expect(page.getByText('No games yet')).toBeVisible();

  expect(problems).toEqual([]);
});

test('finishing a game records the result and awards XP once', async ({ page }) => {
  await launchApp(page);
  await page.goto('/#/practice/caro');
  await expect(page.getByRole('heading', { name: 'Caro', level: 1 })).toBeVisible();

  // The person (first player) has four in row 8 and the move; the computer has four in row 9.
  const at = (row: number, col: number) => (row - 1) * 15 + (col - 1);
  await seedGame(page, {
    level: 'hard',
    moves: [1, 2, 3, 4].flatMap((col) => [at(8, col), at(9, col)]),
  });
  await page.goto('/#/practice/caro/play');
  await expect(page.getByRole('grid', { name: 'Caro board, 15 by 15' })).toBeVisible();

  await placeStone(page, 8, 5);
  await expect(page.getByRole('heading', { name: 'You won' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('You win!');
  await expect(cell(page, 8, 5, 'your stone, last move, winning line')).toBeVisible();

  const saved = page.getByRole('dialog', { name: 'Session saved' });
  await expect(saved.getByText('+15 XP')).toBeVisible();
  await saved.getByRole('button', { name: 'Done' }).click();

  // The result is in the record, and Home shows the XP once.
  await page.getByRole('button', { name: 'New game' }).click();
  await expect(page.getByText('100%')).toBeVisible();
  await expect(page.getByText('Hard · 15×15')).toBeVisible();
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: 'Home', level: 1 })).toBeVisible();
  await expect(page.getByText('15 / 100 XP')).toBeVisible();
});
