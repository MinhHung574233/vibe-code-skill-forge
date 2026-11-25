import { chooseMove } from '../domain/ai/engine';
import type { WorkerReply, WorkerRequest } from './protocol';

/** Runs the engine off the main thread so the board never freezes while the computer thinks. */
const scope = self as unknown as DedicatedWorkerGlobalScope;

scope.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const { id, request } = event.data;
  let reply: WorkerReply;
  try {
    reply = { id, result: chooseMove(request) };
  } catch (error) {
    reply = { id, error: error instanceof Error ? error.message : 'The engine failed.' };
  }
  scope.postMessage(reply);
});
