/**
 * Training-engine configuration. XP values are configurable data (PRD §6): these are the
 * defaults; a row in the `xpRules` store overrides one.
 */
export const ACTIVITY_TYPES = [
  'practice_session', // module-less practice (timer or manual log)
  'vocab_session',
  'java_lesson',
  'chess_puzzle',
  'rubik_session',
  'daily_challenge',
  'game_session', // a finished board-game match (Caro, Chess, Go)
  'tools_lesson', // Developer Tools lesson
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export function isActivityType(value: string): value is ActivityType {
  return (ACTIVITY_TYPES as readonly string[]).includes(value);
}

export const DEFAULT_XP_RULES: Readonly<Record<ActivityType, number>> = {
  practice_session: 10,
  vocab_session: 20,
  java_lesson: 30,
  chess_puzzle: 10,
  rubik_session: 15,
  daily_challenge: 50,
  game_session: 15,
  tools_lesson: 20,
};

export const ACTIVITY_LABELS: Readonly<Record<ActivityType, string>> = {
  practice_session: 'Practice session',
  vocab_session: 'Vocabulary session',
  java_lesson: 'Java lesson',
  chess_puzzle: 'Chess puzzle',
  rubik_session: 'Rubik session',
  daily_challenge: 'Daily challenge',
  game_session: 'Game',
  tools_lesson: 'Developer Tools lesson',
};

/** Module id used for sessions that do not belong to one of the seven modules. */
export const GENERAL_MODULE = 'general';

/**
 * Anti-farming rules for generic practice. XP is only awarded for a real, timed session of at
 * least this long; manual log entries still count for time, streak and analytics.
 */
export const MIN_REWARDED_TIMER_SESSION_SEC = 5 * 60;

/** Sanity bounds for a single session (a forgotten running timer must not distort stats). */
export const MAX_SESSION_SEC = 12 * 60 * 60;
export const MIN_SESSION_SEC = 60;

/** Module activities (a puzzle, a lesson, a game) can legitimately be shorter than a minute. */
export const MIN_MODULE_ACTIVITY_SEC = 1;

/** A skill's progress is measured against this many days when it has a weekly goal. */
export const WEEK_DAYS = 7;
