# SkillForge – Roadmap & Project Status (PWA edition, v2)

A milestone closes only when `npm run verify` is green, the production build succeeds, and the app has been checked on the target (Playwright-WebKit for automation; real iPhone for iOS-specific behaviour per IOS_PWA.md §8).

## 0. Status board

| Item | State |
|---|---|
| Phase 0 – environment check | ✅ 2026-11-22 |
| Phase 0 – docs rewritten for PWA (PRD, ARCHITECTURE, DATABASE, DESIGN_SYSTEM, TECHNICAL_DECISIONS, ROADMAP + IOS_PWA, DEPLOYMENT) | ✅ drafted 2026-11-22 |
| Node 22 | ✅ 22.23.5 active |
| Phase 1 – Foundation | ⏳ M1.1 ✅ · M1.2 ✅ · M1.3 ✅ · M1.4 ✅ · M1.5 ✅ (2026-11-23) · **Phase 1 complete** |
| Phase 2 – Core training platform | ✅ M2.1–M2.6 done (2026-11-25), **not yet committed/deployed** · Phase 3 (modules) next |
| M2.1–M2.6 – engine, streak/goals, achievements, skills, progress, real Home | ✅ 367 unit/integration/UI tests (incl. real v1→v2 upgrade), 32 e2e tests; see "Phase 2 status" below |
| M1.5 – home, practice hub, headers | ✅ 221 unit tests, 26 e2e tests; CSP + cache headers verified locally and on the live Cloudflare site; see below |
| M1.4 – settings, PWA layer, backup | ✅ 198 unit/integration tests, 17 e2e tests (stable over 3 parallel runs); see below |
| M1.3 – database foundation | ✅ 138 unit/integration tests, 12 e2e tests green; see DATABASE.md §7 |
| M1.2 – design system | ✅ 86 unit tests, 9 e2e tests green; light/dark screenshots reviewed; see DESIGN_SYSTEM §13 |
| M1.1 – scaffold | ✅ verify green (tsc, eslint, 28 unit tests), build green, 2 Edge e2e tests green (offline precache + reload, manifest/icon) |

### Completed
- Environment verified; Node upgraded to 22.23.5 (junction repair noted in TECHNICAL_DECISIONS §1).
- Platform decision D-0 (React Native → PWA) and full documentation set.
- Package versions and peer ranges verified against npm.

### Pending
- M1.1 scaffold → M1.5 (below).
- Choose free host and final URL (before daily use).
- First real-iPhone check (after first deploy).

### Known issues / risks (live)
1. iOS storage persistence is not guaranteed; durability plan in D-7 must be validated on the device (R1).
2. Real-iPhone verification requires a deployed HTTPS URL (not available until a host is chosen).
3. `typescript-eslint` doesn't support TypeScript 7 yet → TS pinned to 6.0.x.
4. Git on this machine is 2.33 (works); no repo yet.
5. Status-bar/splash behaviour on the owner's iOS version unverified (R5).

