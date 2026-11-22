import { useState } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Icon } from '@/components/Icon';
import { BackupImport } from '@/features/settings/ui/BackupImport';
import type { RecoveryReason } from '@/db/boot';

interface RecoveryScreenProps {
  reason: RecoveryReason;
  message: string;
  hasSnapshot: boolean;
  /** Re-run the boot sequence. */
  onRetry: () => void;
  /** Replace data with the last pre-update snapshot, then re-boot. */
  onRestoreSnapshot: () => Promise<void>;
  /** After a suspected loss: continue with an empty database. */
  onAcceptEmpty: () => void;
  /** Erase everything and start fresh. */
  onResetAll: () => Promise<void>;
  /** A backup file was restored; re-run boot. */
  onImported: () => void;
}

const TITLES: Record<RecoveryReason, string> = {
  unavailable: 'Storage is unavailable',
  'open-failed': 'Your data could not be opened',
  'migration-failed': 'The update could not finish',
  'schema-too-new': 'This app version is out of date',
  'data-loss-suspected': 'Your data appears to be missing',
};

/**
 * Never a white screen: when the database cannot be used, explain what happened and offer only
 * the actions that make sense for that reason. Destructive actions need confirmation.
 */
export function RecoveryScreen({
  reason,
  message,
  hasSnapshot,
  onRetry,
  onRestoreSnapshot,
  onAcceptEmpty,
  onResetAll,
  onImported,
}: RecoveryScreenProps) {
  const [busy, setBusy] = useState<'restore' | 'reset' | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const run = async (kind: 'restore' | 'reset', action: () => Promise<void>) => {
    setBusy(kind);
    setFailure(null);
    try {
      await action();
    } catch {
      setFailure('That did not work. Your data has not been changed further.');
      setBusy(null);
    }
  };

  const canRetry = reason !== 'unavailable' && reason !== 'data-loss-suspected';
  const canResetData = reason !== 'unavailable' && reason !== 'schema-too-new';
  const canImport = canResetData;

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-4 px-4 py-10">
      <div role="alert" className="text-center">
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-border bg-surface text-danger">
          <Icon name="alert" size={28} />
        </span>
        <h1 className="type-title-1">{TITLES[reason]}</h1>
        <p className="mt-2 type-body text-muted">{message}</p>
      </div>

      {reason === 'data-loss-suspected' && (
        <Card>
          <p className="type-subhead text-muted">
            Nothing has been deleted by this app. If you saved a backup file, keep it safe; it is
            the only guaranteed way to bring this data back.
          </p>
        </Card>
      )}
      {reason === 'schema-too-new' && (
        <Card>
          <p className="type-subhead text-muted">
            Close the app completely and open it again while online so the latest version can load.
            Your data has not been changed.
          </p>
        </Card>
      )}
      {failure && (
        <p role="status" className="text-center type-subhead text-danger">
          {failure}
        </p>
      )}

      <div className="flex flex-col gap-2">
        {canRetry && <Button onClick={onRetry}>Try again</Button>}
        {hasSnapshot && (
          <Button
            variant={canRetry ? 'secondary' : 'primary'}
            loading={busy === 'restore'}
            disabled={busy !== null}
            onClick={() => void run('restore', onRestoreSnapshot)}
          >
            Restore the copy saved before the last update
          </Button>
        )}
        {reason === 'data-loss-suspected' && (
          <Button variant="secondary" onClick={onAcceptEmpty}>
            Continue with empty data
          </Button>
        )}
        {canImport && (
          <BackupImport
            onImported={onImported}
            variant={hasSnapshot || canRetry ? 'secondary' : 'primary'}
            label="Restore from a backup file"
          />
        )}
        {reason === 'schema-too-new' && <Button onClick={onRetry}>Check again</Button>}
        {canResetData && (
          <Button variant="ghost" disabled={busy !== null} onClick={() => setConfirmReset(true)}>
            Erase local data and start over
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Erase all local data?"
        message="Everything stored on this device by SkillForge will be deleted, including the saved copy. This cannot be undone."
        confirmLabel="Erase everything"
        destructive
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          void run('reset', onResetAll);
        }}
      />
    </main>
  );
}
