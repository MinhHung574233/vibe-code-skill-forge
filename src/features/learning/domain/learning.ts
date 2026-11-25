/**
 * Lessons and quizzes shared by the Java and Developer Tools modules. A lesson is a short read
 * followed by a three-question quiz; passing it completes the lesson. Content lives with each
 * module; this file only knows the shape and the scoring rules.
 */
export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'code'; code: string; caption?: string }
  | { kind: 'list'; items: readonly string[] }
  | { kind: 'tip'; text: string };

export interface Question {
  prompt: string;
  options: readonly string[];
  /** Index into `options`. */
  correct: number;
  /** Why the right answer is right (shown after checking). */
  explain: string;
}

export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  /** One line shown in lists. */
  summary: string;
  blocks: readonly Block[];
  quiz: readonly Question[];
}

export type Level = 'beginner' | 'intermediate' | 'advanced';

export interface Path {
  id: string;
  title: string;
  summary: string;
  level: Level;
  lessons: readonly Lesson[];
}

/** A lesson is completed with at least two of three answers right. */
export const PASS_SCORE = 0.66;

export interface QuizResult {
  correct: number;
  total: number;
  /** 0..1 */
  score: number;
  passed: boolean;
  /** Per question: was it right. Unanswered counts as wrong. */
  perQuestion: boolean[];
}

export function scoreQuiz(lesson: Lesson, answers: readonly (number | null)[]): QuizResult {
  const perQuestion = lesson.quiz.map((q, i) => answers[i] === q.correct);
  const correct = perQuestion.filter(Boolean).length;
  const total = lesson.quiz.length;
  const score = total === 0 ? 0 : correct / total;
  return { correct, total, score, passed: score >= PASS_SCORE, perQuestion };
}

export interface PathStatus {
  done: number;
  total: number;
  complete: boolean;
  /** First lesson not yet completed, or null when the path is complete. */
  nextLessonId: string | null;
}

export function pathStatus(path: Path, completedLessonIds: ReadonlySet<string>): PathStatus {
  const done = path.lessons.filter((l) => completedLessonIds.has(l.id)).length;
  const next = path.lessons.find((l) => !completedLessonIds.has(l.id));
  return {
    done,
    total: path.lessons.length,
    complete: path.lessons.length > 0 && done === path.lessons.length,
    nextLessonId: next?.id ?? null,
  };
}

export function completedPaths(
  paths: readonly Path[],
  completedLessonIds: ReadonlySet<string>,
): number {
  return paths.filter((p) => pathStatus(p, completedLessonIds).complete).length;
}

export function findLesson(
  paths: readonly Path[],
  lessonId: string,
): { path: Path; lesson: Lesson } | undefined {
  for (const path of paths) {
    const lesson = path.lessons.find((l) => l.id === lessonId);
    if (lesson) return { path, lesson };
  }
  return undefined;
}

/** Problems with a content set, as readable strings (used by content tests). */
export function validatePaths(paths: readonly Path[]): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const path of paths) {
    if (path.lessons.length === 0) problems.push(`${path.id}: no lessons`);
    for (const lesson of path.lessons) {
      if (ids.has(lesson.id)) problems.push(`${lesson.id}: duplicate lesson id`);
      ids.add(lesson.id);
      if (lesson.blocks.length === 0) problems.push(`${lesson.id}: no content`);
      if (lesson.quiz.length !== 3) problems.push(`${lesson.id}: needs exactly 3 questions`);
      for (const [i, q] of lesson.quiz.entries()) {
        const where = `${lesson.id} Q${i + 1}`;
        if (q.options.length !== 4) problems.push(`${where}: needs 4 options`);
        if (new Set(q.options).size !== q.options.length)
          problems.push(`${where}: repeated option`);
        if (!Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.options.length) {
          problems.push(`${where}: correct index out of range`);
        }
        if (q.explain.length < 15) problems.push(`${where}: explanation too short`);
      }
      for (const b of lesson.blocks) {
        if (b.kind === 'code' && b.code.trim() === '') problems.push(`${lesson.id}: empty code`);
      }
    }
  }
  return problems;
}

/**
 * Builds a question from its right answer and three wrong ones. The right answer's position is
 * derived from the text (stable across runs), so answers are not always first and tests stay
 * deterministic.
 */
export function question(
  prompt: string,
  right: string,
  wrong: readonly [string, string, string],
  explain: string,
): Question {
  const position = (prompt.length + right.length) % 4;
  const options = [...wrong];
  options.splice(position, 0, right);
  return { prompt, options, correct: position, explain };
}
