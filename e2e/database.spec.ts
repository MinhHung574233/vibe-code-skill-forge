import { expect, test, type Page } from '@playwright/test';

/**
 * Production-build checks of the boot gate and persistence, using raw IndexedDB from the page
 * so they exercise the real wiring (Dexie, migrations, marker, recovery UI) end to end.
 */

async function launch(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Home', level: 1 })).toBeVisible();
}

test('creates the v1 database on first launch and keeps data across a reload', async ({ page }) => {
  await launch(page);

  const initial = await page.evaluate(
    () =>
      new Promise<{ stores: string[]; version: number; schemaVersion: unknown }>(
        (resolve, reject) => {
          const open = indexedDB.open('skillforge');
          open.onerror = () => reject(new Error('open failed'));
          open.onsuccess = () => {
            const db = open.result;
            const tx = db.transaction('settings', 'readonly');
            const get = tx.objectStore('settings').get('schemaVersion');
            get.onsuccess = () => {
              const result = {
                stores: Array.from(db.objectStoreNames).sort(),
                version: db.version,
                schemaVersion: (get.result as { value: unknown } | undefined)?.value,
              };
              db.close();
              resolve(result);
            };
          };
        },
      ),
  );
  expect(initial.stores).toEqual(['drafts', 'settings', 'skillGoals', 'skills']);
  expect(initial.version).toBe(10); // Dexie version 1 = IndexedDB version 10
  expect(initial.schemaVersion).toBe(1);

  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('skillforge');
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('skills', 'readwrite');
          tx.objectStore('skills').add({
            id: 'e2e-1',
            name: 'Persistence check',
            category: 'custom',
            priority: 2,
            isArchived: 0,
            createdAt: 1,
            updatedAt: 1,
          });
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(new Error('write failed'));
        };
      }),
  );

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Home', level: 1 })).toBeVisible();
  const count = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const open = indexedDB.open('skillforge');
        open.onsuccess = () => {
          const db = open.result;
          const req = db.transaction('skills', 'readonly').objectStore('skills').count();
          req.onsuccess = () => {
            db.close();
            resolve(req.result);
          };
        };
      }),
  );
  expect(count).toBe(1);
});

test('detects wiped storage and offers recovery instead of silently starting empty', async ({
  page,
}) => {
  await launch(page);

  // Pretend data existed (marker says one skill), then wipe the database like an iOS eviction.
  await page.evaluate(() => {
    localStorage.setItem(
      'sf-data-marker',
      JSON.stringify({ v: 1, updatedAt: Date.now(), counts: { skills: 1, skillGoals: 0 } }),
    );
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const del = indexedDB.deleteDatabase('skillforge');
        del.onsuccess = () => resolve();
        del.onblocked = () => resolve(); // the live app connection closes itself on versionchange
      }),
  );

  // The running app notices and asks for a reload rather than writing to a deleted database.
  await expect(page.getByRole('heading', { name: 'Reload to finish updating' })).toBeVisible();

  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Your data appears to be missing' }),
  ).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Primary' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Continue with empty data' }).click();
  await expect(page.getByRole('heading', { name: 'Home', level: 1 })).toBeVisible();
});

test('refuses data from a newer schema and leaves it untouched', async ({ page }) => {
  await launch(page);

  // Simulate a database written by a future app version (Dexie 99 = IndexedDB 990).
  await page.evaluate(
    () =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('skillforge', 990);
        open.onupgradeneeded = () => undefined;
        open.onsuccess = () => {
          open.result.close();
          resolve();
        };
        open.onerror = () => reject(new Error('could not create newer database'));
        open.onblocked = () => resolve();
      }),
  );

  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'This app version is out of date' }),
  ).toBeVisible();

  const version = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const open = indexedDB.open('skillforge');
        open.onsuccess = () => {
          const v = open.result.version;
          open.result.close();
          resolve(v);
        };
      }),
  );
  expect(version).toBe(990);
});
