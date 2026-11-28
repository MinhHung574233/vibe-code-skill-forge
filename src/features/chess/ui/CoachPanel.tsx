import { Badge, type BadgeTone } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { t } from '@/i18n/core';
import {
  GRADES,
  summariseReviews,
  type MoveAnalysis,
  type MoveGrade,
  type MoveReview,
  type MoveSuggestion,
} from '../domain/coach';
import { analysisLines, gradeLabel, suggestionLines } from './coachText';

const GRADE_TONE: Record<MoveGrade, BadgeTone> = {
  best: 'success',
  good: 'success',
  inaccuracy: 'warning',
  mistake: 'danger',
  blunder: 'danger',
};

/** Rating badge: the word carries the meaning, the dot colour only backs it up. */
export function GradeBadge({ grade }: { grade: MoveGrade }) {
  return <Badge tone={GRADE_TONE[grade]}>{gradeLabel(grade)}</Badge>;
}

interface FeedbackProps {
  analysis: MoveAnalysis;
  /** The engine is waiting for the learner to decide. */
  waiting: boolean;
  onTakeBack: () => void;
  onContinue: () => void;
}

/** The coach's verdict on the learner's last move. The text sits in a polite live region. */
export function CoachFeedback({ analysis, waiting, onTakeBack, onContinue }: FeedbackProps) {
  return (
    <Card role="region" aria-label={t('Coach')} className="space-y-3">
      <div aria-live="polite" className="space-y-2">
        <p className="flex flex-wrap items-center gap-2 type-headline">
          <GradeBadge grade={analysis.grade} />
          <span className="tabular-nums">{analysis.playedSan}</span>
        </p>
        {analysisLines(analysis).map((line) => (
          <p key={line} className="type-body">
            {line}
          </p>
        ))}
      </div>
      {waiting && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onTakeBack}>
            {t('Take back and try again')}
          </Button>
          <Button onClick={onContinue}>{t('Continue')}</Button>
        </div>
      )}
    </Card>
  );
}

/** A suggested move before the learner moves ("Show me a good move"). */
export function CoachHint({ suggestion }: { suggestion: MoveSuggestion }) {
  return (
    <Card role="region" aria-label={t('Coach')} className="space-y-2">
      <div aria-live="polite" className="space-y-2">
        {suggestionLines(suggestion).map((line) => (
          <p key={line} className="type-body">
            {line}
          </p>
        ))}
      </div>
    </Card>
  );
}

/** The learner always plays the same colour, so the full-move number says which move it was. */
const moveNumber = (ply: number): number => Math.floor(ply / 2) + 1;

/** End-of-game summary of a coach game: grades, accuracy and the costliest moves. */
export function CoachReview({ reviews }: { reviews: readonly MoveReview[] }) {
  const summary = summariseReviews(reviews);
  if (summary.moves === 0 || summary.accuracy === null) return null;
  return (
    <Card role="region" aria-labelledby="coach-review-title" className="space-y-3">
      <h2 id="coach-review-title" className="type-headline">
        {t('Game review')}
      </h2>
      <p className="type-body">{t('Accuracy: {n}%', { n: summary.accuracy })}</p>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 type-subhead">
        {GRADES.map((grade) => (
          <li key={grade} className="flex items-center justify-between gap-2">
            <span>{gradeLabel(grade)}</span>
            <span className="font-semibold tabular-nums">{summary.counts[grade]}</span>
          </li>
        ))}
      </ul>
      {summary.biggest.length > 0 && (
        <div>
          <h3 className="type-subhead font-semibold">{t('Where you lost the most')}</h3>
          <ol className="mt-1 space-y-2">
            {summary.biggest.map((r) => (
              <li key={r.ply} className="space-y-1">
                <GradeBadge grade={r.grade} />
                <p className="type-body">
                  {t('Move {n}: you played {played}. A better move was {best}.', {
                    n: moveNumber(r.ply),
                    played: r.san,
                    best: r.bestSan,
                  })}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
      <p className="type-footnote text-muted">
        {t(
          'Accuracy is SkillForge’s own figure: how close your moves were to the engine’s choice, from 0 to 100. It is not a rating.',
        )}
      </p>
    </Card>
  );
}
