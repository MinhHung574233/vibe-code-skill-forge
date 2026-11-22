import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bootDatabase, closeActiveDb, getDb } from './boot';
import { refreshMarker } from './marker';
import { acceptEmptyDatabase, resetAllData, restoreLatestSnapshot } from './recovery';
import { SkillForgeDB } from './schema';
import { peekInstalledVersion, readSnapshot } from './snapshot';
import { V1, newTestEnv, skill, v2, v3, type TestEnv } from './testing';

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

describe('boot: fresh install and persistence', () => {
  it('boots an empty database, takes no snapshot, mirrors the schema version', async () => {
    const outcome = await bootDatabase({ ...config(), versions: [V1] });
    expect(outcome.status).toBe('ready');
    if (outcome.status !== 'ready') return;
    expect(outcome.migratedFrom).toBeNull();
    expect(outcome.snapshotTaken).toBe(false);
    expect((await outcome.db.settings.get('schemaVersion'))?.value).toBe(1);
    expect(env.markerStore.current?.counts).toEqual({ skills: 0, skillGoals: 0 });
  });

  it('keeps data across a close and re-boot (restart persistence)', async () => {
    const first = await bootDatabase({ ...config(), versions: [V1] });
    if (first.status !== 'ready') throw new Error('expected ready');
    await first.db.skills.add(skill('s1', 'Rubik'));
    closeActiveDb();

    const second = await bootDatabase({ ...config(), versions: [V1] });
    if (second.status !== 'ready') throw new Error('expected ready');
    expect(second.migratedFrom).toBeNull();
    expect((await second.db.skills.toArray()).map((s) => s.name)).toEqual(['Rubik']);
  });

  it('getDb throws before boot and returns the db after', async () => {
    expect(() => getDb()).toThrow(/before boot/);
    await bootDatabase({ ...config(), versions: [V1] });
    expect(getDb().isOpen()).toBe(true);
  });

  it('reports unavailable storage as a recovery state instead of throwing', async () => {
    const outcome = await bootDatabase({ ...config(), versions: [V1], indexedDbAvailable: false });
    expect(outcome).toMatchObject({ status: 'recovery', reason: 'unavailable' });
  });
});

describe('boot: migrations', () => {
  it('snapshots first, then upgrades in place and runs the data fix-up', async () => {
    await env.seed([V1, v2()], 1, [skill('s1', 'Rubik'), skill('s2', 'Chess')]);

    const outcome = await bootDatabase({ ...config(), versions: [V1, v2()] });
    expect(outcome.status).toBe('ready');
    if (outcome.status !== 'ready') return;
    expect(outcome.migratedFrom).toBe(1);
    expect(outcome.snapshotTaken).toBe(true);

    const rows = await outcome.db.skills.orderBy('id').toArray();
    expect(rows.map((s) => s.description)).toEqual(['migrated:Rubik', 'migrated:Chess']);

    const snapshot = await readSnapshot(env.snapshotName);
    expect(snapshot).toMatchObject({ fromVersion: 1, toVersion: 2 });
    // The snapshot holds the PRE-migration rows.
    expect(
      (snapshot?.tables.skills as { description?: string }[]).map((s) => s.description),
    ).toEqual([undefined, undefined]);
  });

  it('a throwing upgrade leaves the old data and version untouched and offers recovery', async () => {
    await env.seed([V1, v2()], 1, [skill('s1', 'Rubik')]);
    const failing = v2(() => {
      throw new Error('boom');
    });

    const outcome = await bootDatabase({ ...config(), versions: [V1, failing] });
    expect(outcome).toMatchObject({
      status: 'recovery',
      reason: 'migration-failed',
      hasSnapshot: true,
    });

    expect(await peekInstalledVersion(env.name)).toBe(1);
    const old = new SkillForgeDB(env.name, [V1], { upTo: 1 });
    expect((await old.skills.toArray()).map((s) => s.name)).toEqual(['Rubik']);
    old.close();
  });

  it('refuses to open data written by a newer schema and does not touch it', async () => {
    await env.seed([V1, v2(), v3()], 3, [skill('s1', 'Rubik')]);

    const outcome = await bootDatabase({ ...config(), versions: [V1, v2()] });
    expect(outcome).toMatchObject({ status: 'recovery', reason: 'schema-too-new' });
    expect(await peekInstalledVersion(env.name)).toBe(3);
  });

  it('re-running boot on an up-to-date database is a no-op (no new snapshot)', async () => {
    await env.seed([V1, v2()], 1, [skill('s1', 'Rubik')]);
    await bootDatabase({ ...config(), versions: [V1, v2()] });
    closeActiveDb();
    const before = await readSnapshot(env.snapshotName);

    const again = await bootDatabase({ ...config(), versions: [V1, v2()] });
    if (again.status !== 'ready') throw new Error('expected ready');
    expect(again.migratedFrom).toBeNull();
    expect(again.snapshotTaken).toBe(false);
    expect((await readSnapshot(env.snapshotName))?.takenAt).toBe(before?.takenAt);
  });

  it('the pre-foreign-key orphan scan is clean after migration (goals reference real skills)', async () => {
    await env.seed([V1, v2()], 1, [skill('s1', 'Rubik')]);
    const outcome = await bootDatabase({ ...config(), versions: [V1, v2()] });
    if (outcome.status !== 'ready') throw new Error('expected ready');
    await outcome.db.skillGoals.add({
      id: 'g1',
      skillId: 's1',
      metric: 'minutes_per_week',
      target: 60,
      direction: 'at_least',
      createdAt: 1,
      updatedAt: 1,
    });
    const skillIds = new Set((await outcome.db.skills.toArray()).map((s) => s.id));
    const orphans = (await outcome.db.skillGoals.toArray()).filter((g) => !skillIds.has(g.skillId));
    expect(orphans).toEqual([]);
  });
});

