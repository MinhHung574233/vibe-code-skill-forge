import { create } from 'zustand';
import {
  checkOfflineReadiness,
  repairOfflineReadiness,
  type OfflineReadiness,
} from './offlineReadiness';

interface PwaState {
  /** A new service worker is installed and waiting; the user decides when to apply it. */
  needRefresh: boolean;
  /** The app shell and content have been fully precached for the first time. */
  offlineReady: boolean;
  /** Result of the last precache self-check. */
  readiness: OfflineReadiness;
  /** Set by register.ts; activates the waiting worker and reloads. */
  applyUpdate: () => Promise<void>;
  checkReadiness: () => Promise<void>;
  /** Re-download missing precached files. Needs a connection. */
  repairReadiness: () => Promise<void>;
}

export const usePwaStore = create<PwaState>((set) => ({
  needRefresh: false,
  offlineReady: false,
  readiness: { state: 'unknown' },
  applyUpdate: () => Promise.resolve(),
  checkReadiness: async () => {
    set({ readiness: { state: 'checking' } });
    set({ readiness: await checkOfflineReadiness() });
  },
  repairReadiness: async () => {
    set({ readiness: { state: 'repairing' } });
    set({ readiness: await repairOfflineReadiness() });
  },
}));
