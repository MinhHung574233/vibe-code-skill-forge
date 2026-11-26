import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ACHIEVEMENTS } from '@/core/training/achievements';
import { formatMinutes } from '@/core/training/analytics';
import { ACTIVITY_LABELS } from '@/core/training/config';
import { recommend } from '@/core/training/recommend';
import { EMPTY_STREAK } from '@/core/training/streak';
import { CATEGORY_LABELS, PRIORITY_LABELS, SkillInputSchema } from '@/features/skills/domain/skill';
import { setLanguagePreference, t } from '@/i18n/core';
import { missingTranslations, placeholderMismatches } from '@/i18n/testing';
import { renderAt, setupAppDatabase } from '@/test/appHarness';
import { ManualLogSchema } from './domain/manual';
import { RecordSessionSchema } from './domain/session';

setupAppDatabase('training-i18n-test');

afterEach(() => setLanguagePreference('en'));

describe('training labels in Vietnamese', () => {
  it('translates achievement titles and descriptions', () => {
    setLanguagePreference('vi');
    const first = ACHIEVEMENTS.find((a) => a.id === 'first_session');
    expect(first && t(first.title)).toBe('Buổi luyện tập đầu tiên');
    expect(first && t(first.description)).toBe('Hoàn thành buổi luyện tập đầu tiên của bạn.');
  });

  it('translates activity types and keeps English in English', () => {
    expect(t(ACTIVITY_LABELS.practice_session)).toBe('Practice session');
    setLanguagePreference('vi');
    expect(t(ACTIVITY_LABELS.practice_session)).toBe('Buổi luyện tập');
    expect(t(ACTIVITY_LABELS.chess_puzzle)).toBe('Thế cờ vua');
  });

  it('formats minutes and recommendations in the current language', () => {
    expect(formatMinutes(65)).toBe('1 h 05 min');
    setLanguagePreference('vi');
    expect(formatMinutes(45)).toBe('45 phút');
    expect(formatMinutes(65)).toBe('1 giờ 05 phút');
    const [first] = recommend({
      skills: [],
      todayMinutes: 0,
      dailyGoalMinutes: 30,
      streak: EMPTY_STREAK,
    });
    expect(first?.title).toBe('Thêm kỹ năng đầu tiên của bạn');
  });

  it('has an entry for every bundled label, rule message and recommendation', () => {
    const strings: string[] = [
      ...ACHIEVEMENTS.flatMap((a) => [
        a.title,
        a.description,
        ...(a.needsModule ? [a.needsModule] : []),
      ]),
      ...Object.values(ACTIVITY_LABELS),
      ...Object.values(CATEGORY_LABELS),
      ...Object.values(PRIORITY_LABELS),
    ];
    // Validation messages are English in the schemas and translated where they are shown.
    const skillIssues = SkillInputSchema.safeParse({
      name: '',
      category: 'custom',
      priority: 2,
      weeklyGoalMinutes: 5,
      description: 'x'.repeat(201),
    });
    const bigGoal = SkillInputSchema.safeParse({
      name: 'x'.repeat(61),
      category: 'custom',
      priority: 2,
      weeklyGoalMinutes: 99999,
    });
    const manual = ManualLogSchema.safeParse({ date: 'x', minutes: undefined });
    const manualLow = ManualLogSchema.safeParse({ date: '2026-01-01', minutes: 0 });
    const manualHigh = ManualLogSchema.safeParse({ date: '2026-01-01', minutes: 9999 });
    const manualFraction = ManualLogSchema.safeParse({ date: '2026-01-01', minutes: 1.5 });
    const session = RecordSessionSchema.safeParse({
      id: 'a',
      activityType: 'practice_session',
      startedAt: 2000,
      endedAt: 1000,
      source: 'timer',
    });
    const shortSession = RecordSessionSchema.safeParse({
      id: 'a',
      activityType: 'practice_session',
      startedAt: 1000,
      endedAt: 1500,
      source: 'timer',
    });
    for (const parsed of [
      skillIssues,
      bigGoal,
      manual,
      manualLow,
      manualHigh,
      manualFraction,
      session,
      shortSession,
    ]) {
      if (!parsed.success) strings.push(...parsed.error.issues.map((i) => i.message));
    }
    expect(strings.length).toBeGreaterThan(30);
    expect(missingTranslations(strings)).toEqual([]);
    expect(placeholderMismatches(strings)).toEqual([]);
  });
});

describe('Skills screen in Vietnamese', () => {
  it('renders translated strings', async () => {
    setLanguagePreference('vi');
    renderAt('/skills');
    expect(await screen.findByText('Chưa có kỹ năng nào')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm 7 kỹ năng gợi ý' })).toBeInTheDocument();
  });
});
