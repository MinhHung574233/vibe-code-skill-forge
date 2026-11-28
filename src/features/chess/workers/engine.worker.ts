import { ChessEngine } from '../domain/engine';
import { handleEngineRequest, type EngineRequest, type EngineResponse } from './engineRequest';

const scope = self as unknown as DedicatedWorkerGlobalScope;
// one engine per worker: its transposition table is reused across the moves of a game
const engine = new ChessEngine();

scope.onmessage = (event: MessageEvent<EngineRequest>) => {
  const request = event.data;
  try {
    const reply = handleEngineRequest(engine, request);
    scope.postMessage({ id: request.id, reply } satisfies EngineResponse);
  } catch (e) {
    scope.postMessage({
      id: request.id,
      error: e instanceof Error ? e.message : 'engine failed',
    } satisfies EngineResponse);
  }
};
