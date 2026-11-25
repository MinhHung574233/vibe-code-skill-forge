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
import { clearDraft, saveDraft, type GoDraft } from '../data/goDraft';
import type { Level } from '../domain/ai';
import type { BoardSize } from '../domain/board';
import { defaultKomi, maxHandicap } from '../domain/handicap';
import { randomSeed } from '../domain/rng';
import { breakdown, describeResult, type Tally } from '../domain/stats';
import { TSUMEGO_PROBLEMS } from '../domain/tsumego';
import { useGoContext, useGoDraft, useGoGames, usePuzzleProgress } from './hooks';

const SIZE_OPTIONS = [
  { value: '9', label: '9×9' },
  { value: '13', label: '13×13' },
  { value: '19', label: '19×19' },
] as const;

const LEVEL_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
] as const;

const COLOR_OPTIONS = [
  { value: 'black', label: 'Black (first)' },
  { value: 'white', label: 'White' },
] as const;

const LEVEL_LABEL: Record<Level, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

const tallyText = (t: Tally): string =>
  t.games === 0
    ? 'No games yet'
    : `${t.wins} won · ${t.losses} lost${t.draws > 0 ? ` · ${t.draws} drawn` : ''}`;

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

  const stats = games ? breakdown(games) : null;
  const solved = progress ? [...progress.values()].filter((p) => p.solved === 1).length : 0;

  return (
    <Screen title="Go" back={{ to: practice, label: 'Practice' }}>
      {draft && (
        <Card className="mb-4" aria-labelledby="resume-heading" role="region">
          <h2 id="resume-heading" className="type-title-2">
            Game in progress
          </h2>
          <p className="mt-1 type-subhead text-muted">
            {draft.config.size}×{draft.config.size} · {LEVEL_LABEL[draft.level]} · you are{' '}
            {draft.humanColor} · {draft.moves.length} moves played
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              to={`${base}/play`}
              className="inline-flex min-h-[50px] items-center justify-center rounded-xl bg-accent px-5 type-headline text-on-accent active:scale-[0.98] active:opacity-80"
            >
              Resume game
            </Link>
            <Button variant="ghost" onClick={() => setConfirmDiscard(true)}>
              Discard it
            </Button>
          </div>
        </Card>
      )}

      <Card aria-labelledby="new-heading" role="region">
        <h2 id="new-heading" className="type-title-2">
          New game
        </h2>
        <div className="mt-4 space-y-4">
          <Field label="Board">
            <SegmentedControl
              label="Board size"
              options={SIZE_OPTIONS}
              value={String(size) as '9' | '13' | '19'}
              onChange={(v) => changeSize(Number(v) as BoardSize)}
            />
          </Field>
          <Field label="Opponent">
            <SegmentedControl
              label="Opponent level"
              options={LEVEL_OPTIONS}
              value={level}
              onChange={setLevel}
            />
          </Field>
          <Field label="You play">
            <SegmentedControl
              label="Your colour"
              options={COLOR_OPTIONS}
              value={color}
              onChange={setColor}
            />
          </Field>
          <div className="flex items-center justify-between gap-3">
            <span className="type-body">Handicap</span>
            <NumberStepper
              label="Handicap"
              value={handicap}
              min={0}
              max={maxHandicap(size)}
              step={1}
              format={(v) => (v === 0 ? 'None' : `${v} stones`)}
              onChange={changeHandicap}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="type-body">Komi</span>
            <NumberStepper
              label="Komi"
              value={komi}
              min={0.5}
              max={20.5}
              step={1}
              format={(v) => `${v} pts`}
              onChange={(v) => {
                setKomi(v);
                setKomiEdited(true);
              }}
            />
          </div>
          <p className="type-footnote text-muted">
            Area (Chinese) scoring. White moves first when Black has handicap stones. The computer
            is a beginner-level engine: roughly 25 to 15 kyu at best on 9×9, weaker on larger
            boards. These are estimates, not a rating.
          </p>
          <Button fullWidth onClick={() => (draft ? setConfirmReplace(true) : void start())}>
            Start game
          </Button>
        </div>
      </Card>

      <Section title="Tsumego">
        <ListRow
          title="Life-and-death problems"
          subtitle={`${solved} of ${TSUMEGO_PROBLEMS.length} solved`}
          icon="target"
          iconColor="var(--accent)"
          to={`${base}/tsumego`}
        />
      </Section>

      <Section title="Your record">
        {stats && games && games.length > 0 ? (
          <>
            {stats.byLevel.map(({ level: l, tally }) => (
              <ListRow key={l} title={LEVEL_LABEL[l]} subtitle={tallyText(tally)} />
            ))}
            {stats.bySize.map(({ size: s, tally }) => (
              <ListRow key={s} title={`${s}×${s}`} subtitle={tallyText(tally)} />
            ))}
          </>
        ) : (
          <EmptyState
            icon="stones"
            title="No finished games yet"
            description="Finish a game of at least five moves to see your record."
          />
        )}
      </Section>

      {games && games.length > 0 && (
        <Section title="Recent games">
          {games.slice(0, 5).map((g) => (
            <ListRow
              key={g.id}
              title={`${g.size}×${g.size} · ${LEVEL_LABEL[g.level]} · ${g.color === 'black' ? 'Black' : 'White'}`}
              subtitle={describeResult(g)}
            />
          ))}
        </Section>
      )}

      <ConfirmDialog
        open={confirmReplace}
        title="Start a new game?"
        message="The game in progress will be deleted. It will not be recorded."
        confirmLabel="Start new game"
        destructive
        onConfirm={() => void start()}
        onCancel={() => setConfirmReplace(false)}
      />
      <ConfirmDialog
        open={confirmDiscard}
        title="Discard this game?"
        message="The game in progress will be deleted. It will not be recorded."
        confirmLabel="Discard"
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
