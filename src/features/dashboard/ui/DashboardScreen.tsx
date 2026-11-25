import { useMemo } from 'react';
import { Link } from 'react-router';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { ListRow, Section } from '@/components/Section';
import { Skeleton } from '@/components/Skeleton';
import { formatMinutes } from '@/core/training/analytics';
import {
  recommend,
  type Recommendation,
  type RecommendationSkill,
} from '@/core/training/recommend';
import { toLocalDate } from '@/core/time/localDate';
import { tipForDate } from '@/features/tools/domain/tips';
import { useNow } from '@/hooks/useNow';
import { SessionList } from '@/features/training/ui/SessionList';
import { useOverview, useRecentSessions, useSkills } from '@/features/training/ui/useTraining';

const LINK_BUTTON =
  'inline-flex min-h-[50px] w-full items-center justify-center rounded-xl bg-accent px-5 type-headline text-on-accent transition-[transform,opacity] duration-100 active:scale-[0.98] active:opacity-80';

function formatToday(now: number): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(now));
}

function recommendationTarget(r: Recommendation): string {
  if (r.kind === 'create_skill') return '/skills';
  return r.skillId ? `/practice/session?skill=${r.skillId}` : '/practice/session';
}

/**
 * Home. Above the fold: today's goal and the next action (DESIGN_SYSTEM §9). Every number comes
 * from recorded sessions; sections without data say so plainly.
 */
