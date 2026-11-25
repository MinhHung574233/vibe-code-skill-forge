import { addDays, toLocalDate } from '@/core/time/localDate';

/**
 * Consecutive days (ending today, or yesterday if nothing is solved yet today) on which at least
 * one puzzle was solved. Unlike the app-wide streak this only counts chess puzzles.
 */
export function puzzleStreakDays(solvedAt: readonly number[], now: number): number {
  const days = new Set(solvedAt.map(toLocalDate));
  const today = toLocalDate(now);
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export interface GameTally {
  wins: number;
  draws: number;
  losses: number;
}

export function tally(results: readonly ('win' | 'draw' | 'loss')[]): GameTally {
  return {
    wins: results.filter((r) => r === 'win').length,
    draws: results.filter((r) => r === 'draw').length,
    losses: results.filter((r) => r === 'loss').length,
  };
}
