import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { launchApp } from './helpers';

/** `YYYY-MM-DD` for n days ago on this machine (the browser runs in the same timezone). */
function localDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function goTab(page: Page, name: string) {
  await page.getByRole('link', { name, exact: true }).click();
  await expect(page.getByRole('heading', { name, level: 1 })).toBeVisible();
}

async function logSession(
  page: Page,
  options: { skill?: string; minutes: number; daysAgo?: number; notes?: string },
) {
  await goTab(page, 'Practice');
  await page.getByRole('button', { name: 'Log a session' }).click();
  const form = page.getByRole('dialog', { name: 'Log a session' });
  if (options.skill) {
    await expect(form.getByRole('option', { name: options.skill })).toBeAttached();
    await form.getByLabel('Skill').selectOption({ label: options.skill });
  }
  await form.getByLabel('Minutes').fill(String(options.minutes));
  if (options.daysAgo) await form.getByLabel('Day').fill(localDate(options.daysAgo));
  if (options.notes) await form.getByLabel('Notes').fill(options.notes);
  await form.getByRole('button', { name: 'Save session' }).click();
  const saved = page.getByRole('dialog', { name: 'Session saved' });
  await expect(saved).toBeVisible();
  await saved.getByRole('button', { name: 'Done' }).click();
  await expect(saved).toBeHidden();
}

async function addSuggestedSkills(page: Page) {
  await goTab(page, 'Skills');
  await page.getByRole('button', { name: 'Add the 7 suggested skills' }).click();
  await expect(page.getByText('Java & Spring Boot')).toBeVisible();
}

/** Seeds a running timer the way the app stores it, then reloads so the screen resumes it. */
async function seedRunningTimer(page: Page, minutesAgo: number) {
  await page.evaluate(
    (ago) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('skillforge');
        open.onerror = () => reject(new Error('open failed'));
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('drafts', 'readwrite');
          tx.objectStore('drafts').put({
            key: 'session',
            value: { sessionId: `e2e-timer-${Date.now()}`, startedAt: Date.now() - ago * 60_000 },
            updatedAt: Date.now(),
          });
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
        };
      }),
    minutesAgo,
  );
}

test('a full training journey: skills, goals, logging, timer, Home, Progress', async ({ page }) => {
  await launchApp(page);

  // Skills: add the suggested set, give Rubik a weekly goal.
  await addSuggestedSkills(page);
  await page.getByRole('link', { name: /Rubik’s Cube/ }).click();
  await page.getByRole('button', { name: 'Edit' }).click();
  const edit = page.getByRole('dialog', { name: 'Edit skill' });
  await edit.getByLabel('Weekly goal (minutes)').fill('120');
  await edit.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByText('Goal 2 h a week')).toBeVisible();

  // Log training by hand for today and past days.
  await logSession(page, { skill: 'Rubik’s Cube', minutes: 45, notes: 'F2L drills' });
  await logSession(page, { skill: 'Rubik’s Cube', minutes: 30, daysAgo: 1 });
  await logSession(page, { skill: 'English', minutes: 20, daysAgo: 2 });

  // Home: real numbers, a 3-day streak, the goal reached, recent activity with the note.
  await goTab(page, 'Home');
  await expect(page.getByRole('region', { name: 'Today' }).getByText('45/20')).toBeVisible();
  await expect(page.getByText('3-day streak')).toBeVisible();
  await expect(page.getByText(/Goal reached/)).toBeVisible();
  await expect(page.getByText('F2L drills')).toBeVisible();
  await expect(page.getByText(/1 h 15 min \/ 2 h this week/)).toBeVisible();

  // A timed session (seeded as already running for 6 minutes) earns XP exactly once.
  await goTab(page, 'Practice');
  await seedRunningTimer(page, 6);
  await page.reload();
  await page.getByRole('link', { name: 'Start a session' }).click();
  await expect(page.getByRole('timer', { name: 'Elapsed time' })).toHaveText(/^06:/);
  await page.getByRole('button', { name: 'Finish and save' }).click();
  const saved = page.getByRole('dialog', { name: 'Session saved' });
  await expect(saved.getByText('+10 XP')).toBeVisible();
  await saved.getByRole('button', { name: 'Done' }).click();

  await expect(page.getByRole('heading', { name: 'Home', level: 1 })).toBeVisible();
  await expect(page.getByText('10 / 100 XP')).toBeVisible();

  // Progress: totals, consistency, time by skill, achievements and history.
  await goTab(page, 'Progress');
  await expect(page.getByText(/trained on 3 of 7 days/)).toBeVisible();
  await expect(page.getByText('Consistency 43%')).toBeVisible();
  const donut = page.getByLabel('Time by skill');
  await expect(donut.getByText('Rubik’s Cube')).toBeVisible();
  await expect(donut.getByText('English')).toBeVisible();
  await expect(page.getByText(/^Unlocked /).first()).toBeVisible();
  await page.getByRole('radio', { name: '30 days' }).click();
  await expect(page.getByText(/over the last 30 days/)).toBeVisible();

  // Everything survives a reload (stored in IndexedDB).
  await page.reload();
  await expect(page.getByText(/over the last 30 days|over the last 7 days/)).toBeVisible();
  await goTab(page, 'Home');
  await expect(page.getByText('3-day streak')).toBeVisible();
});

