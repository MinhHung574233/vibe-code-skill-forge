import { BLACK, EMPTY, WHITE, opponent, type Board, type Color } from './board';

/**
 * A small exhaustive life-and-death prover, used by the test-suite to VERIFY every bundled problem
 * (the app itself only ships the verified answers). It plays the real rules of board.ts on the cropped problem board, where
 * everything outside the diagram is simply not there (blocked points act like the board edge).
 *
 * Definitions (the claim "this move works" means exactly this, within the depth limit):
 *  - The **target** is one stone of the group in question; its colour is the DEFENDER, the other
 *    colour is the ATTACKER.
 *  - **killed**: the target stone has been captured. A group that only ends up in seki or ko is
 *    therefore NOT killed.
 *  - **lived**: the target chain is unconditionally alive by Benson's algorithm (it cannot be
 *    captured whatever the attacker does, even if the defender never moves again), or, in a
 *    capturing race, the attacker's `protect` stone has been captured first.
 *  - "The attacker kills within N plies": the attacker has a strategy that reaches *killed* in at
 *    most N plies against EVERY defender reply. "The defender lives within N plies" is the dual.
 *    Both players may pass (a forced move would let a missing outside tenuki change the result);
 *    two passes in a row end the line unresolved, i.e. a failure for the side being proved.
 *  - Ko is limited to the simple-ko rule (no immediate retake); results that need ko are never
 *    proved, so problems that hinge on a ko cannot be bundled.
 *  - The search is exhaustive over the diagram, so a proof is a real proof within the limit; when it
 *    answers `false` that means "not proved within N plies", not "refuted"; use the dual prover to
 *    show a refutation.
 */

export interface Goal {
  /** A point of the contested group. Its stone colour is the defender. */
  target: number;
  /** Capturing races: an attacker stone that loses the race if it is captured. */
  protect?: number;
}

export class NodeLimitError extends Error {
  constructor(limit: number) {
    super(`Search exceeded ${limit} nodes.`);
    this.name = 'NodeLimitError';
  }
}

type Outcome = 'killed' | 'lived' | null;

// --- Benson's algorithm ---------------------------------------------------------------------

/**
 * Is the chain containing `point` unconditionally alive? (Benson 1976.) Chains of `color` stay in
 * the candidate set only while at least two "vital" regions border them; a region is vital to a
 * chain when every empty point in it touches the chain, and regions touching a discarded chain
 * are discarded too. Sound but not complete: some living shapes (for example a straight-four
 * eye space) only count as alive once the eye is actually divided.
 */
export function isUnconditionallyAlive(board: Board, point: number): boolean {
  const color = board.cells[point];
  if (color !== BLACK && color !== WHITE) return false;
  const t = board.topology;
  const n = t.count;

  const chainOf = new Int32Array(n).fill(-1);
  const chains: number[][] = [];
  for (let p = 0; p < n; p++) {
    if (board.cells[p] !== color || chainOf[p] !== -1) continue;
    const id = chains.length;
    const stones = board.group(p).stones;
    for (const s of stones) chainOf[s] = id;
    chains.push(stones);
  }

  const regionOf = new Int32Array(n).fill(-1);
  interface Region {
    empties: number[];
    neighbours: Set<number>;
    /** chain id -> true when every empty point of the region touches that chain */
    vitalFor: Set<number>;
  }
  const regions: Region[] = [];
  for (let start = 0; start < n; start++) {
    if (!t.playable[start] || board.cells[start] === color || regionOf[start] !== -1) continue;
    const id = regions.length;
    const region: Region = { empties: [], neighbours: new Set(), vitalFor: new Set() };
    const todo = [start];
    regionOf[start] = id;
    while (todo.length > 0) {
      const p = todo.pop() as number;
      if (board.cells[p] === EMPTY) region.empties.push(p);
      for (const q of t.neighbors[p] as Int16Array) {
        if (board.cells[q] === color) region.neighbours.add(chainOf[q] as number);
        else if (regionOf[q] === -1) {
          regionOf[q] = id;
          todo.push(q);
        }
      }
    }
    for (const c of region.neighbours) {
      const touches = (e: number) => (t.neighbors[e] as Int16Array).some((q) => chainOf[q] === c);
      if (region.empties.length > 0 && region.empties.every(touches)) region.vitalFor.add(c);
    }
    regions.push(region);
  }

  const aliveChains = new Set<number>(chains.map((_, i) => i));
  const liveRegions = new Set<number>(regions.map((_, i) => i));
  for (let changed = true; changed;) {
    changed = false;
    for (const c of [...aliveChains]) {
      let vital = 0;
      for (const r of liveRegions) if ((regions[r] as Region).vitalFor.has(c)) vital++;
      if (vital < 2) {
        aliveChains.delete(c);
        changed = true;
      }
    }
    for (const r of [...liveRegions]) {
      for (const c of (regions[r] as Region).neighbours) {
        if (!aliveChains.has(c)) {
          liveRegions.delete(r);
          changed = true;
          break;
        }
      }
    }
  }
  return aliveChains.has(chainOf[point] as number);
}

