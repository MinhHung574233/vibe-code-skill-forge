import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { NumberStepper } from '@/components/NumberStepper';
import { Screen } from '@/components/Screen';
import { ListRow, Section } from '@/components/Section';
import { SegmentedControl } from '@/components/SegmentedControl';
import { newId } from '@/core/ids';
import { systemClock } from '@/core/time/clock';
import { getDb } from '@/db/boot';
import { t } from '@/i18n/core';
import { clearDraft, saveDraft, type GoDraft } from '../data/goDraft';
import type { Level } from '../domain/ai';
import type { BoardSize } from '../domain/board';
import { defaultKomi, maxHandicap } from '../domain/handicap';
import { randomSeed } from '../domain/rng';
import { breakdown, describeResult, type Tally } from '../domain/stats';
import { TSUMEGO_PROBLEMS } from '../domain/tsumego';
import { useGoContext, useGoDraft, useGoGames, usePuzzleProgress } from './hooks';
import { levelLabel } from './labels';

const SIZE_OPTIONS = [
  { value: '9', label: '9×9' },
  { value: '13', label: '13×13' },
  { value: '19', label: '19×19' },
] as const;

const tallyText = (tally: Tally): string =>
  tally.games === 0
    ? t('No games yet')
    : tally.draws > 0
      ? t('{wins} won · {losses} lost · {draws} drawn', {
          wins: tally.wins,
          losses: tally.losses,
          draws: tally.draws,
        })
      : t('{wins} won · {losses} lost', { wins: tally.wins, losses: tally.losses });

