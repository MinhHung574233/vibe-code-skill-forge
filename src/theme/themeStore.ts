import { create } from 'zustand';

export type ThemePreference = 'system' | 'light' | 'dark';

/**
 * Theme preference lives in localStorage (not IndexedDB) on purpose: an inline script in
 * index.html reads it synchronously before first paint, which avoids a light/dark flash.
 * It is a per-device convenience; losing it only resets the theme to "system".
 */
const STORAGE_KEY = 'sf-theme';

function isPreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

function readPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isPreference(stored) ? stored : 'system';
  } catch {
    return 'system'; // storage blocked or unavailable
  }
}

export function applyTheme(preference: ThemePreference): void {
  const root = document.documentElement;
  if (preference === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', preference);
}

interface ThemeState {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  preference: readPreference(),
  setPreference: (preference) => {
    try {
      if (preference === 'system') localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      /* keep working for this session even if persistence fails */
    }
    applyTheme(preference);
    set({ preference });
  },
}));
