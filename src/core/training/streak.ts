import { addDays, type LocalDate } from '../time/localDate';

/** One calendar day of activity (a row of the `dailySummary` rollup). */
export interface DaySummary {
  localDate: LocalDate;
  durationSec: number;
  sessions: number;
  activities: number;
}

/** What makes a day count towards the streak (Settings → streak rule). */
export type StreakRule = 'any_session' | 'goal_met';

export interface StreakState {
  /** Consecutive qualifying days ending today, or yesterday when today is still open. */
  current: number;
  longest: number;
  activeToday: boolean;
  /** A streak exists but today has not qualified yet: training today keeps it alive. */
  atRisk: boolean;
  lastActiveDate: LocalDate | null;
}

export const EMPTY_STREAK: StreakState = {
  current: 0,
  longest: 0,
  activeToday: false,
  atRisk: false,
  lastActiveDate: null,
};

/** Dates (sorted, unique) on which the rule is satisfied. */
export function qualifyingDates(
  days: readonly DaySummary[],
  rule: StreakRule,
  goalMinutes: number,
): LocalDate[] {
  const goalSec = goalMinutes * 60;
  const dates = days
    .filter((d) => (rule === 'goal_met' ? d.durationSec >= goalSec : d.sessions + d.activities > 0))
    .map((d) => d.localDate);
  return [...new Set(dates)].sort();
}

/**
 * Streak over a set of qualifying dates. Calendar arithmetic is done on local dates (not 24 h
 * blocks), so DST changes cannot skip or repeat a day. A missed day resets the streak, but
 * today not being finished yet does NOT break yesterday's streak.
 */
export function computeStreak(dates: readonly LocalDate[], today: LocalDate): StreakState {
  if (dates.length === 0) return EMPTY_STREAK;
  const sorted = [...new Set(dates)].sort();
  const set = new Set(sorted);

  let longest = 0;
  let run = 0;
  let previous: LocalDate | null = null;
  for (const date of sorted) {
    run = previous !== null && addDays(previous, 1) === date ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  }

  const activeToday = set.has(today);
  const yesterday = addDays(today, -1);
  let current = 0;
  if (activeToday || set.has(yesterday)) {
    let cursor: LocalDate = activeToday ? today : yesterday;
    while (set.has(cursor)) {
      current += 1;
      cursor = addDays(cursor, -1);
    }
  }

  return {
    current,
    longest,
    activeToday,
    atRisk: current > 0 && !activeToday,
    lastActiveDate: sorted.at(-1) ?? null,
  };
}
