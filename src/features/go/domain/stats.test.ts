import { describe, expect, it } from 'vitest';
import { breakdown, describeResult, tally, type GoRecord } from './stats';

const rec = (over: Partial<GoRecord> = {}): GoRecord => ({
  id: 'g',
  level: 'easy',
  size: 9,
  komi: 6.5,
  handicap: 0,
  color: 'black',
  result: 'win',
  margin: 3.5,
  by: 'score',
  startedAt: 1,
  endedAt: 2,
  ...over,
});

describe('stats', () => {
  it('tallies wins, losses and draws', () => {
    const t = tally([rec(), rec({ result: 'loss' }), rec({ result: 'draw' }), rec()]);
    expect(t).toEqual({ games: 4, wins: 2, losses: 1, draws: 1 });
    expect(tally([])).toEqual({ games: 0, wins: 0, losses: 0, draws: 0 });
  });

  it('breaks results down by level and by board size, in a fixed order', () => {
    const { byLevel, bySize } = breakdown([
      rec({ level: 'hard', size: 19, result: 'loss' }),
      rec({ level: 'easy', size: 9 }),
      rec({ level: 'easy', size: 13, result: 'loss' }),
    ]);
    expect(byLevel.map((l) => [l.level, l.tally.games])).toEqual([
      ['easy', 2],
      ['medium', 0],
      ['hard', 1],
    ]);
    expect(bySize.map((s) => [s.size, s.tally.wins, s.tally.losses])).toEqual([
      [9, 1, 0],
      [13, 0, 1],
      [19, 0, 1],
    ]);
  });

  it('describes a result in words', () => {
    expect(describeResult(rec({ margin: 3.5 }))).toBe('Won by 3.5');
    expect(describeResult(rec({ result: 'loss', margin: -12 }))).toBe('Lost by 12');
    expect(describeResult(rec({ by: 'resign', margin: 0 }))).toBe('Won by resignation');
    expect(describeResult(rec({ result: 'draw', margin: 0 }))).toBe('Draw');
  });
});
