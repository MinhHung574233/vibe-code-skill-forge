import { z } from 'zod';
import { toLocalDate } from '@/core/time/localDate';
import type { GameRecordRow, PuzzleProgressRow, RatingRow } from '@/db/rows';
import type { SkillForgeDB } from '@/db/schema';
import {
  INITIAL_RATING,
  updateRating,
  type RatingState,
  type RatingUpdate,
} from '../domain/rating';
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

/**
 * Opening-drill progress shares the `puzzleProgress` store (no schema change) under ids that start
 * with this prefix. Puzzle code never sees those rows.
 */
export const OPENING_ID_PREFIX = 'opening:';

export async function loadPuzzleProgress(
  db: SkillForgeDB,
): Promise<Map<string, PuzzleProgressRow>> {
  const rows = await db.puzzleProgress.where('game').equals('chess').toArray();
  return new Map(
    rows.filter((r) => !r.puzzleId.startsWith(OPENING_ID_PREFIX)).map((r) => [r.puzzleId, r]),
  );
}

/** What is known about one opening line: finished at least once, how often, and how cleanly. */
export interface OpeningProgress {
  openingId: string;
  /** Times the whole line was played through. */
  completions: number;
  firstCompletedAt: number;
  lastCompletedAt: number;
  /** Slips and hints in the cleanest run so far (0 = no mistakes). */
  bestMistakes: number;
  /** Slips and hints in the most recent run. */
  lastMistakes: number;
}

/** The stored shape: a `PuzzleProgressRow` plus two extra counters (backups keep unknown fields). */
interface OpeningProgressRow extends PuzzleProgressRow {
  bestMistakes?: number;
  lastMistakes?: number;
}

function toOpeningProgress(row: OpeningProgressRow): OpeningProgress {
  const last = Math.max(0, Math.floor(row.lastMistakes ?? 0));
  return {
    openingId: row.puzzleId.slice(OPENING_ID_PREFIX.length),
    completions: row.attempts,
    firstCompletedAt: row.solvedAt ?? row.lastAttemptAt,
    lastCompletedAt: row.lastAttemptAt,
    bestMistakes: Math.max(0, Math.floor(row.bestMistakes ?? last)),
    lastMistakes: last,
  };
}

/** Completed opening lines by opening id. */
export async function loadOpeningProgress(db: SkillForgeDB): Promise<Map<string, OpeningProgress>> {
  const rows = await db.puzzleProgress.where('game').equals('chess').toArray();
  const progress = rows
    .filter((r) => r.puzzleId.startsWith(OPENING_ID_PREFIX) && r.solved === 1)
    .map((r) => toOpeningProgress(r));
  return new Map(progress.map((p) => [p.openingId, p]));
}