### Test results log
| Date | Scope | Result |
|---|---|---|
| 2026-11-22 | M1.1 `npm run verify` | ✅ tsc strict clean · eslint clean (layer rule proven to fire on a deliberate violation) · vitest 5 files / 28 tests pass |
| 2026-11-22 | M1.1 `npm run build` | ✅ 64 precache entries (572 KiB); main JS 321 kB (102 kB gzip) – within the 250 kB-gzip budget |
| 2026-11-22 | M1.1 e2e (Playwright, installed Edge/Chromium, 390×844 touch) | ✅ 2/2: precache populated → offline cold reload renders → offline tab navigation works; manifest `standalone` + 192/512 icons + apple-touch-icon PNG served |
| 2026-11-22 | M1.2 `npm run verify` | ✅ tsc · eslint · vitest 8 files / 86 tests (components, theme store, WCAG contrast over parsed tokens) |
| 2026-11-22 | M1.2 e2e (Edge, 390×844 touch) | ✅ 9/9: light+dark render with no horizontal overflow; all controls ≥44px; theme override persists across reload; sheet closes via Escape, scrim tap and drag; large title collapses; gallery works offline (lazy chunk precached) |
| 2026-11-22 | M1.3 `npm run verify` | ✅ tsc · eslint · vitest 14 files / 138 tests: schema, boot, snapshot/upgrade/restore, failed migration, newer-schema refusal, data-loss detector, multi-instance versionchange, settings repo, storage health, error mapping, BootGate/recovery UI |
| 2026-11-22 | M1.3 e2e (Edge) | ✅ 12/12 total (3 new): v1 DB created with the 4 stores and persists across reload; wiped storage → live app asks to reload, relaunch shows recovery (not an empty app), "Continue with empty data" works; DB at a newer schema → refused and left at version 990 |
| 2026-11-22 | M1.4 `npm run verify` | ✅ tsc · eslint · vitest 21 files / 198 tests: backup build/parse/import (checksum, tamper, truncation, newer schema, unknown table, invalid row, older-schema import + forward migration, rollback on failed import, snapshot rules), backup nudge, file delivery (share/cancel/download/copy), readiness classification, install detection, status banners and their priority, format helpers |
| 2026-11-22 | M1.4 e2e (Edge, 390×844 touch) | ✅ 17/17 ×3 runs (5 new): Settings shows Ready offline; evicted Cache Storage → Incomplete + banner → Repair → Ready; export → real downloaded file has correct envelope/checksum/2 skills/no drafts; tampered file rejected; diverge → restore → data back; wiped storage → recovery screen → restore from file; non-backup file refused; erase all → clean start with no false loss alert |
| 2026-11-23 | M1.5 `npm run verify` | ✅ tsc · eslint · vitest 26 files / 221 tests (including tools/): module registry, NumberStepper, Home (live goal, honest empty states, skill count ignoring deleted), Practice hub, daily-goal persistence, `_headers` parser and real-file policy checks, Zod jitless |
| 2026-11-23 | M1.5 e2e (Edge, production headers applied) | ✅ new: security/cache headers; app tour under the CSP with **zero violations and zero console errors**; no inline scripts; Home goal + empty states; Practice lists 7 modules (Coming soon); daily goal persists and shows on Home; every control ≥44px on Home/Practice/Settings; light+dark no overflow (screenshots reviewed) |
| 2026-11-25 | Phase 2 `npm run verify:full` | ✅ tsc · eslint · vitest 38 files / 367 tests · build (precache 66 entries, 910 KiB; main JS 201 kB gzip, budget 250 kB) · Playwright 32/32 |
| 2026-11-25 | Phase 2 e2e journeys | ✅ add suggested skills → set weekly goal → log 3 sessions (today and past days) → Home shows 45/20, 3-day streak, goal reached, skill progress → timed session (seeded running timer) earns +10 XP once → Progress shows totals, consistency 43%, time-by-skill, achievements, history → all survive reload; backup contains sessions/completions/dailySummary/achievements and restores to the same Home numbers; streak-rule switch changes the streak; works offline; light/dark screenshots reviewed |
| 2026-11-25 | Real iPhone (installed app, Cloudflare URL) | ✅ owner reported it works (no per-item checklist recorded; still to do: IOS_PWA §8 items 8–10 for the timer and the 8-day idle test) |
| 2026-11-22 | Playwright WebKit | ⬜ not installed (needs `npx playwright install webkit`, a browser download; opt-in with `E2E_WEBKIT=1`) |

