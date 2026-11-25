import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/utils/cn';
import { Icon } from './Icon';

interface ScreenProps {
  title: string;
  /** Right-aligned header action(s). */
  trailing?: ReactNode;
  /** Pushed screens: where the back button goes, and what it is called for assistive tech. */
  back?: { to: string; label: string };
  children?: ReactNode;
  className?: string;
}

/**
 * Tab-root screen with an iOS large title that collapses into a compact bar on scroll.
 * Collapse detection uses IntersectionObserver (no scroll listeners, no jank).
 */
export function Screen({ title, trailing, back, children, className }: ScreenProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setCollapsed(!entry.isIntersecting);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn('mx-auto w-full max-w-xl', className)}>
      <div
        data-collapsed={collapsed}
        className={cn(
          'sticky top-0 z-10 flex h-11 items-center justify-center border-b px-4 backdrop-blur transition-colors duration-200',
          collapsed ? 'border-border bg-bg/85' : 'border-transparent bg-transparent',
        )}
      >
        {back && (
          <Link
            to={back.to}
            aria-label={`Back to ${back.label}`}
            className="absolute inset-y-0 left-1 flex min-w-11 items-center gap-0.5 rounded-xl px-2 text-accent active:opacity-60"
          >
            <Icon name="chevronLeft" size={22} />
            <span className="type-callout">{back.label}</span>
          </Link>
        )}
        <span
          aria-hidden="true"
          className={cn(
            'type-headline transition-opacity duration-200',
            collapsed ? 'opacity-100' : 'opacity-0',
          )}
        >
          {title}
        </span>
      </div>
      <header className="-mt-11 flex items-end justify-between gap-3 px-4 pb-3 pt-14">
        <h1 ref={titleRef} className="type-large-title">
          {title}
        </h1>
        {trailing && <div className="flex shrink-0 items-center gap-2 pb-1">{trailing}</div>}
      </header>
      <div className="px-4 pb-10">{children}</div>
    </div>
  );
}
