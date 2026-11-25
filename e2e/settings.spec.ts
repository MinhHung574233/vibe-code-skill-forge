import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { clearSkills, launchApp, seedSkills, simulateEviction, skillNames } from './helpers';

async function openSettings(page: Page) {
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
}

async function exportBackupFile(page: Page): Promise<string> {
  await page.getByRole('button', { name: 'Back up my data' }).click();
  const sheet = page.getByRole('dialog', { name: 'Back up your data' });
  await expect(sheet.getByRole('button', { name: 'Download file' })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await sheet.getByRole('button', { name: 'Download file' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^skillforge-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await download.path();
  await expect(sheet.getByRole('status').filter({ hasText: 'Download started' })).toBeVisible();
  await page.keyboard.press('Escape');
  return path;
}

test('settings show offline readiness, and Repair restores deleted precache files', async ({
  page,
}) => {
  await launchApp(page);
  await openSettings(page);

  await expect(page.getByText('Ready offline', { exact: true })).toBeVisible({ timeout: 15_000 });

  // Simulate iOS evicting Cache Storage while IndexedDB survives.
  await page.evaluate(async () => {
    for (const name of await caches.keys()) await caches.delete(name);
  });

  await page.getByRole('button', { name: 'Check again' }).click();
  await expect(page.getByText('Incomplete', { exact: true })).toBeVisible();
  await expect(page.locator('[data-banner="offline"]')).toBeVisible();

  await page.getByRole('button', { name: 'Repair' }).first().click();
  await expect(page.getByText('Ready offline', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('[data-banner="offline"]')).toHaveCount(0);
});

test('backup export, tamper rejection, and restore round-trip through Settings', async ({
  page,
}) => {
  await launchApp(page);
  await seedSkills(page, ['Rubik', 'Chess']);
  await page.reload();
  await openSettings(page);

  const backupPath = await exportBackupFile(page);
  const backup = JSON.parse(readFileSync(backupPath, 'utf8')) as {
    app: string;
    schemaVersion: number;
    checksum: string;
    tables: Record<string, unknown[]>;
  };
  expect(backup).toMatchObject({ app: 'skillforge', schemaVersion: 2 });
  expect(backup.checksum).toMatch(/^[0-9a-f]{64}$/);
  expect(backup.tables.skills).toHaveLength(2);
  expect(backup.tables.drafts).toBeUndefined();

  // The backup is recorded.
  await expect(page.getByText('today').first()).toBeVisible();

  // A tampered copy is rejected before anything changes.
  const tampered = readFileSync(backupPath, 'utf8').replace('Rubik', 'Hacked');
  await page.getByTestId('backup-file-input').setInputFiles({
    name: 'tampered.json',
    mimeType: 'application/json',
    buffer: Buffer.from(tampered),
  });
  await expect(page.getByRole('alert').filter({ hasText: 'integrity check' })).toBeVisible();
  expect(await skillNames(page)).toEqual(['Chess', 'Rubik']);

  // Diverge, then restore the genuine backup: preview -> confirm -> reload -> data is back.
  await clearSkills(page);
  await seedSkills(page, ['Only after backup']);
  await page.getByTestId('backup-file-input').setInputFiles(backupPath);

  const preview = page.getByRole('dialog', { name: 'Restore this backup?' });
  await expect(preview).toBeVisible();
  await expect(preview.getByText('Skills')).toBeVisible();
  await preview.getByRole('button', { name: 'Replace my data' }).click();
  const reloaded = page.waitForEvent('load'); // Settings reloads the app after a restore
  await page
    .getByRole('dialog', { name: 'Replace all data on this device?' })
    .getByRole('button', { name: 'Replace' })
    .click();
  await reloaded;

  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  expect(await skillNames(page)).toEqual(['Chess', 'Rubik']);
});

test('restoring from the recovery screen after storage was wiped', async ({ page }) => {
  await launchApp(page);
  await seedSkills(page, ['Rubik', 'Chess', 'Go']);
  await page.reload();
  await openSettings(page);
  const backupPath = await exportBackupFile(page);

  await simulateEviction(page, 3);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Your data appears to be missing' }),
  ).toBeVisible();

  await page.getByTestId('backup-file-input').setInputFiles(backupPath);
  const preview = page.getByRole('dialog', { name: 'Restore this backup?' });
  await expect(preview).toBeVisible();
  await preview.getByRole('button', { name: 'Replace my data' }).click();
  await page
    .getByRole('dialog', { name: 'Replace all data on this device?' })
    .getByRole('button', { name: 'Replace' })
    .click();

  await expect(page.getByRole('heading', { name: 'Your data appears to be missing' })).toHaveCount(
    0,
    { timeout: 15_000 },
  );
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  expect(await skillNames(page)).toEqual(['Chess', 'Go', 'Rubik']);
});

test('a file that is not a backup is refused with a plain message', async ({ page }) => {
  await launchApp(page);
  await openSettings(page);
  await page.getByTestId('backup-file-input').setInputFiles({
    name: 'notes.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ hello: 'world' })),
  });
  await expect(
    page.getByRole('alert').filter({ hasText: 'not a SkillForge backup' }),
  ).toBeVisible();
});

test('erase all data wipes everything and the app starts clean (no false loss alert)', async ({
  page,
}) => {
  await launchApp(page);
  await seedSkills(page, ['Rubik']);
  await page.reload();
  await openSettings(page);

  await page.getByRole('button', { name: 'Erase all data on this device' }).click();
  const reloaded = page.waitForEvent('load');
  await page
    .getByRole('dialog', { name: 'Erase all data?' })
    .getByRole('button', { name: 'Erase everything' })
    .click();
  await reloaded;

  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your data appears to be missing' })).toHaveCount(
    0,
  );
  expect(await skillNames(page)).toEqual([]);
});
