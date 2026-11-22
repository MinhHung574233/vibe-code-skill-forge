/**
 * When to remind the user to back up (PRD §5.9). Backups are the only protection against iOS
 * storage eviction, deleting the Home Screen icon and device loss, so the reminder is real
 * policy, not decoration. Pure function: easy to test and tune.
 */
export const BACKUP_OVERDUE_DAYS = 14;
export const BACKUP_MANY_CHANGES = 200;

const DAY_MS = 86_400_000;

export type BackupNudge =
  | { kind: 'none' }
  /** There is data but it has never been backed up. */
  | { kind: 'never' }
  | { kind: 'overdue'; days: number }
  | { kind: 'many-changes'; added: number };

export function backupNudge(input: {
  now: number;
  lastBackupAt: number | null;
  /** Current number of user-data rows. */
  totalRows: number;
  /** User-data rows when the last backup was made. */
  rowsAtLastBackup: number | null;
}): BackupNudge {
  const { now, lastBackupAt, totalRows, rowsAtLastBackup } = input;
  if (totalRows <= 0) return { kind: 'none' }; // nothing worth protecting yet
  if (lastBackupAt === null) return { kind: 'never' };

  const days = Math.floor((now - lastBackupAt) / DAY_MS);
  if (days >= BACKUP_OVERDUE_DAYS) return { kind: 'overdue', days };

  if (rowsAtLastBackup !== null && totalRows - rowsAtLastBackup >= BACKUP_MANY_CHANGES) {
    return { kind: 'many-changes', added: totalRows - rowsAtLastBackup };
  }
  return { kind: 'none' };
}

export function describeNudge(nudge: BackupNudge): string | null {
  switch (nudge.kind) {
    case 'none':
      return null;
    case 'never':
      return 'You have not backed up yet. A backup is the only way to recover your data if iOS clears it.';
    case 'overdue':
      return `Your last backup was ${nudge.days} days ago.`;
    case 'many-changes':
      return `${nudge.added} new items since your last backup.`;
  }
}
