import { cleanup, render, screen } from '@testing-library/react';
import Dexie from 'dexie';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { bootDatabase, closeActiveDb } from '@/db/boot';
import { memoryMarkerStore } from '@/db/testing';
import { setLanguagePreference, t } from '@/i18n/core';
import { missingTranslations } from '@/i18n/testing';
import { CaroModule } from './ui/CaroModule';
import {
  cellName,
  levelLabel,
  levelNote,
  obstacleChoiceLabel,
  obstacleNote,
  outcomeLabel,
  presetLabel,
  presetNote,
  ruleLabel,
  ruleNote,
  variantLabel,
} from './ui/labels';

const DB = 'caro-i18n-test';

beforeEach(async () => {
  window.localStorage.clear();
  const outcome = await bootDatabase({
    name: DB,
    snapshotName: `${DB}-snap`,
    markerStore: memoryMarkerStore(),
  });
  if (outcome.status !== 'ready') throw new Error('test database failed to boot');
});

afterEach(async () => {
  cleanup();
  setLanguagePreference('en');
  closeActiveDb();
  await Dexie.delete(DB);
  await Dexie.delete(`${DB}-snap`);
});

describe('Caro in Vietnamese', () => {
  it('renders the home screen in Vietnamese', async () => {
    setLanguagePreference('vi');
    const router = createMemoryRouter(
      [
        { path: '/practice', element: <p>Practice hub</p> },
        { path: '/practice/caro/*', element: <CaroModule /> },
      ],
      { initialEntries: ['/practice/caro'] },
    );
    render(<RouterProvider router={router} />);
    expect(await screen.findByText('Chưa có ván nào')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bắt đầu ván' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Dễ' })).toBeInTheDocument();
    expect(screen.queryByText('Start game')).not.toBeInTheDocument();
  });

  it('has an entry for every label, note and saving message', () => {
    const levels = ['easy', 'medium', 'hard'] as const;
    const outcomes = ['win', 'loss', 'draw'] as const;
    setLanguagePreference('vi');
    for (const level of levels) {
      expect(levelLabel(level)).not.toBe(level);
      expect(levelNote(level)).not.toMatch(/^(Looks|Searches)/);
    }
    for (const outcome of outcomes) expect(outcomeLabel(outcome)).not.toMatch(/^(Win|Loss|Draw)$/);
    expect(
      missingTranslations([
        'The engine failed.',
        'The game is not finished.',
        'Could not save the game result. Try again.',
        'Could not clear the saved game. Try again.',
      ]),
    ).toEqual([]);
    expect(t('{n}. {who}: {cell}', { n: 1, who: 'Bạn', cell: cellName(15, 7 * 15 + 4) })).toBe(
      '1. Bạn: E8',
    );
    // what a screen reader says for a cell: the printed coordinate, then the translated state
    expect(t('{cell}, {who}', { cell: cellName(15, 3 * 15 + 10), who: t('empty') })).toBe(
      'K12, trống',
    );
  });

  it('names the presets, rules and blocked squares in Vietnamese', () => {
    setLanguagePreference('vi');
    expect(presetLabel('classic')).toBe('Cổ điển');
    expect(presetLabel('tournament')).toBe('Thi đấu');
    expect(ruleLabel('blocked')).toBe('Chặn hai đầu');
    expect(obstacleChoiceLabel(0)).toBe('Không');
    expect(obstacleChoiceLabel(3)).toBe('3 ô');
    expect(variantLabel({ size: 19, rule: 'blocked', obstacles: 3 })).toBe('Thi đấu');
    expect(variantLabel({ size: 15, rule: 'blocked', obstacles: 3 })).toBe(
      'Chặn hai đầu · 3 ô bị khóa',
    );
    for (const text of [
      presetNote('classic'),
      presetNote('vietnamese'),
      presetNote('tournament'),
      ruleNote('freestyle'),
      ruleNote('blocked'),
      obstacleNote('freestyle'),
      obstacleNote('blocked'),
    ]) {
      expect(text).toMatch(/[ạảãàáâấầẩẫăắằẳẵêếềểễôốồổỗơớờởỡưứừửữđ]|Năm|Ô/);
    }
    expect(
      missingTranslations([
        'Game type',
        'Advanced',
        'Rule',
        'Blocked squares',
        'blocked square',
        'That five is blocked at both ends, so the game goes on.',
      ]),
    ).toEqual([]);
  });
});
