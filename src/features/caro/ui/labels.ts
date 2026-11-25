import type { Level } from '../domain/ai/levels';
import type { Outcome } from '../domain/play';

/** Where the lead mounts the module (route `practice/caro/*`). */
export const CARO_HOME = '/practice/caro';
export const CARO_PLAY = `${CARO_HOME}/play`;

export const LEVEL_LABEL: Record<Level, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

/** What each level really does (kept honest: see LEVEL_CONFIG). */
export const LEVEL_NOTE: Record<Level, string> = {
  easy: 'Looks two moves ahead and sometimes plays a weaker move. Undo is allowed.',
  medium: 'Searches several moves ahead and finds forcing wins. No undo.',
  hard: 'Searches deepest, up to about a second per move. No undo.',
};

export const OUTCOME_LABEL: Record<Outcome, string> = {
  win: 'Win',
  loss: 'Loss',
  draw: 'Draw',
};
