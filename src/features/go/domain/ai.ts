import { BLACK, EMPTY, WHITE, opponent, type Board, type Color } from './board';
import { gameStatus, playStone, type GameState } from './game';
import { isEye, playout } from './playout';
import type { Rng } from './rng';
import { areaScore } from './scoring';

/**
 * A beginner-level Go engine: tactical heuristics rank the legal moves, then a small Monte-Carlo
 * tree search (UCT over random "light" playouts) decides between the best few.
 *
 * What it does:
 *  - legal moves only, simple ko respected during search, positional superko checked on the move
 *    it finally plays;
 *  - heuristics: capture groups in atari, save own groups in atari (only if the extension really
 *    escapes), play atari to chase, avoid self-atari, never fill its own eyes, avoid playing inside
 *    its own small territory, prefer the 3rd/4th lines, stay near the fight, and open on the 3-3 /
 *    star points (centre on 9x9) when an area is empty;
 *  - search: the best few candidates become the root of a UCT tree one or two moves deep; leaves
 *    are scored by light playouts. Level = number of playouts. Every search also stops at a wall-
 *    clock limit (`maxMs`), so it stays responsive on a slow phone and on 19x19.
 *
 * What it is NOT: it reads no ladders, no life and death beyond what playouts stumble on, and it
 * has no opening book or endgame technique. Expect roughly 25 to 15 kyu at best on 9x9 (a club
 * beginner), weaker on 13x13, and weaker still on 19x19 where there are far fewer playouts per
 * move. These are estimates, not measured against rated players.
 */

export type Level = 'easy' | 'medium' | 'hard';

interface LevelSpec {
  /** Playouts per move on 9x9; larger boards get a fraction (see `SIZE_SCALE`). */
  playouts: number;
  /** Candidate moves kept at the root. */
  rootMoves: number;
  /** Chance of playing the runner-up instead of the best move (human-like slips). */
  slip: number;
  /** May resign a position that the search sees as lost. */
  canResign: boolean;
}

export const LEVEL_SPECS: Readonly<Record<Level, LevelSpec>> = {
  easy: { playouts: 12, rootMoves: 5, slip: 0.5, canResign: false },
  medium: { playouts: 500, rootMoves: 10, slip: 0.1, canResign: true },
  hard: { playouts: 1600, rootMoves: 14, slip: 0, canResign: true },
};

/** Fraction of the 9x9 playout budget on each board size (playouts get slower as boards grow). */
const SIZE_SCALE: Readonly<Record<number, number>> = { 9: 1, 13: 0.8, 19: 0.8 };
/** Playout length limit; cut-off games are scored by `estimateWinner`. */
const PLAYOUT_LENGTH: Readonly<Record<number, number>> = { 9: 160, 13: 140, 19: 110 };
/** Default wall-clock limit for one move, in milliseconds (the product target is 1.5 s on a phone). */
export const DEFAULT_MAX_MS = 1200;

export interface AiOptions {
  level: Level;
  rng: Rng;
  /** Wall-clock limit for the search. Defaults to `DEFAULT_MAX_MS`; pass `Infinity` in tests. */
  maxMs?: number;
  /** Overrides the level's playout count (tests, benchmarks). */
  playouts?: number;
  now?: () => number;
}

export type AiMove = { kind: 'move'; point: number } | { kind: 'pass' } | { kind: 'resign' };

// --- static move evaluation --------------------------------------------------------------------

interface Scored {
  point: number;
  score: number;
  /** The score includes an opening-point bonus (an empty part of the board). */
  opening: boolean;
}

const chebyshev = (board: Board, a: number, b: number): number => {
  const w = board.topology.width;
  return Math.max(Math.abs((a % w) - (b % w)), Math.abs(Math.floor(a / w) - Math.floor(b / w)));
};

/** Territory marks: small empty regions that touch only one colour (the AI should not fill them). */
function smallTerritories(board: Board, limit: number): Uint8Array {
  const t = board.topology;
  const marks = new Uint8Array(t.count);
  const seen = new Uint8Array(t.count);
  for (let start = 0; start < t.count; start++) {
    if (board.cells[start] !== EMPTY || seen[start] || !t.playable[start]) continue;
    const region: number[] = [start];
    seen[start] = 1;
    let touches = 0;
    for (let i = 0; i < region.length; i++) {
      for (const n of t.neighbors[region[i] as number] as Int16Array) {
        const c = board.cells[n] as number;
        if (c === EMPTY) {
          if (!seen[n]) {
            seen[n] = 1;
            region.push(n);
          }
        } else touches |= c;
      }
    }
    if ((touches === BLACK || touches === WHITE) && region.length <= limit) {
      for (const p of region) marks[p] = touches;
    }
  }
  return marks;
}

