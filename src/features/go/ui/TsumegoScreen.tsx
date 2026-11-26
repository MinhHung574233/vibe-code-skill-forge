import { useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { systemClock } from '@/core/time/clock';
import { t } from '@/i18n/core';
import type { CompletionOutcome } from '@/features/training/domain/session';
import { SessionCompleteSheet } from '@/features/training/ui/SessionCompleteSheet';
import { useTrainingEngine } from '@/features/training/ui/useTraining';
import type { Board } from '../domain/board';
import { TSUMEGO_PROBLEMS } from '../domain/tsumego';
import {
  categoryLabel,
  colorOf,
  objectiveText,
  pointIndex,
  problemBoard,
  sameMove,
  type Pt,
  type TsumegoProblem,
} from '../domain/tsumegoTypes';
import { GoBoard } from './GoBoard';
import { useGoContext, useGoRepository, usePuzzleProgress } from './hooks';

type Verdict = { kind: 'correct'; point: number } | { kind: 'wrong'; point: number; why: string };

export function TsumegoScreen() {
  const { base } = useGoContext();
  const { problemId } = useParams();
  const index = TSUMEGO_PROBLEMS.findIndex((p) => p.id === problemId);
  const problem = TSUMEGO_PROBLEMS[index];
  const next = TSUMEGO_PROBLEMS[index + 1];

  if (!problem) {
    return (
      <Screen title={t('Problem')} back={{ to: `${base}/tsumego`, label: t('Problems') }}>
        <EmptyState
          icon="target"
          title={t('Problem not found')}
          description={t('Pick a problem from the list.')}
        />
      </Screen>
    );
  }
  // keyed so moving to the next problem starts with fresh state
  return <ProblemView key={problem.id} problem={problem} nextId={next?.id ?? null} />;
}

function ProblemView({ problem, nextId }: { problem: TsumegoProblem; nextId: string | null }) {
  const { base } = useGoContext();
  const repository = useGoRepository();
  const trainingEngine = useTrainingEngine();
  const progress = usePuzzleProgress();
  const startedAt = useRef(systemClock.now());

  const initial = useMemo(() => problemBoard(problem), [problem]);
  const [board, setBoard] = useState<Board>(initial);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [outcome, setOutcome] = useState<CompletionOutcome | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const wasSolved = progress?.get(problem.id)?.solved === 1;
  const targetPoint = pointIndex(problem, problem.target);
  const targets = useMemo(() => new Set([targetPoint]), [targetPoint]);
  const solutionPoints = useMemo(
    () => new Set(problem.solutions.map((s) => pointIndex(problem, s))),
    [problem],
  );
  const width = initial.topology.width;
  const toPt = (p: number): Pt => [p % width, Math.floor(p / width)];

  const play = (point: number) => {
    if (verdict?.kind === 'correct') return;
    const after = initial.clone();
    const result = after.play(point, colorOf(problem));
    if (!result.ok) {
      setMessage(t('That move is not legal here.'));
      return;
    }
    setMessage(null);
    setBoard(after);
    const pt = toPt(point);
    if (problem.solutions.some((s) => sameMove(s, pt))) {
      setVerdict({ kind: 'correct', point });
      void markSolved();
      return;
    }
    const known = problem.refutations.find((r) => sameMove(r.move, pt));
    setVerdict({
      kind: 'wrong',
      point,
      why: known?.why ?? t('That is not the key move. Look for the point that decides the fight.'),
    });
    void repository.recordPuzzleAttempt(problem.id, false);
  };

  const markSolved = async () => {
    // Revealing the answer first means this is not a solve (and earns nothing).
    const { firstSolve } = await repository.recordPuzzleAttempt(problem.id, !revealed);
    if (!firstSolve) return;
    const now = systemClock.now();
    const response = await trainingEngine.recordSession({
      id: `go-puzzle:${problem.id}`,
      moduleId: 'go',
      activityType: 'game_session',
      startedAt: Math.min(startedAt.current, now - 1000),
      endedAt: now,
      source: 'timer',
      score: 1,
      result: { kind: 'tsumego', puzzleId: problem.id },
    });
    if (response.ok) setOutcome(response.value);
  };

  const retry = () => {
    setBoard(initial);
    setVerdict(null);
    setMessage(null);
  };

  const reveal = () => {
    if (!revealed) void repository.recordPuzzleAttempt(problem.id, false);
    setRevealed(true);
    setBoard(initial);
    setVerdict(null);
  };

  return (
    <Screen title={t(problem.title)} back={{ to: `${base}/tsumego`, label: t('Problems') }}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Chip>{categoryLabel(problem.category)}</Chip>
        <Badge tone="neutral">{t('Level {n}', { n: problem.difficulty })}</Badge>
        {(wasSolved || verdict?.kind === 'correct') && <Badge tone="success">{t('Solved')}</Badge>}
      </div>
      <p className="mb-3 type-headline">{objectiveText(problem)}</p>

      <GoBoard
        board={board}
        label={t('Tsumego diagram. {objective}', { objective: objectiveText(problem) })}
        edges={problem.edges}
        targets={targets}
        highlights={revealed ? solutionPoints : undefined}
        lastMove={verdict ? verdict.point : null}
        mode={verdict?.kind === 'correct' ? 'none' : 'play'}
        onPoint={play}
        pointLabel={(p) =>
          t('column {col}, row {row}', { col: (p % width) + 1, row: Math.floor(p / width) + 1 })
        }
      />
      <p className="mt-2 type-footnote text-muted">
        {t(
          'The triangle marks the group to save or capture. The diagram is the whole fight: nothing outside it can be played.',
        )}
      </p>

      <div role="status" aria-live="polite" className="mt-3">
        {message && <p className="type-subhead text-danger">{message}</p>}
        {verdict?.kind === 'correct' && (
          <Card className="border-success">
            <p className="type-headline text-success">{t('Correct!')}</p>
            <p className="mt-1 type-body">{t(problem.explanation)}</p>
          </Card>
        )}
        {verdict?.kind === 'wrong' && (
          <Card className="border-danger">
            <p className="type-headline text-danger">{t('Not this move')}</p>
            <p className="mt-1 type-body">{t(verdict.why)}</p>
          </Card>
        )}
        {revealed && !verdict && (
          <Card>
            <p className="type-headline">{t('Answer')}</p>
            <p className="mt-1 type-body">{t(problem.explanation)}</p>
            <p className="mt-1 type-footnote text-muted">
              {t('Shown answers do not count as solved. Try it yourself to earn the tick.')}
            </p>
          </Card>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {verdict?.kind === 'wrong' && <Button onClick={retry}>{t('Try again')}</Button>}
        {verdict?.kind === 'correct' && nextId && (
          <Link
            to={`${base}/tsumego/${nextId}`}
            className="inline-flex min-h-[50px] items-center justify-center rounded-xl bg-accent px-5 type-headline text-on-accent active:scale-[0.98] active:opacity-80"
          >
            {t('Next problem')}
          </Link>
        )}
        {verdict?.kind === 'correct' && (
          <Button variant="secondary" onClick={retry}>
            {t('Play it again')}
          </Button>
        )}
        {verdict?.kind !== 'correct' && !revealed && (
          <Button variant="secondary" onClick={reveal}>
            {t('Show the answer')}
          </Button>
        )}
      </div>

      <SessionCompleteSheet outcome={outcome} onClose={() => setOutcome(null)} />
    </Screen>
  );
}
