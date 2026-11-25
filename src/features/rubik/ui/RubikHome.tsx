import { useMemo, useState } from 'react';
import { BarChart } from '@/components/BarChart';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { ListRow, Section } from '@/components/Section';
import { StatTile } from '@/components/StatTile';
import type { CompletionOutcome } from '@/features/training/domain/session';
import { SessionCompleteSheet } from '@/features/training/ui/SessionCompleteSheet';
import { applyScramble } from '../domain/cube';
import { generateScramble } from '../domain/scramble';
import {
  averageOf,
  bestAverageOf,
  bestSingle,
  effectiveMs,
  formatAverage,
  formatSolve,
  formatSolveTime,
} from '../domain/stats';
import { CubeNet } from './cubeDrawing';
import { TimerPad } from './TimerPad';
import { useOpenSessionSolves, useRubikService, useSolves } from './useRubik';

const MODULE_BACK = { to: '/practice', label: 'Practice' };

export function RubikHome() {
  const service = useRubikService();
  const solves = useSolves();
  const sessionSolves = useOpenSessionSolves();
  const [scramble, setScramble] = useState(() => generateScramble());
  const [showCube, setShowCube] = useState(false);
  const [outcome, setOutcome] = useState<CompletionOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const all = useMemo(() => solves ?? [], [solves]);
  const last = all.at(-1);
  const cube = useMemo(() => (showCube ? applyScramble(scramble) : null), [showCube, scramble]);

  const stats = useMemo(
    () => ({
      best: bestSingle(all),
      ao5: averageOf(all, 5),
      ao12: averageOf(all, 12),
      bestAo5: bestAverageOf(all, 5),
    }),
    [all],
  );

  const chartData = useMemo(
    () =>
      all.slice(-20).map((s, i, window) => ({
        label: String(all.length - window.length + i + 1),
        title: `Solve ${all.length - window.length + i + 1}: ${formatSolve(s)}`,
        value: (effectiveMs(s) ?? 0) / 1000,
      })),
    [all],
  );

  const onFinish = async (timeMs: number) => {
    setError(null);
    try {
      await service.addSolve({ timeMs, scramble });
      setScramble(generateScramble());
    } catch {
      setError('Could not save that solve. Your device may be out of storage.');
    }
  };

  const finishSession = async () => {
    setError(null);
    const result = await service.finishSession();
    if (!result.ok) setError(result.error.message);
    else if (result.value) setOutcome(result.value);
  };

  return (
    <Screen title="Rubik’s Cube" back={MODULE_BACK}>
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="type-footnote font-medium uppercase tracking-wide text-muted">
              Scramble
            </h2>
            <p className="mt-1 break-words font-mono type-body" aria-label="Scramble moves">
              {scramble}
            </p>
          </div>
        </div>
        {cube && (
          <div className="mt-3">
            <CubeNet cube={cube} label={`The cube after the scramble ${scramble}`} />
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setScramble(generateScramble())}>
            New scramble
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowCube((v) => !v)}>
            {showCube ? 'Hide cube' : 'Show cube'}
          </Button>
        </div>
      </Card>

      <div className="mt-4">
        <TimerPad onFinish={(ms) => void onFinish(ms)} lastMs={last ? last.timeMs : null} />
      </div>

      {error && (
        <p role="alert" className="mt-3 type-subhead text-danger">
          {error}
        </p>
      )}

      {last && (
        <Card className="mt-4">
          <p className="type-subhead text-muted">Last solve</p>
          <p className="type-title-2 tabular-nums" aria-label="Last solve result">
            {formatSolve(last)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant={last.penalty === 'plus2' ? 'primary' : 'secondary'}
              size="sm"
              aria-pressed={last.penalty === 'plus2'}
              onClick={() =>
                void service.setPenalty(last.id, last.penalty === 'plus2' ? 'none' : 'plus2')
              }
            >
              +2
            </Button>
            <Button
              variant={last.penalty === 'dnf' ? 'primary' : 'secondary'}
              size="sm"
              aria-pressed={last.penalty === 'dnf'}
              onClick={() =>
                void service.setPenalty(last.id, last.penalty === 'dnf' ? 'none' : 'dnf')
              }
            >
              DNF
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatTile
          label="Best"
          value={stats.best === null ? '–' : formatSolveTime(stats.best)}
          icon="star"
        />
        <StatTile
          label="Solves"
          value={String(all.length)}
          hint={`${sessionSolves?.length ?? 0} this session`}
          icon="cube"
        />
        <StatTile
          label="Ao5"
          value={formatAverage(stats.ao5)}
          hint={stats.bestAo5 === null ? undefined : `Best ${formatSolveTime(stats.bestAo5)}`}
          icon="activity"
        />
        <StatTile label="Ao12" value={formatAverage(stats.ao12)} icon="activity" />
      </div>

      {chartData.length >= 2 && (
        <Card className="mt-4">
          <h2 className="mb-2 type-headline">Last {chartData.length} solves</h2>
          <BarChart
            data={chartData}
            formatValue={(v) => `${v.toFixed(2)} s`}
            summary={`Your last ${chartData.length} solve times in seconds; lower is faster.`}
            labelEvery={chartData.length > 10 ? 5 : 1}
          />
        </Card>
      )}

      {(sessionSolves?.length ?? 0) > 0 && (
        <div className="mt-4">
          <Button fullWidth onClick={() => void finishSession()}>
            Finish session
          </Button>
          <p className="mt-2 px-1 type-footnote text-muted">
            Finishing saves this session for your streak, goals and XP.
          </p>
        </div>
      )}

      <Section title="More">
        <ListRow
          title="Solve history"
          subtitle="Every solve, with penalties"
          icon="clock"
          to="/practice/rubik/solves"
        />
        <ListRow
          title="Algorithms"
          subtitle="2-look OLL and all 21 PLL, with pictures"
          icon="book"
          to="/practice/rubik/algorithms"
        />
      </Section>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this solve?"
        message="It will be removed from your times and averages."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          if (last) void service.deleteSolve(last.id);
        }}
      />
      <SessionCompleteSheet outcome={outcome} onClose={() => setOutcome(null)} />
    </Screen>
  );
}
