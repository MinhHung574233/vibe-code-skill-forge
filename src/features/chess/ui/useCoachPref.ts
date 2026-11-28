import { useCallback, useState } from 'react';

const COACH_KEY = 'chess-coach';

/** Remembered choice; off until the learner turns it on. */
function initialCoach(): boolean {
  try {
    return window.localStorage.getItem(COACH_KEY) === '1';
  } catch {
    return false; // storage blocked (private mode): the choice only lasts for this visit
  }
}

/** Coach mode is a per-device convenience, so it lives in localStorage (not in backups). */
export function useCoachPref(): [boolean, (value: boolean) => void] {
  const [coach, setCoach] = useState(initialCoach);
  const update = useCallback((value: boolean) => {
    setCoach(value);
    try {
      window.localStorage.setItem(COACH_KEY, value ? '1' : '0');
    } catch {
      // not persisted; the choice still applies to this visit
    }
  }, []);
  return [coach, update];
}
