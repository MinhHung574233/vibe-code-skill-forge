import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ListRow, Section } from '@/components/Section';
import { MODULES } from '@/features/registry';

/**
 * Practice hub: one row per module from the registry. Modules that are not built yet are
 * shown as such (not tappable, labelled with the milestone) instead of leading to empty pages.
 */
export function PracticeScreen() {
  const available = MODULES.filter((m) => m.status === 'available');

  return (
    <Screen title="Practice">
      <Card>
        <p className="type-subhead text-muted">
          Each module is added as it is built. Rubik’s Cube comes first, then English, Java & Spring
          and Developer Tools, then the board games.
        </p>
      </Card>
      <Section
        title="Training modules"
        footer={
          available.length === 0
            ? 'No module is available yet. They open here as soon as they are ready.'
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
    </Screen>
  );
}
