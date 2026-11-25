import { z } from 'zod';
import type { AppError } from '@/core/errors';
import type { Result } from '@/core/result';
import type { StreakState } from '@/core/training/streak';
import {
  ACTIVITY_TYPES,
  GENERAL_MODULE,
  MAX_SESSION_SEC,
  MIN_MODULE_ACTIVITY_SEC,
  MIN_SESSION_SEC,
} from '@/core/training/config';

/** How far in the future a session may end (clock skew between devices / typing). */
export const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

export const RecordSessionSchema = z
  .object({
    /** Supplied by the caller so a retry or double-tap of the same session is idempotent. */
    id: z.string().min(1),
    moduleId: z.string().min(1).default(GENERAL_MODULE),
    activityType: z.enum(ACTIVITY_TYPES),
    skillId: z.string().min(1).optional(),
    startedAt: z.number().int().positive(),
    endedAt: z.number().int().positive(),
    source: z.enum(['timer', 'manual']),
    notes: z.string().trim().max(2000).optional(),
    score: z.number().min(0).max(1).optional(),
    result: z.record(z.string(), z.unknown()).optional(),
  })
  .refine((s) => s.endedAt > s.startedAt, { message: 'A session must end after it starts.' })
  .refine(
    (s) => {
      const sec = Math.floor((s.endedAt - s.startedAt) / 1000);
      const min = s.activityType === 'practice_session' ? MIN_SESSION_SEC : MIN_MODULE_ACTIVITY_SEC;
      return sec >= min && sec <= MAX_SESSION_SEC;
    },
    { message: 'A session must last between 1 minute and 12 hours.' },
  );

export type RecordSessionInput = z.input<typeof RecordSessionSchema>;

/** Everything the UI needs to celebrate (or explain) a recorded session. */
export interface CompletionOutcome {
  sessionId: string;
  /** This activity key was already recorded: nothing was changed or re-awarded. */
  duplicate: boolean;
  xpAwarded: number;
  /** Why no XP was given for a non-duplicate session, in plain language. */
  noXpReason?: string;
  totalXp: number;
  levelBefore: number;
  levelAfter: number;
  leveledUp: boolean;
  streak: StreakState;
  newAchievementIds: string[];
}

export interface TrainingEngine {
  /** Validates, then records the session, rollup, XP and achievements in ONE transaction. */
  recordSession(input: RecordSessionInput): Promise<Result<CompletionOutcome, AppError>>;
}

/** Stable idempotency key for a session. */
export const sessionActivityKey = (sessionId: string): string => `session:${sessionId}`;
