import { BASICS } from './chapters/basics';
import { BEAT_THE_APP } from './chapters/beatTheApp';
import { COMBINATIONS } from './chapters/combinations';
import { DEFENCE } from './chapters/defence';
import { OBSTACLES } from './chapters/obstacles';
import { OPENINGS } from './chapters/openings';
import { RULES } from './chapters/rules';
import { SHAPES } from './chapters/shapes';
import type { Chapter, Diagram, Exercise } from './types';

/**
 * The handbook text, diagrams and exercises. The English here is the source (and the translation
 * key): every string is passed through `t()` where it is shown, and has a Vietnamese entry in
 * `src/i18n/vi/caroHandbook.ts`. `content.test.ts` proves the diagrams and exercises with the
 * real rules.
 */
export const CHAPTERS: readonly Chapter[] = [
  BASICS,
  RULES,
  SHAPES,
  COMBINATIONS,
  DEFENCE,
  OPENINGS,
  OBSTACLES,
  BEAT_THE_APP,
];

/** What the symbols in a diagram mean, drawn once on the chapter list. */
export const LEGEND_DIAGRAM: Diagram = {
  id: 'legend',
  pattern: true,
  rows: ['XO#....'],
  marks: [
    { at: [0, 3], kind: 'move', label: 'A' },
    { at: [0, 4], kind: 'win' },
    { at: [0, 5], kind: 'end' },
    { at: [0, 6], kind: 'key' },
  ],
  caption: 'The symbols used in the diagrams.',
};

export const LEGEND_ITEMS: readonly string[] = [
  'Filled stone: the first player.',
  'Hollow stone: the second player.',
  'Hatched square: an obstacle. Nobody can play there.',
  'Dashed square with a letter: a square to look at, or a suggested move.',
  'Green ring: part of a winning line.',
  'Red cross: an end square of a row that decides if a five wins.',
  'Dot: a square that matters.',
  'Thick line: the real edge of the board. If there is none, the board goes on beyond the picture and the squares you cannot see are empty.',
];

export function chapterExercises(chapter: Chapter): Exercise[] {
  return chapter.blocks.flatMap((block) => (block.kind === 'exercise' ? [block.exercise] : []));
}

export function chapterDiagrams(chapter: Chapter): Diagram[] {
  return chapter.blocks.flatMap((block) => (block.kind === 'diagram' ? [block.diagram] : []));
}

export const ALL_EXERCISES: readonly Exercise[] = CHAPTERS.flatMap(chapterExercises);
export const ALL_DIAGRAMS: readonly Diagram[] = [
  LEGEND_DIAGRAM,
  ...CHAPTERS.flatMap(chapterDiagrams),
];

/** Every English string that the screen translates, for the content test. */
export function handbookStrings(): string[] {
  const out: string[] = [LEGEND_DIAGRAM.caption, ...LEGEND_ITEMS];
  for (const chapter of CHAPTERS) {
    out.push(chapter.title, chapter.summary);
    for (const block of chapter.blocks) {
      switch (block.kind) {
        case 'p':
        case 'h':
        case 'tip':
          out.push(block.text);
          break;
        case 'list':
          out.push(...block.items);
          break;
        case 'diagram':
          out.push(block.diagram.caption);
          break;
        case 'exercise':
          out.push(
            block.exercise.prompt,
            block.exercise.because,
            block.exercise.otherWrong,
            ...block.exercise.wrong.map((w) => w.why),
          );
          break;
      }
    }
  }
  return out;
}
