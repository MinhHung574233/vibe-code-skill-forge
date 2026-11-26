import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { afterEach, describe, expect, it } from 'vitest';
import { VI } from './vi';
import { caro } from './vi/caro';
import { chess } from './vi/chess';
import { common } from './vi/common';
import { english } from './vi/english';
import { go } from './vi/go';
import { java } from './vi/java';
import { rubik } from './vi/rubik';
import { shell } from './vi/shell';
import { tools } from './vi/tools';
import { training } from './vi/training';
import {
  getLanguage,
  getLanguagePreference,
  interpolate,
  resolveLanguage,
  setLanguagePreference,
  t,
} from './core';
import { placeholderMismatches } from './testing';

afterEach(() => setLanguagePreference('en'));

describe('t()', () => {
  it('returns the English source in English', () => {
    setLanguagePreference('en');
    expect(t('Start')).toBe('Start');
  });

  it('falls back to the English source when Vietnamese has no entry', () => {
    setLanguagePreference('vi');
    expect(t('A string nobody translated {n}', { n: 3 })).toBe('A string nobody translated 3');
  });

  it('interpolates placeholders and leaves unknown ones', () => {
    expect(interpolate('{a} of {b}', { a: 1, b: 'x' })).toBe('1 of x');
    expect(interpolate('{a} of {b}', { a: 1 })).toBe('1 of {b}');
  });

  it('resolves auto to a shipped language and stores explicit choices', () => {
    expect(['en', 'vi']).toContain(resolveLanguage('auto'));
    setLanguagePreference('vi');
    expect(getLanguage()).toBe('vi');
    expect(getLanguagePreference()).toBe('vi');
    expect(localStorage.getItem('sf-lang')).toBe('vi');
    setLanguagePreference('auto');
    expect(localStorage.getItem('sf-lang')).toBeNull();
  });
});

const SRC = join(import.meta.dirname, '..');

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name !== 'test' && name !== 'i18n') out.push(...sourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

/** Every string literal passed straight to `t(...)`, found with the TypeScript parser. */
function literalKeys(): { key: string; file: string }[] {
  const found: { key: string; file: string }[] = [];
  for (const file of sourceFiles(SRC)) {
    const text = readFileSync(file, 'utf8');
    const kind = file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, kind);
    const visit = (node: ts.Node): void => {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 't'
      ) {
        const arg = node.arguments[0];
        if (arg && (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg))) {
          found.push({ key: arg.text, file: relative(SRC, file) });
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(sf);
  }
  return found;
}

describe('Vietnamese dictionary', () => {
  const keys = literalKeys();

  it('finds the t() calls (guards against the scanner silently matching nothing)', () => {
    expect(keys.length).toBeGreaterThan(0);
  });

  it('has an entry for every literal t() key', () => {
    const missing = keys.filter((k) => VI[k.key] === undefined);
    expect(missing.map((m) => `${m.file}: ${m.key}`)).toEqual([]);
  });

  it('keeps the same {placeholders} as the English key', () => {
    expect(placeholderMismatches(Object.keys(VI))).toEqual([]);
  });

  it('has no empty translations', () => {
    expect(Object.entries(VI).filter(([, v]) => v.trim() === '')).toEqual([]);
  });

  it('has no key translated two different ways in different area files', () => {
    const areas = { common, shell, training, rubik, english, java, tools, caro, chess, go };
    const seen = new Map<string, { area: string; value: string }>();
    const conflicts: string[] = [];
    for (const [area, dict] of Object.entries(areas)) {
      for (const [key, value] of Object.entries(dict)) {
        const earlier = seen.get(key);
        if (earlier && earlier.value !== value) {
          conflicts.push(`${key}: ${earlier.area}="${earlier.value}" vs ${area}="${value}"`);
        } else if (!earlier) seen.set(key, { area, value });
      }
    }
    expect(conflicts).toEqual([]);
  });
});
