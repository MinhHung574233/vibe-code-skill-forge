import { Chess, type Square } from 'chess.js';
import { parseUci, playUci, toUci } from './rules';
import type { Puzzle } from './puzzles';

/**
 * One attempt at one puzzle, as plain data so the screen can keep it in state and tests can drive
 * it. `ply` indexes `puzzle.solution`: even = the solver's move is next, odd = the scripted reply.
 */
export interface PuzzleRun {
  puzzle: Puzzle;
  fen: string;
  /** UCI moves played so far, both sides. */
  played: string[];
  ply: number;
  status: 'playing' | 'solved' | 'revealed';
  mistakes: number;
  hints: number;
  /** Squares to highlight for the current hint (empty = no hint showing). */
  hintSquares: Square[];
}

export function startRun(puzzle: Puzzle): PuzzleRun {
  return {
    puzzle,
    fen: puzzle.fen,
    played: [],
    ply: 0,
    status: 'playing',
    mistakes: 0,
    hints: 0,
    hintSquares: [],
  };
}

export type MoveOutcome =
  | { kind: 'illegal' }
  | { kind: 'wrong'; run: PuzzleRun }
  | {
      kind: 'correct';
      /** The position after the solver's move. */
      run: PuzzleRun;
      /** The opponent's scripted answer, to be played with `applyReply`; null when solved. */
      reply: string | null;
    };

/** A move that delivers checkmate always counts: the goal is reached, whatever the author listed. */
export function tryMove(run: PuzzleRun, uci: string): MoveOutcome {
  if (run.status !== 'playing' || run.ply % 2 !== 0) return { kind: 'illegal' };
  const chess = new Chess(run.fen);
  if (!playUci(chess, uci)) return { kind: 'illegal' };

  const expected = run.puzzle.solution[run.ply];
  const mates = chess.isCheckmate();
  if (uci !== expected && !mates) {
    return { kind: 'wrong', run: { ...run, mistakes: run.mistakes + 1, hintSquares: [] } };
  }

  const nextPly = run.ply + 1;
  const done = mates || nextPly >= run.puzzle.solution.length;
  const after: PuzzleRun = {
    ...run,
    fen: chess.fen(),
    played: [...run.played, uci],
    ply: nextPly,
    status: done ? 'solved' : 'playing',
    hintSquares: [],
  };
  return { kind: 'correct', run: after, reply: done ? null : (run.puzzle.solution[nextPly] ?? null) };
}

/** Plays the scripted opponent move that follows a correct solver move. */
export function applyReply(run: PuzzleRun): PuzzleRun {
  const uci = run.puzzle.solution[run.ply];
  if (run.status !== 'playing' || run.ply % 2 !== 1 || !uci) return run;
  const chess = new Chess(run.fen);
  if (!playUci(chess, uci)) return run;
  return { ...run, fen: chess.fen(), played: [...run.played, uci], ply: run.ply + 1 };
}

/** First hint names the piece to move, the second also names where it goes. */
export function giveHint(run: PuzzleRun): PuzzleRun {
  const uci = run.puzzle.solution[run.ply];
  if (run.status !== 'playing' || run.ply % 2 !== 0 || !uci) return run;
  const { from, to } = parseUci(uci);
  const showing = run.hintSquares.length;
  return { ...run, hints: run.hints + 1, hintSquares: showing === 0 ? [from] : [from, to] };
}

/** Plays the next move of the stored solution, whoever it belongs to (the "show me" button). */
export function revealStep(run: PuzzleRun): PuzzleRun {
  const uci = run.puzzle.solution[run.ply];
  if (run.status === 'solved') return run;
  if (!uci) return { ...run, status: 'revealed', hintSquares: [] };
  const chess = new Chess(run.fen);
  const move = playUci(chess, uci);
  if (!move) return { ...run, status: 'revealed', hintSquares: [] };
  const ply = run.ply + 1;
  return {
    ...run,
    fen: chess.fen(),
    played: [...run.played, toUci(move)],
    ply,
    status: ply >= run.puzzle.solution.length || chess.isCheckmate() ? 'revealed' : 'playing',
    hintSquares: [],
  };
}

/** True when the run was solved on its own: no wrong move, no hint, no reveal. */
export const isCleanSolve = (run: PuzzleRun): boolean =>
  run.status === 'solved' && run.mistakes === 0 && run.hints === 0;

export interface PickOptions {
  /** Do not offer this puzzle (the one just played). */
  exclude?: string;
  random?: () => number;
}

/**
 * Next puzzle: the unsolved one closest to the player's puzzle rating, so difficulty follows
 * skill. Once everything is solved, a random solved puzzle is offered as practice (no XP).
 */
export function pickPuzzle(
  puzzles: readonly Puzzle[],
  solvedIds: ReadonlySet<string>,
  rating: number,
  { exclude, random = Math.random }: PickOptions = {},
): { puzzle: Puzzle; practice: boolean } | null {
  const pool = puzzles.filter((p) => p.id !== exclude);
  const unsolved = pool
    .filter((p) => !solvedIds.has(p.id))
    .sort((a, b) => Math.abs(a.rating - rating) - Math.abs(b.rating - rating));
  const best = unsolved[0];
  if (best) return { puzzle: best, practice: false };
  const solved = pool.length > 0 ? pool : [...puzzles];
  const pick = solved[Math.floor(random() * solved.length)];
  return pick ? { puzzle: pick, practice: true } : null;
}
