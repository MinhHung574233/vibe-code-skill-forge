import { Link } from 'react-router';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ListRow, Section } from '@/components/Section';
import { Skeleton } from '@/components/Skeleton';
import { StatTile } from '@/components/StatTile';
import { OPENINGS } from '../domain/openings';
import { PUZZLES } from '../domain/puzzles';
import { CHESS_BASE, LEVEL_LABEL, useChessSummary } from './useChess';

export function ChessHome() {
  const summary = useChessSummary();

  return (
    <Screen title="Chess" back={{ to: '/practice', label: 'Practice' }}>
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
                Game in progress
              </h2>
              <p className="mt-1 type-subhead text-muted">
                {LEVEL_LABEL[summary.draft.level]} engine, you play{' '}
                {summary.draft.color === 'w' ? 'White' : 'Black'}, {summary.draft.moves.length} moves
                played.
              </p>
              <Link
                to={`${CHESS_BASE}/play`}
                className="mt-3 inline-flex min-h-[50px] w-full items-center justify-center rounded-xl bg-accent px-5 type-headline text-on-accent active:scale-[0.98] active:opacity-80"
              >
                Resume game
              </Link>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-3">
            <StatTile
              label="Puzzle rating"
              value={String(summary.ratings.puzzle.value)}
              hint={`${summary.ratings.puzzle.games} rated`}
              icon="target"
            />
            <StatTile
              label="Play rating"
              value={String(summary.ratings.play.value)}
              hint={`${summary.ratings.play.games} rated games`}
              icon="chess"
            />
            <StatTile
              label="Puzzles solved"
              value={`${summary.puzzlesSolved}/${PUZZLES.length}`}
              icon="check"
            />
            <StatTile
              label="Puzzle streak"
              value={`${summary.puzzleStreakDays}`}
              hint={summary.puzzleStreakDays === 1 ? 'day' : 'days'}
              icon="flame"
            />
          </div>
          <p className="mt-2 px-1 type-footnote text-muted">
            SkillForge ratings are only comparable with themselves. They are not FIDE or online
            ratings.
          </p>
        </>
      )}

      <Section
        title="Train"
        footer={
          summary
            ? `Record against the engine: ${summary.games.wins} won, ${summary.games.draws} drawn, ${summary.games.losses} lost.`
            : undefined
        }
      >
        <ListRow
          title="Puzzles"
          subtitle={`${PUZZLES.length} tactics, picked near your rating`}
          icon="target"
          iconColor="#64748b"
          to={`${CHESS_BASE}/puzzles`}
        />
        <ListRow
          title="Play the engine"
          subtitle="Three levels, undo and resign"
          icon="chess"
          iconColor="#64748b"
          to={`${CHESS_BASE}/play`}
        />
        <ListRow
          title="Openings"
          subtitle={`${OPENINGS.length} lines to drill`}
          icon="book"
          iconColor="#64748b"
          to={`${CHESS_BASE}/openings`}
        />
      </Section>
    </Screen>
  );
}
