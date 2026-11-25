import Dexie from 'dexie';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FakeClock } from '@/core/time/clock';
import { DexieTrainingEngine } from '@/features/training/data/trainingEngine';
import { SkillForgeDB } from '@/db/schema';
import {
  clearDraft,
  GO_DRAFT_KEY,
  loadDraft,
  saveDraft,
  draftToSerialized,
  type GoDraft,
} from './goDraft';
import { DexieGoRepository, type FinishedGame } from './goRepository';
import { newGame, playStone, restoreGame } from '../domain/game';
import { BLACK } from '../domain/board';

const NAME = 'go-data-test';
let db: SkillForgeDB;
let clock: FakeClock;
let repo: DexieGoRepository;

beforeEach(async () => {
  db = new SkillForgeDB(NAME);
  await db.open();
  clock = new FakeClock(Date.UTC(2026, 5, 1, 12));
  repo = new DexieGoRepository(db, clock);
});

afterEach(async () => {
  db.close();
  await Dexie.delete(NAME);
});

const finished = (over: Partial<FinishedGame> = {}): FinishedGame => ({
  id: 'g1',
  level: 'easy',
  size: 9,
  komi: 6.5,
  handicap: 0,
  color: 'black',
  result: 'win',
  margin: 3.5,
  by: 'score',
  startedAt: clock.now() - 600_000,
  endedAt: clock.now(),
  moves: [40, 41, null, null],
  ...over,
});

const draft = (over: Partial<GoDraft> = {}): GoDraft => ({
  gameId: 'g1',
  startedAt: 1_000,
  level: 'medium',
  humanColor: 'white',
  config: { size: 13, komi: 0.5, handicap: 3 },
  moves: [10, null, 20],
  resignedBy: null,
  seed: 99,
  ...over,
});

describe('game records', () => {
  it('stores a finished game as a go game record with its details', async () => {
    await repo.saveGame(finished());
    const row = await db.gameRecords.get('g1');
    expect(row).toMatchObject({
      game: 'go',
      level: 'easy',
      result: 'win',
      details: { size: 9, komi: 6.5, handicap: 0, color: 'black', margin: 3.5, by: 'score' },
    });
    expect(row?.localDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(row?.details?.['moves']).toEqual([40, 41, null, null]);
  });

  it('is idempotent per game id', async () => {
    await repo.saveGame(finished());
    await repo.saveGame(finished({ margin: 9 }));
    expect(await db.gameRecords.count()).toBe(1);
  });

  it('lists the newest first and respects the limit', async () => {
    await repo.saveGame(finished({ id: 'old', endedAt: 1_000, startedAt: 500 }));
    await repo.saveGame(finished({ id: 'new', endedAt: 9_000, startedAt: 8_000, result: 'loss' }));
    await repo.saveGame(finished({ id: 'mid', endedAt: 5_000, startedAt: 4_000, result: 'draw' }));
    expect((await repo.games()).map((g) => g.id)).toEqual(['new', 'mid', 'old']);
    expect((await repo.games(2)).map((g) => g.id)).toEqual(['new', 'mid']);
  });

  it('ignores records of other games and rows it cannot read', async () => {
    await db.gameRecords.put({
      id: 'chess-1',
      game: 'chess',
      level: 'easy',
      result: 'win',
      startedAt: 1,
      endedAt: 2,
      localDate: '2026-01-01',
    });
    await db.gameRecords.put({
      id: 'broken',
      game: 'go',
      level: 'easy',
      result: 'win',
      details: { size: 'big' },
      startedAt: 1,
      endedAt: 3,
      localDate: '2026-01-01',
    });
    await repo.saveGame(finished());
    expect((await repo.games()).map((g) => g.id)).toEqual(['g1']);
  });
});

describe('puzzle progress', () => {
  it('counts attempts, marks the first solve once, and keeps solved', async () => {
    expect(await repo.recordPuzzleAttempt('p1', false)).toEqual({ firstSolve: false });
    clock.advance(1000);
    expect(await repo.recordPuzzleAttempt('p1', true)).toEqual({ firstSolve: true });
    const solvedAt = clock.now();
    clock.advance(1000);
    expect(await repo.recordPuzzleAttempt('p1', true)).toEqual({ firstSolve: false });
    expect(await repo.recordPuzzleAttempt('p1', false)).toEqual({ firstSolve: false });

    const row = (await repo.puzzleProgress()).get('p1');
    expect(row).toMatchObject({ game: 'go', solved: 1, attempts: 4, solvedAt });
  });

  it('keeps puzzles of other games out', async () => {
    await db.puzzleProgress.put({
      puzzleId: 'chess-1',
      game: 'chess',
      solved: 1,
      attempts: 1,
      lastAttemptAt: 1,
    });
    await repo.recordPuzzleAttempt('p1', false);
    expect([...(await repo.puzzleProgress()).keys()]).toEqual(['p1']);
  });

  it('a first solve recorded through the engine awards XP exactly once', async () => {
    const engine = new DexieTrainingEngine(db, clock);
    const record = async () =>
      engine.recordSession({
        id: 'go-puzzle:p1',
        moduleId: 'go',
        activityType: 'game_session',
        startedAt: clock.now() - 5_000,
        endedAt: clock.now(),
        source: 'timer',
        score: 1,
        result: { kind: 'tsumego', puzzleId: 'p1' },
      });
    const first = await record();
    const second = await record();
    expect(first.ok && first.value.xpAwarded).toBeGreaterThan(0);
    expect(second.ok && second.value.duplicate).toBe(true);
    expect(await db.sessions.count()).toBe(1);
  });
});

describe('in-progress game draft', () => {
  it('round-trips under the go-game key', async () => {
    await saveDraft(db, draft(), clock.now());
    expect((await db.drafts.get(GO_DRAFT_KEY))?.updatedAt).toBe(clock.now());
    expect(await loadDraft(db)).toEqual(draft());
  });

  it('is replaced, not duplicated, and can be cleared', async () => {
    await saveDraft(db, draft(), 1);
    await saveDraft(db, draft({ moves: [10, null, 20, 30] }), 2);
    expect(await db.drafts.count()).toBe(1);
    expect((await loadDraft(db))?.moves).toHaveLength(4);
    await clearDraft(db);
    expect(await loadDraft(db)).toBeNull();
  });

  it('treats corrupt or impossible drafts as "no game"', async () => {
    await db.drafts.put({ key: GO_DRAFT_KEY, value: { garbage: true }, updatedAt: 1 });
    expect(await loadDraft(db)).toBeNull();
    await db.drafts.put({
      key: GO_DRAFT_KEY,
      value: draft({ config: { size: 9, komi: 6.5, handicap: 7 } }),
      updatedAt: 2,
    });
    expect(await loadDraft(db)).toBeNull();
  });

  it('converts to a replayable game record', () => {
    let state = newGame({ size: 9, komi: 6.5, handicap: 0 });
    const played = playStone(state, 40);
    if (!played.ok) throw new Error('rejected');
    state = played.state;
    const stored = draft({
      config: { size: 9, komi: 6.5, handicap: 0 },
      moves: [40],
      resignedBy: 'black',
    });
    const restored = restoreGame(draftToSerialized(stored));
    expect(restored?.board.equals(state.board)).toBe(true);
    expect(restored?.resignedBy).toBe(BLACK);
  });
});
