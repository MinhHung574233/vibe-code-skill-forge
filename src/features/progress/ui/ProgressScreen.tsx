import { useMemo, useState } from 'react';
import { BarChart, type BarDatum } from '@/components/BarChart';
import { Card } from '@/components/Card';
import { DonutChart, type DonutSlice } from '@/components/DonutChart';
import { EmptyState } from '@/components/EmptyState';
import { Icon, type IconName } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StatTile } from '@/components/StatTile';
import { ACHIEVEMENTS, EMPTY_FACTS, type UserFacts } from '@/core/training/achievements';
import { formatMinutes, type Trend } from '@/core/training/analytics';
import { toLocalDate } from '@/core/time/localDate';
import { useNow } from '@/hooks/useNow';
import { intlLocale, t } from '@/i18n/core';
import {
  UNASSIGNED_KEY,
  buildProgress,
  type ProgressRange,
} from '@/features/training/domain/overview';
import { SessionList } from '@/features/training/ui/SessionList';
import {
  useOverview,
  useRecentSessions,
  useSkills,
  useTrainingData,
  useUnlockedAchievements,
} from '@/features/training/ui/useTraining';
import { formatDateTime } from '@/utils/format';

const ranges = () =>
  [
    { value: '7', label: t('7 days') },
    { value: '30', label: t('30 days') },
  ] as const;

/** Distinct hues for slices; every slice is also named in the legend (never colour alone). */
const SLICE_COLORS = ['#4f46e5', '#0ea5e9', '#f97316', '#14b8a6', '#8b5cf6', '#22c55e', '#64748b'];

function trendText(value: Trend): string {
  switch (value.kind) {
    case 'flat':
      return t('Same as the previous period');
    case 'new':
      return t('Nothing in the previous period');
    case 'up':
      return t('Up {percent}% on the previous period', { percent: value.percent });
    case 'down':
      return t('Down {percent}% on the previous period', { percent: value.percent });
  }
}

const weekdayLetter = (date: string) => {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Intl.DateTimeFormat(intlLocale(), { weekday: 'narrow' }).format(new Date(y, m - 1, d));
};
const dayTitle = (date: string) => {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Intl.DateTimeFormat(intlLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(y, m - 1, d));
};

