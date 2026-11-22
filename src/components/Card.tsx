import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export function Card({ padded = true, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-surface',
        padded && 'p-4',
        // light: soft shadow; dark: tone steps only (token is `none` in dark, DESIGN_SYSTEM §4)
        'shadow-[var(--shadow-card)]',
        className,
      )}
      {...rest}
    />
  );
}
