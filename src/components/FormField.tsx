import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/utils/cn';

/** Shared input look: 16px text (no iOS focus-zoom) and a 48px touch height. */
const CONTROL =
  'w-full rounded-xl border border-border bg-surface px-3 text-text placeholder:text-muted focus:border-accent aria-[invalid=true]:border-danger';

interface FieldShellProps {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
  children: (ids: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

/** Label + control + hint/error, wired for assistive tech (aria-invalid, aria-describedby). */
function FieldShell({ label, error, hint, children }: FieldShellProps) {
  const id = useId();
  const messageId = `${id}-msg`;
  const message = error ?? hint;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block px-1 type-subhead font-medium">
        {label}
      </label>
      {children({ id, describedBy: message ? messageId : undefined, invalid: Boolean(error) })}
      {message && (
        <p
          id={messageId}
          role={error ? 'alert' : undefined}
          className={cn('px-1 type-footnote', error ? 'text-danger' : 'text-muted')}
        >
          {message}
        </p>
      )}
    </div>
  );
}

interface BaseProps {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}

export function TextField({
  label,
  error,
  hint,
  className,
  ...rest
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn(CONTROL, 'min-h-12', className)}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  className,
  ...rest
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn(CONTROL, 'min-h-24 py-3', className)}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

export function SelectField({
  label,
  error,
  hint,
  className,
  children,
  ...rest
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <FieldShell label={label} error={error} hint={hint}>
      {({ id, describedBy, invalid }) => (
        <select
          id={id}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          className={cn(CONTROL, 'min-h-12', className)}
          {...rest}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
}
