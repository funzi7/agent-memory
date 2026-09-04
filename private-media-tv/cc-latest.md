# Private Media TV — F2C.7.11 Home single row, source intents, Telegram roles, Israeli metadata, exact match alerts (mobile code 41; physical acceptance pending)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2C.7.11 — one personalized Sports row before Continue Watching (full section restored to its established slot), playback-derived personalization, two explicit Universal Source owner intents + root-caused projection fix with self-healing migration, hybrid Sports Programme recurrence, LiveBall exact onboarding, non-exclusive Telegram source roles + Sports media discovery, provider-neutral eligibility chrome, corrected YouTube DRM taxonomy, geresh-insensitive Search, Hebrew Sports presentation, Wikidata + Hebrew Wikipedia Israeli episodic metadata, secure OMDb connection, Series Details persistent cache, exact Android match alerts, LIVE provider applicability, Telegram channel-Live observation, unresolved-announcement UX |
| Branch / tracking | `main` / `origin/main` |
| Starting application HEAD | `878452477eb7324050df86d6088b84a21fc3c7e1` — verified clean code-40 baseline `== origin/main` |
| Final application HEAD | `e37750bb4940c2a71fea47430f6331d7efbd5fbf` |
| Application commits | `d7974b4733d68084c75dd576477b407c735f6f03` — `Complete F2C.7.11 …` (all product work, 158 files, the single version bump); `3328ea743872a1feeb816f008ba4f2926beb84a6` — CI-only Robolectric cache + step timeouts; `e37750bb4940c2a71fea47430f6331d7efbd5fbf` — CI-only deterministic Robolectric prefetch. The two CI commits change no production code, test, or version. |
| Exact-head Android CI | run `33898150018` — **SUCCESS** for the exact final HEAD `e37750bb` (both jobs green). Unit tests 7m42s, lint 7m57s, assemble 3m46s, verification + APK upload green. |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.4.22-phone-test`, versionCode 41; exactly one bump over installed code 40 |
| TV identity | `com.funzi7.privatemediatv`, `0.6.11-f2c71`, versionCode 34 — frozen; no TV/Shield edit/task/build/test/lint/version/artifact/publication/device action |
| Authoritative exact-head CI APK | `/storage/emulated/0/Download/PrivateMediaTV/Test/private-media-tv-mobile-0.4.22-phone-test.apk`; 258,902,916 bytes; ARM64-only; APK SHA-256 `ad3af2eb0391daefe14878791c923ec6a7337965d5b752156ea9c9a1e7929cbf`; TDLib JNI SHA-256 `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` (matches pinned, unchanged from code 40); created by the exact-head downloader from run `33898150018` (provenance `authoritative exact-head CI`; `Publication: created`; same-version local cleanup `absent`); older versioned APKs 0.4.15–0.4.21 preserved. |
| Development signer | SHA-256 `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` — unchanged |
| Deterministic validation | 2,800+ tests across app-mobile and every mobile-used core module, 0 failures, 9 opt-in skips (app-mobile 998, core-catalog 429, core-metadata 326, core-sports 279, core-telegram 257, core-playback 110, core-security 109, core-provider 65, core-youtube 56, remainder smaller). Android lint: 41 warnings, 0 errors. |
| Overall result | **PASSED automated/local/CI implementation gates; PHYSICAL TEST PENDING** for every on-device behaviour (112-item code-41 block in `docs/MOBILE_ACCEPTANCE.md`) |

## Physical code-40 owner evidence (preserved exactly)

PASS: FootReplays FULL MATCH native playback; one direct DasFootball highlight; Episode Details
auto-discovery; the provider-neutral YouTube engine boundary; the no-spoiler policy; explicit
favourite-team semantics; the source-eligibility fix.

FAIL (each drove this milestone): the whole Sports section moved above Continue Watching; exclusive
Telegram source roles; `SOURCE_SAVED_PROJECTION_PENDING` on a provider root and an exact LiveBall URL;
no Telegram Highlights; an opaque announcement picker; Reacher not found by Search and still showing
Kan 11 YouTube + official-VOD chrome; `הפשוטע` S1E7 placeholder synopsis; trailers dying in a silent
spinner; a false `DRM_REQUIRED` on public highlights; a missed Manchester United official highlight;
missing FootReplays halves plus a bare `נגן`; no visible `ראיתי` / `לא מעוניין`; and — from the
live-sports addendum — no pre-match notification for a LIVE favourite-team Beitar match.

## What code 41 implements (ADR 0054, decisions 1–18)

- **Home order (SUPERSEDED owner correction).** Exactly ONE personalized Sports row before Continue
  Watching; the full Sports section returns to its established slot after the personal rows and
  before `חדש בישראל`. Promoted matches are hidden from the full section by presentation only
  (`SportsHomeSectionPlan.excluding`). A source-order contract test fails if the full section ever
  leads again.
- **Sports owner actions.** `ראיתי` / `לא מעוניין` / `החזר להמלצות` on the personalized row, the
  compact card overflow and Match Details, all through one durable preference boundary; they reorder
  recommendations only and never delete a match, source or favourite.
- **Playback-derived personalization.** The durable signal now comes from the single PMTV playback
  observation pipeline: an accidental open/back records nothing (the code-40 open-time MEANINGFUL
  floor is gone), one session persists exactly one signal, and a stronger observation upgrades it in
  place. Highlights never mark a full replay watched.
- **Universal Source projection — root cause and closure.** A committed save re-stamped the Room
  registry's successful-probe instant with the SAVE time, so the projected profile violated
  `SourceProfile.init: health.lastSuccessfulCheck <= validatedAt` and threw out of `recoverAndLoad`;
  every retry repeated it, which is why the state was terminal. Fixed by
  `projectedWithRegistryHealth` carrying the successful-probe instant forward, plus automatic
  post-commit reconcile, idempotent re-save (`SOURCE_ALREADY_REGISTERED`), visible retirement
  reconciliation, and an exact privacy-safe `SourceSavedProjectionCause`. Deterministic tests missed
  it originally because they used `Clock.fixed` and a fake registry that copied probe health verbatim.
- **Self-healing migration (owner decision).** A profile durably saved by an earlier build whose
  stored timestamps violate the invariant is repaired IN PLACE on load — advancing only the
  configuration-validation instant, never the identity, URL, origin graph, capabilities, fingerprint,
  owner approval, Room bindings or priority rows — and announced once through `safeNotice` rather than
  changing silently. The owner never has to delete and re-add a LiveBall/TimeSoccerTV source.
- **Two explicit owner intents.** `SourceOwnerIntent` distinguishes a provider/Website profile
  (durable and usable without `playerDetected`, Sports wording `מקור תוכניות ספורט נשמר וייכלל בחיפוש`)
  from an exact content URL (binds to its exact canonical identity or names the exact missing
  evidence).
- **Sports Programs + hybrid recurrence (owner decision).** A durable `SPORTS_PROGRAMS` role feeds
  bounded same-origin discovery (show tag + stable recurring path + edition marker; fixtures and
  articles rejected with exact reasons) into durable encrypted app-private storage. A first
  provider-marked edition is shown and playable immediately while the programme persists as
  `RECURRENCE_UNCONFIRMED`; confirmation needs a second DISTINCT edition or independent authoritative
  metadata, is monotonic, and re-observing the same edition never confirms. Unconfirmed programmes
  drive no recurring prediction, cadence inference, scheduling hint or notification.
- **LiveBall.** Exact `liveball.sx/match/{id}` onboarding captures spoiler-free exact-match evidence
  and binds only on strong evidence, with a native-resolver bridge. The production exact-fixture
  crosswalk for LiveBall's numeric team/league ids does NOT exist, so the shipped binder reports the
  exact missing evidence rather than guessing.
- **Telegram roles.** Catalog media / Sports announcements / Sports media are independent per chat
  over the existing membership column (no schema change); one shared selected-first picker whose
  displayed count always equals its rendered selected rows; no chat must be removed from movies and
  series first. Sports media binds only on both exact team identities plus a bounded date window, with
  truthful HIGHLIGHTS / EXTENDED_HIGHLIGHTS / FULL_REPLAY / CLIP classification.
- **Eligibility chrome.** `F2bYouTubeSourceStatus` / `F2bBroadcasterSourceStatus` are provider-neutral
  and identity-scoped: nothing renders for an ineligible title (inline Episode Details included), the
  real provider is named when one is eligible, and state clears on identity change. No hardcoded Kan 11.
- **YouTube truth.** `DRM_PROTECTED` requires real `licenseInfos`; a generic refusal becomes
  `MEDIA_RESOLVE_PLAYBACK_RESTRICTED`; login/age/region keep their own codes. Trailers report failures
  and route through the provider-neutral engine; no owner-facing SmartTube wording remains.
- **Search / Hebrew / metadata.** `CatalogSearchQueryPolicy` makes `ריצ'ר` ≡ `ריצר` through a bounded
  ordered query set without merging identities. `SportsHebrewPresentation` localizes Sports display
  only — never a stable key, matcher, crosswalk or provider brand, and never invents a
  transliteration. `HebrewWikipediaEpisodeMetadataProvider` reaches Hebrew Wikipedia ONLY through an
  exact IMDb → Wikidata `P345` → `hewiki` crosswalk with a `P4983` TMDB-id contradiction guard, and
  renders CC BY-SA 4.0 attribution. `TmdbPlaceholderEpisodePolicy` treats known filler as absent.
