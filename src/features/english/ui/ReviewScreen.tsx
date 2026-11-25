import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { newId } from '@/core/ids';
import { toLocalDate } from '@/core/time/localDate';
import { useNow } from '@/hooks/useNow';
import type { CompletionOutcome } from '@/features/training/domain/session';
import { SessionCompleteSheet } from '@/features/training/ui/SessionCompleteSheet';
import type { ReviewSummary } from '../data/vocabService';
import { buildQueue, describeInterval, NEW_CARD, type Grade, type QueueItem } from '../domain/srs';
import { WORDS } from '../domain/vocabulary';
import { NEW_WORDS_PER_DAY, useVocabService } from './useEnglish';

const BACK = { to: '/practice/english', label: 'English' };

const GRADE_BUTTONS: readonly { grade: Grade; label: string }[] = [
  { grade: 'again', label: 'Again' },
  { grade: 'hard', label: 'Hard' },
  { grade: 'good', label: 'Good' },
  { grade: 'easy', label: 'Easy' },
];

function speak(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

/** One flashcard session: reveal, grade, repeat. Forgotten cards come back later in the session. */
export function ReviewScreen() {
  const service = useVocabService();
  const navigate = useNavigate();
  const now = useNow();
  const [session] = useState(() => {
    const startedAt = Date.now();
    return { startedAt, id: `vocab:${newId(startedAt)}` };
  });
  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [summary, setSummary] = useState<ReviewSummary>({ answers: 0, recalled: 0, newWords: 0 });
  const [ended, setEnded] = useState(false);
  const [outcome, setOutcome] = useState<CompletionOutcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // The queue is fixed when the screen opens, so cards do not shuffle while you study.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const now = Date.now();
      const [progress, newToday] = await Promise.all([
        service.progress(),
        service.newWordsOn(toLocalDate(now)),
      ]);
      if (!cancelled) {
        setQueue(buildQueue(WORDS, progress, { now, newPerDay: NEW_WORDS_PER_DAY, newToday }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [service]);

  const item = queue?.[index];
  const finished = ended || (queue !== null && index >= queue.length);

  const answer = async (grade: Grade) => {
    if (!item || busy) return;
    setBusy(true);
    setError(null);
    try {
      await service.grade(item.word.id, grade);
    } catch {
      setError('Could not save your answer. Try again.');
      setBusy(false);
      return;
    }
    setSummary((s) => ({
      answers: s.answers + 1,
      recalled: s.recalled + (grade === 'again' ? 0 : 1),
      newWords: s.newWords + (item.progress === null && !seenBefore(queue, index) ? 1 : 0),
    }));
    if (grade === 'again')
      setQueue((q) => (q ? [...q, { word: item.word, progress: item.progress ?? null }] : q));
    setRevealed(false);
    setIndex((i) => i + 1);
    setBusy(false);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    const result = await service.finishSession(session.id, session.startedAt, summary);
    setBusy(false);
    if (result.ok) setOutcome(result.value);
    else setError(result.error.message);
  };

  if (queue === null) return <Screen title="Review" back={BACK} />;

  if (finished) {
    return (
      <Screen title="Review" back={BACK}>
        <Card>
          <h2 className="type-title-2">
            {summary.answers === 0 ? 'Nothing reviewed' : 'Session complete'}
          </h2>
          <p className="mt-1 type-body text-muted">
            {summary.answers === 0
              ? 'You have not answered any card yet.'
              : `${summary.recalled} of ${summary.answers} answers recalled, ${summary.newWords} new ${summary.newWords === 1 ? 'word' : 'words'}.`}
          </p>
          {error && (
            <p role="alert" className="mt-3 type-subhead text-danger">
              {error}
            </p>
          )}
          <div className="mt-4 flex flex-col gap-2">
            {summary.answers > 0 && !outcome && (
              <Button loading={busy} onClick={() => void save()}>
                Save session
              </Button>
            )}
            <Button variant="secondary" onClick={() => void navigate('/practice/english')}>
              Back to English
            </Button>
          </div>
        </Card>
        <SessionCompleteSheet
          outcome={outcome}
          onClose={() => {
            setOutcome(null);
            void navigate('/practice/english');
          }}
        />
      </Screen>
    );
  }

  if (!item) return <Screen title="Review" back={BACK} />;
  const { word } = item;
  const card = item.progress ?? NEW_CARD;

  return (
    <Screen title="Review" back={BACK}>
      <ProgressBar value={queue.length === 0 ? 1 : index / queue.length} label="Session progress" />
      <p className="mt-2 px-1 type-footnote text-muted" aria-live="polite">
        Card {index + 1} of {queue.length}
        {item.progress === null ? ' · new word' : ''}
      </p>

      <Card className="mt-3 min-h-64">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="type-title-1">{word.term}</h2>
            <p className="type-subhead text-muted">{word.pos}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Hear “${word.term}”`}
            onClick={() => speak(word.term)}
          >
            Listen
          </Button>
        </div>
        {revealed ? (
          <div className="mt-4 space-y-3">
            <p className="type-body">{word.definition}</p>
            <p className="type-body text-muted">
              <span className="font-medium text-text">Example: </span>
              {word.example}
            </p>
            <p className="type-body">
              <span className="font-medium">Tiếng Việt: </span>
              {word.vi}
            </p>
          </div>
        ) : (
          <p className="mt-6 type-subhead text-muted">
            Try to recall the meaning first, then reveal the answer.
          </p>
        )}
      </Card>

      {error && (
        <p role="alert" className="mt-3 type-subhead text-danger">
          {error}
        </p>
      )}

      <div className="mt-4">
        {revealed ? (
          <div className="grid grid-cols-4 gap-2">
            {GRADE_BUTTONS.map(({ grade, label }) => (
              <Button
                key={grade}
                variant={
                  grade === 'again' ? 'secondary' : grade === 'good' ? 'primary' : 'secondary'
                }
                size="sm"
                className="h-auto flex-col gap-0.5 py-2"
                disabled={busy}
                onClick={() => void answer(grade)}
              >
                <span>{label}</span>
                <span className="type-caption font-normal opacity-80">
                  {describeInterval(card, grade, now)}
                </span>
              </Button>
            ))}
          </div>
        ) : (
          <Button fullWidth onClick={() => setRevealed(true)}>
            Show answer
          </Button>
        )}
        <Button variant="ghost" fullWidth className="mt-2" onClick={() => setEnded(true)}>
          End session
        </Button>
      </div>
    </Screen>
  );
}

/** A repeated card (re-queued after "again") is not a new word the second time. */
function seenBefore(queue: QueueItem[] | null, index: number): boolean {
  const current = queue?.[index];
  if (!queue || !current) return false;
  return queue.findIndex((q) => q.word.id === current.word.id) < index;
}
