import { t } from '@/i18n/core';
import { BLACK, WHITE, boardFromRows, type Board, type Color } from './board';

/** Which sides of a drawing are real board edges (the others run off the diagram). */
export interface BoardEdges {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

export type TsumegoCategory =
  | 'vital-point' // kill with the vital point
  | 'two-eyes' // make two eyes
  | 'false-eye'
  | 'corner' // live or kill in the corner
  | 'race'; // capturing race (semeai)

export const CATEGORY_LABELS: Readonly<Record<TsumegoCategory, string>> = {
  'vital-point': 'Vital point',
  'two-eyes': 'Two eyes',
  'false-eye': 'False eye',
  corner: 'Corner',
  race: 'Capturing race',
};

/** The category name in the current language (call at render time). */
export function categoryLabel(category: TsumegoCategory): string {
  switch (category) {
    case 'vital-point':
      return t('Vital point');
    case 'two-eyes':
      return t('Two eyes');
    case 'false-eye':
      return t('False eye');
    case 'corner':
      return t('Corner');
    case 'race':
      return t('Capturing race');
  }
}

/** `capture` is the capturing race: capture the target group before your `protect` stone is taken. */
export type Objective = 'live' | 'kill' | 'capture';

/** A point in the diagram, `[column, row]`, counted from the top-left of `rows`. */
export type Pt = readonly [x: number, y: number];

export interface Refutation {
  move: Pt;
  /** Why the tempting move fails, in plain words. Machine-checked: the move is proved to fail. */
  why: string;
}

export interface TsumegoProblem {
  id: string;
  title: string;
  category: TsumegoCategory;
  /** 1 (first lessons) to 5 (hard). */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /**
   * Diagram: `.` empty, `X` black, `O` white, `#` outside the problem. Everything outside the
   * playable points counts as a wall for both sides; the diagram is the whole fight.
   */
  rows: readonly string[];
  /** The real board size this diagram is cut from (display only; the rules run on `rows`). */
  boardSize: 9 | 19;
  /** Sides of the diagram that are real board edges (the others are cropped from a bigger board). */
  edges: BoardEdges;
  toPlay: 'black' | 'white';
  objective: Objective;
  /** A stone of the group the objective is about. */
  target: Pt;
  /** Capturing races: a stone of the side to play that must not be captured first. */
  protect?: Pt;
  /** EVERY first move that achieves the objective (verified exhaustively in the tests). */
  solutions: readonly Pt[];
  /** Tempting wrong moves, each proved to fail. */
  refutations: readonly Refutation[];
  /** Search limit (plies, counting the first move) within which the answer was verified. */
  depth: number;
  explanation: string;
}

export const colorOf = (p: TsumegoProblem): Color => (p.toPlay === 'black' ? BLACK : WHITE);

export function problemBoard(problem: TsumegoProblem): Board {
  return boardFromRows(problem.rows);
}

export const pointIndex = (problem: TsumegoProblem, [x, y]: Pt): number =>
  y * (problem.rows[0]?.length ?? 0) + x;

export const sameMove = (a: Pt, b: Pt): boolean => a[0] === b[0] && a[1] === b[1];

/** "Black to play and live", "White to play and kill", "Black to play and win the race". */
export function objectiveText(problem: TsumegoProblem): string {
  const black = problem.toPlay === 'black';
  if (problem.objective === 'live') {
    return black ? t('Black to play and live') : t('White to play and live');
  }
  if (problem.objective === 'kill') {
    return black
      ? t('Black to play and kill the group with the triangle')
      : t('White to play and kill the group with the triangle');
  }
  return black
    ? t('Black to play and win the capturing race')
    : t('White to play and win the capturing race');
}
