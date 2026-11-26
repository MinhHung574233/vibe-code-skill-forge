import { useState } from 'react';
import { Button } from '@/components/Button';
import { SelectField, TextAreaField, TextField } from '@/components/FormField';
import { Sheet } from '@/components/Sheet';
import { newId } from '@/core/ids';
import { toLocalDate } from '@/core/time/localDate';
import { useNow } from '@/hooks/useNow';
import { t } from '@/i18n/core';
import { useSkills, useTrainingEngine } from './useTraining';
import { ManualLogSchema, manualSessionTimes } from '../domain/manual';
import type { CompletionOutcome } from '../domain/session';

interface ManualLogSheetProps {
  open: boolean;
  onClose: () => void;
  onRecorded: (outcome: CompletionOutcome) => void;
  defaultSkillId?: string | undefined;
}

export function ManualLogSheet({ open, onClose, onRecorded, defaultSkillId }: ManualLogSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={t('Log a session')}>
      {open && (
        <ManualLogForm onClose={onClose} onRecorded={onRecorded} defaultSkillId={defaultSkillId} />
      )}
    </Sheet>
  );
}

function ManualLogForm({ onClose, onRecorded, defaultSkillId }: Omit<ManualLogSheetProps, 'open'>) {
  const skills = useSkills();
  const engine = useTrainingEngine();
  const today = toLocalDate(useNow());
  const [skillId, setSkillId] = useState(defaultSkillId ?? '');
  const [minutes, setMinutes] = useState('');
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ minutes?: string; date?: string; form?: string }>({});
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const parsed = ManualLogSchema.safeParse({
      date,
      minutes: minutes.trim() === '' ? undefined : Number(minutes),
      ...(skillId ? { skillId } : {}),
      ...(notes.trim() ? { notes } : {}),
    });
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] === 'date' ? 'date' : 'minutes';
        next[key] ??= t(issue.message);
      }
      setErrors(next);
      return;
    }
    const times = manualSessionTimes(parsed.data.date, parsed.data.minutes, Date.now());
    if (!times) {
      setErrors({ date: t('That date is in the future.') });
      return;
    }
    setErrors({});
    setSaving(true);
    const result = await engine.recordSession({
      id: newId(),
      activityType: 'practice_session',
      source: 'manual',
      ...times,
      ...(parsed.data.skillId ? { skillId: parsed.data.skillId } : {}),
      ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
    });
    setSaving(false);
    if (!result.ok) {
      setErrors({ form: result.error.message });
      return;
    }
    onClose();
    onRecorded(result.value);
  };

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <SelectField label={t('Skill')} value={skillId} onChange={(e) => setSkillId(e.target.value)}>
        <option value="">{t('No specific skill')}</option>
        {(skills ?? []).map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </SelectField>
      <TextField
        label={t('Minutes')}
        inputMode="numeric"
        placeholder={t('e.g. 30')}
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        error={errors.minutes}
      />
      <TextField
        label={t('Day')}
        type="date"
        max={today}
        value={date}
        onChange={(e) => setDate(e.target.value)}
        error={errors.date}
      />
      <TextAreaField
        label={t('Notes')}
        maxLength={300}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <p className="type-footnote text-muted">
        {t(
          'Logged sessions count for your time, goals and streak. XP is only earned by timed sessions.',
        )}
      </p>
      {errors.form && (
        <p role="alert" className="type-subhead text-danger">
          {errors.form}
        </p>
      )}
      <Button type="submit" fullWidth loading={saving}>
        {t('Save session')}
      </Button>
      <Button type="button" variant="ghost" fullWidth onClick={onClose}>
        {t('Cancel')}
      </Button>
    </form>
  );
}
