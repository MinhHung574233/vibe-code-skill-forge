import { z } from 'zod';
import type { Result } from '@/core/result';

/**
 * Typed key/value settings. Each key has a Zod schema and a default, so a missing, corrupted
 * or outdated stored value can never crash the app: it falls back to the default.
 * (The theme is a per-device convenience kept in localStorage, see theme/themeStore.ts.)
 */
export const SETTING_DEFS = {
  streakRule: { schema: z.enum(['any_session', 'goal_met']), default: 'any_session' },
  dailyGoalMinutes: { schema: z.number().int().min(1).max(600), default: 20 },
  onboardingDone: { schema: z.boolean(), default: false },
  installCoachDismissedAt: { schema: z.number().int().nullable(), default: null },
  lastBackupAt: { schema: z.number().int().nullable(), default: null },
  /** Total user-data rows at the time of the last backup (drives the "many changes" nudge). */
  lastBackupRowCount: { schema: z.number().int().nonnegative().nullable(), default: null },
} as const;

export type SettingKey = keyof typeof SETTING_DEFS;
export type SettingValue<K extends SettingKey> = z.infer<(typeof SETTING_DEFS)[K]['schema']>;

export interface SettingsRepository {
  /** Stored value, or the default when missing/invalid. */
  get<K extends SettingKey>(key: K): Promise<SettingValue<K>>;
  /** Validates, then persists. Invalid values and storage failures are returned, not thrown. */
  set<K extends SettingKey>(key: K, value: SettingValue<K>): Promise<Result<void>>;
}