- **OMDb / Series cache.** Full secure Accounts & Connections card: in-app entry, candidate validation
  before an atomic replace, old key preserved on failure, masked status only, exact-IMDb-only cached
  ratings. Series Details renders last-known-good persistent cache immediately, with no destructive
  migration and no app-version cache key.
- **Exact Android match alerts (addendum).** Scheduling moved behind a testable platform alarm port
  backed by `AlarmManager.setExactAndAllowWhileIdle`; WorkManager survives only as a redundant
  backstop that cannot post twice. `SCHEDULE_EXACT_ALARM` + `RECEIVE_BOOT_COMPLETED` declared, with a
  receiver for BOOT_COMPLETED / MY_PACKAGE_REPLACED / TIME_SET / TIMEZONE_CHANGED /
  SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED. Permission state is truthful, reconciles when
  granted, and the old `now >= kickoff` rule survives only as a late-fire guard. `USE_EXACT_ALARM` is
  deliberately NOT declared: it is reserved for alarm-clock-class apps and Play-restricted.
- **LIVE provider applicability (addendum).** Families are chosen by `FixtureState`: a LIVE fixture
  reaches only LIVE-capable families and FootReplays / DasFootball / official YouTube Highlights are
  neither invoked nor given status rows; `שידורים חיים` leads Match Details while live; post-match
  sections appear at FINISHED; UPCOMING triggers no post-match work. Transitions cancel obsolete work,
  preserve valid source facts by identity, drop stale statuses and never duplicate.
