import { describe, expect, it } from 'vitest';
import { EMPTY_STREAK, computeStreak, qualifyingDates, type DaySummary } from './streak';

const day = (localDate: string, durationSec = 600, sessions = 1): DaySummary => ({
  localDate,
  durationSec,
  sessions,
  activities: sessions,
});

describe('computeStreak', () => {
  it('is empty with no activity', () => {
    expect(computeStreak([], '2026-11-25')).toEqual(EMPTY_STREAK);
  });

  it('counts consecutive days ending today', () => {
    const s = computeStreak(['2026-11-23', '2026-11-24', '2026-11-25'], '2026-11-25');
    expect(s).toMatchObject({ current: 3, longest: 3, activeToday: true, atRisk: false });
  });

  it('today not finished yet does not break yesterday’s streak, but flags it at risk', () => {
    const s = computeStreak(['2026-11-23', '2026-11-24'], '2026-11-25');
    expect(s).toMatchObject({ current: 2, activeToday: false, atRisk: true });
  });

  it('a missed day resets the current streak but keeps the longest', () => {
    const s = computeStreak(
      ['2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-24'],
      '2026-11-25',
    );
    expect(s).toMatchObject({ current: 1, longest: 4, atRisk: true });
    const broken = computeStreak(['2026-11-18', '2026-11-19'], '2026-11-25');
    expect(broken).toMatchObject({ current: 0, longest: 2, atRisk: false });
  });

  it('ignores duplicates and input order', () => {
    const s = computeStreak(['2026-11-25', '2026-11-24', '2026-11-25', '2026-11-23'], '2026-11-25');
    expect(s.current).toBe(3);
    expect(s.lastActiveDate).toBe('2026-11-25');
  });

  it('crosses month and year boundaries', () => {
    const s = computeStreak(['2026-12-30', '2026-12-31', '2027-01-01'], '2027-01-01');
    expect(s.current).toBe(3);
  });

  it('is exact across DST changes (calendar days, not 24h blocks)', () => {
    expect(computeStreak(['2026-03-07', '2026-03-08', '2026-03-09'], '2026-03-09').current).toBe(3);
    expect(computeStreak(['2026-10-31', '2026-11-01', '2026-11-02'], '2026-11-02').current).toBe(3);
  });

  it('a lone older day gives no current streak', () => {
    expect(computeStreak(['2026-11-20'], '2026-11-25')).toMatchObject({ current: 0, longest: 1 });
  });
});

describe('qualifyingDates', () => {
  const days = [day('2026-11-23', 300), day('2026-11-24', 1800), day('2026-11-25', 0, 0)];

  it('any_session counts every day with a session or activity', () => {
    expect(qualifyingDates(days, 'any_session', 20)).toEqual(['2026-11-23', '2026-11-24']);
  });

  it('goal_met only counts days that reached the daily goal', () => {
    expect(qualifyingDates(days, 'goal_met', 20)).toEqual(['2026-11-24']);
    expect(qualifyingDates(days, 'goal_met', 5)).toEqual(['2026-11-23', '2026-11-24']);
  });
});
