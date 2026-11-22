import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/Button';
import { Icon, type IconName } from '@/components/Icon';
import { backupNudge, describeNudge } from '@/features/settings/domain/backupNudge';
import { InstallCoachSheet } from '@/features/settings/ui/InstallCoachSheet';
import {
  useSetting,
  useSettingsRepository,
  useUserDataRowCount,
} from '@/features/settings/ui/useSettings';
import { useNow } from '@/hooks/useNow';
import { detectIos, isStandalone, shouldOfferInstall } from '@/pwa/install';
import { usePwaStore } from '@/pwa/pwaStore';

interface Banner {
  key: string;
  icon: IconName;
  text: string;
  action: React.ReactNode;
}

/**
 * At most ONE banner at a time, in priority order (DESIGN_SYSTEM §9):
 * update ready > offline files missing > backup reminder > install to Home Screen.
 */
export function StatusBanners() {
  const needRefresh = usePwaStore((s) => s.needRefresh);
  const applyUpdate = usePwaStore((s) => s.applyUpdate);
  const readiness = usePwaStore((s) => s.readiness);
  const repairReadiness = usePwaStore((s) => s.repairReadiness);

  const settings = useSettingsRepository();
  const lastBackupAt = useSetting('lastBackupAt');
  const lastBackupRowCount = useSetting('lastBackupRowCount');
  const installDismissedAt = useSetting('installCoachDismissedAt');
  const userRows = useUserDataRowCount();

  const now = useNow();
  const [coachOpen, setCoachOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const nudge =
    lastBackupAt === undefined || lastBackupRowCount === undefined || userRows === undefined
      ? ({ kind: 'none' } as const)
      : backupNudge({
          now,
          lastBackupAt,
          totalRows: userRows,
          rowsAtLastBackup: lastBackupRowCount,
        });
  const nudgeText = describeNudge(nudge);
  const offerInstall =
    installDismissedAt !== undefined &&
    shouldOfferInstall({
      ios: detectIos(),
      standalone: isStandalone(),
      dismissedAt: installDismissedAt,
    });

  let banner: Banner | null = null;
  if (needRefresh) {
    banner = {
      key: 'update',
      icon: 'refresh',
      text: 'An update is ready.',
      action: (
        <Button
          size="sm"
          loading={updating}
          onClick={() => {
            setUpdating(true);
            void applyUpdate();
          }}
        >
          Restart
        </Button>
      ),
    };
  } else if (readiness.state === 'incomplete') {
    banner = {
      key: 'offline',
      icon: 'alert',
      text: 'Some offline files are missing. Connect to the internet to repair.',
      action: (
        <Button size="sm" variant="secondary" onClick={() => void repairReadiness()}>
          Repair
        </Button>
      ),
    };
  } else if (nudgeText) {
    banner = {
      key: 'backup',
      icon: 'bookmark',
      text: nudgeText,
      action: (
        <Link
          to="/settings"
          className="inline-flex min-h-[44px] items-center rounded-xl bg-accent-soft px-4 type-headline text-accent"
        >
          Back up
        </Link>
      ),
    };
  } else if (offerInstall) {
    banner = {
      key: 'install',
      icon: 'plus',
      text: 'Add SkillForge to your Home Screen to use it offline.',
      action: (
        <Button size="sm" variant="secondary" onClick={() => setCoachOpen(true)}>
          How
        </Button>
      ),
    };
  }

  return (
    <>
      {banner && (
        <div
          role="status"
          data-banner={banner.key}
          className="mx-auto flex w-full max-w-xl items-center gap-3 border-b border-border bg-surface px-4 py-2"
          style={{
            paddingLeft: 'max(env(safe-area-inset-left), 1rem)',
            paddingRight: 'max(env(safe-area-inset-right), 1rem)',
          }}
        >
          <Icon name={banner.icon} size={20} className="shrink-0 text-accent" />
          <p className="min-w-0 flex-1 type-subhead">{banner.text}</p>
          {banner.action}
        </div>
      )}
      <InstallCoachSheet
        open={coachOpen}
        onClose={() => setCoachOpen(false)}
        onDone={() => {
          setCoachOpen(false);
          void settings.set('installCoachDismissedAt', Date.now());
        }}
      />
    </>
  );
}
