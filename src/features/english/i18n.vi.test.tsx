import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { setLanguagePreference } from '@/i18n/core';
import { missingTranslations } from '@/i18n/testing';
import { renderAt, setupAppDatabase } from '@/test/appHarness';
import { TOPIC_LABELS, WORDS } from './domain/vocabulary';

setupAppDatabase('english-i18n-test');

afterEach(() => setLanguagePreference('en'));

describe('English module in Vietnamese', () => {
  it('has a Vietnamese entry for every topic label and part of speech', () => {
    const labels = Object.values(TOPIC_LABELS);
    const parts = new Set(WORDS.map((w) => w.pos));
    expect(missingTranslations([...labels, ...parts])).toEqual([]);
  });

  it('translates the home screen', async () => {
    setLanguagePreference('vi');
    renderAt('/practice/english');
    expect(await screen.findByText('0 thẻ cần ôn, 10 từ mới.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Bắt đầu ôn tập' })).toBeInTheDocument();
  });

  it('keeps the teaching material in English and shows the Vietnamese meaning after reveal', async () => {
    setLanguagePreference('vi');
    renderAt('/practice/english/review');
    const first = WORDS[0]!;
    expect(await screen.findByRole('heading', { name: first.term })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Hiện đáp án' }));
    expect(screen.getByText(first.definition)).toBeInTheDocument();
    expect(screen.getByText(first.example, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(first.vi, { exact: false })).toBeInTheDocument();
  });

  it('translates topic chips on the words screen', async () => {
    setLanguagePreference('vi');
    renderAt('/practice/english/words');
    expect(await screen.findByRole('button', { name: 'Bảo mật' })).toBeInTheDocument();
    expect(screen.getByLabelText('Tìm kiếm')).toBeInTheDocument();
  });

  it('shows the Vietnamese meaning of each option after answering a quiz question', async () => {
    setLanguagePreference('vi');
    renderAt('/practice/english/quiz');
    expect(await screen.findByText('Câu hỏi 1/10')).toBeInTheDocument();
    const group = screen.getByRole('group', { name: 'Đáp án' });
    const buttons = group.querySelectorAll('button');
    const firstButton = buttons[0]!;
    const term = firstButton.textContent ?? '';
    const word = WORDS.find((w) => w.term === term);
    await userEvent.click(firstButton);
    expect(word).toBeDefined();
    expect(firstButton.textContent).toContain(word!.vi);
  });
});