// --- search -------------------------------------------------------------------------------------

interface Entry {
  /** Smallest depth at which the side being proved was shown to win (Infinity: never shown). */
  wonAt: number;
  /** Largest depth at which it was shown NOT to win (-1: never shown). */
  failedAt: number;
}

export interface SolverOptions {
  /** Abort (throw `NodeLimitError`) after this many nodes. */
  nodeLimit?: number;
}

export interface Solver {
  /** Can the attacker kill the group within `depth` plies, `toPlay` moving first? */
  attackerKills(board: Board, toPlay: Color, depth: number, ko?: number): boolean;
  /** Can the defender live (or win the race) within `depth` plies, `toPlay` moving first? */
  defenderLives(board: Board, toPlay: Color, depth: number, ko?: number): boolean;
  readonly nodes: number;
}

export function createSolver(goal: Goal, initial: Board, options: SolverOptions = {}): Solver {
  const limit = options.nodeLimit ?? 3_000_000;
  const defender = initial.get(goal.target);
  if (defender === EMPTY) throw new RangeError('The target point has no stone.');
  const attacker = opponent(defender);
  const tables = { attacker: new Map<string, Entry>(), defender: new Map<string, Entry>() };
  let nodes = 0;

  const outcome = (board: Board): Outcome => {
    if (board.get(goal.target) !== defender) return 'killed';
    if (goal.protect !== undefined && board.get(goal.protect) !== attacker) return 'lived';
    if (board.libertyCount(goal.target) >= 2 && isUnconditionallyAlive(board, goal.target)) {
      return 'lived';
    }
    return null;
  };

  interface Candidate {
    board: Board;
    ko: number;
    point: number; // -1 = pass
    rank: number;
  }

  /** Legal moves of `mover` (plus a pass), the likeliest first. */
  const candidates = (board: Board, mover: Color, ko: number): Candidate[] => {
    const out: Candidate[] = [];
    const t = board.topology;
    for (let p = 0; p < t.count; p++) {
      if (board.cells[p] !== EMPTY || !t.playable[p] || p === ko) continue;
      const next = board.clone();
      const r = next.play(p, mover);
      if (!r.ok) continue;
      let rank = r.captured.length * 20;
      if (next.get(goal.target) !== defender) rank += 1000;
      else {
        const libs = next.libertyCount(goal.target);
        rank += mover === defender ? libs * 3 : (8 - libs) * 3;
      }
      if ((t.neighbors[p] as Int16Array).some((q) => board.cells[q] === defender)) rank += 4;
      out.push({ board: next, ko: r.ko, point: p, rank });
    }
    out.sort((a, b) => b.rank - a.rank || a.point - b.point);
    out.push({ board, ko: -1, point: -1, rank: -1 });
    return out;
  };

  /** Does the side `prover` (attacker or defender) win within `depth` plies? */
  const prove = (
    mode: 'attacker' | 'defender',
    board: Board,
    toPlay: Color,
    depth: number,
    ko: number,
    passes: number,
  ): boolean => {
    nodes++;
    if (nodes > limit) throw new NodeLimitError(limit);
    const result = outcome(board);
    if (result !== null) return (result === 'killed') === (mode === 'attacker');
    if (depth <= 0 || passes >= 2) return false;

    const table = tables[mode];
    const key = `${board.hashHi}:${board.hashLo}:${toPlay}:${ko}:${passes}`;
    const known = table.get(key);
    if (known) {
      if (depth >= known.wonAt) return true;
      if (depth <= known.failedAt) return false;
    }

    const proverColor = mode === 'attacker' ? attacker : defender;
    const ours = toPlay === proverColor; // our move: one winning reply is enough
    let win = !ours;
    for (const c of candidates(board, toPlay, ko)) {
      const sub = prove(
        mode,
        c.board,
        opponent(toPlay),
        depth - 1,
        c.ko,
        c.point === -1 ? passes + 1 : 0,
      );
      if (ours && sub) {
        win = true;
        break;
      }
      if (!ours && !sub) {
        win = false;
        break;
      }
    }

    const entry = known ?? { wonAt: Infinity, failedAt: -1 };
    if (win) entry.wonAt = Math.min(entry.wonAt, depth);
    else entry.failedAt = Math.max(entry.failedAt, depth);
    table.set(key, entry);
    return win;
  };

  return {
    attackerKills: (board, toPlay, depth, ko = -1) =>
      prove('attacker', board, toPlay, depth, ko, 0),
    defenderLives: (board, toPlay, depth, ko = -1) =>
      prove('defender', board, toPlay, depth, ko, 0),
    get nodes() {
      return nodes;
    },
  };
}

