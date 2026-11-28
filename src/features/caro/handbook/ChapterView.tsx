import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { t } from '@/i18n/core';
import { CHAPTERS } from './content';
import { ExerciseCard } from './ExerciseCard';
import { MiniBoard } from './MiniBoard';
import type { Block, Chapter, ChapterId } from './types';

interface ChapterViewProps {
  chapter: Chapter;
  solved: ReadonlySet<string>;
  onSolved: (id: string) => void;
  onOpen: (id: ChapterId | null) => void;
}

function renderBlock(
  block: Block,
  key: string,
  exerciseNumber: number,
  solved: ReadonlySet<string>,
  onSolved: (id: string) => void,
): ReactNode {
  switch (block.kind) {
    case 'p':
      return (
        <p key={key} className="mt-3 type-body">
          {t(block.text)}
        </p>
      );
    case 'h':
      return (
        <h3 key={key} className="mt-6 type-headline">
          {t(block.text)}
        </h3>
      );
    case 'list':
      return (
        <ul key={key} className="mt-3 list-disc space-y-2 pl-5 type-body marker:text-muted">
          {block.items.map((item) => (
            <li key={item}>{t(item)}</li>
          ))}
        </ul>
      );
    case 'tip':
      return (
        <Card key={key} className="mt-4 bg-accent-soft">
          <p className="type-subhead">
            <strong>{t('Tip')}:</strong> {t(block.text)}
          </p>
        </Card>
      );
    case 'diagram':
      return (
        <figure key={key} className="mt-4">
          <MiniBoard
            rows={block.diagram.rows}
            edges={block.diagram.edges}
            marks={block.diagram.marks}
          />
          <figcaption className="mt-2 type-footnote text-muted">
            {t(block.diagram.caption)}
          </figcaption>
        </figure>
      );
    case 'exercise':
      return (
        <ExerciseCard
          key={key}
          exercise={block.exercise}
          number={exerciseNumber}
          solved={solved.has(block.exercise.id)}
          onSolved={onSolved}
        />
      );
  }
}

/** One chapter: its text, diagrams and exercises, then links to the neighbouring chapters. */
export function ChapterView({ chapter, solved, onSolved, onOpen }: ChapterViewProps) {
  const heading = useRef<HTMLHeadingElement>(null);
  const position = CHAPTERS.findIndex((c) => c.id === chapter.id);
  const previous = CHAPTERS[position - 1];
  const next = CHAPTERS[position + 1];

  useEffect(() => {
    try {
      window.scrollTo?.({ top: 0 });
    } catch {
      // Not every environment can scroll; the heading below still takes focus.
    }
    heading.current?.focus();
  }, [chapter.id]);

  // 1-based number of each exercise within the chapter, for its heading.
  const exerciseNumbers = chapter.blocks.map(
    (_block, i) => chapter.blocks.slice(0, i + 1).filter((b) => b.kind === 'exercise').length,
  );
  return (
    <article aria-labelledby="handbook-chapter-title">
      <p className="type-footnote text-muted">
        {t('Chapter {n} of {total}', { n: position + 1, total: CHAPTERS.length })} ·{' '}
        {t('{n} min read', { n: chapter.minutes })}
      </p>
      <h2
        id="handbook-chapter-title"
        ref={heading}
        tabIndex={-1}
        className="mt-1 type-title-1 outline-none"
      >
        {t(chapter.title)}
      </h2>
      {chapter.blocks.map((block, i) =>
        renderBlock(block, `${chapter.id}-${i}`, exerciseNumbers[i] ?? 0, solved, onSolved),
      )}
      <nav aria-label={t('Chapters')} className="mt-8 flex flex-col gap-2">
        {next && (
          <Button fullWidth onClick={() => onOpen(next.id)}>
            {t('Next: {title}', { title: t(next.title) })}
          </Button>
        )}
        {previous && (
          <Button fullWidth variant="secondary" onClick={() => onOpen(previous.id)}>
            {t('Previous: {title}', { title: t(previous.title) })}
          </Button>
        )}
        <Button fullWidth variant="ghost" onClick={() => onOpen(null)}>
          {t('All chapters')}
        </Button>
      </nav>
    </article>
  );
}
