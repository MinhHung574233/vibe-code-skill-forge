import { useState } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ACTIVITY_LABELS, isActivityType } from '@/core/training/config';
import { formatMinutes } from '@/core/training/analytics';
import { formatDayLabel } from '@/utils/format';
import type { SessionRecord } from '../domain/overview';
import { useTrainingEngine } from './useTraining';

interface SessionListProps {
  sessions: readonly SessionRecord[];
  /** Skill id -> name. Sessions of deleted skills fall back to the activity name. */
  skillNames: ReadonlyMap<string, string>;
  today: string;
  /** Let practice sessions be deleted (with a confirmation). Module activities never can. */
  deletable?: boolean;
}

/** A plain list of finished sessions, newest first as given. Used on Home, Progress, skill pages. */
export function SessionList({ sessions, skillNames, today, deletable = false }: SessionListProps) {
  const engine = useTrainingEngine();
  const [pending, setPending] = useState<SessionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (!pending) return;
    const id = pending.id;
    setPending(null);
    const result = await engine.deleteSession(id);
    setError(result.ok ? null : result.error.message);
  };

  return (
    <>
      {error && (
        <p role="alert" className="px-4 py-2 type-subhead text-danger">
          {error}
        </p>
      )}
      <ul className="divide-y divide-border">
        {sessions.map((s) => {
          const title =
            (s.skillId ? skillNames.get(s.skillId) : undefined) ??
            (isActivityType(s.activityType) ? ACTIVITY_LABELS[s.activityType] : s.activityType);
          return (
            <li key={s.id} className="flex items-start gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="break-words type-body">{title}</p>
                <p className="type-subhead text-muted">
                  {formatDayLabel(s.localDate, today)} · {formatMinutes(s.durationSec / 60)}
                </p>
                {s.notes && (
                  <p className="mt-1 line-clamp-2 break-words type-footnote text-muted">
                    {s.notes}
                  </p>
                )}
              </div>
              {s.source === 'manual' && <Badge>Logged</Badge>}
              {deletable && s.activityType === 'practice_session' && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Delete ${title} session from ${formatDayLabel(s.localDate, today)}`}
                  onClick={() => setPending(s)}
                >
                  Delete
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={pending !== null}
        title="Delete this session?"
        message="Its time, XP and streak credit are removed. Achievements you already unlocked stay."
        confirmLabel="Delete"
        destructive
        onCancel={() => setPending(null)}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
