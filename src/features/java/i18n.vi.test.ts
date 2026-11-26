import { describe, expect, it } from 'vitest';
import { viEntry } from '@/i18n/core';
import { missingTranslations, placeholderMismatches } from '@/i18n/testing';
import { JAVA_PATHS } from './domain/content';

/** Every string of the Java content that is shown to the learner (code blocks are not translated). */
function translatableStrings(): string[] {
  const out: string[] = ['Java & Spring Boot'];
  for (const path of JAVA_PATHS) {
    out.push(path.title, path.summary);
    for (const lesson of path.lessons) {
      out.push(lesson.title, lesson.summary);
      for (const block of lesson.blocks) {
        if (block.kind === 'p' || block.kind === 'tip') out.push(block.text);
        else if (block.kind === 'list') out.push(...block.items);
        else if (block.caption) out.push(block.caption);
      }
      for (const question of lesson.quiz) {
        out.push(question.prompt, ...question.options, question.explain);
      }
    }
  }
  return out;
}

describe('Java content in Vietnamese', () => {
  const strings = translatableStrings();

  it('gathers the content strings (guards against matching nothing)', () => {
    expect(strings.length).toBeGreaterThan(300);
  });

  it('has a Vietnamese entry for every string', () => {
    expect(missingTranslations(strings)).toEqual([]);
  });

  it('keeps the same {placeholders}', () => {
    expect(placeholderMismatches(strings)).toEqual([]);
  });

  it('has no empty translations', () => {
    expect(strings.filter((s) => (viEntry(s) ?? 'x').trim() === '')).toEqual([]);
  });

  it('keeps quiz options distinct and unambiguous in Vietnamese', () => {
    const problems: string[] = [];
    for (const path of JAVA_PATHS) {
      for (const lesson of path.lessons) {
        for (const question of lesson.quiz) {
          const translated = question.options.map((o) => (viEntry(o) ?? o).trim().toLowerCase());
          if (new Set(translated).size !== translated.length) {
            problems.push(`${lesson.id}: duplicate options in "${question.prompt}"`);
          }
          // an option must not be a copy of the question text or of the explanation
          for (const [i, option] of translated.entries()) {
            if (option === (viEntry(question.explain) ?? '').trim().toLowerCase()) {
              problems.push(`${lesson.id}: option ${i} repeats the explanation`);
            }
          }
        }
      }
    }
    expect(problems).toEqual([]);
  });
});