- **Unresolved announcements (addendum).** An item with no evidence for the OPEN fixture no longer
  renders on Match Details at all — it survives as a truthful count in the existing source-family
  diagnostics block (no new management screen). Partial-evidence candidates sit in one collapsed
  secondary block, deduplicated by stable private message and evidence identity, each with exactly one
  labelled action. A Compose regression mounts 24 unresolved announcements and asserts zero identical
  full-width `שייך למשחק` buttons.

## Telegram channel Live — exact pinned-TDLib capability truth

**OBSERVATION: IMPLEMENTED.** On pinned TDLib 1.8.66, `Chat.videoChat`, `UpdateChatVideoChat`,
`GetGroupCall` and `UpdateGroupCall` reveal which SELECTED Sports-media chats are broadcasting, RTMP
vs video chat, and when a stream ends. Several live channels become several distinct owner choices;
exact evidence marks MATCHED, otherwise OWNER_SELECTABLE_UNVERIFIED (manually playable for that
session only, never persisted as a verified binding).

**STREAM PLAYBACK: NOT IMPLEMENTED — exact reason.** `GetGroupCallStreams` and
`GetGroupCallStreamSegment` answer only for a JOINED group call. Joining requires a WebRTC/tgcalls
join payload plus an audio source id that PMTV deliberately does not ship, and would announce the
owner as a call participant. `GetVideoChatRtmpUrl` returns the owner's OWN publishing URL and stream
key for a chat they administer, so it is never called. Surfaced truthfully as
`שידור חי · Telegram · העברת השידור החי אינה נתמכת בגרסה זו`, never as a generic failure and never
collapsed into `עדיין לא נמצא מקור מדויק`. The SUPPORTED branch exists and is tested, so a lawful
transport engages it unchanged.

## Provider truth (see `docs/F2C711_PROVIDER_OPERATIONAL_MATRIX.md`)

- **TimeSoccerTV** — IMPLEMENTED. Opt-in live smoke on the real provider: `SOURCE_DETECTED`,
  `PROVIDER_SOURCE`, `BOUNDED_GENERIC_INDEX`, 1 programme / 1 edition, `delivery=WEB_SOURCE`,
  `playbackObserved=false`. TWO defects were involved in the owner's failure: the timestamp-ordering
  projection bug AND a non-browser probe User-Agent that drew a 503; the browser UA fixed the latter.
- **Programme embed hosts (ok.ru, dailymotion)** — NOT IMPLEMENTED, no native resolver; discovered
  programme sources stay truthfully `WEB_SOURCE`.
- **Kan / mako / 13tv as METADATA** — BLOCKED with exact reasons: Kan has no documented API, no
  metadata-reuse licence (terms permit non-commercial personal use, forbid derivative works and
  obtaining information by means not intentionally made available) and answered every request from
  this environment with an interactive challenge; mako's terms forbid deep links and building
  collections/databases; 13tv refused non-browser clients. Kan/Keshet/Reshet remain a
  broadcaster-VOD SOURCE family, not a metadata source.
