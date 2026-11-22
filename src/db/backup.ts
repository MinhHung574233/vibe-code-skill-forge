import Dexie from 'dexie';
import { z } from 'zod';
import { AppError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import { toAppError } from './errors';
import { closeActiveDb } from './boot';
import { EPHEMERAL_TABLES, countMarkerTables, totalRows } from './marker';
import { DB_NAME, SCHEMA_VERSIONS, SkillForgeDB, type SchemaVersion } from './schema';
import { SNAPSHOT_DB_NAME, restoreSnapshot, takeSnapshot } from './snapshot';

/**
 * Backup file (DATABASE.md §5): human-readable JSON containing every user table, the schema
 * version it was written at, and a SHA-256 checksum so truncated or edited files are rejected.
 * Transient `drafts` are not exported. Bundled content is not in the database at all.
 */
export const BACKUP_VERSION = 1;

/** Tables that are not exported. */
const EXCLUDED_TABLES: readonly string[] = ['drafts'];

// Row validation: the minimum a row needs for IndexedDB to accept it and for the app not to
// crash on it (primary key + indexed fields with the right type). Extra fields are preserved.
// When a store gets a new shape in a later schema version, validate against the shape of the
// backup's own schemaVersion; every new store MUST be added here (a test enforces it).
const ROW_SCHEMAS: Record<string, z.ZodType> = {
  settings: z.looseObject({ key: z.string().min(1), updatedAt: z.number() }),
  skills: z.looseObject({
    id: z.string().min(1),
    name: z.string(),
    category: z.enum(['mind', 'language', 'technical', 'games', 'custom']),
    priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    isArchived: z.union([z.literal(0), z.literal(1)]),
    createdAt: z.number(),
    updatedAt: z.number(),
  }),
  skillGoals: z.looseObject({
    id: z.string().min(1),
    skillId: z.string(),
    metric: z.string(),
    target: z.number(),
    direction: z.enum(['at_least', 'at_most']),
    createdAt: z.number(),
    updatedAt: z.number(),
  }),
};

/** Tables the backup format knows how to validate (exported for the coverage test). */
export const BACKUP_VALIDATED_TABLES = Object.keys(ROW_SCHEMAS);

const BackupSchema = z.object({
  app: z.literal('skillforge'),
  backupVersion: z.literal(BACKUP_VERSION),
  schemaVersion: z.number().int().positive(),
  appVersion: z.string().optional(),
  exportedAt: z.number().int().positive(),
  tables: z.record(z.string(), z.array(z.unknown())),
  checksum: z.string().regex(/^[0-9a-f]{64}$/),
});

export interface BackupFile {
  app: 'skillforge';
  backupVersion: number;
  schemaVersion: number;
  appVersion?: string;
  exportedAt: number;
  tables: Record<string, unknown[]>;
  checksum: string;
}

export interface BackupSummary {
  schemaVersion: number;
  exportedAt: number;
  appVersion?: string;
  /** Row count per table (only tables with data matter to the user, but all are listed). */
  counts: Record<string, number>;
  totalRows: number;
}

/** JSON with sorted keys, so the checksum does not depend on property order. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function checksumInput(file: Pick<BackupFile, 'schemaVersion' | 'tables'>): string {
  return canonicalJson({ schemaVersion: file.schemaVersion, tables: file.tables });
}

export function summarize(file: BackupFile): BackupSummary {
  const counts: Record<string, number> = {};
  for (const [name, rows] of Object.entries(file.tables)) counts[name] = rows.length;
  return {
    schemaVersion: file.schemaVersion,
    exportedAt: file.exportedAt,
    ...(file.appVersion ? { appVersion: file.appVersion } : {}),
    counts,
    totalRows: totalRows(counts),
  };
}

export function backupFileName(exportedAt: number): string {
  const d = new Date(exportedAt);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `skillforge-backup-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}.json`;
}

/** Reads every exportable table in one read transaction (a consistent snapshot of the data). */
export async function buildBackup(
  db: SkillForgeDB,
  options: { now?: () => number; appVersion?: string } = {},
): Promise<BackupFile> {
  const { now = Date.now, appVersion } = options;
  const tables: Record<string, unknown[]> = {};
  await db.transaction('r', db.tables, async () => {
    for (const table of db.tables) {
      if (EXCLUDED_TABLES.includes(table.name)) continue;
      tables[table.name] = await table.toArray();
    }
  });
  const schemaVersion = Math.round(db.verno);
  const checksum = await sha256Hex(checksumInput({ schemaVersion, tables }));
  return {
    app: 'skillforge',
    backupVersion: BACKUP_VERSION,
    schemaVersion,
    ...(appVersion ? { appVersion } : {}),
    exportedAt: now(),
    tables,
    checksum,
  };
}

export function serializeBackup(file: BackupFile): string {
  return JSON.stringify(file);
}

/** Table names that exist at a given schema version (stores accumulate; null drops one). */
export function tablesAtVersion(versions: readonly SchemaVersion[], version: number): Set<string> {
  const names = new Set<string>();
  for (const v of [...versions].sort((a, b) => a.version - b.version)) {
    if (v.version > version) break;
    for (const [name, def] of Object.entries(v.stores)) {
      if (def === null) names.delete(name);
      else names.add(name);
    }
  }
  return names;
}

const invalid = (message: string) => err(new AppError('VALIDATION', message));

/**
 * Parses and fully validates a backup before anything touches the database:
 * JSON, envelope, schema version, table names, every row, and the checksum.
 * Problems are described in plain language for the preview screen.
 */
export async function parseBackup(
  text: string,
  versions: readonly SchemaVersion[] = SCHEMA_VERSIONS,
): Promise<Result<BackupFile>> {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return invalid('This file is not a valid backup (it is not readable JSON).');
  }

  const envelope = BackupSchema.safeParse(json);
  if (!envelope.success) {
    const app = (json as { app?: unknown } | null)?.app;
    return invalid(
      app === 'skillforge'
        ? 'This backup file is damaged or incomplete.'
        : 'This is not a SkillForge backup file.',
    );
  }
  const file = envelope.data as BackupFile;

  const latest = versions.reduce((max, v) => Math.max(max, v.version), 0);
  if (file.schemaVersion > latest) {
    return invalid(
      'This backup was made by a newer version of SkillForge. Update the app, then try again.',
    );
  }

  const known = tablesAtVersion(versions, file.schemaVersion);
  for (const [name, rows] of Object.entries(file.tables)) {
    if (!known.has(name)) return invalid(`The backup contains an unknown table "${name}".`);
    const schema = ROW_SCHEMAS[name];
    if (!schema) {
      if (EPHEMERAL_TABLES.includes(name as (typeof EPHEMERAL_TABLES)[number])) continue;
      return invalid(`The backup contains a table this app cannot check: "${name}".`);
    }
    for (let i = 0; i < rows.length; i++) {
      if (!schema.safeParse(rows[i]).success) {
        return invalid(`The backup is damaged: "${name}" entry ${i + 1} is not valid.`);
      }
    }
  }

  const expected = await sha256Hex(checksumInput(file));
  if (expected !== file.checksum) {
    return invalid('The backup failed its integrity check. The file was changed or is incomplete.');
  }
  return ok(file);
}

