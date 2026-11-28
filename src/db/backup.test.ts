import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { bootDatabase, closeActiveDb } from './boot';
import {
  BACKUP_VALIDATED_TABLES,
  backupFileName,
  buildBackup,
  canonicalJson,
  importBackup,
  parseBackup,
  serializeBackup,
  sha256Hex,
  summarize,
  tablesAtVersion,
  type BackupFile,
} from './backup';
import { EPHEMERAL_TABLES, MARKER_TABLES } from './marker';
import { CURRENT_SCHEMA_VERSION, SkillForgeDB } from './schema';
import { readSnapshot } from './snapshot';
import { V1, newTestEnv, skill, v2, type TestEnv } from './testing';

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

async function bootWithData(versions = [V1]) {
  const outcome = await bootDatabase({ ...config(), versions });
  if (outcome.status !== 'ready') throw new Error('expected ready');
  await outcome.db.skills.bulkAdd([skill('s1', 'Rubik'), skill('s2', 'Chess')]);
  await outcome.db.skillGoals.add({
    id: 'g1',
    skillId: 's1',
    metric: 'minutes_per_week',
    target: 60,
    direction: 'at_least',
    createdAt: 1,
    updatedAt: 1,
  });
  await outcome.db.settings.put({ key: 'dailyGoalMinutes', value: 30, updatedAt: 5 });
  await outcome.db.drafts.put({ key: 'timer', value: { running: true }, updatedAt: 5 });
  return outcome.db;
}

async function signed(
  tables: Record<string, unknown[]>,
  schemaVersion = 1,
  overrides: Partial<BackupFile> = {},
): Promise<BackupFile> {
  return {
    app: 'skillforge',
    backupVersion: 1,
    schemaVersion,
    exportedAt: 1_700_000_000_000,
    tables,
    checksum: await sha256Hex(canonicalJson({ schemaVersion, tables })),
    ...overrides,
  };
}

describe('buildBackup', () => {
  it('exports every user table with a checksum and leaves out transient drafts', async () => {
    const db = await bootWithData();
    const file = await buildBackup(db, { now: () => 1_700_000_000_000, appVersion: '9.9.9' });

    expect(file).toMatchObject({
      app: 'skillforge',
      backupVersion: 1,
      schemaVersion: 1,
      appVersion: '9.9.9',
      exportedAt: 1_700_000_000_000,
    });
    expect(file.checksum).toMatch(/^[0-9a-f]{64}$/);
    expect(Object.keys(file.tables).sort()).toEqual(['settings', 'skillGoals', 'skills']);
    expect(file.tables.skills).toHaveLength(2);
    expect(file.tables.drafts).toBeUndefined();
  });

  it('summarize counts rows per table', async () => {
    const db = await bootWithData();
    const summary = summarize(await buildBackup(db));
    expect(summary.counts.skills).toBe(2);
    expect(summary.counts.skillGoals).toBe(1);
    expect(summary.totalRows).toBe(summary.counts.settings! + 3);
  });
});

