import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SelectField, TextAreaField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { newId } from '@/core/ids';
import {
  MAX_SESSION_SEC,
  MIN_REWARDED_TIMER_SESSION_SEC,
  MIN_SESSION_SEC,
} from '@/core/training/config';
import { getDb } from '@/db/boot';
import { t } from '@/i18n/core';
import { formatClock } from '@/utils/format';
import {
  clearSessionDraft,
  loadSessionDraft,
  saveSessionDraft,
  type SessionDraft,
} from '../data/sessionDraft';
import type { CompletionOutcome } from '../domain/session';
import { SessionCompleteSheet } from './SessionCompleteSheet';
import { useSkills, useTrainingEngine } from './useTraining';

/** Current time, ticking twice a second while `active` (elapsed is always computed from it). */
function useTicker(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

/**
 * Timed practice. The draft is persisted so the timer survives reloads and suspension; elapsed
 * time comes from the wall clock (a locked phone keeps counting, as a stopwatch should).
 */
export function SessionScreen() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const autostartHandled = useRef(false);
  const skills = useSkills();
  const engine = useTrainingEngine();

  const [draft, setDraft] = useState<SessionDraft | null | undefined>(undefined);
  const [skillId, setSkillId] = useState(params.get('skill') ?? '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [outcome, setOutcome] = useState<CompletionOutcome | null>(null);

  const start = async (forSkillId: string = skillId) => {
    const started = Date.now();
    const next: SessionDraft = {
      sessionId: newId(started),
      startedAt: started,
      ...(forSkillId ? { skillId: forSkillId } : {}),
    };
    await saveSessionDraft(getDb(), next, started);
    setError(null);
    setDraft(next);
  };

  useEffect(() => {
    let cancelled = false;
    void loadSessionDraft(getDb()).then((d) => {
      if (cancelled) return;
      setDraft(d);
      // Arriving from a Home skill tile (?autostart=1) starts the timer at once. The flag is
      // removed so a reload or Back does not start a second one, and a running session is never
      // replaced.
      if (autostartHandled.current || params.get('autostart') !== '1') return;
      autostartHandled.current = true;
      const next = new URLSearchParams(params);
      next.delete('autostart');
      setParams(next, { replace: true });
      const wanted = params.get('skill');
      if (d === null && wanted) void start(wanted);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once, on mount
  }, []);

  const running = draft !== null && draft !== undefined;
  const now = useTicker(running);
  const elapsedSec = running ? Math.max(0, Math.floor((now - draft.startedAt) / 1000)) : 0;
  const skillName =
    running && draft.skillId ? skills?.find((s) => s.id === draft.skillId)?.name : undefined;

  const finish = async () => {
    if (!running) return;
    setSaving(true);
    setError(null);
    const result = await engine.recordSession({
      id: draft.sessionId,
      activityType: 'practice_session',
      source: 'timer',
      startedAt: draft.startedAt,
      endedAt: Date.now(),
      ...(draft.skillId ? { skillId: draft.skillId } : {}),
      ...(notes.trim() ? { notes } : {}),
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    await clearSessionDraft(getDb());
    setDraft(null);
    setOutcome(result.value);
  };

  const discard = async () => {
    setDiscardOpen(false);
    await clearSessionDraft(getDb());
    setDraft(null);
    setNotes('');
    setError(null);
  };

  const tooLong = elapsedSec > MAX_SESSION_SEC;
  const canFinish = running && elapsedSec >= MIN_SESSION_SEC && !tooLong;

  return (
    <Screen title={t('Training session')} back={{ to: '/practice', label: t('Practice') }}>
      {draft === undefined ? null : !running ? (
        <div className="space-y-4">
          <Card>
            <p className="type-body">
              {t(
                'Start a timer, practise, then finish to save it. Timed sessions of {minutes} minutes or more earn XP and count for your streak.',
                { minutes: MIN_REWARDED_TIMER_SESSION_SEC / 60 },
              )}
            </p>
          </Card>
          <SelectField
            label={t('Skill')}
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
          >
            <option value="">{t('No specific skill')}</option>
            {(skills ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>
          <Button fullWidth onClick={() => void start()}>
            {t('Start')}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="text-center">
            <p className="type-subhead text-muted">{skillName ?? t('Practice')}</p>
            <p role="timer" aria-label={t('Elapsed time')} className="type-timer py-2">
              {formatClock(elapsedSec)}
            </p>
            <p className="type-footnote text-muted">
              {t('Keeps counting if you lock your phone. Finish when you are done.')}
            </p>
          </Card>
          <TextAreaField
            label={t('Notes')}
            maxLength={300}
            hint={t('Optional: what you worked on.')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {tooLong && (
            <p role="alert" className="type-subhead text-danger">
              {t(
                'This timer ran for over 12 hours, which is too long to save. Discard it and start again.',
              )}
            </p>
          )}
          {error && (
            <p role="alert" className="type-subhead text-danger">
              {error}
            </p>
          )}
          <Button fullWidth loading={saving} disabled={!canFinish} onClick={() => void finish()}>
            {canFinish || tooLong ? t('Finish and save') : t('Finish (after 1 minute)')}
          </Button>
          <Button fullWidth variant="ghost" onClick={() => setDiscardOpen(true)}>
            {t('Discard')}
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={discardOpen}
        title={t('Discard this session?')}
        message={t('The time so far will not be saved.')}
        confirmLabel={t('Discard')}
        destructive
        onCancel={() => setDiscardOpen(false)}
        onConfirm={() => void discard()}
      />
      <SessionCompleteSheet
        outcome={outcome}
        onClose={() => {
          setOutcome(null);
          void navigate('/');
        }}
      />
    </Screen>
  );
}
