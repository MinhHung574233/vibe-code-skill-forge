# SkillForge – Design System (PWA edition, v2)

Direction: modern, minimalist, professional, premium; must feel like a first-party iOS app even though it is a web app. Calm surfaces, one confident accent, generous spacing, motion that confirms rather than decorates.

Implementation: **Tailwind CSS v4** with all design tokens defined as CSS custom properties (`src/theme/tokens.css`) and mapped in `@theme`. Components use utility classes that reference tokens only – no raw colours/sizes in components.

## 1. Principles
1. **Clarity first** – one primary action per screen; content over chrome.
2. **iOS idioms, web-honest** – large collapsing titles, grouped inset lists, bottom sheets with detents, swipe-back, segmented controls, SF-like type scale, spring motion. No fake native chrome that breaks on web (no emulated keyboard, status bar).
3. **Tokens only.**
4. **Light and Dark are both first-class**; follows system (`prefers-color-scheme`) with manual override stored in settings (`data-theme` on `<html>`).
5. **Touch first** – ≥44×44 px targets, no hover-dependent UI, thumb-reachable primary actions (bottom-weighted layout), no accidental text selection, no double-tap zoom.
6. **Accessible by default** – text zoom, AA contrast, `prefers-reduced-motion`, semantic HTML, ARIA only where needed.

## 2. Colour tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F2F3F7` | `#0B0D12` | app background (never pure `#000`) |
| `--surface` | `#FFFFFF` | `#151922` | cards, grouped rows |
| `--surface-raised` | `#FFFFFF` | `#1D2230` | sheets, popovers |
| `--border` | `#E3E6EC` | `#262C3A` | hairlines |
| `--text` | `#0E1116` | `#F2F4F8` | primary |
| `--text-muted` | `#5B6472` | `#9AA3B2` | secondary |
| `--accent` | `#4F46E5` | `#7C83FF` | primary actions, active tab |
| `--accent-soft` | `#EEF0FF` | `#1B1E46` | tinted backgrounds |
| `--on-accent` | `#FFFFFF` | `#0B0D12` | text/icons on accent and danger fills |
| `--success` | `#15803D` | `#34D27B` | completed, PB |
| `--warning` | `#B45309` | `#F5A524` | streak at risk |
| `--danger` | `#DC2626` | `#FF6B6B` | destructive, errors |
| `--xp` | `#A16207` | `#FBBF24` | XP / level |

Module accents (small icon tiles and a single chart series): Rubik `#EF4444`, English `#0EA5E9`, Java `#F97316`, Dev Tools `#14B8A6`, Caro `#8B5CF6`, Chess `#64748B`, Go `#22C55E`. Never colour-only meaning. Contrast text/background ≥ 4.5:1 (large ≥ 3:1) and meaningful graphics ≥ 3:1 – enforced by `src/theme/contrast.test.ts`, which parses `src/index.css` (the single source of truth). The test already caught two failures (dark accent on accent-soft 4.48:1; light success/warning/xp below 3:1), fixed by the values above. `color-scheme: light dark` is set so native controls (scrollbars, inputs) match.

## 3. Typography
System stack: `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif` – renders SF on iPhone, no font download, fully offline. Monospace for code and timer digits: `ui-monospace, "SF Mono", Menlo, monospace` with `font-variant-numeric: tabular-nums`.

| Style | Size/Line | Weight | Use |
|---|---|---|---|
| `large-title` | 34/41 | 700 | tab roots |
| `title-1` | 28/34 | 700 | screen titles |
| `title-2` | 22/28 | 600 | section headers |
| `headline` | 17/22 | 600 | row titles |
| `body` | 17/24 | 400 | content |
| `callout` | 16/22 | 400 | secondary |
| `subhead` | 15/20 | 400 | meta |
| `footnote` | 13/18 | 400 | captions |
| `timer` | 72/80 | 300 mono | Rubik timer |

Sizes in `rem` so user text-size settings (Safari/OS "Larger Text" where honoured) scale layouts; layouts verified at 130 % and 200 % zoom. Form inputs ≥ 16 px (prevents iOS focus-zoom).

## 4. Spacing, shape, elevation, safe areas
- Spacing scale (px): 2, 4, 8, 12, 16, 20, 24, 32, 48. Horizontal screen padding 16 (+ `env(safe-area-inset-left/right)` in landscape).
- Radius: 8 / 12 / 16 (cards) / 24 (sheets) / full.
- Elevation: light = hairline + soft shadow; dark = surface-tone steps, no shadow.
- Safe areas: header `padding-top: env(safe-area-inset-top)` (when status bar overlaps), tab bar `padding-bottom: max(env(safe-area-inset-bottom), 8px)`, sheets and game controls likewise. App shell uses `100dvh`.
- Tap highlight removed; pressed state = scale 0.98 + background tint.

## 5. Component baseline (M1.2)
`Screen` (safe-area, inner scroll container, large-title header collapse) · `Text` · `Button` (primary/secondary/ghost/destructive, loading) · `Card` · `ListRow` (leading icon, title, subtitle, accessory, swipe actions) · `Section` (inset grouped) · `ProgressRing`/`ProgressBar` · `Chip` · `SegmentedControl` · `Sheet` (bottom sheet with drag-to-dismiss, detents) · `Dialog` (confirm/destructive) · `EmptyState` · `ErrorState` · `Skeleton` · `StatTile` · `Badge` · `Toast` · `FormField` (RHF-bound) · `CodeBlock` (monospace, copy) · `MarkdownLite` (safe limited renderer for lesson text, no raw HTML) · `Icon` (inline SVG set, tree-shaken, `currentColor`) · `Charts`: `LineChart`, `BarChart`, `Donut`, `Sparkline` (in-house SVG).

