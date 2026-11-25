import { describe, expect, it } from 'vitest';
import { toLocalDate } from '@/core/time/localDate';
import { ManualLogSchema, manualSessionTimes } from './manual';

const NOW = new Date(2026, 10, 25, 18, 30, 0).getTime();

describe('manualSessionTimes', () => {
  it('today ends now and starts `minutes` earlier', () => {
    expect(manualSessionTimes('2026-11-25', 45, NOW)).toEqual({
      endedAt: NOW,
      startedAt: NOW - 45 * 60_000,
    });
  });

  it('an earlier day ends at noon that day and stays on that calendar day', () => {
    const t = manualSessionTimes('2026-11-20', 30, NOW);
    expect(t).not.toBeNull();
    expect(toLocalDate(t?.endedAt ?? 0)).toBe('2026-11-20');
    expect(toLocalDate(t?.startedAt ?? 0)).toBe('2026-11-20');
    expect(new Date(t?.endedAt ?? 0).getHours()).toBe(12);
  });

  it('refuses a date in the future', () => {
    expect(manualSessionTimes('2026-11-26', 30, NOW)).toBeNull();
  });
});

describe('ManualLogSchema', () => {
  const ok = { date: '2026-11-25', minutes: 30 };

  it('accepts a normal entry', () => {
    expect(ManualLogSchema.safeParse(ok).success).toBe(true);
  });

  it.each([
    [{ ...ok, minutes: 0 }, /At least 1/],
    [{ ...ok, minutes: 721 }, /At most 12 hours/],
    [{ ...ok, minutes: 12.5 }, /whole minutes/],
    [{ ...ok, minutes: Number.NaN }, undefined],
    [{ ...ok, date: '25/11/2026' }, /Pick a date/],
    [{ ...ok, date: '' }, /Pick a date/],
  ])('rejects %j', (input, message) => {
    const result = ManualLogSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success && message) expect(result.error.issues[0]?.message).toMatch(message);
  });
});
