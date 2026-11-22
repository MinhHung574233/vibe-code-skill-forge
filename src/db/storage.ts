/**
 * Storage health (IOS_PWA §1). iOS grants persistence by heuristics and sources conflict on
 * whether `persist()` is honoured for installed apps, so we ask and REPORT the answer, but
 * never rely on it: backups are the real protection.
 */
export interface StorageHealth {
  persistSupported: boolean;
  /** null = unknown/unsupported. */
  persisted: boolean | null;
  usageBytes: number | null;
  quotaBytes: number | null;
  /** Running from the Home Screen icon (not a Safari tab). */
  standalone: boolean;
}

export const UNKNOWN_STORAGE_HEALTH: StorageHealth = {
  persistSupported: false,
  persisted: null,
  usageBytes: null,
  quotaBytes: null,
  standalone: false,
};

export async function readStorageHealth(options: {
  standalone: boolean;
  /** Ask the browser to persist. Only done in standalone mode (docs: every standalone launch). */
  requestPersist: boolean;
  storage?: StorageManager | undefined;
}): Promise<StorageHealth> {
  const storage =
    options.storage ?? (typeof navigator !== 'undefined' ? navigator.storage : undefined);
  const health: StorageHealth = { ...UNKNOWN_STORAGE_HEALTH, standalone: options.standalone };
  if (!storage) return health;

  try {
    if (typeof storage.persisted === 'function') {
      health.persistSupported = true;
      health.persisted = await storage.persisted();
      if (!health.persisted && options.requestPersist && typeof storage.persist === 'function') {
        health.persisted = await storage.persist();
      }
    }
  } catch {
    health.persisted = null;
  }

  try {
    if (typeof storage.estimate === 'function') {
      const estimate = await storage.estimate();
      health.usageBytes = estimate.usage ?? null;
      health.quotaBytes = estimate.quota ?? null;
    }
  } catch {
    /* estimate is informational only */
  }
  return health;
}
