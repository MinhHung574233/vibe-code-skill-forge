import { analyseMove, suggestMove, type MoveAnalysis, type MoveSuggestion } from '../domain/coach';
import type { ChessEngine, Level } from '../domain/engine';
import type { SearchResult } from '../domain/search';

/** What the UI can ask the engine for. Plain data only: it crosses the worker boundary. */
export type EngineRequest =
  | { kind: 'move'; id: number; fen: string; level: Level; history: readonly string[] }
  | { kind: 'analyse'; id: number; fen: string; move: string; history: readonly string[] }
  | { kind: 'suggest'; id: number; fen: string; history: readonly string[] };

export type EngineReply = SearchResult | MoveAnalysis | MoveSuggestion;

export type EngineResponse = { id: number; reply: EngineReply } | { id: number; error: string };

/** Shared by the worker and the main-thread fallback so both behave identically. */
export function handleEngineRequest(engine: ChessEngine, request: EngineRequest): EngineReply {
  switch (request.kind) {
    case 'move':
      return engine.findMove({ fen: request.fen, level: request.level, history: request.history });
    case 'analyse':
      return analyseMove(engine, {
        fen: request.fen,
        move: request.move,
        history: request.history,
      });
    case 'suggest':
      return suggestMove(engine, { fen: request.fen, history: request.history });
  }
}
