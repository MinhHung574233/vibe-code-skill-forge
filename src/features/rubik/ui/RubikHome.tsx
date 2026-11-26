import { useMemo, useState } from 'react';
import { BarChart } from '@/components/BarChart';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { ListRow, Section } from '@/components/Section';
import { StatTile } from '@/components/StatTile';
import type { CompletionOutcome } from '@/features/training/domain/session';
import { t } from '@/i18n/core';
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
  type Penalty,
} from '../domain/stats';
import { CubeNet } from './cubeDrawing';
import { TimerPad } from './TimerPad';
import { useOpenSessionSolves, useRubikService, useSolves } from './useRubik';

const INSPECTION_KEY = 'sf-rubik-inspection';

function readInspectionPref(): boolean {
  try {
    return localStorage.getItem(INSPECTION_KEY) === '1';
  } catch {
    return false;
  }
}

export function RubikHome() {
  const moduleBack = { to: '/practice', label: t('Practice') };
  const service = useRubikService();
  const solves = useSolves();
  const sessionSolves = useOpenSessionSolves();
  const [scramble, setScramble] = useState(() => generateScramble());
  const [showCube, setShowCube] = useState(false);
  const [outcome, setOutcome] = useState<CompletionOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [inspection, setInspection] = useState(readInspectionPref);

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
        title: t('Solve {n}: {result}', {
          n: all.length - window.length + i + 1,
          result: formatSolve(s),
        }),
        value: (effectiveMs(s) ?? 0) / 1000,
      })),
    [all],
  );

  const toggleInspection = () => {
    const next = !inspection;
    setInspection(next);
    try {
      localStorage.setItem(INSPECTION_KEY, next ? '1' : '0');
    } catch {
      /* a preference only: the toggle still works for this visit */
    }
  };

  const onFinish = async (timeMs: number, penalty: Penalty) => {
    setError(null);
    try {
      await service.addSolve({ timeMs, scramble, penalty });
      setScramble(generateScramble());
    } catch {
      setError(t('Could not save that solve. Your device may be out of storage.'));
    }
  };

  const finishSession = async () => {
    setError(null);
    const result = await service.finishSession();
    if (!result.ok) setError(result.error.message);
    else if (result.value) setOutcome(result.value);
  };

  return (
    <Screen title={t('Rubik’s Cube')} back={moduleBack}>
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="type-footnote font-medium uppercase tracking-wide text-muted">
              {t('Scramble')}
            </h2>
            <p className="mt-1 break-words font-mono type-body" aria-label={t('Scramble moves')}>
              {scramble}
            </p>
          </div>
        </div>
        {cube && (
          <div className="mt-3">
            <CubeNet
              cube={cube}
              label={t('The cube after the scramble {scramble}', { scramble })}
            />
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setScramble(generateScramble())}>
            {t('New scramble')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowCube((v) => !v)}>
            {showCube ? t('Hide cube') : t('Show cube')}
          </Button>
          <Button
            variant={inspection ? 'primary' : 'ghost'}
            size="sm"
            aria-pressed={inspection}
            onClick={toggleInspection}
          >
            {t('Inspection')}
          </Button>
        </div>
      </Card>

      <div className="mt-4">
        <TimerPad
          onFinish={(ms, penalty) => void onFinish(ms, penalty)}
          lastMs={last ? last.timeMs : null}
          inspection={inspection}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 type-subhead text-danger">
          {error}
        </p>
      )}

      {last && (
        <Card className="mt-4">
          <p className="type-subhead text-muted">{t('Last solve')}</p>
          <p className="type-title-2 tabular-nums" aria-label={t('Last solve result')}>
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
              {t('Delete')}
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3">
        <StatTile
          label={t('Best')}
          value={stats.best === null ? '–' : formatSolveTime(stats.best)}
          icon="star"
        />
        <StatTile
          label={t('Solves')}
          value={String(all.length)}
          hint={t('{n} this session', { n: sessionSolves?.length ?? 0 })}
          icon="cube"
        />
        <StatTile
          label={t('Ao5')}
          value={formatAverage(stats.ao5)}
          hint={
            stats.bestAo5 === null
              ? undefined
              : t('Best {time}', { time: formatSolveTime(stats.bestAo5) })
          }
          icon="activity"
        />
        <StatTile label={t('Ao12')} value={formatAverage(stats.ao12)} icon="activity" />
      </div>

      {chartData.length >= 2 && (
        <Card className="mt-4">
          <h2 className="mb-2 type-headline">{t('Last {n} solves', { n: chartData.length })}</h2>
          <BarChart
            data={chartData}
            formatValue={(v) => `${v.toFixed(2)} s`}
            summary={t('Your last {n} solve times in seconds; lower is faster.', {
              n: chartData.length,
            })}
            labelEvery={chartData.length > 10 ? 5 : 1}
          />
        </Card>
      )}

      {(sessionSolves?.length ?? 0) > 0 && (
        <div className="mt-4">
          <Button fullWidth onClick={() => void finishSession()}>
            {t('Finish session')}
          </Button>
          <p className="mt-2 px-1 type-footnote text-muted">
            {t('Finishing saves this session for your streak, goals and XP.')}
          </p>
        </div>
      )}

      <Section title={t('More')}>
        <ListRow
          title={t('Solve history')}
          subtitle={t('Every solve, with penalties')}
          icon="clock"
          to="/practice/rubik/solves"
        />
        <ListRow
          title={t('Algorithms')}
          subtitle={t('2-look OLL and all 21 PLL, with pictures')}
          icon="book"
          to="/practice/rubik/algorithms"
        />
      </Section>

      <ConfirmDialog
        open={confirmDelete}
        title={t('Delete this solve?')}
        message={t('It will be removed from your times and averages.')}
        confirmLabel={t('Delete')}
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
