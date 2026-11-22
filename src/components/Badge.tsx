import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'xp';

const DOT: Record<BadgeTone, string> = {
  neutral: 'var(--text-muted)',
  success: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--danger)',
  xp: 'var(--xp)',
};

/**
 * Status label. Meaning is carried by the text and a dot, never by colour alone, and the
 * text always uses the primary text colour so contrast holds in both themes.
 */
export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 type-footnote font-medium text-text"
      style={{ background: `color-mix(in srgb, ${DOT[tone]} 14%, transparent)` }}
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full"
        style={{ background: DOT[tone] }}
      />
      {children}
    </span>
  );
}
