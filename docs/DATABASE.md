# SkillForge – Database (IndexedDB / Dexie, v2)

Engine: IndexedDB through **Dexie 4**. One database named `skillforge`, local only. Data model is the same as the original SQLite design, re-expressed as object stores (camelCase fields).

## 1. Conventions

- **IDs:** client-generated sortable strings (`ids.ts`). Content IDs are stable human-readable strings.
- **Timestamps:** epoch ms UTC (`*At`). **`localDate`** (`YYYY-MM-DD`, device timezone) is computed at write time and never recomputed → streaks survive timezone/DST changes.
- **Booleans:** stored `0|1` when indexed (IndexedDB cannot use booleans as keys); `true/false` elsewhere is avoided for consistency in rows.
- **JSON payloads** (`result`, `config`, `moves`) are plain objects for module-specific detail not queried directly.
- **Soft delete:** `deletedAt` on user-authored entities (skills, notes, collections, custom words).
- Only **queried** fields appear in the Dexie index string; everything else is an unindexed property.
- Referential integrity is not enforced by IndexedDB. Repositories delete dependents explicitly (e.g. deleting a session removes its solves/attempts in the same transaction), and an integrity test scans for orphans.

## 2. Versioning & migrations

```ts
class SkillForgeDB extends Dexie {
  constructor() {
    super('skillforge');
    this.version(1).stores({ /* v1 */ });
    this.version(2).stores({ /* only changed/added stores */ }).upgrade(tx => { /* data fix-ups */ });
    …
  }
}
```
Rules:
1. Declarations are **append-only**; never edit a shipped version. Never remove a store without an explicit `null` + upgrade that has already migrated its data.
2. Each upgrade function is covered by a test: seed `fake-indexeddb` at version N with fixtures → open at latest → assert data.
3. Upgrades run inside Dexie's version-change transaction (atomic): failure rolls the whole upgrade back and leaves the old version intact.
4. **Pre-migration snapshot** (`db/snapshot.ts`): before opening at a higher version, the old DB is opened dynamically and dumped to a separate `skillforge-snapshot` database (one rolling snapshot). Restore is available from the recovery screen. Protects against migration bugs, not against browser eviction (same origin).
5. `versionchange` events close the connection so a stale tab/SW never blocks an upgrade.
6. App-level `meta.schemaVersion` mirror in `settings` for diagnostics and export headers.

## 3. Stores (final shape delivered incrementally)

### v1 – core (Phase 1)
```
settings:     'key'
skills:       'id, moduleId, category, isArchived, updatedAt'
skillGoals:   'id, skillId, metric'
drafts:       'key'                         // in-progress timer/game/session JSON for crash-safe resume
```
`skills`: `{id,name,category('mind'|'language'|'technical'|'games'|'custom'),moduleId?,priority(1..3),description?,isArchived:0|1,createdAt,updatedAt,deletedAt?}`
`skillGoals`: `{id,skillId,metric('minutes_per_week'|'rubik_ao12_ms'|'vocab_words'|'lessons_completed'|…),target,direction('at_least'|'at_most'),deadlineDate?,achievedAt?,createdAt,updatedAt}`

### v2 – training engine (Phase 2)
```
sessions:         'id, moduleId, skillId, localDate, startedAt, [moduleId+startedAt]'
completions:      'activityKey, moduleId, localDate'      // PRIMARY KEY = idempotency anchor
xpRules:          'activityType'
xpLedger:         'id, &activityKey, localDate, moduleId' // &activityKey = unique
dailySummary:     'localDate'
dailyGoals:       'id, isActive'
achievements:     'achievementId'
```
- `sessions`: `{id,moduleId,activityType,skillId?,startedAt,endedAt?,durationSec,localDate,score?(0..1),result?,notes?,createdAt}`
- `completions`: `{activityKey ('session:<id>'|'lesson:<contentId>'|'puzzle:<id>'|'daily:<date>'…),moduleId,activityType,sessionId?,completedAt,localDate}`
- `xpLedger`: `{id,activityKey,xp,skillId?,moduleId,localDate,awardedAt}` → total XP = Σ xp; **level is derived, never stored**.
- `dailySummary`: `{localDate,durationSec,sessions,activities,xp,goalsMet}` maintained in the engine transaction.
- `achievements`: `{achievementId,unlockedAt,evidence}` – `evidence` is the fact snapshot that satisfied the rule (auditable; "based on actual activity").

### v3 – content-linked state (with first content module)
```
contentProgress:  '[contentType+contentId], contentType, status'
bookmarks:        '[contentType+contentId], contentType, createdAt'
notes:            'id, [contentType+contentId], updatedAt'
quizAttempts:     'id, sessionId, [contentType+contentId], answeredAt'
```

### v4 – Rubik
```
rubikSolves:      'id, sessionId, solvedAt, localDate'
```
`{id,sessionId,puzzle:'333',timeMs,penalty('none'|'plus2'|'dnf'),scramble,source('timer'|'manual'),comment?,solvedAt,localDate}`. Raw time and penalty stay separate. Algorithm status/notes reuse `contentProgress`/`notes` (`contentType='rubik_alg'`); goals reuse `skillGoals`.