- **Wikidata + Hebrew Wikipedia** — IMPLEMENTED via documented public APIs (CC0 + CC BY-SA 4.0). Live
  smoke resolved `הפשוטע` S1E7 = `פריקי סבתא`, aired 2026-08-31. That episode legitimately has no
  synopsis or still in the article, so PMTV contributes none rather than borrowing a neighbouring row.
  Title search is never used — the title shares its Hebrew label with an unrelated Wikidata item.
- **OMDb** — IMPLEMENTED; live key validation is PHYSICAL TEST PENDING (owner enters it on device).
- **TheTVDB** — NOT CONFIGURED, no owner credential; blocks nothing and no key is requested.

## CI reliability — two separate environmental defects, both fixed

1. **Robolectric runtime fetch stalled the unit-test step.** Robolectric resolves its
   `android-all-instrumented` jars DURING the test task, not at dependency-resolution time, and this
   suite needs TWO: `8.0.0_r4-robolectric-r1-i7` (94,512,384 bytes — the explicit `@Config(sdk=[26])`
   app-mobile tests) and `16-robolectric-13921718-i7` (213,431,622 bytes — the core-module Robolectric
   tests that declare NO `@Config` and fall back to `compileSdk` 36). ~295 MB fetched inside the test
   JVM with no timeout: run `33857049378` hung for the full 6-hour job limit with zero output after
   `> Task :app-mobile:testDebugUnitTest`. Never reproducible locally (jar already in `~/.m2`); the
   exact CI invocation runs green here in 8m43s, and 4m31s pinned to 2 CPUs on this 4-core device.
   - A cache-only fix was INSUFFICIENT: `actions/cache` saves in a post step gated on job success, so
     an unrelated later failure skipped the save, the next restore reported `Cache not found`, and the
     download repeated — burning the new 45-minute timeout. **A green restore step is not a cache hit.**
   - Final fix: `scripts/prefetch-robolectric-runtime.sh` resolves both artifacts BEFORE the tests,
     bounded by connect/max-time with retries, verified by pinned SHA-512, writing the `.sha512`
     sidecars so Robolectric treats them as its own. CI restores with `actions/cache/restore`, prints
     HIT/MISS with the key, and saves with `actions/cache/save` under `always()`.
     `scripts/test-prefetch-robolectric-runtime.sh` covers 5 cases offline via `file://` fixtures.
     Verified in CI: explicit MISS, both jars fetched and digest-verified, cache saved, tests 7m42s.
2. **GeckoView verifier `play-services-fido…pom found 0`** — the recurring warm-cache prune. GitHub's
   Gradle cache cleanup removes the POM the offline verifier reads. Remedy unchanged and applied:
   delete all `gradle-*` Actions caches (the content-keyed TDLib cache is unaffected) and re-run cold.

Neither implicates code-41 product code: the identical tree passed CI end to end at `d7974b4`,
including GeckoView verification and APK upload.

## Truthful status

**IMPLEMENTED (host/deterministic/CI proven).** Everything in "What code 41 implements", plus
Telegram channel-Live OBSERVATION.

**NOT IMPLEMENTED — exact reasons.** Telegram live STREAM playback on pinned TDLib 1.8.66; the
production exact-fixture crosswalk for LiveBall's numeric ids; a native resolver for the
ok.ru/dailymotion programme embed hosts.

**BLOCKED.** Kan/mako/13tv as metadata sources; SmartTube-derived engine reuse (unchanged,
non-blocking; no owner-facing SmartTube wording remains).

**PHYSICAL TEST PENDING.** All 112 items in `docs/MOBILE_ACCEPTANCE.md`. This environment had NO
connected Android device (`adb devices -l` empty) and NO authenticated Telegram runtime, so no
on-device playback, notification delivery, live observation, alarm firing or UI rendering is claimed.
Deterministic, Robolectric/Compose and host-smoke evidence is never promoted to a physical PASS. In
particular the Beitar notification regression is FIXED IN ARCHITECTURE but its real delivery —
including screen-off/idle firing and the tap route — remains unverified on hardware.

## Owner decisions recorded this milestone

Home ordering correction; playback-derived personalization; two Universal Source owner intents;
hybrid programme recurrence (option 3) with `RECURRENCE_UNCONFIRMED`; non-destructive self-healing for
already-persisted broken profiles; non-exclusive Telegram roles; exact Android alarm route with
WorkManager demoted and special access requestable; LIVE-only family applicability; selected Telegram
channels may provide Live with owner choice among several; an unverified active broadcast is manually
playable without fabricating a binding; unresolved announcements are not primary Match Details actions
and repeated unlabeled `שייך למשחק` buttons are removed.

## Privacy

No Telegram chat/message/group-call identifier, invite link, RTMP URL or stream key; no OMDb key or
any credential; no private media URL or owner identifier appears in this record, the repository, CI
output, or any owner-facing string. Unresolved-announcement rows identify a source by a locally
derived display name or public HTTPS host, falling back to an ordinal.
