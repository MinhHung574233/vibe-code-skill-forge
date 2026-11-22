import { create } from 'zustand';
import { UNKNOWN_STORAGE_HEALTH, readStorageHealth, type StorageHealth } from '@/db/storage';
import { isStandalone } from './install';

interface StorageHealthState {
  health: StorageHealth;
  loaded: boolean;
  /** Re-reads usage/persistence; requests persistence only in standalone mode. */
  refresh: () => Promise<void>;
}

export const useStorageHealthStore = create<StorageHealthState>((set) => ({
  health: UNKNOWN_STORAGE_HEALTH,
  loaded: false,
  refresh: async () => {
    const standalone = isStandalone();
    const health = await readStorageHealth({ standalone, requestPersist: standalone });
    set({ health, loaded: true });
  },
}));
