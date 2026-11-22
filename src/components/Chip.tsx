import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ChipProps {
  children: ReactNode;
  /** When provided the chip is a toggle button; omit for a static label. */
  selected?: boolean;
  onClick?: () => void;
}

export function Chip({ children, selected = false, onClick }: ChipProps) {
  const base = 'inline-flex items-center rounded-full px-3.5 type-subhead font-medium';
  if (!onClick) {
    return <span className={cn(base, 'min-h-8 bg-accent-soft text-accent')}>{children}</span>;
  }
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      // 44 px hit area around a 32 px visual pill
      className={cn(
        base,
        'relative min-h-8 transition-colors active:opacity-70 before:absolute before:-inset-y-1.5 before:inset-x-0 before:content-[""]',
        selected ? 'bg-accent text-on-accent' : 'bg-accent-soft text-accent',
      )}
    >
      {children}
    </button>
  );
}
