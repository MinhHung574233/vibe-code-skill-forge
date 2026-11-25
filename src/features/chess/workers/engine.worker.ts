import { ChessEngine, type Level } from '../domain/engine';
import type { SearchResult } from '../domain/search';

export interface EngineRequest {
  id: number;
  fen: string;
  level: Level;
  history: readonly string[];
}

export type EngineResponse =
  | { id: number; result: SearchResult }
  | { id: number; error: string };

const scope = self as unknown as DedicatedWorkerGlobalScope;
// one engine per worker: its transposition table is reused across the moves of a game
const engine = new ChessEngine();

scope.onmessage = (event: MessageEvent<EngineRequest>) => {
  const { id, fen, level, history } = event.data;
  try {
    const result = engine.findMove({ fen, level, history });
    scope.postMessage({ id, result } satisfies EngineResponse);
  } catch (e) {
    scope.postMessage({ id, error: e instanceof Error ? e.message : 'engine failed' } satisfies EngineResponse);
  }
};
