import { otherStone, type BoardSize, type Stone } from './board';
import { stoneCount, stoneToMove, undoMoves, type GameState, type GameStatus } from './game';
import type { Level } from './ai/levels';
import type { CaroRule } from './rules';

export type Outcome = 'win' | 'loss' | 'draw';

/** Everything chosen on the setup screen. */
export interface CaroSetup {
  size: BoardSize;
  /** 'freestyle' (five or more wins) or 'blocked' (a five walled in at both ends does not win). */
  rule: CaroRule;
  /** Blocked squares, chosen once at game start and stored so a resumed game is identical. */
  obstacles: readonly number[];
  level: Level;
  /** The stone the person plays; 1 moves first. The computer plays the other. */
  humanStone: Stone;
}

/** A game in progress, as persisted: the setup plus the move history. */
export interface CaroDraft extends CaroSetup {
  /** Also the id of the stored result and of the training session, so recording is idempotent. */
  id: string;
  startedAt: number;
  moves: readonly number[];
  /** How many times the person took back a move (Easy only). Kept for honest stats. */
  undos: number;
}

/** A finished game must contain at least this many of the person's own moves to earn XP. */
export const MIN_PLAYER_MOVES_FOR_SESSION = 5;

export function outcomeOf(status: GameStatus, humanStone: Stone): Outcome | null {
  if (status.kind === 'playing') return null;
  if (status.kind === 'draw') return 'draw';
  return status.winner === humanStone ? 'win' : 'loss';
}

export const computerStone = (setup: Pick<CaroSetup, 'humanStone'>): Stone =>
  otherStone(setup.humanStone);

/**
 * UNDO RULE: only on Easy, only on the person's turn, and it takes back the person's last move
 * together with the computer's reply (a "pair"). Harder levels have no undo so a win or a loss
 * there means something; the draft counts undos so the stored record says when one was used.
 */
export function canUndo(game: GameState, setup: CaroSetup): boolean {
  return (
    setup.level === 'easy' &&
    game.status.kind === 'playing' &&
    stoneToMove(game) === setup.humanStone &&
    stoneCount(game, setup.humanStone) > 0
  );
}

export function undoPair(game: GameState): GameState {
  return undoMoves(game, 2);
}
