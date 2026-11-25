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
