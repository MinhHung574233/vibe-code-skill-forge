import { Icon } from '@/components/Icon';
import { Screen } from '@/components/Screen';
import { ListRow, Section } from '@/components/Section';
import { CATEGORY_LABELS, objectiveText } from '../domain/tsumegoTypes';
import { PROBLEMS_BY_DIFFICULTY, TSUMEGO_PROBLEMS } from '../domain/tsumego';
import { useGoContext, usePuzzleProgress } from './hooks';

const LEVEL_TITLES = {
  1: 'Level 1 · First steps',
  2: 'Level 2 · Easy',
  3: 'Level 3 · Medium',
  4: 'Level 4 · Hard',
  5: 'Level 5 · Expert',
} as const;

export function TsumegoListScreen() {
  const { base } = useGoContext();
  const progress = usePuzzleProgress();
  const solvedCount = progress ? [...progress.values()].filter((p) => p.solved === 1).length : 0;

  return (
    <Screen title="Tsumego" back={{ to: base, label: 'Go' }}>
      <p className="type-subhead text-muted">
        Life-and-death problems. {solvedCount} of {TSUMEGO_PROBLEMS.length} solved. Every answer is
        checked by a search of the diagram, not just stored.
      </p>
      {PROBLEMS_BY_DIFFICULTY.map(({ difficulty, problems }) => (
        <Section key={difficulty} title={LEVEL_TITLES[difficulty]}>
          {problems.map((problem) => {
            const solved = progress?.get(problem.id)?.solved === 1;
            return (
              <ListRow
                key={problem.id}
                title={problem.title}
                subtitle={`${objectiveText(problem)} · ${CATEGORY_LABELS[problem.category]}`}
                to={`${base}/tsumego/${problem.id}`}
                accessory={
                  <span className="flex items-center gap-1 text-muted">
                    {solved && (
                      <Icon name="check" size={20} className="text-success" label="Solved" />
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
