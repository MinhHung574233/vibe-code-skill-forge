import Dexie, { type Table } from 'dexie';
import { AppError } from '@/core/errors';
import { t } from '@/i18n/core';
import { SkillForgeDB, type SchemaVersion } from './schema';

/**
 * Rolling pre-migration snapshot (DATABASE.md §2.4). Protects against a bad migration or a
 * bad restore, NOT against browser eviction (same origin is evicted together).
 */
export const SNAPSHOT_DB_NAME = 'skillforge-snapshot';

export interface SnapshotRecord {
  id: 'latest';
  takenAt: number;
  fromVersion: number;
  toVersion: number;
  tables: Record<string, unknown[]>;
}

class SnapshotDB extends Dexie {
  declare snapshots: Table<SnapshotRecord, string>;
  constructor(name: string) {
    super(name);
    this.version(1).stores({ snapshots: 'id' });
  }
}

/** Opens an existing database with whatever schema it has (no declared versions) and reads its version. */
export async function peekInstalledVersion(name: string): Promise<number> {
  const probe = new Dexie(name);
  try {
    await probe.open();
    return Math.round(probe.verno);
  } finally {
    probe.close();
  }
}

/** Dumps every table of an existing database using its installed schema. */
export async function dumpDatabase(name: string): Promise<Record<string, unknown[]>> {
  const source = new Dexie(name);
  try {
    await source.open();
    const tables: Record<string, unknown[]> = {};
    await source.transaction('r', source.tables, async () => {
      for (const table of source.tables) tables[table.name] = await table.toArray();
    });
    return tables;
  } finally {
    source.close();
  }
}

export async function takeSnapshot(args: {
  dbName: string;
  snapshotName?: string;
  fromVersion: number;
  toVersion: number;
  now?: () => number;
}): Promise<SnapshotRecord> {
  const { dbName, snapshotName = SNAPSHOT_DB_NAME, fromVersion, toVersion, now = Date.now } = args;
  const tables = await dumpDatabase(dbName);
  const record: SnapshotRecord = { id: 'latest', takenAt: now(), fromVersion, toVersion, tables };
  const snapshotDb = new SnapshotDB(snapshotName);
  try {
    await snapshotDb.snapshots.put(record);
  } finally {
    snapshotDb.close();
  }
  return record;
}

export async function readSnapshot(
  snapshotName: string = SNAPSHOT_DB_NAME,
): Promise<SnapshotRecord | undefined> {
  if (!(await Dexie.exists(snapshotName))) return undefined;
  const snapshotDb = new SnapshotDB(snapshotName);
  try {
    return await snapshotDb.snapshots.get('latest');
  } finally {
    snapshotDb.close();
  }
}

/**
 * Replaces the main database with the snapshot: delete, recreate at the snapshot's schema
 * version, bulk-load the rows. The caller then boots normally, which migrates forward again.
 */
export async function restoreSnapshot(args: {
  dbName: string;
  versions: readonly SchemaVersion[];
  snapshotName?: string;
}): Promise<SnapshotRecord> {
  const { dbName, versions, snapshotName = SNAPSHOT_DB_NAME } = args;
  const snapshot = await readSnapshot(snapshotName);
  if (!snapshot) throw new AppError('IO', t('There is no snapshot to restore.'));

  await Dexie.delete(dbName);
  const restored = new SkillForgeDB(dbName, versions, { upTo: snapshot.fromVersion });
  try {
    await restored.open();
    await restored.transaction('rw', restored.tables, async () => {
      for (const [tableName, rows] of Object.entries(snapshot.tables)) {
        if (restored.tables.some((t) => t.name === tableName) && rows.length > 0) {
          await restored.table(tableName).bulkPut(rows);
        }
      }
    });
  } finally {
    restored.close();
  }
  return snapshot;
}

export async function deleteSnapshot(snapshotName: string = SNAPSHOT_DB_NAME): Promise<void> {
  await Dexie.delete(snapshotName);
}
