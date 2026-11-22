import { describe, expect, it } from 'vitest';
import { addDays, diffDays, isLocalDate, toLocalDate } from './localDate';

describe('toLocalDate', () => {
  it('formats using the device-local calendar day', () => {
    const noonLocal = new Date(2026, 10, 22, 12, 0, 0).getTime();
    expect(toLocalDate(noonLocal)).toBe('2026-11-22');
  });

  it('keeps late-evening local time on the same day', () => {
    const lateLocal = new Date(2026, 0, 5, 23, 59, 59).getTime();
    expect(toLocalDate(lateLocal)).toBe('2026-01-05');
  });
});

describe('isLocalDate', () => {
  it.each(['2026-11-22', '2024-02-29', '2000-01-01'])('accepts %s', (v) => {
    expect(isLocalDate(v)).toBe(true);
  });

  it.each(['2026-13-01', '2026-02-30', '2025-02-29', '26-01-01', '2026-1-1', '', 'abc'])(
    'rejects %s',
    (v) => {
      expect(isLocalDate(v)).toBe(false);
    },
  );
});

describe('addDays', () => {
  it('crosses month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('is unaffected by DST transitions (calendar arithmetic, not 24h blocks)', () => {
    // US spring-forward (2026-03-08) and fall-back (2026-11-01) days
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
  });

  it('throws on invalid input', () => {
    expect(() => addDays('2026-02-30', 1)).toThrow(RangeError);
  });
});

describe('diffDays', () => {
  it('counts whole calendar days', () => {
    expect(diffDays('2026-11-22', '2026-11-22')).toBe(0);
    expect(diffDays('2026-11-22', '2026-11-25')).toBe(3);
    expect(diffDays('2026-11-25', '2026-11-22')).toBe(-3);
    expect(diffDays('2026-12-31', '2027-01-01')).toBe(1);
  });

  it('is exact across DST changes', () => {
    expect(diffDays('2026-03-07', '2026-03-09')).toBe(2);
    expect(diffDays('2026-10-31', '2026-11-02')).toBe(2);
  });
});
