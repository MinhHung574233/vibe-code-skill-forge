import { Link } from 'react-router';
import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { formatMinutes } from '@/core/training/analytics';
import { MODULES } from '@/features/registry';
import type { Skill } from '@/features/skills/domain/skill';
import { t } from '@/i18n/core';

interface SkillGridProps {
  skills: readonly Skill[];
  minutesBySkill: ReadonlyMap<string, number>;
}

const TILE =
  'flex min-h-[112px] flex-col rounded-2xl border border-border bg-surface p-3 text-left';
const LINK_ROW =
  'inline-flex min-h-[44px] items-center gap-1 px-1 type-footnote font-medium text-accent';

/**
 * Home's skill picker: one tap on a tile starts a timer for that skill (no trip to another tab).
 * Skills made from a module also get a quick "Open" link to that module's screen.
 */
export function SkillGrid({ skills, minutesBySkill }: SkillGridProps) {
  return (
    <ul className="grid grid-cols-2 gap-3" aria-label={t('Your skills')}>
      {skills.map((skill) => {
        const minutes = minutesBySkill.get(skill.id) ?? 0;
        const moduleRoute = MODULES.find((m) => m.id === skill.moduleId)?.route;
        return (
          <li key={skill.id} className={TILE}>
            <Link
              to={`/practice/session?skill=${skill.id}&autostart=1`}
              className="flex min-w-0 flex-1 flex-col rounded-xl active:opacity-70"
            >
              <span className="min-w-0 break-words type-headline">{skill.name}</span>
              <span className="mt-1 type-footnote tabular-nums text-muted">
                {skill.weeklyGoalMinutes
                  ? t('{done} / {goal} this week', {
                      done: formatMinutes(minutes),
                      goal: formatMinutes(skill.weeklyGoalMinutes),
                    })
                  : t('{done} this week', { done: formatMinutes(minutes) })}
              </span>
              {skill.weeklyGoalMinutes ? (
                <span className="mt-2 block">
                  <ProgressBar
                    value={minutes / skill.weeklyGoalMinutes}
                    label={t('{name} weekly goal', { name: skill.name })}
                  />
                </span>
              ) : null}
              <span className="mt-auto inline-flex items-center gap-1 pt-2 type-subhead font-medium text-accent">
                <Icon name="clock" size={16} />
                {t('Start timer')}
              </span>
            </Link>
            <Link to={moduleRoute ?? `/skills/${skill.id}`} className={LINK_ROW}>
              {moduleRoute ? t('Open module') : t('Details')}
            </Link>
          </li>
        );
      })}
      <li className={`${TILE} items-center justify-center border-dashed`}>
        <Link
          to="/skills"
          className="inline-flex min-h-[44px] flex-col items-center justify-center gap-1 type-subhead font-medium text-accent"
        >
          <Icon name="plus" size={20} />
          {t('Add or edit skills')}
        </Link>
      </li>
    </ul>
  );
}
