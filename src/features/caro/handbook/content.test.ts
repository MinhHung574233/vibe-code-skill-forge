import { describe, expect, it } from 'vitest';
import { missingTranslations, placeholderMismatches } from '@/i18n/testing';
import { VI } from '@/i18n/vi';
import { caroHandbook } from '@/i18n/vi/caroHandbook';
import { chooseMove } from '../domain/ai/engine';
import { LEVEL_CONFIG } from '../domain/ai/levels';
import { OBSTACLE, type BoardSize } from '../domain/board';
import type { CaroRule } from '../domain/rules';
import { winningLine } from '../domain/rules';
import {
  completingCells,
  countStones,
  embed,
  goalCells,
  isForcedWin,
  isDeadFiveAt,
  makesWin,
  openFourCells,
  opponentStillWins,
  spotIndex,
  winsAt,
  wrongHasKind,
  type Embedded,
} from './analysis';
import {
  ALL_DIAGRAMS,
  ALL_EXERCISES,
  CHAPTERS,
  chapterDiagrams,
  chapterExercises,
  handbookStrings,
  LEGEND_DIAGRAM,
} from './content';
import type { Claim, Diagram, Spot } from './types';

const ruleOf = (item: { rule?: CaroRule }): CaroRule => item.rule ?? 'freestyle';

const inside = (p: Embedded, spot: Spot): boolean =>
  spot[0] >= 0 && spot[0] < p.height && spot[1] >= 0 && spot[1] < p.width;

const key = (spot: Spot): string => `${spot[0]},${spot[1]}`;

describe('handbook content', () => {
  it('has the chapters of the plan, with unique ids and real text', () => {
    expect(CHAPTERS.map((c) => c.id)).toEqual([
      'basics',
      'rules',
      'shapes',
      'combinations',
      'defence',
      'openings',
      'obstacles',
      'beat-the-app',
    ]);
    expect(new Set(CHAPTERS.map((c) => c.id)).size).toBe(CHAPTERS.length);
    for (const chapter of CHAPTERS) {
      expect(chapter.title.trim()).not.toBe('');
      expect(chapter.summary.trim()).not.toBe('');
      expect(chapter.minutes).toBeGreaterThanOrEqual(2);
      expect(chapter.minutes).toBeLessThanOrEqual(5);
      expect(chapter.blocks.filter((b) => b.kind === 'p').length).toBeGreaterThan(0);
    }
  });

  it('has at least 25 diagrams and 8 exercises, with unique ids', () => {
    expect(ALL_DIAGRAMS.length).toBeGreaterThanOrEqual(25);
    expect(ALL_EXERCISES.length).toBeGreaterThanOrEqual(8);
    expect(new Set(ALL_DIAGRAMS.map((d) => d.id)).size).toBe(ALL_DIAGRAMS.length);
    expect(new Set(ALL_EXERCISES.map((e) => e.id)).size).toBe(ALL_EXERCISES.length);
    const withExercises = CHAPTERS.filter((c) => chapterExercises(c).length > 0).map((c) => c.id);
    expect(withExercises).toEqual(expect.arrayContaining(['combinations', 'defence', 'obstacles']));
    for (const chapter of CHAPTERS) expect(chapterDiagrams(chapter).length).toBeGreaterThan(0);
  });

  it('has no empty text anywhere', () => {
    const strings = handbookStrings();
    expect(strings.length).toBeGreaterThan(150);
    expect(strings.filter((s) => s.trim() === '')).toEqual([]);
  });
});