describe('boot: data-loss detector', () => {
  it('treats an empty database with a non-empty marker as suspected loss', async () => {
    const first = await bootDatabase({ ...config(), versions: [V1] });
    if (first.status !== 'ready') throw new Error('expected ready');
    await first.db.skills.add(skill('s1', 'Rubik'));
    await refreshMarker(first.db, env.markerStore);
    closeActiveDb();

    await Dexie.delete(env.name); // what an iOS storage eviction looks like to the app

    const outcome = await bootDatabase({ ...config(), versions: [V1] });
    expect(outcome).toMatchObject({ status: 'recovery', reason: 'data-loss-suspected' });
  });

  it('continuing with empty data clears the marker and boots normally', async () => {
    const first = await bootDatabase({ ...config(), versions: [V1] });
    if (first.status !== 'ready') throw new Error('expected ready');
    await first.db.skills.add(skill('s1', 'Rubik'));
    await refreshMarker(first.db, env.markerStore);
    closeActiveDb();
    await Dexie.delete(env.name);

    expect((await bootDatabase({ ...config(), versions: [V1] })).status).toBe('recovery');
    acceptEmptyDatabase(env.markerStore);
    expect((await bootDatabase({ ...config(), versions: [V1] })).status).toBe('ready');
  });

  it('a genuinely new install (no marker) is never flagged', async () => {
    expect((await bootDatabase({ ...config(), versions: [V1] })).status).toBe('ready');
  });

  it('a user who simply deleted everything is not flagged (marker updates with deletes)', async () => {
    const first = await bootDatabase({ ...config(), versions: [V1] });
    if (first.status !== 'ready') throw new Error('expected ready');
    await first.db.skills.add(skill('s1', 'Rubik'));
    await first.db.skills.delete('s1');
    await refreshMarker(first.db, env.markerStore);
    closeActiveDb();

    expect((await bootDatabase({ ...config(), versions: [V1] })).status).toBe('ready');
  });

  it('marker hooks keep counts current after writes without manual refresh', async () => {
    const outcome = await bootDatabase({ ...config(), versions: [V1] });
    if (outcome.status !== 'ready') throw new Error('expected ready');
    await outcome.db.skills.bulkAdd([skill('a', 'A'), skill('b', 'B')]);
    await vi.waitFor(() => expect(env.markerStore.current?.counts.skills).toBe(2), {
      timeout: 3000,
    });
  });
});

describe('recovery actions', () => {
  it('restores the pre-migration snapshot and migrates it forward again', async () => {
    await env.seed([V1, v2()], 1, [skill('s1', 'Rubik'), skill('s2', 'Chess')]);
    await bootDatabase({ ...config(), versions: [V1, v2()] });
    closeActiveDb();
    await Dexie.delete(env.name); // lose the live data, keep the snapshot

    const lost = await bootDatabase({ ...config(), versions: [V1, v2()] });
    expect(lost).toMatchObject({
      status: 'recovery',
      reason: 'data-loss-suspected',
      hasSnapshot: true,
    });

    await restoreLatestSnapshot({ ...config(), versions: [V1, v2()] });
    const restored = await bootDatabase({ ...config(), versions: [V1, v2()] });
    if (restored.status !== 'ready') throw new Error('expected ready');
    expect(restored.migratedFrom).toBe(1);
    expect((await restored.db.skills.orderBy('id').toArray()).map((s) => s.description)).toEqual([
      'migrated:Rubik',
      'migrated:Chess',
    ]);
  });

  it('restoring without a snapshot fails with an AppError instead of wiping data', async () => {
    await env.seed([V1], 1, [skill('s1', 'Rubik')]);
    await expect(restoreLatestSnapshot({ ...config(), versions: [V1] })).rejects.toMatchObject({
      code: 'IO',
    });
    expect(await peekInstalledVersion(env.name)).toBe(1);
    const db = new SkillForgeDB(env.name, [V1]);
    expect(await db.skills.count()).toBe(1);
    db.close();
  });

  it('resetAllData erases the database, the snapshot and the marker', async () => {
    await env.seed([V1, v2()], 1, [skill('s1', 'Rubik')]);
    await bootDatabase({ ...config(), versions: [V1, v2()] });

    await resetAllData(config());
    expect(await Dexie.exists(env.name)).toBe(false);
    expect(await Dexie.exists(env.snapshotName)).toBe(false);
    expect(env.markerStore.current).toBeNull();
    expect((await bootDatabase({ ...config(), versions: [V1] })).status).toBe('ready');
  });
});

describe('boot: multi-instance safety', () => {
  it('closes its connection and notifies when another instance upgrades the database', async () => {
    const onVersionChange = vi.fn();
    const outcome = await bootDatabase({ ...config(), versions: [V1], onVersionChange });
    expect(outcome.status).toBe('ready');

    const newer = new SkillForgeDB(env.name, [V1, v2()]);
    await newer.open(); // would block forever if the first connection stayed open
    newer.close();

    expect(onVersionChange).toHaveBeenCalledTimes(1);
    expect(() => getDb()).toThrow(/before boot/);
  });
});
