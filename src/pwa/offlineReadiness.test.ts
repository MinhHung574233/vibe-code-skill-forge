import { describe, expect, it } from 'vitest';
import { classifyReadiness } from './offlineReadiness';

describe('classifyReadiness', () => {
  it('is unavailable when the worker did not answer', () => {
    expect(classifyReadiness(null)).toEqual({ state: 'unavailable' });
  });

  it('is ready only when nothing is missing', () => {
    expect(classifyReadiness({ expected: 65, missing: [] })).toEqual({
      state: 'ready',
      expected: 65,
    });
  });

  it('is incomplete with the number of missing files', () => {
    expect(classifyReadiness({ expected: 65, missing: ['a.js', 'b.css'] })).toEqual({
      state: 'incomplete',
      expected: 65,
      missing: 2,
    });
  });
});
