/**
 * Tiny, dependency-free i18n. The English source string is the key: `t('Start')` returns the
 * Vietnamese text when the language is Vietnamese and the key itself otherwise, so a missing
 * translation can never show a blank or a raw id. A test fails the build when a literal key has
 * no Vietnamese entry. This file is pure (no React): domain code may call `t()` too.
 */
export type Language = 'en' | 'vi';
export type LanguagePreference = 'auto' | Language;

export const LANGUAGES: readonly Language[] = ['en', 'vi'];
const STORAGE_KEY = 'sf-lang';

function isPreference(value: unknown): value is LanguagePreference {
  return value === 'auto' || value === 'en' || value === 'vi';
}

function readPreference(): LanguagePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isPreference(stored) ? stored : 'auto';
  } catch {
    return 'auto'; // storage blocked or unavailable
  }
}

/** The device language when it is one we ship, else English. */
export function detectDeviceLanguage(): Language {
  try {
    const first = navigator.languages?.[0] ?? navigator.language;
    return first.toLowerCase().startsWith('vi') ? 'vi' : 'en';
  } catch {
    return 'en';
  }
}

export function resolveLanguage(preference: LanguagePreference): Language {
  return preference === 'auto' ? detectDeviceLanguage() : preference;
}

/**
 * The Vietnamese dictionary is ~190 KB of text, so it is a separate chunk that English users never
 * load. It is fetched before the first render when the language is Vietnamese (see main.tsx), and
 * when the user switches to Vietnamese. Tests register it up front in src/test/setup.ts.
 */
let dictionary: Readonly<Record<string, string>> | null = null;

export function registerDictionary(entries: Readonly<Record<string, string>>): void {
  dictionary = entries;
}

export async function loadDictionary(): Promise<void> {
  if (dictionary) return;
  registerDictionary((await import('./vi')).VI);
}

let preference: LanguagePreference = readPreference();
let language: Language = resolveLanguage(preference);
const listeners = new Set<() => void>();

function applyToDocument(): void {
  if (typeof document !== 'undefined') document.documentElement.lang = language;
}
applyToDocument();

export function getLanguage(): Language {
  return language;
}

export function getLanguagePreference(): LanguagePreference {
  return preference;
}

export function subscribeLanguage(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setLanguagePreference(next: LanguagePreference): void {
  // Switching to Vietnamese before its dictionary is loaded would flash English: wait for it.
  if (resolveLanguage(next) === 'vi' && !dictionary) {
    void loadDictionary().then(
      () => commitLanguage(next),
      () => commitLanguage(next),
    );
    return;
  }
  commitLanguage(next);
}

function commitLanguage(next: LanguagePreference): void {
  preference = next;
  language = resolveLanguage(next);
  try {
    if (next === 'auto') localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* keep working for this session even if persistence fails */
  }
  applyToDocument();
  for (const listener of [...listeners]) listener();
}

export type TParams = Readonly<Record<string, string | number>>;

/** Replaces `{name}` placeholders. Unknown placeholders are left as they are. */
export function interpolate(text: string, params?: TParams): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = params[name];
    return value === undefined ? whole : String(value);
  });
}

/** Translates an English source string. Use `{name}` placeholders and pass `params`. */
export function t(source: string, params?: TParams): string {
  const text = language === 'vi' ? (dictionary?.[source] ?? source) : source;
  return interpolate(text, params);
}

/** The BCP 47 locale for Intl formatting (dates, numbers). */
export function intlLocale(): string {
  return language === 'vi' ? 'vi-VN' : 'en-US';
}

/** Test helper: the Vietnamese entry for a key, or undefined when it is missing. */
export function viEntry(source: string): string | undefined {
  return dictionary?.[source];
}
