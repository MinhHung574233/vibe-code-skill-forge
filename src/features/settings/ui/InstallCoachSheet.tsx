import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { t } from '@/i18n/core';

interface InstallCoachSheetProps {
  open: boolean;
  onClose: () => void;
  /** Called when the user says they have understood (stops the banner). */
  onDone: () => void;
}

const STEPS = [
  'Open this page in Safari.',
  'Tap the Share button (the square with an arrow) in the toolbar.',
  'Scroll down and tap “Add to Home Screen”, then tap Add.',
  'Open SkillForge from its new icon on your Home Screen.',
];

/**
 * iOS has no install prompt, so the app explains it. The important message is the last one:
 * the installed app keeps its own separate storage, so set up and use it there.
 */
export function InstallCoachSheet({ open, onClose, onDone }: InstallCoachSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={t('Add SkillForge to your Home Screen')}>
      <ol className="list-decimal space-y-2 pl-5 type-body">
        {STEPS.map((step) => (
          <li key={step}>{t(step)}</li>
        ))}
      </ol>
      <p className="mt-4 rounded-xl bg-accent-soft p-3 type-subhead text-text">
        {t(
          'Use SkillForge from the Home Screen icon, not from Safari. The installed app keeps its own storage: anything you add in a Safari tab will not appear in it. Moving data between them is done with a backup.',
        )}
      </p>
      <Button fullWidth className="mt-4" onClick={onDone}>
        {t('Got it')}
      </Button>
      <Button fullWidth variant="ghost" className="mt-2" onClick={onClose}>
        {t('Not now')}
      </Button>
    </Sheet>
  );
}
