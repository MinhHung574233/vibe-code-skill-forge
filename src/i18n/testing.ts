import { viEntry } from './core';

/** Placeholders such as `{count}` in a string, sorted. */
export function placeholders(text: string): string[] {
  return [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1] ?? '').sort();
}

/**
 * Content tests use this: which of these English strings have no Vietnamese entry. A string that
 * is the same in both languages (a command, a product name) still needs an identity entry, so a
 * forgotten translation cannot hide.
 */
export function missingTranslations(strings: Iterable<string>): string[] {
  const missing = new Set<string>();
  for (const s of strings) if (viEntry(s) === undefined) missing.add(s);
  return [...missing];
}

/** Keys whose `{placeholders}` differ between English and Vietnamese. */
export function placeholderMismatches(keys: Iterable<string>): string[] {
  const bad: string[] = [];
  for (const key of keys) {
    const value = viEntry(key);
    if (value !== undefined && placeholders(key).join() !== placeholders(value).join()) {
      bad.push(key);
    }
  }
  return bad;
}
