import { describe, expect, it } from 'vitest';
import { BLACK, WHITE, boardFromRows, opponent } from './board';
import { PROBLEMS_BY_DIFFICULTY, TSUMEGO_PROBLEMS } from './tsumego';
import {
  CATEGORY_LABELS,
  colorOf,
  objectiveText,
  pointIndex,
  problemBoard,
  sameMove,
  type TsumegoCategory,
} from './tsumegoTypes';
import { createJudge, createSolver, isUnconditionallyAlive } from './tsumegoSolver';

const ptName = (p: readonly [number, number]) => `(${p[0]},${p[1]})`;

describe('problem bank', () => {
  it('has at least 24 problems with unique ids and sensible fields', () => {
    expect(TSUMEGO_PROBLEMS.length).toBeGreaterThanOrEqual(24);
    expect(new Set(TSUMEGO_PROBLEMS.map((p) => p.id)).size).toBe(TSUMEGO_PROBLEMS.length);
    for (const p of TSUMEGO_PROBLEMS) {
      expect(p.title.length).toBeGreaterThan(3);
      expect(p.explanation.length).toBeGreaterThan(20);
      expect(p.difficulty).toBeGreaterThanOrEqual(1);
      expect(p.difficulty).toBeLessThanOrEqual(5);
      expect(p.solutions.length).toBeGreaterThan(0);
      expect(p.refutations.length).toBeGreaterThan(0);
    }
  });

  it('covers every required category and several difficulty levels', () => {
    const categories = new Set<TsumegoCategory>(TSUMEGO_PROBLEMS.map((p) => p.category));
    for (const required of ['vital-point', 'two-eyes', 'false-eye', 'corner', 'race'] as const) {
      expect(categories.has(required), `${required} (${CATEGORY_LABELS[required]})`).toBe(true);
    }
    expect(new Set(TSUMEGO_PROBLEMS.map((p) => p.difficulty)).size).toBeGreaterThanOrEqual(4);
    expect(PROBLEMS_BY_DIFFICULTY.flatMap((g) => g.problems)).toHaveLength(TSUMEGO_PROBLEMS.length);
  });

  it('describes every problem consistently (side to play, target, objective text)', () => {
    for (const p of TSUMEGO_PROBLEMS) {
      const board = problemBoard(p);
      const target = pointIndex(p, p.target);
      const defender = board.get(target);
      expect(defender, `${p.id} target must be a stone`).not.toBe(0);
      if (p.objective === 'live') expect(colorOf(p)).toBe(defender);
      else expect(colorOf(p)).toBe(opponent(defender as 1 | 2));
      if (p.protect) {
        expect(board.get(pointIndex(p, p.protect))).toBe(colorOf(p));
        expect(p.category).toBe('race');
      }
      expect(objectiveText(p)).toMatch(/^(Black|White) to play/);
      // the position is legal: no group is without liberties
      for (let i = 0; i < board.cells.length; i++) {
        if (board.get(i) !== 0) expect(board.libertyCount(i), p.id).toBeGreaterThan(0);
      }
      // solutions and refutations are distinct, legal, empty points
      const all = [...p.solutions, ...p.refutations.map((r) => r.move)];
      expect(new Set(all.map(ptName)).size).toBe(all.length);
      for (const m of all)
        expect(board.isLegal(pointIndex(p, m), colorOf(p)), `${p.id} ${ptName(m)}`).toBe(true);
    }
  });
});

describe('every problem is machine-verified', () => {
  for (const problem of TSUMEGO_PROBLEMS) {
    it(`${problem.id}: the solutions are exactly the winning first moves, all others are refuted`, () => {
      const board = problemBoard(problem);
      const judge = createJudge({
        board,
        toPlay: colorOf(problem),
        target: pointIndex(problem, problem.target),
        ...(problem.protect ? { protect: pointIndex(problem, problem.protect) } : {}),
        depth: problem.depth,
      });
      const width = board.topology.width;
      const toPt = (m: number): [number, number] => [m % width, Math.floor(m / width)];

      const winning: [number, number][] = [];
      const failing: [number, number][] = [];
      const unknown: [number, number][] = [];
      for (const move of judge.legalMoves()) {
        if (judge.succeeds(move)) winning.push(toPt(move));
        else if (judge.fails(move)) failing.push(toPt(move));
        else unknown.push(toPt(move));
      }

      // 1. nothing is left unproved: every legal first move either works or provably fails
      expect(unknown.map(ptName), 'moves neither proved nor refuted').toEqual([]);
      // 2. the stored answers are exactly the proved ones (no unlisted second solution)
      expect(winning.map(ptName).sort()).toEqual(problem.solutions.map(ptName).sort());
      // 3. each tempting wrong move is a proved failure
      for (const r of problem.refutations) {
        expect(
          failing.some((f) => sameMove(f, r.move)),
          `refutation ${ptName(r.move)}`,
        ).toBe(true);
      }
      // 4. the depth limit is not slack: the answer is not already found much sooner (documented)
      expect(problem.depth).toBeGreaterThanOrEqual(10);
    });
  }
});

