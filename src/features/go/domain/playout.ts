import { BLACK, EMPTY, WHITE, opponent, type Board, type Color } from './board';
import type { Rng } from './rng';
import { areaScore } from './scoring';

/**
 * Light playouts: the fast, rough way the AI judges a position. Both sides play legal moves that
 * never fill their own eyes (so living groups stay alive) and answer atari next to the last move.
 * Nothing here is deep Go knowledge; it only has to be right on average over many games.
 */

/**
 * Is `p` an eye of `color` by the usual shape test: every neighbour is `color` (or the edge), and
 * the diagonals are `color` too, allowing one exception in the middle of the board and none on the
 * edge or in the corner (an eye with a missing diagonal there is false). It cannot see every false
 * eye, so the AI is a little too proud of some shapes; that is part of being a beginner.
 */
export function isEye(board: Board, p: number, color: Color): boolean {
  const t = board.topology;
  if (board.cells[p] !== EMPTY || !t.playable[p]) return false;
  for (const n of t.neighbors[p] as Int16Array) if (board.cells[n] !== color) return false;
  const diagonals = t.diagonals[p] as Int16Array;
  let bad = 0;
  for (const d of diagonals) if (board.cells[d] !== color) bad++;
  const onEdge = diagonals.length < 4;
  return onEdge ? bad === 0 : bad <= 1;
}

interface Played {
  point: number;
  ko: number;
}

/** Plays an unforced random legal move that is not an own eye, scanning from a random start. */
function playRandom(board: Board, color: Color, ko: number, rng: Rng): Played | null {
  const n = board.topology.count;
  const start = rng.int(n);
  for (let i = 0; i < n; i++) {
    const p = start + i < n ? start + i : start + i - n;
    if (board.cells[p] !== EMPTY || p === ko) continue;
    if (isEye(board, p, color)) continue;
    const r = board.play(p, color);
    if (r.ok) return { point: p, ko: r.ko };
  }
  return null;
}

/** Captures or saves a group in atari next to the opponent's last stone, if there is one. */
function playTactical(board: Board, color: Color, ko: number, last: number): Played | null {
  if (last < 0) return null;
  const enemy = opponent(color);
  const t = board.topology;
  const take = (p: number): Played | null => {
    if (p === ko) return null;
    const r = board.play(p, color);
    return r.ok ? { point: p, ko: r.ko } : null;
  };

  if (board.cells[last] === enemy && board.libertyCount(last) === 1) {
    const lib = board.group(last).liberties[0] as number;
    const played = take(lib);
    if (played) return played;
  }
  for (const n of t.neighbors[last] as Int16Array) {
    const c = board.cells[n];
    if (c === EMPTY || board.libertyCount(n) !== 1) continue;
    const lib = board.group(n).liberties[0] as number;
    if (lib === ko) continue;
    if (c === enemy) {
      const played = take(lib); // capture
      if (played) return played;
    } else {
      const probe = board.clone(); // extend only if that actually gains liberties
      const r = probe.play(lib, color);
      if (r.ok && (r.captured.length > 0 || probe.libertyCount(lib) >= 2)) {
        const played = take(lib);
        if (played) return played;
      }
    }
  }
  return null;
}

export interface PlayoutOptions {
  /** Stop after this many moves and estimate the winner instead of playing on. */
  maxMoves: number;
  komi: number;
}

/**
 * Plays random-ish moves from `board` (mutated) until two passes or the move limit, and returns
 * the winner. Finished games use exact area scoring; cut-off games use `estimateWinner`.
 */
export function playout(
  board: Board,
  toPlay: Color,
  ko: number,
  lastPoint: number,
  rng: Rng,
  options: PlayoutOptions,
): Color | 'draw' {
  let color = toPlay;
  let passes = 0;
  let last = lastPoint;
  let simpleKo = ko;
  for (let moves = 0; moves < options.maxMoves; moves++) {
    const played =
      playTactical(board, color, simpleKo, last) ?? playRandom(board, color, simpleKo, rng);
    if (played) {
      passes = 0;
      last = played.point;
      simpleKo = played.ko;
    } else {
      passes++;
      if (passes >= 2) return areaScore(board, options.komi).winner;
      last = -1;
      simpleKo = -1;
    }
    color = opponent(color);
  }
  return estimateWinner(board, options.komi);
}

/**
 * Quick score for an unfinished board: every empty point goes to the colour whose stone is
 * nearest (ties are neutral), stones count for themselves, komi goes to White.
 */
export function estimateWinner(board: Board, komi: number): Color | 'draw' {
  const t = board.topology;
  const owner = new Int8Array(t.count); // 0 unseen, 1 black, 2 white, 3 contested
  const dist = new Int16Array(t.count).fill(-1);
  let frontier: number[] = [];
  for (let p = 0; p < t.count; p++) {
    const c = board.cells[p];
    if (c === BLACK || c === WHITE) {
      owner[p] = c;
      dist[p] = 0;
      frontier.push(p);
    }
  }
  let step = 0;
  while (frontier.length > 0) {
    step++;
    const reached = new Map<number, number>();
    for (const p of frontier) {
      for (const n of t.neighbors[p] as Int16Array) {
        if (dist[n] !== -1) continue;
        reached.set(n, (reached.get(n) ?? 0) | (owner[p] as number));
      }
    }
    frontier = [];
    for (const [n, mask] of reached) {
      dist[n] = step;
      owner[n] = mask;
      if (mask !== 3) frontier.push(n); // contested points are walls: nothing spreads through them
    }
  }
  let black = 0;
  let white = 0;
  for (let p = 0; p < t.count; p++) {
    if (owner[p] === 1) black++;
    else if (owner[p] === 2) white++;
  }
  const margin = black - white - komi;
  return margin > 0 ? BLACK : margin < 0 ? WHITE : 'draw';
}

/**
 * Which stones are probably dead? Plays `playouts` complete random games from the position and
 * marks a group dead when the opponent ends up owning its points in at least 3 of 5 games
 * (a living group is rarely lost in more than one in ten). This is
 * an estimate to speed up the marking step, not a life-and-death reader: always check the result.
 */
const DEAD_OWNERSHIP = 0.6;

export function suggestDeadStones(board: Board, rng: Rng, playouts = 120): Set<number> {
  const t = board.topology;
  const ownedBy = [new Int32Array(t.count), new Int32Array(t.count), new Int32Array(t.count)];
  for (let i = 0; i < playouts; i++) {
    const sim = board.clone();
    playout(sim, i % 2 === 0 ? BLACK : WHITE, -1, -1, rng, { maxMoves: t.count * 3, komi: 0 });
    const { owner } = areaScore(sim, 0);
    for (let p = 0; p < t.count; p++) {
      const table = ownedBy[owner[p] as number] as Int32Array;
      table[p] = (table[p] as number) + 1;
    }
  }
  const dead = new Set<number>();
  const seen = new Set<number>();
  for (let p = 0; p < t.count; p++) {
    const c = board.cells[p];
    if ((c !== BLACK && c !== WHITE) || seen.has(p)) continue;
    const { stones } = board.group(p);
    for (const s of stones) seen.add(s);
    const enemyTable = ownedBy[opponent(c)] as Int32Array;
    let enemyOwned = 0;
    for (const s of stones) enemyOwned += enemyTable[s] as number;
    if (enemyOwned / (stones.length * playouts) >= DEAD_OWNERSHIP)
      for (const s of stones) dead.add(s);
  }
  return dead;
}
