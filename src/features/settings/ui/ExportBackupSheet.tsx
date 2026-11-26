import { useEffect, useState } from 'react';
import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import {
  backupFileName,
  buildBackup,
  serializeBackup,
  summarize,
  type BackupSummary,
} from '@/db/backup';
import { getDb } from '@/db/boot';
import { toAppError } from '@/db/errors';
import { countMarkerTables, totalRows } from '@/db/marker';
import { t } from '@/i18n/core';
import {
  canShareFiles,
  copyText,
  downloadFile,
  makeBackupFile,
  shareFile,
  type DeliveryResult,
} from '@/services/backupFile';
import { useSettingsRepository } from './useSettings';

interface ExportBackupSheetProps {
  open: boolean;
  onClose: () => void;
}

type Prepared =
  | { kind: 'preparing' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; file: File; text: string; summary: BackupSummary; userRows: number };

/**
 * Two-step export. The file is built when the sheet opens, so the Share button can call
 * navigator.share() synchronously from the tap (iOS requires a fresh user gesture).
 * A backup is only recorded as done when the share/download actually went through.
 */
export function ExportBackupSheet({ open, onClose }: ExportBackupSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={t('Back up your data')}>
      {/* Mounted only while open, so every opening starts fresh and rebuilds the file. */}
      {open && <ExportBody />}
    </Sheet>
  );
}

function ExportBody() {
  const settings = useSettingsRepository();
  const [prepared, setPrepared] = useState<Prepared>({ kind: 'preparing' });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const db = getDb();
        const backup = await buildBackup(db, { appVersion: __APP_VERSION__ });
        const text = serializeBackup(backup);
        const file = makeBackupFile(text, backupFileName(backup.exportedAt));
        const userRows = totalRows(await countMarkerTables(db));
        if (!cancelled) {
          setPrepared({ kind: 'ready', file, text, summary: summarize(backup), userRows });
        }
      } catch (cause) {
        if (!cancelled) setPrepared({ kind: 'error', message: toAppError(cause).message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const finish = async (result: DeliveryResult, userRows: number, doneMessage: string) => {
    if (result === 'done') {
      await settings.set('lastBackupAt', Date.now());
      await settings.set('lastBackupRowCount', userRows);
      setNotice(doneMessage);
    } else if (result === 'failed') {
      setNotice(t('That did not work. Try another option below.'));
    } else if (result === 'unsupported') {
      setNotice(t('This option is not available on this device.'));
    }
    // 'cancelled': the user dismissed the share sheet; nothing to record or say.
  };

  if (prepared.kind === 'preparing') {
    return (
      <p role="status" className="type-subhead text-muted">
        {t('Preparing your backup…')}
      </p>
    );
  }
  if (prepared.kind === 'error') {
    return (
      <p role="alert" className="type-subhead text-danger">
        {prepared.message}
      </p>
    );
  }

  const { file, text, summary, userRows } = prepared;
  const canShare = canShareFiles(file);

  return (
    <div>
      <p className="type-subhead text-muted">
        {t('{items} items · {kb} KB · {name}', {
          items: summary.totalRows,
          kb: Math.max(1, Math.round(text.length / 1024)),
          name: file.name,
        })}
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {canShare && (
          <Button
            onClick={() =>
              void shareFile(file).then((r) =>
                finish(r, userRows, t('Backup saved. Keep a copy somewhere safe.')),
              )
            }
          >
            {t('Save to Files or share')}
          </Button>
        )}
        <Button
          variant={canShare ? 'secondary' : 'primary'}
          onClick={() =>
            void finish(
              downloadFile(file),
              userRows,
              t('Download started. Check your Downloads or Files app to confirm it was saved.'),
            )
          }
        >
          {t('Download file')}
        </Button>
        <Button
          variant="ghost"
          onClick={() =>
            void copyText(text).then((r) =>
              finish(r, userRows, t('Copied. Paste it into a note or message to yourself.')),
            )
          }
        >
          {t('Copy as text')}
        </Button>
      </div>
      {notice && (
        <p role="status" className="mt-3 type-subhead">
          {notice}
        </p>
      )}
      <p className="mt-4 type-footnote text-muted">
        {t(
          'The file contains all your data and is not encrypted. Store it somewhere private, like iCloud Drive.',
        )}
      </p>
    </div>
  );
}
