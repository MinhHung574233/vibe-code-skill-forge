/** Board model shared by the rules, the engine and the UI. Cells are flat indexes `row * size + col`. */

/** 15x15 is the standard board; 9x9 is a quick game that still needs real tactics. */
export const BOARD_SIZES = [15, 9] as const;
export type BoardSize = (typeof BOARD_SIZES)[number];
export const DEFAULT_BOARD_SIZE: BoardSize = 15;

export function isBoardSize(value: number): value is BoardSize {
  return (BOARD_SIZES as readonly number[]).includes(value);
}

/** 1 moves first (the filled stones in the UI), 2 moves second. 0 is an empty cell. */
export type Stone = 1 | 2;
export type Cell = 0 | Stone;

export const WIN_LENGTH = 5;

export const otherStone = (stone: Stone): Stone => (stone === 1 ? 2 : 1);

export const cellIndex = (size: number, row: number, col: number): number => row * size + col;
export const rowOf = (size: number, index: number): number => Math.floor(index / size);
export const colOf = (size: number, index: number): number => index % size;

export function centerIndex(size: number): number {
  const mid = Math.floor(size / 2);
  return cellIndex(size, mid, mid);
}
