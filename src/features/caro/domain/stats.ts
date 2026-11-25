import { LEVELS, type Level } from './ai/levels';
import type { BoardSize } from './board';
import type { Outcome } from './play';

/** A stored, finished game as the statistics and the history list need it. */
export interface FinishedGame {
  id: string;
  level: Level;
  outcome: Outcome;
  endedAt: number;
  size: BoardSize;
  moves: number;
}

export interface Tally {
  played: number;
  won: number;
  lost: number;
  drawn: number;
}

export interface CaroStats {
  total: Tally;
  byLevel: Record<Level, Tally>;
  /** Wins / played, 0..1; null before the first game. A draw is not a win. */
  winRate: number | null;
  /** Consecutive wins ending at the most recent game (a draw or loss resets it). */
  winStreak: number;
  bestWinStreak: number;
}

const emptyTally = (): Tally => ({ played: 0, won: 0, lost: 0, drawn: 0 });

function add(tally: Tally, outcome: Outcome): void {
  tally.played += 1;
  if (outcome === 'win') tally.won += 1;
  else if (outcome === 'loss') tally.lost += 1;
  else tally.drawn += 1;
}

export function computeStats(games: readonly FinishedGame[]): CaroStats {
  const oldestFirst = [...games].sort((a, b) => a.endedAt - b.endedAt);
  const total = emptyTally();
  const byLevel = Object.fromEntries(LEVELS.map((level) => [level, emptyTally()])) as Record<
    Level,
    Tally
  >;
  let streak = 0;
  let best = 0;
  for (const game of oldestFirst) {
    add(total, game.outcome);
    add(byLevel[game.level], game.outcome);
    streak = game.outcome === 'win' ? streak + 1 : 0;
    best = Math.max(best, streak);
  }
  return {
    total,
    byLevel,
    winRate: total.played === 0 ? null : total.won / total.played,
    winStreak: streak,
    bestWinStreak: best,
  };
}
