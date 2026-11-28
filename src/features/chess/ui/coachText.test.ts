import { afterEach, describe, expect, it } from 'vitest';
import { setLanguagePreference } from '@/i18n/core';
import { GRADES, type MoveAnalysis, type Plan, type Reason } from '../domain/coach';
import { analysisLines, gradeLabel, pieceName, planSentence, suggestionLines } from './coachText';

afterEach(() => setLanguagePreference('en'));

const base: MoveAnalysis = {
  playedUci: 'g2g4',
  playedSan: 'g4',
  bestUci: 'g1f3',
  bestSan: 'Nf3',
  bestScore: 20,
  playedScore: -150,
  bestMate: null,
  playedMate: null,
  lossCp: 170,
  grade: 'mistake',
  reasons: [],
  plan: null,
  depth: 6,
};

const REASONS: Reason[] = [
  { code: 'allowsMate', moves: 2, reply: 'Qh4#' },
  { code: 'hangs', piece: 'n', square: 'f3', reply: 'Bxf3' },
  { code: 'missedMate', moves: 1 },
  { code: 'missedWin', piece: 'q' },
  { code: 'evalDrop', pawns: 1.3 },
];
const PLANS: Plan[] = [
  { kind: 'mate', moves: 3 },
  { kind: 'capture', piece: 'r', check: false },
  { kind: 'capture', piece: 'q', check: true },
  { kind: 'line', pawns: 3 },
];

const sample = (reason: Reason | undefined, plan: Plan | null, grade = base.grade): string[] =>
  analysisLines({ ...base, grade, reasons: reason ? [reason] : [], plan });

const suggestion = { bestUci: 'g1f3', bestSan: 'Nf3', score: 0, mate: null, depth: 6 };

describe('coach sentences', () => {
  it('writes the concrete facts into English sentences', () => {
    expect(sample(REASONS[1], null)).toEqual([
      'Your knight on f3 can be captured by Bxf3.',
      'A better move was Nf3.',
    ]);
    expect(sample(REASONS[0], null)[0]).toBe('This allows mate in 2. The engine would reply Qh4#.');
    expect(sample(REASONS[2], PLANS[0] ?? null)).toEqual([
      'You missed mate in 1.',
      'A better move was Nf3.',
    ]);
    expect(sample(REASONS[3], PLANS[1] ?? null)).toEqual([
      'You missed a chance to win a queen.',
      'A better move was Nf3.',
    ]);
    expect(sample(REASONS[4], null)).toEqual([
      'This gives up about 1.3 pawns of advantage compared with Nf3.',
    ]);
  });

  it('says what the better move achieves, with the check when there is one', () => {
    expect(planSentence(PLANS[0] as Plan, 'Ra8#')).toBe('Ra8# gives mate in 3.');
    expect(planSentence(PLANS[1] as Plan, 'Rxd5')).toBe('Rxd5 wins a rook.');
    expect(planSentence(PLANS[2] as Plan, 'Rxd5+')).toBe('Rxd5+ gives check and wins a queen.');
    expect(planSentence(PLANS[3] as Plan, 'Nc7+')).toBe(
      'In the engine’s main line, Nc7+ comes out about 3 pawns ahead.',
    );
    expect(sample(REASONS[1], PLANS[3] ?? null)).toEqual([
      'Your knight on f3 can be captured by Bxf3.',
      'A better move was Nf3.',
      'In the engine’s main line, Nf3 comes out about 3 pawns ahead.',
    ]);
  });

  it('keeps encouragement short for good and best moves', () => {
    expect(sample(undefined, null, 'best')).toEqual(['The engine agrees with your move.']);
    expect(sample(undefined, null, 'good')).toEqual([
      'A solid move. The engine slightly prefers Nf3.',
    ]);
  });

  it('suggests a move, with a plain line when there is no tactic to name', () => {
    expect(suggestionLines({ ...suggestion, plan: null })).toEqual([
      'Try Nf3.',
      'It is the engine’s top choice in this position.',
    ]);
    expect(suggestionLines({ ...suggestion, plan: PLANS[0] ?? null })[1]).toBe(
      'Nf3 gives mate in 3.',
    );
  });

  it('is fully translated: no English left over and no unfilled placeholder, in either language', () => {
    const texts = (): string[] => [
      ...GRADES.map(gradeLabel),
      ...(['p', 'n', 'b', 'r', 'q', 'k'] as const).map(pieceName),
      ...REASONS.flatMap((r) => sample(r, null)),
      ...PLANS.map((p) => planSentence(p, 'Qxd5')),
      ...PLANS.flatMap((p) => sample(REASONS[1], p)),
      ...sample(undefined, null, 'best'),
      ...sample(undefined, null, 'good'),
      ...suggestionLines({ ...suggestion, plan: null }),
    ];
    setLanguagePreference('en');
    const english = texts();
    setLanguagePreference('vi');
    const vietnamese = texts();
    expect(vietnamese).toHaveLength(english.length);
    vietnamese.forEach((text, i) => {
      expect(text).not.toMatch(/[{}]/);
      // a few lines hold only a move ("Bxf3 ..."), the rest must differ from English
      if (!/^[A-Za-z0-9+#=-]+$/.test(english[i] ?? '')) expect(text).not.toBe(english[i]);
    });
    // moves stay in algebraic notation inside the Vietnamese sentence
    expect(vietnamese.join(' ')).toContain('Bxf3');
  });
});