export function GoHome() {
  const { base, practice } = useGoContext();
  const navigate = useNavigate();
  const draft = useGoDraft();
  const games = useGoGames();
  const progress = usePuzzleProgress();

  const [size, setSize] = useState<BoardSize>(9);
  const [level, setLevel] = useState<Level>('easy');
  const [color, setColor] = useState<'black' | 'white'>('black');
  const [handicap, setHandicap] = useState(0);
  const [komi, setKomi] = useState(defaultKomi(0));
  const [komiEdited, setKomiEdited] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const changeHandicap = (value: number) => {
    // one handicap stone is just "Black moves first", so the steps are 0, 2, 3, ...
    const next = value === 1 ? (value > handicap ? 2 : 0) : value;
    setHandicap(next);
    if (!komiEdited) setKomi(defaultKomi(next));
  };
  const changeSize = (next: BoardSize) => {
    setSize(next);
    if (handicap > maxHandicap(next)) changeHandicap(maxHandicap(next));
  };

  const start = async () => {
    setConfirmReplace(false);
    const now = systemClock.now();
    const fresh: GoDraft = {
      gameId: newId(now),
      startedAt: now,
      level,
      humanColor: color,
      config: { size, komi, handicap },
      moves: [],
      resignedBy: null,
      seed: randomSeed(),
    };
    await saveDraft(getDb(), fresh, now);
    void navigate(`${base}/play`);
  };

  const discard = async () => {
    setConfirmDiscard(false);
    await clearDraft(getDb());
  };

  const levelOptions = [
    { value: 'easy', label: t('Easy') },
    { value: 'medium', label: t('Medium') },
    { value: 'hard', label: t('Hard') },
  ] as const;
  const colorOptions = [
    { value: 'black', label: t('Black (first)') },
    { value: 'white', label: t('White') },
  ] as const;

  const stats = games ? breakdown(games) : null;
  const solved = progress ? [...progress.values()].filter((p) => p.solved === 1).length : 0;

  return (
    <Screen title={t('Go')} back={{ to: practice, label: t('Practice') }}>
      {draft && (
        <Card className="mb-4" aria-labelledby="resume-heading" role="region">
          <h2 id="resume-heading" className="type-title-2">
            {draft.finished ? t('Game not saved yet') : t('Game in progress')}
          </h2>
          <p className="mt-1 type-subhead text-muted">
            {draft.config.size}×{draft.config.size} · {levelLabel(draft.level)} ·{' '}
            {draft.humanColor === 'white' ? t('you are white') : t('you are black')} ·{' '}
            {t('{count} moves played', { count: draft.moves.length })}
          </p>
          {draft.finished && (
            <p className="mt-1 type-subhead text-muted">
              {t('This game is over, but its result has not been saved yet.')}
            </p>
          )}
          <div className="mt-4 flex flex-col gap-2">
            <Link
              to={`${base}/play`}
              className="inline-flex min-h-[50px] items-center justify-center rounded-xl bg-accent px-5 type-headline text-on-accent active:scale-[0.98] active:opacity-80"
            >
              {draft.finished ? t('Try saving again') : t('Resume game')}
            </Link>
            <Button variant="ghost" onClick={() => setConfirmDiscard(true)}>
              {t('Discard it')}
            </Button>
          </div>
        </Card>
      )}

      <Card aria-labelledby="new-heading" role="region">
        <h2 id="new-heading" className="type-title-2">
          {t('New game')}
        </h2>
        <div className="mt-4 space-y-4">
          <Field label={t('Board')}>
            <SegmentedControl
              label={t('Board size')}
              options={SIZE_OPTIONS}
              value={String(size) as '9' | '13' | '19'}
              onChange={(v) => changeSize(Number(v) as BoardSize)}
            />
          </Field>
          <Field label={t('Opponent')}>
            <SegmentedControl
              label={t('Opponent level')}
              options={levelOptions}
              value={level}
              onChange={setLevel}
            />
          </Field>
          <Field label={t('You play')}>
            <SegmentedControl
              label={t('Your colour')}
              options={colorOptions}
              value={color}
              onChange={setColor}
            />
          </Field>
          <div className="flex items-center justify-between gap-3">
            <span className="type-body">{t('Handicap')}</span>
            <NumberStepper
              label={t('Handicap')}
              value={handicap}
              min={0}
              max={maxHandicap(size)}
              step={1}
              format={(v) => (v === 0 ? t('None') : t('{count} stones', { count: v }))}
              onChange={changeHandicap}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="type-body">{t('Komi')}</span>
            <NumberStepper
              label={t('Komi')}
              value={komi}
              min={0.5}
              max={20.5}
              step={1}
              format={(v) => t('{count} pts', { count: v })}
              onChange={(v) => {
                setKomi(v);
                setKomiEdited(true);
              }}
            />
          </div>
          <p className="type-footnote text-muted">
            {t(
              'Area (Chinese) scoring. White moves first when Black has handicap stones. The computer is a beginner-level engine: roughly 25 to 15 kyu at best on 9×9, weaker on larger boards. These are estimates, not a rating.',
            )}
          </p>
          <Button fullWidth onClick={() => (draft ? setConfirmReplace(true) : void start())}>
            {t('Start game')}
          </Button>
        </div>
      </Card>

      <Section title={t('Tsumego')}>
        <ListRow
          title={t('Life-and-death problems')}
          subtitle={t('{solved} of {total} solved', {
            solved,
            total: TSUMEGO_PROBLEMS.length,
          })}
          icon="target"
          iconColor="var(--accent)"
          to={`${base}/tsumego`}
        />
      </Section>

      <Section title={t('Your record')}>
        {stats && games && games.length > 0 ? (
          <>
            {stats.byLevel.map(({ level: l, tally }) => (
              <ListRow key={l} title={levelLabel(l)} subtitle={tallyText(tally)} />
            ))}
            {stats.bySize.map(({ size: s, tally }) => (
              <ListRow key={s} title={`${s}×${s}`} subtitle={tallyText(tally)} />
            ))}
          </>
        ) : (
          <EmptyState
            icon="stones"
            title={t('No finished games yet')}
            description={t('Finish a game of at least five moves to see your record.')}
          />
        )}
      </Section>

      {games && games.length > 0 && (
        <Section title={t('Recent games')}>
          {games.slice(0, 5).map((g) => (
            <ListRow
              key={g.id}
              title={`${g.size}×${g.size} · ${levelLabel(g.level)} · ${g.color === 'black' ? t('Black') : t('White')}`}
              subtitle={describeResult(g)}
            />
          ))}
        </Section>
      )}

      <ConfirmDialog
        open={confirmReplace}
        title={t('Start a new game?')}
        message={t('The game in progress will be deleted. It will not be recorded.')}
        confirmLabel={t('Start new game')}
        destructive
        onConfirm={() => void start()}
        onCancel={() => setConfirmReplace(false)}
      />
      <ConfirmDialog
        open={confirmDiscard}
        title={t('Discard this game?')}
        message={t('The game in progress will be deleted. It will not be recorded.')}
        confirmLabel={t('Discard')}
        destructive
        onConfirm={() => void discard()}
        onCancel={() => setConfirmDiscard(false)}
      />
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="px-1 type-subhead font-medium">{label}</p>
      {children}
    </div>
  );
}
