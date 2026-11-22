# SkillForge – Product Requirements Document

Status: Draft v2 (Phase 0, PWA platform) · Owner: product/architecture · Platform: installable PWA for the owner's personal iPhone (Safari → Add to Home Screen). Not distributed through the App Store; no Apple Developer account. See TECHNICAL_DECISIONS D-0, IOS_PWA.md.

## 1. Vision

> Train your mind. Sharpen your skills. Become better every day.

SkillForge is a **personal growth & training hub** for a single user. It brings together the activities the user already does to get better (cubing, board games, English, Java/Spring, developer tooling) into one app with a **shared training engine**: every activity produces a training session, sessions produce XP, streaks, goals and analytics, and analytics point to what to practise next.

Non-goals (MVP): accounts, backend, social/multi-user, App Store/native distribution, Android and desktop optimisation, push or scheduled notifications (not feasible without a server on iOS web), haptics (unavailable in iOS Safari), advanced chess analysis, Go AI, AI coach, audio/speaking evaluation.

## 1a. Platform

- Static single-page app (React + TypeScript + Vite), deployed to a free HTTPS static host; installed on the iPhone via Safari's *Add to Home Screen*; launches standalone with its own icon and splash.
- 100 % offline after the first successful install (app code **and** all learning content are precached by a service worker). Personal data lives only in on-device IndexedDB.
- iOS-specific limits (storage may be evicted, separate storage from Safari tab, no reload button, no push) are first-class product concerns: the app provides install guidance, an offline-readiness indicator, storage-health status, backup reminders and one-tap export/restore.

## 2. Target user and jobs-to-be-done

One persona: a software engineer (Vietnamese speaker, English learner, Java/Spring focus) who also trains Rubik's cube and board games and wants a single daily habit loop.

| Job | Product answer |
|---|---|
| "What should I practise today?" | Dashboard: daily goals + recommended next activities |
| "Am I actually improving?" | Per-skill performance metrics (not XP only): Ao5/Ao12, puzzle accuracy, retention rate, quiz score |
| "Keep me consistent" | Streaks, daily goals, achievements built on real activity |
| "Don't let me forget" | Spaced repetition (vocabulary), review queue for weak topics |
| "Works on the train" | 100% offline, no sign-in |

## 3. Product principles

1. **One engine, many modules.** Modules never write XP/streaks themselves; they emit a *completed activity* to the training engine.
2. **Measure skill, not just effort.** XP/streak = habit. Skill metrics = improvement. Both are shown, never conflated.
3. **Offline-first, local-only.** IndexedDB (Dexie) is the source of truth. All seed content is precached by the service worker at install.
4. **Honest features.** No fake AI, no fake "analysis". Anything not built is not shown (or is labelled "coming later").
5. **App-like feel.** iOS idioms on the web: large titles, bottom sheets, edge-swipe back, safe areas, spring motion, touch-first targets. Visual feedback replaces haptics.

## 4. Information architecture

Tabs: **Home · Skills · Practice · Progress · Settings**

- **Home** – dashboard (Module 1).
- **Skills** – skill list, create/edit, goals, priority, per-skill detail with metrics and history.
- **Practice** – hub for the 7 modules: Rubik, English, Java & Spring, Developer Tools, Caro, Chess, Go (+ Daily Challenge, Daily Developer Tip).
- **Progress** – analytics (day/week/month duration, distribution, consistency, per-skill performance), achievements, training history.
- **Settings** – theme, daily goals, XP rules, streak rule, **Offline** (readiness + repair), **Data** (storage health, export/import backup, reset), install guidance, about/privacy.

## 5. Functional requirements

Priority: **P0** = MVP-blocking, **P1** = MVP-desirable, **P2** = later.

