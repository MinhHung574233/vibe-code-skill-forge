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
import { intlLocale, t } from '@/i18n/core';
import { clearDraft, loadDraft, loadFinishedGames, saveDraft } from '../data/caroRepository';
import { LEVELS, type Level } from '../domain/ai/levels';
import type { BoardSize } from '../domain/board';
import type { CaroDraft, Outcome } from '../domain/play';
import { computeStats, type Tally } from '../domain/stats';
import { CARO_PLAY, levelLabel, levelNote, outcomeLabel } from './labels';

const OUTCOME_TONE: Record<Outcome, BadgeTone> = {
  win: 'success',
  loss: 'danger',
  draw: 'neutral',
};
const RECENT_GAMES = 10;

const percent = (rate: number | null): string =>
  rate === null ? '–' : `${Math.round(rate * 100)}%`;
const tallyText = (tally: Tally): string =>
  t('{won} W · {lost} L · {drawn} D', { won: tally.won, lost: tally.lost, drawn: tally.drawn });
const formatDay = (at: number): string =>
  new Intl.DateTimeFormat(intlLocale(), { month: 'short', day: 'numeric' }).format(at);

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
      setError(t('Could not start the game. Try again.'));
      return;
    }
    void navigate(CARO_PLAY);
  };

  const discard = async () => {
    setDiscardOpen(false);
    try {
      await clearDraft(getDb()); // abandoning records nothing
    } catch {
      setError(t('Could not discard the game. Try again.'));
    }
  };

  return (
    <Screen title={t('Caro')} back={{ to: '/practice', label: t('Practice') }}>
      {draft && (
        <Card role="region" aria-labelledby="caro-resume" className="mb-4">
          <h2 id="caro-resume" className="type-title-2">
            {t('Game in progress')}
          </h2>
          <p className="mt-1 type-subhead text-muted">
            {levelLabel(draft.level)} · {draft.size}×{draft.size} ·{' '}
            {t('{count} moves', { count: draft.moves.length })}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button onClick={() => void navigate(CARO_PLAY)}>{t('Resume')}</Button>
            <Button variant="ghost" onClick={() => setDiscardOpen(true)}>
              {t('Discard')}
            </Button>
          </div>
        </Card>
      )}

      <Card role="region" aria-labelledby="caro-new">
        <h2 id="caro-new" className="type-title-2">
          {t('New game')}
        </h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <p className="type-subhead font-medium text-muted">{t('Level')}</p>
            <SegmentedControl
              label={t('Level')}
              value={level}
              onChange={setLevel}
              options={LEVELS.map((value) => ({ value, label: levelLabel(value) }))}
            />
            <p className="type-footnote text-muted">{levelNote(level)}</p>
          </div>
          <div className="space-y-2">
            <p className="type-subhead font-medium text-muted">{t('Board')}</p>
            <SegmentedControl
              label={t('Board size')}
              value={String(size) as '15' | '9'}
              onChange={(value) => setSize(value === '9' ? 9 : 15)}
              options={[
                { value: '15', label: '15 × 15' },
                { value: '9', label: t('9 × 9 quick') },
              ]}
            />
          </div>
          <div className="space-y-2">
            <p className="type-subhead font-medium text-muted">{t('Who moves first')}</p>
            <SegmentedControl
              label={t('Who moves first')}
              value={first}
              onChange={setFirst}
              options={[
                { value: 'player', label: t('You') },
                { value: 'computer', label: t('Computer') },
              ]}
            />
          </div>
          {error && (
            <p role="alert" className="type-subhead text-danger">
              {error}
            </p>
          )}
          <Button fullWidth onClick={() => (draft ? setReplaceOpen(true) : void start())}>
            {t('Start game')}
          </Button>
        </div>
      </Card>

      {stats && games && (
        <>
          <Section title={t('Your record')}>
            {stats.total.played === 0 ? (
              <EmptyState
                icon="stones"
                title={t('No games yet')}
                description={t(
                  'Finish a game to start your record. Resigned games are not counted.',
                )}
              />
            ) : (
              <div className="grid grid-cols-3 gap-2 bg-bg p-2">
                <StatTile label={t('Played')} value={String(stats.total.played)} />
                <StatTile label={t('Win rate')} value={percent(stats.winRate)} />
                <StatTile
                  label={t('Win streak')}
                  value={String(stats.winStreak)}
                  hint={t('Best {n}', { n: stats.bestWinStreak })}
                />
              </div>
            )}
          </Section>

          {stats.total.played > 0 && (
            <>
              <Section title={t('By level')}>
                {LEVELS.map((value) => {
                  const tally = stats.byLevel[value];
                  return (
                    <ListRow
                      key={value}
                      title={levelLabel(value)}
                      subtitle={t('{count} played', { count: tally.played })}
                      accessory={
                        <span className="type-subhead tabular-nums text-muted">
                          {tallyText(tally)}
                        </span>
                      }
                    />
                  );
                })}
              </Section>

              <Section title={t('Recent games')}>
                {games.slice(0, RECENT_GAMES).map((game) => (
                  <ListRow
                    key={game.id}
                    title={`${levelLabel(game.level)} · ${game.size}×${game.size}`}
                    subtitle={`${t('{count} moves', { count: game.moves })} · ${formatDay(game.endedAt)}`}
                    accessory={
                      <Badge tone={OUTCOME_TONE[game.outcome]}>{outcomeLabel(game.outcome)}</Badge>
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
        title={t('Replace the game in progress?')}
        message={t(
          'Starting a new game discards the one you are playing. Nothing is recorded for it.',
        )}
        confirmLabel={t('Start new game')}
        onConfirm={() => void start()}
        onCancel={() => setReplaceOpen(false)}
      />
      <ConfirmDialog
        open={discardOpen}
        destructive
        title={t('Discard this game?')}
        message={t('It will be removed and nothing is recorded: no result, no XP.')}
        confirmLabel={t('Discard')}
        onConfirm={() => void discard()}
        onCancel={() => setDiscardOpen(false)}
      />
    </Screen>
  );
}
