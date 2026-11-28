import { t } from '@/i18n/core';
import type { Level } from '../domain/ai/levels';
import type { Outcome } from '../domain/play';
import type { CaroRule } from '../domain/rules';
import type { VariantId } from '../domain/stats';
import { matchPreset, type PresetId } from '../domain/variant';

/** Where the lead mounts the module (route `practice/caro/*`). */
export const CARO_HOME = '/practice/caro';
export const CARO_PLAY = `${CARO_HOME}/play`;
export const CARO_HANDBOOK = `${CARO_HOME}/handbook`;

/** Column letter from the left: A, B, C ... (A to S on 19 x 19), as printed on the board. */
export const columnLetter = (col: number): string => String.fromCharCode(65 + col);

/**
 * The name of a cell the way the board prints it: column letter, then the row number counted from
 * the BOTTOM (so the top-left cell of a 15 x 15 board is A15). Used for what a screen reader says
 * and for the move list, so what is heard and what is seen always agree.
 */
export function cellName(size: number, index: number): string {
  return `${columnLetter(index % size)}${size - Math.floor(index / size)}`;
}

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

export function presetLabel(id: PresetId): string {
  switch (id) {
    case 'classic':
      return t('Classic');
    case 'vietnamese':
      return t('Vietnamese rule');
    case 'tournament':
      return t('Tournament');
  }
}

/** Name of a record category: the preset, or Other for any other combination. */
export function variantIdLabel(id: VariantId): string {
  return id === 'other' ? t('Other') : presetLabel(id);
}

export function presetNote(id: PresetId): string {
  switch (id) {
    case 'classic':
      return t('15 × 15. Five or more in a row wins.');
    case 'vietnamese':
      return t('15 × 15. A five blocked at both ends does not win.');
    case 'tournament':
      return t('19 × 19, blocked ends, and 3 blocked squares to fight around.');
  }
}

export function ruleLabel(rule: CaroRule): string {
  return rule === 'blocked' ? t('Blocked ends') : t('Free rule');
}

/** One plain sentence per rule, with a tiny example (● is a stone of yours, ○ an opponent's). */
export function ruleNote(rule: CaroRule): string {
  return rule === 'blocked'
    ? t(
        'Five or more in a row win, unless an opponent stone or a blocked square sits at both ends. Example: ○●●●●●○ does not win, but ○●●●●● does. The edge of the board does not block.',
      )
    : t(
        'Five or more in a row win, even with an opponent stone at both ends. Example: ○●●●●●○ wins.',
      );
}

export function obstacleNote(rule: CaroRule): string {
  return rule === 'blocked'
    ? t(
        'Blocked squares are dark: nobody can play there, no line can pass through them, and they count as a block at the end of a line.',
      )
    : t('Blocked squares are dark: nobody can play there and no line can pass through them.');
}

export function obstacleChoiceLabel(count: number): string {
  return count === 0 ? t('None') : t('{count} squares', { count });
}

/** Short name of the variant: the preset it equals, else the rule and the blocked squares. */
export function variantLabel(variant: { size: number; rule: CaroRule; obstacles: number }): string {
  const preset = matchPreset(variant.size, variant.rule, variant.obstacles);
  if (preset) return presetLabel(preset);
  return variant.obstacles > 0
    ? t('{rule} · {count} blocked squares', {
        rule: ruleLabel(variant.rule),
        count: variant.obstacles,
      })
    : ruleLabel(variant.rule);
}

/** The classic game needs no extra words in history lists. */
export const isClassicVariant = (variant: { rule: CaroRule; obstacles: number }): boolean =>
  variant.rule === 'freestyle' && variant.obstacles === 0;
