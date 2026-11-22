import { z } from 'zod';
import type { SkillForgeDB } from './schema';

/**
 * Data-loss detector (ARCHITECTURE §5, IOS_PWA §1). iOS can evict site data; when it does,
 * IndexedDB comes back empty and the user would otherwise silently start from zero.
 *
 * A small marker with per-table row counts is kept in localStorage after every write batch.
 * At boot: empty database + non-empty marker => data was probably lost => recovery screen.
 * (localStorage can be evicted together with IndexedDB; then nothing can be detected, which is
 * why backups are the real protection. The marker is a best-effort early warning.)
 */

/** Tables holding user-authored/earned data. Extended whenever a new user-data store ships. */
export const MARKER_TABLES = ['skills', 'skillGoals'] as const;

/** Tables intentionally excluded (rebuildable or transient). Together with MARKER_TABLES this
 *  must cover every store; a unit test enforces it so new stores cannot be forgotten. */
export const EPHEMERAL_TABLES = ['settings', 'drafts'] as const;

const MarkerSchema = z.object({
  v: z.literal(1),
  updatedAt: z.number(),
  counts: z.record(z.string(), z.number().int().nonnegative()),
});
export type Marker = z.infer<typeof MarkerSchema>;

export interface MarkerStore {
  read(): Marker | null;
  write(marker: Marker): void;
  clear(): void;
}

export function localStorageMarkerStore(key = 'sf-data-marker'): MarkerStore {
  return {
    read() {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const parsed = MarkerSchema.safeParse(JSON.parse(raw));
        return parsed.success ? parsed.data : null;
      } catch {
        return null;
      }
    },
    write(marker) {
      try {
        localStorage.setItem(key, JSON.stringify(marker));
      } catch {
        /* storage blocked/full: the detector just becomes unavailable */
      }
    },
    clear() {
      try {
        localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

export function totalRows(counts: Record<string, number>): number {
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

export async function countMarkerTables(db: SkillForgeDB): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const name of MARKER_TABLES) {
    counts[name] = db.tables.some((t) => t.name === name) ? await db.table(name).count() : 0;
  }
  return counts;
}

export async function refreshMarker(
  db: SkillForgeDB,
  store: MarkerStore,
  now: () => number = Date.now,
): Promise<void> {
  if (!db.isOpen()) return;
  const counts = await countMarkerTables(db);
  store.write({ v: 1, updatedAt: now(), counts });
}

const DEBOUNCE_MS = 250;

/**
 * Keeps the marker current: any create/update/delete on a marker table schedules a debounced
 * refresh that runs after the transaction has settled. Returns a function that cancels the
 * pending refresh and detaches the timer (for tests and shutdown).
 */
export function installMarkerHooks(
  db: SkillForgeDB,
  store: MarkerStore,
  now: () => number = Date.now,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      refreshMarker(db, store, now).catch(() => undefined);
    }, DEBOUNCE_MS);
  };
  for (const name of MARKER_TABLES) {
    const table = db.table(name);
    table.hook('creating', () => {
      schedule();
    });
    table.hook('updating', () => {
      schedule();
    });
    table.hook('deleting', () => {
      schedule();
    });
  }
  return () => clearTimeout(timer);
}
