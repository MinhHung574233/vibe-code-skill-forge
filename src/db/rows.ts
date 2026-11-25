/**
 * Persisted row shapes (data layer). Feature domain types map from/to these in repositories.
 * Indexed booleans are stored as 0|1 because IndexedDB cannot index booleans.
 */
export interface SettingRow {
  key: string;
  value: unknown;
  updatedAt: number;
}

export type SkillCategory = 'mind' | 'language' | 'technical' | 'games' | 'custom';

export interface SkillRow {
  id: string;
  name: string;
  category: SkillCategory;
  moduleId?: string;
  priority: 1 | 2 | 3;
  description?: string;
  isArchived: 0 | 1;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface SkillGoalRow {
  id: string;
  skillId: string;
  metric: string;
  target: number;
  direction: 'at_least' | 'at_most';
  deadlineDate?: string;
  achievedAt?: number;
  createdAt: number;
  updatedAt: number;
}

/** Crash-safe resume state for in-progress timers/games/sessions. */
export interface DraftRow {
  key: string;
  value: unknown;
  updatedAt: number;
}

/** A finished training session (timer or manual). `moduleId` is `general` for module-less practice. */
export interface SessionRow {
  id: string;
  moduleId: string;
  activityType: string;
  skillId?: string;
  startedAt: number;
  endedAt: number;
  durationSec: number;
  /** Calendar day in the device timezone, fixed at write time (streak-safe). */
  localDate: string;
  source: 'timer' | 'manual';
  /** Normalised 0..1 when meaningful (accuracy, win = 1). */
  score?: number;
  result?: Record<string, unknown>;
  notes?: string;
  createdAt: number;
}

/** Idempotency anchor: the primary key is the activity key (e.g. `session:<id>`). */
export interface CompletionRow {
  activityKey: string;
  moduleId: string;
  activityType: string;
  sessionId?: string;
  completedAt: number;
  localDate: string;
}

/** User override of an XP reward (defaults live in core/training/config.ts). */
export interface XpRuleRow {
  activityType: string;
  xp: number;
  enabled: 0 | 1;
  updatedAt: number;
}

/** Append-only XP ledger. Total XP = sum; the level is derived, never stored. */
export interface XpLedgerRow {
  id: string;
  activityKey: string;
  xp: number;
  skillId?: string;
  moduleId: string;
  localDate: string;
  awardedAt: number;
}

/** Per-day rollup maintained in the same transaction as the session write. */
export interface DailySummaryRow {
  localDate: string;
  durationSec: number;
  sessions: number;
  activities: number;
  xp: number;
}

/** An unlocked achievement with the facts that satisfied it (auditable). */
export interface AchievementRow {
  achievementId: string;
  unlockedAt: number;
  evidence: Record<string, unknown>;
}

// ---- Training modules (schema v3) -------------------------------------------------------------

/** One Rubik solve. `timeMs` is the raw time; the penalty is applied when computing results. */
export interface RubikSolveRow {
  id: string;
  timeMs: number;
  penalty: 'none' | 'plus2' | 'dnf';
  scramble: string;
  createdAt: number;
  localDate: string;
}

/** Learning state of one algorithm from the bundled library. */
export interface AlgorithmProgressRow {
  algId: string;
  status: 'learning' | 'learned';
  updatedAt: number;
}

/** Spaced-repetition (SM-2) state of one bundled vocabulary word. */
export interface VocabProgressRow {
  wordId: string;
  state: 'learning' | 'review';
  /** SM-2 ease factor, never below 1.3. */
  ease: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  /** Epoch ms when the card is next due. */
  dueAt: number;
  lastReviewedAt: number;
  createdAt: number;
}

/** Completion of one bundled lesson (Java, Developer Tools). */
export interface LessonProgressRow {
  lessonId: string;
  pathId: string;
  completedAt: number;
  /** Best quiz score 0..1. */
  bestScore: number;
  attempts: number;
}

/** A finished board-game match (Caro, Chess, Go). */
export interface GameRecordRow {
  id: string;
  game: 'caro' | 'chess' | 'go';
  /** Opponent strength label, e.g. `easy`, `medium`, `hard`. */
  level: string;
  result: 'win' | 'loss' | 'draw';
  /** Free-form per-game details (board size, moves, ...). */
  details?: Record<string, unknown>;
  startedAt: number;
  endedAt: number;
  localDate: string;
}

/** Progress on one bundled puzzle (chess puzzles, tsumego). */
export interface PuzzleProgressRow {
  puzzleId: string;
  game: 'chess' | 'go';
  solved: 0 | 1;
  attempts: number;
  lastAttemptAt: number;
  solvedAt?: number;
}

/** A rating value, e.g. key `chess-puzzle` or `chess-play`. */
export interface RatingRow {
  key: string;
  value: number;
  games: number;
  updatedAt: number;
}