interface EvalContext {
  board: Board;
  color: Color;
  ko: number;
  last: number;
  stones: number[];
  territory: Uint8Array;
}

function openingBonus(ctx: EvalContext, p: number): number {
  const { board } = ctx;
  const size = board.topology.width;
  const x = p % size;
  const y = Math.floor(p / size);
  const radius = size === 9 ? 3 : 4;
  if (ctx.stones.some((s) => chebyshev(board, s, p) <= radius)) return 0;
  const edge = size === 9 ? 2 : 3;
  const far = size - 1 - edge;
  const mid = (size - 1) / 2;
  const onStarLine = (v: number) => v === edge || v === far;
  if (size === 9) {
    if (x === mid && y === mid) return 30;
    if (onStarLine(x) && onStarLine(y)) return 22;
    return 4;
  }
  if (onStarLine(x) && onStarLine(y)) return 28; // 4-4 corners
  if (x === mid && y === mid) return 10;
  if ((onStarLine(x) && y === mid) || (onStarLine(y) && x === mid)) return 14;
  const d = Math.min(x, y, size - 1 - x, size - 1 - y);
  return d === 2 || d === 3 ? 6 : 0;
}

/** Heuristic value of playing `p` (without the opening bonus), or `null` if illegal or an own eye. */
function evaluate(ctx: EvalContext, p: number): number | null {
  const { board, color } = ctx;
  if (board.cells[p] !== EMPTY || p === ctx.ko || isEye(board, p, color)) return null;
  const t = board.topology;
  const enemy = opponent(color);
  const sim = board.clone();
  const r = sim.play(p, color);
  if (!r.ok) return null;

  const size = t.width;
  const x = p % size;
  const y = Math.floor(p / size);
  const libs = sim.libertyCount(p);
  const captured = r.captured.length;
  let score = 0;

  if (captured > 0) score += 40 + 12 * captured;
  if (libs === 1) score += captured > 0 && r.ko >= 0 ? -5 : -70; // self-atari (a ko capture is fine)

  const seen = new Set<number>();
  for (const n of t.neighbors[p] as Int16Array) {
    const c = board.cells[n];
    if (c === EMPTY || seen.has(n)) continue;
    const before = board.group(n);
    for (const s of before.stones) seen.add(s);
    if (c === color) {
      if (before.liberties.length === 1) {
        // an own group in atari: only worth extending if that really escapes
        score += libs >= 2 || captured > 0 ? 35 + 6 * before.stones.length : -10;
      } else if (before.liberties.length === 2 && libs >= 3) {
        score += 8;
      }
    } else if (c === enemy && sim.get(n) === enemy) {
      const after = sim.libertyCount(n);
      if (after === 1 && libs >= 2)
        score += 14 + 3 * before.stones.length; // atari to chase
      else if (after === 2) score += 4;
    }
  }

  const edge = Math.min(x, y, size - 1 - x, size - 1 - y);
  if (edge === 0) score -= 14;
  else if (edge === 1) score -= size === 9 ? 1 : 4;
  else if (edge <= 3) score += 3;

  if (ctx.last >= 0 && chebyshev(board, ctx.last, p) <= 2) score += 4;
  for (const n of t.neighbors[p] as Int16Array) {
    if (board.cells[n] === enemy) score += 2;
  }
  for (const d of t.diagonals[p] as Int16Array) {
    if (board.cells[d] === color) score += 1;
  }

  const mark = ctx.territory[p];
  if (mark === color) score -= 45;
  else if (mark === enemy) score -= 20;

  return score;
}

/**
 * Legal, non-eye-filling moves with their heuristic score, best first. On big boards only points
 * near existing stones (plus the opening points) are considered, which keeps 19x19 fast.
 */
