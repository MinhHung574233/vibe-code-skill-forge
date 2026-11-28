import { useState } from 'react';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { ListRow, Section } from '@/components/Section';
import { t } from '@/i18n/core';
import { ChapterView } from './ChapterView';
import { CHAPTERS, LEGEND_DIAGRAM, LEGEND_ITEMS, ALL_EXERCISES, chapterExercises } from './content';
import { MiniBoard } from './MiniBoard';
import { loadProgress, saveProgress, type HandbookProgress } from './progress';
import type { Chapter, ChapterId } from './types';

const CARO_HOME = '/practice/caro';

/**
 * The Caro handbook ("cẩm nang"): a list of short chapters, each with text, diagrams and small
 * "find the move" exercises. The open chapter is local state, so the module needs only one route
 * (`handbook`). Progress (last chapter, solved exercises) lives in localStorage on this device.
 */
export function HandbookScreen() {
  const [progress, setProgress] = useState<HandbookProgress>(loadProgress);
  const [openId, setOpenId] = useState<ChapterId | null>(null);
  const solved = new Set(progress.solved);
  const open = CHAPTERS.find((c) => c.id === openId) ?? null;
  const resume = CHAPTERS.find((c) => c.id === progress.lastChapter) ?? null;

  const update = (next: HandbookProgress) => {
    setProgress(next);
    saveProgress(next);
  };

  const openChapter = (id: ChapterId | null) => {
    setOpenId(id);
    if (id !== null) update({ ...progress, lastChapter: id });
  };

  const markSolved = (id: string) => {
    if (progress.solved.includes(id)) return;
    update({ ...progress, solved: [...progress.solved, id] });
  };

  const chapterSolved = (chapter: Chapter): number =>
    chapterExercises(chapter).filter((e) => solved.has(e.id)).length;

  return (
    <Screen title={t('Caro handbook')} back={{ to: CARO_HOME, label: t('Caro') }}>
      {open ? (
        <ChapterView chapter={open} solved={solved} onSolved={markSolved} onOpen={openChapter} />
      ) : (
        <>
          <p className="type-body text-muted">
            {t('Short chapters with diagrams and exercises. Each one takes two to five minutes.')}
          </p>
          {resume && (
            <Section title={t('Continue where you left off')}>
              <ListRow title={t(resume.title)} onClick={() => openChapter(resume.id)} />
            </Section>
          )}
          <Section
            title={t('Chapters')}
            footer={t('Exercises solved: {done} of {total}', {
              done: ALL_EXERCISES.filter((e) => solved.has(e.id)).length,
              total: ALL_EXERCISES.length,
            })}
          >
            {CHAPTERS.map((chapter, index) => {
              const total = chapterExercises(chapter).length;
              const detail =
                total > 0
                  ? `${t('{n} min read', { n: chapter.minutes })} · ${t(
                      'Exercises {done} of {total}',
                      {
                        done: chapterSolved(chapter),
                        total,
                      },
                    )}`
                  : t('{n} min read', { n: chapter.minutes });
              return (
                <ListRow
                  key={chapter.id}
                  title={`${index + 1}. ${t(chapter.title)}`}
                  subtitle={`${t(chapter.summary)} ${detail}`}
                  onClick={() => openChapter(chapter.id)}
                />
              );
            })}
          </Section>
          <Section title={t('How to read the diagrams')}>
            <Card padded className="rounded-none border-0 shadow-none">
              <MiniBoard rows={LEGEND_DIAGRAM.rows} marks={LEGEND_DIAGRAM.marks} />
              <ul className="mt-3 list-disc space-y-1 pl-5 type-subhead marker:text-muted">
                {LEGEND_ITEMS.map((item) => (
                  <li key={item}>{t(item)}</li>
                ))}
              </ul>
            </Card>
          </Section>
        </>
      )}
    </Screen>
  );
}
