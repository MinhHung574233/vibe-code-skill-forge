import { describe, expect, it, vi } from 'vitest';
import { readStorageHealth } from './storage';

interface Fake {
  storage: StorageManager;
  persist: ReturnType<typeof vi.fn>;
}

function fakeStorage(
  options: { persisted?: boolean; persistResult?: boolean; throws?: boolean } = {},
): Fake {
  const { persisted = false, persistResult = true, throws = false } = options;
  const persist = vi.fn().mockResolvedValue(persistResult);
  const storage = {
    persisted: throws
      ? vi.fn().mockRejectedValue(new Error('denied'))
      : vi.fn().mockResolvedValue(persisted),
    persist,
    estimate: throws
      ? vi.fn().mockRejectedValue(new Error('denied'))
      : vi.fn().mockResolvedValue({ usage: 2048, quota: 1_000_000 }),
  } as unknown as StorageManager;
  return { storage, persist };
}

describe('readStorageHealth', () => {
  it('reports persisted state and usage without requesting when not asked', async () => {
    const { storage, persist } = fakeStorage();
    const health = await readStorageHealth({ standalone: false, requestPersist: false, storage });
    expect(health).toEqual({
      persistSupported: true,
      persisted: false,
      usageBytes: 2048,
      quotaBytes: 1_000_000,
      standalone: false,
    });
    expect(persist).not.toHaveBeenCalled();
  });

  it('requests persistence when asked and not yet persisted, and reports the answer', async () => {
    const { storage, persist } = fakeStorage();
    const health = await readStorageHealth({ standalone: true, requestPersist: true, storage });
    expect(persist).toHaveBeenCalledTimes(1);
    expect(health.persisted).toBe(true);
    expect(health.standalone).toBe(true);
  });

  it('reports a denied request honestly (iOS may refuse)', async () => {
    const { storage } = fakeStorage({ persistResult: false });
    const health = await readStorageHealth({ standalone: true, requestPersist: true, storage });
    expect(health.persisted).toBe(false);
  });

  it('does not re-request when already persisted', async () => {
    const { storage, persist } = fakeStorage({ persisted: true });
    const health = await readStorageHealth({ standalone: true, requestPersist: true, storage });
    expect(persist).not.toHaveBeenCalled();
    expect(health.persisted).toBe(true);
  });

  it('degrades to unknown when the API throws or is missing', async () => {
    const { storage } = fakeStorage({ throws: true });
    expect(
      await readStorageHealth({ standalone: true, requestPersist: true, storage }),
    ).toMatchObject({ persisted: null, usageBytes: null, quotaBytes: null, standalone: true });

    const bare = {} as StorageManager;
    expect(
      await readStorageHealth({ standalone: false, requestPersist: true, storage: bare }),
    ).toMatchObject({ persistSupported: false, persisted: null });
  });
});
