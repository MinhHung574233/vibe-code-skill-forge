import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Badge, type BadgeTone } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ListRow, Section } from '@/components/Section';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StatTile } from '@/components/StatTile';
import { newId } from '@/core/ids';
import { systemClock } from '@/core/time/clock';
import { getDb } from '@/db/boot';
import { clearDraft, loadDraft, loadFinishedGames, saveDraft } from '../data/caroRepository';
import { LEVELS, type Level } from '../domain/ai/levels';
import type { BoardSize } from '../domain/board';
import type { CaroDraft, Outcome } from '../domain/play';
import { computeStats, type Tally } from '../domain/stats';
import { CARO_PLAY, LEVEL_LABEL, LEVEL_NOTE, OUTCOME_LABEL } from './labels';

const OUTCOME_TONE: Record<Outcome, BadgeTone> = {
  win: 'success',
  loss: 'danger',
  draw: 'neutral',
};
const RECENT_GAMES = 10;

const percent = (rate: number | null): string =>
  rate === null ? '–' : `${Math.round(rate * 100)}%`;
const tallyText = (t: Tally): string => `${t.won} W · ${t.lost} L · ${t.drawn} D`;
const dayFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

/** Module home: set up a game, resume the one in progress, and see the record so far. */
export function CaroHome() {
  const navigate = useNavigate();
  const draft = useLiveQuery(() => loadDraft(getDb()), []);
  const games = useLiveQuery(() => loadFinishedGames(getDb()), []);
  const stats = useMemo(() => (games ? computeStats(games) : undefined), [games]);

  const [level, setLevel] = useState<Level>('medium');
  const [size, setSize] = useState<BoardSize>(15);
  const [first, setFirst] = useState<'player' | 'computer'>('player');
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setReplaceOpen(false);
    setError(null);
    const now = systemClock.now();
    const next: CaroDraft = {
      id: newId(now),
      size,
      level,
      humanStone: first === 'player' ? 1 : 2,
      startedAt: now,
      moves: [],
      undos: 0,
    };
    try {
      await saveDraft(getDb(), next, now);
    } catch {
      setError('Could not start the game. Try again.');
      return;
    }
    void navigate(CARO_PLAY);
  };

  const discard = async () => {
    setDiscardOpen(false);
    try {
      await clearDraft(getDb()); // abandoning records nothing
    } catch {
      setError('Could not discard the game. Try again.');
    }
  };

  return (
    <Screen title="Caro" back={{ to: '/practice', label: 'Practice' }}>
      {draft && (
        <Card role="region" aria-labelledby="caro-resume" className="mb-4">
          <h2 id="caro-resume" className="type-title-2">
            Game in progress
          </h2>
          <p className="mt-1 type-subhead text-muted">
            {LEVEL_LABEL[draft.level]} · {draft.size}×{draft.size} · {draft.moves.length} moves
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button onClick={() => void navigate(CARO_PLAY)}>Resume</Button>
            <Button variant="ghost" onClick={() => setDiscardOpen(true)}>
              Discard
            </Button>
          </div>
        </Card>
      )}

      <Card role="region" aria-labelledby="caro-new">
        <h2 id="caro-new" className="type-title-2">
          New game
        </h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <p className="type-subhead font-medium text-muted">Level</p>
            <SegmentedControl
              label="Level"
              value={level}
              onChange={setLevel}
              options={LEVELS.map((value) => ({ value, label: LEVEL_LABEL[value] }))}
            />
            <p className="type-footnote text-muted">{LEVEL_NOTE[level]}</p>
          </div>
          <div className="space-y-2">
            <p className="type-subhead font-medium text-muted">Board</p>
            <SegmentedControl
              label="Board size"
              value={String(size) as '15' | '9'}
              onChange={(value) => setSize(value === '9' ? 9 : 15)}
              options={[
                { value: '15', label: '15 × 15' },
                { value: '9', label: '9 × 9 quick' },
              ]}
            />
          </div>
          <div className="space-y-2">
            <p className="type-subhead font-medium text-muted">Who moves first</p>
            <SegmentedControl
              label="Who moves first"
              value={first}
              onChange={setFirst}
              options={[
                { value: 'player', label: 'You' },
                { value: 'computer', label: 'Computer' },
              ]}
            />
          </div>
          {error && (
            <p role="alert" className="type-subhead text-danger">
              {error}
            </p>
          )}
          <Button fullWidth onClick={() => (draft ? setReplaceOpen(true) : void start())}>
            Start game
          </Button>
        </div>
      </Card>

      {stats && games && (
        <>
          <Section title="Your record">
            {stats.total.played === 0 ? (
              <EmptyState
                icon="stones"
                title="No games yet"
                description="Finish a game to start your record. Resigned games are not counted."
              />
            ) : (
              <div className="grid grid-cols-3 gap-2 bg-bg p-2">
                <StatTile label="Played" value={String(stats.total.played)} />
                <StatTile label="Win rate" value={percent(stats.winRate)} />
                <StatTile
                  label="Win streak"
                  value={String(stats.winStreak)}
                  hint={`Best ${stats.bestWinStreak}`}
                />
              </div>
            )}
          </Section>

          {stats.total.played > 0 && (
            <>
              <Section title="By level">
                {LEVELS.map((value) => {
                  const tally = stats.byLevel[value];
                  return (
                    <ListRow
                      key={value}
                      title={LEVEL_LABEL[value]}
                      subtitle={`${tally.played} played`}
                      accessory={
                        <span className="type-subhead tabular-nums text-muted">
                          {tallyText(tally)}
                        </span>
                      }
                    />
                  );
                })}
              </Section>

              <Section title="Recent games">
                {games.slice(0, RECENT_GAMES).map((game) => (
                  <ListRow
                    key={game.id}
                    title={`${LEVEL_LABEL[game.level]} · ${game.size}×${game.size}`}
                    subtitle={`${game.moves} moves · ${dayFormat.format(game.endedAt)}`}
                    accessory={
                      <Badge tone={OUTCOME_TONE[game.outcome]}>{OUTCOME_LABEL[game.outcome]}</Badge>
                    }
                  />
                ))}
              </Section>
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={replaceOpen}
        destructive
        title="Replace the game in progress?"
        message="Starting a new game discards the one you are playing. Nothing is recorded for it."
        confirmLabel="Start new game"
        onConfirm={() => void start()}
        onCancel={() => setReplaceOpen(false)}
      />
      <ConfirmDialog
        open={discardOpen}
        destructive
        title="Discard this game?"
        message="It will be removed and nothing is recorded: no result, no XP."
        confirmLabel="Discard"
        onConfirm={() => void discard()}
        onCancel={() => setDiscardOpen(false)}
      />
    </Screen>
  );
}