// --- judging a first move ------------------------------------------------------------------------

export interface ProblemSpec extends Goal {
  board: Board;
  toPlay: Color;
  /** Search limit in plies, counting the first move. */
  depth: number;
}

export interface Judge {
  /** Points where `toPlay` may legally play first. */
  legalMoves(): number[];
  /** The first move provably achieves the objective within the depth limit. */
  succeeds(move: number): boolean;
  /** The opponent provably defeats the first move within the depth limit (a real refutation). */
  fails(move: number): boolean;
  readonly nodes: number;
}

/**
 * Judges first moves of one problem with shared search tables. `toPlay` is either the defender
 * ("live") or the attacker ("kill" / "capture"); "succeeds" and "fails" are never both true.
 */
export function createJudge(spec: ProblemSpec, options: SolverOptions = {}): Judge {
  const solver = createSolver(spec, spec.board, options);
  const defender = spec.board.get(spec.target);
  const toPlayIsAttacker = spec.toPlay !== defender;
  const after = (move: number) => {
    const next = spec.board.clone();
    const result = next.play(move, spec.toPlay);
    return result.ok ? { next, ko: result.ko } : null;
  };
  const prove = (move: number, forMover: boolean): boolean => {
    const played = after(move);
    if (!played) return false;
    const attackerProof = toPlayIsAttacker === forMover; // whose victory are we proving?
    const depth = spec.depth - 1;
    const replier = opponent(spec.toPlay);
    return attackerProof
      ? solver.attackerKills(played.next, replier, depth, played.ko)
      : solver.defenderLives(played.next, replier, depth, played.ko);
  };
  return {
    legalMoves: () => {
      const out: number[] = [];
      for (let p = 0; p < spec.board.topology.count; p++) if (after(p)) out.push(p);
      return out;
    },
    succeeds: (move) => prove(move, true),
    fails: (move) => prove(move, false),
    get nodes() {
      return solver.nodes;
    },
  };
}
