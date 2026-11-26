import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { setLanguagePreference, t } from '@/i18n/core';
import { missingTranslations } from '@/i18n/testing';
import { renderAt, setupAppDatabase } from '@/test/appHarness';
import { ALGORITHMS } from './domain/algorithms';

setupAppDatabase('rubik-i18n-test');

afterEach(() => setLanguagePreference('en'));

describe('Rubik in Vietnamese', () => {
  it('has a Vietnamese entry for every algorithm name and description', () => {
    const strings = ALGORITHMS.flatMap((a) => [a.name, a.recognise]);
    expect(missingTranslations(strings)).toEqual([]);
  });

  it('keeps cube notation untouched and translates the descriptions', () => {
    setLanguagePreference('vi');
    const sune = ALGORITHMS.find((a) => a.id === 'oll-sune');
    expect(sune).toBeDefined();
    expect(t(sune!.name)).toBe('Sune');
    expect(t(sune!.recognise)).toMatch(/góc/);
    expect(sune!.moves).toBe("R U R' U R U2 R'");
    const tPerm = ALGORITHMS.find((a) => a.id === 'pll-t');
    expect(t(tPerm!.name)).toBe('T perm');
  });

  it('shows the timer screen in Vietnamese', async () => {
    setLanguagePreference('vi');
    renderAt('/practice/rubik');
    expect(await screen.findByText('Xáo trộn')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Xáo trộn mới' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Đồng hồ bấm giờ/ })).toBeInTheDocument();
    expect(screen.getByText('Chạm và giữ, rồi thả ra để bắt đầu')).toBeInTheDocument();
  });

  it('shows the algorithm trainer in Vietnamese', async () => {
    setLanguagePreference('vi');
    renderAt('/practice/rubik/algorithms');
    expect(await screen.findByText('Công thức', { selector: 'h1, h2' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Đang học' }).length).toBeGreaterThan(0);
  });
});
