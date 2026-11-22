import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';

/** Guards the test harness: real Dexie semantics running on fake-indexeddb. */
describe('IndexedDB test harness', () => {
  it('persists rows and enforces unique primary keys', async () => {
    const db = new Dexie('harness-check');
    db.version(1).stores({ completions: 'activityKey' });
    const table = db.table<{ activityKey: string }, string>('completions');

    await table.add({ activityKey: 'lesson:a' });
    await expect(table.add({ activityKey: 'lesson:a' })).rejects.toMatchObject({
      name: 'ConstraintError',
    });
    expect(await table.count()).toBe(1);

    db.close();
    await Dexie.delete('harness-check');
  });
});
