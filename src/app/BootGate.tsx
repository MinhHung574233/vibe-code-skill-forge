import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/Button';
import { ErrorState } from '@/components/ErrorState';
import type { BootOutcome } from '@/db/boot';
import { acceptEmptyDatabase, resetAllData, restoreLatestSnapshot } from '@/db/recovery';
import { bootApp, type BootHooks } from './bootApp';
import { RecoveryScreen } from './RecoveryScreen';

interface BootGateProps {
  children: ReactNode;
  /** Injectable for tests. */
  boot?: (hooks: BootHooks) => Promise<BootOutcome>;
}

type Phase =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'recovery'; outcome: Extract<BootOutcome, { status: 'recovery' }> }
  | { kind: 'reload-required' };

/**
 * Renders the app only after the database is open and healthy. Otherwise shows a loading
 * state, or a recovery screen with safe actions. Also handles "another tab/update needs the
 * database" by asking the user to reload.
 */
export function BootGate({ children, boot = bootApp }: BootGateProps) {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
  // Held in a ref so React StrictMode's double effect run does not open the database twice.
  const bootPromise = useRef<Promise<BootOutcome> | null>(null);

  const start = useCallback(() => {
    setPhase({ kind: 'loading' });
    bootPromise.current = boot({ onVersionChange: () => setPhase({ kind: 'reload-required' }) });
    bootPromise.current
      .then((outcome) =>
        setPhase(outcome.status === 'ready' ? { kind: 'ready' } : { kind: 'recovery', outcome }),
      )
      .catch(() =>
        setPhase({
          kind: 'recovery',
          outcome: {
            status: 'recovery',
            reason: 'open-failed',
            message: 'The app could not start.',
            hasSnapshot: false,
          },
        }),
      );
  }, [boot]);

  useEffect(() => {
    if (bootPromise.current === null) start();
  }, [start]);

  if (phase.kind === 'loading') {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Loading SkillForge"
        className="fixed inset-0 flex items-center justify-center bg-bg"
      >
        <span
          aria-hidden="true"
          className="size-8 animate-spin rounded-full border-[3px] border-accent border-t-transparent"
        />
      </div>
    );
  }

  if (phase.kind === 'reload-required') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg">
        <ErrorState
          title="Reload to finish updating"
          message="SkillForge was updated in another window. Reload to continue; your data is safe."
        />
        <div className="absolute inset-x-0 bottom-16 flex justify-center">
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      </div>
    );
  }

  if (phase.kind === 'recovery') {
    const { outcome } = phase;
    return (
      <RecoveryScreen
        reason={outcome.reason}
        message={outcome.message}
        hasSnapshot={outcome.hasSnapshot}
        onRetry={start}
        onImported={start}
        onRestoreSnapshot={async () => {
          await restoreLatestSnapshot();
          start();
        }}
        onAcceptEmpty={() => {
          acceptEmptyDatabase();
          start();
        }}
        onResetAll={async () => {
          await resetAllData();
          start();
        }}
      />
    );
  }

  return <>{children}</>;
}
