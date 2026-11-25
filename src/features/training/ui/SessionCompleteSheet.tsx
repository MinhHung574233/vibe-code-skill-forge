import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { achievementById } from '@/core/training/achievements';
import type { CompletionOutcome } from '../domain/session';

interface SessionCompleteSheetProps {
  /** `null` = closed. */
  outcome: CompletionOutcome | null;
  onClose: () => void;
}

/** What a recorded session earned, said plainly (including why there is no XP when there is none). */
export function SessionCompleteSheet({ outcome, onClose }: SessionCompleteSheetProps) {
  const achievements = (outcome?.newAchievementIds ?? []).flatMap((id) => {
    const def = achievementById(id);
    return def ? [def] : [];
  });

  return (
    <Sheet
      open={outcome !== null}
      onClose={onClose}
      title={outcome?.duplicate ? 'Already saved' : 'Session saved'}
    >
      {outcome && (
        <div className="space-y-4">
          {outcome.duplicate ? (
            <p className="type-body text-muted">
              This session was already recorded. Nothing changed.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-2xl bg-accent-soft p-4">
                <Icon name="bolt" size={28} className="text-accent" />
                <div>
                  <p className="type-title-2 tabular-nums">
                    {outcome.xpAwarded > 0 ? `+${outcome.xpAwarded} XP` : 'No XP this time'}
                  </p>
                  {outcome.noXpReason && (
                    <p className="type-subhead text-muted">{outcome.noXpReason}</p>
                  )}
                </div>
              </div>

              {outcome.leveledUp && (
                <p role="status" className="type-headline">
                  Level up! You are now level {outcome.levelAfter}.
                </p>
              )}

              {outcome.streak.current > 0 && (
                <p className="flex items-center gap-2 type-body">
                  <Icon name="flame" size={20} className="text-warning" />
                  {outcome.streak.current}-day streak
                </p>
              )}

              {achievements.length > 0 && (
                <div>
                  <p className="mb-2 type-subhead font-medium text-muted">Unlocked</p>
                  <ul className="space-y-2">
                    {achievements.map((a) => (
                      <li key={a.id} className="rounded-xl border border-border p-3">
                        <p className="type-headline">{a.title}</p>
                        <p className="type-subhead text-muted">{a.description}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
          <Button fullWidth onClick={onClose}>
            Done
          </Button>
        </div>
      )}
    </Sheet>
  );
}
