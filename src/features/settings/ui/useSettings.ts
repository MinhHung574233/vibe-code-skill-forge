import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';
import { systemClock } from '@/core/time/clock';
import { getDb } from '@/db/boot';
import { countMarkerTables, totalRows } from '@/db/marker';
import { DexieSettingsRepository } from '../data/dexieSettingsRepository';
import type { SettingKey, SettingValue, SettingsRepository } from '../domain/settings';

/** Repository bound to the open database. Only usable below the BootGate. */
export function useSettingsRepository(): SettingsRepository {
  return useMemo(() => new DexieSettingsRepository(getDb(), systemClock), []);
}

/** Live value of a setting (re-renders when it changes). `undefined` while loading. */
export function useSetting<K extends SettingKey>(key: K): SettingValue<K> | undefined {
  const repository = useSettingsRepository();
  return useLiveQuery(() => repository.get(key), [repository, key]);
}

/** Live total of user-data rows (what the backup reminder and the loss detector count). */
export function useUserDataRowCount(): number | undefined {
  return useLiveQuery(async () => totalRows(await countMarkerTables(getDb())), []);
}