describe('parseBackup', () => {
  it('accepts what buildBackup produced after a serialize round-trip', async () => {
    const db = await bootWithData();
    const original = await buildBackup(db);
    const result = await parseBackup(serializeBackup(original), [V1]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual(original);
  });

  it('accepts real module rows whose localDate is a YYYY-MM-DD string (regression: a broken regex rejected them)', async () => {
    const file = await signed(
      {
        rubikSolves: [
          {
            id: 'r1',
            timeMs: 12_345,
            penalty: 'none',
            scramble: "R U R'",
            createdAt: 1,
            localDate: '2026-11-27',
          },
        ],
        gameRecords: [
          {
            id: 'g1',
            game: 'chess',
            level: 'hard',
            result: 'win',
            startedAt: 1,
            endedAt: 2,
            localDate: '2026-11-27',
          },
        ],
      },
      CURRENT_SCHEMA_VERSION,
    );
    const result = await parseBackup(serializeBackup(file));
    expect(result.ok).toBe(true);
  });

  it('still rejects a malformed localDate in module rows', async () => {
    const file = await signed(
      {
        gameRecords: [
          {
            id: 'g1',
            game: 'go',
            level: 'easy',
            result: 'loss',
            startedAt: 1,
            endedAt: 2,
            localDate: 'yesterday',
          },
        ],
      },
      CURRENT_SCHEMA_VERSION,
    );
    expect((await parseBackup(serializeBackup(file))).ok).toBe(false);
  });

  it.each([
    ['not JSON', '{"app": "skillforge"', /not readable JSON/],
    ['another app', JSON.stringify({ app: 'notes', tables: {} }), /not a SkillForge backup/],
    ['empty object', '{}', /not a SkillForge backup/],
  ])('rejects %s with a plain-language message', async (_label, text, message) => {
    const result = await parseBackup(text, [V1]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION');
      expect(result.error.message).toMatch(message);
    }
  });

  it('rejects a SkillForge file with a missing/invalid envelope as damaged', async () => {
    const file = await signed({});
    const result = await parseBackup(JSON.stringify({ ...file, exportedAt: 'yesterday' }), [V1]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/damaged or incomplete/);
  });

  it('detects edited data through the checksum', async () => {
    const db = await bootWithData();
    const file = await buildBackup(db);
    const edited = structuredClone(file);
    (edited.tables.skills as { name: string }[])[0]!.name = 'Hacked';
    const result = await parseBackup(JSON.stringify(edited), [V1]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/integrity check/);
  });

  it('detects a deleted row (truncation) through the checksum', async () => {
    const db = await bootWithData();
    const file = await buildBackup(db);
    const truncated = structuredClone(file);
    truncated.tables.skills = (truncated.tables.skills ?? []).slice(0, 1);
    const result = await parseBackup(JSON.stringify(truncated), [V1]);
    expect(result.ok).toBe(false);
  });

  it('refuses a backup from a newer schema version', async () => {
    const file = await signed({}, 7);
    const result = await parseBackup(JSON.stringify(file), [V1]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/newer version/);
  });

  it('refuses unknown tables and invalid rows before touching any data', async () => {
    const unknown = await signed({ nonsense: [{ id: 'x' }] });
    const r1 = await parseBackup(JSON.stringify(unknown), [V1]);
    expect(r1.ok).toBe(false);
    if (!r1.ok) expect(r1.error.message).toMatch(/unknown table "nonsense"/);

    const badRow = await signed({
      skills: [skill('ok', 'Fine'), { ...skill('bad', 'Bad'), priority: 9 }],
    });
    const r2 = await parseBackup(JSON.stringify(badRow), [V1]);
    expect(r2.ok).toBe(false);
    if (!r2.ok) expect(r2.error.message).toMatch(/"skills" entry 2/);
  });

  it('accepts an older-schema backup when the app has moved on', async () => {
    const file = await signed({ skills: [skill('s1', 'Rubik')] }, 1);
    const result = await parseBackup(JSON.stringify(file), [V1, v2()]);
    expect(result.ok).toBe(true);
  });
});

describe('importBackup', () => {
  it('replaces all data with the backup, snapshotting the current data first', async () => {
    const db = await bootWithData();
    const file = await buildBackup(db);

    // Diverge from the backup after it was taken.
    await db.skills.delete('s1');
    await db.skills.add(skill('s3', 'Added later'));

    const result = await importBackup(file, { ...config(), versions: [V1] });
    expect(result.ok).toBe(true);

    const booted = await bootDatabase({ ...config(), versions: [V1] });
    if (booted.status !== 'ready') throw new Error('expected ready');
    expect((await booted.db.skills.orderBy('id').toArray()).map((s) => s.id)).toEqual(['s1', 's2']);
    expect(await booted.db.skillGoals.count()).toBe(1);
    expect((await booted.db.settings.get('dailyGoalMinutes'))?.value).toBe(30);

    const rollbackPoint = await readSnapshot(env.snapshotName);
    expect((rollbackPoint?.tables.skills as { id: string }[]).map((s) => s.id).sort()).toEqual([
      's2',
      's3',
    ]);
  });

  it('does not overwrite an existing snapshot when the current database is empty', async () => {
    // Make a snapshot via a real migration, then lose the data.
    await env.seed([V1, v2()], 1, [skill('keep', 'Precious')]);
    await bootDatabase({ ...config(), versions: [V1, v2()] });
    closeActiveDb();
    const before = await readSnapshot(env.snapshotName);
    expect(before).toBeDefined();
    await Dexie.delete(env.name); // the live data is gone (eviction); only the snapshot remains

    const file = await signed({ skills: [skill('s1', 'From backup')] });
    const result = await importBackup(file, { ...config(), versions: [V1, v2()] });
    expect(result.ok).toBe(true);
    expect((await readSnapshot(env.snapshotName))?.takenAt).toBe(before?.takenAt);
  });

  it('rolls back to the previous data when the import fails midway', async () => {
    const db = await bootWithData();
    expect(await db.skills.count()).toBe(2);
    // Valid per schema, but duplicate primary keys make the database reject it.
    const poisoned = await signed({
      skills: [skill('dup', 'One'), skill('dup', 'Two')],
    });

    const result = await importBackup(poisoned, { ...config(), versions: [V1] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.message).toMatch(/previous data was kept/);

    const booted = await bootDatabase({ ...config(), versions: [V1] });
    if (booted.status !== 'ready') throw new Error('expected ready');
    expect((await booted.db.skills.orderBy('id').toArray()).map((s) => s.id)).toEqual(['s1', 's2']);
    expect(await booted.db.skillGoals.count()).toBe(1);
  });

  it('imports an older-schema backup and the next boot migrates it forward', async () => {
    const file = await signed({ skills: [skill('s1', 'Rubik'), skill('s2', 'Chess')] }, 1);
    const result = await importBackup(file, { ...config(), versions: [V1, v2()] });
    expect(result.ok).toBe(true);

    const booted = await bootDatabase({ ...config(), versions: [V1, v2()] });
    if (booted.status !== 'ready') throw new Error('expected ready');
    expect(booted.migratedFrom).toBe(1);
    expect((await booted.db.skills.orderBy('id').toArray()).map((s) => s.description)).toEqual([
      'migrated:Rubik',
      'migrated:Chess',
    ]);
  });

  it('the restored database passes an orphan scan (every goal points at a skill)', async () => {
    const db = await bootWithData();
    const file = await buildBackup(db);
    await importBackup(file, { ...config(), versions: [V1] });
    const check = new SkillForgeDB(env.name, [V1]);
    const ids = new Set((await check.skills.toArray()).map((s) => s.id));
    expect((await check.skillGoals.toArray()).filter((g) => !ids.has(g.skillId))).toEqual([]);
    check.close();
  });
});

describe('format guards', () => {
  it('every exportable store has row validation, so new stores cannot slip through unchecked', async () => {
    const db = new SkillForgeDB(env.name);
    await db.open();
    const exportable = db.tables.map((t) => t.name).filter((n) => n !== 'drafts');
    expect(exportable.sort()).toEqual([...BACKUP_VALIDATED_TABLES].sort());
    db.close();
    // And the classification used by the data-loss marker stays consistent with it.
    expect([...MARKER_TABLES, ...EPHEMERAL_TABLES].sort()).toEqual(
      [...exportable, 'drafts'].sort(),
    );
  });

  it('canonicalJson sorts keys, drops undefined, and is order-independent', () => {
    expect(canonicalJson({ b: 1, a: [2, { d: 1, c: undefined }] })).toBe('{"a":[2,{"d":1}],"b":1}');
    expect(canonicalJson({ a: 1, b: 2 })).toBe(canonicalJson({ b: 2, a: 1 }));
  });

  it('sha256Hex matches a known vector', async () => {
    expect(await sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('tablesAtVersion accumulates stores and honours drops', () => {
    expect([...tablesAtVersion([V1], 1)].sort()).toEqual([
      'drafts',
      'settings',
      'skillGoals',
      'skills',
    ]);
    const dropping = { version: 2, stores: { drafts: null } };
    expect(tablesAtVersion([V1, dropping], 2).has('drafts')).toBe(false);
    expect(tablesAtVersion([V1, dropping], 1).has('drafts')).toBe(true);
  });

  it('names the file by local date', () => {
    const noon = new Date(2026, 10, 22, 12).getTime();
    expect(backupFileName(noon)).toBe('skillforge-backup-2026-11-22.json');
  });
});
