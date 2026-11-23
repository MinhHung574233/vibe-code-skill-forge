import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/utils/cn';
import { Icon, type IconName } from './Icon';

interface SectionProps {
  title?: string;
  footer?: string;
  children: ReactNode;
  className?: string;
}

/** iOS inset-grouped container: optional small caps header, rounded surface, hairline dividers. */
export function Section({ title, footer, children, className }: SectionProps) {
  return (
    <section className={cn('mt-6', className)}>
      {title && (
        <h2 className="mb-2 px-4 type-footnote font-medium uppercase tracking-wide text-muted">
          {title}
        </h2>
      )}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface [&>*+*]:border-t [&>*+*]:border-border">
        {children}
      </div>
      {footer && <p className="mt-2 px-4 type-footnote text-muted">{footer}</p>}
    </section>
  );
}

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  /** Tint for the leading icon tile (a CSS colour / token). */
  iconColor?: string;
  /** Replaces the default chevron. */
  accessory?: ReactNode;
  to?: string;
  onClick?: () => void;
}

const ROW =
  'flex min-h-[56px] w-full items-center gap-3 px-4 py-2.5 text-left active:bg-accent-soft';

export function ListRow({
  title,
  subtitle,
  icon,
  iconColor = 'var(--accent)',
  accessory,
  to,
  onClick,
}: ListRowProps) {
  const interactive = Boolean(to ?? onClick);
  const content = (
    <>
      {icon && (
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-[10px] text-white"
          style={{ background: iconColor }}
        >
          <Icon name={icon} size={20} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block break-words type-body">{title}</span>
        {subtitle && <span className="block break-words type-subhead text-muted">{subtitle}</span>}
      </span>
      {accessory ?? (interactive && <Icon name="chevronRight" size={18} className="text-muted" />)}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={ROW}>
        {content}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={ROW}>
        {content}
      </button>
    );
  }
  return <div className={ROW.replace('active:bg-accent-soft', '')}>{content}</div>;
}
