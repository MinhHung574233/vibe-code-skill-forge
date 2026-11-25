import { afterEach, describe, expect, it, vi } from 'vitest';
import { newGame, playStone, serializeGame } from '../domain/game';
import { createAiEngine } from './aiEngine';
import { solveRequest } from './aiProtocol';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AI engine without Web Workers', () => {
  it('falls back to the main thread and still returns a legal move', async () => {
    vi.stubGlobal('Worker', undefined);
    const engine = createAiEngine();
    const game = serializeGame(newGame({ size: 9, komi: 6.5, handicap: 0 }));
    const move = await engine.choose(game, 'easy', 7);
    expect(move.kind).toBe('move');
    engine.dispose();
  });

  it('a main-thread request already scheduled still settles after dispose', async () => {
    vi.stubGlobal('Worker', undefined);
    const engine = createAiEngine();
    const pending = engine.choose(
      serializeGame(newGame({ size: 9, komi: 6.5, handicap: 0 })),
      'easy',
      1,
    );
    engine.dispose(); // the fallback has already scheduled its work; it must still settle
    await expect(pending).resolves.toBeDefined();
  });
});

describe('AI engine with a worker', () => {
  class FakeWorker {
    static last: FakeWorker | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: (() => void) | null = null;
    posted: unknown[] = [];
    terminated = false;
    constructor() {
      FakeWorker.last = this;
    }
    postMessage(message: unknown) {
      this.posted.push(message);
    }
    terminate() {
      this.terminated = true;
    }
  }

  it('posts the request to the worker and resolves with its reply', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    const engine = createAiEngine();
    const promise = engine.choose(
      serializeGame(newGame({ size: 9, komi: 6.5, handicap: 0 })),
      'hard',
      5,
    );
    const worker = FakeWorker.last;
    expect(worker?.posted).toHaveLength(1);
    const request = worker?.posted[0] as { id: number };
    worker?.onmessage?.({ data: { id: request.id, move: { kind: 'pass' } } } as MessageEvent);
    await expect(promise).resolves.toEqual({ kind: 'pass' });
    engine.dispose();
    expect(worker?.terminated).toBe(true);
  });

  it('rejects a request that is still waiting on the worker when the screen goes away', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    const engine = createAiEngine();
    const promise = engine.choose(
      serializeGame(newGame({ size: 9, komi: 6.5, handicap: 0 })),
      'easy',
      5,
    );
    engine.dispose();
    await expect(promise).rejects.toThrow('AI stopped.');
  });

  it('turns a worker error reply into a rejection', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    const engine = createAiEngine();
    const promise = engine.choose(
      serializeGame(newGame({ size: 9, komi: 6.5, handicap: 0 })),
      'easy',
      5,
    );
    const worker = FakeWorker.last;
    const request = worker?.posted[0] as { id: number };
    worker?.onmessage?.({ data: { id: request.id, error: 'boom' } } as MessageEvent);
    await expect(promise).rejects.toThrow('boom');
  });

  it('falls back to the main thread if the worker fails to start', async () => {
    vi.stubGlobal('Worker', FakeWorker);
    const engine = createAiEngine();
    const promise = engine.choose(
      serializeGame(newGame({ size: 9, komi: 6.5, handicap: 0 })),
      'easy',
      5,
    );
    FakeWorker.last?.onerror?.();
    await expect(promise).resolves.toMatchObject({ kind: 'move' });
    expect(FakeWorker.last?.terminated).toBe(true);
  });
});

describe('solveRequest', () => {
  it('is reproducible for the same game and seed, and rejects corrupt records', () => {
    const state = newGame({ size: 9, komi: 6.5, handicap: 0 });
    const played = playStone(state, 40);
    if (!played.ok) throw new Error('rejected');
    const request = { id: 1, game: serializeGame(played.state), level: 'easy' as const, seed: 3 };
    expect(solveRequest(request)).toEqual(solveRequest(request));
    expect(() =>
      solveRequest({ ...request, game: { ...request.game, moves: [40, 40] } }),
    ).toThrow();
  });
});
