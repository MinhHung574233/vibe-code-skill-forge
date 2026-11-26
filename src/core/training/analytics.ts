import { t } from '@/i18n/core';
import { addDays, type LocalDate } from '../time/localDate';
import type { DaySummary } from './streak';

/**
 * Analytics over the per-day rollup (PRD §6). Pure functions: the UI feeds them rows and gets
 * numbers, so charts, summaries and tests all agree. Periods are rolling windows of N days ending
 * today ("Last 7 days", "Last 30 days"), which stay comparable week to week.
 */
export interface DayPoint {
  date: LocalDate;
  minutes: number;
  sessions: number;
}

/** `length` consecutive days ending at `endDate` (oldest first); days without data are zeros. */
export function dailySeries(
  days: readonly DaySummary[],
  endDate: LocalDate,
  length: number,
): DayPoint[] {
  const byDate = new Map(days.map((d) => [d.localDate, d]));
  const series: DayPoint[] = [];
  for (let offset = length - 1; offset >= 0; offset--) {
    const date = addDays(endDate, -offset);
    const day = byDate.get(date);
    series.push({
      date,
      minutes: day ? day.durationSec / 60 : 0,
      sessions: day ? day.sessions : 0,
    });
  }
  return series;
}

export interface PeriodStats {
  length: number;
  totalMinutes: number;
  sessions: number;
  activeDays: number;
  /** Active days / days in the period (0..1): the "learning consistency" measure. */
  consistency: number;
  averageMinutesPerActiveDay: number;
}

export function periodStats(series: readonly DayPoint[]): PeriodStats {
  const totalMinutes = series.reduce((sum, d) => sum + d.minutes, 0);
  const sessions = series.reduce((sum, d) => sum + d.sessions, 0);
  const activeDays = series.filter((d) => d.minutes > 0 || d.sessions > 0).length;
  return {
    length: series.length,
    totalMinutes,
    sessions,
    activeDays,
    consistency: series.length === 0 ? 0 : activeDays / series.length,
    averageMinutesPerActiveDay: activeDays === 0 ? 0 : totalMinutes / activeDays,
  };
}

export type Trend =
  | { kind: 'flat' }
  /** Nothing in the previous period to compare with. */
  | { kind: 'new' }
  | { kind: 'up'; percent: number }
  | { kind: 'down'; percent: number };

export function trend(current: number, previous: number): Trend {
  if (current === 0 && previous === 0) return { kind: 'flat' };
  if (previous === 0) return { kind: 'new' };
  const percent = Math.round(((current - previous) / previous) * 100);
  if (percent === 0) return { kind: 'flat' };
  return percent > 0 ? { kind: 'up', percent } : { kind: 'down', percent: Math.abs(percent) };
}

export interface Slice {
  key: string;
  minutes: number;
  /** 0..1 of the total. */
  fraction: number;
}

/** Minutes per key (skill, module…), largest first. Zero-length sessions are ignored. */
export function distribution(items: readonly { key: string; durationSec: number }[]): Slice[] {
  const totals = new Map<string, number>();
  for (const item of items) {
    if (item.durationSec <= 0) continue;
    totals.set(item.key, (totals.get(item.key) ?? 0) + item.durationSec / 60);
  }
  const total = [...totals.values()].reduce((a, b) => a + b, 0);
  return [...totals.entries()]
    .map(([key, minutes]) => ({ key, minutes, fraction: total === 0 ? 0 : minutes / total }))
    .sort((a, b) => b.minutes - a.minutes || (a.key < b.key ? -1 : 1));
}

/** "1 h 05 min", "45 min", "0 min". Minutes are rounded to whole minutes. */
export function formatMinutes(minutes: number): string {
  const whole = Math.round(minutes);
  if (whole < 60) return t('{n} min', { n: whole });
  const h = Math.floor(whole / 60);
  const m = whole % 60;
  return m === 0 ? t('{h} h', { h }) : t('{h} h {m} min', { h, m: String(m).padStart(2, '0') });
}
