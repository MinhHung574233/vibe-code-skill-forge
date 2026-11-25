import { expect, test, type Page } from '@playwright/test';
import { launchApp } from './helpers';

async function openModule(page: Page, hash: string, heading: string) {
  await page.goto(`/#/${hash}`);
  await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible();
}

/** One solve through the real keyboard protocol: hold until ready, release to start, press to stop. */
async function solveWithKeyboard(page: Page) {
  const pad = page.getByRole('button', { name: /Cube timer/ });
  await pad.focus();
  await page.keyboard.down('Space');
  await page.waitForTimeout(450);
  await page.keyboard.up('Space');
  await page.waitForTimeout(150);
  await page.keyboard.down('Space');
  await page.keyboard.up('Space');
}

test('Practice opens the four built modules', async ({ page }) => {
  await launchApp(page);
  await page.getByRole('link', { name: 'Practice', exact: true }).click();
  for (const title of ['Rubik’s Cube', 'English', 'Java & Spring Boot', 'Developer Tools']) {
    await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible();
  }
});

test('Rubik: time a solve, keep it after reload, finish the session for XP', async ({ page }) => {
  await launchApp(page);
  await openModule(page, 'practice/rubik', 'Rubik’s Cube');
  await expect(page.getByLabel('Scramble moves')).toContainText(/[UDLRFB]/);

  await solveWithKeyboard(page);
  await expect(page.getByLabel('Last solve result')).toHaveText(/\d+\.\d\d/);
  await page.getByRole('button', { name: 'DNF' }).click();
  await expect(page.getByLabel('Last solve result')).toHaveText('DNF');
  await page.getByRole('button', { name: 'DNF' }).click(); // toggle off again
  await expect(page.getByLabel('Last solve result')).toHaveText(/\d+\.\d\d/);

  await page.reload();
  await expect(page.getByLabel('Last solve result')).toHaveText(/\d+\.\d\d/);
  await expect(page.getByText('1 this session')).toBeVisible();

  await page.getByRole('button', { name: 'Finish session' }).click();
  const sheet = page.getByRole('dialog', { name: 'Session saved' });
  await expect(sheet.getByText('+15 XP')).toBeVisible();
  await sheet.getByRole('button', { name: 'Done' }).click();

  await page.getByRole('link', { name: /Algorithms/ }).click();
  await expect(page.getByRole('heading', { name: 'Algorithms', level: 1 })).toBeVisible();
  await expect(page.getByText('T perm')).toBeVisible();
  await page.getByRole('button', { name: 'Learned' }).first().click();
  await expect(page.getByText('1 of 21 learned.', { exact: false })).toBeVisible();
});

test('English: study a card, grade it, save the session', async ({ page }) => {
  await launchApp(page);
  await openModule(page, 'practice/english', 'English');
  await expect(page.getByText('0 to review, 10 new words.')).toBeVisible();
  await page.getByRole('link', { name: 'Start review' }).click();

  await expect(page.getByRole('heading', { name: 'algorithm', level: 2 })).toBeVisible();
  await page.getByRole('button', { name: 'Show answer' }).click();
  await expect(page.getByText('thuật toán')).toBeVisible();
  await page.getByRole('button', { name: /^Good/ }).click();
  await expect(page.getByRole('heading', { name: 'variable', level: 2 })).toBeVisible();

  await page.getByRole('button', { name: 'End session' }).click();
  await page.getByRole('button', { name: 'Save session' }).click();
  const sheet = page.getByRole('dialog', { name: 'Session saved' });
  await expect(sheet.getByText('+20 XP')).toBeVisible();
  await sheet.getByRole('button', { name: 'Done' }).click();

  // The studied word is scheduled for tomorrow, so only new words remain today.
  await expect(page.getByRole('heading', { name: 'English', level: 1 })).toBeVisible();
  await expect(page.getByText('0 to review, 9 new words.')).toBeVisible();
});

test('Java: fail a quiz, learn from the answers, pass it, and the lesson stays done', async ({
  page,
}) => {
  await launchApp(page);
  await openModule(page, 'practice/java/path/java-core', 'Java core');
  await page.getByRole('link', { name: /1\. Classes, interfaces and records/ }).click();
  await page.getByRole('button', { name: 'Take the quiz' }).click();

  // First attempt: pick the first option everywhere, then read the right answers off the result.
  for (let q = 1; q <= 3; q++) {
    const group = page.getByRole('radiogroup', { name: new RegExp(`^${q}\\. `) });
    await group.getByRole('radio').first().click();
  }
  await page.getByRole('button', { name: 'Check answers' }).click();
  await expect(page.getByText(/of 3 correct/)).toBeVisible();

  const passedFirstTry = await page.getByText('Lesson complete.').isVisible();
  if (!passedFirstTry) {
    const correctIndexes: number[] = [];
    for (let q = 1; q <= 3; q++) {
      const group = page.getByRole('radiogroup', { name: new RegExp(`^${q}\\. `) });
      const radios = group.getByRole('radio');
      const count = await radios.count();
      for (let i = 0; i < count; i++) {
        if (await radios.nth(i).getByText('Correct', { exact: true }).count())
          correctIndexes.push(i);
      }
    }
    expect(correctIndexes).toHaveLength(3);
    await page.getByRole('button', { name: 'Try the quiz again' }).click();
    for (let q = 1; q <= 3; q++) {
      const group = page.getByRole('radiogroup', { name: new RegExp(`^${q}\\. `) });
      await group
        .getByRole('radio')
        .nth(correctIndexes[q - 1] as number)
        .click();
    }
    await page.getByRole('button', { name: 'Check answers' }).click();
  }

  await expect(page.getByText('3 of 3 correct')).toBeVisible();
  const sheet = page.getByRole('dialog', { name: 'Session saved' });
  await expect(sheet.getByText('+30 XP')).toBeVisible();
  await sheet.getByRole('button', { name: 'Done' }).click();

  await page.goto('/#/practice/java/path/java-core');
  await expect(page.getByRole('heading', { name: 'Java core', level: 1 })).toBeVisible();
  await expect(page.getByText('Done', { exact: true })).toHaveCount(1);
});

test('Developer Tools shows the daily tip', async ({ page }) => {
  await launchApp(page);
  await openModule(page, 'practice/tools', 'Developer Tools');
  await expect(page.getByRole('region', { name: /Daily developer tip/ })).toBeVisible();
  await page.getByRole('link', { name: /Browse all \d+ tips/ }).click();
  await expect(page.getByRole('heading', { name: 'Tips', level: 1 })).toBeVisible();
});

test('all four modules work offline (their code is precached)', async ({ page, context }) => {
  await launchApp(page);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();

  await openModule(page, 'practice/rubik', 'Rubik’s Cube');
  await expect(page.getByRole('button', { name: /Cube timer/ })).toBeVisible();
  await openModule(page, 'practice/english', 'English');
  await openModule(page, 'practice/java', 'Java & Spring Boot');
  await openModule(page, 'practice/tools', 'Developer Tools');
  await expect(page.getByRole('region', { name: /Daily developer tip/ })).toBeVisible();
});