export function ProgressScreen() {
  const [range, setRange] = useState<ProgressRange>(7);
  const now = useNow();
  const data = useTrainingData();
  const trained = useOverview();
  const skills = useSkills(true);
  const recent = useRecentSessions(20);
  const unlocked = useUnlockedAchievements();

  const skillNames = useMemo(() => new Map((skills ?? []).map((s) => [s.id, s.name])), [skills]);
  const view = useMemo(
    () => (data ? buildProgress(data, now, range) : undefined),
    [data, now, range],
  );
  const today = toLocalDate(now);

  const hasAnyData = (data?.days.length ?? 0) > 0;

  const bars: BarDatum[] = (view?.series ?? []).map((d) => ({
    label: range === 7 ? weekdayLetter(d.date) : d.date.slice(8),
    title: dayTitle(d.date),
    value: d.minutes,
  }));

  const slices: DonutSlice[] = (view?.bySkill ?? []).map((s, i) => ({
    key: s.key,
    label:
      s.key === UNASSIGNED_KEY
        ? t('No specific skill')
        : (skillNames.get(s.key) ?? t('Deleted skill')),
    value: s.minutes,
    color: SLICE_COLORS[i % SLICE_COLORS.length] ?? '#64748b',
  }));

  // Facts shown as achievement progress: only what exists today (module facts stay 0).
  const facts: UserFacts = {
    ...EMPTY_FACTS,
    totalSessions: data?.days.reduce((sum, d) => sum + d.sessions, 0) ?? 0,
    totalMinutes: (data?.days.reduce((sum, d) => sum + d.durationSec, 0) ?? 0) / 60,
    currentStreak: trained?.overview.streak.current ?? 0,
    longestStreak: trained?.overview.streak.longest ?? 0,
  };

  return (
    <Screen title={t('Progress')}>
      <SegmentedControl
        label={t('Period')}
        options={ranges()}
        value={String(range) as '7' | '30'}
        onChange={(v) => setRange(Number(v) as ProgressRange)}
      />

      {data === undefined || view === undefined ? null : !hasAnyData ? (
        <Card padded={false} className="mt-4">
          <EmptyState
            icon="chart"
            title={t('No training recorded yet')}
            description={t('Finish a session and your time, consistency and trends appear here.')}
          />
        </Card>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatTile
              label={t('Time trained')}
              value={formatMinutes(view.stats.totalMinutes)}
              icon="clock"
              hint={trendText(view.minutesTrend)}
            />
            <StatTile label={t('Sessions')} value={String(view.stats.sessions)} icon="activity" />
            <StatTile
              label={t('Active days')}
              value={`${view.stats.activeDays}/${view.stats.length}`}
              icon="flame"
              iconColor="var(--warning)"
              hint={t('Consistency {percent}%', {
                percent: Math.round(view.stats.consistency * 100),
              })}
            />
            <StatTile
              label={t('Average / active day')}
              value={formatMinutes(view.stats.averageMinutesPerActiveDay)}
              icon="target"
            />
          </div>

          <Section title={t('Daily minutes')}>
            <div className="p-4">
              <BarChart
                data={bars}
                formatValue={(v) => formatMinutes(v)}
                labelEvery={range === 7 ? 1 : 5}
                summary={t(
                  '{time} over the last {range} days, trained on {active} of {total} days.',
                  {
                    time: formatMinutes(view.stats.totalMinutes),
                    range,
                    active: view.stats.activeDays,
                    total: view.stats.length,
                  },
                )}
              />
            </div>
          </Section>

          <Section title={t('Where the time went')}>
            <div className="p-4">
              {slices.length === 0 ? (
                <p className="type-subhead text-muted">{t('No sessions in this period.')}</p>
              ) : (
                <DonutChart
                  slices={slices}
                  label={t('Time by skill')}
                  centerLabel={formatMinutes(view.stats.totalMinutes)}
                  formatValue={formatMinutes}
                />
              )}
            </div>
          </Section>
        </>
      )}

      <Section
        title={t('Achievements')}
        footer={t(
          'Achievements unlock from your real activity. Some need modules that are not built yet.',
        )}
      >
        {ACHIEVEMENTS.map((a) => {
          const unlockedAt = unlocked?.get(a.id);
          const { current, target } = a.progress(facts);
          return (
            <div key={a.id} className="flex items-start gap-3 px-4 py-3">
              <span
                aria-hidden="true"
                className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${unlockedAt ? 'bg-success text-on-accent' : 'bg-border text-muted'}`}
              >
                <Icon name={unlockedAt ? 'check' : (a.icon as IconName)} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words type-body">{t(a.title)}</p>
                <p className="type-subhead text-muted">
                  {unlockedAt
                    ? t('Unlocked {date}', {
                        date: formatDateTime(unlockedAt, intlLocale()),
                      })
                    : a.needsModule
                      ? t('Needs the {module} module', { module: t(a.needsModule) })
                      : t(a.description)}
                </p>
                {!unlockedAt && !a.needsModule && (
                  <div className="mt-2">
                    <ProgressBar
                      value={current / target}
                      label={t('{title} progress', { title: t(a.title) })}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </Section>

      <Section title={t('History')}>
        {recent === undefined || recent.length === 0 ? (
          <EmptyState
            icon="clock"
            title={t('No history yet')}
            description={t('Finished sessions are listed here, newest first.')}
          />
        ) : (
          <SessionList sessions={recent} skillNames={skillNames} today={today} deletable />
        )}
      </Section>
    </Screen>
  );
}
