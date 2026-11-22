import Dexie from 'dexie';
import type { AppError } from '@/core/errors';
import { toAppError } from './errors';
import {
  countMarkerTables,
  installMarkerHooks,
  localStorageMarkerStore,
  refreshMarker,
  totalRows,
  type MarkerStore,
} from './marker';
import {
  CURRENT_SCHEMA_VERSION,
  DB_NAME,
  SCHEMA_VERSIONS,
  SkillForgeDB,
  latestVersion,
  type SchemaVersion,
} from './schema';
import { SNAPSHOT_DB_NAME, peekInstalledVersion, readSnapshot, takeSnapshot } from './snapshot';

export interface BootConfig {
  name?: string;
  versions?: readonly SchemaVersion[];
  snapshotName?: string;
  markerStore?: MarkerStore;
  /** Override IndexedDB availability (tests). Defaults to feature detection. */
  indexedDbAvailable?: boolean;
  now?: () => number;
  /** Called when another tab/instance needs to upgrade or delete the database. */
  onVersionChange?: () => void;
}

export type RecoveryReason =
  | 'unavailable' // IndexedDB missing/blocked
  | 'open-failed' // could not open the database
  | 'migration-failed' // an upgrade threw; the old data is untouched
  | 'schema-too-new' // data written by a newer app version
  | 'data-loss-suspected'; // empty database but the marker says there was data

export type BootOutcome =
  | {
      status: 'ready';
      db: SkillForgeDB;
      /** Installed schema version before this boot, when an upgrade ran. */
      migratedFrom: number | null;
      snapshotTaken: boolean;
    }
  | {
      status: 'recovery';
      reason: RecoveryReason;
      message: string;
      error?: AppError;
      hasSnapshot: boolean;
    };

let activeDb: SkillForgeDB | null = null;
let detachHooks: (() => void) | null = null;

/** The open database. Throws if called before a successful boot (programmer error). */
export function getDb(): SkillForgeDB {
  if (!activeDb) throw new Error('Database accessed before boot completed');
  return activeDb;
}

export function closeActiveDb(): void {
  detachHooks?.();
  detachHooks = null;
  activeDb?.close();
  activeDb = null;
}

function detectIndexedDb(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false; // some privacy modes throw on access
  }
}

async function recovery(
  reason: RecoveryReason,
  message: string,
  snapshotName: string,
  error?: AppError,
): Promise<BootOutcome> {
  let hasSnapshot: boolean;
  try {
    hasSnapshot = (await readSnapshot(snapshotName)) !== undefined;
  } catch {
    hasSnapshot = false;
  }
  return { status: 'recovery', reason, message, hasSnapshot, ...(error ? { error } : {}) };
}

/**
 * Boot sequence (ARCHITECTURE §5):
 *  1. IndexedDB available?
 *  2. Peek the installed schema version. Newer than this code => refuse (never downgrade).
 *     Older => take a rolling snapshot first, then let Dexie upgrade atomically.
 *  3. Open (runs upgrades). Failure => recovery with the old data untouched.
 *  4. Data-loss check against the marker.
 *  5. Install marker hooks, refresh the marker, mirror the schema version.
 */
export async function bootDatabase(config: BootConfig = {}): Promise<BootOutcome> {
  const {
    name = DB_NAME,
    versions = SCHEMA_VERSIONS,
    snapshotName = SNAPSHOT_DB_NAME,
    markerStore = localStorageMarkerStore(),
    indexedDbAvailable = detectIndexedDb(),
    now = Date.now,
    onVersionChange,
  } = config;
  const target = versions === SCHEMA_VERSIONS ? CURRENT_SCHEMA_VERSION : latestVersion(versions);

  closeActiveDb();

  if (!indexedDbAvailable) {
    return recovery(
      'unavailable',
      'This browser is not allowing the app to store data on this device.',
      snapshotName,
    );
  }

  let installed: number | null = null;
  let snapshotTaken = false;
  try {
    if (await Dexie.exists(name)) {
      installed = await peekInstalledVersion(name);
      if (installed > target) {
        return recovery(
          'schema-too-new',
          'Your data was saved by a newer version of SkillForge. Update the app to open it.',
          snapshotName,
        );
      }
      if (installed < target) {
        try {
          await takeSnapshot({
            dbName: name,
            snapshotName,
            fromVersion: installed,
            toVersion: target,
            now,
          });
          snapshotTaken = true;
        } catch {
          // A failed snapshot must not block startup; the upgrade itself is atomic.
          snapshotTaken = false;
        }
      }
    }
  } catch (cause) {
    return recovery(
      'open-failed',
      'The saved data could not be inspected.',
      snapshotName,
      toAppError(cause),
    );
  }

  const db = new SkillForgeDB(name, versions);
  db.on('versionchange', () => {
    db.close(); // never block another instance's upgrade
    if (activeDb === db) activeDb = null;
    onVersionChange?.();
    return false;
  });

  const upgrading = installed !== null && installed < target;
  try {
    await db.open();
  } catch (cause) {
    db.close();
    return recovery(
      upgrading ? 'migration-failed' : 'open-failed',
      upgrading
        ? 'The update could not convert your saved data. Your data has not been changed.'
        : 'The saved data could not be opened.',
      snapshotName,
      toAppError(cause),
    );
  }

  try {
    const counts = await countMarkerTables(db);
    const marker = markerStore.read();
    if (marker && totalRows(marker.counts) > 0 && totalRows(counts) === 0) {
      db.close();
      return recovery(
        'data-loss-suspected',
        'Your saved data appears to be missing. iOS may have cleared this app’s storage.',
        snapshotName,
      );
    }

    detachHooks = installMarkerHooks(db, markerStore, now);
    await refreshMarker(db, markerStore, now);
    await db.settings.put({ key: 'schemaVersion', value: target, updatedAt: now() });
  } catch (cause) {
    db.close();
    return recovery(
      'open-failed',
      'The saved data could not be read.',
      snapshotName,
      toAppError(cause),
    );
  }

  activeDb = db;
  return { status: 'ready', db, migratedFrom: upgrading ? installed : null, snapshotTaken };
}
