# SkillForge – Technical Decisions & Risks (PWA edition, v2)

Format: decision · alternatives · rationale · consequences. Dates ISO.

## 0. Platform change (2026-11-22)

**D-0 Personal iPhone PWA replaces React Native/Expo.** The app is for one user's own iPhone, will not go to the App Store, and must not require the $99 Apple Developer Program. A PWA installed through Safari's *Add to Home Screen* meets that, deploys as static files to a free host, and removes the Windows-has-no-Xcode blocker entirely (everything can be developed and verified on this machine, with the iPhone as the final test device). Product scope (all 7 modules, shared training engine) is unchanged; only platform/architecture changed. Documents rewritten: ARCHITECTURE, DATABASE, DESIGN_SYSTEM, ROADMAP, this file; added IOS_PWA and DEPLOYMENT. React Native specifics (Expo Router, expo-sqlite, Reanimated, EAS, TestFlight) are dropped.

## 1. Environment (2026-11-22)

| Tool | State | Verdict |
|---|---|---|
| OS | Windows 11 Pro x64, 13.9 GB RAM, 18.7 GB free on F: | OK |
| Node | **22.23.5 installed and active** (was 20.18.1; 16.20.2 and 20.18.1 remain under nvm) | ✅ satisfies Vite 8 (≥22.12) and Vitest 5 (≥22.12) |
| npm | 10.9.9 (with Node 22) | ✅ |
| Git | 2.33.0 (old); folder not yet a repo | works; update recommended |
| Xcode/Simulator | n/a | no longer needed |
| Playwright WebKit | to install at M1.x | closest automated proxy for iOS Safari |
| Real iPhone + free HTTPS host | needed for final verification | owner has the iPhone; host choice in DEPLOYMENT.md |

Note: switching Node via `nvm use` required elevation on this machine; the link `C:\nvm4w\nodejs` was recreated as a directory junction to `v22.23.5` so `node` resolves to 22 in new shells.

## 2. Stack and versions (verified against npm 2026-11-22; exact versions pinned by `package-lock.json`)

| Concern | Choice | Version seen | Notes |
|---|---|---|---|
| UI | React | 19.3.1 | |
| Language | TypeScript strict | **6.0.x (pinned)** | npm `latest` is 7.0.2 but `typescript-eslint@8.73` supports `<6.1.0` → pin TS 6.0 so lint stays reliable; revisit when typescript-eslint supports 7 |
| Build | Vite | 8.3.8 | `@vitejs/plugin-react` 6.3 (requires Vite 8) |
| Routing | React Router | 8.5.2 (`react-router`) | `HashRouter` (D-3). If v8 proves problematic, fall back to 7.18 (`react-router-dom`) |
| State | Zustand | 5.1.0 | |
| Storage | Dexie + `dexie-react-hooks` | 4.4.7 / 4.4.0 | |
| Validation / forms | Zod 4.6.7, React Hook Form 7.92, `@hookform/resolvers` 7.0.8 (supports Zod 4) | | |
| Styling | Tailwind CSS 4.3 + `@tailwindcss/vite`, CSS-variable tokens | | |
| PWA | `vite-plugin-pwa` 2.0.0 (Workbox 7.4.1, `generateSW`), `@vite-pwa/assets-generator` 2.0 | | Peer on Vite 8 ✅ |
| Chess rules | chess.js 1.4.0 | | |
| Unit/integration tests | Vitest 5.1, Testing Library 16, `fake-indexeddb` 6.2, happy-dom | | |
| E2E | Playwright 1.65 (WebKit) | | |
| Lint/format | ESLint 10 + typescript-eslint 8.73 + react-hooks plugin, Prettier 3.10 | | |
| Package manager | **npm** | | lockfile committed |

Chosen conservatively where "latest" has an ecosystem gap (TypeScript). No experimental packages.

## 3. Decisions

**D-1 Static SPA, no backend.** Output = `dist/` of static files + service worker. Hostable on any free static host (DEPLOYMENT.md).