export function rankMoves(board: Board, color: Color, ko: number, last: number): Scored[] {
  const t = board.topology;
  const size = t.width;
  const stones: number[] = [];
  for (let p = 0; p < t.count; p++) if (board.cells[p] !== EMPTY) stones.push(p);
  const ctx: EvalContext = {
    board,
    color,
    ko,
    last,
    stones,
    territory: smallTerritories(board, Math.max(8, Math.floor((size * size) / 8))),
  };
  const near = size >= 13 ? 3 : size; // 9x9 considers every point
  const out: Scored[] = [];
  for (let p = 0; p < t.count; p++) {
    if (board.cells[p] !== EMPTY || !t.playable[p]) continue;
    const bonus = openingBonus(ctx, p);
    const nearStone = near >= size || stones.some((s) => chebyshev(board, s, p) <= near);
    if (!nearStone && bonus <= 0) continue;
    const base = evaluate(ctx, p);
    if (base !== null && base + bonus > 0) {
      out.push({ point: p, score: base + bonus, opening: bonus > 0 });
    }
  }
  return out.sort((a, b) => b.score - a.score || a.point - b.point);
}

// --- search ------------------------------------------------------------------------------------

interface Node {
  /** Move that leads here (`-1` = pass). */
  point: number;
  /** Colour that played it. */
  color: Color;
  /** Probability the heuristic gives this move among its siblings. */
  prior: number;
  /** The raw heuristic score the prior came from. */
  score: number;
  visits: number;
  /** Wins (draw = 0.5) for `color`, the side that moved into this node. */
  wins: number;
  children: Node[] | null;
}

/** Turns heuristic scores into move probabilities: tactical moves dominate, shape breaks ties. */
function priors(ranked: readonly Scored[]): number[] {
  const top = ranked[0]?.score ?? 0;
  const weights = ranked.map((m) => Math.exp((m.score - top) / 12));
  const sum = weights.reduce((a, w) => a + w, 0);
  return weights.map((w) => w / sum);
}

function makeChildren(ranked: readonly Scored[], color: Color, limit: number): Node[] {
  const kept = ranked.slice(0, limit);
  const p = priors(kept);
  return kept.map((m, i) => ({
    point: m.point,
    color,
    prior: p[i] as number,
    score: m.score,
    visits: 0,
    wins: 0,
    children: null,
  }));
}

/** PUCT: win rate plus an exploration bonus that the heuristic prior steers. */
const EXPLORATION = 1.3;
/** Value assumed for a move not yet tried (slightly pessimistic, so tried moves are preferred). */
const UNTRIED_VALUE = 0.45;
/** Static score above which a move is tactical (a capture or a rescue), never a "slip". */
const TACTICAL_SCORE = 40;
/** A tree node grows children only after this many visits (expansion costs as much as a playout). */
const EXPAND_AFTER = 3;
/** A top-ranked opening move at least this good is played without searching. */
const OPENING_SCORE = 20;

function select(parent: Node): Node | null {
  const children = parent.children as Node[];
  if (children.length === 0) return null;
  const sqrtN = Math.sqrt(parent.visits + 1);
  let best: Node | null = null;
  let bestValue = -Infinity;
  for (const c of children) {
    const q = c.visits === 0 ? UNTRIED_VALUE : c.wins / c.visits;
    const value = q + (EXPLORATION * c.prior * sqrtN) / (1 + c.visits);
    if (value > bestValue) {
      bestValue = value;
      best = c;
    }
  }
  return best;
}

/** Area-score lead of `color` right now, counting only settled territory (a safe, low estimate). */
function areaLead(board: Board, komi: number, color: Color): number {
  const { margin } = areaScore(board, komi);
  return color === BLACK ? margin : -margin;
}

/** How many moves deep the tree grows; playouts take over from there. */
function treeDepth(size: number): number {
  return size === 9 ? 3 : 2;
}

interface Search {
  root: Node;
  playoutsDone: number;
}

