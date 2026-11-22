# SkillForge – Architecture (PWA edition, v2)

Platform: installable Progressive Web App for one iPhone, hosted as static files, 100 % offline after install. Supersedes the React Native/Expo design (see TECHNICAL_DECISIONS D-0).

## 1. Layers and dependency rule

```
UI (routes, components)           src/app · src/components · src/features/*/ui
   ↓ uses
Application (hooks, stores)       src/features/*/store · src/hooks
   ↓ calls
Domain (pure TS)                  src/features/*/domain · src/core/*
   ↓ via ports (interfaces)
Data (Dexie repositories)         src/features/*/data · src/db
```

Rules (enforced by ESLint `no-restricted-imports`):
1. `domain/` and `core/` import nothing from `react`, `dexie`, `src/db`, DOM globals or `import.meta`. They run in plain Node under Vitest.
2. UI never touches Dexie directly; it uses hooks/stores → repositories.
3. Feature modules never import each other. Cross-module needs go through `core/training` (shared engine) or `core/content`.
4. Bundled content is read-only; user state lives in IndexedDB.

## 2. Folder structure

```
src/
  main.tsx                  bootstrap: storage gate → migrations → SW registration → render
  app/                      router, route table, layouts (TabLayout, ModuleLayout), providers
  components/               design-system primitives (Screen, Button, Card, Sheet, ProgressRing, …)
  theme/                    tokens.css, theme store, useTheme
  core/
    training/               ENGINE: sessions, xp, levels, streak, goals, achievements, analytics, recommend
    content/                content types, Zod schemas, loader, daily-pick
    srs/                    SM-2 scheduler (port + implementation)
    time/                   Clock port, local-date helpers
    result.ts · errors.ts · ids.ts
  db/
    schema.ts               Dexie class + ALL version() declarations (append-only)
    migrations/             upgrade functions per version
    snapshot.ts             pre-migration snapshot, data-loss marker
    backup.ts               export / import (Zod-validated)
    storage.ts              persist(), estimate(), health checks
  pwa/
    register.ts             SW registration, update prompt, update polling
    offlineReadiness.ts     verifies precache completeness
    install.ts              iOS install detection + instructions
  features/
    dashboard/ skills/ training/ achievements/ settings/
    rubik/ english/ java/ developer-tools/ caro/ chess/ go/
      domain/ data/ store/ ui/ content/ workers/ index.ts
  services/                 speech (Web Speech), share/download, wakeLock, haptics-feature-flag
  hooks/ types/ utils/
content/                    authored JSON source (validated in tests, imported by lazy chunks)
public/                     icons, apple-touch-icon, splash images (generated), robots
e2e/                        Playwright (WebKit) tests
docs/
```

## 3. Routing

React Router with **`HashRouter`** (`/#/practice/rubik`).
- Works on any static host and any sub-path without rewrite rules; no 404-on-refresh; Service Worker only needs to serve `index.html`.
- URLs are invisible in standalone mode, so aesthetics don't matter.
- Route-level code splitting: each module is `React.lazy`'d. All chunks are **precached at install**, so lazy ≠ online-only.
- Tabs (**Home · Skills · Practice · Progress · Settings**) are a persistent layout with per-tab navigation stacks preserved (scroll restoration per tab in a store). Pushed screens use a slide transition with edge-swipe back (see DESIGN_SYSTEM §6).

## 4. PWA runtime

### 4.1 Service worker (Workbox via `vite-plugin-pwa`, `generateSW`)
- `registerType: 'prompt'` – a new SW **waits**; UI shows "Update ready – Restart". Never auto-reload mid-session (could kill a running timer/game).
- Precache every built asset (`js,css,html,svg,png,webp,woff2,json`), `cleanupOutdatedCaches: true`, `navigateFallback: 'index.html'`. No runtime caching of third parties (none exist).
- Update checks: on launch, on `visibilitychange → visible` (throttled to once per 30 min), because iOS standalone apps are suspended rather than relaunched and there's no pull-to-refresh/reload button.
- On accept: `updateServiceWorker(true)` → skipWaiting + reload. In-progress drafts (timer session, game) are persisted to the `drafts` table before reload.
- iOS evicts caches under storage pressure or long disuse: `offlineReadiness` verifies every URL from a build-emitted `offline-manifest.json` against `caches.match`; Settings shows **Ready offline ✓ / Incomplete – reconnect to repair** and offers "Repair" (re-registers SW & re-precaches).

