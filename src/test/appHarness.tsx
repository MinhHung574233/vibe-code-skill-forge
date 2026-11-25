import { cleanup, render } from '@testing-library/react';
import Dexie from 'dexie';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach } from 'vitest';
import { routes } from '@/app/routes';
import { systemClock } from '@/core/time/clock';
import { bootDatabase, closeActiveDb, getDb } from '@/db/boot';
import { memoryMarkerStore } from '@/db/testing';
import { DexieSkillRepository } from '@/features/skills/data/dexieSkillRepository';
import { DexieTrainingEngine } from '@/features/training/data/trainingEngine';
import type { RecordSessionInput } from '@/features/training/domain/session';

/**
 * Registers per-test setup/teardown for UI tests that need the real app routes on a real
 * (fake-indexeddb) database, exactly as the app gets below the BootGate.
 */
export function setupAppDatabase(name: string) {
  beforeEach(async () => {
    const outcome = await bootDatabase({
      name,
      snapshotName: `${name}-snap`,
      markerStore: memoryMarkerStore(),
    });
    if (outcome.status !== 'ready') throw new Error('test database failed to boot');
  });

  afterEach(async () => {
    cleanup(); // unmount first: live queries must not run against a closed database
    closeActiveDb();
    await Dexie.delete(name);
    await Dexie.delete(`${name}-snap`);
  });
}

export function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

export const skillRepo = () => new DexieSkillRepository(getDb(), systemClock);
export const engine = () => new DexieTrainingEngine(getDb(), systemClock);

/** Records a timed practice session that ended `endedMinutesAgo` ago and lasted `minutes`. */
export async function recordSession(
  over: Partial<RecordSessionInput> & { minutes?: number; endedMinutesAgo?: number } = {},
) {
  const { minutes = 10, endedMinutesAgo = 0, ...rest } = over;
  const endedAt = Date.now() - endedMinutesAgo * 60_000;
  const result = await engine().recordSession({
    id: `t-${Math.random().toString(36).slice(2)}`,
    activityType: 'practice_session',
    source: 'timer',
    startedAt: endedAt - minutes * 60_000,
    endedAt,
    ...rest,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

export async function createSkill(name: string, over: { weeklyGoalMinutes?: number | null } = {}) {
  const result = await skillRepo().create({
    name,
    category: 'custom',
    priority: 2,
    weeklyGoalMinutes: over.weeklyGoalMinutes ?? null,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}
