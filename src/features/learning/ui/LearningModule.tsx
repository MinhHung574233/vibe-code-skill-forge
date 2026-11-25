import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState, type ReactNode } from 'react';
import { Link, Route, Routes, useParams } from 'react-router';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { ListRow, Section } from '@/components/Section';
import { systemClock } from '@/core/time/clock';
import type { ActivityType } from '@/core/training/config';
import { getDb } from '@/db/boot';
import type { CompletionOutcome } from '@/features/training/domain/session';
import { SessionCompleteSheet } from '@/features/training/ui/SessionCompleteSheet';
import { useTrainingEngine } from '@/features/training/ui/useTraining';
import { cn } from '@/utils/cn';
import { LessonService } from '../data/lessonService';
import {
  findLesson,
  pathStatus,
  scoreQuiz,
  type Block,
  type Lesson,
  type Path,
  type QuizResult,
} from '../domain/learning';

export interface LearningConfig {
  moduleId: string;
  activityType: ActivityType;
  title: string;
  /** Route the module is mounted at, e.g. `/practice/java`. */
  basePath: string;
  paths: readonly Path[];
  /** Shown on the module home above the paths (e.g. the daily tip). */
  intro?: ReactNode;
  /** Extra module-specific routes (relative paths), as `<Route>` elements. */
  extraRoutes?: ReactNode;
}

const PRACTICE_BACK = { to: '/practice', label: 'Practice' };

function useLessonService(): LessonService {
  const engine = useTrainingEngine();
  return useMemo(() => new LessonService(getDb(), systemClock, engine), [engine]);
}

function useCompleted(): Set<string> | undefined {
  const service = useLessonService();
  return useLiveQuery(() => service.completedIds(), [service]);
}

/** Module root: home (paths), a path's lessons, and a lesson. */
export function LearningModule({ config }: { config: LearningConfig }) {
  return (
    <Routes>
      <Route index element={<LearningHome config={config} />} />
      <Route path="path/:pathId" element={<PathScreen config={config} />} />
      <Route path="lesson/:lessonId" element={<LessonScreen config={config} />} />
      {config.extraRoutes}
    </Routes>
  );
}

function LearningHome({ config }: { config: LearningConfig }) {
  const completed = useCompleted();
  const done = completed ?? new Set<string>();
  const totalLessons = config.paths.reduce((n, p) => n + p.lessons.length, 0);
  const doneLessons = config.paths.reduce((n, p) => n + pathStatus(p, done).done, 0);

  return (
    <Screen title={config.title} back={PRACTICE_BACK}>
      {config.intro}
      <Card className={config.intro ? 'mt-4' : ''}>
        <p className="type-subhead text-muted">Your progress</p>
        <p className="type-title-2 tabular-nums">
          {doneLessons} of {totalLessons} lessons
        </p>
        <div className="mt-2">
          <ProgressBar
            value={totalLessons === 0 ? 0 : doneLessons / totalLessons}
            label={`${doneLessons} of ${totalLessons} lessons completed`}
          />
        </div>
      </Card>
      <Section
        title="Learning paths"
        footer="Pass each lesson’s 3-question quiz (2 correct) to complete it."
      >
        {config.paths.map((path) => {
          const status = pathStatus(path, done);
          return (
            <ListRow
              key={path.id}
              title={path.title}
              subtitle={`${status.done} of ${status.total} lessons · ${path.level}`}
              to={`${config.basePath}/path/${path.id}`}
              accessory={status.complete ? <Badge tone="success">Complete</Badge> : undefined}
            />
          );
        })}
      </Section>
    </Screen>
  );
}

