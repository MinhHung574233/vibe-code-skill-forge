import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SkillForgeDB } from '@/db/schema';
import {
  GAME_DRAFT_KEY,
  PLAY_RATING_KEY,
  PUZZLE_RATING_KEY,
  clearGameDraft,
  loadChessSummary,
  loadGameDraft,
  loadPuzzleProgress,
  loadRatings,
  recordFinishedGame,
  recordPuzzleOutcome,
  saveGameDraft,
  type FinishedGame,
} from './chessRepository';

const NAME = 'chess-repo-test';
const DAY = 86_400_000;
const T0 = Date.UTC(2026, 5, 10, 12, 0, 0);
let db: SkillForgeDB;

beforeEach(async () => {
  db = new SkillForgeDB(NAME);
  await db.open();
});

afterEach(async () => {
  db.close();
  await Dexie.delete(NAME);
});

const outcome = (over: Partial<Parameters<typeof recordPuzzleOutcome>[1]> = {}) => ({
  puzzleId: 'p1',
  puzzleRating: 1000,
  solved: true,
  clean: true,
  now: T0,
  ...over,
});

describe('puzzle outcomes', () => {
  it('starts every rating at 1000', async () => {
    const ratings = await loadRatings(db);
    expect(ratings.puzzle).toEqual({ value: 1000, games: 0 });
    expect(ratings.play).toEqual({ value: 1000, games: 0 });
  });

  it('a clean first solve is a rating win, marks the puzzle solved and reports a first solve', async () => {
    const result = await recordPuzzleOutcome(db, outcome());
    expect(result.firstSolve).toBe(true);
    expect(result.rating).toMatchObject({ value: 1020, delta: 20, games: 1 });
    expect(await db.puzzleProgress.get('p1')).toEqual({
      puzzleId: 'p1',
      game: 'chess',
      solved: 1,
      attempts: 1,
      lastAttemptAt: T0,
      solvedAt: T0,
    });
    expect(await db.ratings.get(PUZZLE_RATING_KEY)).toMatchObject({ value: 1020, games: 1 });
  });

  it('a failure is a rating loss and leaves the puzzle unsolved', async () => {
    const result = await recordPuzzleOutcome(db, outcome({ solved: false, clean: false }));
    expect(result.firstSolve).toBe(false);
    expect(result.rating?.delta).toBe(-20);
    expect((await db.puzzleProgress.get('p1'))?.solved).toBe(0);
    expect((await db.puzzleProgress.get('p1'))?.solvedAt).toBeUndefined();
  });

  it('rates a puzzle only once: solving it after failing it, or again later, does not move the rating', async () => {
    await recordPuzzleOutcome(db, outcome({ solved: false, clean: false }));
    const after = await recordPuzzleOutcome(db, outcome({ clean: false, now: T0 + 1000 }));
    expect(after.firstSolve).toBe(true); // XP is still due for the first solve
    expect(after.rating).toBeNull();
    const again = await recordPuzzleOutcome(db, outcome({ now: T0 + 2000 }));
    expect(again.firstSolve).toBe(false);
    expect(again.rating).toBeNull();
    expect((await loadRatings(db)).puzzle).toEqual({ value: 980, games: 1 });
    const row = await db.puzzleProgress.get('p1');
    expect(row).toMatchObject({ solved: 1, attempts: 3, solvedAt: T0 + 1000, lastAttemptAt: T0 + 2000 });
  });

  it('hint-assisted first solve counts as a loss for the rating but is still solved', async () => {
    const result = await recordPuzzleOutcome(db, outcome({ clean: false }));
    expect(result.firstSolve).toBe(true);
    expect(result.rating?.delta).toBe(-20);
    expect((await db.puzzleProgress.get('p1'))?.solved).toBe(1);
  });

  it('a reveal after solving never un-solves a puzzle', async () => {
    await recordPuzzleOutcome(db, outcome());
    await recordPuzzleOutcome(db, outcome({ solved: false, clean: false, now: T0 + 5 }));
    expect((await db.puzzleProgress.get('p1'))?.solved).toBe(1);
  });

  it('loads only chess progress', async () => {
    await recordPuzzleOutcome(db, outcome());
    await db.puzzleProgress.put({
      puzzleId: 'go-1',
      game: 'go',
      solved: 1,
      attempts: 1,
      lastAttemptAt: T0,
    });
    expect([...(await loadPuzzleProgress(db)).keys()]).toEqual(['p1']);
  });
});

