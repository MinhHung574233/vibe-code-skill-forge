import { describe, expect, it } from 'vitest';
import { buildOverview, buildProgress, type SessionRecord, type TrainingData } from './overview';

const NOW = new Date(2026, 10, 25, 18, 0, 0).getTime(); // 25 Nov 2026, local
const at = (date: string, hour = 12) => {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d, hour).getTime();
};

const day = (localDate: string, minutes: number, sessions = 1) => ({
  localDate,
  durationSec: minutes * 60,
  sessions,
  activities: sessions,
});

const sess = (id: string, localDate: string, minutes: number, skillId?: string): SessionRecord => ({
  id,
  moduleId: 'general',
  activityType: 'practice_session',
  ...(skillId ? { skillId } : {}),
  startedAt: at(localDate) - minutes * 60_000,
  endedAt: at(localDate),
  durationSec: minutes * 60,
  localDate,
  source: 'timer',
});

const ctx = { now: NOW, streakRule: 'any_session' as const, dailyGoalMinutes: 20 };

describe('buildOverview', () => {
  it('is all zeros for a new user', () => {
    const o = buildOverview({ days: [], windowSessions: [], totalXp: 0 }, ctx);
    expect(o).toMatchObject({
      today: '2026-11-25',
      todayMinutes: 0,
      goalFraction: 0,
      week: { totalMinutes: 0, activeDays: 0 },
    });
    expect(o.streak.current).toBe(0);
    expect(o.level).toMatchObject({ level: 1, xpIntoLevel: 0 });
    expect(o.last7).toHaveLength(7);
  });

  it('reports today’s minutes against the goal, capped at 100%', () => {
    const half = buildOverview(
      { days: [day('2026-11-25', 10)], windowSessions: [], totalXp: 0 },
      ctx,
    );
    expect(half).toMatchObject({ todayMinutes: 10, goalFraction: 0.5 });
    const over = buildOverview(
      { days: [day('2026-11-25', 90)], windowSessions: [], totalXp: 0 },
      ctx,
    );
    expect(over.goalFraction).toBe(1);
  });

  it('derives level and streak from the stored data', () => {
    const o = buildOverview(
      { days: [day('2026-11-24', 10), day('2026-11-25', 10)], windowSessions: [], totalXp: 150 },
      ctx,
    );
    expect(o.streak).toMatchObject({ current: 2, activeToday: true });
    expect(o.level).toMatchObject({ level: 2, xpIntoLevel: 50 });
  });

  it('sums each skill’s minutes over the last 7 days only, and tracks the latest session', () => {
    const data: TrainingData = {
      days: [],
      totalXp: 0,
      windowSessions: [
        sess('1', '2026-11-25', 30, 'rubik'),
        sess('2', '2026-11-19', 15, 'rubik'), // exactly 7 days back inclusive: in the week
        sess('3', '2026-11-18', 99, 'rubik'), // 8 days back: outside
        sess('4', '2026-11-22', 20, 'java'),
        sess('5', '2026-11-22', 20),
      ],
    };
    const o = buildOverview(data, ctx);
    expect(o.minutesBySkillThisWeek.get('rubik')).toBe(45);
    expect(o.minutesBySkillThisWeek.get('java')).toBe(20);
    expect(o.lastSessionAtBySkill.get('rubik')).toBe(at('2026-11-25'));
    expect([...o.minutesBySkillThisWeek.keys()].sort()).toEqual(['java', 'rubik']);
  });
});

describe('buildProgress', () => {
  const days = [
    day('2026-11-25', 30),
    day('2026-11-24', 30),
    day('2026-11-15', 20), // previous 7-day window (11-12..11-18)
  ];

  it('builds a series of exactly the requested length with stats', () => {
    const p = buildProgress({ days, windowSessions: [], totalXp: 0 }, NOW, 7);
    expect(p.series).toHaveLength(7);
    expect(p.stats).toMatchObject({ totalMinutes: 60, activeDays: 2 });
    expect(p.previous.totalMinutes).toBe(20);
    expect(p.minutesTrend).toEqual({ kind: 'up', percent: 200 });
  });

  it('a 30-day range covers more days than 7', () => {
    const week = buildProgress({ days, windowSessions: [], totalXp: 0 }, NOW, 7);
    const month = buildProgress({ days, windowSessions: [], totalXp: 0 }, NOW, 30);
    expect(month.series).toHaveLength(30);
    expect(month.stats.totalMinutes).toBe(80);
    expect(month.stats.totalMinutes).toBeGreaterThan(week.stats.totalMinutes);
  });

  it('splits time by skill, grouping unassigned sessions, within the period only', () => {
    const p = buildProgress(
      {
        days,
        totalXp: 0,
        windowSessions: [
          sess('1', '2026-11-25', 30, 'rubik'),
          sess('2', '2026-11-24', 10, 'java'),
          sess('3', '2026-11-24', 20),
          sess('4', '2026-11-10', 500, 'java'), // outside the 7-day period
        ],
      },
      NOW,
      7,
    );
    expect(p.bySkill.map((s) => [s.key, s.minutes])).toEqual([
      ['rubik', 30],
      ['none', 20],
      ['java', 10],
    ]);
  });
});