### 4.2 Manifest & installability
`display: standalone`, `start_url: './'`, `scope: './'`, `theme_color`/`background_color`, 192/512 + maskable icons, `apple-touch-icon` 180×180 (opaque PNG), `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`, `viewport-fit=cover`. iOS has no `beforeinstallprompt`: `pwa/install.ts` detects iOS Safari non-standalone (`navigator.standalone`/`display-mode`) and shows a one-time **Add to Home Screen** coach sheet (Share → Add to Home Screen), hidden once installed. Splash: generated `apple-touch-startup-image` set for current iPhone sizes using a neutral brand-colour background (works in both light and dark; iOS applies the install-time appearance).

### 4.3 Standalone, safe areas, viewport
- App shell is `position: fixed; inset: 0`, `height: 100dvh`; scrolling happens in inner containers (`overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain`) so the page itself never rubber-bands.
- Padding via `env(safe-area-inset-*)` on header, tab bar, sheets, and game screens.
- `touch-action: manipulation` globally (kills double-tap zoom delay), `touch-action: none` on timer and boards, `user-select: none` + `-webkit-touch-callout: none` on interactive surfaces, `-webkit-tap-highlight-color: transparent`, inputs ≥16 px font to prevent focus-zoom.
- Status-bar style is a device-verified decision (see IOS_PWA.md §3).

## 5. Data layer (IndexedDB via Dexie 4)

- One database `skillforge`. Schema versions are **append-only** in `db/schema.ts`; each bump adds `db.version(n).stores({...}).upgrade(tx => …)`. Shipped versions are never edited. (Detail in DATABASE.md.)
- Repositories: interfaces in `domain/`, `Dexie…Repository` in `data/`. Business logic receives repositories + `Clock` via constructor injection → testable with `fake-indexeddb`, swappable for a sync decorator later.
- Primary keys: client-generated sortable IDs; mutable rows carry `createdAt/updatedAt`; soft-delete (`deletedAt`) for user-authored entities → future sync possible.
- Cross-tab/version safety: `db.on('versionchange')` closes the connection and shows "Reload to finish update" (a second tab/old SW instance must never block a migration).
- Dexie transactions only await Dexie operations (no `fetch`/timers inside) – IndexedDB auto-commits and Safari is strict about this.
- Booleans are stored as `0|1` where indexed (IndexedDB cannot index booleans).

### Durability strategy (iOS-specific; see IOS_PWA.md)
1. On boot in standalone mode: `navigator.storage.persist()` (best effort), record result; Settings shows persisted state + `estimate()` usage/quota.
2. **Data-loss detector**: every successful write batch updates a tiny marker (`localStorage`: last write time + row counts). If boot finds an empty DB but a non-empty marker → recovery screen: *"Your data appears to be missing. Restore from backup"*.
3. **Pre-migration snapshot**: if the stored schema version < code version, open the old DB dynamically, dump to a `skillforge-snapshot` database (one rolling snapshot), then migrate. Failure to migrate → keep snapshot, show recovery UI (retry / restore snapshot / export).
4. **Backup nudge**: dashboard/Settings banner when last export > 14 days or > 200 new records since. Export via Web Share (file) → Files app; fallbacks: download link, copy-to-clipboard.
5. Backup is the only protection against eviction, uninstall (deleting the Home Screen icon deletes all data) and device loss; the UI says so plainly.

## 6. State management (Zustand)

- Stores hold UI/session state and cached read-models, never business rules; IndexedDB is the truth.
- Stores: `settings`, `theme`, `dashboard` (read model), `timer` (Rubik state machine), `session` (active training session), per-game stores (board, history, draft), `pwa` (update available, readiness, storage health).
- The training engine emits typed events (`trainingCompleted`); stores subscribe and refresh. Dexie `liveQuery` + `dexie-react-hooks` (`useLiveQuery`) is used for simple reactive lists (history, bookmarks) so there is no hand-rolled invalidation where Dexie already provides it.
- Forms: React Hook Form + Zod resolver; schemas live beside domain types and are reused to validate imports/backups.

## 7. The Training Engine (`core/training`)

```ts
interface TrainingEngine {
  startSession(i: { module: ModuleId; activityType: ActivityType; skillId?: SkillId }): Promise<Session>;
  finishSession(id: SessionId, r: SessionResult): Promise<CompletionOutcome>;
  recordActivity(a: CompletedActivity): Promise<CompletionOutcome>; // lessons, puzzles, tips (no timer)
}
type CompletionOutcome = {
  xpAwarded: number;                 // 0 if activityKey already rewarded
  levelUp?: { from: number; to: number };
  streak: StreakState; newAchievements: AchievementId[]; goalsCompleted: GoalId[];
};
```

