import { useState } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { Button } from '@/components/Button';
import { SelectField, TextAreaField, TextField } from '@/components/FormField';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Sheet } from '@/components/Sheet';
import { useSkillRepository } from '@/features/training/ui/useTraining';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  SKILL_CATEGORIES,
  SkillInputSchema,
  type Skill,
  type SkillCategory,
  type SkillInput,
} from '../domain/skill';

interface FormValues {
  name: string;
  category: SkillCategory;
  priority: '1' | '2' | '3';
  description: string;
  /** Text, so an empty box means "no goal". */
  weeklyGoal: string;
}

/** Maps the form's text values to the domain input; the domain schema stays the only validator. */
export function toSkillInput(values: FormValues): SkillInput | { weeklyGoalMinutes: 'invalid' } {
  const goalText = values.weeklyGoal.trim();
  const goal = goalText === '' ? null : Number(goalText);
  if (goal !== null && !Number.isFinite(goal)) return { weeklyGoalMinutes: 'invalid' };
  return {
    name: values.name,
    category: values.category,
    priority: Number(values.priority) as 1 | 2 | 3,
    ...(values.description.trim() ? { description: values.description } : {}),
    weeklyGoalMinutes: goal,
  };
}

const FIELD_FOR_PATH: Record<string, keyof FormValues> = {
  name: 'name',
  category: 'category',
  priority: 'priority',
  description: 'description',
  weeklyGoalMinutes: 'weeklyGoal',
};

const resolver: Resolver<FormValues> = (values) => {
  const input = toSkillInput(values);
  if (typeof input.weeklyGoalMinutes === 'string') {
    return {
      values: {},
      errors: { weeklyGoal: { type: 'validate', message: 'Enter a whole number of minutes.' } },
    };
  }
  const parsed = SkillInputSchema.safeParse(input);
  if (parsed.success) return { values, errors: {} };
  const errors: Record<string, { type: string; message: string }> = {};
  for (const issue of parsed.error.issues) {
    const field = FIELD_FOR_PATH[String(issue.path[0])];
    if (field && !errors[field]) errors[field] = { type: 'validate', message: issue.message };
  }
  return { values: {}, errors };
};

interface SkillFormSheetProps {
  open: boolean;
  onClose: () => void;
  /** Present when editing. */
  skill?: Skill | undefined;
  onSaved?: (skill: Skill) => void;
}

const PRIORITY_OPTIONS = ([1, 2, 3] as const).map((p) => ({
  value: String(p) as '1' | '2' | '3',
  label: PRIORITY_LABELS[p],
}));

export function SkillFormSheet({ open, onClose, skill, onSaved }: SkillFormSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={skill ? 'Edit skill' : 'New skill'}>
      {/* Mounted only while open so every opening starts from the right values. */}
      {open && <SkillForm skill={skill} onClose={onClose} onSaved={onSaved} />}
    </Sheet>
  );
}

function SkillForm({
  skill,
  onClose,
  onSaved,
}: {
  skill: Skill | undefined;
  onClose: () => void;
  onSaved: ((skill: Skill) => void) | undefined;
}) {
  const repository = useSkillRepository();
  const [saveError, setSaveError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver,
    defaultValues: {
      name: skill?.name ?? '',
      category: skill?.category ?? 'custom',
      priority: String(skill?.priority ?? 2) as '1' | '2' | '3',
      description: skill?.description ?? '',
      weeklyGoal: skill?.weeklyGoalMinutes ? String(skill.weeklyGoalMinutes) : '',
    },
  });

  const priority = useWatch({ control, name: 'priority' });

  const onSubmit = handleSubmit(async (values) => {
    setSaveError(null);
    const input = toSkillInput(values) as SkillInput;
    const result = skill
      ? await repository.update(skill.id, input)
      : await repository.create(input);
    if (!result.ok) {
      setSaveError(result.error.message);
      return;
    }
    onSaved?.(result.value);
    onClose();
  });

  return (
    <form onSubmit={(e) => void onSubmit(e)} noValidate className="space-y-4">
      <TextField
        label="Name"
        autoComplete="off"
        autoCapitalize="sentences"
        maxLength={80}
        error={errors.name?.message}
        {...register('name')}
      />
      <SelectField label="Category" error={errors.category?.message} {...register('category')}>
        {SKILL_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </SelectField>
      <div className="space-y-1.5">
        <span className="block px-1 type-subhead font-medium">Priority</span>
        <SegmentedControl
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={priority}
          onChange={(value) => setValue('priority', value)}
        />
      </div>
      <TextField
        label="Weekly goal (minutes)"
        hint="Optional. Progress shows against it on Home and the skill page."
        inputMode="numeric"
        placeholder="e.g. 120"
        error={errors.weeklyGoal?.message}
        {...register('weeklyGoal')}
      />
      <TextAreaField
        label="Notes"
        maxLength={300}
        error={errors.description?.message}
        {...register('description')}
      />
      {saveError && (
        <p role="alert" className="type-subhead text-danger">
          {saveError}
        </p>
      )}
      <Button type="submit" fullWidth loading={isSubmitting}>
        {skill ? 'Save changes' : 'Add skill'}
      </Button>
      <Button type="button" variant="ghost" fullWidth onClick={onClose}>
        Cancel
      </Button>
    </form>
  );
}