### v5 – English
```
vocabProgress:         'wordId, status, dueAt, isFavorite'
vocabReviews:          'id, wordId, sessionId, localDate'
vocabCollections:      'id, updatedAt'
vocabCollectionItems:  '[collectionId+wordId], collectionId, wordId'
customWords:           'id, updatedAt'
```
`vocabProgress`: `{wordId,status('new'|'learning'|'review'|'mastered'),ease(2.5),intervalDays,repetitions,lapses,dueAt,lastReviewedAt?,isFavorite:0|1,firstSeenAt}`. Bundled word definitions are **not** copied into IndexedDB; `wordId` references bundled content or `customWords.id`.

### v6+ – games & puzzles
```
gameRecords:      'id, game, startedAt, localDate'
puzzleAttempts:   'id, [game+puzzleId], attemptedAt, localDate'
ratingHistory:    'id, game, at'
```
`gameRecords`: `{id,sessionId?,game('caro'|'chess'|'go'),mode('vs_ai'|'local'|'puzzle'),config,result('win'|'loss'|'draw'|'abandoned'),moves,startedAt,endedAt?,localDate}`. In-progress games autosave to `drafts` (`game_draft:<game>`).

## 4. Key queries

| Need | Query |
|---|---|
| Streak | `dailySummary` rows with `sessions+activities>0`, sorted desc → pure `computeStreak` |
| Total XP | `xpLedger` sum (cached in a read-model; recompute on write) |
| Weekly/monthly duration | `dailySummary.where('localDate').between(a,b)` |
| Due vocab | `vocabProgress.where('dueAt').belowOrEqual(now).limit(n)` |
| Weak topics | `quizAttempts` by `[contentType+contentId]`, accuracy over last N in TS |
| Ao5/Ao12 | last 12 `rubikSolves` by `solvedAt`, computed in TS (WCA trim rules) |
| Recent activity | `sessions.orderBy('startedAt').reverse().limit(n)` |

## 5. Backup / export / import

- **Format:** `{ app:'skillforge', backupVersion:1, schemaVersion, exportedAt, device?, tables:{ [store]: rows[] }, checksum }` (SHA-256 over canonical JSON via `crypto.subtle`). Human-readable JSON, no compression in v1.
- **Export paths on iOS:** (1) `navigator.share({files:[File]})` → Save to Files / AirDrop (preferred; feature-detected with `navigator.canShare`); (2) `<a download>` blob link; (3) copy-to-clipboard fallback. Each path is tried in order; all verified on a real device (IOS_PWA.md).
- **Import:** `<input type=file accept=".json">` → parse → Zod validate (`backupVersion`, `schemaVersion ≤ current`, table shapes, checksum) → **preview** (row counts, date range) → confirm → automatic snapshot of current data → clear + bulk insert in one transaction → run upgrades if the backup is older (import writes old-schema rows into a temp DB at that version, then Dexie migrates). v1 supports **Replace**; Merge is deferred (conflict semantics).
- **Reminders:** backup-age banner (>14 days or >200 new records).
- Export excludes bundled content (it isn't in the DB) and the snapshot DB.

## 6. Failure handling

- Open/upgrade failure or missing IndexedDB → boot recovery screen (retry, restore snapshot, import backup, export readable data).
- `QuotaExceededError` on write → non-destructive "Storage full" dialog with export button; the failed transaction rolls back atomically.
- Duplicate-completion (`activityKey` exists) is expected control flow → "already done", not an error.
- Data-loss marker mismatch (empty DB, non-empty marker) → recovery prompt (see ARCHITECTURE §5).

## 7. Implementation status (M1.3, 2026-11-22)

- **Code:** `src/db/schema.ts` (append-only `SCHEMA_VERSIONS` + `SkillForgeDB` builder that can declare only versions up to N), `boot.ts`, `snapshot.ts`, `marker.ts`, `recovery.ts`, `storage.ts`, `errors.ts`; settings repository in `features/settings`.
- **Boot order:** IndexedDB available? → peek installed version (a dynamic, schema-less open) → newer than code: refuse (`schema-too-new`, never downgrade; Dexie 4 would otherwise open it) → older: snapshot, then upgrade → open (failure while upgrading = `migration-failed`, old data untouched because the version-change transaction aborts) → data-loss check → marker hooks + schema-version mirror.
- **Snapshot restore** recreates the database at the snapshot's schema version, bulk-loads the rows, then boots normally so Dexie migrates forward again. This is why historic versions must stay declared.
- **Marker:** `MARKER_TABLES` = user data (`skills`, `skillGoals` so far), `EPHEMERAL_TABLES` = `settings`, `drafts`. A test requires every store to be in exactly one list.
- **Tests use real Dexie on `fake-indexeddb`**, with synthetic v2/v3 schemas to exercise upgrades, failed upgrades, newer data and restore.
- **Known limitation:** the marker lives in localStorage, which iOS may evict together with IndexedDB; the detector is an early warning, backups remain the real protection.
