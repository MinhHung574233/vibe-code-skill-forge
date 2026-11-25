import { describe, expect, it } from 'vitest';
import { cellIndex, centerIndex, colOf, isBoardSize, otherStone, rowOf } from './board';

describe('board model', () => {
  it('maps rows and columns to flat indexes and back', () => {
    expect(cellIndex(15, 7, 8)).toBe(113);
    expect(rowOf(15, 113)).toBe(7);
    expect(colOf(15, 113)).toBe(8);
    expect(centerIndex(15)).toBe(cellIndex(15, 7, 7));
    expect(centerIndex(9)).toBe(cellIndex(9, 4, 4));
  });

  it('only accepts the supported sizes', () => {
    expect(isBoardSize(15)).toBe(true);
    expect(isBoardSize(9)).toBe(true);
    expect(isBoardSize(13)).toBe(false);
  });

  it('alternates stones', () => {
    expect(otherStone(1)).toBe(2);
    expect(otherStone(2)).toBe(1);
  });
});