### 5.1 Training engine (shared) – P0
- FR-E1 Skill CRUD: name, category, priority (1–3), description, goal(s), archive. Seeded default skills mapped to modules (user may edit/hide).
- FR-E2 Training session lifecycle: `start → (record activity/results) → finish`. Stores module, skill, duration, activity type, result payload, notes, local date.
- FR-E3 Duration measured from monotonic timestamps, not tick counts; sessions interrupted by app backgrounding are recoverable (stored `started_at`, app resumes or discards).
- FR-E4 XP: configurable rule table (`activity_type → xp`). Defaults: vocab session 20, Java lesson 30, chess puzzle 10, Rubik session 15, daily challenge 50. **Idempotent**: unique `activity_key` per rewardable thing (e.g. `lesson:java.streams.01`, `session:<uuid>`, `daily:2026-11-22`). Re-completing never re-awards.
- FR-E5 Level curve: pure function of total XP (documented in ARCHITECTURE).
- FR-E6 Daily goals: duration target, session-count target, skill-specific targets, completion status per day.
- FR-E7 Streak: consecutive local days where the "streak qualifier" is met (default: ≥1 completed session; configurable to "daily goal met"). Handles timezone/DST by storing `local_date` at write time.
- FR-E8 Achievements: definitions in code, unlocks derived from persisted activity (never from UI events). Initial set: first session, 7-day streak, 30-day streak, 100 vocabulary words learned, first Java path completed, Rubik personal best.
- FR-E9 Analytics queries: daily/weekly/monthly duration, per-skill progress, consistency (active days / period), history, distribution by module.
- FR-E10 Recommendation (rule-based, deterministic): due vocab reviews, unmet daily goal, weakest/neglected skill, in-progress lesson, today's developer tip. Interface designed so a future AI coach can replace/augment it.

### 5.2 Module 1 – Dashboard – P0
Today's goals ring(s), today's activities, today's duration, streak, XP/level bar, skill progress overview, recent activities, recommended next (top 3), weekly mini-chart. Above-the-fold: *goal progress + next action*. Everything else is scrollable and collapsible. Empty states for a new install.

### 5.3 Module 2 – Rubik – P0
Timer (hold-to-ready, release-to-start, tap-to-stop, inspection optional), `performance.now`/monotonic based; scramble generator (WCA-style 20-move random-state-free scramble with no redundant/adjacent same-axis moves); manual entry; +2/DNF/delete; history; best, mean, **Ao5, Ao12** (WCA trimmed rules, DNF handling); session stats; line chart; algorithm library (Cross, F2L, OLL, PLL) with notation, status (learning/known), personal notes; goals (e.g. sub-30 Ao12). Personal-best achievement.

### 5.4 Module 3 – Caro (Five-in-a-Row) – P1 (phase 3, order 5)
15×15 board (configurable), exactly-five or free-five rule option, vs AI (4 levels, threat-based search engine), 2-player local, move history, undo (undo pairs vs AI), restart, win detection with highlighted line, tactical puzzles (win-in-N / must-block), stats.

### 5.5 Module 4 – Chess – P1 (order 6)
Interactive board, legal moves via **chess.js**, history, undo/restart, promotion picker, check/checkmate/stalemate (+ threefold, 50-move, insufficient material), puzzles (bundled FEN sets, mate-in-1/2, tactics), opening library (name, ECO, move line, ideas), training history, ELO-like rating (Elo update from puzzle results and optional AI game results, labelled "SkillForge rating", not FIDE). `ChessEngine` interface so Stockfish can be added later; **no "analysis" UI until an engine exists**. Optional vs-computer play only with a clearly labelled lightweight engine (P2).

### 5.6 Module 5 – Go – P1 (order 7)
9/13/19 boards, legal placement, captures, suicide rule, ko (positional superko-safe), pass, two-pass end, dead-stone marking, area scoring (Chinese) with komi and territory scoring option, history, undo, restart, Tsumego (bundled SGF-like problems with solution trees), stats. Rules correctness first; no AI in MVP (local 2-player + puzzles).

### 5.7 Module 6 – English – P0/P1 (order 2)
Categories: Vocabulary, Grammar, Listening, Reading, Speaking. **MVP implements Vocabulary fully** (flashcards, EN definition, VI translation, example, category, favourites, personal collections, custom words, multiple-choice quiz, SM-2 spaced repetition, history, daily word goal, stats) with a bundled **IT English** collection. Grammar/Reading ship as simple structured lessons + quizzes if time permits; Listening/Speaking are *interfaces only* (audio asset slot and `SpeakingEvaluator` port; no fake evaluation). Optional pronunciation playback via the Web Speech `speechSynthesis` API (on-device voices, feature-detected) is P1.

