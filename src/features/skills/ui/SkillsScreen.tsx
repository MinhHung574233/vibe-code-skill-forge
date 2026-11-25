import { useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { Skeleton } from '@/components/Skeleton';
import { formatMinutes } from '@/core/training/analytics';
import { useOverview, useSkillRepository, useSkills } from '@/features/training/ui/useTraining';
import { CATEGORY_LABELS, PRIORITY_LABELS, type Skill } from '../domain/skill';
import { SkillFormSheet } from './SkillFormSheet';

export function SkillsScreen() {
  const [showArchived, setShowArchived] = useState(false);
  const skills = useSkills(showArchived);
  const trained = useOverview();
  const repository = useSkillRepository();
  const [formOpen, setFormOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addSuggested = async () => {
    setAdding(true);
    setError(null);
    const result = await repository.addSuggested();
    setAdding(false);
    if (!result.ok) setError(result.error.message);
  };

  return (
    <Screen
      title="Skills"
      trailing={
        <Button size="sm" onClick={() => setFormOpen(true)}>
          <Icon name="plus" size={18} />
          Add
        </Button>
      }
    >
      {skills === undefined ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : skills.length === 0 && !showArchived ? (
        <Card padded={false}>
          <EmptyState
            icon="star"
            title="No skills yet"
            description="A skill is something you practise. Track time and goals for each one."
            action={
              <div className="flex flex-col gap-2">
                <Button loading={adding} onClick={() => void addSuggested()}>
                  Add the 7 suggested skills
                </Button>
                <Button variant="secondary" onClick={() => setFormOpen(true)}>
                  Create my own
                </Button>
              </div>
            }
          />
          {error && (
            <p role="alert" className="px-4 pb-4 text-center type-subhead text-danger">
              {error}
            </p>
          )}
        </Card>
      ) : (
        <>
          <ul className="space-y-3">
            {skills.map((skill) => (
              <li key={skill.id}>
                <SkillCard
                  skill={skill}
                  minutesThisWeek={trained?.overview.minutesBySkillThisWeek.get(skill.id) ?? 0}
                />
              </li>
            ))}
          </ul>
          {skills.length === 0 && (
            <p className="py-6 text-center type-subhead text-muted">No archived skills.</p>
          )}
          <div className="mt-4 flex justify-center">
            <Chip selected={showArchived} onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? 'Hide archived' : 'Show archived'}
            </Chip>
          </div>
        </>
      )}

      <SkillFormSheet open={formOpen} onClose={() => setFormOpen(false)} />
    </Screen>
  );
}

function SkillCard({ skill, minutesThisWeek }: { skill: Skill; minutesThisWeek: number }) {
  const goal = skill.weeklyGoalMinutes;
  return (
    <Link
      to={`/skills/${skill.id}`}
      className="block rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-card)] active:bg-accent-soft"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words type-headline">{skill.name}</p>
          <p className="type-subhead text-muted">
            {CATEGORY_LABELS[skill.category]} · {PRIORITY_LABELS[skill.priority]} priority
          </p>
        </div>
        {skill.isArchived ? (
          <Badge>Archived</Badge>
        ) : (
          <Icon name="chevronRight" size={18} className="mt-1 text-muted" />
        )}
      </div>
      <div className="mt-3">
        {goal ? (
          <>
            <ProgressBar value={minutesThisWeek / goal} label={`${skill.name} weekly goal`} />
            <p className="mt-1.5 type-footnote text-muted">
              {formatMinutes(minutesThisWeek)} of {formatMinutes(goal)} this week
            </p>
          </>
        ) : (
          <p className="type-footnote text-muted">
            {formatMinutes(minutesThisWeek)} this week · no weekly goal
          </p>
        )}
      </div>
    </Link>
  );
}