test('training data is part of a backup and restores to the same Home numbers', async ({
  page,
}) => {
  await launchApp(page);
  await addSuggestedSkills(page);
  await logSession(page, { skill: 'Chess', minutes: 25 });
  await logSession(page, { skill: 'Chess', minutes: 15, daysAgo: 1 });

  await goTab(page, 'Settings');
  await page.getByRole('button', { name: 'Back up my data' }).click();
  const sheet = page.getByRole('dialog', { name: 'Back up your data' });
  const downloadPromise = page.waitForEvent('download');
  await sheet.getByRole('button', { name: 'Download file' }).click();
  const path = await (await downloadPromise).path();
  await page.keyboard.press('Escape');

  const backup = JSON.parse(readFileSync(path, 'utf8')) as {
    schemaVersion: number;
    checksum: string;
    tables: Record<string, unknown[]>;
  };
  expect(backup.schemaVersion).toBe(3);
  expect(backup.checksum).toMatch(/^[0-9a-f]{64}$/);
  expect(backup.tables.sessions).toHaveLength(2);
  expect(backup.tables.completions).toHaveLength(2);
  expect(backup.tables.dailySummary).toHaveLength(2);
  expect(backup.tables.achievements?.length).toBeGreaterThanOrEqual(1);
  expect(backup.tables.skills).toHaveLength(7);

  // Wipe, then restore: the same streak, minutes and history come back.
  const reloadedAfterErase = page.waitForEvent('load');
  await page.getByRole('button', { name: 'Erase all data on this device' }).click();
  await page
    .getByRole('dialog', { name: 'Erase all data?' })
    .getByRole('button', { name: 'Erase everything' })
    .click();
  await reloadedAfterErase;
  await goTab(page, 'Home');
  await expect(page.getByText('No streak yet')).toBeVisible();

  await goTab(page, 'Settings');
  await page.getByTestId('backup-file-input').setInputFiles(path);
  const preview = page.getByRole('dialog', { name: 'Restore this backup?' });
  await expect(preview.getByText('Sessions')).toBeVisible();
  await preview.getByRole('button', { name: 'Replace my data' }).click();
  const reloadedAfterRestore = page.waitForEvent('load');
  await page
    .getByRole('dialog', { name: 'Replace all data on this device?' })
    .getByRole('button', { name: 'Replace' })
    .click();
  await reloadedAfterRestore;

  await goTab(page, 'Home');
  await expect(page.getByText('2-day streak')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Today' }).getByText('25/20')).toBeVisible();
});

test('the streak rule setting changes what counts', async ({ page }) => {
  await launchApp(page);
  await logSession(page, { minutes: 10 }); // below the 20-minute goal
  await goTab(page, 'Home');
  await expect(page.getByText('1-day streak')).toBeVisible();

  await goTab(page, 'Settings');
  await page.getByRole('radio', { name: 'Goal reached' }).click();
  await goTab(page, 'Home');
  await expect(page.getByText('No streak yet')).toBeVisible(); // 10 min < 20 min goal
});

test('training screens work offline', async ({ page, context }) => {
  await launchApp(page);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await context.setOffline(true);
  await page.reload();

  await addSuggestedSkills(page);
  await logSession(page, { skill: 'Go', minutes: 20 });
  await goTab(page, 'Progress');
  await expect(page.getByText(/trained on 1 of 7 days/)).toBeVisible();
});

for (const scheme of ['light', 'dark'] as const) {
  test(`screenshots of the populated app in ${scheme} mode`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await launchApp(page);
    await addSuggestedSkills(page);
    await goTab(page, 'Skills');
    await page.getByRole('link', { name: /Java & Spring Boot/ }).click();
    await page.getByRole('button', { name: 'Edit' }).click();
    await page
      .getByRole('dialog', { name: 'Edit skill' })
      .getByLabel('Weekly goal (minutes)')
      .fill('180');
    await page
      .getByRole('dialog', { name: 'Edit skill' })
      .getByRole('button', { name: 'Save changes' })
      .click();
    const plan = [
      { skill: 'Java & Spring Boot', minutes: 50, daysAgo: 0, notes: 'Streams and collectors' },
      { skill: 'English', minutes: 25, daysAgo: 1 },
      { skill: 'Rubik’s Cube', minutes: 40, daysAgo: 2 },
      { skill: 'Java & Spring Boot', minutes: 60, daysAgo: 3 },
      { skill: 'Chess', minutes: 20, daysAgo: 5 },
      { skill: 'English', minutes: 30, daysAgo: 6 },
      { skill: 'Rubik’s Cube', minutes: 35, daysAgo: 9 },
    ];
    for (const entry of plan) await logSession(page, entry);

    const shoot = async (name: string) => {
      await page.addStyleTag({
        content: 'main{overflow:visible!important} .fixed{position:static!important}',
      });
      await page.screenshot({ path: `test-results/train-${name}-${scheme}.png`, fullPage: true });
    };
    await goTab(page, 'Home');
    await shoot('home');
    await goTab(page, 'Skills');
    await shoot('skills');
    await goTab(page, 'Progress');
    await shoot('progress');
  });
}
