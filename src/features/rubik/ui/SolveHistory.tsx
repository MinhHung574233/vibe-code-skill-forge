import { useState } from 'react';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { toLocalDate } from '@/core/time/localDate';
import { getLanguage, intlLocale, t } from '@/i18n/core';
import { formatDayLabel } from '@/utils/format';
import { formatSolve } from '../domain/stats';
import { useNow } from '@/hooks/useNow';
import { useRubikService, useSolves } from './useRubik';

/** Every solve, newest first, with a way to correct or remove one. */
export function SolveHistory() {
  const service = useRubikService();
  const solves = useSolves();
  const today = toLocalDate(useNow());
  const [pending, setPending] = useState<string | null>(null);
  const newestFirst = [...(solves ?? [])].reverse();

  return (
    <Screen title={t('Solve history')} back={{ to: '/practice/rubik', label: t('Rubik') }}>
      {solves === undefined ? null : newestFirst.length === 0 ? (
        <EmptyState
          icon="cube"
          title={t('No solves yet')}
          description={t('Time your first solve and it will show up here.')}
        />
      ) : (
        <Section footer={t('Newest first. +2 and DNF apply to averages as in competition rules.')}>
          {newestFirst.map((solve) => (
            <div key={solve.id} className="flex min-h-[56px] items-center gap-3 px-4 py-2">
              <div className="min-w-0 flex-1">
                <p className="type-headline tabular-nums">{formatSolve(solve)}</p>
                <p className="truncate type-footnote text-muted">
                  {formatDayLabel(
                    solve.localDate,
                    today,
                    getLanguage() === 'vi' ? intlLocale() : undefined,
                  )}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label={t('Delete solve {result} from {date}', {
                  result: formatSolve(solve),
                  date: solve.localDate,
                })}
                onClick={() => setPending(solve.id)}
              >
                {t('Delete')}
              </Button>
            </div>
          ))}
        </Section>
      )}
      <ConfirmDialog
        open={pending !== null}
        title={t('Delete this solve?')}
        message={t('It will be removed from your times and averages.')}
        confirmLabel={t('Delete')}
        destructive
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending) void service.deleteSolve(pending);
          setPending(null);
        }}
      />
    </Screen>
  );
}
