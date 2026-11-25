import { z } from 'zod';
import { toLocalDate } from '@/core/time/localDate';
import type { GameRecordRow, PuzzleProgressRow, RatingRow } from '@/db/rows';
import type { SkillForgeDB } from '@/db/schema';
import { INITIAL_RATING, updateRating, type RatingState, type RatingUpdate } from '../domain/rating';
import { puzzleStreakDays, tally, type GameTally } from '../domain/stats';

export const PUZZLE_RATING_KEY = 'chess-puzzle';
export const PLAY_RATING_KEY = 'chess-play';
export const GAME_DRAFT_KEY = 'chess-game';

/** Games shorter than this many moves by the player are recorded but neither rated nor rewarded. */
export const MIN_RATED_PLAYER_MOVES = 5;

function toState(row: RatingRow | undefined): RatingState {
  return row ? { value: row.value, games: row.games } : INITIAL_RATING;
}

export interface Ratings {
  puzzle: RatingState;
  play: RatingState;
}

export async function loadRatings(db: SkillForgeDB): Promise<Ratings> {
  const [puzzle, play] = await db.ratings.bulkGet([PUZZLE_RATING_KEY, PLAY_RATING_KEY]);
  return { puzzle: toState(puzzle), play: toState(play) };
}

async function applyRating(
  db: SkillForgeDB,
  key: string,
  opponent: number,
  score: number,
  now: number,
): Promise<RatingUpdate> {
  const update = updateRating(toState(await db.ratings.get(key)), opponent, score);
  await db.ratings.put({ key, value: update.value, games: update.games, updatedAt: now });
  return update;
}

export async function loadPuzzleProgress(db: SkillForgeDB): Promise<Map<string, PuzzleProgressRow>> {
  const rows = await db.puzzleProgress.where('game').equals('chess').toArray();
  return new Map(rows.map((r) => [r.puzzleId, r]));
}

export interface PuzzleOutcome {
  puzzleId: string;
  /** Authored difficulty, used as the opponent rating. */
  puzzleRating: number;
  /** The puzzle was solved (possibly after mistakes or hints). False = failed or revealed. */
  solved: boolean;
  /** Solved with no mistake and no hint. */
  clean: boolean;
  now: number;
}

export interface PuzzleRecordResult {
  /** First time this puzzle is solved: the caller awards XP for it. */
  firstSolve: boolean;
  /** Present only when this outcome changed the puzzle rating. */
  rating: RatingUpdate | null;
}

/**
 * Stores one puzzle outcome. The puzzle rating moves at most once per puzzle, on its first
 * recorded outcome (clean solve = win, anything else = loss), so retrying cannot farm rating.
 * `attempts` counts recorded outcomes.
 */
export async function recordPuzzleOutcome(
  db: SkillForgeDB,
  outcome: PuzzleOutcome,
): Promise<PuzzleRecordResult> {
  return db.transaction('rw', [db.puzzleProgress, db.ratings], async () => {
    const existing = await db.puzzleProgress.get(outcome.puzzleId);
    const alreadySolved = existing?.solved === 1;
    const solved = alreadySolved || outcome.solved;
    const row: PuzzleProgressRow = {
      puzzleId: outcome.puzzleId,
      game: 'chess',
      solved: solved ? 1 : 0,
      attempts: (existing?.attempts ?? 0) + 1,
      lastAttemptAt: outcome.now,
      ...(solved ? { solvedAt: existing?.solvedAt ?? outcome.now } : {}),
    };
    await db.puzzleProgress.put(row);
    const rating = existing
      ? null
      : await applyRating(
          db,
          PUZZLE_RATING_KEY,
          outcome.puzzleRating,
          outcome.solved && outcome.clean ? 1 : 0,
          outcome.now,
        );
    return { firstSolve: outcome.solved && !alreadySolved, rating };
  });
}

/* ---- games ---- */