export function DashboardScreen() {
  const now = useNow();
  const dailyTip = tipForDate(toLocalDate(now));
  const trained = useOverview();
  const skills = useSkills();
  const recent = useRecentSessions(5);

  const skillNames = useMemo(() => new Map((skills ?? []).map((s) => [s.id, s.name])), [skills]);

  const recommendations = useMemo(() => {
    if (!trained || !skills) return undefined;
    const { overview } = trained;
    const input: RecommendationSkill[] = skills.map((s) => ({
      id: s.id,
      name: s.name,
      priority: s.priority,
      lastSessionAt: overview.lastSessionAtBySkill.get(s.id) ?? null,
      minutesThisWeek: overview.minutesBySkillThisWeek.get(s.id) ?? 0,
      weeklyGoalMinutes: s.weeklyGoalMinutes,
    }));
    return recommend({
      skills: input,
      todayMinutes: overview.todayMinutes,
      dailyGoalMinutes: overview.goalMinutes,
      streak: overview.streak,
    });
  }, [trained, skills]);

  const overview = trained?.overview;
  const streak = overview?.streak;

  return (
    <Screen title="Home">
      <p className="-mt-1 mb-3 px-1 type-subhead text-muted">{formatToday(now)}</p>

      <div className="mb-3 flex flex-wrap gap-2" aria-label="Your status">
        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 type-subhead font-medium">
          <Icon
            name="flame"
            size={16}
            className={streak?.current ? 'text-warning' : 'text-muted'}
          />
          {streak === undefined
            ? '…'
            : streak.current > 0
              ? `${streak.current}-day streak`
              : 'No streak yet'}
        </span>
        <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 type-subhead font-medium">
          <Icon name="bolt" size={16} className="text-xp" />
          {overview ? `Level ${overview.level.level}` : '…'}
        </span>
      </div>

      <Card aria-labelledby="today-heading" role="region">
        <div className="flex items-center gap-4">
          {overview === undefined ? (
            <Skeleton className="size-24 rounded-full" />
          ) : (
            <ProgressRing value={overview.goalFraction} label="Daily training goal">
              <span className="type-headline tabular-nums">
                {Math.floor(overview.todayMinutes)}/{overview.goalMinutes}
              </span>
            </ProgressRing>
          )}
          <div className="min-w-0 flex-1">
            <h2 id="today-heading" className="type-title-2">
              Today
            </h2>
            <p className="mt-0.5 type-subhead text-muted">
              {overview === undefined
                ? 'Loading…'
                : overview.todayMinutes === 0
                  ? `No training yet. Your goal is ${overview.goalMinutes} min a day.`
                  : overview.todayMinutes >= overview.goalMinutes
                    ? `Goal reached: ${formatMinutes(overview.todayMinutes)} today.`
                    : `${formatMinutes(overview.todayMinutes)} of ${overview.goalMinutes} min.`}
            </p>
            {streak?.atRisk && (
              <p className="mt-1 type-footnote text-warning">Train today to keep your streak.</p>
            )}
          </div>
        </div>
        <Link to="/practice/session" className={`${LINK_BUTTON} mt-4`}>
          Start a session
        </Link>
      </Card>

      {overview && (
        <Card className="mt-3">
          <div className="flex items-baseline justify-between">
            <p className="type-headline">Level {overview.level.level}</p>
            <p className="type-footnote tabular-nums text-muted">
              {overview.level.xpForNextLevel > 0
                ? `${overview.level.xpIntoLevel} / ${overview.level.xpForNextLevel} XP`
                : `${overview.level.totalXp} XP`}
            </p>
          </div>
          <div className="mt-2">
            <ProgressBar
              value={overview.level.fraction}
              color="var(--xp)"
              label="Progress to next level"
            />
          </div>
        </Card>
      )}

      <Section title="Next up">
        {recommendations === undefined ? (
          <div className="space-y-2 p-4" aria-busy="true">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : recommendations.length === 0 ? (
          <EmptyState
            icon="check"
            title="You are on track"
            description="Nothing needs your attention right now."
          />
        ) : (
          recommendations.map((r) => (
            <Link
              key={`${r.kind}-${r.skillId ?? ''}`}
              to={recommendationTarget(r)}
              className="flex min-h-[56px] items-center gap-3 px-4 py-3 active:bg-accent-soft"
            >
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-accent text-on-accent"
              >
                <Icon name="target" size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words type-body">{r.title}</span>
                <span className="block break-words type-subhead text-muted">{r.reason}</span>
              </span>
              <Icon name="chevronRight" size={18} className="text-muted" />
            </Link>
          ))
        )}
      </Section>

      <Section title="Developer tip of the day">
        <ListRow
          title={dailyTip.title}
          subtitle={dailyTip.text}
          icon="terminal"
          iconColor="#14b8a6"
          to="/practice/tools"
        />
      </Section>

      <Section title="Your skills">
        {skills === undefined || overview === undefined ? (
          <div className="space-y-2 p-4" aria-busy="true">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : skills.length === 0 ? (
          <EmptyState
            icon="star"
            title="No skills yet"
            description="Add the skills you practise to track time and goals for each."
            action={
              <Link
                to="/skills"
                className="inline-flex min-h-[44px] items-center rounded-xl bg-accent-soft px-4 type-headline text-accent"
              >
                Add skills
              </Link>
            }
          />
        ) : (
          skills.slice(0, 4).map((s) => {
            const minutes = overview.minutesBySkillThisWeek.get(s.id) ?? 0;
            return (
              <Link
                key={s.id}
                to={`/skills/${s.id}`}
                className="block px-4 py-3 active:bg-accent-soft"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 break-words type-body">{s.name}</span>
                  <span className="shrink-0 type-footnote tabular-nums text-muted">
                    {formatMinutes(minutes)}
                    {s.weeklyGoalMinutes ? ` / ${formatMinutes(s.weeklyGoalMinutes)}` : ''} this
                    week
                  </span>
                </div>
                {s.weeklyGoalMinutes ? (
                  <div className="mt-2">
                    <ProgressBar
                      value={minutes / s.weeklyGoalMinutes}
                      label={`${s.name} weekly goal`}
                    />
                  </div>
                ) : null}
              </Link>
            );
          })
        )}
      </Section>

      <Section title="Recent activity">
        {recent === undefined ? (
          <div className="space-y-2 p-4" aria-busy="true">
            <Skeleton className="h-5 w-2/3" />
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon="clock"
            title="No activity yet"
            description="Finished sessions show up here, newest first."
          />
        ) : (
          <SessionList sessions={recent} skillNames={skillNames} today={overview?.today ?? ''} />
        )}
      </Section>
    </Screen>
  );
}
