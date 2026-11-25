import type { AiMove, Level } from '../domain/ai';
import type { SerializedGame } from '../domain/game';
import { solveRequest, type AiRequest, type AiResponse } from './aiProtocol';

export interface AiEngine {
  choose(game: SerializedGame, level: Level, seed: number): Promise<AiMove>;
  dispose(): void;
}

interface Pending {
  request: AiRequest;
  resolve: (move: AiMove) => void;
  reject: (error: Error) => void;
}

/** Runs the search on the main thread, after a tick so the "thinking" state can paint first. */
function runHere(job: Pending): void {
  setTimeout(() => {
    try {
      job.resolve(solveRequest(job.request));
    } catch (cause) {
      job.reject(cause instanceof Error ? cause : new Error('AI failed.'));
    }
  }, 0);
}

/**
 * The real engine: a module Web Worker (production CSP allows `worker-src 'self'` only, which a
 * bundled module worker satisfies), with a main-thread fallback when workers are unavailable or
 * fail to start. At most one decision is in flight at a time in practice.
 */
export function createAiEngine(): AiEngine {
  let worker: Worker | null | undefined; // undefined: not started yet; null: unavailable
  let nextId = 0;
  const pending = new Map<number, Pending>();

  const fallBack = () => {
    worker?.terminate();
    worker = null;
    const jobs = [...pending.values()];
    pending.clear();
    for (const job of jobs) runHere(job);
  };

  const start = (): Worker | null => {
    if (worker !== undefined) return worker;
    if (typeof Worker === 'undefined') {
      worker = null;
      return null;
    }
    try {
      const created = new Worker(new URL('./ai.worker.ts', import.meta.url), { type: 'module' });
      created.onmessage = (event: MessageEvent<AiResponse>) => {
        const reply = event.data;
        const job = pending.get(reply.id);
        if (!job) return;
        pending.delete(reply.id);
        if ('error' in reply) job.reject(new Error(reply.error));
        else job.resolve(reply.move);
      };
      created.onerror = fallBack;
      worker = created;
    } catch {
      worker = null;
    }
    return worker;
  };

  return {
    choose: (game, level, seed) =>
      new Promise<AiMove>((resolve, reject) => {
        nextId += 1;
        const request: AiRequest = { id: nextId, game, level, seed };
        const job: Pending = { request, resolve, reject };
        const w = start();
        if (!w) {
          runHere(job);
          return;
        }
        pending.set(request.id, job);
        w.postMessage(request);
      }),
    dispose: () => {
      worker?.terminate();
      worker = undefined;
      for (const job of pending.values()) job.reject(new Error('AI stopped.'));
      pending.clear();
    },
  };
}
