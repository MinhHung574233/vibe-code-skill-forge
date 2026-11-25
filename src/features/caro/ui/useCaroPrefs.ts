import { useCallback, useEffect, useState } from 'react';
import { createAiClient, type AiClient } from '../worker/aiClient';

const CONFIRM_KEY = 'caro-confirm-moves';

/** Remembered choice, else on for touch screens (small cells) and off for a mouse. */
function initialConfirmMoves(): boolean {
  try {
    const saved = window.localStorage.getItem(CONFIRM_KEY);
    if (saved !== null) return saved === '1';
  } catch {
    // Storage blocked (private mode): fall through to the device default.
  }
  return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
}

/** "Confirm each move" is a per-device convenience, so it lives in localStorage, not in backups. */
export function useConfirmMoves(): [boolean, (value: boolean) => void] {
  const [confirm, setConfirm] = useState(initialConfirmMoves);
  const update = useCallback((value: boolean) => {
    setConfirm(value);
    try {
      window.localStorage.setItem(CONFIRM_KEY, value ? '1' : '0');
    } catch {
      // Not persisted; the choice still applies to this visit.
    }
  }, []);
  return [confirm, update];
}

/** One engine client per game screen; its worker is stopped when the screen goes away. */
export function useAiClient(): AiClient {
  const [client] = useState(createAiClient);
  useEffect(() => () => client.dispose(), [client]);
  return client;
}
