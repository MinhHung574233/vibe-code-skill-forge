import { useState } from 'react';
import { Link } from 'react-router';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ListRow, Section } from '@/components/Section';
import { MODULES } from '@/features/registry';
import type { CompletionOutcome } from '@/features/training/domain/session';
import { ManualLogSheet } from '@/features/training/ui/ManualLogSheet';
import { SessionCompleteSheet } from '@/features/training/ui/SessionCompleteSheet';

/**
 * Practice hub. "Train" works today (timed or logged sessions for any skill). Below it, one row
 * per module from the registry; modules that are not built yet are shown as such instead of
 * leading to empty pages.
 */
export function PracticeScreen() {
  const [logOpen, setLogOpen] = useState(false);
  const [outcome, setOutcome] = useState<CompletionOutcome | null>(null);
  const available = MODULES.filter((m) => m.status === 'available');

  return (
    <Screen title="Practice">
      <Card aria-labelledby="train-heading" role="region">
        <h2 id="train-heading" className="type-title-2">
          Train
        </h2>
        <p className="mt-1 type-subhead text-muted">
          Time yourself on any skill, or log a session you already did. Both feed your goals, streak
          and progress.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Link
            to="/practice/session"
            className="inline-flex min-h-[50px] items-center justify-center rounded-xl bg-accent px-5 type-headline text-on-accent active:scale-[0.98] active:opacity-80"
          >
            Start a session
          </Link>
          <Button variant="secondary" onClick={() => setLogOpen(true)}>
            Log a session
          </Button>
        </div>
      </Card>

      <Section
        title="Training modules"
        footer={
          available.length === 0
            ? 'Guided modules open here as they are built. Rubik’s Cube comes first, then English, Java & Spring and Developer Tools, then the board games.'
            : undefined
        }
      >
        {MODULES.map((module) => (
          <ListRow
            key={module.id}
            title={module.title}
            subtitle={module.subtitle}
            icon={module.icon}
            iconColor={module.color}
            accessory={<Badge>{module.status === 'planned' ? 'Coming soon' : 'Open'}</Badge>}
          />
        ))}
      </Section>

      <ManualLogSheet open={logOpen} onClose={() => setLogOpen(false)} onRecorded={setOutcome} />
      <SessionCompleteSheet outcome={outcome} onClose={() => setOutcome(null)} />
    </Screen>
  );
}