const GameDraftSchema = z.object({
  id: z.string().min(1),
  startedAt: z.number().int().positive(),
  level: z.enum(['easy', 'medium', 'hard']),
  color: z.enum(['w', 'b']),
  /** UCI moves from the standard start position. */
  moves: z.array(z.string().regex(/^[a-h][1-8][a-h][1-8][qrbn]?$/)),
  undos: z.number().int().nonnegative().default(0),
});
export type GameDraft = z.infer<typeof GameDraftSchema>;

export async function loadGameDraft(db: SkillForgeDB): Promise<GameDraft | null> {
  const row = await db.drafts.get(GAME_DRAFT_KEY);
  const parsed = GameDraftSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : null; // missing or corrupt: no game to resume
}

export async function saveGameDraft(db: SkillForgeDB, draft: GameDraft, now: number): Promise<void> {
  await db.drafts.put({ key: GAME_DRAFT_KEY, value: draft, updatedAt: now });
}

export async function clearGameDraft(db: SkillForgeDB): Promise<void> {
  await db.drafts.delete(GAME_DRAFT_KEY);
}

export interface FinishedGame {
  id: string;
  level: 'easy' | 'medium' | 'hard';
  color: 'w' | 'b';
  result: 'win' | 'loss' | 'draw';
  reason: string;
  moves: readonly string[];
  pgn: string;
  /** Moves made by the human. */
  playerMoves: number;
  undos: number;
  startedAt: number;
  endedAt: number;
  /** Rating of the engine level, used as the opponent. */
  opponentRating: number;
}

export interface GameRecordResult {
  /** Present when the game was long enough to be rated. */
  rating: RatingUpdate | null;
  rated: boolean;
}

const SCORE = { win: 1, draw: 0.5, loss: 0 } as const;

/** Saves the game, updates the play rating (if rated) and drops the resume draft atomically. */
export async function recordFinishedGame(
  db: SkillForgeDB,
  game: FinishedGame,
): Promise<GameRecordResult> {
  return db.transaction('rw', [db.gameRecords, db.ratings, db.drafts], async () => {
    const rated = game.playerMoves >= MIN_RATED_PLAYER_MOVES;
    const rating = rated
      ? await applyRating(db, PLAY_RATING_KEY, game.opponentRating, SCORE[game.result], game.endedAt)
      : null;
    const row: GameRecordRow = {
      id: game.id,
      game: 'chess',
      level: game.level,
      result: game.result,
      details: {
        color: game.color,
        reason: game.reason,
        moves: [...game.moves],
        plies: game.moves.length,
        pgn: game.pgn,
        undos: game.undos,
        ...(rating ? { ratingDelta: rating.delta } : {}),
      },
      startedAt: game.startedAt,
      endedAt: game.endedAt,
      localDate: toLocalDate(game.endedAt),
    };
    await db.gameRecords.put(row);
    await db.drafts.delete(GAME_DRAFT_KEY);
    return { rating, rated };
  });
}

/* ---- module home ---- */

export interface ChessSummary {
  ratings: Ratings;
  puzzlesSolved: number;
  puzzleStreakDays: number;
  games: GameTally;
  draft: GameDraft | null;
  solvedIds: ReadonlySet<string>;
}

export async function loadChessSummary(db: SkillForgeDB, now: number): Promise<ChessSummary> {
  const [ratings, progress, records, draft] = await Promise.all([
    loadRatings(db),
    loadPuzzleProgress(db),
    db.gameRecords.where('game').equals('chess').toArray(),
    loadGameDraft(db),
  ]);
  const solved = [...progress.values()].filter((p) => p.solved === 1);
  return {
    ratings,
    puzzlesSolved: solved.length,
    puzzleStreakDays: puzzleStreakDays(
      solved.flatMap((p) => (p.solvedAt === undefined ? [] : [p.solvedAt])),
      now,
    ),
    games: tally(records.map((r) => r.result)),
    draft,
    solvedIds: new Set(solved.map((p) => p.puzzleId)),
  };
}
