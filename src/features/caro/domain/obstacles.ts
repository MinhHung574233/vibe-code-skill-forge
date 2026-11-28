import { cellIndex, colOf, rowOf, type BoardSize } from './board';
import { mulberry32 } from './rng';

/** Numbers of blocked squares the setup offers. A list so more options can be added later. */
export const OBSTACLE_COUNTS = [0, 3] as const;
export type ObstacleCount = (typeof OBSTACLE_COUNTS)[number];

export function isObstacleCount(value: number): value is ObstacleCount {
  return (OBSTACLE_COUNTS as readonly number[]).includes(value);
}

/** Chebyshev distance between two cells (1 = touching, diagonals included). */
function distance(size: number, a: number, b: number): number {
  return Math.max(
    Math.abs(rowOf(size, a) - rowOf(size, b)),
    Math.abs(colOf(size, a) - colOf(size, b)),
  );
}

/**
 * Where a blocked square may stand: never on the outer ring, and never on the centre point or
 * its 8 neighbours, so the first moves of both players are always possible.
 */
export function obstacleSites(size: BoardSize): number[] {
  const mid = Math.floor(size / 2);
  const sites: number[] = [];
  for (let r = 1; r < size - 1; r++) {
    for (let c = 1; c < size - 1; c++) {
      if (Math.abs(r - mid) <= 1 && Math.abs(c - mid) <= 1) continue;
      sites.push(cellIndex(size, r, c));
    }
  }
  return sites;
}

/**
 * A stored obstacle list is acceptable when it has an offered count, every cell is a legal
 * site, and no two squares touch (not even diagonally).
 */
export function isValidObstacleSet(size: BoardSize, obstacles: readonly number[]): boolean {
  if (!isObstacleCount(obstacles.length)) return false;
  const sites = new Set(obstacleSites(size));
  if (!obstacles.every((cell) => Number.isInteger(cell) && sites.has(cell))) return false;
  for (let i = 0; i < obstacles.length; i++) {
    for (let j = i + 1; j < obstacles.length; j++) {
      if (distance(size, obstacles[i]!, obstacles[j]!) < 2) return false;
    }
  }
  return true;
}

function pick(
  size: BoardSize,
  shuffled: readonly number[],
  count: number,
  minDistance: number,
): number[] {
  const chosen: number[] = [];
  for (const cell of shuffled) {
    if (chosen.every((other) => distance(size, cell, other) >= minDistance)) chosen.push(cell);
    if (chosen.length === count) break;
  }
  return chosen;
}

/**
 * Chooses `count` blocked squares for a new game, deterministically from `seed`. Squares are
 * spread out (at least 3 apart) when the board has room, and never closer than 2. The result is
 * sorted. The caller stores it in the saved game, so a resumed game is identical.
 */
export function placeObstacles(size: BoardSize, count: number, seed: number): number[] {
  if (count === 0) return [];
  if (!isObstacleCount(count)) throw new RangeError(`Unsupported obstacle count ${count}`);
  const random = mulberry32(seed);
  const shuffled = obstacleSites(size);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  let chosen = pick(size, shuffled, count, 3);
  if (chosen.length < count) chosen = pick(size, shuffled, count, 2);
  return chosen.sort((a, b) => a - b);
}