**D-2 Dexie over raw IndexedDB / `idb-keyval` / SQLite-WASM.** Dexie gives declarative versioning, upgrade hooks, compound indexes, `liveQuery`, transactions with sane Safari behaviour. SQLite-WASM (OPFS) rejected: OPFS/storage maturity on iOS Safari is less proven, and adds a large WASM payload. `idb-keyval` too limited for queries.

**D-3 `HashRouter`.** No server rewrite rules, works on any sub-path/host, no refresh-404, SW only serves `index.html`. URLs are invisible in standalone mode. Rejected: `BrowserRouter` + host-specific SPA fallbacks (fragile across free hosts).

**D-4 Service worker via Workbox `generateSW`, `registerType: 'prompt'`.** Never auto-swap code under a running timer/game; explicit update banner; update checks on `visibilitychange`. Rejected: `autoUpdate` (data-loss risk for in-progress sessions), hand-written SW (more bugs, no benefit).

**D-5 Content bundled into lazy chunks, precached.** "Content download" = the install precache; no runtime fetch of content. Validated by Zod in tests. Budget: precache ≤ 15 MB, initial JS ≤ 250 kB gzip.

**D-6 Offline-readiness verification.** Build emits `offline-manifest.json`; the client checks every URL in `caches` and exposes Repair. iOS can evict caches independently of IndexedDB.

**D-7 Data durability plan** (iOS cannot guarantee persistence): `persist()` best-effort + visible status; data-loss detector marker; pre-migration snapshot; backup nudges; Share-sheet export; Replace-restore with preview. Documented honestly in-app and in IOS_PWA.md. No claim of guaranteed persistence.

