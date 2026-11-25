import Dexie from 'dexie';
import { afterEach, describe, expect, it } from 'vitest';
import { EPHEMERAL_TABLES, MARKER_TABLES } from './marker';
import { CURRENT_SCHEMA_VERSION, SCHEMA_VERSIONS, SkillForgeDB } from './schema';

const NAME = 'schema-test-db';

afterEach(async () => {
  await Dexie.delete(NAME);
});

describe('schema versions', () => {
  it('are unique, contiguous from 1, and in ascending order (append-only)', () => {
    const versions = SCHEMA_VERSIONS.map((v) => v.version);
    expect(versions).toEqual(Array.from({ length: versions.length }, (_, i) => i + 1));
    expect(CURRENT_SCHEMA_VERSION).toBe(versions.at(-1));
  });

  it('declares the stores from DATABASE.md (v1 core + v2 training engine + v3 modules)', async () => {
    const db = new SkillForgeDB(NAME);
    await db.open();
    expect(db.tables.map((t) => t.name).sort()).toEqual([
      'achievements',
      'algorithmProgress',
      'completions',
      'dailySummary',
      'drafts',
      'gameRecords',
      'lessonProgress',
      'puzzleProgress',
      'ratings',
      'rubikSolves',
      'sessions',
      'settings',
      'skillGoals',
      'skills',
      'vocabProgress',
      'xpLedger',
      'xpRules',
    ]);
    expect(
      db
        .table('skills')
        .schema.indexes.map((i) => i.name)
        .sort(),
    ).toEqual(['category', 'isArchived', 'moduleId', 'updatedAt']);
    db.close();
  });

  it('every store is classified as user data (marker) or ephemeral, so none is forgotten', async () => {
    const db = new SkillForgeDB(NAME);
    await db.open();
    const stores = db.tables.map((t) => t.name).sort();
    const classified = [...MARKER_TABLES, ...EPHEMERAL_TABLES].sort();
    expect(classified).toEqual(stores);
    db.close();
  });
});

describe('IndexedDB constraints the engine will rely on', () => {
  it('a duplicate primary key is rejected with ConstraintError', async () => {
    const db = new SkillForgeDB(NAME);
    await db.open();
    await db.settings.add({ key: 'k', value: 1, updatedAt: 1 });
    await expect(db.settings.add({ key: 'k', value: 2, updatedAt: 2 })).rejects.toMatchObject({
      name: 'ConstraintError',
    });
    expect((await db.settings.get('k'))?.value).toBe(1);
    db.close();
  });

  it('indexed booleans are unusable as keys, so 0|1 is what the schema stores', async () => {
    const db = new SkillForgeDB(NAME);
    await db.open();
    await db.skills.bulkAdd([
      {
        id: 'a',
        name: 'A',
        category: 'mind',
        priority: 1,
        isArchived: 0,
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: 'b',
        name: 'B',
        category: 'mind',
        priority: 1,
        isArchived: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    ]);
    expect((await db.skills.where('isArchived').equals(0).toArray()).map((s) => s.id)).toEqual([
      'a',
    ]);
    db.close();
  });
});
