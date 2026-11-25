import { useState } from 'react';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { toLocalDate } from '@/core/time/localDate';
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
    <Screen title="Solve history" back={{ to: '/practice/rubik', label: 'Rubik' }}>
      {solves === undefined ? null : newestFirst.length === 0 ? (
        <EmptyState
          icon="cube"
          title="No solves yet"
          description="Time your first solve and it will show up here."
        />
      ) : (
        <Section footer="Newest first. +2 and DNF apply to averages as in competition rules.">
          {newestFirst.map((solve) => (
            <div key={solve.id} className="flex min-h-[56px] items-center gap-3 px-4 py-2">
              <div className="min-w-0 flex-1">
                <p className="type-headline tabular-nums">{formatSolve(solve)}</p>
                <p className="truncate type-footnote text-muted">
                  {formatDayLabel(solve.localDate, today)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Delete solve ${formatSolve(solve)} from ${solve.localDate}`}
                onClick={() => setPending(solve.id)}
              >
                Delete
              </Button>
            </div>
          ))}
        </Section>
      )}
      <ConfirmDialog
        open={pending !== null}
        title="Delete this solve?"
        message="It will be removed from your times and averages."
        confirmLabel="Delete"
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