### 5.8 Module 7 – Technical Mastery – P0/P1 (orders 3–4)
**A. Java & Spring Boot** – 5 tracks (Core Java, Advanced Java, Spring Boot, Software Architecture, Performance & Security), each topic: explanation, practical examples, code snippets (syntax-highlighted, copyable), common mistakes, best practices, quiz, practical challenge, bookmark, personal note, completion state. Path completion drives the "first Java path completion" achievement.
**B. Developer Tools** – IntelliJ, Git/GitLab, DevOps; each tip: title, category, difficulty, explanation, example, commands/shortcuts, common mistakes, practice task, bookmark. **Daily Developer Tip** (deterministic by date, no repeats until cycle completes).

Content is authored in-repo as typed JSON/TS (see ARCHITECTURE §6). Content quality bar: advanced, real-world, reviewed for technical accuracy; shipped as "sample"/seed content in volume appropriate to each milestone, never claimed as exhaustive.

### 5.9 Settings, backup, data – P0/P1
Theme (system/light/dark), daily goals, XP rule editor, streak rule, reset data (confirmed), **export/import JSON backup** via the iOS share sheet / Files (**P0** – the only protection against iOS storage eviction or icon deletion), backup-age reminder, storage-health panel (`persisted`, usage/quota), offline-readiness check with repair, update-ready prompt, install coach sheet, privacy statement (no data leaves the device).

## 6. Non-functional requirements

| Area | Requirement |
|---|---|
| Offline | After install, zero network needed; no runtime network calls for core features. Verified by airplane-mode test on device and Playwright offline test. |
| Installability | Valid manifest, apple-touch-icon, standalone display, splash images; installs via Safari Add to Home Screen; launches without browser chrome. |
| Performance | Cold launch to interactive dashboard < 2 s on a recent iPhone; initial JS ≤ 250 kB gzip; total precache ≤ 15 MB; timer input latency ≤ 1 frame; hardest Caro AI move ≤ 2 s (in a Web Worker). |
| Timer accuracy | `performance.now()` sampled at pointer events; display via rAF is decoupled from measurement. |
| Reliability | Dexie versions append-only with upgrade tests; pre-migration snapshot; boot failure → recovery screen (retry / restore snapshot / import backup / export). |
| Data integrity | XP/completion idempotency by key constraints plus in-transaction check; explicit dependent deletes; orphan-scan test. |
| Data durability | Best-effort `persist()`, data-loss detector, backup nudges, share-sheet export, validated restore. No guarantee of persistence is claimed. |
| Update safety | Updates are user-prompted; never swap code mid-session; data survives updates. |
| Accessibility | Semantic HTML, text zoom, VoiceOver labels, ≥44 px targets, AA contrast in both themes, reduced-motion honoured; boards expose a text move list. |
| Privacy/security | No analytics, no third-party requests, no secrets; data never leaves the device except user-initiated export. |
| Quality | TypeScript strict, ESLint, Vitest (+ Playwright WebKit smoke); domain logic ≥ 90 % unit-tested; `npm run verify` green before each milestone closes. |

## 7. Success metrics (personal-use)

- Opened daily; ≥ 5 active days/week after 4 weeks (self-measured via the app's own consistency metric).
- All seven modules usable offline from the Home Screen icon.
- Crash-free; no data loss across 30 days of use (including at least one 8+ day idle period and one app update).
- Measurable skill trend visible per skill (e.g. Ao12 trending down, vocab retention ≥ 80 %).

## 8. Scope by phase

| Phase | Outcome |
|---|---|
| 0 | These docs, environment verified, plan approved |
| 1 | Installable offline PWA shell: navigation, theme, Dexie + migrations, stores, SW update flow, backup/restore, dashboard skeleton; first real-iPhone check |
| 2 | Training engine + Skills + Progress screens (XP, level, streak, goals, achievements, analytics) |
| 3 | Modules in order: Rubik → English → Java → Dev Tools → Caro → Chess → Go |
| 4 | Quality, a11y, perf, tests |
| 5 | Deployment & release readiness: final icon/splash, free static hosting, cache headers, backup/restore drill, device checklist. (No App Store/TestFlight.) |

## 9. Open questions (decisions recorded in TECHNICAL_DECISIONS.md)

1. Streak qualifier default (any session vs goal met) – default: any completed session.
2. Rubik inspection time – default off, toggle in settings.
3. English content size for MVP – target ≥ 300 IT-vocabulary words, 100 % authored offline.
4. Scope of Grammar/Reading in MVP – deferred until Vocabulary is complete.
