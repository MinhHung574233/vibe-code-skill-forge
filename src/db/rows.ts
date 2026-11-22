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
