import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router';
import { Badge, type BadgeTone } from '@/components/Badge';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ListRow, Section } from '@/components/Section';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StatTile } from '@/components/StatTile';
import { newId } from '@/core/ids';
import { systemClock } from '@/core/time/clock';
import { getDb } from '@/db/boot';
import { intlLocale, t } from '@/i18n/core';
import { cn } from '@/utils/cn';
import { clearDraft, loadDraft, loadFinishedGames, saveDraft } from '../data/caroRepository';
import { LEVELS, type Level } from '../domain/ai/levels';
import type { BoardSize } from '../domain/board';
import { OBSTACLE_COUNTS, placeObstacles, type ObstacleCount } from '../domain/obstacles';
import type { CaroDraft, Outcome } from '../domain/play';
import type { CaroRule } from '../domain/rules';
import { VARIANT_IDS, computeStats, type Tally } from '../domain/stats';
import { PRESETS, matchPreset, type PresetId } from '../domain/variant';
import {
  CARO_HANDBOOK,
  CARO_PLAY,
  isClassicVariant,
  levelLabel,
  levelNote,
  obstacleChoiceLabel,
  obstacleNote,
  outcomeLabel,
  presetLabel,
  presetNote,
  ruleLabel,
  ruleNote,
  variantIdLabel,
  variantLabel,
} from './labels';

const OUTCOME_TONE: Record<Outcome, BadgeTone> = {
  win: 'success',
  loss: 'danger',
  draw: 'neutral',
};
const RECENT_GAMES = 10;

const percent = (rate: number | null): string =>
  rate === null ? '–' : `${Math.round(rate * 100)}%`;
const tallyText = (tally: Tally): string =>
  t('{won} W · {lost} L · {drawn} D', { won: tally.won, lost: tally.lost, drawn: tally.drawn });
const formatDay = (at: number): string =>
  new Intl.DateTimeFormat(intlLocale(), { month: 'short', day: 'numeric' }).format(at);

