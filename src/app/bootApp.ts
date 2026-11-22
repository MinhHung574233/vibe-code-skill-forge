import { bootDatabase, type BootOutcome } from '@/db/boot';
import { useStorageHealthStore } from '@/pwa/storageHealthStore';

export interface BootHooks {
  /** Another tab/instance needs the database (e.g. an update): this one must reload. */
  onVersionChange: () => void;
}

/** Full app boot: database (migrations, snapshot, loss check) then storage-health report. */
export async function bootApp(hooks: BootHooks): Promise<BootOutcome> {
  const outcome = await bootDatabase({ onVersionChange: hooks.onVersionChange });
  if (outcome.status === 'ready') {
    // Informational and best-effort: must never block or fail startup.
    void useStorageHealthStore
      .getState()
      .refresh()
      .catch(() => undefined);
  }
  return outcome;
}
