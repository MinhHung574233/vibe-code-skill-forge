import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { launchApp } from './helpers';

/**
 * Automated accessibility audit (Phase 4): every screen is scanned with axe-core for WCAG 2.1 A/AA
 * rules, in light and dark mode, in English and Vietnamese. axe cannot judge everything (VoiceOver
 * reading order and gestures still need a device), but it catches missing names, bad contrast,
 * broken landmarks and ARIA misuse.
 */
const ROUTES = [
  '/',
  '/skills',
  '/practice',
  '/practice/session',
  '/progress',
  '/settings',
  '/practice/rubik',
  '/practice/rubik/solves',
  '/practice/rubik/algorithms',
  '/practice/english',
  '/practice/english/review',
  '/practice/english/quiz',
  '/practice/english/words',
  '/practice/java',
  '/practice/java/path/java-core',
  '/practice/java/lesson/java-oop-records',
  '/practice/tools',
  '/practice/tools/tips',
  '/practice/caro',
  '/practice/caro/play',
  '/practice/chess',
  '/practice/chess/play',
  '/practice/chess/puzzles',
  '/practice/chess/openings',
  '/practice/go',
  '/practice/go/play',
  '/practice/go/tsumego',
];

type Scheme = 'light' | 'dark';
type Lang = 'en' | 'vi';

async function audit(page: Page, route: string, scheme: Scheme, lang: Lang) {
  await page.emulateMedia({ colorScheme: scheme, reducedMotion: 'reduce' });
  await page.goto(`/#${route}`);
  const hasHeading = await page
    .getByRole('heading', { level: 1 })
    .first()
    .waitFor({ timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  await page.waitForTimeout(250); // let lazy chunks and live queries settle
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const missing = hasHeading
    ? []
    : [{ route, scheme, lang, rule: 'no-visible-h1', impact: 'serious', nodes: [] as string[] }];
  return [
    ...missing,
    ...results.violations.map((v) => ({
      route,
      scheme,
      lang,
      rule: v.id,
      impact: v.impact,
      nodes: v.nodes.slice(0, 3).map((n) => `${n.target.join(' ')} :: ${n.failureSummary ?? ''}`),
    })),
  ];
}

for (const lang of ['en', 'vi'] as const) {
  test(`axe finds no WCAG A/AA violations on any screen (${lang})`, async ({ page }) => {
    test.setTimeout(240_000);
    await launchApp(page);
    await page.evaluate((l) => localStorage.setItem('sf-lang', l), lang);
    const found = new Set<string>();
    for (const scheme of ['light', 'dark'] as const) {
      for (const route of ROUTES) {
        for (const v of await audit(page, route, scheme, lang)) {
          found.add(
            `${v.rule} | ${v.route} | ${scheme} | ${v.nodes.map((n) => n.split(' :: ')[0]).join(' ; ')}`,
          );
        }
      }
    }
    expect([...found]).toEqual([]);
  });
}

test('the interface stays usable at a 200% text size', async ({ page }) => {
  await launchApp(page);
  await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
  for (const route of ['/', '/practice', '/settings', '/practice/chess/play']) {
    await page.goto(`/#${route}`);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${route} scrolls sideways at 200% text`).toBeLessThanOrEqual(1);
  }
});

test('animations stop when the device asks for reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await launchApp(page);
  const running = await page.evaluate(
    () =>
      document
        .getAnimations()
        .filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity)
        .length,
  );
  expect(running).toBe(0);
});