/** Notes one finished run of an opening line (`mistakes` = slips, hints and revealed moves). */
export async function recordOpeningRun(
  db: SkillForgeDB,
  openingId: string,
  mistakes: number,
  now: number,
): Promise<OpeningProgress> {
  const key = `${OPENING_ID_PREFIX}${openingId}`;
  const clean = Math.max(0, Math.floor(mistakes));
  return db.transaction('rw', db.puzzleProgress, async () => {
    const before = await db.puzzleProgress.get(key);
    const prev = before ? toOpeningProgress(before) : null;
    const row: OpeningProgressRow = {
      puzzleId: key,
      game: 'chess',
      solved: 1,
      attempts: (before?.attempts ?? 0) + 1,
      lastAttemptAt: now,
      solvedAt: before?.solvedAt ?? now,
      bestMistakes: prev ? Math.min(prev.bestMistakes, clean) : clean,
      lastMistakes: clean,
    };
    await db.puzzleProgress.put(row);
    return toOpeningProgress(row);
  });
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

/** One graded move of a coach game (see domain/coach.ts), kept so a resumed game keeps its review. */
const MoveReviewSchema = z.object({
  ply: z.number().int().nonnegative(),
  san: z.string(),
  bestSan: z.string(),
  grade: z.enum(['best', 'good', 'inaccuracy', 'mistake', 'blunder']),
  lossCp: z.number().nonnegative(),
});

const GameDraftSchema = z.object({
  id: z.string().min(1),
  startedAt: z.number().int().positive(),
  level: z.enum(['easy', 'medium', 'hard']),
  color: z.enum(['w', 'b']),
  /** UCI moves from the standard start position. */
  moves: z.array(z.string().regex(/^[a-h][1-8][a-h][1-8][qrbn]?$/)),
  undos: z.number().int().nonnegative().default(0),
  /** Present only for coach games (learning mode: take-backs allowed, never rated). */
  coach: z.object({ reviews: z.array(MoveReviewSchema).default([]) }).optional(),
  /**
   * Present once the game is over and until its result is safely recorded. A game that could not be
   * saved keeps this, so resuming it offers "Try saving again" instead of losing the result.
   */
  finished: z
    .object({
      outcome: z.enum(['win', 'loss', 'draw']),
      reason: z.string().min(1),
      endedAt: z.number().int().positive(),
    })
    .optional(),
});
export type GameDraft = z.infer<typeof GameDraftSchema>;

export async function loadGameDraft(db: SkillForgeDB): Promise<GameDraft | null> {
  const row = await db.drafts.get(GAME_DRAFT_KEY);
  const parsed = GameDraftSchema.safeParse(row?.value);
  return parsed.success ? parsed.data : null; // missing or corrupt: no game to resume
}

export async function saveGameDraft(
  db: SkillForgeDB,
  draft: GameDraft,
  now: number,
): Promise<void> {
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
  /** A coach game: take-backs and hints make it a lesson, so it never changes the rating. */
  coached?: boolean;
}

export interface GameRecordResult {
  /** Present when the game was long enough to be rated (and was not a coach game). */
  rating: RatingUpdate | null;
  rated: boolean;
  /** Long enough to count as practice (XP); true for coach games too. */
  rewarded: boolean;
  coached: boolean;
}

const SCORE = { win: 1, draw: 0.5, loss: 0 } as const;

/**
 * Saves the game and updates the play rating in one transaction. Idempotent per game id: when the
 * game is already stored (an earlier attempt got this far) nothing is rated twice and the stored
 * outcome is returned. The resume draft is NOT removed here: the caller drops it once everything
 * that belongs to the game (the training session) is recorded too.
 */
export async function recordFinishedGame(
  db: SkillForgeDB,
  game: FinishedGame,
): Promise<GameRecordResult> {
  return db.transaction('rw', [db.gameRecords, db.ratings], async () => {
    const coached = game.coached === true;
    const rewarded = game.playerMoves >= MIN_RATED_PLAYER_MOVES;
    const rated = rewarded && !coached;

    const existing = await db.gameRecords.get(game.id);
    if (existing) {
      const delta = existing.details?.['ratingDelta'];
      const after = existing.details?.['ratingAfter'];
      const current = toState(await db.ratings.get(PLAY_RATING_KEY));
      const rating: RatingUpdate | null =
        rated && typeof delta === 'number'
          ? {
              value: typeof after === 'number' ? after : current.value,
              games: current.games,
              delta,
            }
          : null;
      return { rating, rated, rewarded, coached };
    }

    const rating = rated
      ? await applyRating(
          db,
          PLAY_RATING_KEY,
          game.opponentRating,
          SCORE[game.result],
          game.endedAt,
        )
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
        ...(coached ? { coached: true } : {}),
        ...(rating ? { ratingDelta: rating.delta, ratingAfter: rating.value } : {}),
      },
      startedAt: game.startedAt,
      endedAt: game.endedAt,
      localDate: toLocalDate(game.endedAt),
    };
    await db.gameRecords.put(row);
    return { rating, rated, rewarded, coached };
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
    // coach games had take-backs and hints: they stay in the history but not in the record
    games: tally(records.filter((r) => r.details?.['coached'] !== true).map((r) => r.result)),
    draft,
    solvedIds: new Set(solved.map((p) => p.puzzleId)),
  };
}
