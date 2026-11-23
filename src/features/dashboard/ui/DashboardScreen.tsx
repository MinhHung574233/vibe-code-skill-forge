import { Link } from 'react-router';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { Skeleton } from '@/components/Skeleton';
import { useNow } from '@/hooks/useNow';
import { useDashboardData } from './useDashboardData';

const LINK_BUTTON =
  'inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 type-headline transition-[transform,opacity] duration-100 active:scale-[0.98] active:opacity-80';

function formatToday(now: number): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(now));
}

/**
 * Home. Above the fold: today's goal and the next action (DESIGN_SYSTEM §9). Everything shown
 * is real; sections whose data does not exist yet say so plainly and point at what exists.
 */
export function DashboardScreen() {
  const now = useNow();
  const { dailyGoalMinutes, todayMinutes, skillCount } = useDashboardData();
  const goal = dailyGoalMinutes;
  const progress = goal ? todayMinutes / goal : 0;

  return (
    <Screen title="Home">
      <p className="-mt-1 mb-4 px-1 type-subhead text-muted">{formatToday(now)}</p>

      <Card aria-labelledby="today-heading" role="region">
        <div className="flex items-center gap-4">
          {goal === undefined ? (
            <Skeleton className="size-24 rounded-full" />
          ) : (
            <ProgressRing value={progress} label="Daily training goal">
              <span className="type-headline tabular-nums">
                {todayMinutes}/{goal}
              </span>
            </ProgressRing>
          )}
          <div className="min-w-0 flex-1">
            <h2 id="today-heading" className="type-title-2">
              Today
            </h2>
            <p className="mt-0.5 type-subhead text-muted">
              {goal === undefined
                ? 'Loading your goal…'
                : todayMinutes === 0
                  ? `No training recorded yet. Your goal is ${goal} min a day.`
                  : `${todayMinutes} of ${goal} min done.`}
            </p>
          </div>
        </div>
        <Link to="/practice" className={`${LINK_BUTTON} mt-4 w-full bg-accent text-on-accent`}>
          Browse practice
        </Link>
      </Card>

      <Section title="Next up">
        <EmptyState
          icon="target"
          title="Nothing recommended yet"
          description="Suggestions appear once you have trained. Practice is where sessions start."
          action={
            <Link to="/practice" className={`${LINK_BUTTON} bg-accent-soft text-accent`}>
              Open Practice
            </Link>
          }
        />
      </Section>

      <Section title="Your skills">
        {skillCount === undefined ? (
          <div className="space-y-2 p-4" aria-busy="true">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : skillCount === 0 ? (
          <EmptyState
            icon="star"
            title="No skills yet"
            description="Skills you track will appear here with their progress."
          />
        ) : (
          <div className="p-4 type-body">
            {skillCount} {skillCount === 1 ? 'skill' : 'skills'} tracked
          </div>
        )}
      </Section>

      <Section title="Recent activity">
        <EmptyState
          icon="clock"
          title="No activity yet"
          description="Finished sessions show up here, newest first."
        />
      </Section>
    </Screen>
  );
}
