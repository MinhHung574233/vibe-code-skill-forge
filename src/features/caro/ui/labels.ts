import { t } from '@/i18n/core';
import type { Level } from '../domain/ai/levels';
import type { Outcome } from '../domain/play';

/** Where the lead mounts the module (route `practice/caro/*`). */
export const CARO_HOME = '/practice/caro';
export const CARO_PLAY = `${CARO_HOME}/play`;

/** Translated at call time (render), never at import. */
export function levelLabel(level: Level): string {
  switch (level) {
    case 'easy':
      return t('Easy');
    case 'medium':
      return t('Medium');
    case 'hard':
      return t('Hard');
  }
}

/** What each level really does (kept honest: see LEVEL_CONFIG). */
export function levelNote(level: Level): string {
  switch (level) {
    case 'easy':
      return t('Looks two moves ahead and sometimes plays a weaker move. Undo is allowed.');
    case 'medium':
      return t('Searches several moves ahead and finds forcing wins. No undo.');
    case 'hard':
      return t('Searches deepest, up to about a second per move. No undo.');
  }
}

export function outcomeLabel(outcome: Outcome): string {
  switch (outcome) {
    case 'win':
      return t('Win');
    case 'loss':
      return t('Loss');
    case 'draw':
      return t('Draw');
  }
}