describe('textbook lines replayed on the rules engine (independent of the search)', () => {
  const play = (rows: readonly string[], moves: [number, number, 'X' | 'O'][]) => {
    const board = boardFromRows(rows);
    const w = board.topology.width;
    const results = moves.map(([x, y, c]) => board.play(y * w + x, c === 'X' ? BLACK : WHITE));
    return { board, results, w };
  };

  it('straight three: the middle point kills, and the end point does not', () => {
    const rows = ['#X...X#', '#XXXXX#', '#######'];
    // White takes the middle; Black fills one side; White captures the whole group at the other
    const { board, results } = play(rows, [
      [3, 0, 'O'],
      [2, 0, 'X'],
      [4, 0, 'O'],
    ]);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(board.get(1)).toBe(0); // the Black group is gone
    // White at the end instead: Black captures it with the middle point and keeps two eyes
    const end = play(rows, [
      [2, 0, 'O'],
      [3, 0, 'X'],
    ]);
    expect(end.results.every((r) => r.ok)).toBe(true);
    expect(end.board.get(2)).toBe(0); // the white stone was captured
    expect(isUnconditionallyAlive(end.board, 1 * 7 + 1)).toBe(true); // two eyes at (2,0) and (4,0)
  });

  it('false eye: capturing the cutting stone frees the edge stone', () => {
    const rows = ['#X.X.XX#', '.OXXXXX#', '########'];
    const before = boardFromRows(rows);
    expect(before.libertyCount(1)).toBe(1); // the edge stone is in atari: the left eye is false
    const { board, results } = play(rows, [[0, 1, 'X']]);
    expect(results[0]?.ok).toBe(true);
    expect(board.get(8 + 1)).toBe(0); // the white stone at (1,1) is gone
    expect(board.libertyCount(1)).toBe(2);
  });

  it('plus-shaped five: Black at the centre lives with four eyes', () => {
    const { board } = play(['#XX.XX#', '#X...X#', '#XX.XX#', '##XXX##', '#######'], [[3, 1, 'X']]);
    expect(isUnconditionallyAlive(board, 1 * 7 + 1)).toBe(true);
  });
});

describe("Benson's algorithm", () => {
  const alive = (rows: string[], x: number, y: number) => {
    const board = boardFromRows(rows);
    return isUnconditionallyAlive(board, y * board.topology.width + x);
  };

  it('two real eyes are alive; one eye is not', () => {
    expect(alive(['XXXXX#', 'X.X.X#', 'XXXXX#', '######'], 0, 0)).toBe(true);
    expect(alive(['XXXXX#', 'X...X#', 'XXXXX#', '######'], 0, 0)).toBe(false);
  });

  it('a straight three is not alive until the middle point is played', () => {
    expect(alive(['#X...X#', '#XXXXX#', '#######'], 1, 0)).toBe(false);
    expect(alive(['#X.X.X#', '#XXXXX#', '#######'], 1, 0)).toBe(true);
  });

  it('a false eye does not count as an eye', () => {
    // the left point is a false eye: its stone is cut off by the white stone below
    expect(alive(['#X.X.XX#', '.OXXXXX#', '########'], 3, 0)).toBe(false);
  });

  it('a stone inside an eye space leaves one region, not two', () => {
    expect(alive(['XXXXX#', 'X.O.X#', 'XXXXX#', '######'], 0, 0)).toBe(false);
  });

  it('judges separate chains separately', () => {
    const rows = ['XXXXX#XXXXX#', 'X.X.X#X...X#', 'XXXXX#XXXXX#', '############'];
    expect(alive(rows, 0, 0)).toBe(true);
    expect(alive(rows, 6, 0)).toBe(false);
  });
});

describe('prover behaviour', () => {
  const sample = TSUMEGO_PROBLEMS.find((p) => p.id === 'straight-three-kill');

  it('is symmetric: the winning move cannot also be refuted', () => {
    if (!sample) throw new Error('missing sample problem');
    const board = problemBoard(sample);
    const spec = {
      board,
      toPlay: colorOf(sample),
      target: pointIndex(sample, sample.target),
      depth: sample.depth,
    };
    const judge = createJudge(spec);
    for (const move of judge.legalMoves()) {
      expect(judge.succeeds(move) && judge.fails(move)).toBe(false);
    }
  });

  it('a depth that is too small proves nothing (it never claims a false win)', () => {
    if (!sample) throw new Error('missing sample problem');
    const board = problemBoard(sample);
    const target = pointIndex(sample, sample.target);
    const shallow = createJudge({ board, toPlay: colorOf(sample), target, depth: 2 });
    expect(shallow.succeeds(pointIndex(sample, sample.solutions[0] as [number, number]))).toBe(
      false,
    );
  });

  it('a stone already captured counts as killed', () => {
    const board = boardFromRows(['.XO..', 'X.OO.', '.....', '.....', '.....']);
    const solver = createSolver({ target: 0 * 5 + 1 }, board);
    // black at (1,0) has one liberty (0,0)... white plays there and captures: attacker wins in one move
    expect(solver.attackerKills(board, WHITE, 3)).toBe(true);
  });
});
