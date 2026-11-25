import { pointOf, squareTopology, type BoardSize } from '../domain/board';

/** Column letters skip "I", as on every Go board. */
const COLUMNS = 'ABCDEFGHJKLMNOPQRST';

/** `D4`-style name: column letter from the left, row counted from the bottom edge. */
export function pointName(size: number, point: number): string {
  const x = point % size;
  const y = Math.floor(point / size);
  return `${COLUMNS[x] ?? '?'}${size - y}`;
}

/** The star points drawn on the board: five on 9x9 (corners and centre), nine on 13x13 and 19x19. */
export function starPoints(size: BoardSize): number[] {
  const t = squareTopology(size);
  if (size === 9) {
    return [
      [2, 2],
      [6, 2],
      [4, 4],
      [2, 6],
      [6, 6],
    ].map(([x, y]) => pointOf(t, x as number, y as number));
  }
  const lines = size === 13 ? [3, 6, 9] : [3, 9, 15];
  return lines.flatMap((x) => lines.map((y) => pointOf(t, x, y)));
}
