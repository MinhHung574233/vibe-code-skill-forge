import type { Color, PieceSymbol } from 'chess.js';
import { t } from '@/i18n/core';

/**
 * English wording that is chosen at render time. The constants hold English only (they run at
 * import); `t()` is applied where the text is shown, so a language change re-renders correctly.
 */

export const sideName = (color: Color): string => (color === 'w' ? t('White') : t('Black'));

/** Spoken name of a square's occupant, one whole phrase per piece so word order can differ. */
export const OCCUPANT_KEYS: Readonly<Record<`${Color}${PieceSymbol}`, string>> = {
  wp: '{square}, white pawn',
  wn: '{square}, white knight',
  wb: '{square}, white bishop',
  wr: '{square}, white rook',
  wq: '{square}, white queen',
  wk: '{square}, white king',
  bp: '{square}, black pawn',
  bn: '{square}, black knight',
  bb: '{square}, black bishop',
  br: '{square}, black rook',
  bq: '{square}, black queen',
  bk: '{square}, black king',
};

export const EMPTY_SQUARE_KEY = '{square}, empty';

/** The words that follow a game result ("You lost" ... "by resignation."). */
export const REASON_KEYS: Readonly<Record<string, string>> = {
  resignation: 'by resignation',
  checkmate: 'by checkmate',
  stalemate: 'by stalemate',
  'threefold repetition': 'by threefold repetition',
  'fifty-move rule': 'by fifty-move rule',
  'insufficient material': 'by insufficient material',
};

export function reasonText(reason: string): string {
  const key = REASON_KEYS[reason];
  return key !== undefined ? t(key) : t('by {reason}', { reason });
}
