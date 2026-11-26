import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { setLanguagePreference, t } from '@/i18n/core';
import { renderAt, setupAppDatabase } from '@/test/appHarness';
import { TOOLS_PATHS } from '@/features/tools/domain/content';
import type { Lesson } from '../domain/learning';

setupAppDatabase('learning-vi-ui-test');
afterEach(() => setLanguagePreference('en'));

const lesson = TOOLS_PATHS[0]!.lessons[0] as Lesson;

describe('learning UI in Vietnamese', () => {
  it('translates the module home, the path list and the daily tip', async () => {
    setLanguagePreference('vi');
    renderAt('/practice/tools');
    expect(await screen.findByText('Tiến độ của bạn')).toBeInTheDocument();
    expect(screen.getByText(/^0\/10 bài học$/)).toBeInTheDocument();
    expect(screen.getByText('Lộ trình học')).toBeInTheDocument();
    expect(screen.getByText('Git và GitLab')).toBeInTheDocument();
    expect(screen.getAllByText(/ · trung cấp$/).length).toBeGreaterThan(0);
    expect(screen.getByRole('region', { name: /Mẹo lập trình mỗi ngày/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Xem tất cả \d+ mẹo/ })).toBeInTheDocument();
  });

  it('translates a lesson, and the quiz still scores by option index', async () => {
    setLanguagePreference('vi');
    renderAt(`/practice/tools/lesson/${lesson.id}`);
    expect(
      await screen.findByRole('heading', { name: t(lesson.title), level: 1 }),
    ).toBeInTheDocument();
    expect(t(lesson.title)).not.toBe(lesson.title);
    expect(screen.getByText('Đọc 5 phút')).toBeInTheDocument();
    const firstBlock = lesson.blocks[0];
    if (firstBlock?.kind === 'p') {
      expect(screen.getByText(t(firstBlock.text))).toBeInTheDocument();
    }
    await userEvent.click(screen.getByRole('button', { name: 'Làm bài kiểm tra' }));

    expect(screen.getByRole('button', { name: 'Hãy trả lời cả 3 câu hỏi' })).toBeDisabled();
    for (const [qi, question] of lesson.quiz.entries()) {
      const group = screen.getByRole('radiogroup', { name: new RegExp(`^${qi + 1}\\. `) });
      const radios = within(group).getAllByRole('radio');
      expect(radios.map((r) => r.textContent)).toEqual(question.options.map((o) => t(o)));
      await userEvent.click(radios[question.correct]!);
    }
    await userEvent.click(screen.getByRole('button', { name: 'Kiểm tra đáp án' }));
    expect(await screen.findByText('Đúng 3/3 câu')).toBeInTheDocument();
    expect(screen.getByText('Bạn đã hoàn thành bài học.')).toBeInTheDocument();
    expect(screen.getAllByText('Chính xác.')).toHaveLength(3);
  });

  it('keeps English when the language is English', async () => {
    renderAt('/practice/tools');
    expect(await screen.findByText('Your progress')).toBeInTheDocument();
    expect(screen.getByText('Learning paths')).toBeInTheDocument();
  });
});
