import { useMemo } from 'react';
import { Link } from 'react-router';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { ListRow, Section } from '@/components/Section';
import { StatTile } from '@/components/StatTile';
import { toLocalDate } from '@/core/time/localDate';
import { t } from '@/i18n/core';
import { useNow } from '@/hooks/useNow';
import { buildQueue, vocabStats } from '../domain/srs';
import { WORDS } from '../domain/vocabulary';
import { NEW_WORDS_PER_DAY, useNewWordsToday, useVocabProgress } from './useEnglish';

export function EnglishHome() {
  const now = useNow();
  const progress = useVocabProgress();
  const newToday = useNewWordsToday(toLocalDate(now));

  const view = useMemo(() => {
    if (!progress || newToday === undefined) return null;
    const stats = vocabStats(WORDS, progress, now);
    const queue = buildQueue(WORDS, progress, { now, newPerDay: NEW_WORDS_PER_DAY, newToday });
    return { stats, queue, due: queue.filter((q) => q.progress).length };
  }, [progress, newToday, now]);

  const queueSize = view?.queue.length ?? 0;
  const startClass =
    'inline-flex min-h-[50px] w-full items-center justify-center rounded-xl px-5 type-headline active:scale-[0.98] active:opacity-80';

  return (
    <Screen title={t('English')} back={{ to: '/practice', label: t('Practice') }}>
      <Card aria-labelledby="eng-today" role="region">
        <h2 id="eng-today" className="type-title-2">
          {t('Today')}
        </h2>
        {view && (
          <p className="mt-1 type-subhead text-muted">
            {queueSize === 0
              ? t('You are all caught up. Come back when more cards are due.')
              : queueSize - view.due === 1
                ? t('{due} to review, {n} new word.', { due: view.due, n: queueSize - view.due })
                : t('{due} to review, {n} new words.', { due: view.due, n: queueSize - view.due })}
          </p>
        )}
        <div className="mt-4">
          {queueSize > 0 ? (
            <Link to="review" className={`${startClass} bg-accent text-on-accent`}>
              {t('Start review')}
            </Link>
          ) : (
            <span
              aria-disabled="true"
              className={`${startClass} bg-accent-soft text-muted opacity-70`}
            >
              {t('Nothing to review')}
            </span>
          )}
        </div>
      </Card>

      {view && (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatTile
              label={t('Learned')}
              value={String(view.stats.learned)}
              hint={t('recalled 3 times')}
              icon="check"
            />
            <StatTile
              label={t('Seen')}
              value={`${view.stats.seen}/${view.stats.total}`}
              icon="book"
            />
          </div>
          <Card className="mt-3">
            <p className="type-subhead text-muted">{t('Toward 100 learned words')}</p>
            <div className="mt-2">
              <ProgressBar
                value={Math.min(1, view.stats.learned / 100)}
                label={t('{n} of 100 learned words', { n: view.stats.learned })}
              />
            </div>
          </Card>
        </>
      )}

      <Section
        title={t('Words')}
        footer={t(
          'A word counts as learned after you recall it three times in a row over several days. New words per day: 10.',
        )}
      >
        <ListRow
          title={t('Quick quiz')}
          subtitle={t('10 questions: match the definition to the term. Practice only.')}
          icon="target"
          to="quiz"
        />
        <ListRow
          title={t('Browse all words')}
          subtitle={t('{n} IT terms with definitions, examples and Vietnamese', {
            n: WORDS.length,
          })}
          icon="search"
          to="words"
        />
      </Section>
    </Screen>
  );
}