describe('handbook diagrams', () => {
  for (const diagram of ALL_DIAGRAMS) {
    describe(diagram.id, () => {
      const position = embed(diagram);
      const rule = ruleOf(diagram);
      const spotIdx = (spot: Spot): number => spotIndex(position, spot);

      it('is a rectangle with legal stones (or is marked as a pattern)', () => {
        expect(position.width).toBeGreaterThan(0);
        const { x, o } = countStones(diagram.rows);
        if (!diagram.pattern) expect(Math.abs(x - o)).toBeLessThanOrEqual(1);
        expect(diagram.caption.trim()).not.toBe('');
      });

      it('has marks inside the window, move marks on empty squares', () => {
        for (const mark of diagram.marks ?? []) {
          expect(inside(position, mark.at)).toBe(true);
          if (mark.kind === 'move') {
            expect(position.cells[spotIdx(mark.at)]).toBe(0);
          }
        }
      });

      it('has no five already on the board (unless it draws a finished five)', () => {
        if ((diagram.marks ?? []).filter((m) => m.kind === 'win').length >= 5) return;
        for (let i = 0; i < position.cells.length; i++) {
          if (position.cells[i] === 1 || position.cells[i] === 2) {
            expect(winningLine(position.cells, position.size, i, 'freestyle')).toBeNull();
          }
        }
      });

      for (const claim of diagram.claims ?? []) {
        it(`claim holds: ${claim.kind}`, () => {
          verifyClaim(diagram, position, rule, claim);
        });
      }
    });
  }

  it('draws diagram rows only with the symbols X O # and a dot', () => {
    for (const d of ALL_DIAGRAMS) for (const row of d.rows) expect(row).toMatch(/^[XO#.]+$/);
  });

  it('claims something provable in every chapter that teaches shapes or rules', () => {
    const claimed = (id: string) =>
      CHAPTERS.find((c) => c.id === id) &&
      chapterDiagrams(CHAPTERS.find((c) => c.id === id)!).filter((d) => (d.claims ?? []).length > 0)
        .length;
    expect(claimed('rules')).toBeGreaterThanOrEqual(5);
    expect(claimed('shapes')).toBeGreaterThanOrEqual(6);
    expect(claimed('combinations')).toBeGreaterThanOrEqual(4);
  });

  it('keeps the legend diagram simple', () => {
    expect(LEGEND_DIAGRAM.rows).toHaveLength(1);
  });
});

function verifyClaim(diagram: Diagram, p: Embedded, rule: CaroRule, claim: Claim): void {
  const idx = (spot: Spot): number => spotIndex(p, spot);
  const sorted = (spots: readonly Spot[]): number[] => spots.map(idx).sort((a, b) => a - b);
  switch (claim.kind) {
    case 'wins':
      expect(winsAt(p.cells, p.size, claim.stone, idx(claim.at), rule)).toBe(true);
      break;
    case 'dead-five':
      expect(isDeadFiveAt(p.cells, p.size, claim.stone, idx(claim.at), rule)).toBe(true);
      expect(rule).toBe('blocked');
      break;
    case 'completing':
      expect(completingCells(p.cells, p.size, claim.stone, rule)).toEqual(sorted(claim.cells));
      break;
    case 'open-four-cells':
      expect(openFourCells(p.cells, p.size, claim.stone, rule)).toEqual(sorted(claim.cells));
      break;
    case 'forced-win':
      expect(isForcedWin(p.cells, p.size, claim.stone, idx(claim.at), rule)).toBe(true);
      break;
  }
  void diagram;
}

/** The alternating move list that rebuilds an exercise position (first player's stones first). */
function movesOf(cells: Uint8Array): number[] {
  const xs: number[] = [];
  const os: number[] = [];
  cells.forEach((v, i) => {
    if (v === 1) xs.push(i);
    else if (v === 2) os.push(i);
  });
  const moves: number[] = [];
  xs.forEach((m, k) => {
    moves.push(m);
    if (k < os.length) moves.push(os[k]!);
  });
  return moves;
}

function engineReply(p: Embedded, rule: CaroRule) {
  const obstacles: number[] = [];
  p.cells.forEach((v, i) => {
    if (v === OBSTACLE) obstacles.push(i);
  });
  return chooseMove({
    size: p.size as BoardSize,
    moves: movesOf(p.cells),
    level: 'hard',
    rule,
    obstacles,
  });
}

describe('handbook exercises', () => {
  it('covers defence, combinations and obstacles with at least 8 exercises', () => {
    expect(ALL_EXERCISES.length).toBeGreaterThanOrEqual(8);
    for (const id of ['combinations', 'defence', 'obstacles']) {
      const chapter = CHAPTERS.find((c) => c.id === id)!;
      expect(chapterExercises(chapter).length).toBeGreaterThanOrEqual(3);
    }
  });

  for (const exercise of ALL_EXERCISES) {
    describe(exercise.id, { timeout: 60_000 }, () => {
      const rule = ruleOf(exercise);
      const p = embed(exercise);
      const idx = (spot: Spot): number => spotIndex(p, spot);
      let goal: number[] | null = null;
      const goals = (): number[] => (goal ??= goalCells(exercise.goal, p.cells, p.size, rule));

      it('is a legal position with the first player to move and no five on the board', () => {
        const { x, o } = countStones(exercise.rows);
        expect(x).toBe(o);
        for (let i = 0; i < p.cells.length; i++) {
          if (p.cells[i] === 1 || p.cells[i] === 2) {
            expect(winningLine(p.cells, p.size, i, 'freestyle')).toBeNull();
          }
        }
        expect(exercise.prompt.trim()).not.toBe('');
      });

      it('has one correct square, inside the window and empty', () => {
        expect(inside(p, exercise.answer)).toBe(true);
        expect(p.cells[idx(exercise.answer)]).toBe(0);
        expect(goals().map((i) => i)).toEqual([idx(exercise.answer)]);
      });

      it('lists wrong answers that are on the board, empty and really fail', () => {
        const seen = new Set<string>();
        for (const wrong of exercise.wrong) {
          expect(inside(p, wrong.at)).toBe(true);
          expect(p.cells[idx(wrong.at)]).toBe(0);
          expect(key(wrong.at)).not.toBe(key(exercise.answer));
          expect(seen.has(key(wrong.at))).toBe(false);
          seen.add(key(wrong.at));
          expect(goals()).not.toContain(idx(wrong.at));
          if (wrong.kind) {
            expect(wrongHasKind(wrong.kind, p.cells, p.size, idx(wrong.at), rule)).toBe(true);
          }
          expect(wrong.why.trim()).not.toBe('');
        }
      });

      it('wins (or defends) as the text says, proven with the rules', () => {
        const move = idx(exercise.answer);
        switch (exercise.goal) {
          case 'five':
            expect(winsAt(p.cells, p.size, 1, move, rule)).toBe(true);
            break;
          case 'unstoppable-four': {
            p.cells[move] = 1;
            expect(completingCells(p.cells, p.size, 1, rule).length).toBeGreaterThanOrEqual(2);
            expect(completingCells(p.cells, p.size, 2, rule)).toEqual([]);
            p.cells[move] = 0;
            expect(isForcedWin(p.cells, p.size, 1, move, rule)).toBe(true);
            break;
          }
          case 'four-three':
          case 'three-three':
            expect(isForcedWin(p.cells, p.size, 1, move, rule)).toBe(true);
            break;
          case 'block-four': {
            expect(completingCells(p.cells, p.size, 2, rule).length).toBeGreaterThan(0);
            p.cells[move] = 1;
            expect(completingCells(p.cells, p.size, 2, rule)).toEqual([]);
            p.cells[move] = 0;
            break;
          }
          case 'safe':
            expect(opponentStillWins(p.cells, p.size, 1, move, rule)).toBe(false);
            break;
        }
      });

      it('makes the opponent unable to win immediately after the answer', () => {
        const move = idx(exercise.answer);
        if (winsAt(p.cells, p.size, 1, move, rule)) return;
        p.cells[move] = 1;
        expect(completingCells(p.cells, p.size, 2, rule)).toEqual([]);
        p.cells[move] = 0;
      });

      it('agrees with the Hard engine (independent check, same rule and obstacles)', () => {
        const reply = engineReply(p, rule);
        if (exercise.goal === 'five' || exercise.goal === 'block-four') {
          expect(reply.move).toBe(idx(exercise.answer));
        } else if (exercise.goal === 'safe') {
          expect(goals()).toContain(reply.move);
        } else {
          // The engine may know another winning square; what matters is that it finds a win.
          expect(isForcedWin(p.cells, p.size, 1, reply.move, rule)).toBe(true);
        }
      });
    });
  }
});

describe('what the handbook says about the engine', () => {
  it('Medium and Hard search fours, Easy looks about two moves ahead and slips sometimes', () => {
    expect(LEVEL_CONFIG.easy.maxDepth).toBe(2);
    expect(LEVEL_CONFIG.medium.maxDepth).toBe(6);
    expect(LEVEL_CONFIG.hard.maxDepth).toBe(12);
    expect(LEVEL_CONFIG.easy.vcfFours).toBe(0);
    expect(LEVEL_CONFIG.medium.vcfFours).toBeGreaterThan(0);
    expect(LEVEL_CONFIG.hard.vcfFours).toBeGreaterThan(0);
    expect(LEVEL_CONFIG.easy.mistakeRate).toBeGreaterThan(0);
    expect(LEVEL_CONFIG.hard.mistakeRate).toBe(0);
    expect(LEVEL_CONFIG.hard.maxMs).toBeLessThanOrEqual(1000);
  });

  it('even Easy blocks a four, finishing square and all', () => {
    // X has four stones with one gap; O (three stones) is to move.
    const four = embed({
      rows: ['.........', '..XX.XX..', '.........', '...O.O...', '.O.......'],
    });
    const reply = chooseMove({ size: 15, moves: movesOf(four.cells), level: 'easy', seed: 1 });
    expect(reply.move).toBe(spotIndex(four, [1, 4]));
    expect(reply.source).toBe('block');
  });

  it('even Easy completes its own five', () => {
    // O (to move) has four in a row with one open end; X has five scattered stones.
    const win = embed({
      rows: ['.........', '.XOOOO...', '..X......', '.X.......', '.......X.', '.X.......'],
    });
    const reply = chooseMove({ size: 15, moves: movesOf(win.cells), level: 'easy', seed: 1 });
    expect(reply.move).toBe(spotIndex(win, [1, 6]));
    expect(reply.source).toBe('win');
  });

  it('Hard blocks a lone open three at one of its ends', () => {
    const three = embed({
      rows: ['.........', '.........', '..XXX....', '.........', '....O....', '......O..'],
    });
    const reply = chooseMove({ size: 15, moves: movesOf(three.cells), level: 'hard' });
    expect([spotIndex(three, [2, 1]), spotIndex(three, [2, 5])]).toContain(reply.move);
  });
});

describe('Vietnamese for the handbook', () => {
  it('has an entry for every string of the content', () => {
    expect(missingTranslations(handbookStrings())).toEqual([]);
  });

  it('keeps placeholders and never leaves an entry empty', () => {
    expect(placeholderMismatches(Object.keys(caroHandbook))).toEqual([]);
    expect(Object.values(caroHandbook).filter((v) => v.trim() === '')).toEqual([]);
  });

  it('translates the text rather than copying English', () => {
    const copied = handbookStrings().filter((s) => s.length > 14 && VI[s] === s);
    expect(copied).toEqual([]);
  });
});

describe('fast win check used by the proofs', () => {
  it('gives the same answer as winningLine of the game on random boards, both rules', () => {
    let seed = 12345;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const size = 9;
    let wins = 0;
    for (let round = 0; round < 400; round++) {
      const cells = new Uint8Array(size * size);
      // Mostly one colour with a few walls and enemies, so that fives and blocked fives are common.
      for (let i = 0; i < cells.length; i++) {
        const r = random();
        cells[i] = r < 0.55 ? 1 : r < 0.7 ? 2 : r < 0.76 ? OBSTACLE : 0;
      }
      for (let i = 0; i < cells.length; i++) {
        for (const rule of ['freestyle', 'blocked'] as const) {
          const expected = winningLine(cells, size, i, rule) !== null;
          if (expected) wins++;
          expect(makesWin(cells, size, i, rule)).toBe(expected);
        }
      }
    }
    expect(wins).toBeGreaterThan(200);
  });
});
