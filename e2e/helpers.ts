import { expect, type Page } from '@playwright/test';

/** Raw IndexedDB helpers: they exercise the real wiring without going through the app's own code. */

export async function launchApp(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Home', level: 1 })).toBeVisible();
}

export async function seedSkills(page: Page, names: string[]) {
  await page.evaluate(
    (skillNames) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('skillforge');
        open.onerror = () => reject(new Error('open failed'));
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('skills', 'readwrite');
          const store = tx.objectStore('skills');
          skillNames.forEach((name, i) =>
            store.put({
              id: `e2e-${i}`,
              name,
              category: 'custom',
              priority: 2,
              isArchived: 0,
              createdAt: 1,
              updatedAt: 1,
            }),
          );
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(new Error('write failed'));
        };
      }),
    names,
  );
}

export async function skillNames(page: Page): Promise<string[]> {
  return page.evaluate(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const open = indexedDB.open('skillforge');
        open.onerror = () => reject(new Error('open failed'));
        open.onsuccess = () => {
          const db = open.result;
          const req = db.transaction('skills', 'readonly').objectStore('skills').getAll();
          req.onsuccess = () => {
            db.close();
            resolve((req.result as { name: string }[]).map((s) => s.name).sort());
          };
        };
      }),
  );
}

export async function clearSkills(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const open = indexedDB.open('skillforge');
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction('skills', 'readwrite');
          tx.objectStore('skills').clear();
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
        };
      }),
  );
}

/** Deletes the whole database, like an iOS storage eviction, and records that data existed. */
export async function simulateEviction(page: Page, rowsBefore: number) {
  await page.evaluate((rows) => {
    localStorage.setItem(
      'sf-data-marker',
      JSON.stringify({ v: 1, updatedAt: Date.now(), counts: { skills: rows, skillGoals: 0 } }),
    );
  }, rowsBefore);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const del = indexedDB.deleteDatabase('skillforge');
        del.onsuccess = () => resolve();
        del.onblocked = () => resolve(); // the live connection closes itself on versionchange
      }),
  );
}
