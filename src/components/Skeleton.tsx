import { cn } from '@/utils/cn';

/** Loading placeholder. Decorative: hidden from assistive tech (use aria-busy on the region). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('rounded-lg bg-border', className)}
      style={{ animation: 'shimmer 1.4s ease-in-out infinite' }}
    />
  );
}