/** The three big choices: a radio group of cards (arrow keys move and select, like the other choosers). */
function PresetPicker({
  selected,
  onChange,
}: {
  selected: PresetId | null;
  onChange: (id: PresetId) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta =
      event.key === 'ArrowDown' || event.key === 'ArrowRight'
        ? 1
        : event.key === 'ArrowUp' || event.key === 'ArrowLeft'
          ? -1
          : 0;
    if (delta === 0) return;
    event.preventDefault();
    const next = PRESETS[(index + delta + PRESETS.length) % PRESETS.length];
    if (!next) return;
    onChange(next.id);
    refs.current[PRESETS.indexOf(next)]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={t('Game type')} className="flex flex-col gap-2">
      {PRESETS.map((preset, index) => {
        const checked = preset.id === selected;
        return (
          <button
            key={preset.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked || (selected === null && index === 0) ? 0 : -1}
            onClick={() => onChange(preset.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              'min-h-[44px] rounded-2xl border-2 px-4 py-3 text-left transition-colors',
              checked ? 'border-accent bg-accent-soft' : 'border-border bg-surface',
            )}
          >
            <span className="block type-headline">{presetLabel(preset.id)}</span>
            <span className="mt-0.5 block type-footnote text-muted">{presetNote(preset.id)}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Module home: set up a game, resume the one in progress, and see the record so far. */
export function CaroHome() {
  const navigate = useNavigate();
  const draft = useLiveQuery(() => loadDraft(getDb()), []);
  const games = useLiveQuery(() => loadFinishedGames(getDb()), []);
  const stats = useMemo(() => (games ? computeStats(games) : undefined), [games]);

  const [level, setLevel] = useState<Level>('medium');
  const [size, setSize] = useState<BoardSize>(15);
  const [rule, setRule] = useState<CaroRule>('freestyle');
  const [obstacleCount, setObstacleCount] = useState<ObstacleCount>(0);
  const [first, setFirst] = useState<'player' | 'computer'>('player');
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setReplaceOpen(false);
    setError(null);
    const now = systemClock.now();
    const next: CaroDraft = {
      id: newId(now),
      size,
      rule,
      // Chosen once and stored in the saved game, so a resumed game has the same squares.
      obstacles: placeObstacles(size, obstacleCount, Math.floor(Math.random() * 0x100000000)),
      level,
      humanStone: first === 'player' ? 1 : 2,
      startedAt: now,
      moves: [],
      undos: 0,
    };
    try {
      await saveDraft(getDb(), next, now);
    } catch {
      setError(t('Could not start the game. Try again.'));
      return;
    }
    void navigate(CARO_PLAY);
  };

  const choosePreset = (id: PresetId) => {
    const preset = PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setSize(preset.size);
    setRule(preset.rule);
    setObstacleCount(preset.obstacleCount);
  };
  const selectedPreset = matchPreset(size, rule, obstacleCount);

  const discard = async () => {
    setDiscardOpen(false);
    try {
      await clearDraft(getDb()); // abandoning records nothing
    } catch {
      setError(t('Could not discard the game. Try again.'));
    }
  };

  return (
    <Screen title={t('Caro')} back={{ to: '/practice', label: t('Practice') }}>
      {draft && (
        <Card role="region" aria-labelledby="caro-resume" className="mb-4">
          <h2 id="caro-resume" className="type-title-2">
            {t('Game in progress')}
          </h2>
          <p className="mt-1 type-subhead text-muted">
            {levelLabel(draft.level)} · {draft.size}×{draft.size} ·{' '}
            {t('{count} moves', { count: draft.moves.length })}
          </p>
          <p className="mt-2">
            <Badge>
              {variantLabel({
                size: draft.size,
                rule: draft.rule,
                obstacles: draft.obstacles.length,
              })}
            </Badge>
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Button onClick={() => void navigate(CARO_PLAY)}>{t('Resume')}</Button>
            <Button variant="ghost" onClick={() => setDiscardOpen(true)}>
              {t('Discard')}
            </Button>
          </div>
        </Card>
      )}

      <Card role="region" aria-labelledby="caro-new">
        <h2 id="caro-new" className="type-title-2">
          {t('New game')}
        </h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <p className="type-subhead font-medium text-muted">{t('Level')}</p>
            <SegmentedControl
              label={t('Level')}
              value={level}
              onChange={setLevel}
              options={LEVELS.map((value) => ({ value, label: levelLabel(value) }))}
            />
            <p className="type-footnote text-muted">{levelNote(level)}</p>
          </div>
          <div className="space-y-2">
            <p className="type-subhead font-medium text-muted">{t('Game type')}</p>
            <PresetPicker selected={selectedPreset} onChange={choosePreset} />
          </div>
          <details className="rounded-2xl border border-border bg-surface px-4">
            <summary className="flex min-h-[44px] cursor-pointer items-center type-subhead">
              {t('Advanced')}
            </summary>
            <div className="space-y-4 pb-4">
              <div className="space-y-2">
                <p className="type-subhead font-medium text-muted">{t('Board')}</p>
                <SegmentedControl
                  label={t('Board size')}
                  value={String(size) as '9' | '15' | '19'}
                  onChange={(value) => setSize(value === '9' ? 9 : value === '19' ? 19 : 15)}
                  options={[
                    { value: '9', label: t('9 × 9 quick') },
                    { value: '15', label: '15 × 15' },
                    { value: '19', label: '19 × 19' },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <p className="type-subhead font-medium text-muted">{t('Rule')}</p>
                <SegmentedControl
                  label={t('Rule')}
                  value={rule}
                  onChange={setRule}
                  options={(['freestyle', 'blocked'] as const).map((value) => ({
                    value,
                    label: ruleLabel(value),
                  }))}
                />
                <p className="type-footnote text-muted">{ruleNote(rule)}</p>
              </div>
              <div className="space-y-2">
                <p className="type-subhead font-medium text-muted">{t('Blocked squares')}</p>
                <SegmentedControl
                  label={t('Blocked squares')}
                  value={String(obstacleCount) as '0' | '3'}
                  onChange={(value) => setObstacleCount(value === '3' ? 3 : 0)}
                  options={OBSTACLE_COUNTS.map((count) => ({
                    value: String(count) as '0' | '3',
                    label: obstacleChoiceLabel(count),
                  }))}
                />
                {obstacleCount > 0 && (
                  <p className="type-footnote text-muted">{obstacleNote(rule)}</p>
                )}
              </div>
            </div>
          </details>
          <div className="space-y-2">
            <p className="type-subhead font-medium text-muted">{t('Who moves first')}</p>
            <SegmentedControl
              label={t('Who moves first')}
              value={first}
              onChange={setFirst}
              options={[
                { value: 'player', label: t('You') },
                { value: 'computer', label: t('Computer') },
              ]}
            />
          </div>
          {error && (
            <p role="alert" className="type-subhead text-danger">
              {error}
            </p>
          )}
          <Button fullWidth onClick={() => (draft ? setReplaceOpen(true) : void start())}>
            {t('Start game')}
          </Button>
        </div>
      </Card>

      <Section title={t('Learn')}>
        <ListRow
          title={t('Caro handbook')}
          subtitle={t('Rules, shapes, winning combinations and exercises')}
          icon="book"
          iconColor="var(--accent)"
          onClick={() => void navigate(CARO_HANDBOOK)}
        />
      </Section>

      {stats && games && (
        <>
          <Section title={t('Your record')}>
            {stats.total.played === 0 ? (
              <EmptyState
                icon="stones"
                title={t('No games yet')}
                description={t(
                  'Finish a game to start your record. Resigned games are not counted.',
                )}
              />
            ) : (
              <div className="grid grid-cols-3 gap-2 bg-bg p-2">
                <StatTile label={t('Played')} value={String(stats.total.played)} />
                <StatTile label={t('Win rate')} value={percent(stats.winRate)} />
                <StatTile
                  label={t('Win streak')}
                  value={String(stats.winStreak)}
                  hint={t('Best {n}', { n: stats.bestWinStreak })}
                />
              </div>
            )}
          </Section>

          {stats.total.played > 0 && (
            <>
              <Section title={t('By level')}>
                {LEVELS.map((value) => {
                  const tally = stats.byLevel[value];
                  return (
                    <ListRow
                      key={value}
                      title={levelLabel(value)}
                      subtitle={t('{count} played', { count: tally.played })}
                      accessory={
                        <span className="type-subhead tabular-nums text-muted">
                          {tallyText(tally)}
                        </span>
                      }
                    />
                  );
                })}
              </Section>

              <Section title={t('By game type')}>
                {VARIANT_IDS.filter((id) => stats.byVariant[id].played > 0).map((id) => {
                  const tally = stats.byVariant[id];
                  return (
                    <ListRow
                      key={id}
                      title={variantIdLabel(id)}
                      subtitle={t('{count} played', { count: tally.played })}
                      accessory={
                        <span className="type-subhead tabular-nums text-muted">
                          {tallyText(tally)}
                        </span>
                      }
                    />
                  );
                })}
              </Section>

              <Section title={t('Recent games')}>
                {games.slice(0, RECENT_GAMES).map((game) => (
                  <ListRow
                    key={game.id}
                    title={`${levelLabel(game.level)} · ${game.size}×${game.size}`}
                    subtitle={[
                      t('{count} moves', { count: game.moves }),
                      ...(isClassicVariant(game)
                        ? []
                        : [
                            variantLabel({
                              size: game.size,
                              rule: game.rule,
                              obstacles: game.obstacles,
                            }),
                          ]),
                      formatDay(game.endedAt),
                    ].join(' · ')}
                    accessory={
                      <Badge tone={OUTCOME_TONE[game.outcome]}>{outcomeLabel(game.outcome)}</Badge>
                    }
                  />
                ))}
              </Section>
            </>
          )}
        </>
      )}

      <ConfirmDialog
        open={replaceOpen}
        destructive
        title={t('Replace the game in progress?')}
        message={t(
          'Starting a new game discards the one you are playing. Nothing is recorded for it.',
        )}
        confirmLabel={t('Start new game')}
        onConfirm={() => void start()}
        onCancel={() => setReplaceOpen(false)}
      />
      <ConfirmDialog
        open={discardOpen}
        destructive
        title={t('Discard this game?')}
        message={t('It will be removed and nothing is recorded: no result, no XP.')}
        confirmLabel={t('Discard')}
        onConfirm={() => void discard()}
        onCancel={() => setDiscardOpen(false)}
      />
    </Screen>
  );
}
