import type { ReactNode } from 'react';
import { t } from '@/i18n/core';
import { Card } from './Card';
import { Screen } from './Screen';

interface ShellScreenProps {
  title: string;
  milestone: string;
  children?: ReactNode;
}

/**
 * Temporary Phase 1 scaffold screen. It states plainly that the feature is not built yet.
 * Each real screen replaces one of these in its milestone.
 */
export function ShellScreen({ title, milestone, children }: ShellScreenProps) {
  return (
    <Screen title={title}>
      <Card>
        <p className="type-subhead text-muted">
          {t('Foundation shell. This screen is implemented in milestone {milestone}.', {
            milestone,
          })}
        </p>
      </Card>
      {children}
    </Screen>
  );
}
