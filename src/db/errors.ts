import { AppError, isAppError } from '@/core/errors';
import { t } from '@/i18n/core';

/**
 * Maps Dexie / IndexedDB failures to AppError so callers never branch on raw DOM exceptions.
 * Dexie wraps errors but keeps the original DOMException name on `.name`.
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  const name = error instanceof Error ? error.name : '';
  const message = error instanceof Error ? error.message : String(error);

  switch (name) {
    case 'ConstraintError':
      return new AppError('CONSTRAINT', message, { cause: error });
    case 'QuotaExceededError':
      return new AppError('QUOTA', t('Device storage is full.'), { cause: error });
    case 'VersionError':
      return new AppError('VERSION', message, { cause: error });
    case 'SecurityError':
    case 'OpenFailedError':
    case 'MissingAPIError':
      return new AppError('UNAVAILABLE', message, { cause: error });
    case 'DatabaseClosedError':
    case 'AbortError':
    case 'TransactionInactiveError':
    case 'InvalidStateError':
      return new AppError('IO', message, { cause: error });
    default:
      return new AppError('UNKNOWN', message, { cause: error });
  }
}
