import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Parses the tokens straight out of src/index.css (the single source of truth) and checks
 * WCAG 2.x contrast for every text/background pair the components actually use.
 */
const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`Selector not found in index.css: ${selector}`);
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start));
  const vars: Record<string, string> = {};
  for (const m of body.matchAll(/--([a-z-]+):\s*([^;]+);/g)) {
    const [, name, value] = m;
    if (name && value) vars[name] = value.trim();
  }
  return vars;
}

const light = block(':root');
const dark = block(":root[data-theme='dark']");
const darkSystem = block(":root:not([data-theme='light'])");

function luminance(hex: string): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m?.[1]) throw new Error(`Not a 6-digit hex colour: ${hex}`);
  const n = parseInt(m[1], 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

const themes = { light, dark } as const;

/** [foreground token, background token, minimum ratio, reason] */
const TEXT_PAIRS: [string, string, number][] = [
  ['text', 'bg', 4.5],
  ['text', 'surface', 4.5],
  ['text', 'surface-raised', 4.5],
  ['text-muted', 'bg', 4.5],
  ['text-muted', 'surface', 4.5],
  ['text-muted', 'surface-raised', 4.5],
  ['accent', 'bg', 4.5],
  ['accent', 'surface', 4.5],
  ['accent', 'accent-soft', 4.5],
  ['on-accent', 'accent', 4.5],
  ['on-accent', 'danger', 4.5],
];

/** Meaningful graphics (icons, progress arcs): WCAG non-text contrast is 3:1. */
const GRAPHIC_TOKENS = ['success', 'warning', 'danger', 'xp', 'accent'];

describe('design tokens', () => {
  it('dark tokens are identical for the manual and the system-driven dark blocks', () => {
    expect(Object.keys(darkSystem).sort()).toEqual(Object.keys(dark).sort());
    for (const key of Object.keys(dark)) expect(darkSystem[key], key).toBe(dark[key]);
  });

  for (const [themeName, tokens] of Object.entries(themes)) {
    describe(themeName, () => {
      it.each(TEXT_PAIRS)('%s on %s ≥ %s:1', (fg, bg, min) => {
        const ratio = contrast(tokens[fg] ?? '', tokens[bg] ?? '');
        expect(ratio, `${fg} on ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min);
      });

      it.each(GRAPHIC_TOKENS)('%s is ≥ 3:1 against bg and surface', (token) => {
        for (const bg of ['bg', 'surface']) {
          const ratio = contrast(tokens[token] ?? '', tokens[bg] ?? '');
          expect(ratio, `${token} on ${bg} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(3);
        }
      });

      it('never uses pure black as the app background', () => {
        expect((tokens.bg ?? '').toLowerCase()).not.toBe('#000000');
      });
    });
  }
});

describe('contrast helper', () => {
  it('matches known WCAG values', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 1);
  });
});