**Bug found and fixed by the offline e2e test (M1.1):** the first build activated its service worker but cached nothing, so the app would have failed offline. Cause: `manifest.webmanifest` was listed twice in the Workbox precache (my glob plus the PWA plugin's own entry) with different revisions → `add-to-cache-list-conflicting-entries`, which Workbox throws *after* registration succeeds, so the failure is silent. Fix: drop `webmanifest` from `globPatterns`; inline the Workbox runtime (`inlineWorkboxRuntime`) so errors surface at install instead of inside the AMD loader. Guard: the offline e2e test must stay in `verify:full`.

### Next steps
1. Commit and push Phase 2 (Cloudflare auto-deploys ~80 s after a push), then run the e2e suite against the live URL (`E2E_BASE_URL`).
2. Phase 3, in roadmap order: **M3.1 Rubik** (timer, scrambles, Ao5/Ao12, history, charts, algorithms), M3.2 English, M3.3 Java, M3.4 Developer Tools, M3.5 Caro, M3.6 Chess, M3.7 Go. Each module records sessions through `TrainingEngine.recordSession` with its own `moduleId`/`activityType` and supplies its `UserFacts` (vocab learned, Java paths, Rubik PBs) so the three module-bound achievements can unlock.
3. Real-device checks for the session timer (screen lock, app switch) and the 8-day idle test.

### Phase 2 status (2026-11-25)
- **Engine** (`core/training`, `features/training`): `recordSession` validates, then in ONE transaction writes session + completion + XP ledger + daily rollup + achievements. Idempotent by activity key (checked in the transaction and enforced by the completions primary key and the ledger unique index); concurrent double-saves award once; a mid-way failure leaves nothing behind. XP rules are data (defaults + `xpRules` overrides, can be disabled). Level = f(total XP), never stored. Streak and analytics are pure functions over the per-day rollup (DST-safe calendar arithmetic). Achievements are rules over persisted facts, with the facts stored as evidence.
- **Skills**: create/edit/archive/soft-delete, priority, category, one weekly-minutes goal per skill (stored as a `minutes_per_week` goal), suggested set of 7 (added only on request). Validation with Zod; form with React Hook Form.
- **Sessions**: timer (draft persisted so it survives reload/suspension; elapsed from wall clock; 1 min–12 h bounds) and manual log (any past day, ≤12 h). Both feed time, goals, streak, analytics. **XP only for timed practice ≥5 min** (anti-farming); the completion sheet says plainly why when there is none.
- **Progress**: 7/30-day bar chart with touch readout, time by skill (donut + legend), consistency, trend vs previous period, achievements with progress, history. In-house SVG charts.
- **Home**: real today minutes vs goal, streak and level chips, XP bar, rule-based next-up (deterministic, each with a reason), skills with weekly progress, recent activity.
- **Settings**: streak rule (any session / goal reached), daily goal.

### Known gaps in Phase 2 (intentional)
- Module-bound achievements (100 words, Java path, Rubik PB) stay locked and say which module they need; their `UserFacts` are 0 until Phase 3.
- No `dailyGoals` store: the daily goal is the single `dailyGoalMinutes` setting and per-skill goals are weekly minutes. Session-count and per-skill daily goals from the PRD are not built.
- Sessions cannot be edited or deleted individually yet (needs rollup/XP reversal rules).
- No XP rule editor UI (rules can be overridden in data only).
- No edge-swipe-back gesture on pushed screens (a visible back button exists).
- Donut slice hues are told apart by name in the legend, not by colour alone, but some hues are below 3:1 against white.
- Main JS is 201 kB gzip against a 250 kB budget: watch it as modules arrive (lazy-load per module).

### Known gaps in M1.5 (intentional)
- Home shows only what exists: today's goal ring is 0 by construction (`useDashboardData.todayMinutes` is the single seam the training engine fills in M2.2), no streak/XP/level, empty "Next up", "Your skills" and "Recent activity".
- Practice rows are not tappable and say "Coming soon"; Skills and Progress tabs are still labelled foundation shells.
- CRLF: Windows checks files out as CRLF while git stores LF; harmless for the build but noisy in diffs (a `.gitattributes` with `* text=auto eol=lf` would silence it).

### Known gaps in M1.4 (intentional)
- Backups are **Replace-only** (no merge) and **unencrypted**; both stated in the UI.
- `navigator.share` file sharing, the `<a download>` path and the Add-to-Home-Screen steps are unit-tested with mocks and the download path is e2e-tested in Edge, but **none of it is verified on an iPhone yet** (IOS_PWA §8 items 1, 7).
- The update banner and Restart flow are unit-tested only; a real two-version deploy test happens at M1.5 on the host.
- Row validation in backups is minimal (keys + indexed fields). Each new store must add a schema to `ROW_SCHEMAS`; a test fails if one is missing. Stores whose shape changes in a later version need version-specific schemas.
- Daily goal / streak-rule settings exist as keys but have no UI until the training engine (M2.2) uses them.
- Settings → Offline relies on the custom service worker; in the dev server it correctly reports "Not available here".

### Known gaps in M1.3 (intentional)
- No `drafts` repository yet (store exists; built with the Rubik timer, M3.1).
- `MARKER_TABLES` covers only `skills`/`skillGoals`; each milestone that adds a user-data store must add it (a test fails if a store is left unclassified).

### Known gaps in M1.1 (intentional)
- Screens are labelled "Foundation shell" placeholders; none claims to be a feature.
- No update banner yet (`pwaStore` flags exist; UI lands in M1.4) – harmless until the first deployment.
- Tab icons are temporary inline SVGs.
- Landscape/iPad splash images are generated but unused (portrait-first); trim at M5 if size matters.
- `npm audit`/deprecation: a transitive `glob@11.1.0` deprecation warning comes from the Workbox toolchain (build-time only, not shipped).

---

## Phase 1 – Foundation

| ID | Deliverable | Done when |
|---|---|---|
| **M1.1** | Vite 8 + React 19 + TS strict + Tailwind 4 + React Router (hash) + Zustand + Dexie + vite-plugin-pwa; ESLint (layer rules), Prettier, Vitest; manifest + placeholder icon; `verify`, `build`, `preview` scripts; git init | `npm run verify` and `npm run build` green; shell renders; SW generated |
| M1.2 | Design system: tokens (light/dark), primitives, tab bar, safe areas, sheet, large-title header, icons, `/dev/components` gallery route | Gallery renders in both themes at iPhone viewport (Playwright screenshot) |
| M1.3 | Dexie schema v1, repositories base, `Clock`/`ids`, boot gate, error/recovery screen, snapshot + loss marker, `storage.persist()` status | Upgrade tests green; reload persistence test green |
| M1.4 | Settings (theme, persisted), PWA layer: update prompt, offline readiness, install coach sheet, backup export/import v1 | Offline reload e2e green; backup round-trip test green |
| M1.5 | Dashboard skeleton + final 5-tab navigation + empty states; deployable `dist`; `DEPLOYMENT.md` dry-run on a free host; **first real-iPhone checklist** | Checklist items 1–7 recorded |

## Next: Phase 2 – Core training platform

| ID | Deliverable |
|---|---|
| M2.1 | Dexie v2 stores; `TrainingEngine` transactional finish + idempotent XP; XP rules + level curve (unit + integration tests) |
| M2.2 | Streak, daily goals, `dailySummary` maintenance |
| M2.3 | Achievements (6 initial) from persisted facts |
| M2.4 | Skills CRUD, goals UI, seeded default skills |
| M2.5 | Analytics + Progress screens (day/week/month, distribution, consistency, history, in-house charts) |
| M2.6 | Dashboard on real data; recommender v1; SessionComplete sheet |

## Phase 3 – Modules (each independently tested before the next)

| ID | Module | Scope |
|---|---|---|
| M3.1 | Rubik | timer state machine on pointer events, scramble, Ao5/Ao12, history, charts, algorithm library, notes, goals; device timer calibration |
| M3.2 | English | content schema, ≥300 IT words, SM-2, flashcards, quiz, favourites, collections, custom words, speech playback, daily goal, stats |
| M3.3 | Java & Spring | content schema, 5 tracks, topic viewer with code blocks, quiz, challenges, bookmarks, notes, completion, path achievement |
| M3.4 | Developer Tools | tip schema, 3 categories, Daily Developer Tip, bookmarks |
| M3.5 | Caro | rules, SVG board, worker AI (4 levels), local 2P, undo, puzzles, stats |
| M3.6 | Chess | chess.js, SVG board, promotion, endings, puzzles, openings, rating |
| M3.7 | Go | rules engine, 9/13/19 SVG board, scoring, tsumego, stats |

## Phase 4 – Quality & polish
UI refinement, animation polish, empty/error audit, performance (startup, lists, worker AI), accessibility (VoiceOver, text zoom), persistence & offline test pass (incl. 8-day idle test), coverage targets, e2e suite.

## Phase 5 – Deployment & release readiness (replaces App Store prep)
Final icon + splash set, manifest polish, free-host deployment (Cloudflare Pages/GitHub Pages/Netlify), `_headers`/cache policy, optional GitHub Actions deploy, backup/restore drill, final device checklist. No App Store, TestFlight or Apple Developer account involved.

## Definition of done (every milestone)
- `tsc` strict, ESLint, Vitest all green; no skipped failures; build succeeds and budgets hold.
- Verified in Playwright-WebKit; iOS-specific items verified on device where applicable and logged.
- Docs updated for any architecture/schema change; status board updated.
- App remains runnable; no half-wired screens reachable from navigation.
