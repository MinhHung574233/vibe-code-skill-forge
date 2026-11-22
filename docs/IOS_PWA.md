# SkillForge – iOS PWA Constraints & Verification

Purpose: record what is known, what is only *reported*, and what must be verified on the real iPhone. Safari on iOS does not behave like desktop Chrome; nothing below is assumed until the device checklist (§8) passes. Sources are Apple/WebKit posts, Apple Developer Forums and WebKit Bugzilla reports consulted on 2026-11-22; forum/bug reports are **not** authoritative.

## 1. Storage & persistence (highest risk)

| Topic | What we know | Design response |
|---|---|---|
| Separate storage | Installed Home Screen web apps use storage separate from the Safari tab (widely reported; verify). Data entered in Safari before installing will **not** appear in the installed app | Onboarding: *install first, then use*. Moving data = Backup → Restore |
| 7-day cap (ITP) | Safari caps script-writable storage (IndexedDB, SW registrations, Cache API) after 7 days without user interaction **in browser tabs**; web.dev states installed Home Screen PWAs are exempt | Always use the installed app; never rely on the Safari tab |
| `navigator.storage.persist()` | WebKit says persistence requests are granted by heuristics (e.g. opened as Home Screen app). Third-party reports conflict (always denied vs. granted). No authoritative current statement for IndexedDB in installed apps | Call `persist()` at every standalone launch; show result in Settings; **do not rely on it**; test with `persisted()` on device |
| Quota | WebKit: Home Screen app has the same origin quota as the browser (large share of disk) | Show `estimate()`; content footprint is small (<15 MB precache) |
| Eviction under pressure | iOS can evict origin data when the device is low on storage | Data-loss detector + backup nudges + recovery screen |
| Delete icon | Removing the Home Screen icon deletes the app's data | UI states it; export before deleting/reinstalling |
| Changing URL/domain | New origin = empty storage | Pick the final host URL **before** daily use; document in DEPLOYMENT.md |

## 2. Service worker lifecycle
- iOS standalone apps are suspended and resumed rather than relaunched; there is no reload button or pull-to-refresh. Update flow therefore uses an explicit "Update ready – Restart" banner and checks on `visibilitychange`.
- SW and Cache API storage can be evicted separately from IndexedDB → `offlineReadiness` self-check with a Repair action.
- Never `skipWaiting` automatically (would swap code under a running timer/game).
- First install requires being online once for the full precache; the Settings readiness indicator tells the user when it's safe to go offline.

## 3. Standalone display, status bar, safe areas (verify on device)
- `apple-mobile-web-app-capable` + manifest `display: standalone` → no Safari chrome.
- Status bar style options: `default`, `black`, `black-translucent`. Reports indicate: without `black-translucent` the viewport starts below the status bar; with it, content extends under the bar and `env(safe-area-inset-top)` is required. Reports also describe regressions in iOS 26.x (status bar reclaiming space; `theme-color` possibly ignored). **Decision:** start with `default` (most predictable), keep `black-translucent` as a flagged experiment, decide after device test on the user's iOS version. Do not use pure `#000` for `theme-color`; use `#0B0D12`.
- `viewport-fit=cover`; use `100dvh` (not `100vh`); layout driven by `env(safe-area-inset-*)` for header, tab bar, bottom sheets, boards.
- Rotation: portrait-first; landscape allowed for boards later (no manifest orientation lock reliably honoured on iOS).

## 4. Icons & splash
- `apple-touch-icon` 180×180 opaque PNG (iOS ignores manifest icons for the Home Screen icon); 192/512 and maskable icons for the manifest. Generated from one SVG with `@vite-pwa/assets-generator`.
- iOS 18/26 dark/tinted Home Screen icon variants for PWAs: no reliable standard support reported → ship a single icon that looks good on both light and dark wallpapers.
- Splash: `apple-touch-startup-image` links per iPhone portrait size (media queries on device-width/height/DPR); reported that the splash follows the appearance at install time, so splash uses a **neutral brand-colour background** that works in both modes. Splash list is regenerated when new iPhone sizes appear; unknown sizes fall back to a plain background-colour launch.

## 5. Touch & input
- Disable double-tap zoom delay (`touch-action: manipulation`), selection/callout/long-press menus on interactive surfaces; inputs ≥16 px to avoid focus zoom; pointer events (not mouse) everywhere.
- Rubik timer: measure on `pointerdown`/`pointerup` with `performance.now()`, `touch-action: none`, no layout shift while running; keep large hit zone; guard against iOS edge-swipe-back and system gestures near screen edges (inset the hold zone).
- Haptics: Vibration API is **not** available on iOS Safari. No haptics in MVP (a Safari-17.4 `input[switch]` trick exists but is undocumented/fragile → optional later, feature-flagged).
- Keyboard: use `visualViewport` to keep forms above the keyboard.

## 6. Capabilities matrix

| Capability | iOS Safari PWA | Plan |
|---|---|---|
| Offline (SW + Cache API) | Yes | Core |
| IndexedDB | Yes (Dexie) | Core |
| Web Share with files | Yes (iOS 15+) | Primary export path |
| File download via `<a download>` | Works with quirks | Fallback |
| File import `<input type=file>` | Yes | Restore |
| Web Speech `speechSynthesis` | Yes, uses on-device voices; needs user gesture | English pronunciation (P1), feature-detected |
| Speech recognition | Unreliable/online | Not in MVP (speaking evaluation port only) |
| Screen Wake Lock | iOS 16.4+ (home-screen bugs reported in earlier versions) | Optional for Rubik/games, feature-detected |
| Web Push / background sync / scheduled notifications | Push needs a push server; no local scheduled notifications | **Out of scope** (no backend). Reminders are in-app only |
| Vibration/haptics | No | Not offered |
| Web Workers (module) | Yes | Caro AI, later Stockfish |
| CompressionStream | Safari 16.4+ | Possible backup gzip later |

## 7. What we explicitly won't claim
No guaranteed persistence, no background reminders, no native haptics, no Home Screen icon theming, until proven on the device.

## 8. Real-iPhone verification checklist (recorded in ROADMAP test log per milestone)
1. Add to Home Screen → launches standalone, correct icon/name, splash shown.
2. Status bar legible in Light and Dark; header/tab bar clear of notch/Dynamic Island and home indicator.
3. Airplane mode → cold launch → all modules open; data intact.
4. Kill app from switcher → relaunch → data intact.
5. `navigator.storage.persisted()` and `estimate()` values noted.
6. Deploy a new build → "Update ready" appears → Restart → data intact, schema upgrade (if any) OK.
7. Export via Share sheet → file in Files; Import it after reset → counts match.
8. Rubik timer: no double-tap zoom, no text selection, accurate against a reference stopwatch.
9. Rotate, keyboard open on forms, long-press on boards (no callout/magnifier).
10. Leave app unopened ≥ 8 days (once, early) → data still present.
