import { useEffect, useState } from 'react';

/**
 * Current time for rendering, kept out of render itself (Date.now() is impure). Refreshes when
 * the app returns to the foreground, which is when relative text like "3 days ago" can change
 * on a phone that was suspended.
 */
export function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') setNow(Date.now());
    };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);
  return now;
}
