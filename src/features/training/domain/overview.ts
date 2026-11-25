import {
  dailySeries,
  distribution,
  periodStats,
  trend,
  type DayPoint,
  type PeriodStats,
  type Slice,
  type Trend,
} from '@/core/training/analytics';
import { WEEK_DAYS } from '@/core/training/config';
import { levelProgress, type LevelProgress } from '@/core/training/levels';
import {
  computeStreak,
  qualifyingDates,
  type DaySummary,
  type StreakRule,
  type StreakState,
} from '@/core/training/streak';
import { addDays, toLocalDate, type LocalDate } from '@/core/time/localDate';

/** A recorded session as the read side sees it (the stored row has the same shape). */
export interface SessionRecord {
  id: string;
  moduleId: string;
  activityType: string;
  skillId?: string;
  startedAt: number;
  endedAt: number;
  durationSec: number;
  localDate: LocalDate;
  source: 'timer' | 'manual';
  notes?: string;
}

/** Raw data loaded from storage; everything shown on Home and Progress is derived from it. */
export interface TrainingData {
  days: readonly DaySummary[];
  /** Sessions from the analytics window (the last 60 days), any order. */
  windowSessions: readonly SessionRecord[];
  totalXp: number;
}

export interface OverviewContext {
  now: number;
  streakRule: StreakRule;
  dailyGoalMinutes: number;
}

export interface Overview {
  today: LocalDate;
  todayMinutes: number;
  goalMinutes: number;
  /** 0..1, capped. */
  goalFraction: number;
  streak: StreakState;
  level: LevelProgress;
  last7: DayPoint[];
  week: PeriodStats;
  minutesBySkillThisWeek: Map<string, number>;
  lastSessionAtBySkill: Map<string, number>;
}

export function buildOverview(data: TrainingData, ctx: OverviewContext): Overview {
  const today = toLocalDate(ctx.now);
  const todayRow = data.days.find((d) => d.localDate === today);
  const todayMinutes = todayRow ? todayRow.durationSec / 60 : 0;
  const streak = computeStreak(
    qualifyingDates(data.days, ctx.streakRule, ctx.dailyGoalMinutes),
    today,
  );

  const last7 = dailySeries(data.days, today, WEEK_DAYS);
  const weekStart = last7[0]?.date ?? today;

  const minutesBySkillThisWeek = new Map<string, number>();
  const lastSessionAtBySkill = new Map<string, number>();
  for (const s of data.windowSessions) {
    if (!s.skillId) continue;
    if (s.localDate >= weekStart) {
      minutesBySkillThisWeek.set(
        s.skillId,
        (minutesBySkillThisWeek.get(s.skillId) ?? 0) + s.durationSec / 60,
      );
    }
    if (s.endedAt > (lastSessionAtBySkill.get(s.skillId) ?? 0)) {
      lastSessionAtBySkill.set(s.skillId, s.endedAt);
    }
  }

  return {
    today,
    todayMinutes,
    goalMinutes: ctx.dailyGoalMinutes,
    goalFraction: ctx.dailyGoalMinutes > 0 ? Math.min(1, todayMinutes / ctx.dailyGoalMinutes) : 0,
    streak,
    level: levelProgress(data.totalXp),
    last7,
    week: periodStats(last7),
    minutesBySkillThisWeek,
    lastSessionAtBySkill,
  };
}

export type ProgressRange = 7 | 30;

export interface ProgressView {
  range: ProgressRange;
  series: DayPoint[];
  stats: PeriodStats;
  previous: PeriodStats;
  minutesTrend: Trend;
  /** Minutes per skill in the period; key is the skill id, or `none` for unassigned sessions. */
  bySkill: Slice[];
}

export const UNASSIGNED_KEY = 'none';

export function buildProgress(data: TrainingData, now: number, range: ProgressRange): ProgressView {
  const today = toLocalDate(now);
  const series = dailySeries(data.days, today, range);
  const previousEnd = addDays(today, -range);
  const previousSeries = dailySeries(data.days, previousEnd, range);
  const stats = periodStats(series);
  const previous = periodStats(previousSeries);

  const start = series[0]?.date ?? today;
  const inPeriod = data.windowSessions.filter((s) => s.localDate >= start && s.localDate <= today);

  return {
    range,
    series,
    stats,
    previous,
    minutesTrend: trend(stats.totalMinutes, previous.totalMinutes),
    bySkill: distribution(
      inPeriod.map((s) => ({ key: s.skillId ?? UNASSIGNED_KEY, durationSec: s.durationSec })),
    ),
  };
}
