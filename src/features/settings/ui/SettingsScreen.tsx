import { useEffect, useState } from 'react';
import { Badge, type BadgeTone } from '@/components/Badge';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { NumberStepper } from '@/components/NumberStepper';
import { ListRow, Section } from '@/components/Section';
import { SegmentedControl } from '@/components/SegmentedControl';
import { CURRENT_SCHEMA_VERSION } from '@/db/schema';
import { resetAllData } from '@/db/recovery';
import { useNow } from '@/hooks/useNow';
import { t, type LanguagePreference } from '@/i18n/core';
import { useLanguagePreference } from '@/i18n/react';
import { detectIos, isStandalone } from '@/pwa/install';
import type { OfflineReadiness } from '@/pwa/offlineReadiness';
import { usePwaStore } from '@/pwa/pwaStore';
import { useStorageHealthStore } from '@/pwa/storageHealthStore';
import { useThemeStore, type ThemePreference } from '@/theme/themeStore';
import { formatAgeDays, formatBytes } from '@/utils/format';
import { BackupImport } from './BackupImport';
import { ExportBackupSheet } from './ExportBackupSheet';
import { InstallCoachSheet } from './InstallCoachSheet';
import { useSetting, useSettingsRepository } from './useSettings';

const THEME_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

/** Language names are shown in their own language so they can be found from any language. */
const LANGUAGE_OPTIONS: readonly { value: LanguagePreference; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'en', label: 'English' },
  { value: 'vi', label: 'Tiếng Việt' },
];

const STREAK_OPTIONS = [
  { value: 'any_session', label: 'Any session' },
  { value: 'goal_met', label: 'Goal reached' },
] as const;

function readinessView(r: OfflineReadiness): { text: string; sub?: string; tone: BadgeTone } {
  switch (r.state) {
    case 'ready':
      return {
        text: t('Ready offline'),
        sub: t('{n} files saved', { n: r.expected }),
        tone: 'success',
      };
    case 'incomplete':
      return {
        text: t('Incomplete'),
        sub: t('{missing} of {expected} files missing', {
          missing: r.missing,
          expected: r.expected,
        }),
        tone: 'warning',
      };
    case 'checking':
      return { text: t('Checking…'), tone: 'neutral' };
    case 'repairing':
      return { text: t('Repairing…'), tone: 'neutral' };
    case 'unavailable':
      return {
        text: t('Not available here'),
        sub: t('Offline mode works in the installed, hosted app'),
        tone: 'neutral',
      };
    case 'unknown':
      return { text: t('Not checked yet'), tone: 'neutral' };
  }
}

