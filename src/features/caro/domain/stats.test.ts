import { describe, expect, it } from 'vitest';
import type { Outcome } from './play';
import { computeStats, type FinishedGame } from './stats';

let n = 0;
const game = (
  outcome: Outcome,
  endedAt: number,
  level: FinishedGame['level'] = 'medium',
): FinishedGame => ({ id: `g${n++}`, level, outcome, endedAt, size: 15, moves: 20 });

describe('computeStats', () => {
  it('is empty and has no win rate before the first game', () => {
    const stats = computeStats([]);
    expect(stats.total).toEqual({ played: 0, won: 0, lost: 0, drawn: 0 });
    expect(stats.winRate).toBeNull();
    expect(stats.winStreak).toBe(0);
  });

  it('tallies totals and per level; a draw is not a win', () => {
    const stats = computeStats([
      game('win', 1, 'easy'),
      game('win', 2, 'easy'),
      game('loss', 3, 'hard'),
      game('draw', 4, 'medium'),
    ]);
    expect(stats.total).toEqual({ played: 4, won: 2, lost: 1, drawn: 1 });
    expect(stats.byLevel.easy).toEqual({ played: 2, won: 2, lost: 0, drawn: 0 });
    expect(stats.byLevel.medium.drawn).toBe(1);
    expect(stats.byLevel.hard.lost).toBe(1);
    expect(stats.winRate).toBe(0.5);
  });

  it('counts the current win streak from the newest game, whatever the input order', () => {
    const games = [game('win', 5), game('loss', 2), game('win', 4), game('win', 3), game('win', 1)];
    const stats = computeStats(games);
    expect(stats.winStreak).toBe(3); // games 3, 4, 5
    expect(stats.bestWinStreak).toBe(3);
  });

  it('resets the streak on a loss or a draw but remembers the best run', () => {
    const stats = computeStats([
      game('win', 1),
      game('win', 2),
      game('win', 3),
      game('draw', 4),
      game('win', 5),
    ]);
    expect(stats.winStreak).toBe(1);
    expect(stats.bestWinStreak).toBe(3);
  });
});
