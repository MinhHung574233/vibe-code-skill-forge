import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '@/core/errors';
import { err } from '@/core/result';
import { FakeClock } from '@/core/time/clock';
import { SkillForgeDB } from '@/db/schema';
import { DexieTrainingEngine } from '@/features/training/data/trainingEngine';
import { cellIndex } from '../domain/board';
import { replay } from '../domain/game';
import { drawMoves } from '../domain/testing';
import type { CaroDraft } from '../domain/play';
import {
  DRAFT_KEY,
  clearDraft,
  loadDraft,
  loadFinishedGames,
  saveDraft,
  saveFinishedGame,
} from './caroRepository';
import { finishGame } from './finishGame';

const NAME = 'caro-data-test';
const MIN = 60_000;
const i = (r: number, c: number) => cellIndex(15, r, c);

/** Person (stone 1) completes row 7 on its fifth move; the computer answers on row 8. */
const WINNING_MOVES = [0, 1, 2, 3, 4].flatMap((c) => [i(7, c), i(8, c)]).slice(0, 9);
/** Stone 2 completes row 5 on its fifth stone, after stone 1 has played five. */
const LOSING_MOVES = [
  i(0, 0),
  i(5, 0),
  i(0, 2),
  i(5, 1),
  i(0, 4),
  i(5, 2),
  i(2, 0),
  i(5, 3),
  i(3, 3),
  i(5, 4),
];

let db: SkillForgeDB;
let clock: FakeClock;

beforeEach(async () => {
  db = new SkillForgeDB(NAME);
  await db.open();
  clock = new FakeClock(new Date(2026, 10, 25, 18, 0, 0).getTime());
});

afterEach(async () => {
  db.close();
  await Dexie.delete(NAME);
});

const draft = (over: Partial<CaroDraft> = {}): CaroDraft => ({
  id: 'game-1',
  size: 15,
  level: 'medium',
  humanStone: 1,
  startedAt: clock.now() - 10 * MIN,
  moves: [],
  undos: 0,
  ...over,
});

const STORED = {
  id: 'stored',
  size: 15,
  level: 'medium',
  humanStone: 1,
  startedAt: 1_000,
  moves: [] as number[],
  undos: 0,
};

describe('game draft', () => {
  it('round-trips and replaces the single saved game', async () => {
    expect(await loadDraft(db)).toBeNull();
    const saved = draft({ moves: [i(7, 7), i(7, 8)] });
    await saveDraft(db, saved, clock.now());
    expect(await loadDraft(db)).toEqual(saved);
    await saveDraft(db, draft({ id: 'game-2' }), clock.now());
    expect((await loadDraft(db))?.id).toBe('game-2');
    expect(await db.drafts.count()).toBe(1);
    await clearDraft(db);
    expect(await loadDraft(db)).toBeNull();
  });

  it.each([
    ['a wrong shape', { id: 'x' }],
    ['an unknown level', { ...STORED, level: 'legendary' }],
    ['an unsupported board size', { ...STORED, size: 13 }],
    ['a repeated cell', { ...STORED, moves: [5, 5] }],
    ['a cell off the board', { ...STORED, size: 9, moves: [81] }],
  ])('treats %s as no saved game instead of throwing', async (_name, value) => {
    await db.drafts.put({ key: DRAFT_KEY, value, updatedAt: 1 });
    expect(await loadDraft(db)).toBeNull();
  });
});

describe('finished games', () => {
  it('stores the result with size, move count, who started and a local date', async () => {
    await saveFinishedGame(db, {
      id: 'game-1',
      level: 'hard',
      outcome: 'loss',
      size: 9,
      moves: 31,
      firstMover: 'computer',
      undos: 0,
      startedAt: clock.now() - 20 * MIN,
      endedAt: clock.now(),
    });
    expect(await db.gameRecords.get('game-1')).toEqual({
      id: 'game-1',
      game: 'caro',
      level: 'hard',
      result: 'loss',
      details: { size: 9, moves: 31, firstMover: 'computer', undos: 0 },
      startedAt: clock.now() - 20 * MIN,
      endedAt: clock.now(),
      localDate: '2026-11-25',
    });
  });

  it('lists only Caro games, newest first, and skips rows it cannot read', async () => {
    const base = { startedAt: 1, localDate: '2026-11-01' };
    await db.gameRecords.bulkPut([
      {
        id: 'old',
        game: 'caro',
        level: 'easy',
        result: 'win',
        details: { size: 15, moves: 12 },
        endedAt: 100,
        ...base,
      },
      {
        id: 'new',
        game: 'caro',
        level: 'hard',
        result: 'draw',
        details: { size: 9, moves: 81 },
        endedAt: 200,
        ...base,
      },
      {
        id: 'chess',
        game: 'chess',
        level: 'easy',
        result: 'win',
        details: { size: 15, moves: 3 },
        endedAt: 300,
        ...base,
      },
      {
        id: 'bad-level',
        game: 'caro',
        level: 'nope',
        result: 'win',
        details: { size: 15, moves: 3 },
        endedAt: 400,
        ...base,
      },
      { id: 'no-details', game: 'caro', level: 'easy', result: 'win', endedAt: 500, ...base },
    ]);
    const games = await loadFinishedGames(db);
    expect(games.map((g) => g.id)).toEqual(['new', 'old']);
    expect(games[0]).toMatchObject({ level: 'hard', outcome: 'draw', size: 9, moves: 81 });
  });
});

