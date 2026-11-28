import type { MoveAnalysis, MoveSuggestion } from '../domain/coach';
import { ChessEngine, type Level } from '../domain/engine';
import type { SearchResult } from '../domain/search';
import {
  handleEngineRequest,
  type EngineReply,
  type EngineRequest,
  type EngineResponse,
} from './engineRequest';

export interface EngineClient {
  /** Resolves with the engine's move; rejects if the search failed. */
  findMove(fen: string, level: Level, history: readonly string[]): Promise<SearchResult>;
  /** Coach: grades `move` (UCI) played in `fen`. */
  analyse(fen: string, move: string, history: readonly string[]): Promise<MoveAnalysis>;
  /** Coach: the engine's best move in `fen` and what it achieves. */
  suggest(fen: string, history: readonly string[]): Promise<MoveSuggestion>;
  dispose(): void;
}

interface Pending {
  request: EngineRequest;
  resolve: (r: EngineReply) => void;
  reject: (e: Error) => void;
}

type WithoutId<T> = T extends unknown ? Omit<T, 'id'> : never;

/**
 * Runs the search in a module Web Worker so the board stays responsive, and falls back to the
 * main thread when workers are unavailable (tests, locked-down browsers) or the worker dies.
 * The CSP allows only same-origin workers, which is what `new URL(..., import.meta.url)` yields.
 */
export function createEngineClient(): EngineClient {
  let worker: Worker | null = null;
  let fallback: ChessEngine | null = null;
  let nextId = 1;
  const pending = new Map<number, Pending>();

  const runOnMainThread = ({ request, resolve, reject }: Pending) => {
    // yield first so the "thinking" state paints before the search blocks the thread
    window.setTimeout(() => {
      try {
        fallback ??= new ChessEngine();
        resolve(handleEngineRequest(fallback, request));
      } catch (e) {
        reject(e instanceof Error ? e : new Error('engine failed'));
      }
    }, 20);
  };

  const failOver = () => {
    worker?.terminate();
    worker = null;
    for (const [id, item] of pending) {
      pending.delete(id);
      runOnMainThread(item);
    }
  };

  if (typeof Worker !== 'undefined') {
    try {
      worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (event: MessageEvent<EngineResponse>) => {
        const item = pending.get(event.data.id);
        if (!item) return;
        pending.delete(event.data.id);
        if ('error' in event.data) item.reject(new Error(event.data.error));
        else item.resolve(event.data.reply);
      };
      worker.onerror = failOver;
    } catch {
      worker = null; // construction can throw under a strict CSP or without module-worker support
    }
  }

  const send = <T extends EngineReply>(body: WithoutId<EngineRequest>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const request = { ...body, id: nextId++ };
      const item: Pending = { request, resolve: resolve as (r: EngineReply) => void, reject };
      if (worker) {
        pending.set(request.id, item);
        worker.postMessage(request);
      } else {
        runOnMainThread(item);
      }
    });

  return {
    findMove: (fen, level, history) => send<SearchResult>({ kind: 'move', fen, level, history }),
    analyse: (fen, move, history) => send<MoveAnalysis>({ kind: 'analyse', fen, move, history }),
    suggest: (fen, history) => send<MoveSuggestion>({ kind: 'suggest', fen, history }),
    dispose() {
      worker?.terminate();
      worker = null;
      for (const item of pending.values()) item.reject(new Error('disposed'));
      pending.clear();
    },
  };
}
