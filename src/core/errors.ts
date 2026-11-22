/**
 * Expected, user-meaningful failure categories. Programmer errors are thrown as ordinary
 * Errors; anything the app should handle gracefully is an AppError (ARCHITECTURE §10).
 */
export type AppErrorCode =
  | 'VALIDATION' // input rejected by a schema
  | 'CONSTRAINT' // unique/key constraint hit (often "already done", not a failure)
  | 'QUOTA' // storage full
  | 'VERSION' // database newer/older than the code can handle
  | 'UNAVAILABLE' // IndexedDB missing or blocked
  | 'IO' // read/write failed, connection closed, transaction aborted
  | 'UNKNOWN';

export class AppError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AppError';
    this.code = code;
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}
