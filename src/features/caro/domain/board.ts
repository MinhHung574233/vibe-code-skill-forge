/** Board model shared by the rules, the engine and the UI. Cells are flat indexes `row * size + col`. */

/**
 * 15x15 is the standard board; 9x9 is a quick game that still needs real tactics; 19x19 is the
 * tournament board. The first entry order is the order the old code used, 15 stays the default.
 */
export const BOARD_SIZES = [15, 9, 19] as const;
export type BoardSize = (typeof BOARD_SIZES)[number];
export const DEFAULT_BOARD_SIZE: BoardSize = 15;

export function isBoardSize(value: number): value is BoardSize {
  return (BOARD_SIZES as readonly number[]).includes(value);
}

/** 1 moves first (the filled stones in the UI), 2 moves second. 0 is an empty cell. */
export type Stone = 1 | 2;
/**
 * A blocked ("dead") square: nobody can play on it, it never belongs to a line, and under the
 * `blocked` rule it acts as a wall at the end of a run. It is neither a stone nor empty.
 */
export const OBSTACLE = 3;
export type Cell = 0 | Stone | typeof OBSTACLE;

export const WIN_LENGTH = 5;

/** The most moves any game can have (a full 19x19 board). */
export const MAX_MOVES = 19 * 19;

export const otherStone = (stone: Stone): Stone => (stone === 1 ? 2 : 1);

export const cellIndex = (size: number, row: number, col: number): number => row * size + col;
export const rowOf = (size: number, index: number): number => Math.floor(index / size);
export const colOf = (size: number, index: number): number => index % size;

export function centerIndex(size: number): number {
  const mid = Math.floor(size / 2);
  return cellIndex(size, mid, mid);
}
