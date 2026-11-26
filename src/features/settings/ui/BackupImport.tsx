import { useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Sheet } from '@/components/Sheet';
import {
  importBackup,
  parseBackup,
  summarize,
  type BackupFile,
  type BackupSummary,
} from '@/db/backup';
import { t } from '@/i18n/core';
import { readFileText } from '@/services/backupFile';
import { formatDateTime } from '@/utils/format';

const TABLE_LABELS: Record<string, string> = {
  skills: 'Skills',
  skillGoals: 'Skill goals',
  settings: 'Settings',
};

interface BackupImportProps {
  /** Called after the data has been replaced. The caller re-boots the app. */
  onImported: () => void;
  variant?: 'secondary' | 'primary' | 'ghost';
  label?: string;
}

type Stage =
  | { kind: 'idle' }
  | { kind: 'reading' }
  | { kind: 'preview'; file: BackupFile; summary: BackupSummary }
  | { kind: 'importing' };

/**
 * Restore flow: choose file -> full validation -> preview what will be restored -> explicit
 * confirmation -> replace. Nothing is touched until the user confirms, and a failed import
 * rolls back to the previous data (see db/backup.ts).
 */
export function BackupImport({ onImported, variant = 'secondary', label }: BackupImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>({ kind: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setStage({ kind: 'reading' });
    try {
      const parsed = await parseBackup(await readFileText(file));
      if (!parsed.ok) {
        setError(parsed.error.message);
        setStage({ kind: 'idle' });
        return;
      }
      setStage({ kind: 'preview', file: parsed.value, summary: summarize(parsed.value) });
    } catch (cause) {
      setError(cause instanceof RangeError ? cause.message : t('That file could not be read.'));
      setStage({ kind: 'idle' });
    }
  };

  const apply = async (file: BackupFile) => {
    setConfirming(false);
    setStage({ kind: 'importing' });
    const result = await importBackup(file);
    if (!result.ok) {
      setError(result.error.message);
      setStage({ kind: 'idle' });
      return;
    }
    onImported();
  };

  const preview = stage.kind === 'preview' ? stage : null;
  const busy = stage.kind === 'reading' || stage.kind === 'importing';

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        data-testid="backup-file-input"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = ''; // allow choosing the same file again
        }}
      />
      <Button variant={variant} loading={busy} onClick={() => inputRef.current?.click()}>
        {stage.kind === 'importing' ? t('Restoring…') : (label ?? t('Restore from backup file'))}
      </Button>
      {error && (
        <p role="alert" className="mt-2 type-subhead text-danger">
          {error}
        </p>
      )}

      <Sheet
        open={preview !== null}
        onClose={() => setStage({ kind: 'idle' })}
        title={t('Restore this backup?')}
      >
        {preview && (
          <div>
            <p className="type-subhead text-muted">
              {t('Made {date}', { date: formatDateTime(preview.summary.exportedAt) })}
              {preview.summary.appVersion
                ? ` · ${t('app {version}', { version: preview.summary.appVersion })}`
                : ''}
            </p>
            <ul className="my-3 divide-y divide-border rounded-xl border border-border">
              {Object.entries(preview.summary.counts).map(([table, count]) => (
                <li key={table} className="flex justify-between px-3 py-2 type-body">
                  <span>{TABLE_LABELS[table] ? t(TABLE_LABELS[table]) : table}</span>
                  <span className="tabular-nums text-muted">{count}</span>
                </li>
              ))}
            </ul>
            <p className="mb-4 type-subhead text-muted">
              {t(
                'Restoring replaces everything currently on this device. A safety copy of your current data is kept first.',
              )}
            </p>
            <Button fullWidth variant="destructive" onClick={() => setConfirming(true)}>
              {t('Replace my data')}
            </Button>
            <Button
              fullWidth
              variant="ghost"
              className="mt-2"
              onClick={() => setStage({ kind: 'idle' })}
            >
              {t('Cancel')}
            </Button>
          </div>
        )}
      </Sheet>

      <ConfirmDialog
        open={confirming && preview !== null}
        title={t('Replace all data on this device?')}
        message={t(
          'Your current data will be replaced by this backup. This cannot be undone from the app.',
        )}
        confirmLabel={t('Replace')}
        destructive
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          if (preview) void apply(preview.file);
        }}
      />
    </>
  );
}
