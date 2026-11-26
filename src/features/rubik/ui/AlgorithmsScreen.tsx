import { useMemo, useState } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { t } from '@/i18n/core';
import { SegmentedControl } from '@/components/SegmentedControl';
import {
  algorithmsInSet,
  caseDiagram,
  type AlgorithmDef,
  type AlgorithmSet,
} from '../domain/algorithms';
import { CaseView } from './cubeDrawing';
import { useAlgorithmProgress, useRubikService } from './useRubik';

const SETS = [
  { value: 'pll', label: 'PLL' },
  { value: 'oll', label: '2-look OLL' },
] as const;

/** English keys; translated where shown. */
const STATUS_LABEL = { learning: 'Learning', learned: 'Learned' } as const;

function AlgorithmCard({ alg }: { alg: AlgorithmDef }) {
  const service = useRubikService();
  const progress = useAlgorithmProgress();
  const status = progress?.get(alg.id);
  const diagram = useMemo(() => caseDiagram(alg.moves), [alg.moves]);

  return (
    <Card className="mt-3">
      <div className="flex gap-3">
        <CaseView diagram={diagram} label={t('Case picture for {name}', { name: t(alg.name) })} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="type-headline">{t(alg.name)}</h3>
            {status && <Badge>{t(STATUS_LABEL[status])}</Badge>}
          </div>
          <p
            className="mt-1 break-words font-mono type-callout"
            aria-label={t('Moves for {name}', { name: t(alg.name) })}
          >
            {alg.moves}
          </p>
        </div>
      </div>
      <p className="mt-3 type-subhead text-muted">{t(alg.recognise)}</p>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant={status === 'learning' ? 'primary' : 'secondary'}
          aria-pressed={status === 'learning'}
          onClick={() =>
            void service.setAlgorithmStatus(alg.id, status === 'learning' ? null : 'learning')
          }
        >
          {t('Learning')}
        </Button>
        <Button
          size="sm"
          variant={status === 'learned' ? 'primary' : 'secondary'}
          aria-pressed={status === 'learned'}
          onClick={() =>
            void service.setAlgorithmStatus(alg.id, status === 'learned' ? null : 'learned')
          }
        >
          {t('Learned')}
        </Button>
      </div>
    </Card>
  );
}

export function AlgorithmsScreen() {
  const [set, setSet] = useState<AlgorithmSet>('pll');
  const progress = useAlgorithmProgress();
  const list = algorithmsInSet(set);
  const learned = list.filter((a) => progress?.get(a.id) === 'learned').length;

  return (
    <Screen title={t('Algorithms')} back={{ to: '/practice/rubik', label: t('Rubik') }}>
      <SegmentedControl
        options={SETS.map((o) => ({ value: o.value, label: t(o.label) }))}
        value={set}
        onChange={setSet}
        label={t('Algorithm set')}
      />
      <p className="mt-3 px-1 type-subhead text-muted">
        {t(
          '{learned} of {total} learned. Notation is for a yellow-top cube with green in front. The pictures show the case each algorithm solves.',
          { learned, total: list.length },
        )}
      </p>
      {list.map((alg) => (
        <AlgorithmCard key={alg.id} alg={alg} />
      ))}
    </Screen>
  );
}
