import { describe, expect, it } from 'vitest';
import { backupNudge, describeNudge } from './backupNudge';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 10, 22, 12);

describe('backupNudge', () => {
  it('stays quiet when there is no data to protect', () => {
    expect(
      backupNudge({ now: NOW, lastBackupAt: null, totalRows: 0, rowsAtLastBackup: null }),
    ).toEqual({
      kind: 'none',
    });
  });

  it('asks for a first backup once data exists', () => {
    expect(
      backupNudge({ now: NOW, lastBackupAt: null, totalRows: 3, rowsAtLastBackup: null }),
    ).toEqual({
      kind: 'never',
    });
  });

  it('is quiet right after a backup', () => {
    expect(
      backupNudge({ now: NOW, lastBackupAt: NOW - DAY, totalRows: 10, rowsAtLastBackup: 10 }),
    ).toEqual({ kind: 'none' });
  });

  it('becomes overdue exactly at 14 days', () => {
    const at = (days: number) =>
      backupNudge({
        now: NOW,
        lastBackupAt: NOW - days * DAY,
        totalRows: 10,
        rowsAtLastBackup: 10,
      });
    expect(at(13).kind).toBe('none');
    expect(at(14)).toEqual({ kind: 'overdue', days: 14 });
    expect(at(40)).toEqual({ kind: 'overdue', days: 40 });
  });

  it('flags many changes since the last backup at 200', () => {
    const rows = (total: number) =>
      backupNudge({ now: NOW, lastBackupAt: NOW - DAY, totalRows: total, rowsAtLastBackup: 50 });
    expect(rows(249).kind).toBe('none');
    expect(rows(250)).toEqual({ kind: 'many-changes', added: 200 });
  });

  it('describes each state in plain language', () => {
    expect(describeNudge({ kind: 'none' })).toBeNull();
    expect(describeNudge({ kind: 'never' })).toMatch(/not backed up/);
    expect(describeNudge({ kind: 'overdue', days: 20 })).toBe('Your last backup was 20 days ago.');
    expect(describeNudge({ kind: 'many-changes', added: 210 })).toMatch(/210 new items/);
  });
});
