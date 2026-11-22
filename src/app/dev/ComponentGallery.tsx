import { useState } from 'react';
import { Badge } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { ICON_NAMES, Icon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { ProgressRing } from '@/components/ProgressRing';
import { Screen } from '@/components/Screen';
import { ListRow, Section } from '@/components/Section';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Sheet } from '@/components/Sheet';
import { Skeleton } from '@/components/Skeleton';
import { StatTile } from '@/components/StatTile';
import { useThemeStore, type ThemePreference } from '@/theme/themeStore';

const THEME_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const TYPE_SAMPLES = [
  ['type-large-title', 'Large title'],
  ['type-title-1', 'Title 1'],
  ['type-title-2', 'Title 2'],
  ['type-headline', 'Headline'],
  ['type-body', 'Body text'],
  ['type-callout', 'Callout'],
  ['type-subhead', 'Subhead'],
  ['type-footnote', 'Footnote'],
] as const;

const SWATCHES = [
  ['bg', 'Background'],
  ['surface', 'Surface'],
  ['border', 'Border'],
  ['accent', 'Accent'],
  ['success', 'Success'],
  ['warning', 'Warning'],
  ['danger', 'Danger'],
  ['xp', 'XP'],
] as const;

/**
 * Developer-only gallery of every design-system primitive (route /dev/components, not linked
 * from the app). Used for visual checks in both themes and for the e2e screenshot test.
 */
export function ComponentGallery() {
  const { preference, setPreference } = useThemeStore();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [segment, setSegment] = useState<'day' | 'week' | 'month'>('week');
  const [chip, setChip] = useState('Java');
  const [loading, setLoading] = useState(false);

  return (
    <Screen title="Components">
      <SegmentedControl
        label="Theme"
        options={THEME_OPTIONS}
        value={preference}
        onChange={setPreference}
      />

      <Section title="Typography">
        <div className="space-y-1 p-4">
          {TYPE_SAMPLES.map(([cls, text]) => (
            <p key={cls} className={cls}>
              {text}
            </p>
          ))}
          <p className="type-timer">12.345</p>
        </div>
      </Section>

      <Section title="Colour tokens">
        <div className="grid grid-cols-4 gap-3 p-4">
          {SWATCHES.map(([token, name]) => (
            <div key={token} className="text-center">
              <div
                className="mx-auto size-11 rounded-xl border border-border"
                style={{ background: `var(--${token})` }}
              />
              <p className="mt-1 type-footnote text-muted">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-col gap-3 p-4">
          <Button fullWidth>Primary</Button>
          <Button variant="secondary" fullWidth>
            Secondary
          </Button>
          <Button variant="ghost" fullWidth>
            Ghost
          </Button>
          <Button variant="destructive" fullWidth>
            Destructive
          </Button>
          <Button
            fullWidth
            loading={loading}
            onClick={() => {
              setLoading(true);
              window.setTimeout(() => setLoading(false), 1200);
            }}
          >
            {loading ? 'Saving' : 'Tap for loading state'}
          </Button>
          <Button fullWidth disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section title="Progress">
        <div className="flex items-center justify-around p-4">
          <ProgressRing value={0.35} label="Daily goal">
            <span className="type-headline">35%</span>
          </ProgressRing>
          <ProgressRing value={1} size={72} strokeWidth={8} color="var(--success)" label="Complete">
            <Icon name="check" size={28} className="text-success" />
          </ProgressRing>
        </div>
        <div className="space-y-3 p-4">
          <ProgressBar value={0.6} label="Java path" />
          <ProgressBar value={0.15} color="var(--xp)" label="Level progress" />
        </div>
      </Section>

      <Section title="Stat tiles">
        <div className="grid grid-cols-2 gap-3 p-3">
          <StatTile label="Streak" value="12 days" icon="flame" iconColor="var(--warning)" />
          <StatTile label="XP" value="1,240" hint="Level 4" icon="bolt" iconColor="var(--xp)" />
        </div>
      </Section>

      <Section title="List rows">
        <ListRow
          title="Rubik's Cube"
          subtitle="Ao12 18.4 s"
          icon="cube"
          iconColor="#ef4444"
          to="/practice"
        />
        <ListRow
          title="English vocabulary"
          subtitle="12 due today"
          icon="book"
          iconColor="#0ea5e9"
          onClick={() => undefined}
        />
        <ListRow
          title="Java & Spring"
          subtitle="Core Java · 3 of 9"
          icon="code"
          iconColor="#f97316"
          accessory={<Badge tone="success">On track</Badge>}
        />
      </Section>

      <Section title="Chips & badges">
        <div className="flex flex-wrap items-center gap-2 p-4">
          {['Java', 'Git', 'Docker'].map((name) => (
            <Chip key={name} selected={chip === name} onClick={() => setChip(name)}>
              {name}
            </Chip>
          ))}
          <Chip>Static</Chip>
          <Badge>Neutral</Badge>
          <Badge tone="success">Done</Badge>
          <Badge tone="warning">At risk</Badge>
          <Badge tone="danger">Overdue</Badge>
          <Badge tone="xp">+20 XP</Badge>
        </div>
      </Section>

      <Section title="Segmented control">
        <div className="p-4">
          <SegmentedControl
            label="Range"
            options={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
            ]}
            value={segment}
            onChange={setSegment}
          />
        </div>
      </Section>

      <Section title="Sheet & dialog">
        <div className="flex flex-col gap-3 p-4">
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>
            Open bottom sheet
          </Button>
          <Button variant="secondary" onClick={() => setConfirmOpen(true)}>
            Open confirm dialog
          </Button>
        </div>
      </Section>

      <Section title="Loading">
        <div className="space-y-2 p-4" aria-busy="true">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </Section>

      <Section title="Empty & error states">
        <EmptyState
          icon="cube"
          title="No solves yet"
          description="Solve your first cube to see Ao5 and Ao12."
          action={<Button size="sm">Start timer</Button>}
        />
        <ErrorState message="The data could not be loaded." onRetry={() => undefined} />
      </Section>

      <Section title="Icons">
        <div className="grid grid-cols-6 gap-4 p-4 text-text">
          {ICON_NAMES.map((name) => (
            <div key={name} className="flex justify-center" title={name}>
              <Icon name={name} />
            </div>
          ))}
        </div>
      </Section>

      <Card className="mt-6">
        <p className="type-footnote text-muted">
          Developer gallery. Not linked from the app; used for visual checks.
        </p>
      </Card>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Session complete">
        <p className="type-body text-muted">
          Drag the handle down, tap outside, or press Escape to dismiss.
        </p>
        <div className="my-4">
          <StatTile label="XP earned" value="+20" icon="bolt" iconColor="var(--xp)" />
        </div>
        <Button fullWidth onClick={() => setSheetOpen(false)}>
          Done
        </Button>
      </Sheet>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this solve?"
        message="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
      />
    </Screen>
  );
}
