import { describe, expect, it } from 'vitest';
import { dailySeries, distribution, formatMinutes, periodStats, trend } from './analytics';
import type { DaySummary } from './streak';

const day = (localDate: string, minutes: number, sessions = 1): DaySummary => ({
  localDate,
  durationSec: minutes * 60,
  sessions,
  activities: sessions,
});

describe('dailySeries', () => {
  it('returns exactly `length` days ending at endDate, oldest first, zero-filled', () => {
    const series = dailySeries([day('2026-11-24', 30), day('2026-11-20', 10)], '2026-11-25', 7);
    expect(series.map((d) => d.date)).toEqual([
      '2026-11-19',
      '2026-11-20',
      '2026-11-21',
      '2026-11-22',
      '2026-11-23',
      '2026-11-24',
      '2026-11-25',
    ]);
    expect(series.map((d) => d.minutes)).toEqual([0, 10, 0, 0, 0, 30, 0]);
  });

  it('ignores days outside the window', () => {
    const series = dailySeries([day('2026-01-01', 999)], '2026-11-25', 7);
    expect(series.every((d) => d.minutes === 0)).toBe(true);
  });
});

describe('periodStats', () => {
  it('computes totals, active days and consistency', () => {
    const stats = periodStats(
      dailySeries([day('2026-11-24', 30, 2), day('2026-11-22', 15)], '2026-11-25', 7),
    );
    expect(stats).toMatchObject({
      length: 7,
      totalMinutes: 45,
      sessions: 3,
      activeDays: 2,
      averageMinutesPerActiveDay: 22.5,
    });
    expect(stats.consistency).toBeCloseTo(2 / 7, 5);
  });

  it('is all zeros for an empty period without dividing by zero', () => {
    expect(periodStats([])).toMatchObject({ consistency: 0, averageMinutesPerActiveDay: 0 });
    expect(periodStats(dailySeries([], '2026-11-25', 7))).toMatchObject({
      totalMinutes: 0,
      activeDays: 0,
      consistency: 0,
    });
  });
});

describe('trend', () => {
  it.each([
    [0, 0, { kind: 'flat' }],
    [30, 0, { kind: 'new' }],
    [60, 30, { kind: 'up', percent: 100 }],
    [15, 30, { kind: 'down', percent: 50 }],
    [30, 30, { kind: 'flat' }],
    [0, 30, { kind: 'down', percent: 100 }],
  ])('%s vs %s', (current, previous, expected) => {
    expect(trend(current, previous)).toEqual(expected);
  });
});

describe('distribution', () => {
  it('sums minutes per key, sorts largest first, and fractions add to 1', () => {
    const slices = distribution([
      { key: 'rubik', durationSec: 600 },
      { key: 'java', durationSec: 1800 },
      { key: 'rubik', durationSec: 600 },
      { key: 'none', durationSec: 0 },
    ]);
    expect(slices.map((s) => [s.key, s.minutes])).toEqual([
      ['java', 30],
      ['rubik', 20],
    ]);
    expect(slices.reduce((s, x) => s + x.fraction, 0)).toBeCloseTo(1, 10);
  });

  it('is empty when there is no time', () => {
    expect(distribution([])).toEqual([]);
  });
});

describe('formatMinutes', () => {
  it.each([
    [0, '0 min'],
    [44.6, '45 min'],
    [60, '1 h'],
    [65, '1 h 05 min'],
    [150, '2 h 30 min'],
  ])('%s -> %s', (minutes, text) => {
    expect(formatMinutes(minutes)).toBe(text);
  });
});
