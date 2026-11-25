import type { BoardSize, Stone } from './board';
import { winningLine } from './rules';

export type GameStatus =
  { kind: 'playing' } | { kind: 'won'; winner: Stone; line: readonly number[] } | { kind: 'draw' };

/** An immutable game position. `moves` is the full history (cell indexes), stone 1 first. */
export interface GameState {
  readonly size: BoardSize;
  /** 0 empty, 1 / 2 stones. Never mutate: `playMove` returns a new state. */
  readonly cells: Uint8Array;
  readonly moves: readonly number[];
  readonly status: GameStatus;
}

export function newGame(size: BoardSize): GameState {
  return { size, cells: new Uint8Array(size * size), moves: [], status: { kind: 'playing' } };
}

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
  const line = winningLine(cells, game.size, index);
  const status: GameStatus = line
    ? { kind: 'won', winner: stone, line }
    : moves.length === cells.length
      ? { kind: 'draw' }
      : { kind: 'playing' };
  return { size: game.size, cells, moves, status };
}

/** Rebuilds a position from its move list (used to resume a saved game). */
export function replay(size: BoardSize, moves: readonly number[]): GameState {
  return moves.reduce(playMove, newGame(size));
}

/** Takes back the last `count` moves. */
export function undoMoves(game: GameState, count: number): GameState {
  return replay(game.size, game.moves.slice(0, Math.max(0, game.moves.length - count)));
}

/** How many stones `stone` has played (stone 1 moves on even move counts). */
export function stoneCount(game: GameState, stone: Stone): number {
  const total = game.moves.length;
  return stone === 1 ? Math.ceil(total / 2) : Math.floor(total / 2);
}
