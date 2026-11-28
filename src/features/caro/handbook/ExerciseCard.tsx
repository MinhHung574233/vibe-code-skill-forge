import { useState } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { t } from '@/i18n/core';
import { MiniBoard } from './MiniBoard';
import type { Exercise, Mark, Spot } from './types';

interface ExerciseCardProps {
  exercise: Exercise;
  /** 1-based position among the exercises of the chapter, for the heading. */
  number: number;
  solved: boolean;
  onSolved: (id: string) => void;
}

type Outcome =
  | { kind: 'idle' }
  | { kind: 'right'; pick: Spot }
  | { kind: 'wrong'; pick: Spot; why: string }
  | { kind: 'shown' };

const sameSpot = (a: Spot, b: Spot): boolean => a[0] === b[0] && a[1] === b[1];

/**
 * One "find the move" exercise. The person taps a square: the feedback (in a polite live region)
 * says why it works or why it fails. Wrong taps can be retried; the answer can be shown, which
 * does not count as solved. The feedback is words plus an icon, never colour alone.
 */
export function ExerciseCard({ exercise, number, solved, onSolved }: ExerciseCardProps) {
  const [outcome, setOutcome] = useState<Outcome>({ kind: 'idle' });

  const choose = (spot: Spot) => {
    if (sameSpot(spot, exercise.answer)) {
      setOutcome({ kind: 'right', pick: spot });
      onSolved(exercise.id);
      return;
    }
    const known = exercise.wrong.find((w) => sameSpot(w.at, spot));
    setOutcome({ kind: 'wrong', pick: spot, why: known?.why ?? exercise.otherWrong });
  };

  const marks: Mark[] =
    outcome.kind === 'wrong'
      ? [{ at: outcome.pick, kind: 'bad' }]
      : outcome.kind === 'right'
        ? [{ at: exercise.answer, kind: 'win' }]
        : outcome.kind === 'shown'
          ? [{ at: exercise.answer, kind: 'move' }]
          : [];
  const pick = outcome.kind === 'right' ? outcome.pick : null;
  const finished = outcome.kind === 'right' || outcome.kind === 'shown';

  return (
    <Card role="group" aria-labelledby={`exercise-${exercise.id}`} className="my-4">
      <div className="flex items-start justify-between gap-2">
        <h3 id={`exercise-${exercise.id}`} className="type-headline">
          {t('Exercise {n}', { n: number })}
        </h3>
        {solved && <Badge tone="success">{t('Solved')}</Badge>}
      </div>
      <p className="mt-1 type-body">{t(exercise.prompt)}</p>
      <p className="mt-1 type-footnote text-muted">
        {t('You play the filled stones. Tap a square.')}
      </p>
      <div className="mt-3">
        <MiniBoard
          rows={exercise.rows}
          edges={exercise.edges}
          marks={marks}
          pick={pick}
          locked={finished}
          label={t('Exercise board: {prompt}', { prompt: t(exercise.prompt) })}
          onSelect={choose}
        />
      </div>

      <div role="status" aria-live="polite" className="mt-3">
        {outcome.kind === 'right' && (
          <p className="flex gap-2 type-subhead">
            <Icon name="check" size={20} className="mt-0.5 shrink-0 text-success" />
            <span>
              <strong>{t('Correct!')}</strong> {t(exercise.because)}
            </span>
          </p>
        )}
        {outcome.kind === 'wrong' && (
          <p className="flex gap-2 type-subhead">
            <Icon name="x" size={20} className="mt-0.5 shrink-0 text-danger" />
            <span>
              <strong>{t('Not quite.')}</strong> {t(outcome.why)}
            </span>
          </p>
        )}
        {outcome.kind === 'shown' && (
          <p className="flex gap-2 type-subhead">
            <Icon name="info" size={20} className="mt-0.5 shrink-0 text-accent" />
            <span>
              <strong>{t('Answer shown.')}</strong> {t(exercise.because)}
            </span>
          </p>
        )}
      </div>

      {outcome.kind !== 'idle' && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setOutcome({ kind: 'idle' })}>
            {t('Try again')}
          </Button>
          {outcome.kind === 'wrong' && (
            <Button size="sm" variant="ghost" onClick={() => setOutcome({ kind: 'shown' })}>
              {t('Show the answer')}
            </Button>
          )}
        </div>
      )}
      {outcome.kind === 'idle' && (
        <div className="mt-3">
          <Button size="sm" variant="ghost" onClick={() => setOutcome({ kind: 'shown' })}>
            {t('Show the answer')}
          </Button>
        </div>
      )}
    </Card>
  );
}