export interface ImportConfig {
  name?: string;
  versions?: readonly SchemaVersion[];
  snapshotName?: string;
  now?: () => number;
}

/**
 * Replaces ALL local data with the backup (v1 supports Replace only).
 *
 *  1. Close the live connection.
 *  2. If the current database holds user data, snapshot it first (rollback point). An empty or
 *     unreadable database never overwrites an existing, more useful snapshot.
 *  3. Delete, recreate at the backup's own schema version, bulk-insert every table.
 *  4. On ANY failure restore the snapshot, so a bad import cannot destroy existing data.
 *
 * The caller re-boots afterwards, which migrates a backup from an older schema forward.
 */
export async function importBackup(
  file: BackupFile,
  config: ImportConfig = {},
): Promise<Result<BackupSummary>> {
  const {
    name = DB_NAME,
    versions = SCHEMA_VERSIONS,
    snapshotName = SNAPSHOT_DB_NAME,
    now = Date.now,
  } = config;
  const latest = versions.reduce((max, v) => Math.max(max, v.version), 0);

  closeActiveDb();

  let hasRollbackPoint = false;
  try {
    const current = new SkillForgeDB(name, versions, {});
    let installedVersion = latest;
    let hasUserData = false;
    try {
      await current.open();
      installedVersion = Math.round(current.verno);
      hasUserData = totalRows(await countMarkerTables(current)) > 0;
    } catch {
      hasUserData = false;
    } finally {
      current.close();
    }

    if (hasUserData) {
      await takeSnapshot({
        dbName: name,
        snapshotName,
        fromVersion: installedVersion,
        toVersion: latest,
        now,
      });
      hasRollbackPoint = true;
    }

    await Dexie.delete(name);
    const target = new SkillForgeDB(name, versions, { upTo: file.schemaVersion });
    try {
      await target.open();
      await target.transaction('rw', target.tables, async () => {
        for (const [tableName, rows] of Object.entries(file.tables)) {
          if (rows.length === 0 || !target.tables.some((t) => t.name === tableName)) continue;
          await target.table(tableName).bulkAdd(rows); // add, not put: duplicate keys must fail
        }
      });
    } finally {
      target.close();
    }
    return ok(summarize(file));
  } catch (cause) {
    if (hasRollbackPoint) {
      try {
        await restoreSnapshot({ dbName: name, versions, snapshotName });
      } catch {
        return err(
          new AppError(
            'IO',
            'The import failed and the previous data could not be restored automatically.',
            { cause },
          ),
        );
      }
    }
    const mapped = toAppError(cause);
    return err(
      new AppError(
        mapped.code === 'QUOTA' ? 'QUOTA' : 'IO',
        mapped.code === 'QUOTA'
          ? 'There is not enough free storage on this device to restore the backup. Your previous data was kept.'
          : 'The backup could not be restored. Your previous data was kept.',
        { cause },
      ),
    );
  }
}
