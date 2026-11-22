import { describe, expect, it } from 'vitest';
import { AppError } from '@/core/errors';
import { err, ok } from '@/core/result';
import { toAppError } from './errors';

function named(name: string, message = 'x'): Error {
  const e = new Error(message);
  e.name = name;
  return e;
}

describe('toAppError', () => {
  it.each([
    ['ConstraintError', 'CONSTRAINT'],
    ['QuotaExceededError', 'QUOTA'],
    ['VersionError', 'VERSION'],
    ['OpenFailedError', 'UNAVAILABLE'],
    ['SecurityError', 'UNAVAILABLE'],
    ['DatabaseClosedError', 'IO'],
    ['AbortError', 'IO'],
    ['SomethingElse', 'UNKNOWN'],
  ])('maps %s to %s', (name, code) => {
    const mapped = toAppError(named(name));
    expect(mapped).toBeInstanceOf(AppError);
    expect(mapped.code).toBe(code);
  });

  it('keeps the original error as the cause', () => {
    const original = named('ConstraintError', 'dup');
    expect(toAppError(original).cause).toBe(original);
  });

  it('passes AppError through untouched and handles non-Error throws', () => {
    const app = new AppError('VALIDATION', 'bad');
    expect(toAppError(app)).toBe(app);
    expect(toAppError('weird').code).toBe('UNKNOWN');
  });

  it('gives quota errors a user-readable message', () => {
    expect(toAppError(named('QuotaExceededError')).message).toMatch(/storage is full/i);
  });
});

describe('Result helpers', () => {
  it('ok and err build discriminated results', () => {
    expect(ok(5)).toEqual({ ok: true, value: 5 });
    const e = new AppError('IO', 'nope');
    expect(err(e)).toEqual({ ok: false, error: e });
  });
});
