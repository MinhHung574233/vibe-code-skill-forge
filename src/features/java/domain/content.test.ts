import { describe, expect, it } from 'vitest';
import { validatePaths } from '@/features/learning/domain/learning';
import { JAVA_PATHS } from './content';

describe('Java content', () => {
  it('is well formed', () => {
    expect(validatePaths(JAVA_PATHS)).toEqual([]);
  });

  it('has five paths and twenty lessons', () => {
    expect(JAVA_PATHS.map((p) => p.id)).toEqual([
      'java-core',
      'spring-boot',
      'java-data',
      'java-testing',
      'java-architecture',
    ]);
    expect(JAVA_PATHS.reduce((n, p) => n + p.lessons.length, 0)).toBe(20);
  });

  it('keeps the explanation different from every option', () => {
    const clashes = JAVA_PATHS.flatMap((p) =>
      p.lessons.flatMap((l) => l.quiz.filter((q) => q.options.includes(q.explain)).map(() => l.id)),
    );
    expect(clashes).toEqual([]);
  });
});
