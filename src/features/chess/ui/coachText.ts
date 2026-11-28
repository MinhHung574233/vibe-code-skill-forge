import type { PieceSymbol } from 'chess.js';
import { t } from '@/i18n/core';
import type { MoveAnalysis, MoveGrade, MoveSuggestion, Plan, Reason } from '../domain/coach';

/**
 * Turns the coach's structured findings into sentences. Every sentence is one whole `t()` key with
 * {placeholders}; pieces and moves are filled in, never concatenated, so Vietnamese word order is
 * free. Moves are algebraic notation (SAN) and are not translated.
 */

export function pieceName(piece: PieceSymbol): string {
  switch (piece) {
    case 'p':
      return t('pawn');
    case 'n':
      return t('knight');
    case 'b':
      return t('bishop');
    case 'r':
      return t('rook');
    case 'q':
      return t('queen');
    case 'k':
      return t('king');
  }
}

export function gradeLabel(grade: MoveGrade): string {
  switch (grade) {
    case 'best':
      return t('Best move');
    case 'good':
      return t('Good move');
    case 'inaccuracy':
      return t('Inaccuracy');
    case 'mistake':
      return t('Mistake');
    case 'blunder':
      return t('Blunder');
  }
}

function reasonSentence(reason: Reason, bestSan: string): string {
  switch (reason.code) {
    case 'allowsMate':
      return t('This allows mate in {n}. The engine would reply {reply}.', {
        n: reason.moves,
        reply: reason.reply,
      });
    case 'hangs':
      return t('Your {piece} on {square} can be captured by {reply}.', {
        piece: pieceName(reason.piece),
        square: reason.square,
        reply: reason.reply,
      });
    case 'missedMate':
      return t('You missed mate in {n}.', { n: reason.moves });
    case 'missedWin':
      return t('You missed a chance to win a {piece}.', { piece: pieceName(reason.piece) });
    case 'evalDrop':
      return t('This gives up about {pawns} pawns of advantage compared with {move}.', {
        pawns: reason.pawns.toFixed(1),
        move: bestSan,
      });
  }
}

/** What the best move achieves, as a sentence about `move`. */
export function planSentence(plan: Plan, move: string): string {
  switch (plan.kind) {
    case 'mate':
      return t('{move} gives mate in {n}.', { move, n: plan.moves });
    case 'capture':
      return plan.check
        ? t('{move} gives check and wins a {piece}.', { move, piece: pieceName(plan.piece) })
        : t('{move} wins a {piece}.', { move, piece: pieceName(plan.piece) });
    case 'line':
      return t('In the engine’s main line, {move} comes out about {pawns} pawns ahead.', {
        move,
        pawns: plan.pawns,
      });
  }
}

/** The advice for one graded move: one short line per idea, at most three. */
export function analysisLines(a: MoveAnalysis): string[] {
  if (a.grade === 'best') return [t('The engine agrees with your move.')];
  if (a.grade === 'good') {
    return [t('A solid move. The engine slightly prefers {move}.', { move: a.bestSan })];
  }
  const reason = a.reasons[0];
  const lines: string[] = [];
  if (reason) lines.push(reasonSentence(reason, a.bestSan));
  // the evaluation sentence already names the better move; the missed-win sentences already
  // say what it achieves
  if (reason?.code !== 'evalDrop') lines.push(t('A better move was {move}.', { move: a.bestSan }));
  if (a.plan && reason?.code !== 'missedMate' && reason?.code !== 'missedWin') {
    lines.push(planSentence(a.plan, a.bestSan));
  }
  return lines;
}

export function suggestionLines(s: MoveSuggestion): string[] {
  return [
    t('Try {move}.', { move: s.bestSan }),
    s.plan ? planSentence(s.plan, s.bestSan) : t('It is the engine’s top choice in this position.'),
  ];
}
