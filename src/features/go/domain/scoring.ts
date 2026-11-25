import { BLACK, EMPTY, WHITE, type Board, type Color } from './board';

/**
 * Area (Chinese) scoring: a side's score is its live stones on the board plus its territory.
 * Territory is an empty region (found by flood fill) whose border touches stones of one colour
 * only; a region that touches both colours, or none, is neutral. Dead stones, as marked by the
 * players, are taken off first (so the points they sat on become empty and join regions).
 * White's score then gets the komi. Prisoners do not matter under area scoring.
 *
 * Seki needs no special code: both groups stay on the board and the shared liberties touch both
 * colours, so they are neutral.
 */
export interface AreaScore {
  blackStones: number;
  whiteStones: number;
  blackTerritory: number;
  whiteTerritory: number;
  neutral: number;
  /** Stones plus territory, komi not included. */
  black: number;
  white: number;
  komi: number;
  /** Black minus (White plus komi): positive when Black wins. */
  margin: number;
  winner: Color | 'draw';
  /** Per point: the colour that owns it (a live stone or territory), `EMPTY` for neutral points. */
  owner: Uint8Array;
}

export function areaScore(
  board: Board,
  komi: number,
  dead: ReadonlySet<number> = new Set(),
): AreaScore {
  const t = board.topology;
  const cell = (p: number): number => (dead.has(p) ? EMPTY : (board.cells[p] ?? EMPTY));
  const owner = new Uint8Array(t.count);
  const seen = new Uint8Array(t.count);
  let blackStones = 0;
  let whiteStones = 0;
  let blackTerritory = 0;
  let whiteTerritory = 0;
  let neutral = 0;

  for (let p = 0; p < t.count; p++) {
    if (!t.playable[p]) continue;
    const c = cell(p);
    if (c === BLACK) {
      blackStones++;
      owner[p] = BLACK;
    } else if (c === WHITE) {
      whiteStones++;
      owner[p] = WHITE;
    }
  }

  for (let start = 0; start < t.count; start++) {
    if (!t.playable[start] || seen[start] || cell(start) !== EMPTY) continue;
    const region: number[] = [];
    let touchesBlack = false;
    let touchesWhite = false;
    const todo = [start];
    seen[start] = 1;
    while (todo.length > 0) {
      const q = todo.pop() as number;
      region.push(q);
      for (const n of t.neighbors[q] as Int16Array) {
        const c = cell(n);
        if (c === EMPTY) {
          if (!seen[n]) {
            seen[n] = 1;
            todo.push(n);
          }
        } else if (c === BLACK) touchesBlack = true;
        else touchesWhite = true;
      }
    }
    if (touchesBlack && !touchesWhite) {
      blackTerritory += region.length;
      for (const q of region) owner[q] = BLACK;
    } else if (touchesWhite && !touchesBlack) {
      whiteTerritory += region.length;
      for (const q of region) owner[q] = WHITE;
    } else {
      neutral += region.length;
    }
  }

  const black = blackStones + blackTerritory;
  const white = whiteStones + whiteTerritory;
  const margin = black - (white + komi);
  return {
    blackStones,
    whiteStones,
    blackTerritory,
    whiteTerritory,
    neutral,
    black,
    white,
    komi,
    margin,
    winner: margin > 0 ? BLACK : margin < 0 ? WHITE : 'draw',
    owner,
  };
}

/** `B+3.5`, `W+12`, `Draw`: the usual short result notation. */
export function formatMargin(winner: Color | 'draw', margin: number): string {
  if (winner === 'draw') return 'Draw';
  const amount = Math.abs(margin);
  return `${winner === BLACK ? 'B' : 'W'}+${Number.isInteger(amount) ? amount : amount.toFixed(1)}`;
}

/** Marks or unmarks the whole group at `p` as dead (players mark groups, not single stones). */
export function toggleDeadGroup(board: Board, dead: ReadonlySet<number>, p: number): Set<number> {
  const next = new Set(dead);
  if ((board.cells[p] ?? EMPTY) === EMPTY) return next;
  const { stones } = board.group(p);
  const allDead = stones.every((s) => dead.has(s));
  for (const s of stones) {
    if (allDead) next.delete(s);
    else next.add(s);
  }
  return next;
}
