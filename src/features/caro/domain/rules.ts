import { WIN_LENGTH } from './board';

const DIRECTIONS: readonly (readonly [number, number])[] = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

/**
 * RULE: five OR MORE stones of one colour in an unbroken row, column or diagonal win
 * ("freestyle" gomoku). Overlines (six or more) count, and a five blocked at both ends still
 * wins. The Vietnamese-Caro refinement (a five blocked on both sides does not win) is NOT used:
 * one simple rule that the engine, the tests and the UI all share.
 *
 * Returns every cell of the winning run through `last` (so the UI can highlight an overline in
 * full), or null when the stone just placed at `last` did not complete five.
 */
export function winningLine(
  cells: ArrayLike<number>,
  size: number,
  last: number,
): readonly number[] | null {
  const stone = cells[last];
  if (!stone) return null;
  const row = Math.floor(last / size);
  const col = last % size;

  for (const [dr, dc] of DIRECTIONS) {
    const line: number[] = [last];
    for (const sign of [1, -1]) {
      let r = row + sign * dr;
      let c = col + sign * dc;
      while (r >= 0 && r < size && c >= 0 && c < size && cells[r * size + c] === stone) {
        const index = r * size + c;
        if (sign === 1) line.push(index);
        else line.unshift(index);
        r += sign * dr;
        c += sign * dc;
      }
    }
    if (line.length >= WIN_LENGTH) return line;
  }
  return null;
}
