import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_BACKUP_BYTES,
  canShareFiles,
  copyText,
  downloadFile,
  makeBackupFile,
  readFileText,
  shareFile,
} from './backupFile';

const file = () => makeBackupFile('{"a":1}', 'skillforge-backup-2026-11-22.json');

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('shareFile', () => {
  it('reports unsupported when Web Share cannot share files', async () => {
    vi.stubGlobal('navigator', { share: vi.fn(), canShare: () => false });
    expect(canShareFiles(file())).toBe(false);
    expect(await shareFile(file())).toBe('unsupported');
  });

  it('reports done when the share completes', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share, canShare: () => true });
    expect(await shareFile(file())).toBe('done');
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ files: [expect.any(File)] }));
  });

  it('treats dismissing the share sheet as cancelled, not as a successful backup', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('dismissed', 'AbortError'));
    vi.stubGlobal('navigator', { share, canShare: () => true });
    expect(await shareFile(file())).toBe('cancelled');
  });

  it('reports other failures as failed', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('nope', 'NotAllowedError'));
    vi.stubGlobal('navigator', { share, canShare: () => true });
    expect(await shareFile(file())).toBe('failed');
  });
});

describe('downloadFile', () => {
  it('clicks a download link with the file name and revokes the URL later', () => {
    vi.useFakeTimers();
    const create = vi.fn().mockReturnValue('blob:x');
    const revoke = vi.fn();
    vi.stubGlobal('URL', { createObjectURL: create, revokeObjectURL: revoke });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    expect(downloadFile(file())).toBe('done');
    expect(click).toHaveBeenCalledTimes(1);
    expect(revoke).not.toHaveBeenCalled(); // not immediately: that can cancel iOS downloads
    vi.advanceTimersByTime(60_000);
    expect(revoke).toHaveBeenCalledWith('blob:x');
    expect(document.querySelector('a[download]')).toBeNull();
    vi.useRealTimers();
  });
});

describe('copyText', () => {
  it('copies when the clipboard is available and reports unsupported otherwise', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    expect(await copyText('data')).toBe('done');
    expect(writeText).toHaveBeenCalledWith('data');

    vi.stubGlobal('navigator', {});
    expect(await copyText('data')).toBe('unsupported');
  });
});

describe('readFileText', () => {
  it('reads small files and rejects implausibly large ones', async () => {
    expect(await readFileText(file())).toBe('{"a":1}');
    const huge = { size: MAX_BACKUP_BYTES + 1, text: vi.fn() } as unknown as File;
    await expect(readFileText(huge)).rejects.toThrow(/too large/);
  });
});
