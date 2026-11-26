import { describe, expect, it } from 'vitest';
import { missingTranslations, placeholderMismatches } from '@/i18n/testing';
import { VI } from '@/i18n/vi';
import { TOOLS_PATHS } from './domain/content';
import { TIPS, TIP_LABELS } from './domain/tips';

/** Every English string of the Developer Tools lessons, tips and labels that the UI translates. */
function toolsStrings(): string[] {
  const out: string[] = [];
  for (const path of TOOLS_PATHS) {
    out.push(path.title, path.summary, path.level);
    for (const lesson of path.lessons) {
      out.push(lesson.title, lesson.summary);
      for (const block of lesson.blocks) {
        if (block.kind === 'p' || block.kind === 'tip') out.push(block.text);
        else if (block.kind === 'list') out.push(...block.items);
        else if (block.caption) out.push(block.caption); // code itself is never translated
      }
      for (const question of lesson.quiz) {
        out.push(question.prompt, ...question.options, question.explain);
      }
    }
  }
  for (const tip of TIPS) out.push(tip.title, tip.text); // `example` stays as typed
  out.push(...Object.values(TIP_LABELS));
  return out;
}

describe('Developer Tools in Vietnamese', () => {
  it('collects the strings (guards against matching nothing)', () => {
    expect(toolsStrings().length).toBeGreaterThan(300);
  });

  it('has a Vietnamese entry for every lesson, quiz and tip string', () => {
    expect(missingTranslations(toolsStrings())).toEqual([]);
  });

  it('keeps placeholders consistent and never leaves an entry empty', () => {
    expect(placeholderMismatches(Object.keys(VI))).toEqual([]);
    expect(Object.values(VI).filter((v) => v.trim() === '')).toEqual([]);
  });

  it('translates the headings and quiz questions rather than copying English', () => {
    const translated = toolsStrings().filter((s) => /^[A-Z][a-z]+ .*\?$/.test(s) && VI[s] === s);
    expect(translated).toEqual([]);
  });
});
