import { useMemo, useState } from 'react';
import { Badge } from '@/components/Badge';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { Section } from '@/components/Section';
import { isWordLearned } from '../domain/srs';
import { TOPIC_LABELS, WORDS, type WordTopic } from '../domain/vocabulary';
import { useVocabProgress } from './useEnglish';

const TOPICS = Object.keys(TOPIC_LABELS) as WordTopic[];

export function WordsScreen() {
  const progress = useVocabProgress();
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<WordTopic | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return WORDS.filter(
      (w) =>
        (topic === null || w.topic === topic) &&
        (q === '' || w.term.toLowerCase().includes(q) || w.vi.toLowerCase().includes(q)),
    );
  }, [query, topic]);

  return (
    <Screen title="Words" back={{ to: '/practice/english', label: 'English' }}>
      <TextField
        label="Search"
        type="search"
        value={query}
        placeholder="English or Vietnamese"
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Chip selected={topic === null} onClick={() => setTopic(null)}>
          All
        </Chip>
        {TOPICS.map((t) => (
          <Chip key={t} selected={topic === t} onClick={() => setTopic(topic === t ? null : t)}>
            {TOPIC_LABELS[t]}
          </Chip>
        ))}
      </div>

      <Section footer={`${list.length} of ${WORDS.length} words`}>
        {list.map((word) => {
          const row = progress?.get(word.id);
          const status = !row ? 'New' : isWordLearned(row) ? 'Learned' : 'Learning';
          const open = openId === word.id;
          return (
            <div key={word.id}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : word.id)}
                className="flex min-h-[56px] w-full items-center gap-3 px-4 py-2.5 text-left active:bg-accent-soft"
              >
                <span className="min-w-0 flex-1">
                  <span className="block type-body">{word.term}</span>
                  <span className="block type-subhead text-muted">{word.vi}</span>
                </span>
                <Badge tone={status === 'Learned' ? 'success' : 'neutral'}>{status}</Badge>
              </button>
              {open && (
                <div className="space-y-2 px-4 pb-4">
                  <p className="type-subhead">{word.definition}</p>
                  <p className="type-subhead text-muted">{word.example}</p>
                </div>
              )}
            </div>
          );
        })}
      </Section>
    </Screen>
  );
}
