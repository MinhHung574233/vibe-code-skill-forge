import { describe, expect, it } from 'vitest';
import { generateScramble, seededRandom } from './scramble';
import { applyScramble, isSolved } from './cube';
import {
  averageOf,
  bestAverageOf,
  bestSingle,
  countPersonalBests,
  effectiveMs,
  formatAverage,
  formatSolve,
  formatSolveTime,
  meanOf,
  type Solve,
} from './stats';

const s = (timeMs: number, penalty: Solve['penalty'] = 'none'): Solve => ({ timeMs, penalty });

describe('solve times', () => {
  it('applies penalties', () => {
    expect(effectiveMs(s(10_000))).toBe(10_000);
    expect(effectiveMs(s(10_000, 'plus2'))).toBe(12_000);
    expect(effectiveMs(s(10_000, 'dnf'))).toBeNull();
  });

  it('formats like a timer: truncated hundredths, minutes from 60 s', () => {
    expect(formatSolveTime(12_349)).toBe('12.34');
    expect(formatSolveTime(5_000)).toBe('5.00');
    expect(formatSolveTime(62_050)).toBe('1:02.05');
    expect(formatSolve(s(10_000, 'plus2'))).toBe('12.00+');
    expect(formatSolve(s(10_000, 'dnf'))).toBe('DNF');
    expect(formatAverage(null)).toBe('–');
    expect(formatAverage('DNF')).toBe('DNF');
  });
});

describe('averages (WCA trimmed mean)', () => {
  it('Ao5 drops the best and worst of the last five', () => {
    const solves = [s(9000), s(10_000), s(11_000), s(12_000), s(30_000)];
    expect(averageOf(solves, 5)).toBe(11_000); // (10+11+12)/3
  });

  it('is null until there are enough solves, and only looks at the last n', () => {
    expect(averageOf([s(1), s(2), s(3), s(4)], 5)).toBeNull();
    const solves = [s(99_000), s(10_000), s(10_000), s(10_000), s(10_000), s(10_000)];
    expect(averageOf(solves, 5)).toBe(10_000);
  });

  it('one DNF counts as the worst solve; two make the average a DNF', () => {
    const one = [s(10_000), s(11_000), s(12_000), s(13_000), s(1, 'dnf')];
    expect(averageOf(one, 5)).toBe(12_000); // drop best 10 and the DNF -> (11+12+13)/3
    const two = [s(10_000), s(11_000), s(12_000), s(1, 'dnf'), s(1, 'dnf')];
    expect(averageOf(two, 5)).toBe('DNF');
  });

  it('applies +2 before averaging', () => {
    const solves = [s(10_000), s(10_000), s(10_000, 'plus2'), s(10_000), s(10_000)];
    expect(averageOf(solves, 5)).toBe(10_000); // 12 is trimmed as the worst
  });

  it('Ao12 and the best average over time', () => {
    const times = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7];
    const solves = times.map((t) => s(t * 1000));
    expect(averageOf(solves, 12)).not.toBeNull();
    // The most recent window is also the fastest here.
    expect(bestAverageOf(solves, 5)).toBe(averageOf(solves, 5));
    expect(bestAverageOf(solves.slice(0, 3), 5)).toBeNull();
  });

  it('best single and mean ignore DNFs', () => {
    const solves = [s(12_000), s(9_000, 'dnf'), s(10_000), s(8_000, 'plus2')];
    expect(bestSingle(solves)).toBe(10_000);
    expect(meanOf(solves)).toBeCloseTo(32_000 / 3);
    expect(bestSingle([s(1, 'dnf')])).toBeNull();
    expect(meanOf([])).toBeNull();
  });
});

describe('personal bests', () => {
  it('counts only solves that beat everything before them; the first is a baseline', () => {
    expect(countPersonalBests([])).toBe(0);
    expect(countPersonalBests([s(10_000)])).toBe(0);
    expect(countPersonalBests([s(10_000), s(9_000)])).toBe(1);
    expect(countPersonalBests([s(10_000), s(11_000), s(9_000), s(9_000), s(8_000)])).toBe(2);
    expect(countPersonalBests([s(10_000), s(1_000, 'dnf'), s(10_000)])).toBe(0);
  });
});

describe('scrambles', () => {
  it('is reproducible with a seed and has the right length', () => {
    expect(generateScramble(seededRandom(7))).toBe(generateScramble(seededRandom(7)));
    expect(generateScramble(seededRandom(7)).split(' ')).toHaveLength(20);
    expect(generateScramble(seededRandom(7))).not.toBe(generateScramble(seededRandom(8)));
  });

  it('never repeats a face back to back or uses one axis three times in a row', () => {
    const axis: Record<string, string> = { U: 'y', D: 'y', L: 'x', R: 'x', F: 'z', B: 'z' };
    for (let seed = 1; seed <= 200; seed++) {
      const faces = generateScramble(seededRandom(seed))
        .split(' ')
        .map((m) => m[0] as string);
      for (let i = 1; i < faces.length; i++) {
        expect(faces[i]).not.toBe(faces[i - 1]);
        if (i >= 2) {
          const run = [faces[i - 2], faces[i - 1], faces[i]].map((f) => axis[f as string]);
          expect(new Set(run).size).toBeGreaterThan(1);
        }
      }
    }
  });

  it('only uses legal turns and actually scrambles the cube', () => {
    const scramble = generateScramble(seededRandom(3));
    expect(scramble).toMatch(/^([UDLRFB][2']? ?)+$/);
    const cube = applyScramble(scramble);
    expect(isSolved(cube)).toBe(false);
  });
});