export function SettingsScreen() {
  const { preference, setPreference } = useThemeStore();
  const { preference: languagePreference, setPreference: setLanguagePreference } =
    useLanguagePreference();
  const readiness = usePwaStore((s) => s.readiness);
  const checkReadiness = usePwaStore((s) => s.checkReadiness);
  const repairReadiness = usePwaStore((s) => s.repairReadiness);
  const storage = useStorageHealthStore((s) => s.health);
  const refreshStorage = useStorageHealthStore((s) => s.refresh);

  const settings = useSettingsRepository();
  const lastBackupAt = useSetting('lastBackupAt');
  const dailyGoal = useSetting('dailyGoalMinutes');
  const streakRule = useSetting('streakRule');
  const now = useNow();

  const [exportOpen, setExportOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);
  const [eraseOpen, setEraseOpen] = useState(false);
  const [eraseError, setEraseError] = useState<string | null>(null);

  useEffect(() => {
    void checkReadiness();
    void refreshStorage();
  }, [checkReadiness, refreshStorage]);

  const view = readinessView(readiness);
  const busy = readiness.state === 'checking' || readiness.state === 'repairing';
  const standalone = isStandalone();

  const persistence: { text: string; tone: BadgeTone } =
    storage.persisted === true
      ? { text: t('Granted'), tone: 'success' }
      : storage.persisted === false
        ? { text: t('Not granted'), tone: 'warning' }
        : { text: t('Unknown'), tone: 'neutral' };

  return (
    <Screen title={t('Settings')}>
      <Section title={t('Appearance')}>
        <div className="p-4">
          <SegmentedControl
            label={t('Theme')}
            options={THEME_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
            value={preference}
            onChange={setPreference}
          />
        </div>
      </Section>

      <Section title={t('Language')}>
        <div className="p-4">
          <SegmentedControl
            label={t('Language')}
            // Language names stay in their own language (and 'English' is also the module name, which is translated).
            options={LANGUAGE_OPTIONS.map((o) =>
              o.value === 'auto' ? { ...o, label: t('Auto') } : o,
            )}
            value={languagePreference}
            onChange={setLanguagePreference}
          />
        </div>
      </Section>

      <Section
        title={t('Training')}
        footer={t(
          'Your goal appears on the Home screen. The streak rule decides which days count towards your streak.',
        )}
      >
        <ListRow
          title={t('Daily goal')}
          subtitle={t('Minutes per day')}
          icon="target"
          iconColor="var(--accent)"
          accessory={
            dailyGoal === undefined ? undefined : (
              <NumberStepper
                label={t('daily goal')}
                value={dailyGoal}
                min={5}
                max={240}
                step={5}
                format={(v) => t('{v} min', { v })}
                onChange={(v) => void settings.set('dailyGoalMinutes', v)}
              />
            )
          }
        />
        <div className="space-y-2 p-4">
          <p className="type-body">{t('Streak counts days with')}</p>
          {streakRule !== undefined && (
            <SegmentedControl
              label={t('Streak rule')}
              options={STREAK_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
              value={streakRule}
              onChange={(v) => void settings.set('streakRule', v)}
            />
          )}
        </div>
      </Section>

      <Section
        title={t('Offline')}
        footer={t(
          'SkillForge works without internet once every file is saved on this device. iOS can remove saved files if the phone runs low on space; use Repair while online if this shows Incomplete.',
        )}
      >
        <ListRow
          title={view.text}
          {...(view.sub ? { subtitle: view.sub } : {})}
          icon="check"
          iconColor="var(--success)"
          accessory={
            <Badge tone={view.tone}>{view.tone === 'success' ? t('OK') : t('Status')}</Badge>
          }
        />
        <div className="flex gap-2 p-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => void checkReadiness()}
          >
            {t('Check again')}
          </Button>
          {readiness.state === 'incomplete' && (
            <Button size="sm" loading={busy} onClick={() => void repairReadiness()}>
              {t('Repair')}
            </Button>
          )}
        </div>
      </Section>

      <Section
        title={t('Your data')}
        footer={t(
          'Everything is stored only on this device. A backup file is the only way to recover your data if iOS clears the app’s storage, you delete the Home Screen icon, or you change phones.',
        )}
      >
        <ListRow
          title={t('Last backup')}
          subtitle={
            lastBackupAt === undefined
              ? t('Loading…')
              : lastBackupAt === null
                ? t('Never')
                : formatAgeDays(lastBackupAt, now)
          }
          icon="bookmark"
          iconColor="#0ea5e9"
        />
        <ListRow
          title={t('Storage used')}
          subtitle={
            storage.usageBytes !== null && storage.quotaBytes !== null
              ? t('{used} of {quota} available', {
                  used: formatBytes(storage.usageBytes),
                  quota: formatBytes(storage.quotaBytes),
                })
              : t('Not reported by this browser')
          }
          icon="grid"
          iconColor="#64748b"
        />
        <ListRow
          title={t('Storage protection')}
          subtitle={
            storage.persisted === null
              ? t('iOS decides; this cannot be confirmed')
              : standalone
                ? t('Requested for the installed app')
                : t('Install to the Home Screen first')
          }
          icon="info"
          iconColor="#8b5cf6"
          accessory={<Badge tone={persistence.tone}>{persistence.text}</Badge>}
        />
        <div className="flex flex-col gap-2 p-3">
          <Button onClick={() => setExportOpen(true)}>{t('Back up my data')}</Button>
          <BackupImport onImported={() => window.location.reload()} />
        </div>
      </Section>

      {!standalone && detectIos() && (
        <Section title={t('Install')}>
          <ListRow
            title={t('Add to Home Screen')}
            subtitle={t('Required for reliable offline use')}
            icon="plus"
            onClick={() => setCoachOpen(true)}
          />
        </Section>
      )}

      <Section title={t('Danger zone')}>
        <div className="p-3">
          <Button variant="destructive" fullWidth onClick={() => setEraseOpen(true)}>
            {t('Erase all data on this device')}
          </Button>
          {eraseError && (
            <p role="alert" className="mt-2 type-subhead text-danger">
              {eraseError}
            </p>
          )}
        </div>
      </Section>

      <Section title={t('About')}>
        <ListRow
          title="SkillForge"
          subtitle={t('Version {version}', { version: __APP_VERSION__ })}
        />
        <ListRow
          title={t('Data format')}
          subtitle={t('Version {version}', { version: CURRENT_SCHEMA_VERSION })}
        />
        <ListRow
          title={t('Privacy')}
          subtitle={t(
            'No account, no tracking, no network requests. Your data leaves this device only when you export a backup.',
          )}
        />
      </Section>

      <ExportBackupSheet open={exportOpen} onClose={() => setExportOpen(false)} />
      <InstallCoachSheet
        open={coachOpen}
        onClose={() => setCoachOpen(false)}
        onDone={() => {
          setCoachOpen(false);
          void settings.set('installCoachDismissedAt', Date.now());
        }}
      />
      <ConfirmDialog
        open={eraseOpen}
        title={t('Erase all data?')}
        message={t(
          'Every skill, goal and setting stored by SkillForge on this device will be deleted, along with the safety copy. Back up first if you might want it back. This cannot be undone.',
        )}
        confirmLabel={t('Erase everything')}
        destructive
        onCancel={() => setEraseOpen(false)}
        onConfirm={() => {
          setEraseOpen(false);
          setEraseError(null);
          resetAllData()
            .then(() => window.location.reload())
            .catch(() => setEraseError(t('Erasing failed. Nothing more was changed.')));
        }}
      />
    </Screen>
  );
}
