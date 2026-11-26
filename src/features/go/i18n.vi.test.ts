import { afterEach, describe, expect, it } from 'vitest';
import { setLanguagePreference, t } from '@/i18n/core';
import { missingTranslations } from '@/i18n/testing';
import { describeResult } from './domain/stats';
import { TSUMEGO_PROBLEMS } from './domain/tsumego';
import { categoryLabel, objectiveText, type TsumegoCategory } from './domain/tsumegoTypes';
import { colorName, levelLabel, resultNotation } from './ui/labels';

afterEach(() => setLanguagePreference('en'));

describe('Go in Vietnamese', () => {
  it('translates every tsumego title, explanation and refutation reason', () => {
    const texts = TSUMEGO_PROBLEMS.flatMap((p) => [
      p.title,
      p.explanation,
      ...p.refutations.map((r) => r.why),
    ]);
    expect(texts.length).toBeGreaterThan(60);
    expect(missingTranslations(texts)).toEqual([]);
  });

  it('translates the fallback hint and the category names', () => {
    const categories: TsumegoCategory[] = [
      'vital-point',
      'two-eyes',
      'false-eye',
      'corner',
      'race',
    ];
    setLanguagePreference('vi');
    for (const c of categories) expect(categoryLabel(c)).not.toBe(c);
    expect(
      missingTranslations(['That is not the key move. Look for the point that decides the fight.']),
    ).toEqual([]);
  });

  it('renders problem text in Vietnamese and leaves English untouched', () => {
    const first = TSUMEGO_PROBLEMS[0];
    if (!first) throw new Error('no problems');
    expect(t(first.title)).toBe('Straight three: kill');
    expect(objectiveText(first)).toBe('White to play and kill the group with the triangle');
    setLanguagePreference('vi');
    expect(t(first.title)).toBe('Ba thẳng: giết');
    expect(objectiveText(first)).toBe('Trắng đi và giết nhóm quân có hình tam giác');
  });

  it('translates labels and result lines', () => {
    setLanguagePreference('vi');
    expect(levelLabel('hard')).toBe('Khó');
    expect(colorName(1)).toBe('Đen');
    expect(colorName(2)).toBe('Trắng');
    expect(describeResult({ result: 'win', margin: 3.5, by: 'score' })).toBe('Thắng cách biệt 3.5');
    expect(describeResult({ result: 'loss', margin: -12, by: 'score' })).toBe('Thua cách biệt 12');
    expect(describeResult({ result: 'win', margin: 0, by: 'resign' })).toBe(
      'Thắng do đối thủ xin thua',
    );
    expect(resultNotation('B+3.5')).toBe('B+3.5');
    expect(resultNotation('Draw')).toBe('Hòa');
    expect(t('{count} stones', { count: 4 })).toBe('4 quân');
  });
});
