import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { setLanguagePreference, t } from '@/i18n/core';
import { missingTranslations, placeholderMismatches } from '@/i18n/testing';
import { OPENINGS } from './domain/openings';
import { PUZZLES, THEME_LABELS } from './domain/puzzles';
import { EMPTY_SQUARE_KEY, OCCUPANT_KEYS, REASON_KEYS, reasonText } from './ui/labels';
import { OpeningsList } from './ui/OpeningsScreen';

afterEach(() => {
  cleanup();
  setLanguagePreference('en');
});

/** English strings that the UI passes to `t()` through a variable, so the scanner cannot see them. */
const DYNAMIC_KEYS = [
  'Easy',
  'Medium',
  'Hard',
  'White',
  'Black',
  'Random',
  'Queen',
  'Rook',
  'Bishop',
  'Knight',
  'You won',
  'You lost',
  'Draw',
  'Searches several moves deep for up to 0.7 seconds a move. Punishes simple blunders.',
  'Looks two moves ahead and sometimes plays a slightly weaker move. Good for learning.',
  'Searches as deep as it can in 1.4 seconds a move. It is a hobby-grade engine, not a master.',
  EMPTY_SQUARE_KEY,
  ...Object.values(OCCUPANT_KEYS),
  ...Object.values(REASON_KEYS),
];

describe('chess Vietnamese content', () => {
  it('translates every opening name, summary, idea and note', () => {
    const strings = OPENINGS.flatMap((o) => [
      o.name,
      o.summary,
      ...o.ideas,
      ...o.moves.flatMap((m) => (m.note ? [m.note] : [])),
    ]);
    expect(strings.length).toBeGreaterThan(100);
    expect(missingTranslations(strings)).toEqual([]);
  });

  it('translates every puzzle theme label', () => {
    const used = new Set(PUZZLES.flatMap((p) => p.themes));
    expect(used.size).toBeGreaterThan(5);
    expect(missingTranslations(Object.values(THEME_LABELS))).toEqual([]);
  });

  it('translates the strings chosen at render time', () => {
    expect(missingTranslations(DYNAMIC_KEYS)).toEqual([]);
  });

  it('keeps the placeholders of every chess entry', () => {
    const keys = [...DYNAMIC_KEYS, ...OPENINGS.map((o) => o.name)];
    expect(placeholderMismatches(keys)).toEqual([]);
  });
});

describe('chess in Vietnamese', () => {
  it('shows the game-end reasons and the spoken board names in Vietnamese', () => {
    setLanguagePreference('vi');
    expect(reasonText('checkmate')).toBe('bằng chiếu hết');
    expect(reasonText('resignation')).toBe('do xin thua');
    expect(t(OCCUPANT_KEYS.wr, { square: 'a1' })).toBe('a1, xe trắng');
  });

  it('keeps English output unchanged in English', () => {
    expect(reasonText('checkmate')).toBe('by checkmate');
    expect(t(OCCUPANT_KEYS.bn, { square: 'g8' })).toBe('g8, black knight');
  });

  it('renders the openings list in Vietnamese', () => {
    setLanguagePreference('vi');
    render(
      <MemoryRouter>
        <OpeningsList />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Khai cuộc' })).toBeInTheDocument();
    expect(screen.getByText(/Khai cuộc Ý \(Giuoco Pianissimo\)/)).toBeInTheDocument();
    expect(screen.getAllByText(/bạn chơi quân Đen/).length).toBeGreaterThan(0);
  });
});
