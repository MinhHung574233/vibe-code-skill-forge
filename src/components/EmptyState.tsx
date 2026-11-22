import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  /** One specific line, e.g. "Solve your first cube to see Ao5". */
  description: string;
  /** At most one action. */
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-8 py-12 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon name={icon} size={28} />
      </span>
      <h2 className="type-headline">{title}</h2>
      <p className="mt-1 max-w-xs type-subhead text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
