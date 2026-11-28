import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { systemClock } from '@/core/time/clock';
import { SkillForgeDB } from '@/db/schema';
import { DexieTrainingEngine } from '@/features/training/data/trainingEngine';
import type { RecordSessionInput, TrainingEngine } from '@/features/training/domain/session';
import {
  PLAY_RATING_KEY,
  loadGameDraft,
  saveGameDraft,
  type FinishedGame,
  type GameDraft,
} from './chessRepository';
import { finishChessGame } from './finishGame';

const NAME = 'chess-finish-test';
let db: SkillForgeDB;
let real: DexieTrainingEngine;

beforeEach(async () => {
  db = new SkillForgeDB(NAME);
  await db.open();
  real = new DexieTrainingEngine(db, systemClock);
});

afterEach(async () => {
  db.close();
  await Dexie.delete(NAME);
});

const ENDED = Date.now() - 1000;
const draft: GameDraft = {
  id: 'g1',
  startedAt: ENDED - 600_000,
  level: 'medium',
  color: 'w',
  moves: ['e2e4', 'e7e5'],
  undos: 0,
  finished: { outcome: 'win', reason: 'checkmate', endedAt: ENDED },
};
const game: FinishedGame = {
  id: 'g1',
  level: 'medium',
  color: 'w',
  result: 'win',
  reason: 'checkmate',
  moves: ['e2e4', 'e7e5'],
  pgn: '1. e4 e5',
  playerMoves: 12,
  undos: 0,
  startedAt: ENDED - 600_000,
  endedAt: ENDED,
  opponentRating: 1000,
};

/** A training engine whose first `failures` calls fail the given way, then delegates to the real one. */
function flaky(failures: number, how: 'throw' | 'error'): TrainingEngine & { calls: number } {
  const engine = {
    calls: 0,
    recordSession(input: RecordSessionInput) {
      engine.calls += 1;
      if (engine.calls <= failures) {
        return how === 'throw'
          ? Promise.reject(new Error('storage full'))
          : Promise.resolve({ ok: false as const, error: { message: 'IO' } });
      }
      return real.recordSession(input);
    },
  };
  return engine as unknown as TrainingEngine & { calls: number };
}

describe('finishChessGame', () => {
  it('records the game, the rating and one session, then drops the draft', async () => {
    const done = await finishChessGame({ db, engine: real }, draft, game);
    expect(done.ok).toBe(true);
    if (done.ok) expect(done.session?.xpAwarded).toBeGreaterThan(0);
    expect(await db.gameRecords.count()).toBe(1);
    expect(await db.sessions.count()).toBe(1);
    expect(await db.xpLedger.count()).toBe(1);
    expect(await db.ratings.get(PLAY_RATING_KEY)).toMatchObject({ games: 1 });
    expect(await loadGameDraft(db)).toBeNull();
  });

  it.each(['throw', 'error'] as const)(
    'a failed session (%s) keeps the finished draft, and the retry saves the result and XP once',
    async (how) => {
      const engine = flaky(1, how);
      const first = await finishChessGame({ db, engine }, draft, game);
      expect(first.ok).toBe(false);
      if (!first.ok) expect(first.message).toMatch(/could not be saved/);
      // the result is stored, the draft stays (marked finished) so a resume can retry
      expect(await db.gameRecords.count()).toBe(1);
      expect((await loadGameDraft(db))?.finished).toMatchObject({ outcome: 'win' });
      expect(await db.xpLedger.count()).toBe(0);

      const second = await finishChessGame({ db, engine }, draft, game);
      expect(second.ok).toBe(true);
      if (second.ok) expect(second.session?.xpAwarded).toBeGreaterThan(0);
      expect(engine.calls).toBe(2);

      expect(await db.gameRecords.count()).toBe(1);
      expect(await db.sessions.count()).toBe(1);
      expect(await db.xpLedger.count()).toBe(1);
      expect(await db.ratings.get(PLAY_RATING_KEY)).toMatchObject({ games: 1 }); // rated once
      expect(await loadGameDraft(db)).toBeNull();
    },
  );

  it('a third attempt after full success never pays twice', async () => {
    await finishChessGame({ db, engine: real }, draft, game);
    await saveGameDraft(db, draft, ENDED); // as if the draft removal had not happened
    const again = await finishChessGame({ db, engine: real }, draft, game);
    expect(again.ok).toBe(true);
    if (again.ok) expect(again.session).toBeNull(); // duplicate: nothing new to celebrate
    expect(await db.xpLedger.count()).toBe(1);
    expect(await db.gameRecords.count()).toBe(1);
    expect(await db.ratings.get(PLAY_RATING_KEY)).toMatchObject({ games: 1 });
  });

  it('a game too short to reward records the result and records no session', async () => {
    const short = { ...game, id: 'short', playerMoves: 2 };
    const done = await finishChessGame({ db, engine: real }, { ...draft, id: 'short' }, short);
    expect(done.ok).toBe(true);
    expect(await db.gameRecords.count()).toBe(1);
    expect(await db.sessions.count()).toBe(0);
    expect(await loadGameDraft(db)).toBeNull();
  });
});
