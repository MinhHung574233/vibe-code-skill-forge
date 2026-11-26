import { t } from '@/i18n/core';
import { Button } from './Button';
import { Icon } from './Icon';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center px-8 py-12 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full border border-border bg-surface text-danger">
        <Icon name="alert" size={28} />
      </span>
      <h2 className="type-headline">{title ?? t('Something went wrong')}</h2>
      <p className="mt-1 max-w-xs type-subhead text-muted">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry}>
          <Icon name="refresh" size={18} />
          {t('Try again')}
        </Button>
      )}
    </div>
  );
}