`finishSession` / `recordActivity` run in **one Dexie `rw` transaction** across `sessions, completions, xpLedger, xpRules, dailySummary, dailyGoals, achievements`: read `completions[activityKey]` → if present, return `xpAwarded: 0` → else insert session/completion, insert ledger row if rule enabled, update `dailySummary`, evaluate achievements against persisted facts, commit. Idempotency is enforced by primary-key/unique-index constraints **and** an in-transaction existence check (IndexedDB serialises overlapping `rw` transactions), never by UI.

Pure domain pieces (unit-tested): `levelForXp` (`xpToReach(L)=round(100·L^1.5)`), `computeStreak(activeDates, today, rule)`, `evaluateAchievements(defs, facts)`, `recommend(facts, now)` (deterministic; seam for a future AI coach), analytics aggregators over `dailySummary` / sessions.

XP rules are data (`xpRules`, seeded from `config.ts`, editable in Settings). XP is **never** the proficiency measure: each module registers a `SkillMetricProvider` (Ao12, accuracy, retention, rating…) shown beside XP.

```ts
interface TrainingModule { id: ModuleId; title: string; icon: IconName; activityTypes: ActivityType[];
  metric: SkillMetricProvider; recommendations?(facts: UserFacts): Recommendation[]; }
```
Modules register in `features/registry.ts`; Practice hub, Dashboard and Progress iterate the registry.

## 8. Content architecture

- Authored as JSON in `/content/<module>/*.json`, typed by Zod schemas. A Vitest suite validates every file: schema, unique IDs, quiz answer index in range, referenced topic IDs exist. **Bad content fails CI, not runtime.**
- Imported by each module's lazy chunk (so Workbox precaches it) – no network fetch for content ever. Optional budget check: precache total ≤ 15 MB, initial JS ≤ 250 kB gzip (enforced by a build script).
- Stable content IDs (`java.core.streams.map-vs-flatmap`) are the join key for user-state tables. IDs never change meaning across releases.

## 9. Game & compute engines (pure TS, Web Workers where heavy)

| Module | Engine | Notes |
|---|---|---|
| Rubik | `scramble.ts`, `stats.ts` (Ao5/Ao12/best/mean, DNF/+2), timer state machine | Timer samples `performance.now()` on `pointerdown/up`; display via `requestAnimationFrame` only formats. |
| Caro | `board.ts` (`Int8Array`), `rules.ts`, `ai/` | Candidate generation, pattern evaluation, alpha-beta + iterative deepening with time budget, threat shortcuts. **Runs in a module Web Worker** (supported on iOS Safari) so the UI never janks. |
| Chess | `chess.js` behind `ChessRules` port; `ChessEngine` port with `NullEngine` | Stockfish (WASM, worker) can implement the port later. No analysis UI until then. |
| Go | `board.ts`, `rules.ts` (flood-fill liberties, captures, suicide, positional superko via Zobrist), `scoring.ts`, `sgf-lite.ts` | Own engine; table-driven tests of known positions. |

Boards render as responsive **SVG** (Caro 15×15, Go ≤19×19, Chess 8×8): crisp at any DPR, pointer-event driven, with a text move list for accessibility.

## 10. Error handling

- Domain returns `Result<T, AppError>` for expected failures; throw only for programmer errors.
- Repository layer maps Dexie errors (`ConstraintError`, `QuotaExceededError`, `InvalidStateError`, `VersionError`, `OpenFailedError`) to `AppError`. `QuotaExceededError` → "Storage full" UI with export prompt.
- Boot gate: DB open/migration failure or unavailable IndexedDB → recovery screen (retry / restore snapshot / import backup / export what's readable) – never a white screen. Root `ErrorBoundary`; shared `<AsyncBoundary>` provides loading/empty/error states.

## 11. Testing strategy

- **Unit (Vitest, Node):** `core/*`, every `domain/`.
- **Integration (Vitest + `fake-indexeddb`):** schema upgrades from each historical version with fixture data; engine idempotency; repositories; backup round-trip; snapshot/data-loss marker.
- **Component (Vitest + Testing Library, happy-dom):** key screens and forms.
- **Content validation:** schema and referential checks.
- **E2E (Playwright, WebKit + iPhone viewport emulation):** install shell loads, offline reload (`context.setOffline`), SW update flow, data persists across reload, backup→restore. WebKit is the closest automated proxy for iOS Safari but **does not replace** the real-iPhone checklist (IOS_PWA.md §8).
- `npm run verify` = `tsc --noEmit && eslint . && vitest run`; `npm run verify:full` adds build + budget check + Playwright.

## 12. AI Coach (future-ready, not built)
Port `CoachProvider { analyse(facts): Promise<CoachAdvice> }` with the deterministic `RuleBasedCoach` as the only shipped implementation. A cloud provider could be added behind an explicit opt-in later; core never awaits it; no canned "AI" text.
