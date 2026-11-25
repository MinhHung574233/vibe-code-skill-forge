import { describe, expect, it } from 'vitest';
import {
  completedPaths,
  findLesson,
  pathStatus,
  scoreQuiz,
  validatePaths,
  type Lesson,
  type Path,
} from './learning';

const q = (correct: number) => ({
  prompt: 'p',
  options: ['a', 'b', 'c', 'd'],
  correct,
  explain: 'Because this is the reason.',
});
const lesson = (id: string): Lesson => ({
  id,
  title: id,
  minutes: 5,
  summary: 's',
  blocks: [{ kind: 'p', text: 'text' }],
  quiz: [q(0), q(1), q(2)],
});
const path: Path = {
  id: 'p1',
  title: 'P1',
  summary: 's',
  level: 'beginner',
  lessons: [lesson('l1'), lesson('l2')],
};

describe('quiz scoring', () => {
  it('passes with two of three right', () => {
    expect(scoreQuiz(lesson('x'), [0, 1, 0])).toMatchObject({ correct: 2, passed: true });
    expect(scoreQuiz(lesson('x'), [0, 1, 2])).toMatchObject({ correct: 3, score: 1, passed: true });
  });

  it('fails with one right, and unanswered counts as wrong', () => {
    const result = scoreQuiz(lesson('x'), [0, null, 0]);
    expect(result).toMatchObject({ correct: 1, passed: false });
    expect(result.perQuestion).toEqual([true, false, false]);
    expect(scoreQuiz(lesson('x'), [])).toMatchObject({ correct: 0, passed: false });
  });
});

describe('path progress', () => {
  it('counts completed lessons and finds the next one', () => {
    expect(pathStatus(path, new Set())).toEqual({
      done: 0,
      total: 2,
      complete: false,
      nextLessonId: 'l1',
    });
    expect(pathStatus(path, new Set(['l1']))).toMatchObject({ done: 1, nextLessonId: 'l2' });
    expect(pathStatus(path, new Set(['l1', 'l2']))).toEqual({
      done: 2,
      total: 2,
      complete: true,
      nextLessonId: null,
    });
  });

  it('counts completed paths and finds lessons', () => {
    expect(completedPaths([path], new Set(['l1', 'l2']))).toBe(1);
    expect(completedPaths([path], new Set(['l1']))).toBe(0);
    expect(findLesson([path], 'l2')?.path.id).toBe('p1');
    expect(findLesson([path], 'zz')).toBeUndefined();
  });
});

describe('content validation', () => {
  it('accepts well-formed content', () => {
    expect(validatePaths([path])).toEqual([]);
  });

  it('reports broken content', () => {
    const broken: Path = {
      ...path,
      lessons: [
        { ...lesson('a'), quiz: [{ ...q(9), options: ['a', 'a', 'b', 'c'] }] },
        lesson('a'),
      ],
    };
    const problems = validatePaths([broken]).join('\n');
    expect(problems).toContain('needs exactly 3 questions');
    expect(problems).toContain('repeated option');
    expect(problems).toContain('correct index out of range');
    expect(problems).toContain('duplicate lesson id');
  });
});
