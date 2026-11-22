import { describe, expect, it } from 'vitest';
import { formatAgeDays, formatBytes, formatDateTime } from './format';

describe('formatBytes', () => {
  it.each([
    [0, '0 B'],
    [512, '512 B'],
    [1536, '1.5 KB'],
    [1024 * 1024, '1.0 MB'],
    [5.25 * 1024 * 1024, '5.3 MB'],
    [300 * 1024 * 1024, '300 MB'],
    [2.5 * 1024 ** 3, '2.5 GB'],
  ])('%s -> %s', (input, expected) => {
    expect(formatBytes(input)).toBe(expected);
  });

  it('shows a dash for invalid values', () => {
    expect(formatBytes(-1)).toBe('—');
    expect(formatBytes(Number.NaN)).toBe('—');
  });
});

describe('formatAgeDays', () => {
  const now = Date.UTC(2026, 10, 22, 12);
  it('speaks in whole days', () => {
    expect(formatAgeDays(now - 1000, now)).toBe('today');
    expect(formatAgeDays(now - 86_400_000, now)).toBe('yesterday');
    expect(formatAgeDays(now - 5 * 86_400_000, now)).toBe('5 days ago');
  });
});

describe('formatDateTime', () => {
  it('includes the date and time', () => {
    const text = formatDateTime(new Date(2026, 10, 22, 14, 5).getTime(), 'en-GB');
    expect(text).toMatch(/22/);
    expect(text).toMatch(/2026/);
    expect(text).toMatch(/14:05|2:05/);
  });
});
