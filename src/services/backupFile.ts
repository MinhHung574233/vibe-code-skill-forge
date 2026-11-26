import { t } from '@/i18n/core';

/**
 * Delivering a backup file on iPhone (IOS_PWA §6). Three paths, tried by the UI in this order:
 *  1. Web Share with a file -> "Save to Files", AirDrop, etc. Must be called directly from a tap,
 *     so the file is prepared first and `shareFile` is the only thing the tap handler does.
 *  2. A download link (`<a download>`), which behaves differently across iOS versions.
 *  3. Copy to the clipboard as a last resort.
 */
export type DeliveryResult = 'done' | 'cancelled' | 'unsupported' | 'failed';

export function makeBackupFile(text: string, fileName: string): File {
  return new File([text], fileName, { type: 'application/json' });
}

export function canShareFiles(file: File): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  );
}

export async function shareFile(file: File): Promise<DeliveryResult> {
  if (!canShareFiles(file)) return 'unsupported';
  try {
    await navigator.share({ files: [file], title: 'SkillForge backup' });
    return 'done';
  } catch (error) {
    // The user dismissing the share sheet is not a failure and must not count as a backup.
    if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
    return 'failed';
  }
}

export function downloadFile(file: File): DeliveryResult {
  try {
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Revoke later: revoking immediately can cancel the download on iOS.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return 'done';
  } catch {
    return 'failed';
  }
}

export async function copyText(text: string): Promise<DeliveryResult> {
  if (typeof navigator === 'undefined' || typeof navigator.clipboard?.writeText !== 'function') {
    return 'unsupported';
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'done';
  } catch {
    return 'failed';
  }
}

/** Reads a user-selected file as text, rejecting files that are implausibly large. */
export const MAX_BACKUP_BYTES = 50 * 1024 * 1024;

export async function readFileText(file: File): Promise<string> {
  if (file.size > MAX_BACKUP_BYTES)
    throw new RangeError(t('That file is too large to be a backup.'));
  return file.text();
}
