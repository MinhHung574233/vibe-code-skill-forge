import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { StatTile } from '@/components/StatTile';
import { formatMinutes } from '@/core/training/analytics';
import { t } from '@/i18n/core';
import { SessionList } from '@/features/training/ui/SessionList';
import {
  useOverview,
  useSkill,
  useSkillRepository,
  useSkillSessions,
} from '@/features/training/ui/useTraining';
import { CATEGORY_LABELS, priorityText } from '../domain/skill';
import { SkillFormSheet } from './SkillFormSheet';

const LINK_BUTTON =
  'inline-flex min-h-[50px] w-full items-center justify-center rounded-xl bg-accent px-5 type-headline text-on-accent active:scale-[0.98] active:opacity-80';

export function SkillDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const skill = useSkill(id);
  const sessions = useSkillSessions(id);
  const trained = useOverview();
  const repository = useSkillRepository();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (skill === undefined)
    return <Screen title={t('Skill')} back={{ to: '/skills', label: t('Skills') }} />;
  if (skill === null) {
    return (
      <Screen title={t('Skill')} back={{ to: '/skills', label: t('Skills') }}>
        <EmptyState
          icon="alert"
          title={t('Skill not found')}
          description={t('It may have been deleted.')}
        />
      </Screen>
    );
  }

  const week = trained?.overview.minutesBySkillThisWeek.get(skill.id) ?? 0;
  const totalMinutes = (sessions ?? []).reduce((sum, s) => sum + s.durationSec / 60, 0);
  const goal = skill.weeklyGoalMinutes;

  const run = async (
    action: () => Promise<{ ok: boolean; error?: { message: string } }>,
    after?: () => void,
  ) => {
    setError(null);
    const result = await action();
    if (!result.ok) setError(result.error?.message ?? t('That did not work.'));
    else after?.();
  };

  return (
    <Screen title={skill.name} back={{ to: '/skills', label: t('Skills') }}>
      <div className="mb-4 flex flex-wrap gap-2">
        <Badge>{t(CATEGORY_LABELS[skill.category])}</Badge>
        <Badge>{priorityText(skill.priority)}</Badge>
        {skill.isArchived && <Badge tone="warning">{t('Archived')}</Badge>}
      </div>
      {skill.description && (
        <p className="mb-4 break-words type-body text-muted">{skill.description}</p>
      )}

      <Card>
        <p className="type-footnote text-muted">{t('This week')}</p>
        <p className="type-title-1 tabular-nums">{formatMinutes(week)}</p>
        {goal ? (
          <>
            <div className="mt-2">
              <ProgressBar
                value={week / goal}
                label={t('{name} weekly goal', { name: skill.name })}
              />
            </div>
            <p className="mt-1.5 type-footnote text-muted">
              {t('Goal {goal} a week', { goal: formatMinutes(goal) })}
            </p>
          </>
        ) : (
          <p className="mt-1 type-footnote text-muted">{t('No weekly goal. Add one with Edit.')}</p>
        )}
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <StatTile label={t('Sessions')} value={String(sessions?.length ?? 0)} icon="activity" />
        <StatTile label={t('Total time')} value={formatMinutes(totalMinutes)} icon="clock" />
      </div>

      <div className="mt-4">
        <Link to={`/practice/session?skill=${skill.id}`} className={LINK_BUTTON}>
          {t('Start a session')}
        </Link>
      </div>

      <Section title={t('Sessions')}>
        {sessions === undefined || sessions.length === 0 ? (
          <EmptyState
            icon="clock"
            title={t('No sessions yet')}
            description={t('Start a session for this skill to see your time here.')}
          />
        ) : (
          <SessionList
            sessions={sessions.slice(0, 20)}
            skillNames={new Map([[skill.id, skill.name]])}
            today={trained?.overview.today ?? ''}
            deletable
          />
        )}
      </Section>

      <Section title={t('Manage')}>
        <div className="flex flex-col gap-2 p-3">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            {t('Edit')}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void run(() => repository.setArchived(skill.id, !skill.isArchived))}
          >
            {skill.isArchived ? t('Unarchive') : t('Archive')}
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            {t('Delete skill')}
          </Button>
          {error && (
            <p role="alert" className="type-subhead text-danger">
              {error}
            </p>
          )}
        </div>
      </Section>

      <SkillFormSheet open={editOpen} onClose={() => setEditOpen(false)} skill={skill} />
      <ConfirmDialog
        open={deleteOpen}
        title={t('Delete “{name}”?', { name: skill.name })}
        message={t(
          'The skill is removed. Sessions you already recorded are kept in your totals and history.',
        )}
        confirmLabel={t('Delete skill')}
        destructive
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          setDeleteOpen(false);
          void run(
            () => repository.remove(skill.id),
            () => void navigate('/skills', { replace: true }),
          );
        }}
      />
    </Screen>
  );
}
