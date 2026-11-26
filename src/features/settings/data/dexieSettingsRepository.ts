import { AppError } from '@/core/errors';
import { t } from '@/i18n/core';
import type { Clock } from '@/core/time/clock';
import { err, ok, type Result } from '@/core/result';
import { toAppError } from '@/db/errors';
import type { SkillForgeDB } from '@/db/schema';
import {
  SETTING_DEFS,
  type SettingKey,
  type SettingValue,
  type SettingsRepository,
} from '../domain/settings';

export class DexieSettingsRepository implements SettingsRepository {
  constructor(
    private readonly db: SkillForgeDB,
    private readonly clock: Pick<Clock, 'now'>,
  ) {}

  async get<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
    const def = SETTING_DEFS[key];
    const row = await this.db.settings.get(key);
    if (!row) return def.default as SettingValue<K>;
    const parsed = def.schema.safeParse(row.value);
    return parsed.success ? (parsed.data as SettingValue<K>) : (def.default as SettingValue<K>);
  }

  async set<K extends SettingKey>(key: K, value: SettingValue<K>): Promise<Result<void>> {
    const parsed = SETTING_DEFS[key].schema.safeParse(value);
    if (!parsed.success) {
      return err(new AppError('VALIDATION', t('Invalid value for setting "{key}".', { key })));
    }
    try {
      await this.db.settings.put({ key, value: parsed.data, updatedAt: this.clock.now() });
      return ok(undefined);
    } catch (cause) {
      return err(toAppError(cause));
    }
  }
}