describe('game draft', () => {
  const draft = {
    id: 'g1',
    startedAt: T0,
    level: 'medium' as const,
    color: 'b' as const,
    moves: ['e2e4', 'e7e5'],
    undos: 1,
  };

  it('round-trips, overwrites, and clears', async () => {
    expect(await loadGameDraft(db)).toBeNull();
    await saveGameDraft(db, draft, T0);
    expect(await loadGameDraft(db)).toEqual(draft);
    await saveGameDraft(db, { ...draft, moves: [...draft.moves, 'g1f3'] }, T0 + 1);
    expect((await loadGameDraft(db))?.moves).toHaveLength(3);
    expect(await db.drafts.count()).toBe(1);
    await clearGameDraft(db);
    expect(await loadGameDraft(db)).toBeNull();
  });

  it('treats a corrupt draft as no draft instead of throwing', async () => {
    await db.drafts.put({ key: GAME_DRAFT_KEY, value: { id: 'x', moves: ['not-a-move'] }, updatedAt: T0 });
    expect(await loadGameDraft(db)).toBeNull();
  });
});

describe('finished games', () => {
  const game = (over: Partial<FinishedGame> = {}): FinishedGame => ({
    id: 'g1',
    level: 'medium',
    color: 'w',
    result: 'win',
    reason: 'checkmate',
    moves: ['e2e4', 'e7e5'],
    pgn: '1. e4 e5',
    playerMoves: 12,
    undos: 0,
    startedAt: T0,
    endedAt: T0 + 60_000,
    opponentRating: 1000,
    ...over,
  });

  it('stores the record with its details, rates the game and drops the draft atomically', async () => {
    await saveGameDraft(
      db,
      { id: 'g1', startedAt: T0, level: 'medium', color: 'w', moves: ['e2e4'], undos: 0 },
      T0,
    );
    const result = await recordFinishedGame(db, game());
    expect(result.rated).toBe(true);
    expect(result.rating).toMatchObject({ value: 1020, delta: 20 });
    const row = await db.gameRecords.get('g1');
    expect(row).toMatchObject({ game: 'chess', level: 'medium', result: 'win' });
    expect(row?.details).toMatchObject({
      color: 'w',
      reason: 'checkmate',
      moves: ['e2e4', 'e7e5'],
      pgn: '1. e4 e5',
      ratingDelta: 20,
    });
    expect(row?.localDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(await db.ratings.get(PLAY_RATING_KEY)).toMatchObject({ value: 1020, games: 1 });
    expect(await loadGameDraft(db)).toBeNull();
  });

  it('does not rate games shorter than five of the player’s moves, but still records them', async () => {
    const result = await recordFinishedGame(db, game({ playerMoves: 4, result: 'loss' }));
    expect(result).toEqual({ rating: null, rated: false });
    expect(await db.gameRecords.count()).toBe(1);
    expect(await db.ratings.get(PLAY_RATING_KEY)).toBeUndefined();
  });

  it('a draw against an equal opponent leaves the rating unchanged; a loss lowers it', async () => {
    await recordFinishedGame(db, game({ id: 'a', result: 'draw' }));
    expect((await loadRatings(db)).play.value).toBe(1000);
    await recordFinishedGame(db, game({ id: 'b', result: 'loss' }));
    expect((await loadRatings(db)).play).toEqual({ value: 980, games: 2 });
  });
});

describe('summary', () => {
  it('combines ratings, solved puzzles, the puzzle-day streak, the record and the draft', async () => {
    const now = T0 + 2 * DAY;
    await recordPuzzleOutcome(db, outcome({ puzzleId: 'a', now: T0 }));
    await recordPuzzleOutcome(db, outcome({ puzzleId: 'b', now: T0 + DAY }));
    await recordPuzzleOutcome(db, outcome({ puzzleId: 'c', now: T0 + 2 * DAY }));
    await recordPuzzleOutcome(db, outcome({ puzzleId: 'd', solved: false, clean: false, now }));
    await recordFinishedGame(db, {
      id: 'g',
      level: 'easy',
      color: 'w',
      result: 'win',
      reason: 'checkmate',
      moves: [],
      pgn: '',
      playerMoves: 9,
      undos: 0,
      startedAt: T0,
      endedAt: now,
      opponentRating: 700,
    });
    await saveGameDraft(
      db,
      { id: 'next', startedAt: now, level: 'hard', color: 'w', moves: [], undos: 0 },
      now,
    );

    const summary = await loadChessSummary(db, now);
    expect(summary.puzzlesSolved).toBe(3);
    expect(summary.solvedIds).toEqual(new Set(['a', 'b', 'c']));
    expect(summary.puzzleStreakDays).toBe(3);
    expect(summary.games).toEqual({ wins: 1, draws: 0, losses: 0 });
    expect(summary.draft?.id).toBe('next');
    expect(summary.ratings.play.games).toBe(1);
  });
});
