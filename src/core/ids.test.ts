import { describe, expect, it } from 'vitest';
import { newId } from './ids';

describe('newId', () => {
  it('produces unique ids even within the same millisecond', () => {
    const ids = new Set(Array.from({ length: 5_000 }, () => newId(1_700_000_000_000)));
    expect(ids.size).toBe(5_000);
  });

  it('sorts by creation time', () => {
    const earlier = newId(1_700_000_000_000);
    const later = newId(1_700_000_000_001);
    const muchLater = newId(1_800_000_000_000);
    expect([muchLater, later, earlier].sort()).toEqual([earlier, later, muchLater]);
  });

  it('is lowercase alphanumeric with a fixed length', () => {
    expect(newId()).toMatch(/^[0-9a-z]{19}$/);
  });
});
