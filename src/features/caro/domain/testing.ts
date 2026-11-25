import { cellIndex, type BoardSize } from './board';

/**
 * Builds a move list from an ASCII diagram (`X` stone 1, `O` stone 2, `.` empty), anchored at
 * `at` on the board. Stones are interleaved X, O, X, ... so the list is a legal alternating
 * history; the side to move is X when both colours have the same number of stones, else O.
 */
export function movesFromDiagram(
  size: BoardSize,
  rows: readonly string[],
  origin: readonly [number, number] = [4, 4],
): number[] {
  const x: number[] = [];
  const o: number[] = [];
  rows.forEach((line, r) => {
    [...line].forEach((ch, c) => {
      const index = cellIndex(size, origin[0] + r, origin[1] + c);
      if (ch === 'X') x.push(index);
      else if (ch === 'O') o.push(index);
    });
  });
  if (x.length < o.length || x.length - o.length > 1) {
    throw new Error(`Unbalanced diagram: ${x.length} X vs ${o.length} O`);
  }
  const moves: number[] = [];
  for (let i = 0; i < x.length; i++) {
    moves.push(x[i]!);
    if (i < o.length) moves.push(o[i]!);
  }
  return moves;
}

/**
 * A complete game on an odd-sized board that fills it with no five in a row (colours follow a
 * pattern with runs of at most two), so it ends in a draw. Stone 1 plays one more stone.
 */
export function drawMoves(size: BoardSize): number[] {
  const xs: number[] = [];
  const os: number[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      ((Math.floor(r / 2) + c) % 2 === 0 ? xs : os).push(cellIndex(size, r, c));
    }
  }
  const moves: number[] = [];
  xs.forEach((x, k) => {
    moves.push(x);
    if (k < os.length) moves.push(os[k]!);
  });
  return moves;
}
