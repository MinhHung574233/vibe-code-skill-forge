import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { ListRow, Section } from '@/components/Section';
import { t } from '@/i18n/core';
import { categoryLabel, objectiveText } from '../domain/tsumegoTypes';
import { PROBLEMS_BY_DIFFICULTY, TSUMEGO_PROBLEMS } from '../domain/tsumego';
import { useGoContext, usePuzzleProgress } from './hooks';

function levelTitle(difficulty: 1 | 2 | 3 | 4 | 5): string {
  switch (difficulty) {
    case 1:
      return t('Level 1 · First steps');
    case 2:
      return t('Level 2 · Easy');
    case 3:
      return t('Level 3 · Medium');
    case 4:
      return t('Level 4 · Hard');
    case 5:
      return t('Level 5 · Expert');
  }
}

export function TsumegoListScreen() {
  const { base } = useGoContext();
  const progress = usePuzzleProgress();
  const solvedCount = progress ? [...progress.values()].filter((p) => p.solved === 1).length : 0;

  return (
    <Screen title={t('Tsumego')} back={{ to: base, label: t('Go') }}>
      <p className="type-subhead text-muted">
        {t(
          'Life-and-death problems. {solved} of {total} solved. Every answer is checked by a search of the diagram, not just stored.',
          { solved: solvedCount, total: TSUMEGO_PROBLEMS.length },
        )}
      </p>
      {PROBLEMS_BY_DIFFICULTY.map(({ difficulty, problems }) => (
        <Section key={difficulty} title={levelTitle(difficulty)}>
          {problems.map((problem) => {
            const solved = progress?.get(problem.id)?.solved === 1;
            return (
              <ListRow
                key={problem.id}
                title={t(problem.title)}
                subtitle={`${objectiveText(problem)} · ${categoryLabel(problem.category)}`}
                to={`${base}/tsumego/${problem.id}`}
                accessory={
                  <span className="flex items-center gap-1 text-muted">
                    {solved && (
                      <Icon name="check" size={20} className="text-success" label={t('Solved')} />
                    )}
                    <Icon name="chevronRight" size={18} />
                  </span>
                }
              />
            );
          })}
        </Section>
      ))}
    </Screen>
  );
}
