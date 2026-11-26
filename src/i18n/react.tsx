import { Fragment, useSyncExternalStore, type ReactNode } from 'react';
import {
  getLanguage,
  getLanguagePreference,
  setLanguagePreference,
  subscribeLanguage,
  type Language,
  type LanguagePreference,
} from './core';

/** Re-renders the component when the language changes. */
export function useLanguage(): Language {
  return useSyncExternalStore(subscribeLanguage, getLanguage, getLanguage);
}

export function useLanguagePreference(): {
  preference: LanguagePreference;
  setPreference: (preference: LanguagePreference) => void;
} {
  const preference = useSyncExternalStore(
    subscribeLanguage,
    getLanguagePreference,
    getLanguagePreference,
  );
  return { preference, setPreference: setLanguagePreference };
}

/**
 * Remounts its subtree when the language changes. Text is translated with the plain `t()`
 * function at render time, so a remount is the simplest way to refresh every screen, including
 * labels held in module-level constants.
 */
export function LanguageBoundary({ children }: { children: ReactNode }) {
  const language = useLanguage();
  return <Fragment key={language}>{children}</Fragment>;
}
