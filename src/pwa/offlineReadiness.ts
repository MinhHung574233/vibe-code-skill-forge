/**
 * Offline readiness (ARCHITECTURE §4.1). iOS may evict Cache Storage separately from
 * IndexedDB, so "installed" does not guarantee "works offline". The service worker knows the
 * exact list of files it must hold and can say which ones are missing.
 */
export interface PrecacheStatus {
  expected: number;
  missing: string[];
}

export type OfflineReadiness =
  | { state: 'unknown' }
  | { state: 'checking' }
  | { state: 'repairing' }
  /** No service worker (dev server, unsupported browser, or not installed yet). */
  | { state: 'unavailable' }
  | { state: 'ready'; expected: number }
  | { state: 'incomplete'; expected: number; missing: number };

/** Pure mapping from the worker's answer to a UI state. `null` = the worker did not answer. */
export function classifyReadiness(status: PrecacheStatus | null): OfflineReadiness {
  if (!status) return { state: 'unavailable' };
  if (status.missing.length === 0) return { state: 'ready', expected: status.expected };
  return { state: 'incomplete', expected: status.expected, missing: status.missing.length };
}

const REPLY_TIMEOUT_MS = 10_000;

/** Sends a message to the active worker and waits for its reply on a private channel. */
export async function askServiceWorker<T>(message: { type: string }): Promise<T | null> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;
  const registration = await navigator.serviceWorker.getRegistration();
  const target = registration?.active;
  if (!target) return null;

  return new Promise<T | null>((resolve) => {
    const channel = new MessageChannel();
    const timer = setTimeout(() => resolve(null), REPLY_TIMEOUT_MS);
    channel.port1.onmessage = (event: MessageEvent<T>) => {
      clearTimeout(timer);
      resolve(event.data);
    };
    target.postMessage(message, [channel.port2]);
  });
}

export function checkOfflineReadiness(): Promise<OfflineReadiness> {
  return askServiceWorker<PrecacheStatus>({ type: 'GET_PRECACHE_STATUS' }).then(classifyReadiness);
}

/** Re-downloads missing files (needs a connection), then re-checks. */
export async function repairOfflineReadiness(): Promise<OfflineReadiness> {
  const status = await askServiceWorker<PrecacheStatus>({ type: 'REPAIR_PRECACHE' });
  return classifyReadiness(status);
}
