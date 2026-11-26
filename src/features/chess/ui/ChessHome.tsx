import { Link } from 'react-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ListRow, Section } from '@/components/Section';
import { Skeleton } from '@/components/Skeleton';
import { StatTile } from '@/components/StatTile';
import { t } from '@/i18n/core';
import { OPENINGS } from '../domain/openings';
import { PUZZLES } from '../domain/puzzles';
import { sideName } from './labels';
import { CHESS_BASE, LEVEL_LABEL, useChessSummary } from './useChess';

export function ChessHome() {
  const summary = useChessSummary();

  return (
    <Screen title={t('Chess')} back={{ to: '/practice', label: t('Practice') }}>
      {summary === undefined ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          {summary.draft && (
            <Card className="mb-4" role="region" aria-labelledby="resume-heading">
              <h2 id="resume-heading" className="type-headline">
                {t('Game in progress')}
              </h2>
              <p className="mt-1 type-subhead text-muted">
                {t('{level} engine, you play {color}, {n} moves played.', {
                  level: t(LEVEL_LABEL[summary.draft.level]),
                  color: sideName(summary.draft.color),
                  n: summary.draft.moves.length,
                })}
              </p>
              <Link
                to={`${CHESS_BASE}/play`}
                className="mt-3 inline-flex min-h-[50px] w-full items-center justify-center rounded-xl bg-accent px-5 type-headline text-on-accent active:scale-[0.98] active:opacity-80"
              >
                {t('Resume game')}
              </Link>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label={t('Puzzle rating')}
              value={String(summary.ratings.puzzle.value)}
              hint={t('{n} rated', { n: summary.ratings.puzzle.games })}
              icon="target"
            />
            <StatTile
              label={t('Play rating')}
              value={String(summary.ratings.play.value)}
              hint={t('{n} rated games', { n: summary.ratings.play.games })}
              icon="chess"
            />
            <StatTile
              label={t('Puzzles solved')}
              value={`${summary.puzzlesSolved}/${PUZZLES.length}`}
              icon="check"
            />
            <StatTile
              label={t('Puzzle streak')}
              value={`${summary.puzzleStreakDays}`}
              hint={summary.puzzleStreakDays === 1 ? t('day') : t('days')}
              icon="flame"
            />
          </div>
          <p className="mt-2 px-1 type-footnote text-muted">
            {t(
              'SkillForge ratings are only comparable with themselves. They are not FIDE or online ratings.',
            )}
          </p>
        </>
      )}

      <Section
        title={t('Train')}
        footer={
          summary
            ? t('Record against the engine: {wins} won, {draws} drawn, {losses} lost.', {
                wins: summary.games.wins,
                draws: summary.games.draws,
                losses: summary.games.losses,
              })
            : undefined
        }
      >
        <ListRow
          title={t('Puzzles')}
          subtitle={t('{n} tactics, picked near your rating', { n: PUZZLES.length })}
          icon="target"
          iconColor="#64748b"
          to={`${CHESS_BASE}/puzzles`}
        />
        <ListRow
          title={t('Play the engine')}
          subtitle={t('Three levels, undo and resign')}
          icon="chess"
          iconColor="#64748b"
          to={`${CHESS_BASE}/play`}
        />
        <ListRow
          title={t('Openings')}
          subtitle={t('{n} lines to drill', { n: OPENINGS.length })}
          icon="book"
          iconColor="#64748b"
          to={`${CHESS_BASE}/openings`}
        />
      </Section>
    </Screen>
  );
}
