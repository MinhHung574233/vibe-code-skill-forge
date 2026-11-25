import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { bootDatabase, closeActiveDb } from './boot';
import { CURRENT_SCHEMA_VERSION, SCHEMA_VERSIONS, SkillForgeDB } from './schema';
import { readSnapshot } from './snapshot';
import { newTestEnv, skill, type TestEnv } from './testing';

/**
 * The REAL shipped schema history, not synthetic versions. These protect the data already on the
 * owner's phone: every upgrade path from an installed version must keep user data intact.
 */
let env: TestEnv;

beforeEach(() => {
  env = newTestEnv();
});

afterEach(async () => {
  closeActiveDb();
  await env.cleanup();
});

const config = () => ({
  name: env.name,
  snapshotName: env.snapshotName,
  markerStore: env.markerStore,
});

describe('upgrade from every previously shipped schema version', () => {
  it('declares more than one version, so these tests are meaningful', () => {
    expect(CURRENT_SCHEMA_VERSION).toBeGreaterThanOrEqual(2);
  });

  for (const from of SCHEMA_VERSIONS.map((v) => v.version).filter(
    (v) => v < CURRENT_SCHEMA_VERSION,
  )) {
    it(`v${from} -> v${CURRENT_SCHEMA_VERSION}: keeps every row, takes a snapshot, adds the new stores`, async () => {
      // An installed app at version `from`, with data in the stores that existed then.
      const old = new SkillForgeDB(env.name, SCHEMA_VERSIONS, { upTo: from });
      await old.open();
      await old.skills.bulkAdd([skill('s1', 'Rubik'), skill('s2', 'Chess')]);
      await old.skillGoals.add({
        id: 'g1',
        skillId: 's1',
        metric: 'minutes_per_week',
        target: 90,
        direction: 'at_least',
        createdAt: 1,
        updatedAt: 1,
      });
      await old.settings.put({ key: 'dailyGoalMinutes', value: 35, updatedAt: 1 });
      await old.settings.put({ key: 'lastBackupAt', value: 1_700_000_000_000, updatedAt: 1 });
      await old.drafts.put({ key: 'anything', value: { a: 1 }, updatedAt: 1 });
      old.close();

      const outcome = await bootDatabase(config());
      expect(outcome.status).toBe('ready');
      if (outcome.status !== 'ready') return;
      expect(outcome).toMatchObject({ migratedFrom: from, snapshotTaken: true });

      // Nothing the user had was lost or changed.
      const db = outcome.db;
      expect((await db.skills.orderBy('id').toArray()).map((s) => s.name)).toEqual([
        'Rubik',
        'Chess',
      ]);
      expect(await db.skillGoals.get('g1')).toMatchObject({ target: 90 });
      expect((await db.settings.get('dailyGoalMinutes'))?.value).toBe(35);
      expect((await db.settings.get('lastBackupAt'))?.value).toBe(1_700_000_000_000);
      expect((await db.drafts.get('anything'))?.value).toEqual({ a: 1 });

      // The pre-upgrade snapshot holds the old data (rollback point).
      const snapshot = await readSnapshot(env.snapshotName);
      expect(snapshot).toMatchObject({ fromVersion: from, toVersion: CURRENT_SCHEMA_VERSION });
      expect((snapshot?.tables.skills as { id: string }[]).map((s) => s.id).sort()).toEqual([
        's1',
        's2',
      ]);

      // The new stores exist, are empty, and are immediately usable.
      expect(db.tables.map((t) => t.name)).toEqual(
        expect.arrayContaining([
          'sessions',
          'completions',
          'xpLedger',
          'dailySummary',
          'achievements',
          'xpRules',
        ]),
      );
      expect(await db.sessions.count()).toBe(0);
      await db.completions.add({
        activityKey: 'session:x',
        moduleId: 'general',
        activityType: 'practice_session',
        completedAt: 1,
        localDate: '2026-11-25',
      });
      expect(await db.completions.count()).toBe(1);

      // No false data-loss alarm on the next launch, and the marker now counts the new stores.
      closeActiveDb();
      const again = await bootDatabase(config());
      expect(again.status).toBe('ready');
      expect(env.markerStore.current?.counts).toMatchObject({
        skills: 2,
        skillGoals: 1,
        completions: 1,
      });
    });
  }

  it('a fresh install goes straight to the current version without a snapshot', async () => {
    const outcome = await bootDatabase(config());
    expect(outcome).toMatchObject({ status: 'ready', migratedFrom: null, snapshotTaken: false });
    if (outcome.status === 'ready') {
      expect((await outcome.db.settings.get('schemaVersion'))?.value).toBe(CURRENT_SCHEMA_VERSION);
    }
  });
});