describe('finishGame', () => {
  const deps = () => ({ db, engine: new DexieTrainingEngine(db, clock), clock });

  it('records the result and one training session with XP, then clears the saved game', async () => {
    const d = draft();
    await saveDraft(db, { ...d, moves: WINNING_MOVES }, clock.now());
    const result = await finishGame(deps(), d, replay(15, WINNING_MOVES));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.session).toMatchObject({ duplicate: false, xpAwarded: 15 });
    expect(await db.gameRecords.get('game-1')).toMatchObject({ result: 'win', level: 'medium' });
    expect(await db.sessions.get('game-1')).toMatchObject({
      moduleId: 'caro',
      activityType: 'game_session',
      source: 'timer',
      score: 1,
      result: { game: 'caro', level: 'medium', outcome: 'win' },
    });
    expect(await db.xpLedger.count()).toBe(1);
    expect(await loadDraft(db)).toBeNull();
  });

  it('scores a loss 0 and still records the session', async () => {
    const lost = await finishGame(deps(), draft({ id: 'lost' }), replay(15, LOSING_MOVES));
    expect(lost.ok).toBe(true);
    expect(await db.gameRecords.get('lost')).toMatchObject({ result: 'loss' });
    expect(await db.sessions.get('lost')).toMatchObject({ score: 0, result: { outcome: 'loss' } });
  });

  it('scores a draw 0.5', async () => {
    const result = await finishGame(
      deps(),
      draft({ id: 'draw', size: 9 }),
      replay(9, drawMoves(9)),
    );
    expect(result.ok).toBe(true);
    expect(await db.gameRecords.get('draw')).toMatchObject({ result: 'draw' });
    expect(await db.sessions.get('draw')).toMatchObject({ score: 0.5 });
  });

  it('records the result but no session when the person made fewer than 5 moves', async () => {
    // The computer moves first (stone 1) and wins on its fifth stone: the person only had four.
    const quick = draft({ id: 'quick', humanStone: 2 });
    expect(await finishGame(deps(), quick, replay(15, WINNING_MOVES))).toEqual({
      ok: true,
      session: null,
    });
    expect(await db.gameRecords.get('quick')).toMatchObject({
      result: 'loss',
      details: { firstMover: 'computer' },
    });
    expect(await db.sessions.count()).toBe(0);
    expect(await db.xpLedger.count()).toBe(0);
  });

  it('is idempotent: finishing the same game twice awards XP once', async () => {
    const d = draft();
    const game = replay(15, WINNING_MOVES);
    await finishGame(deps(), d, game);
    const again = await finishGame(deps(), d, game);
    expect(again.ok && again.session?.duplicate).toBe(true);
    expect(await db.gameRecords.count()).toBe(1);
    expect(await db.sessions.count()).toBe(1);
    expect(await db.xpLedger.count()).toBe(1);
  });

  it('clamps a game left open for days so the session is still accepted', async () => {
    const d = draft({ startedAt: clock.now() - 3 * 24 * 60 * MIN });
    const result = await finishGame(deps(), d, replay(15, WINNING_MOVES));
    expect(result.ok).toBe(true);
    const row = await db.sessions.get('game-1');
    expect(row?.durationSec).toBe(11 * 60 * 60);
  });

  it('accepts a game that took under a second', async () => {
    const d = draft({ startedAt: clock.now() });
    const result = await finishGame(deps(), d, replay(15, WINNING_MOVES));
    expect(result.ok).toBe(true);
  });

  it('refuses an unfinished game', async () => {
    const result = await finishGame(deps(), draft(), replay(15, [i(7, 7)]));
    expect(result).toEqual({ ok: false, message: 'The game is not finished.' });
  });

  it('keeps the saved game when the session cannot be recorded, so a retry can finish it', async () => {
    const d = draft();
    await saveDraft(db, { ...d, moves: WINNING_MOVES }, clock.now());
    const failing = {
      ...deps(),
      engine: { recordSession: () => Promise.resolve(err(new AppError('IO', 'disk full'))) },
    };
    expect(await finishGame(failing, d, replay(15, WINNING_MOVES))).toEqual({
      ok: false,
      message: 'disk full',
    });
    expect(await loadDraft(db)).not.toBeNull();

    const retry = await finishGame(deps(), d, replay(15, WINNING_MOVES));
    expect(retry.ok).toBe(true);
    expect(await loadDraft(db)).toBeNull();
    expect(await db.xpLedger.count()).toBe(1);
  });
});
