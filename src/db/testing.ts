import Dexie from 'dexie';
import { SCHEMA_VERSIONS, SkillForgeDB, type SchemaVersion } from './schema';
import type { Marker, MarkerStore } from './marker';
import type { SkillRow } from './rows';
import type { BootConfig } from './boot';

/** Test helpers shared by the database integration tests (real Dexie on fake-indexeddb). */

let counter = 0;

export function memoryMarkerStore(): MarkerStore & { current: Marker | null } {
  const store = {
    current: null as Marker | null,
    read: () => store.current,
    write: (m: Marker) => {
      store.current = m;
    },
    clear: () => {
      store.current = null;
    },
  };
  return store;
}

export const V1 = SCHEMA_VERSIONS[0] as SchemaVersion;

/** Synthetic v2 with a data-fix-up upgrade, to exercise the migration path. */
export function v2(upgrade?: SchemaVersion['upgrade']): SchemaVersion {
  return {
    version: 2,
    stores: { skillGoals: 'id, skillId, metric, achievedAt' },
    upgrade:
      upgrade ??
      (async (tx) => {
        await tx
          .table<SkillRow>('skills')
          .toCollection()
          .modify((s) => {
            s.description = `migrated:${s.name}`;
          });
      }),
  };
}

export function v3(): SchemaVersion {
  return { version: 3, stores: { drafts: 'key, updatedAt' } };
}

export function skill(id: string, name: string): SkillRow {
  return {
    id,
    name,
    category: 'technical',
    priority: 2,
    isArchived: 0,
    createdAt: 1,
    updatedAt: 1,
  };
}

export interface TestEnv extends Required<Pick<BootConfig, 'name' | 'snapshotName'>> {
  markerStore: ReturnType<typeof memoryMarkerStore>;
  /** Writes rows into a database created at exactly `version` (simulates an older install). */
  seed(versions: readonly SchemaVersion[], version: number, skills: SkillRow[]): Promise<void>;
  cleanup(): Promise<void>;
}

export function newTestEnv(): TestEnv {
  counter += 1;
  const name = `test-db-${counter}`;
  const snapshotName = `test-snapshot-${counter}`;
  return {
    name,
    snapshotName,
    markerStore: memoryMarkerStore(),
    async seed(versions, version, skills) {
      const db = new SkillForgeDB(name, versions, { upTo: version });
      try {
        await db.open();
        if (skills.length > 0) await db.skills.bulkAdd(skills);
      } finally {
        db.close();
      }
    },
    async cleanup() {
      await Dexie.delete(name);
      await Dexie.delete(snapshotName);
    },
  };
}
