import { z } from 'zod';
import { toLocalDate } from '@/core/time/localDate';

export const MANUAL_MIN_MINUTES = 1;
export const MANUAL_MAX_MINUTES = 720;

export const ManualLogSchema = z.object({
  /** Local calendar day, YYYY-MM-DD. */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Pick a date.'),
  minutes: z
    .number('Enter the minutes.')
    .int('Use whole minutes.')
    .min(MANUAL_MIN_MINUTES, 'At least 1 minute.')
    .max(MANUAL_MAX_MINUTES, 'At most 12 hours (720 minutes).'),
  skillId: z.string().optional(),
  notes: z.string().trim().max(2000).optional(),
});

export type ManualLogInput = z.input<typeof ManualLogSchema>;

/**
 * Start/end instants for a hand-logged session. Today's sessions end "now"; a session logged for
 * an earlier day ends at noon that day, which keeps it on the chosen calendar day in any timezone.
 * Returns null for a date in the future.
 */
export function manualSessionTimes(
  date: string,
  minutes: number,
  now: number,
): { startedAt: number; endedAt: number } | null {
  const today = toLocalDate(now);
  if (date > today) return null;
  let endedAt = now;
  if (date < today) {
    const [y, m, d] = date.split('-').map(Number) as [number, number, number];
    endedAt = new Date(y, m - 1, d, 12, 0, 0).getTime();
  }
  return { startedAt: endedAt - minutes * 60_000, endedAt };
}