function runSearch(
  state: GameState,
  color: Color,
  rootChildren: Node[],
  playoutBudget: number,
  rng: Rng,
  maxMs: number,
  now: () => number,
  started: number,
): Search {
  const size = state.config.size;
  const komi = state.config.komi;
  const lastPoint = state.moves.at(-1)?.point ?? -1;
  const root: Node = {
    point: -1,
    color: opponent(color),
    prior: 1,
    score: 0,
    visits: 0,
    wins: 0,
    children: rootChildren,
  };
  const maxDepth = treeDepth(size);
  const length = PLAYOUT_LENGTH[size] ?? 150;
  let done = 0;

  while (done < playoutBudget && root.children && root.children.length > 0) {
    if ((done & 7) === 0 && now() - started > maxMs) break;
    const board = state.board.clone();
    let toPlay = color;
    let ko = state.ko;
    let last = lastPoint;
    const path: Node[] = [root];
    let node = root;

    while (node.children !== null && path.length - 1 < maxDepth) {
      const child = select(node);
      if (!child) break;
      const r = board.play(child.point, toPlay);
      if (!r.ok) {
        // cannot happen (children are legal in this position); drop it rather than loop
        node.children = node.children.filter((c) => c !== child);
        continue;
      }
      ko = r.ko;
      last = child.point;
      toPlay = opponent(toPlay);
      path.push(child);
      node = child;
    }
    if (
      node.children === null &&
      node !== root &&
      node.visits >= EXPAND_AFTER &&
      path.length - 1 < maxDepth
    ) {
      node.children = makeChildren(rankMoves(board, toPlay, ko, last), toPlay, 6);
    }

    const winner = playout(board, toPlay, ko, last, rng, { maxMoves: length, komi });
    for (const n of path) {
      n.visits++;
      if (winner === 'draw') n.wins += 0.5;
      else if (winner === n.color) n.wins += 1;
    }
    done++;
  }
  return { root, playoutsDone: done };
}

// --- public API --------------------------------------------------------------------------------

/**
 * Chooses a move for the side to move in `state`. Always returns something legal: a move that the
 * rules accept (superko included), a pass, or (medium/hard only) a resignation of a lost game.
 */
export function chooseMove(state: GameState, options: AiOptions): AiMove {
  if (gameStatus(state) !== 'playing') return { kind: 'pass' };
  const color = state.toPlay;
  const spec = LEVEL_SPECS[options.level];
  const size = state.config.size;
  const now = options.now ?? Date.now;
  const maxMs = options.maxMs ?? DEFAULT_MAX_MS;
  const started = now();
  const budget = Math.max(
    4,
    Math.round(
      (options.playouts ?? spec.playouts) * (options.playouts ? 1 : (SIZE_SCALE[size] ?? 0.3)),
    ),
  );

  // The opponent just passed: end the game if we are already ahead on settled area.
  const lastMove = state.moves.at(-1);
  if (lastMove && lastMove.point === null && areaLead(state.board, state.config.komi, color) > 0) {
    return { kind: 'pass' };
  }

  const lastPoint = lastMove?.point ?? -1;
  const ranked = rankMoves(state.board, color, state.ko, lastPoint);
  const top = ranked[0];
  if (top?.opening && top.score >= OPENING_SCORE) {
    // An empty part of the board and nothing urgent: take a standard opening point, no search.
    const choices = ranked.filter((m) => m.opening && m.score >= top.score - 6);
    const choice = choices[options.rng.int(choices.length)] as Scored;
    if (playStone(state, choice.point).ok) return { kind: 'move', point: choice.point };
  }

  const { root } = runSearch(
    state,
    color,
    makeChildren(ranked, color, spec.rootMoves),
    budget,
    options.rng,
    maxMs,
    now,
    started,
  );
  const children = (root.children ?? []).filter((c) => c.visits > 0);
  if (children.length === 0) return { kind: 'pass' };

  const byVisits = [...children].sort((a, b) => b.visits - a.visits || b.prior - a.prior);
  const best = byVisits[0] as Node;

  if (
    spec.canResign &&
    root.visits >= 120 &&
    state.moves.length > size * size * 0.3 &&
    best.wins / best.visits < 0.03
  ) {
    return { kind: 'resign' };
  }

  // Slips are positional: a beginner may pick the second-best shape, but a capture or a rescue
  // (high static score) is always found, since the search sees those clearly.
  const slips =
    byVisits.length > 1 && best.score < TACTICAL_SCORE && options.rng.next() < spec.slip;
  const pick = slips ? [byVisits[1] as Node, ...byVisits] : byVisits;
  for (const candidate of pick) {
    // the search only knows simple ko; the real rules may still say no (superko)
    if (playStone(state, candidate.point).ok) return { kind: 'move', point: candidate.point };
  }
  return { kind: 'pass' };
}
