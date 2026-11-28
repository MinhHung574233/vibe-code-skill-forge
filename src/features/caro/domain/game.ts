import { OBSTACLE, type BoardSize, type Stone } from './board';
import { isDeadFive, winningLine, type CaroRule } from './rules';

export type GameStatus =
  { kind: 'playing' } | { kind: 'won'; winner: Stone; line: readonly number[] } | { kind: 'draw' };

/** An immutable game position. `moves` is the full history (cell indexes), stone 1 first. */
export interface GameState {
  readonly size: BoardSize;
  readonly rule: CaroRule;
  /** Blocked squares (cell indexes): unplayable, shown as OBSTACLE in `cells`. */
  readonly obstacles: readonly number[];
  /** 0 empty, 1 / 2 stones, OBSTACLE blocked. Never mutate: `playMove` returns a new state. */
  readonly cells: Uint8Array;
  readonly moves: readonly number[];
  readonly status: GameStatus;
}

/** The optional parts of a game: the rule (default freestyle) and the blocked squares (none). */
export interface GameOptions {
  rule?: CaroRule;
  obstacles?: readonly number[];
}

export function newGame(size: BoardSize, options: GameOptions = {}): GameState {
  const obstacles = options.obstacles ?? [];
  const cells = new Uint8Array(size * size);
  for (const cell of obstacles) {
    if (!Number.isInteger(cell) || cell < 0 || cell >= cells.length) {
      throw new RangeError(`Blocked square ${cell} is off the board`);
    }
    cells[cell] = OBSTACLE;
  }
  return {
    size,
    rule: options.rule ?? 'freestyle',
    obstacles,
    cells,
    moves: [],
    status: { kind: 'playing' },
  };
}

/** How many squares can ever be played (the board minus the blocked squares). */
export const playableCells = (game: GameState): number => game.cells.length - game.obstacles.length;

export function stoneToMove(game: GameState): Stone {
  return game.moves.length % 2 === 0 ? 1 : 2;
}

export function isLegalMove(game: GameState, index: number): boolean {
  return (
    game.status.kind === 'playing' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < game.cells.length &&
    game.cells[index] === 0
  );
}

/** Throws on an illegal move: callers check `isLegalMove` first, so this is a programmer error. */
export function playMove(game: GameState, index: number): GameState {
  if (!isLegalMove(game, index)) throw new RangeError(`Illegal move ${index}`);
  const stone = stoneToMove(game);
  const cells = game.cells.slice();
  cells[index] = stone;
  const moves = [...game.moves, index];
  const line = winningLine(cells, game.size, index, game.rule);
  const status: GameStatus = line
    ? { kind: 'won', winner: stone, line }
    : moves.length === playableCells(game)
      ? { kind: 'draw' }
      : { kind: 'playing' };
  return { ...game, cells, moves, status };
}

/** Rebuilds a position from its move list (used to resume a saved game). */
export function replay(
  size: BoardSize,
  moves: readonly number[],
  options: GameOptions = {},
): GameState {
  return moves.reduce(playMove, newGame(size, options));
}

/** Takes back the last `count` moves. */
export function undoMoves(game: GameState, count: number): GameState {
  return replay(game.size, game.moves.slice(0, Math.max(0, game.moves.length - count)), game);
}

/**
 * The 0-based index of the first move that completed five or more which the 'blocked' rule
 * rejects (both ends walled), or null. Always null under 'freestyle'. Drives the one-time hint.
 */
export function firstDeadFive(game: GameState): number | null {
  if (game.rule !== 'blocked') return null;
  const cells = newGame(game.size, game).cells;
  for (let k = 0; k < game.moves.length; k++) {
    const move = game.moves[k]!;
    cells[move] = k % 2 === 0 ? 1 : 2;
    if (isDeadFive(cells, game.size, move)) return k;
  }
  return null;
}

/** How many stones `stone` has played (stone 1 moves on even move counts). */
export function stoneCount(game: GameState, stone: Stone): number {
  const total = game.moves.length;
  return stone === 1 ? Math.ceil(total / 2) : Math.floor(total / 2);
}