**D-8 Booleans stored as 0/1 in indexed fields** (IndexedDB can't index booleans). Repositories hide this from domain types.

**D-9 Idempotent rewards by key.** `completions.activityKey` is the primary key and `xpLedger.activityKey` has a unique index; the engine also checks existence inside the same `rw` transaction. Rejected: UI guards.

**D-10 Derived XP/level, separate skill metrics.** Level = f(Σ ledger). Each module exposes a `SkillMetricProvider`; XP never stands in for skill.

**D-11 `localDate` stored at write time** for streak stability across timezones/DST.

**D-12 Time:** `Clock` port: `Date.now()` for records, `performance.now()` for the Rubik timer and session duration. Tests inject a fake clock.

**D-13 SRS: simplified SM-2** behind a `Scheduler` port (FSRS later).

**D-14 Chess:** `chess.js` rules; own SVG board; `ChessEngine` port with `NullEngine`; Stockfish (WASM in a worker) possible later; no analysis UI/claims until then. Piece artwork: licence-clean set decided at M3.6 (Cburnett-style SVG via its BSD option, with attribution, or self-drawn).

**D-15 Go:** custom engine (flood-fill liberties, positional superko via Zobrist, area scoring default with komi 7.5 configurable, optional territory scoring with dead-stone marking); no maintained library suited. Table-driven tests.

**D-16 Caro AI:** threat-based alpha-beta in a **module Web Worker** (candidate pruning, pattern eval, iterative deepening, time budget). Levels Easy→Expert. Worker removes the main-thread jank risk that existed in RN.

**D-17 Charts: in-house SVG components** (line, bar, donut, sparkline). Small, touch-exact, theme-native, offline. Recharts is the documented fallback.

**D-18 Styling: Tailwind v4 + CSS-variable tokens**, light/dark via `prefers-color-scheme` with manual override. Animations via CSS/WAAPI only (no animation library).

**D-19 No haptics, no push/scheduled notifications.** iOS Safari lacks Vibration API; push needs a server (violates no-backend); no local scheduled notifications on web. In-app reminders only. Documented in IOS_PWA.md §6.

**D-20 Speech:** Web Speech `speechSynthesis` for pronunciation (feature-detected, gesture-gated, on-device voices). Speech recognition not in MVP; `SpeakingEvaluator` port only.

**D-21 Status bar / splash:** start with `apple-mobile-web-app-status-bar-style: default`, neutral brand-coloured splash; finalise after device test (IOS_PWA.md §3–4).

**D-22 Testing:** Vitest for logic & Dexie (via `fake-indexeddb`), Testing Library for components, Playwright WebKit for offline/SW/e2e smoke; real-iPhone checklist is the authority for iOS behaviour. `npm run verify` after every meaningful change.

**D-23 Lint boundaries:** `no-restricted-imports` enforces layer rules (domain purity, no cross-feature imports). TS flags: `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`.

**D-24 Repo hygiene:** initialise git (owner earlier defaulted to yes by approving the plan); `.gitignore` for `node_modules`, `dist`, `dev-dist`, local backups.

## 4. Risk register

| # | Risk | L | I | Mitigation |
|---|---|---|---|---|
| R1 | **iOS storage eviction / non-persistence** of IndexedDB and caches | M | Very high | D-7: persist(), install-first, loss detector, snapshot, nudges, Share-sheet backup; verify on device (IOS_PWA §8) |
| R2 | Installed app and Safari tab have separate storage → user "loses" data entered pre-install | M | High | Onboarding, install coach sheet, backup/restore path |
| R3 | Hosting URL change = new origin = empty data | L | High | Choose final URL first (DEPLOYMENT.md), backup before moving |
| R4 | SW lifecycle on iOS (no reload, suspended apps, cache eviction) | M | High | Prompted updates, visibility-based checks, readiness check + Repair, e2e tests |
| R5 | Status bar/safe-area/theme-color quirks, iOS 26.x regressions | M | Medium | Device-verify; fall back between status-bar styles; neutral splash; `100dvh` + env() |
| R6 | Rubik timer accuracy/latency in Safari (pointer events, rAF throttling) | M | High | `performance.now()` at input events, display decoupled, `touch-action:none`, on-device calibration vs stopwatch |
| R7 | Touch quirks: zoom, callout, edge-swipes, keyboard | M | Medium | Global touch CSS, ≥16 px inputs, visualViewport handling, inset hold zones |
| R8 | No haptics, no reminders (platform limits) | Certain | Low–Med | Honest UX; in-app nudges; documented |
| R9 | Content volume/quality is the largest workload | H | H | Schema-first, time-boxed seeds, validation tests, labelled seed content |
| R10 | Go rules subtleties | M | H | Rules before UI; table-driven tests; area scoring default |
| R11 | Caro AI strength vs responsiveness | M | M | Worker + time budget; profile on device |
| R12 | Bad migration destroys data | L | Very high | Append-only versions, upgrade tests per version, pre-migration snapshot, Replace-restore with auto-snapshot |
| R13 | Tooling ecosystem gaps (TS 7, Vite 8/Vitest 5/Router 8 are recent majors) | M | Low–Med | TS pinned 6.0; lockfile; fallback plans (Router 7); CI-style verify |
| R14 | Scope creep across 7 modules | H | H | Phase gates, per-module DoD, P0/P1/P2, content time-boxing |
| R15 | Playwright-WebKit ≠ real iOS Safari | Certain | Medium | Treat as smoke only; device checklist is authoritative |
| R16 | Old Git 2.33 / 18.7 GB disk | L | L | Recommend Git update; single `node_modules` |

## 5. Deliberately not built
Backend, accounts, cloud sync, push notifications, analytics SDKs, AI integration, Stockfish analysis, Go AI, speech recognition/speaking evaluation, App Store / native distribution, Android/desktop optimisation.

## 6. Quality gates
`npm run verify` (tsc strict + ESLint + Vitest) after each meaningful change; regressions fixed before moving on; `verify:full` (build + budget + Playwright) at milestone close; device checklist recorded in the ROADMAP test log; modules tested independently before the next starts.