Feature components (`GoalRing`, `StreakChip`, `BoardView`…) live in their feature folder using tokens + primitives only.

## 6. Navigation chrome
- Bottom tab bar (5 tabs, icon + label always visible, active = filled icon + accent), translucent blur surface (`backdrop-filter`) with solid fallback.
- Large-title headers collapse to inline on scroll (IntersectionObserver based, no scroll-jank listeners).
- Pushed screens: slide-in from right; **edge-swipe back** gesture implemented with pointer events (iOS Safari standalone has no browser back gesture/button) plus a visible back button; the gesture is disabled on the timer and on boards (accidental swipes).
- Modals: bottom sheets, drag handle, dismiss on swipe/scrim; focus-trapped; `Escape`/back closes.
- No pull-to-refresh (not needed offline-first). `overscroll-behavior: contain` on scrollers.

## 7. Motion
CSS transitions/animations and the Web Animations API (no animation library) – tiny bundle, runs on compositor.

| Moment | Motion | Duration |
|---|---|---|
| Progress ring/bar fill | ease-out | 600 ms |
| XP count-up / level-up | number tween + scale pop | 700 ms |
| Press feedback | scale .98 | 120 ms |
| Push/pop, sheets | spring-like cubic-bezier(.2,.8,.2,1) | 280–350 ms |
| Timer state change | colour only | instant |

`@media (prefers-reduced-motion: reduce)` → fades/instant. Only `transform`/`opacity` animate. No looping decoration. Timer text updates via `requestAnimationFrame` display only; measurement is independent.

## 8. Feedback (no haptics on iOS web)
Vibration API is unavailable on iOS Safari, so feedback is visual (scale, colour, check animation) and optional sound (Web Audio short cues, off by default, user-gesture gated). A haptics service exists as a feature-flagged no-op so it can be revisited.

## 9. Dashboard layout (above-the-fold budget)
1. Header: date + streak chip + level chip.
2. **Today** card: daily goal ring(s) + primary CTA "Continue: <top recommendation>".
3. Recommended next (≤3 rows).
4. Skill progress (top 4 by priority).
5. This week (mini bar + total time).
6. Recent activity (last 5).
7. Conditional banner, **at most one**, shown at the top of every tab (implemented in `StatusBanners`), priority: *Update ready* > *Offline files missing* > *Backup reminder* > *Install to Home Screen* (iOS browser only).

At most one chart above the fold.

## 10. Accessibility checklist
Semantic landmarks (`header`, `nav`, `main`), buttons are `<button>`, lists are lists, visible focus ring (`:focus-visible`), `aria-label` on icon-only controls, `role="progressbar"` + `aria-valuenow` for rings/bars, live regions for timer results and XP gain, board squares are buttons with coordinate + occupant labels and a text move list alternative, no info by colour alone, targets ≥44 px, `prefers-reduced-motion` and `prefers-contrast` honoured.

## 11. Empty / error / loading
Every list/chart: skeleton while loading, empty state (icon + one-line explanation + one action, specific copy such as "Solve your first cube to see Ao5"), retryable error state.

## 12. Charts
In-house SVG components (line/bar/donut/sparkline): token-coloured, hairline grid, `footnote` axis labels, touch-scrub tooltip with value + date, summary sentence under each chart for accessibility ("Average this week 18 min, up 12 %"). Chosen over a library to keep the bundle small, touch behaviour exact and theming trivial; `Recharts` is the documented fallback if scope grows.

## 13. Implementation status (M1.2, 2026-11-22)

Built: tokens, type utilities (`type-*`), `Icon` (28 icons), `Button`, `Card`, `Section`/`ListRow`, `ProgressRing`, `ProgressBar`, `Chip`, `Badge`, `StatTile`, `SegmentedControl`, `Sheet` (native modal `<dialog>`, drag/scrim/Escape dismissal), `ConfirmDialog`, `EmptyState`, `ErrorState`, `Skeleton`, `Screen` (collapsing large title), theme store (system/light/dark, pre-paint, localStorage), dev gallery at `#/dev/components`.

Deferred to the milestone that first needs them: `Toast` and `FormField` (M1.4/M2.4), `CodeBlock` and `MarkdownLite` (M3.3), charts (M2.5), swipe actions on `ListRow` (M2.4), edge-swipe-back for pushed screens (first pushed screen, M2.4/M3.1), `Dialog` focus-return and iOS VoiceOver checks (device checklist).

Decisions: the theme preference is stored in localStorage (not IndexedDB) so an inline script can apply it before first paint; it is a per-device convenience and is not part of backups. Badge text always uses the primary text colour with a coloured dot, so status colours never carry text contrast.

## 14. Implementation status (Phase 2, 2026-11-25)

Added: `BarChart` (touch/drag readout, caption under the chart), `DonutChart` (always with a named legend), `FormField` (`TextField`, `TextAreaField`, `SelectField`: 16 px text, 48 px height, `aria-invalid`/`aria-describedby`), `NumberStepper` (44 px targets), `Screen` back button for pushed screens. Deferred: edge-swipe-back, `Toast`.
