import { describe, expect, it } from 'vitest';
import { pointName, starPoints } from './labels';

describe('point names', () => {
  it('uses letters without I and rows counted from the bottom', () => {
    expect(pointName(9, 0)).toBe('A9');
    expect(pointName(9, 80)).toBe('J1');
    expect(pointName(19, 3 * 19 + 3)).toBe('D16');
    expect(pointName(19, 18 * 19 + 18)).toBe('T1');
    expect(pointName(13, 6 * 13 + 6)).toBe('G7');
  });

  it('has the standard star points', () => {
    expect(starPoints(9)).toHaveLength(5);
    expect(starPoints(13)).toHaveLength(9);
    expect(starPoints(19)).toHaveLength(9);
    expect(starPoints(19)).toContain(9 * 19 + 9);
  });
});
