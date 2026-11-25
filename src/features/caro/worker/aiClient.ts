import { chooseMove, type AiRequest, type AiResult } from '../domain/ai/engine';
import type { WorkerReply, WorkerRequest } from './protocol';

export interface AiClient {
  chooseMove(request: AiRequest): Promise<AiResult>;
  /** Stops the worker. The client stays usable: the next request starts a new one. */
  dispose(): void;
}

interface Pending {
  request: AiRequest;
  resolve: (result: AiResult) => void;
  reject: (error: Error) => void;
}

/** Runs the engine on the main thread, one task later so the "thinking" state can paint first. */
function runOnMainThread(request: AiRequest): Promise<AiResult> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        resolve(chooseMove(request));
      } catch (error) {
        reject(error instanceof Error ? error : new Error('The engine failed.'));
      }
    }, 0);
  });
}

/**
 * Engine access for the UI. It prefers a module Web Worker (the production CSP allows
 * `worker-src 'self'` only, so the worker is a built file, never a blob). Without Worker support,
 * or if the worker fails to load or crashes, requests run on the main thread instead: the
 * computer may then freeze the page for up to its time budget, but the game still works.
 */
export function createAiClient(): AiClient {
  let worker: Worker | null = null;
  let workerUnavailable = typeof Worker === 'undefined';
  let nextId = 1;
  const pending = new Map<number, Pending>();

  const fallBack = () => {
    workerUnavailable = true;
    worker?.terminate();
    worker = null;
    const stranded = [...pending.values()];
    pending.clear();
    for (const job of stranded) {
      void runOnMainThread(job.request).then(job.resolve, job.reject);
    }
  };

  const ensureWorker = (): Worker | null => {
    if (workerUnavailable) return null;
    if (worker) return worker;
    try {
      const created = new Worker(new URL('./aiWorker.ts', import.meta.url), { type: 'module' });
      created.onmessage = (event: MessageEvent<WorkerReply>) => {
        const reply = event.data;
        const job = pending.get(reply.id);
        if (!job) return;
        pending.delete(reply.id);
        if ('result' in reply) job.resolve(reply.result);
        else job.reject(new Error(reply.error));
      };
      created.onerror = fallBack;
      worker = created;
    } catch {
      workerUnavailable = true;
    }
    return worker;
  };

  return {
    chooseMove(request) {
      const active = ensureWorker();
      if (!active) return runOnMainThread(request);
      return new Promise<AiResult>((resolve, reject) => {
        const id = nextId++;
        pending.set(id, { request, resolve, reject });
        const message: WorkerRequest = { id, request };
        active.postMessage(message);
      });
    },
    dispose() {
      worker?.terminate();
      worker = null;
      pending.clear();
    },
  };
}
