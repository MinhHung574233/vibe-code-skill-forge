import Dexie from 'dexie';
import { DB_NAME, SCHEMA_VERSIONS, type SchemaVersion } from './schema';
import { localStorageMarkerStore, type MarkerStore } from './marker';
import { SNAPSHOT_DB_NAME, deleteSnapshot, restoreSnapshot } from './snapshot';
import { closeActiveDb } from './boot';

export interface RecoveryConfig {
  name?: string;
  versions?: readonly SchemaVersion[];
  snapshotName?: string;
  markerStore?: MarkerStore;
}

/** Replace the database with the last pre-migration snapshot. Caller re-runs boot afterwards. */
export async function restoreLatestSnapshot(config: RecoveryConfig = {}): Promise<void> {
  const {
    name = DB_NAME,
    versions = SCHEMA_VERSIONS,
    snapshotName = SNAPSHOT_DB_NAME,
    markerStore = localStorageMarkerStore(),
  } = config;
  closeActiveDb();
  await restoreSnapshot({ dbName: name, versions, snapshotName });
  markerStore.clear(); // counts will be rebuilt by the next boot
}

/** Accept an empty database after a suspected loss: forget the old marker and continue. */
export function acceptEmptyDatabase(markerStore: MarkerStore = localStorageMarkerStore()): void {
  markerStore.clear();
}

/** Erase all local data (and the snapshot) and start fresh. Destructive; UI must confirm. */
export async function resetAllData(config: RecoveryConfig = {}): Promise<void> {
  const {
    name = DB_NAME,
    snapshotName = SNAPSHOT_DB_NAME,
    markerStore = localStorageMarkerStore(),
  } = config;
  closeActiveDb();
  await Dexie.delete(name);
  await deleteSnapshot(snapshotName);
  markerStore.clear();
}
