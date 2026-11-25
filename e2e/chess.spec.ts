import { expect, test, type Page } from '@playwright/test';
import { PUZZLES } from '../src/features/chess/domain/puzzles';
import { launchApp } from './helpers';

/*
 * Chess module smoke tests. They need the app to mount ChessModule at `#/practice/chess`.
 * Note: written against the final UI but not yet run, because the route was wired after this file.
 */

const square = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^${name}, `) });

/** Marks every puzzle except `keep` as solved (raw IndexedDB, like the other specs). */
async function solveAllExcept(page: Page, keep: string) {
  const ids = PUZZLES.map((p) => p.id).filter((id) => id !== keep);
  await page.evaluate(
    (puzzleIds) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('skillforge');
        open.onerror = () => reject(new Error('open failed'));
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('puzzleProgress', 'readwrite');
          const store = tx.objectStore('puzzleProgress');
          for (const puzzleId of puzzleIds) {
            store.put({
              puzzleId,
              game: 'chess',
              solved: 1,
              attempts: 1,
              lastAttemptAt: 1,
              solvedAt: 1,
            });
          }
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(new Error('write failed'));
        };
      }),
    ids,
  );
}

test('the module home shows ratings and the three training modes', async ({ page }) => {
  await launchApp(page);
  await page.goto('/#/practice/chess');
  await expect(page.getByRole('heading', { name: 'Chess', level: 1 })).toBeVisible();
  await expect(page.getByText('Puzzle rating')).toBeVisible();
  await expect(page.getByText('Play rating')).toBeVisible();
  await expect(page.getByText(`0/${PUZZLES.length}`)).toBeVisible();
  for (const name of [/Puzzles/, /Play the engine/, /Openings/]) {
    await expect(page.getByRole('link', { name })).toBeVisible();
  }
});

test('solving a puzzle by tapping awards XP once and survives a reload', async ({ page }) => {
  await launchApp(page);
  await solveAllExcept(page, 'm1-arabian');
  await page.goto('/#/practice/chess/puzzles');
  await expect(page.getByText('White to move: find mate in 1')).toBeVisible();

  // a wrong move first: the position does not change and the app says so
  await square(page, 'a7').click();
  await square(page, 'a8').click();
  await expect(page.getByText('That is not the move. Try again.')).toBeVisible();

  await square(page, 'a7').click();
  await square(page, 'h7').click();
  const saved = page.getByRole('dialog', { name: 'Session saved' });
  await expect(saved.getByText('+10 XP')).toBeVisible();
  await saved.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('button', { name: 'Next puzzle' })).toBeVisible();

  await page.goto('/#/practice/chess');
  await page.reload();
  await expect(page.getByText(`${PUZZLES.length}/${PUZZLES.length}`)).toBeVisible();
});

test('the engine answers a move, the game resumes after a reload, and no CSP rule is violated', async ({
  page,
}) => {
  const violations: string[] = [];
  page.on('console', (msg) => {
    if (/Content Security Policy|violates the following/i.test(msg.text()))
      violations.push(msg.text());
  });

  await launchApp(page);
  await page.goto('/#/practice/chess/play');
  await page.getByRole('radio', { name: 'Easy' }).click();
  await page.getByRole('button', { name: 'Start game' }).click();
  await expect(page.getByText('Your move')).toBeVisible();

  await square(page, 'e2').click();
  await square(page, 'e4').click();
  await expect(page.getByRole('list', { name: 'Moves' })).toContainText(/1\. e4 \S+/, {
    timeout: 10_000,
  });

  await page.goto('/#/practice/chess');
  await page.reload();
  await expect(page.getByText('Game in progress')).toBeVisible();
  await page.getByRole('link', { name: 'Resume game' }).click();
  // The Play screen offers the saved game before starting a new one.
  await page.getByRole('button', { name: 'Resume game' }).click();
  await expect(page.getByRole('list', { name: 'Moves' })).toContainText('1. e4');
  expect(violations).toEqual([]);
});

test('an opening can be drilled: wrong moves are refused and the opponent replies', async ({
  page,
}) => {
  await launchApp(page);
  await page.goto('/#/practice/chess/openings');
  await page.getByRole('link', { name: /Italian Game/ }).click();
  await expect(page.getByText(/Your move 1 of/)).toBeVisible();

  await square(page, 'd2').click();
  await square(page, 'd4').click();
  await expect(page.getByText(/not the book move/)).toBeVisible();

  await square(page, 'e2').click();
  await square(page, 'e4').click();
  await expect(page.getByLabel('Moves so far')).toContainText('1. e4 e5');
  await expect(page.getByText(/Your move 2 of/)).toBeVisible();
});
