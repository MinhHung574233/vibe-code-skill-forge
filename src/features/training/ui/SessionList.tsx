import { Badge } from '@/components/Badge';
import { ACTIVITY_LABELS, isActivityType } from '@/core/training/config';
import { formatMinutes } from '@/core/training/analytics';
import { formatDayLabel } from '@/utils/format';
import type { SessionRecord } from '../domain/overview';

interface SessionListProps {
  sessions: readonly SessionRecord[];
  /** Skill id -> name. Sessions of deleted skills fall back to the activity name. */
  skillNames: ReadonlyMap<string, string>;
  today: string;
}

/** A plain list of finished sessions, newest first as given. Used on Home, Progress, skill pages. */
export function SessionList({ sessions, skillNames, today }: SessionListProps) {
  return (
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
                <p className="mt-1 line-clamp-2 break-words type-footnote text-muted">{s.notes}</p>
              )}
            </div>
            {s.source === 'manual' && <Badge>Logged</Badge>}
          </li>
        );
      })}
    </ul>
  );
}
