import { describe, expect, it } from 'vitest';
import { addDays } from '@/core/time/localDate';
import { JAVA_PATHS } from '@/features/java/domain/content';
import { validatePaths } from '@/features/learning/domain/learning';
import { TOOLS_PATHS } from './content';
import { TIPS, tipForDate } from './tips';

describe('bundled lessons', () => {
  it('Java content is well formed', () => {
    expect(validatePaths(JAVA_PATHS)).toEqual([]);
    expect(JAVA_PATHS.reduce((n, p) => n + p.lessons.length, 0)).toBeGreaterThanOrEqual(12);
  });

  it('Developer Tools content is well formed', () => {
    expect(validatePaths(TOOLS_PATHS)).toEqual([]);
    expect(TOOLS_PATHS.reduce((n, p) => n + p.lessons.length, 0)).toBeGreaterThanOrEqual(10);
  });

  it('lesson ids are unique across both modules (progress is keyed by lesson id)', () => {
    const ids = [...JAVA_PATHS, ...TOOLS_PATHS].flatMap((p) => p.lessons.map((l) => l.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('the right answer is not always in the same position', () => {
    const positions = new Set(
      [...JAVA_PATHS, ...TOOLS_PATHS].flatMap((p) =>
        p.lessons.flatMap((l) => l.quiz.map((q) => q.correct)),
      ),
    );
    expect(positions.size).toBe(4);
  });
});

describe('daily developer tip', () => {
  it('has unique tips with text', () => {
    expect(TIPS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(TIPS.map((t) => t.id)).size).toBe(TIPS.length);
    for (const tip of TIPS) {
      expect(tip.title.length, tip.id).toBeGreaterThan(3);
      expect(tip.text.length, tip.id).toBeGreaterThan(20);
    }
  });

  it('is stable within a day, changes the next day and cycles through every tip', () => {
    expect(tipForDate('2026-11-25').id).toBe(tipForDate('2026-11-25').id);
    expect(tipForDate('2026-11-25').id).not.toBe(tipForDate('2026-11-26').id);
    const seen = new Set<string>();
    for (let day = 0; day < TIPS.length; day++) seen.add(tipForDate(addDays('2027-01-01', day)).id);
    expect(seen.size).toBe(TIPS.length);
  });

  it('wraps around before the start date and far in the future', () => {
    expect(tipForDate('2025-06-01')).toBeDefined();
    expect(tipForDate('2040-12-31')).toBeDefined();
  });
});
