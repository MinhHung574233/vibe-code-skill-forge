import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import { ErrorState } from '@/components/ErrorState';
import { describeNudge } from '@/features/settings/domain/backupNudge';
import { PracticeScreen } from '@/features/practice/ui/PracticeScreen';
import { setLanguagePreference, t } from '@/i18n/core';
import { formatAgeDays, formatDayLabel } from '@/utils/format';
import { TABS } from './tabs';
import { RecoveryScreen } from './RecoveryScreen';

afterEach(() => setLanguagePreference('en'));

describe('Vietnamese shell', () => {
  it('has a translation for every tab label', () => {
    setLanguagePreference('vi');
    expect(TABS.map((tab) => t(tab.label))).toEqual([
      'Trang chủ',
      'Kỹ năng',
      'Luyện tập',
      'Tiến độ',
      'Cài đặt',
    ]);
  });

  it('translates the recovery screen title, message actions and dialog', () => {
    setLanguagePreference('vi');
    render(
      <RecoveryScreen
        reason="open-failed"
        message="x"
        hasSnapshot
        onRetry={() => undefined}
        onRestoreSnapshot={() => Promise.resolve()}
        onAcceptEmpty={() => undefined}
        onResetAll={() => Promise.resolve()}
        onImported={() => undefined}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Không thể mở dữ liệu của bạn' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Khôi phục từ tệp sao lưu' })).toBeTruthy();
  });

  it('translates shared components and the practice hub', () => {
    setLanguagePreference('vi');
    render(<ErrorState message="m" onRetry={() => undefined} />);
    expect(screen.getByText('Đã xảy ra lỗi')).toBeTruthy();
    render(
      <MemoryRouter>
        <PracticeScreen />
      </MemoryRouter>,
    );
    expect(screen.getAllByText('Luyện tập').length).toBeGreaterThan(0);
    expect(screen.getByText('Các module luyện tập')).toBeTruthy();
    expect(screen.getByText('Thế cờ, khai cuộc, điểm xếp hạng')).toBeTruthy();
  });

  it('translates formatted words and backup reminders', () => {
    setLanguagePreference('vi');
    const now = Date.UTC(2026, 10, 26, 12);
    expect(formatAgeDays(now, now)).toBe('hôm nay');
    expect(formatAgeDays(now - 5 * 86_400_000, now)).toBe('5 ngày trước');
    expect(formatDayLabel('2026-11-26', '2026-11-26')).toBe('Hôm nay');
    expect(describeNudge({ kind: 'overdue', days: 20 })).toBe(
      'Lần sao lưu gần nhất của bạn cách đây 20 ngày.',
    );
  });

  it('keeps English output unchanged in English', () => {
    expect(formatAgeDays(Date.now(), Date.now())).toBe('today');
    expect(describeNudge({ kind: 'many-changes', added: 250 })).toBe(
      '250 new items since your last backup.',
    );
  });
});
