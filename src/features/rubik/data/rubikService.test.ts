import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FakeClock } from '@/core/time/clock';
import { SkillForgeDB } from '@/db/schema';
import { DexieTrainingEngine } from '@/features/training/data/trainingEngine';
import { RubikService, SESSION_IDLE_MS } from './rubikService';

const NAME = 'rubik-service-test';
const T0 = new Date('2026-11-25T10:00:00').getTime();
let db: SkillForgeDB;
let clock: FakeClock;
let service: RubikService;

beforeEach(async () => {
  db = new SkillForgeDB(NAME);
  await db.open();
  clock = new FakeClock(T0);
  service = new RubikService(db, clock, new DexieTrainingEngine(db, clock));
});

afterEach(async () => {
  db.close();
  await Dexie.delete(NAME);
});

const solve = async (timeMs: number, gapMs = 20_000) => {
  clock.advance(gapMs);
  return service.addSolve({ timeMs, scramble: "R U R' U'" });
};

describe('solves', () => {
  it('stores solves with the day they were done and lists them oldest first', async () => {
    await solve(15_000);
    await solve(14_000);
    const all = await service.solves();
    expect(all.map((s) => s.timeMs)).toEqual([15_000, 14_000]);
    expect(all[0]).toMatchObject({ penalty: 'none', localDate: '2026-11-25' });
  });

  it('applies a penalty or deletes a solve', async () => {
    const { solve: first } = await solve(15_000);
    await service.setPenalty(first.id, 'plus2');
    expect((await service.solves())[0]?.penalty).toBe('plus2');
    await service.deleteSolve(first.id);
    expect(await service.solves()).toEqual([]);
  });
});

describe('the session around the solves', () => {
  it('records one rubik session for XP when finished, and clears the draft', async () => {
    await solve(15_000);
    await solve(12_000);
    await solve(13_000);
    const open = await service.openSessionSolves();
    expect(open).toHaveLength(3);

    clock.advance(1000);
    const result = await service.finishSession();
    expect(result.ok && result.value).toMatchObject({ duplicate: false, xpAwarded: 15 });

    const sessions = await db.sessions.toArray();
    expect(sessions).toHaveLength(1);
    expect(sessions[0]).toMatchObject({
      moduleId: 'rubik',
      activityType: 'rubik_session',
      result: { solves: 3, bestMs: 12_000 },
    });
    expect(await service.openSessionSolves()).toEqual([]);

    // Finishing again has nothing to record (no double XP).
    const again = await service.finishSession();
    expect(again.ok && again.value).toBeNull();
    expect(await db.sessions.count()).toBe(1);
  });

  it('closes a stale session automatically and starts a new one', async () => {
    await solve(15_000);
    const second = await solve(14_000, SESSION_IDLE_MS + 60_000);
    expect(second.closedStale).toMatchObject({ duplicate: false, xpAwarded: 15 });
    expect(await db.sessions.count()).toBe(1);
    // Only the new solve belongs to the new open session.
    expect(await service.openSessionSolves()).toHaveLength(1);
  });

  it('records nothing when every solve of the session was deleted', async () => {
    const { solve: only } = await solve(15_000);
    await service.deleteSolve(only.id);
    const result = await service.finishSession();
    expect(result.ok && result.value).toBeNull();
    expect(await db.sessions.count()).toBe(0);
  });
});

describe('algorithm progress', () => {
  it('marks, changes and clears the learning status', async () => {
    await service.setAlgorithmStatus('pll-t', 'learning');
    expect((await db.algorithmProgress.get('pll-t'))?.status).toBe('learning');
    await service.setAlgorithmStatus('pll-t', 'learned');
    expect((await db.algorithmProgress.get('pll-t'))?.status).toBe('learned');
    await service.setAlgorithmStatus('pll-t', null);
    expect(await db.algorithmProgress.get('pll-t')).toBeUndefined();
  });
});
