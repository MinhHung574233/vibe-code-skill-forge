import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { getDb } from '@/db/boot';
import { JAVA_PATHS } from '@/features/java/domain/content';
import { renderAt, setupAppDatabase } from '@/test/appHarness';
import { TOOLS_PATHS } from '@/features/tools/domain/content';
import type { Lesson } from '../domain/learning';

setupAppDatabase('learning-ui-test');

const first = JAVA_PATHS[0]!.lessons[0] as Lesson;

async function answerAll(lesson: Lesson, wrongCount = 0) {
  for (const [qi, question] of lesson.quiz.entries()) {
    const group = screen.getByRole('radiogroup', {
      name: new RegExp(`^${qi + 1}\\. `),
    });
    const wrong = (question.correct + 1) % 4;
    const target = qi < wrongCount ? wrong : question.correct;
    await userEvent.click(within(group).getAllByRole('radio')[target]!);
  }
}

describe('Java module', () => {
  it('lists the learning paths with progress', async () => {
    renderAt('/practice/java');
    expect(await screen.findByText('Java core')).toBeInTheDocument();
    expect(screen.getByText('Spring Boot essentials')).toBeInTheDocument();
    expect(screen.getByText(/0 of 20 lessons/)).toBeInTheDocument();
  });

  it('read, pass the quiz, complete the lesson once and earn XP once', async () => {
    renderAt(`/practice/java/lesson/${first.id}`);
    expect(await screen.findByRole('heading', { name: first.title, level: 1 })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Take the quiz' }));

    expect(screen.getByRole('button', { name: 'Answer all 3 questions' })).toBeDisabled();
    await answerAll(first);
    await userEvent.click(screen.getByRole('button', { name: 'Check answers' }));

    expect(await screen.findByText('3 of 3 correct')).toBeInTheDocument();
    const sheet = await screen.findByRole('dialog', { name: 'Session saved' });
    expect(within(sheet).getByText('+30 XP')).toBeInTheDocument();
    expect(await getDb().lessonProgress.get(first.id)).toMatchObject({
      pathId: 'java-core',
      bestScore: 1,
      attempts: 1,
    });
    expect(await getDb().sessions.where('moduleId').equals('java').count()).toBe(1);
  });

  it('failing the quiz does not complete the lesson, and a retry can', async () => {
    renderAt(`/practice/java/lesson/${first.id}`);
    await userEvent.click(await screen.findByRole('button', { name: 'Take the quiz' }));
    await answerAll(first, 2); // two wrong => 1 of 3
    await userEvent.click(screen.getByRole('button', { name: 'Check answers' }));
    expect(await screen.findByText('1 of 3 correct')).toBeInTheDocument();
    expect(screen.getByText(/You need 2 correct answers/)).toBeInTheDocument();
    expect(await getDb().lessonProgress.count()).toBe(0);
    expect(screen.queryByRole('dialog', { name: 'Session saved' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Try the quiz again' }));
    await answerAll(first);
    await userEvent.click(screen.getByRole('button', { name: 'Check answers' }));
    expect(await screen.findByText('3 of 3 correct')).toBeInTheDocument();
    await waitFor(async () => expect(await getDb().lessonProgress.count()).toBe(1));
  });

  it('retaking a completed lesson never earns XP again', async () => {
    renderAt(`/practice/java/lesson/${first.id}`);
    await userEvent.click(await screen.findByRole('button', { name: 'Take the quiz' }));
    await answerAll(first);
    await userEvent.click(screen.getByRole('button', { name: 'Check answers' }));
    await screen.findByRole('dialog', { name: 'Session saved' });
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));

    // Take it again through a fresh render.
    const { cleanup } = await import('@testing-library/react');
    cleanup();
    renderAt(`/practice/java/lesson/${first.id}`);
    await userEvent.click(await screen.findByRole('button', { name: 'Take the quiz' }));
    await answerAll(first);
    await userEvent.click(screen.getByRole('button', { name: 'Check answers' }));
    await screen.findByText('3 of 3 correct');
    expect(screen.queryByRole('dialog', { name: 'Session saved' })).toBeNull();
    expect(await getDb().sessions.where('moduleId').equals('java').count()).toBe(1);
    expect((await getDb().lessonProgress.get(first.id))?.attempts).toBe(2);
  });

  it('completing every lesson of a path unlocks the Java path achievement', async () => {
    const path = JAVA_PATHS[0]!;
    const now = Date.now();
    // All but the last lesson are already done.
    await getDb().lessonProgress.bulkAdd(
      path.lessons.slice(0, -1).map((l) => ({
        lessonId: l.id,
        pathId: path.id,
        completedAt: now,
        bestScore: 1,
        attempts: 1,
      })),
    );
    const last = path.lessons.at(-1)!;
    renderAt(`/practice/java/lesson/${last.id}`);
    await userEvent.click(await screen.findByRole('button', { name: 'Take the quiz' }));
    await answerAll(last);
    await userEvent.click(screen.getByRole('button', { name: 'Check answers' }));
    await screen.findByRole('dialog', { name: 'Session saved' });
    const unlocked = (await getDb().achievements.toArray()).map((a) => a.achievementId);
    expect(unlocked).toContain('java_path');
  });
});

describe('Developer Tools module', () => {
  it('shows the daily developer tip and a tips library', async () => {
    renderAt('/practice/tools');
    const tip = await screen.findByRole('region', { name: /Daily developer tip/ });
    expect(tip).toBeInTheDocument();
    expect(screen.getByText('Git and GitLab')).toBeInTheDocument();
    expect(screen.getByText('IntelliJ IDEA')).toBeInTheDocument();
    expect(screen.getByText('DevOps basics')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('link', { name: /Browse all \d+ tips/ }));
    expect(await screen.findByRole('heading', { name: 'Tips', level: 1 })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Git' }));
    expect(screen.getByText('Create and switch in one step')).toBeInTheDocument();
    expect(screen.queryByText('Search Everywhere')).toBeNull();
  });

  it('a Tools lesson records a Developer Tools session', async () => {
    const lesson = TOOLS_PATHS[0]!.lessons[0] as Lesson;
    renderAt(`/practice/tools/lesson/${lesson.id}`);
    await userEvent.click(await screen.findByRole('button', { name: 'Take the quiz' }));
    await answerAll(lesson);
    await userEvent.click(screen.getByRole('button', { name: 'Check answers' }));
    const sheet = await screen.findByRole('dialog', { name: 'Session saved' });
    expect(within(sheet).getByText('+20 XP')).toBeInTheDocument();
    expect(await getDb().sessions.where('moduleId').equals('tools').count()).toBe(1);
  });
});
