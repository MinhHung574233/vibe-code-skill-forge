import { afterEach, describe, expect, it, vi } from 'vitest';
import { chooseMove, type AiRequest } from '../domain/ai/engine';
import { createAiClient } from './aiClient';

const request: AiRequest = {
  size: 15,
  level: 'easy',
  moves: [112, 113, 97],
  seed: 7,
  limits: { maxMs: 60_000 },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('createAiClient', () => {
  it('runs the engine on the main thread when there is no Worker (same answer as the engine)', async () => {
    const client = createAiClient();
    const result = await client.chooseMove(request);
    expect(result.move).toBe(chooseMove(request).move);
    client.dispose();
    expect((await client.chooseMove(request)).move).toBe(result.move); // still usable
  });

  it('uses the worker when there is one and returns its reply', async () => {
    const posted: unknown[] = [];
    class FakeWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: (() => void) | null = null;
      postMessage(message: { id: number }) {
        posted.push(message);
        queueMicrotask(() =>
          this.onmessage?.({
            data: {
              id: message.id,
              result: { move: 42, score: 0, depth: 1, nodes: 1, elapsedMs: 0, source: 'search' },
            },
          } as MessageEvent),
        );
      }
      terminate() {}
    }
    vi.stubGlobal('Worker', FakeWorker);
    const client = createAiClient();
    expect((await client.chooseMove(request)).move).toBe(42);
    expect(posted).toHaveLength(1);
    client.dispose();
  });

  it('turns a worker-side engine error into a rejection', async () => {
    class ThrowingWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: (() => void) | null = null;
      postMessage(message: { id: number }) {
        queueMicrotask(() =>
          this.onmessage?.({
            data: { id: message.id, error: 'The board is full' },
          } as MessageEvent),
        );
      }
      terminate() {}
    }
    vi.stubGlobal('Worker', ThrowingWorker);
    await expect(createAiClient().chooseMove(request)).rejects.toThrow('The board is full');
  });

  it('falls back to the main thread when the worker crashes, without losing the request', async () => {
    class CrashingWorker {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: (() => void) | null = null;
      postMessage() {
        queueMicrotask(() => this.onerror?.());
      }
      terminate() {}
    }
    vi.stubGlobal('Worker', CrashingWorker);
    const client = createAiClient();
    const result = await client.chooseMove(request);
    expect(result.move).toBe(chooseMove(request).move);
    // Later requests skip the broken worker entirely.
    expect((await client.chooseMove(request)).move).toBe(result.move);
  });

  it('falls back when the Worker constructor throws', async () => {
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          throw new Error('blocked by CSP');
        }
      },
    );
    const result = await createAiClient().chooseMove(request);
    expect(result.move).toBe(chooseMove(request).move);
  });
});
