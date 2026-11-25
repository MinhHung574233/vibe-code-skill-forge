import { solveRequest, type AiRequest, type AiResponse } from './aiProtocol';

/** Module worker: the search runs here so the board never freezes while the AI thinks. */
const scope = self as unknown as DedicatedWorkerGlobalScope;

scope.onmessage = (event: MessageEvent<AiRequest>) => {
  const request = event.data;
  let response: AiResponse;
  try {
    response = { id: request.id, move: solveRequest(request) };
  } catch (cause) {
    response = { id: request.id, error: cause instanceof Error ? cause.message : 'AI failed.' };
  }
  scope.postMessage(response);
};
