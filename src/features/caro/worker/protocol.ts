import type { AiRequest, AiResult } from '../domain/ai/engine';

/** Messages between the page and the engine worker (plain data: structured-clone friendly). */
export interface WorkerRequest {
  id: number;
  request: AiRequest;
}

export type WorkerReply = { id: number; result: AiResult } | { id: number; error: string };