function PathScreen({ config }: { config: LearningConfig }) {
  const { pathId } = useParams();
  const completed = useCompleted();
  const path = config.paths.find((p) => p.id === pathId);
  if (!path) {
    return (
      <Screen title="Path" back={{ to: config.basePath, label: config.title }}>
        <EmptyState
          icon="info"
          title="Path not found"
          description="This learning path does not exist."
        />
      </Screen>
    );
  }
  const done = completed ?? new Set<string>();
  const status = pathStatus(path, done);
  return (
    <Screen title={path.title} back={{ to: config.basePath, label: config.title }}>
      <p className="px-1 type-body text-muted">{path.summary}</p>
      <div className="mt-3 px-1">
        <ProgressBar
          value={status.total === 0 ? 0 : status.done / status.total}
          label={`${status.done} of ${status.total} lessons completed`}
        />
      </div>
      <Section>
        {path.lessons.map((lesson, i) => (
          <ListRow
            key={lesson.id}
            title={`${i + 1}. ${lesson.title}`}
            subtitle={`${lesson.minutes} min · ${lesson.summary}`}
            to={`${config.basePath}/lesson/${lesson.id}`}
            accessory={done.has(lesson.id) ? <Badge tone="success">Done</Badge> : undefined}
          />
        ))}
      </Section>
    </Screen>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.kind) {
    case 'p':
      return <p className="type-body">{block.text}</p>;
    case 'list':
      return (
        <ul className="list-disc space-y-1 pl-5 type-body">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case 'code':
      return (
        <figure className="m-0">
          <pre className="overflow-x-auto rounded-xl border border-border bg-surface p-3 font-mono text-[13px] leading-relaxed">
            <code>{block.code}</code>
          </pre>
          {block.caption && (
            <figcaption className="mt-1 px-1 type-footnote text-muted">{block.caption}</figcaption>
          )}
        </figure>
      );
    case 'tip':
      return (
        <p className="rounded-xl bg-accent-soft p-3 type-subhead">
          <span className="font-semibold">Tip: </span>
          {block.text}
        </p>
      );
  }
}

type Stage = 'read' | 'quiz' | 'result';

function LessonScreen({ config }: { config: LearningConfig }) {
  const { lessonId } = useParams();
  const found = lessonId ? findLesson(config.paths, lessonId) : undefined;
  const back = {
    to: found ? `${config.basePath}/path/${found.path.id}` : config.basePath,
    label: found?.path.title ?? config.title,
  };
  if (!found) {
    return (
      <Screen title="Lesson" back={back}>
        <EmptyState
          icon="info"
          title="Lesson not found"
          description="This lesson does not exist."
        />
      </Screen>
    );
  }
  // Remount per lesson so quiz state never leaks between lessons.
  return (
    <LessonView
      key={found.lesson.id}
      config={config}
      path={found.path}
      lesson={found.lesson}
      back={back}
    />
  );
}

function LessonView({
  config,
  path,
  lesson,
  back,
}: {
  config: LearningConfig;
  path: Path;
  lesson: Lesson;
  back: { to: string; label: string };
}) {
  const service = useLessonService();
  const [startedAt] = useState(() => Date.now());
  const [stage, setStage] = useState<Stage>('read');
  const [answers, setAnswers] = useState<(number | null)[]>(() => lesson.quiz.map(() => null));
  const [result, setResult] = useState<QuizResult | null>(null);
  const [outcome, setOutcome] = useState<CompletionOutcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextLesson = path.lessons[path.lessons.findIndex((l) => l.id === lesson.id) + 1];
  const allAnswered = answers.every((a) => a !== null);

  const check = async () => {
    const scored = scoreQuiz(lesson, answers);
    setBusy(true);
    setError(null);
    const submitted = await service.submit({
      moduleId: config.moduleId,
      activityType: config.activityType,
      pathId: path.id,
      lessonId: lesson.id,
      startedAt,
      result: scored,
    });
    setBusy(false);
    if (!submitted.ok) {
      setError(submitted.error.message);
      return;
    }
    setResult(scored);
    setStage('result');
    if (submitted.value.outcome) setOutcome(submitted.value.outcome);
  };

  const retry = () => {
    setAnswers(lesson.quiz.map(() => null));
    setResult(null);
    setStage('quiz');
  };

  return (
    <Screen title={lesson.title} back={back}>
      {stage === 'read' && (
        <>
          <p className="px-1 type-subhead text-muted">{lesson.minutes} min read</p>
          <div className="mt-3 space-y-4">
            {lesson.blocks.map((block, i) => (
              <BlockView key={i} block={block} />
            ))}
          </div>
          <div className="mt-6">
            <Button fullWidth onClick={() => setStage('quiz')}>
              Take the quiz
            </Button>
          </div>
        </>
      )}

      {stage !== 'read' && (
        <div className="space-y-4">
          {lesson.quiz.map((question, qi) => {
            const right = result?.perQuestion[qi];
            return (
              <Card key={qi} role="group" aria-labelledby={`q-${qi}`}>
                <h2 id={`q-${qi}`} className="type-headline">
                  {qi + 1}. {question.prompt}
                </h2>
                <div className="mt-3 space-y-2" role="radiogroup" aria-labelledby={`q-${qi}`}>
                  {question.options.map((option, oi) => {
                    const selected = answers[qi] === oi;
                    const showCorrect = stage === 'result' && oi === question.correct;
                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={stage === 'result'}
                        onClick={() =>
                          setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))
                        }
                        className={cn(
                          'flex min-h-[44px] w-full items-center rounded-xl border px-3 py-2 text-left type-body',
                          selected ? 'border-accent bg-accent-soft' : 'border-border bg-surface',
                          showCorrect && 'border-success',
                        )}
                      >
                        <span className="min-w-0 flex-1 break-words">{option}</span>
                        {showCorrect && (
                          <span className="ml-2 type-footnote font-medium text-success">
                            Correct
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {stage === 'result' && (
                  <p className="mt-3 type-subhead">
                    <span className="font-semibold">{right ? 'Right. ' : 'Not quite. '}</span>
                    {question.explain}
                  </p>
                )}
              </Card>
            );
          })}

          {error && (
            <p role="alert" className="type-subhead text-danger">
              {error}
            </p>
          )}

          {stage === 'quiz' && (
            <Button fullWidth disabled={!allAnswered} loading={busy} onClick={() => void check()}>
              {allAnswered ? 'Check answers' : 'Answer all 3 questions'}
            </Button>
          )}

          {stage === 'result' && result && (
            <Card>
              <h2 className="type-title-2" role="status">
                {result.correct} of {result.total} correct
              </h2>
              <p className="mt-1 type-body text-muted">
                {result.passed
                  ? 'Lesson complete.'
                  : 'You need 2 correct answers to complete the lesson. Read it again and retry.'}
              </p>
              <div className="mt-4 flex flex-col gap-2">
                {result.passed && nextLesson && (
                  <Link
                    to={`${config.basePath}/lesson/${nextLesson.id}`}
                    className="inline-flex min-h-[50px] items-center justify-center rounded-xl bg-accent px-5 type-headline text-on-accent active:opacity-80"
                  >
                    Next lesson
                  </Link>
                )}
                {!result.passed && <Button onClick={retry}>Try the quiz again</Button>}
                <Link
                  to={back.to}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-accent-soft px-5 type-headline text-accent active:opacity-80"
                >
                  Back to {path.title}
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}
      <SessionCompleteSheet outcome={outcome} onClose={() => setOutcome(null)} />
    </Screen>
  );
}
