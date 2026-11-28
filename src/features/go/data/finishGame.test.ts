import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FakeClock } from '@/core/time/clock';
import { SkillForgeDB } from '@/db/schema';
import { DexieTrainingEngine } from '@/features/training/data/trainingEngine';
import type { RecordSessionInput } from '@/features/training/domain/session';
import { gameResult, restoreGame, resign, type GameState } from '../domain/game';
import { finishGoGame } from './finishGame';
import { draftToSerialized, loadDraft, saveDraft, type GoDraft } from './goDraft';
import { DexieGoRepository } from './goRepository';

const NAME = 'go-finish-test';
let db: SkillForgeDB;
let clock: FakeClock;
let repository: DexieGoRepository;
let real: DexieTrainingEngine;

beforeEach(async () => {
  db = new SkillForgeDB(NAME);
  await db.open();
  clock = new FakeClock(Date.UTC(2026, 5, 1, 12));
  repository = new DexieGoRepository(db, clock);
  real = new DexieTrainingEngine(db, clock);
});

afterEach(async () => {
  db.close();
  await Dexie.delete(NAME);
});

/** Five black stones, four white, then black passes and white passes: ready for scoring. */
const MOVES = [40, 41, 31, 32, 49, 50, 22, 23, 58, null, null];
const draft = (over: Partial<GoDraft> = {}): GoDraft => ({
  gameId: 'go-1',
  startedAt: clock.now() - 20 * 60_000,
  level: 'easy',
  humanColor: 'black',
  config: { size: 9, komi: 6.5, handicap: 0 },
  moves: MOVES,
  resignedBy: null,
  seed: 1,
  ...over,
});

function over(d: GoDraft): GameState {
  const state = restoreGame(draftToSerialized(d));
  if (!state) throw new Error('bad draft');
  return state;
}

const deps = (engine: { recordSession: (i: RecordSessionInput) => unknown } = real) => ({
  db,
  repository,
  engine: engine as unknown as DexieTrainingEngine,
  now: () => clock.now(),
});

describe('finishGoGame', () => {
  it('records the result and one session, then drops the draft', async () => {
    const d = draft();
    await saveDraft(db, d, clock.now());
    const state = over(d);
    const done = await finishGoGame(deps(), d, state, gameResult(state), {
      endedAt: clock.now(),
      dead: [],
    });
    expect(done.ok).toBe(true);
    if (done.ok) {
      expect(done.recorded).toBe(true);
      expect(done.session?.xpAwarded).toBeGreaterThan(0);
    }
    expect(await db.gameRecords.count()).toBe(1);
    expect(await db.sessions.get('go-1')).toMatchObject({ moduleId: 'go' });
    expect(await db.xpLedger.count()).toBe(1);
    expect(await loadDraft(db)).toBeNull();
  });

  it.each(['throw', 'error'] as const)(
    'a failed session (%s) keeps a finished draft; the retry records the result and XP once',
    async (how) => {
      const d = draft();
      await saveDraft(db, d, clock.now());
      const state = over(d);
      const final = gameResult(state);
      const finish = { endedAt: clock.now() - 1000, dead: [] as number[] };
      let calls = 0;
      const flaky = {
        recordSession: (input: RecordSessionInput) => {
          calls += 1;
          if (calls > 1) return real.recordSession(input);
          return how === 'throw'
            ? Promise.reject(new Error('quota exceeded'))
            : Promise.resolve({ ok: false, error: { message: 'IO' } });
        },
      };

      const first = await finishGoGame(deps(flaky), d, state, final, finish);
      expect(first.ok).toBe(false);
      if (!first.ok) expect(first.message).toMatch(/could not be saved/);
      // the draft stays, marked finished, with everything needed to retry
      expect((await loadDraft(db))?.finished).toEqual({ endedAt: finish.endedAt, dead: [] });
      expect(await db.xpLedger.count()).toBe(0);

      clock.advance(60_000); // the retry happens later but records the same end time
      const second = await finishGoGame(deps(flaky), d, state, final, finish);
      expect(second.ok).toBe(true);
      expect(calls).toBe(2);
      expect(await db.gameRecords.count()).toBe(1);
      expect((await db.gameRecords.get('go-1'))?.endedAt).toBe(finish.endedAt);
      expect(await db.sessions.count()).toBe(1);
      expect(await db.xpLedger.count()).toBe(1);
      expect(await loadDraft(db)).toBeNull();
    },
  );

  it('paying twice is impossible: a third attempt reports no new session', async () => {
    const d = draft();
    const state = over(d);
    const finish = { endedAt: clock.now(), dead: [] as number[] };
    await finishGoGame(deps(), d, state, gameResult(state), finish);
    const again = await finishGoGame(deps(), d, state, gameResult(state), finish);
    expect(again.ok).toBe(true);
    if (again.ok) expect(again.session).toBeNull();
    expect(await db.xpLedger.count()).toBe(1);
    expect(await db.gameRecords.count()).toBe(1);
  });

  it('a game with fewer than five human stones records nothing but still clears the draft', async () => {
    const d = draft({ moves: [40, 41, 31, 32, null, null] });
    await saveDraft(db, d, clock.now());
    const state = over(d);
    const done = await finishGoGame(deps(), d, state, gameResult(state), {
      endedAt: clock.now(),
      dead: [],
    });
    expect(done).toEqual({ ok: true, recorded: false, session: null });
    expect(await db.gameRecords.count()).toBe(0);
    expect(await db.sessions.count()).toBe(0);
    expect(await loadDraft(db)).toBeNull();
  });

  it('keeps the dead stones in the marker, and a resignation by the computer records a win', async () => {
    const d = draft({ moves: MOVES.slice(0, 9) });
    await saveDraft(db, d, clock.now());
    const state = resign(over(d), 2); // the computer (white) resigns
    const failing = {
      recordSession: () => Promise.resolve({ ok: false, error: { message: 'IO' } }),
    };
    const final = gameResult(state);
    const finish = { endedAt: clock.now(), dead: [41, 32] };
    const first = await finishGoGame(deps(failing), d, state, final, finish);
    expect(first.ok).toBe(false);
    const kept = await loadDraft(db);
    expect(kept?.finished).toEqual({ endedAt: finish.endedAt, dead: [41, 32] });
    expect(kept?.resignedBy).toBe('white');

    const second = await finishGoGame(deps(), d, state, final, finish);
    expect(second.ok).toBe(true);
    expect(await db.gameRecords.get('go-1')).toMatchObject({ result: 'win' });
    expect(await db.gameRecords.get('go-1')).toMatchObject({ details: { by: 'resign' } });
  });
});
