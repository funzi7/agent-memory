# Private Media TV — F2C.7.12 code42 physical corrections and native-first LiveBall

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2C.7.12 / mobile code42 — code41 physical-correction reconciliation, passive Series curation, Sports card truth, imminent favourite recommendations, YouTube public/account separation, Website-source grouping, Telegram Sports-role visibility, and configured LiveBall exact discovery/native-first readiness |
| Branch / tracking | `main` / `origin/main` |
| Starting application HEAD | `e37750bb4940c2a71fea47430f6331d7efbd5fbf` — verified clean authoritative code41 baseline and exact-head CI run `33898150018` success |
| Final application HEAD | `c595f65e1a9e2ea8e99a49ebe9c545f46a23f331` — pushed and verified equal to `origin/main` with a clean worktree |
| Application commits | `c8c07377c7838a3b562107c6d1f3084603a8f61c` — `Implement F2C.7.12 code42 physical corrections` (98 files; product, tests, docs, schema and the single code41→42 version advance); `c595f65e1a9e2ea8e99a49ebe9c545f46a23f331` — `Ensure CI resolves audited runtime POMs` (one mobile build file; no product/runtime/version change) |
| Exact-head Android CI | run `33924368537`, attempt 2 — **SUCCESS** for exact final HEAD `c595f65e1a9e2ea8e99a49ebe9c545f46a23f331`; wrapper, full mobile/mobile-used tests, mobile lint, signed ARM64 assembly, package/signer/TDLib/Gecko provenance, metadata and artifact upload all green |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.4.23-phone-test`, versionCode 42 — advanced exactly once from code41 |
| TV identity | `com.funzi7.privatemediatv`, `0.6.11-f2c71`, versionCode 34 — frozen; no TV/Shield edit/task/build/test/lint/version/artifact/publication/device action |
| Authoritative exact-head CI APK | `/storage/emulated/0/Download/PrivateMediaTV/Test/private-media-tv-mobile-0.4.23-phone-test.apk`; 259,050,372 bytes; SHA-256 `a29c221add2d719fedcc0112cf946218191c386d7ce9c5da551c62d01dc3697f`; authoritative exact-head CI publication created; same-version `-local` copy absent; older versioned APKs preserved |
| APK verification | Development signer SHA-256 `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0`; ARM64-only; pinned official TDLib JNI SHA-256 `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f`; exact GeckoView/FIDO/SnakeYAML notices and 13 ARM64 libraries verified; code41→42 package/signer/version/ABI update prerequisites passed |
| Overall result | **PASSED automated/local/CI implementation gates; FAILED runtime/physical release gate.** ADB was unavailable by owner override, required official Sports-highlight and trailer YouTube host smokes returned typed `LOGIN_REQUIRED`, current FootReplays/DasFootball host smokes failed at their recorded stages, and no Android Media3/device behaviour is promoted to PASS |

## Prior-Codex reconciliation

The older Codex state was not trusted or replayed. Current code, code41 handoff and owner evidence were
reconciled as follows:

- **A — present and intact:** provider-neutral native resolution into the one shared Media3 player,
  explicit Website fallback, source variants, independent Sports roles, declared-count/Bidi/TMDB
  stale-first truth, favourite-star presentation and image continuity.
- **B — independently completed or superseded:** the suspected owner-facing Compose-surfaces item was
  completed after code38. Code41 superseded Kan-only enrichment, WorkManager-only alert timing and
  announcement-only Telegram roles; code40's owner decision superseded SmartTube-exclusive YouTube.
- **C — adapted in code42:** passive curation, Sports interaction/presentation/recommendation, source
  projection, Telegram visibility, YouTube presentation, and LiveBall discovery/readiness.
- **D — genuinely missing old work:** none. Remaining gaps are physical/runtime evidence or exact
  external-provider failures, not an abandoned old diff.
- **E — obsolete:** exclusive SmartTube, WorkManager-only alarms, the entire Sports section before
  Continue Watching, and stale historical TODO boxes were not revived.

## Preserved owner physical evidence

**PHYSICAL PASS from code41:** exactly one `מומלץ לך בספורט` row precedes Continue Watching; the full
Sports section remains in its established lower slot; the personalized row has rich spoiler-safe
artwork; the owner completed OMDb credential connection; a Sports notification was delivered on the
real phone. Notification delivery does **not** prove exact ten-minute timing. Preserve all previously
documented code39/code40 physical PASSes, including FootReplays Full Match native playback, one direct
DasFootball highlight, Episode Details automatic source discovery, favourite semantics and the
no-spoiler contract.

**PHYSICAL FAIL from code41:** passive Series contained tutorial/help/payment-account junk;
personalized artwork itself did not navigate, the closed card exposed `פעולות`, artwork/text team
order and pair language could contradict; YouTube account UI incorrectly described all YouTube as
unavailable and retained stale component-license prose; Website Sports sources appeared as repeated
indistinguishable provider cards; Sports Telegram roles were not readily visible. An imminent
favourite fixture roughly forty minutes before PMTV's displayed kickoff was absent; configured
LiveBall did not discover its exact resource; a manually supplied exact pre-kickoff resource bound
but appeared Website-first.

## What code42 implements

- **Passive Series curation.** Typed media/catalog/provider/content-class and retained TMDB genre and
  completeness facts feed only passive projection. Structural tutorial/help/support/payment-account,
  SEO/spam and malformed generic-Web-video combinations are rejected without a one-title blacklist.
  Raw evidence remains, weak legitimate items rank down, and explicit Search/direct/personal content
  stays broad.
- **Sports card interaction and truth.** Artwork is inside the exact Match Details click target. The
  nested accessible icon-only overflow consumes its own tap and contains no owner-facing `פעולות` on
  the closed card. Canonical order drives both labels and the spoiler-safe two-crest composition;
  unknown-orientation posters cannot contradict it. Hebrew is used only as a reliable two-team pair,
  otherwise both labels use a consistent provider/canonical language. The safe artwork pipeline is
  shared by ordinary Sports cards and Details, with stable image keys and no score/result imagery.
- **Imminent recommendation.** A general bounded UPCOMING window and time-to-kickoff signal admit an
  imminent explicit-favourite fixture even when no media exists. The card states UPCOMING/starts-soon
  truth and opens Details; it fabricates no playback. Favourite LIVE priority, learned affinity,
  exact `לא מעוניין`, role-aware consumption, the single horizontal row and lower full Sports section
  remain intact.
- **YouTube truth.** Public `NativeYouTubeEngine` readiness is independent from optional account and
  personal-feed authorization. Active UI names unavailable account connection specifically, removes
  SmartTube/MediaServiceCore/SharedModules owner-facing blocker prose, and never reports DRM without
  actual licence evidence. Public videos, trailers and official highlights retain the one PMTV
  Media3 route; no app handoff, youtube.com WebView/iframe or fake success was introduced.
- **Website source reconciliation.** One canonical private URL identity is used across save, lookup,
  indexing and recovery. One provider/profile renders as one master with truthful child/resource/
  binding details; exact resources stay distinct. Catalog schema 15 records supersession so true
  code41-style duplicates reconcile idempotently and non-destructively while approvals, roles,
  bindings, priority, useful health and provenance survive. Re-save routes to the existing source.
- **Telegram Sports visibility.** Catalog Telegram management remains catalog-only in meaning. Sports
  Settings separately exposes announcements, media, and selected Sports-media Live-observation
  eligibility; selected rows lead and counts equal actual selection. One chat can keep independent
  roles without cross-removal. Pinned TDLib 1.8.66 supports observation only, not Telegram Live stream
  transport.
- **LiveBall exact discovery and native-first lifecycle.** An enabled configured profile performs
  bounded public date-index discovery for UPCOMING/LIVE fixtures and binds an exact child only when
  both teams, compatible kickoff, competition when present and non-contradiction strongly agree.
  Wrong/ambiguous candidates bind none; no guessed IDs or fuzzy crosswalk exists. Repeated discovery
  is idempotent and the provider remains one top-level profile. Exact-source existence is independent
  from media readiness: pre-kickoff no-media is typed `MEDIA_RESOLVE_NOT_YET_AVAILABLE`, nonfatal and
  non-DRM, and cannot poison the LIVE retry. Foreground owner intent and UPCOMING→LIVE transition retry
  bounded discovery/resolution while preserving MatchIdentity and excluding FootReplays,
  DasFootball and official post-match YouTube Highlights during LIVE.

**Owner decision recorded:** Website playback/opening is a fallback after native resolution, never
the default path for a source with a supported native resolver. LiveBall follows configured provider
→ exact child discovery → native resolution → shared PMTV Media3 when usable; PMTV never auto-opens
the Website.

## Real host and runtime truth

- **LiveBall compatible fixture:** a current real fixture with agreeing canonical/provider teams,
  kickoff and competition completed production exact-child discovery and returned HLS through the
  production resolver. This is `HOST_ONLY_NOT_MEDIA3_NOT_PHYSICAL`; it proves neither Media3
  acceptance nor playback/frames/audio/fullscreen.
- **Owner-observed LiveBall fixture:** the current public listing showed the same teams/competition
  with a kickoff about four hours contradictory to the owner-observed canonical fixture. The strict
  ±90-minute matcher correctly rejected it. The owner fixture is not claimed auto-bound or playable.
- **YouTube:** one ordinary public video resolved 27 formats and accepted an HTTP 206 range request.
  The tested official Sports highlight and catalog trailer both ended at typed `LOGIN_REQUIRED`, no
  DRM evidence and no media. These required host paths are **FAILED**; Android playback remains
  pending.
- **FootReplays:** the current host exposed a real `FIRST_HALF` candidate but resolution ended at
  `MEDIA_RESOLVE_DYNAMIC_PLAYER_UNSUPPORTED` — **FAILED**. This does not erase the historical physical
  Full Match PASS.
- **DasFootball:** the current host returned nominal provider success with zero pages and failed the
  smoke's one-page expectation — **FAILED**. This does not erase the historical direct-highlight PASS.
- **Israeli metadata:** the existing exact Wikidata→Hebrew Wikipedia code41 path remains intact for
  `הפשוטע` S1E7, yielding the authoritative Hebrew title `פריקי סבתא` and air date 2026-08-31. The
  source supplies no real synopsis/still, so absence remains truthful rather than fabricated.

## Validation and delivery

- Focused code42 tests and the complete mobile/mobile-used unit/integration/Compose matrix passed.
- Mobile-used Android lint and `:app-mobile:assembleDebug` passed through the global heavy queue.
- Credential/private-material scan, delivery/downloader selection, code41→42 upgrade, provisioning,
  pinned TDLib, Gecko/runtime provenance, Robolectric prefetch, package/version/signer/ARM64/native
  layout and shell/Node verifier harnesses passed. No root aggregate or `app-tv` task ran.
- Current real provider smokes were run and reported separately above; resolver success was never
  promoted to physical playback.
- Initial product HEAD `c8c0737` exact CI run `33919594723` passed tests/lint/assembly but twice
  failed because Gradle could resolve the audited Google AAR/module metadata without materializing
  the POM required by the offline provenance verifier. Final commit `c595f65` explicitly resolves the
  four already pinned, non-transitive POMs; fresh-cache local verification authenticated all four
  and left the packaged payload unchanged.
- Final exact-head run `33924368537` attempt 1 suffered a transient hosted
  `:app-mobile:testDebugUnitTest` process stall after every core task passed and timed out at 45
  minutes. Same-head attempt 2 passed that identical matrix in 7m43s and all later gates, including
  the repaired provenance check and artifact upload. No no-op commit or weakened check was used.
- The authoritative exact-head APK was downloaded, independently reverified, and published at the
  versioned Test path above. No same-version local copy existed to remove; older unrelated/versioned
  APKs remain.

## Physical, blocked and not-implemented truth

**ADB unavailable / PHYSICAL TEST PENDING.** Multiple wireless attempts did not establish an
authorized usable transport; no package or app data was changed, and the owner explicitly stopped
retrying ADB for this round. Code42 could therefore not be installed or exercised by Codex. Upgrade
state survival, launch/Back, exact card taps/layout/order/language/art continuity, real private
source-row migration, Telegram selections/search/live observation, public YouTube/trailer/highlight
Media3 playback, LiveBall pending→LIVE resolution/Media3 playback, exact alarm identity/timing and
notification deduplication remain owner physical acceptance items. The authoritative APK—not the
local build—must be used for that acceptance. Naturally unavailable Telegram Live is never a PASS.

**BLOCKED:** representative bad-card and duplicate-source app-private provenance diagnosis requires
a usable authorized ADB/read-only runtime; exact ten-minute notification timing lacks physical timing
evidence; current official-highlight/trailer YouTube host access is typed `LOGIN_REQUIRED`.

**NOT IMPLEMENTED — exact reasons:** Telegram Live stream playback remains unavailable because pinned
TDLib 1.8.66 exposes observation but requires an unshipped joined-call/tgcalls transport for stream
segments; no bypass was added. No new third-party provider/API/account, paid broadcaster integration,
guessed LiveBall crosswalk, DRM/auth/paywall/entitlement/region bypass, or unlicensed artwork was
introduced.

## Privacy

No ADB endpoint, pairing code, device serial, Telegram identity, private source URL, OMDb credential,
session/auth material, screenshot or private media appears in this record or the application
repository. Runtime diagnostics and provider evidence remain privacy-safe.
