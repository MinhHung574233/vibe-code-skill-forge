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

function readinessView(r: OfflineReadiness): { text: string; sub?: string; tone: BadgeTone } {
  switch (r.state) {
    case 'ready':
      return { text: 'Ready offline', sub: `${r.expected} files saved`, tone: 'success' };
    case 'incomplete':
      return {
        text: 'Incomplete',
        sub: `${r.missing} of ${r.expected} files missing`,
        tone: 'warning',
      };
    case 'checking':
      return { text: 'Checking…', tone: 'neutral' };
    case 'repairing':
      return { text: 'Repairing…', tone: 'neutral' };
    case 'unavailable':
      return {
        text: 'Not available here',
        sub: 'Offline mode works in the installed, hosted app',
        tone: 'neutral',
      };
    case 'unknown':
      return { text: 'Not checked yet', tone: 'neutral' };
  }
}

export function SettingsScreen() {
  const { preference, setPreference } = useThemeStore();
  const readiness = usePwaStore((s) => s.readiness);
  const checkReadiness = usePwaStore((s) => s.checkReadiness);
  const repairReadiness = usePwaStore((s) => s.repairReadiness);
  const storage = useStorageHealthStore((s) => s.health);
  const refreshStorage = useStorageHealthStore((s) => s.refresh);

  const settings = useSettingsRepository();
  const lastBackupAt = useSetting('lastBackupAt');
  const dailyGoal = useSetting('dailyGoalMinutes');
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
      ? { text: 'Granted', tone: 'success' }
      : storage.persisted === false
        ? { text: 'Not granted', tone: 'warning' }
        : { text: 'Unknown', tone: 'neutral' };

  return (
    <Screen title="Settings">
      <Section title="Appearance">
        <div className="p-4">
          <SegmentedControl
            label="Theme"
            options={THEME_OPTIONS}
            value={preference}
            onChange={setPreference}
          />
        </div>
      </Section>

      <Section
        title="Training"
        footer="Your goal appears on the Home screen. It starts counting once training sessions are recorded."
      >
        <ListRow
          title="Daily goal"
          subtitle="Minutes per day"
          icon="target"
          iconColor="var(--accent)"
          accessory={
            dailyGoal === undefined ? undefined : (
              <NumberStepper
                label="daily goal"
                value={dailyGoal}
                min={5}
                max={240}
                step={5}
                format={(v) => `${v} min`}
                onChange={(v) => void settings.set('dailyGoalMinutes', v)}
              />
            )
          }
        />
      </Section>

      <Section
        title="Offline"
        footer="SkillForge works without internet once every file is saved on this device. iOS can remove saved files if the phone runs low on space; use Repair while online if this shows Incomplete."
      >
        <ListRow
          title={view.text}
          {...(view.sub ? { subtitle: view.sub } : {})}
          icon="check"
          iconColor="var(--success)"
          accessory={<Badge tone={view.tone}>{view.tone === 'success' ? 'OK' : 'Status'}</Badge>}
        />
        <div className="flex gap-2 p-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => void checkReadiness()}
          >
            Check again
          </Button>
          {readiness.state === 'incomplete' && (
            <Button size="sm" loading={busy} onClick={() => void repairReadiness()}>
              Repair
            </Button>
          )}
        </div>
      </Section>

      <Section
        title="Your data"
        footer="Everything is stored only on this device. A backup file is the only way to recover your data if iOS clears the app’s storage, you delete the Home Screen icon, or you change phones."
      >
        <ListRow
          title="Last backup"
          subtitle={
            lastBackupAt === undefined
              ? 'Loading…'
              : lastBackupAt === null
                ? 'Never'
                : formatAgeDays(lastBackupAt, now)
          }
          icon="bookmark"
          iconColor="#0ea5e9"
        />
        <ListRow
          title="Storage used"
          subtitle={
            storage.usageBytes !== null && storage.quotaBytes !== null
              ? `${formatBytes(storage.usageBytes)} of ${formatBytes(storage.quotaBytes)} available`
              : 'Not reported by this browser'
          }
          icon="grid"
          iconColor="#64748b"
        />
        <ListRow
          title="Storage protection"
          subtitle={
            storage.persisted === null
              ? 'iOS decides; this cannot be confirmed'
              : standalone
                ? 'Requested for the installed app'
                : 'Install to the Home Screen first'
          }
          icon="info"
          iconColor="#8b5cf6"
          accessory={<Badge tone={persistence.tone}>{persistence.text}</Badge>}
        />
        <div className="flex flex-col gap-2 p-3">
          <Button onClick={() => setExportOpen(true)}>Back up my data</Button>
          <BackupImport onImported={() => window.location.reload()} />
        </div>
      </Section>

      {!standalone && detectIos() && (
        <Section title="Install">
          <ListRow
            title="Add to Home Screen"
            subtitle="Required for reliable offline use"
            icon="plus"
            onClick={() => setCoachOpen(true)}
          />
        </Section>
      )}

      <Section title="Danger zone">
        <div className="p-3">
          <Button variant="destructive" fullWidth onClick={() => setEraseOpen(true)}>
            Erase all data on this device
          </Button>
          {eraseError && (
            <p role="alert" className="mt-2 type-subhead text-danger">
              {eraseError}
            </p>
          )}
        </div>
      </Section>

      <Section title="About">
        <ListRow title="SkillForge" subtitle={`Version ${__APP_VERSION__}`} />
        <ListRow title="Data format" subtitle={`Version ${CURRENT_SCHEMA_VERSION}`} />
        <ListRow
          title="Privacy"
          subtitle="No account, no tracking, no network requests. Your data leaves this device only when you export a backup."
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
        title="Erase all data?"
        message="Every skill, goal and setting stored by SkillForge on this device will be deleted, along with the safety copy. Back up first if you might want it back. This cannot be undone."
        confirmLabel="Erase everything"
        destructive
        onCancel={() => setEraseOpen(false)}
        onConfirm={() => {
          setEraseOpen(false);
          setEraseError(null);
          resetAllData()
            .then(() => window.location.reload())
            .catch(() => setEraseError('Erasing failed. Nothing more was changed.'));
        }}
      />
    </Screen>
  );
}
