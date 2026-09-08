# Private Media TV — code44 final Mobile Test handoff

## Final identity, CI, artifact and device truth

| Field | Final observed value |
| --- | --- |
| Application repository / branch | `funzi7/private-media-tv`, `main` tracking `origin/main` |
| Authoritative starting baseline | Application `24dec03f9edf4eb0c968928afd0504d067ac4b3b`; agent-memory `fa0ca50c5636f420b3becf851cfd82a0c336d548`; code43 CI `33962556211` attempt 2 SUCCESS and its installed APK were verified starting facts, not physical acceptance of code43 behavior |
| Final application HEAD | `5a138337a3473248e23649befef7ede2cfa6a3e9` — normally pushed and verified equal to `origin/main`; clean worktree and `git diff --check` PASS |
| Application commits | `351f457401f5e612c66946211d133fb6216cd9fe` — substantive code44 product/tests/docs and the single version advance; `5b897795e08f0abdb9c2f5f5c8bd25eb8f7c6261` — mandatory core/app CI worker isolation and lifecycle logging; `5a138337a3473248e23649befef7ede2cfa6a3e9` — bounded hosted Robolectric worker recycling, with no product/version/TV change |
| Agent-memory pre-finalization state | Clean `main == origin/main == 70b7d396745bad90e77b432f79fea14a73fd059f`; unrelated intervening memory updates were preserved. This release entry is finalized only through `agent-memory-finalize`; its resulting SHA is read after that tool completes, never predicted here |
| Exact-head Android CI | Run `34249812147`, attempt 1, **SUCCESS** on exact `5a138337a3473248e23649befef7ede2cfa6a3e9`; job `102141137895`, 18m47s. Wrapper, deterministic Robolectric prefetch, all mobile-used core tests, all app-mobile tests, scoped mobile lint, signed ARM64 assembly, package/version/signer, pinned TDLib, Gecko/runtime provenance, build metadata and artifact upload passed |
| Single mobile version advance | `com.funzi7.privatemediatv.mobile`, `0.4.25-phone-test`, versionCode 44; exactly one advance from code43 and no code45/micro-release for CI corrections |
| TV / Shield | Frozen `com.funzi7.privatemediatv`, `0.6.11-f2c71` / 34. No app-tv edit, task, build, test, lint, version, artifact, publication, installation or TV-validation claim occurred |
| Authoritative CI artifact | Artifact ID `10066236319`, `private-media-tv-mobile-apk-5a138337a3473248e23649befef7ede2cfa6a3e9`; not expired; exact workflow SHA. Artifact archive 259,477,432 bytes, SHA-256 `1f3b3f07c232a6ddd7d05fe9596831e371e24c6f41ee44e383b74b10212cbbac` |
| Published authoritative APK | `/storage/emulated/0/Download/PrivateMediaTV/Test/private-media-tv-mobile-0.4.25-phone-test.apk`; created without rotating/deleting older versioned APKs; 259,476,356 bytes; SHA-256 `215382b91b6be5d883ca785b70285b7826b45ae7b3f16d7fc5b8ca821ce6dcd0`; byte identity bound to the exact CI artifact/metadata |
| Signer / native payload | Development signer SHA-256 `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0`; ARM64-only; exactly one `lib/arm64-v8a/libtdjni.so` |
| TDLib / Gecko provenance | Official pinned TDLib 1.8.66 commit `022d60202e446ad1287b9fb68e687c8a0760788b`; authoritative CI JNI SHA-256 `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f`. Exact GeckoView `org.mozilla.geckoview:geckoview-arm64-v8a:154.0.20260824154132`, AAR SHA-256 `c3d8a99295329a405fcba50daae77bb0af8fee06d9b28145c1d1a658d14ce295`; all 13 ARM64 Gecko libraries and FIDO/SnakeYAML/license notices verified independently after download |
| Code43 -> code44 upgrade | Exact old/new package, versionCode, signer, ARM64 and TDLib layout compatibility PASS. The one authorized Samsung phone was selected only after model/phone-class guards; `adb install -r` succeeded over retained code43 state; code44 package/version were observed; `MainActivity` returned `Status: ok`, and the process remained alive |
| Bounded phone smoke limitation | The phone entered Doze with the keyguard showing after launch, so PMTV was not the resumed/focused activity at the later check. No new crash/ANR was observed. No unlock bypass, uninstall, Clear Data, destructive DB/preferences operation or private-state read was attempted. On-screen code44 behavior remains PHYSICAL TEST PENDING |
| Overall conclusion | **PASSED implementation/local/CI/artifact/publication and bounded in-place install/launch gates; FAILED full runtime/physical acceptance.** Required public YouTube host resolution still fails, authenticated account/history and private Telegram runtime were not validated, and changed UI/Media3 behavior awaits owner physical acceptance |

This post-push ledger closes the intentionally immutable pre-push checkboxes in the committed code44
TODO/state/handoff/release documents. Those documents record the implementation checkpoint and direct
final SHA/CI/artifact/runtime facts here so the application commit never invents its own SHA. Both the
substantive commit and two evidence-driven CI corrections are part of the same code44 release and use
the same version. No approved requirement remains only in chat.

## Preserved owner physical evidence

Code43 automation did not override real-device evidence. The following owner observations remain the
authoritative comparison baseline until the delivered code44 APK is exercised:

- **PHYSICAL PASS:** the restored rich Match Details poster looked excellent.
- **PHYSICAL PASS:** for the real Kan title `לא לריב`, Catalog Telegram source discovery succeeded and
  playback opened inside PMTV. Catalog Telegram is therefore **PARTIALLY WORKING**, not globally
  failed; other known real titles/episodes still returned zero sources.
- **PHYSICAL PASS:** `לא לריב` E1 displayed Up Next; accepting it transitioned through the existing
  PMTV player and E2 actually began playback. That working transition was preserved.
- **PHYSICAL FAIL:** once E2 was active, Back returned to stale E1/original Details context.
- **PHYSICAL FAIL:** Continue Watching opened around the middle, contained watched/list-only/wrong
  members, failed to prioritize the genuinely current incomplete episode, and could reshuffle.
- **PHYSICAL FAIL:** pull-to-refresh visibly emptied/repopulated Continue Watching and could omit the
  freshly watched rightmost incomplete item. Cards were inconsistently sized and could crop important
  artwork/details.
- **PHYSICAL FAIL:** a real LIVE fixture did not automatically discover its configured LiveBall exact
  child, although manually entering the exact page created a source and `נגן` action.
- **PHYSICAL FAIL:** that manually known LiveBall page ended at `MEDIA_RESOLVE_FAILED`, provider
  LiveBall, host family `liveball.sx`, stage COMPLETE. This is not a successful native source.
- **PHYSICAL FAIL:** a finished fixture with real YouTube and Telegram material showed no viewing
  sources; `חפש מקורות עכשיו` performed/reported TheSportsDB fixture refresh instead of source search.
- **PHYSICAL FAIL:** only two Champions League fixtures appeared across repeated refreshes despite
  relevant current-season qualifying and imminent Matchday fixtures.
- **PHYSICAL FAIL:** some Israeli-league rich row artwork/crests clipped at the edges.
- **PHYSICAL FAIL:** the YouTube account surface remained unavailable; Kan 11 continuation failed with
  the safe equivalent of `PMTV YouTube not found`.
- Previously accepted contracts remain binding: exactly one personalized Sports row before Continue
  Watching; full Sports section in its established lower slot; direct Seen/Not Interested; no closed-
  card `פעולות`; whole-card Details navigation; no spoilers; role-aware watched state; deterministic
  recency; favorite LIVE/imminent UPCOMING; FINISHED no stale LIVE; TimeSoccerTV Programs; Foot/Das
  management; one LiveBall master; independent Telegram roles; shared PMTV Media3 player.

No code44 test or host probe is promoted into a fresh owner PHYSICAL PASS for those behaviors.

## Implemented code44 corrections

- **Continue Watching eligibility and order — IMPLEMENTED.** Normal cards now require meaningful,
  incomplete canonical playback. My List membership, watched-only state, completed media, zero/sub-
  threshold progress and stale list snapshots cannot create or lead the row. Recent meaningful
  incomplete playback wins through explicit persisted timestamps and stable canonical tie-breakers;
  asynchronous observer arrival is never a rank signal. Episodic identity remains series + season +
  episode, so a completed prior episode cannot replace the actual incomplete episode.
- **Continue Watching refresh truth — IMPLEMENTED.** Pull-to-refresh keeps last-known-good playback
  projection while provider metadata refreshes. Newer local progress wins over stale metadata/watched
  snapshots; partial provider failure does not clear valid cards; refreshed metadata enriches rather
  than replaces local playback. Canonical reconciliation commits one deterministic result instead of
  empty-then-append ordering. Genuine completion may remove the resume only after the authoritative
  eligibility decision is known.
- **Continue Watching viewport and geometry — IMPLEMENTED.** First RTL presentation anchors stable
  item zero at the right edge after real items arrive. Recomposition/no-op refresh does not recenter;
  user-scrolled position is retained across accepted Back navigation. Every card receives the same
  useful container/art/title/progress geometry. Portrait, landscape, unusual and edge-bearing imagery
  uses proportional contain/inset treatment without stretching or destructive center crop; the clean
  missing-art fallback retains identical geometry.
- **Up Next active navigation context — IMPLEMENTED.** The original successful next-episode prompt,
  source resolution and Media3 replacement remain. Only a successfully active replacement atomically
  commits the player session's canonical series/season/episode and return destination. E1 -> E2 -> E3
  exits to E3 Details; unaccepted suggestions and failed/pre-active transitions keep the prior episode.
  Progress and sources remain independent per episode, and saved/recomposition state cannot restore
  the original launch identity over the active item.
- **Dynamic Sports cards — IMPLEMENTED.** UPCOMING cards format real kickoff-relative days/hours/
  minutes in device locale/timezone and update across boundaries without changing stored canonical
  time. LIVE minutes render only from fresh trustworthy provider clock evidence, including truthful
  stoppage notation; otherwise the fallback is `שידור חי עכשיו`, never wall-clock-minus-kickoff.
  One/multiple usable discovered bindings expose actual deduplicated provider display names directly
  on the card. A configured provider alone is not availability; stale/invalid bindings and FINISHED
  stale LIVE badges disappear.
- **Visible Sports refresh — IMPLEMENTED.** Lifecycle-owned, foreground/resume-aware polling is
  bounded to visible canonical identities and separate fixture/source cadences. It preserves last-
  known-good fixture data on failure, updates status and source availability independently, fairly
  reaches the remaining cards, preserves MatchIdentity and supports UPCOMING -> LIVE -> FINISHED plus
  later legitimate post-match media without busy polling or fake real-time claims.
- **Sports details/artwork — IMPLEMENTED.** Approved rich poster remains primary; minimal contained
  bounds preserve narrow/wide edge crests instead of substituting the two-crest fallback. One
  consistent `<Team A> נגד <Team B>` line sits below it. Authoritative lineups/formations may render
  immediately; score/result/winner/events/revealing statistics and accessibility text remain absent
  until explicit reveal and disappear again on hide.
- **Competition feed — IMPLEMENTED.** Current competition identity resolves adjacent provider
  season/round/stage pages and date horizon before dedupe/projection. Qualifying stages and relevant
  Matchday fixtures no longer collapse to an artificial two-item result. Real TheSportsDB smoke
  recorded current returned stage/round/count truth; no static UCL list or new arbitrary row cap was
  introduced.
- **LiveBall exact discovery — IMPLEMENTED.** The production path now consumes current public index/
  date markup, timezone-aware kickoff, canonical team aliases, competition evidence and exact child
  identity. Binding rejects contradiction/ambiguity, does not guess numeric IDs, creates one durable
  child under one family master and remains idempotent across repeat/migration/reprojection.
- **LiveBall native resolution — IMPLEMENTED.** Current HTML/player bootstrap and completion-clock
  state lead through bounded public redirects/tokens to native HLS when available; pre-live stays
  typed pending and specific extraction/host failures remain typed rather than generic success.
  Native resolver -> shared PMTV Media3 remains primary. Website is explicit secondary fallback only
  and never silently replaces native playback.
- **Actual Sports source search — IMPLEMENTED.** `חפש מקורות עכשיו` now invokes bounded source
  discovery, not fixture refresh. Applicable independent families run concurrently/failure-isolated;
  selected SPORTS_MEDIA Telegram and eligible exact official/public YouTube can coexist as normal
  FINISHED siblings. Completed-found, completed-zero and partial provider failure have truthful
  feedback; one failed provider cannot suppress valid siblings.
- **Telegram Sports roles/status — IMPLEMENTED.** Announcement removal toggles only
  SPORTS_ANNOUNCEMENT and preserves Catalog/SPORTS_MEDIA. Counts equal selected rows and persist.
  Selected/active is distinct from actual operation; each row projects last relevant processed
  timestamp and linked canonical MatchIdentity when observed, otherwise an explicit never-observed
  state. Observation -> classification -> exact linkage -> durable state is covered without raw IDs,
  URLs or bodies. Catalog matching remains local-index-first, selected CHANNEL/GROUP only, exact S/E
  contradiction-safe and bounded-history rescue; the working `לא לריב` playback route was not
  replaced.
- **YouTube indexing — IMPLEMENTED.** Generic PMTV YouTube service registration is separate from Kan
  11 channel identity. Continuation resolves the registered provider, advances/persists the real
  checkpoint and resumes after restart; deterministic regression reproduces the former missing-
  provider failure.
- **YouTube account/feed/history bridge — IMPLEMENTED at code/runtime boundaries.** Existing native
  account navigation now runs the audited TV device-consent flow, stores session material encrypted
  app-private, disconnects only its own session/cache and never logs or copies raw tokens. Supported
  subscriptions, playlists, liked, recommendations and account-history surfaces feed PMTV. Public
  playback remains account-independent; legitimate connected auth may retry LOGIN_REQUIRED, and all
  resolved media still enters the one PMTV Media3 path. Canonical playback observations retain local
  progress first and flush meaningful upstream history/position at lifecycle boundaries; upstream
  failure never erases local truth, and weaker/older remote progress cannot overwrite stronger local
  state. No manual Subscribe/Like/Add-to-playlist write or offline/export feature was added.
- **Catalog/code43 regression preservation — IMPLEMENTED and rerun.** Passive Series sanitation,
  canonical dedupe, title/year/synopsis/art truth, personal-list metadata/centered dates, silent normal
  refresh, season truth, one-vote TMDB presentation, exact-IMDb OMDb projection, exact Catalog
  Telegram scope, role-aware Sports watched persistence/projection, rich poster, Home placement,
  TimeSoccerTV, Foot/Das visibility, one LiveBall master and independent roles remain covered.

## SmartTube upstream/license and service-policy audit

**SUPERSEDED — owner approved:** the former blanket rule that SmartTube reuse was forbidden. Code44
may reuse a component only under its actual grant and required notice; private use does not create a
license for a dependency without one. PMTV remains the sole UI/navigation/local-state/shared-Media3
player owner, and the account/history/progress bridge is an explicit owner requirement.

- Audited/pinned `yuliskov/SmartTube` commit
  `25b7def51eacf04f6d179e74ac4d57cb8ad92415`; top-level license MIT. Required copyright/license notice
  and full text are retained and exposed in Settings/About.
- Audited gitlink `MediaServiceCore` at `28c3c81989db86865fc66e2a5752d3a76528c98c` and
  `SharedModules` at `86f032738e3a24f6ee85c7a4ccd9524b0d20b7aa`. No usable explicit reuse grant was established for
  the selected protocol implementation, so PMTV neither copied nor linked their unlicensed code; it
  independently implements the bounded behavior/API contract.
- The owner explicitly approved the audited SmartTube TV account authorization flow with the risk
  documented. Its upstream TV OAuth client identity is not registered to PMTV; Google service policy
  generally expects an application to use its own registered client, while the selected account/
  InnerTube surfaces are undocumented and may change, rate-limit, revoke or cease working. This is a
  known compatibility/service-policy risk, not Google authorization, guaranteed access or authority
  to bypass consent, DRM, paywall, entitlement, region or account controls.
- PMTV does not embed/launch SmartTube UI or player, use youtube.com Gecko/WebView/iframe playback,
  require Play Services or an owner Data API key, forge credentials, or hand normal playback to an
  external app. Account secrets remain encrypted/app-private and absent from logs, Git and memory.

## Actual validation and CI correction history

- **LOCAL PASS:** final focused suites: 202 app-mobile and 84 core-youtube tests. Complete 15-module
  mobile/mobile-used matrix: 3,142 tests, zero failures/errors, 13 intentional opt-in skips across 362
  suites. All 12 mobile-used lint targets plus signed mobile assembly passed; the final combined run
  completed 643 Gradle tasks. Additive migrations, scanner (41), downloader (20 rejection + one
  success), delivery (14), inspector (4), upgrade (8), deterministic Robolectric prefetch (5), Gecko
  mutation harnesses, Node provisioning/crypto/interop, pinned TDLib and package/native gates passed.
- **Final CI-fix local PASS:** forced `CI=true --rerun-tasks :app-mobile:testDebugUnitTest` exercised
  worker recycling and ran 1,198 tests across 139 classes: zero failures/errors, 10 expected skips.
  `MobileStartupCompositionSmokeTest` emitted STARTED then PASSED in 7.705s; full forced invocation
  succeeded in 7m01s.
- **CI failure 1:** run `33985794687` on substantive SHA `351f457401f5e612c66946211d133fb6216cd9fe`,
  attempts 1 and 2, timed out only in the original combined 45-minute unit-test step. Core tasks had
  completed and app-mobile had begun, but the combined gate exposed no last-started test. No test
  assertion failure was reported.
- **CI failure 2:** exact SHA `5b897795e08f0abdb9c2f5f5c8bd25eb8f7c6261`, run `34244042929`,
  passed the new isolated core gate, then the app step timed out after 1,197 earlier tests passed and
  the real startup Compose smoke emitted STARTED without PASSED. The same class alone and the complete
  `CI=true` suite passed locally, and its HOME path did not compose the new Sports/CW polling loops.
- **Evidence-driven correction:** app-mobile CI retains one sequential fork but recycles its hosted
  Robolectric worker after at most 32 test classes, bounding cumulative Android/SQLite process state.
  Every class remains mandatory exactly once; no timeout was enlarged, test removed, assertion
  weakened, product path changed or version bumped. Run `34249812147` then passed the exact final SHA
  and every downstream lint/build/provenance/upload gate.
- **Artifact verification PASS:** canonical downloader required exact SHA/run and verified three-file
  artifact metadata/checksum before publication. Independent package/version/signer/ABI/TDLib and
  Gecko/FIDO/SnakeYAML/license checks passed. Exact code43 -> code44 upgrade verifier passed. The local
  preliminary APK had the same size but SHA-256
  `67ea485ce7d7264c4170c09a4644c63638ca5afc70fc07aac933191474a963b5`; it was never substituted for
  the authoritative CI APK.

## Runtime, physical, blocked and remaining truth

- **RUNTIME VALIDATED — HOST ONLY:** current LiveBall exact public page -> player/bootstrap -> HLS
  master -> child playlist -> first media bytes succeeded through the production resolver. This is
  not Android Media3 video/audio/fullscreen/Back PASS.
- **RUNTIME VALIDATED — HOST ONLY:** real TheSportsDB competition/season/round/facts aggregation and
  sanitized projection succeeded; provider failures remain isolated. Broader public-store use still
  requires a terms/subscription review beyond this private sideload round.
- **RUNTIME VALIDATED — HOST ONLY:** YouTube TV device challenge, pending/cancel behavior and real Kan
  persisted indexing continuation passed at 2026-09-05 16:43 UTC. A pending/cancelled device flow is
  not authenticated account/feed/history proof.
- **FAILED — CURRENT PUBLIC YOUTUBE HOST:** at 2026-09-05 16:50 UTC an ordinary public video, sampled
  official Sports highlight and catalog trailer all ended `LOGIN_REQUIRED`/bot-confirmation with no
  usable media descriptor. No DRM evidence existed. Public playback is therefore not runtime PASS,
  and account/Web/other-app fallbacks were not used to fake success.
- **PHYSICAL PASS — OWNER, RETAINED:** rich poster; real `לא לריב` Telegram discovery + PMTV playback;
  real E1 -> accepted Up Next -> E2 playback. These prove only those specific code43 production paths.
- **PHYSICAL PASS — BOUNDED CODE44 DEVICE GATE:** authoritative code44 installed in place over code43
  with `adb install -r`; on-device package/version advanced 43 -> 44, launcher returned success and
  the process lived. This does not prove private state contents or any owner-facing screen because the
  phone immediately returned to Doze/keyguard.
- **PHYSICAL TEST PENDING:** code44 Continue Watching eligibility/rightmost anchor/refresh retention/
  geometry/art containment/manual scroll; active-episode Back; dynamic Sports countdown/clock/source
  labels/refresh; artwork, team line, lineups and spoiler reveal/hide; competition breadth; actual
  source-search results; announcement role/status; Catalog Telegram failing-case recall; OMDb read;
  state/role/progress survival; all real shared-Media3 video/audio/seek/fullscreen/Back paths.
- **PHYSICAL TEST PENDING / BLOCKED ON OWNER INTERACTION:** real YouTube TV account consent,
  subscriptions/playlists/liked/recommended/history feeds, authenticated LOGIN_REQUIRED retry,
  upstream canonical watch-position update and disconnect privacy. Only a real authenticated update
  observed in the account/compatible client can pass the history bridge.
- **PHYSICAL TEST PENDING / BLOCKED ON PRIVATE RUNTIME:** selected Telegram SPORTS_MEDIA source search,
  announcement observation/classification/link timestamps and remaining Catalog Telegram comparison
  cases. Selection/tests do not prove a real incoming message or private media result.
- **FAILED evidence retained until retest:** every code43 owner failure listed above. Code44
  implementation status does not silently erase them.
- **NOT IMPLEMENTED:** a new external live-score API/provider (none was needed or owner-approved),
  manual YouTube Subscribe/Like/playlist mutations, YouTube offline/export, Telegram joined-call/
  tgcalls live-stream transport, new unapproved paid/provider account products, DRM/paywall/
  entitlement/auth bypass and all TV/Shield work.
- **SUPERSEDED — owner approved:** blanket SmartTube prohibition, as audited above. Also superseded by
  the owner's explicit Continue Watching correction: unplayed “next episode”/list targets no longer
  qualify merely because they are next; working Up Next and series progression remain independent.

Project documentation was reconciled before the immutable pre-push checkpoint: TODO, PROJECT_STATE,
HANDOFF, MOBILE_ACCEPTANCE, TEST_PLAN, RELEASE_REVIEW, UX_DECISIONS, PRODUCT_SPEC, CHANGELOG, README,
ARCHITECTURE/DATA_MODEL/schema, YouTube upstream/licenses, provider, Sports, Telegram and ADR ledgers.
The old SmartTube blocker is explicitly `SUPERSEDED — owner approved`; code43 automated success and
all new owner evidence remain preserved. This entry records the necessarily post-push CI, artifact and
device truth and closes those checkpoint items without deleting historical evidence.

Privacy: no device serial, account/token/cookie, Telegram chat/message/file identity, private URL,
credential, message body, screenshot or private media filename is recorded. No credential/private
state was read. Device and provider diagnostics are limited to safe package/version/status/type facts.

---

# Private Media TV — F2C.7.13 / code43 final Mobile Test handoff

## Final identity, CI and artifact truth

| Field | Final observed value |
| --- | --- |
| Application repository / branch | `funzi7/private-media-tv`, `main` tracking `origin/main` |
| Verified starting application HEAD | `c595f65e1a9e2ea8e99a49ebe9c545f46a23f331` — clean code42 baseline; its CI `33924368537` attempt 2 and authoritative publication really succeeded |
| Final application HEAD | `24dec03f9edf4eb0c968928afd0504d067ac4b3b` — normally pushed; task-only commit `Implement code43 physical corrections and durable catalog Sports truth`; 115 files, both addenda combined; clean application worktree |
| Starting agent-memory HEAD | `9bdc94f3e95bbb46af3de8ddc1d97d71c329f10e` — current rules and handoff reloaded; no stale Codex diff replayed |
| Exact-head Android CI | `33962556211`, attempt 2, **SUCCESS** on `24dec03f9edf4eb0c968928afd0504d067ac4b3b`; wrapper, deterministic Robolectric prefetch, full mobile-used tests, mobile lint, signed ARM64 assembly, package/signer/TDLib/Gecko/runtime provenance, artifact metadata and upload passed |
| Single mobile version advance | `com.funzi7.privatemediatv.mobile`, `0.4.24-phone-test`, versionCode 43; no code44 or separate addendum release |
| TV/Shield | Frozen `com.funzi7.privatemediatv`, `0.6.11-f2c71` / 34; no app-tv edit/build/test/lint/version/publication/installation or TV validation claim |
| Authoritative CI artifact | `private-media-tv-mobile-apk-24dec03f9edf4eb0c968928afd0504d067ac4b3b`, artifact ID `9969293408`, exact run/SHA/checksum/build metadata verified |
| Published APK | `/storage/emulated/0/Download/PrivateMediaTV/Test/private-media-tv-mobile-0.4.24-phone-test.apk` — authoritative exact-head CI, 259,132,292 bytes; SHA-256 `5509281e108d7147817fab6b15915e0a8370908776fc663a678543ee01608df2` |
| Signer | Development SHA-256 `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| Native/provenance | ARM64-only; official pinned TDLib 1.8.66 at `022d60202e446ad1287b9fb68e687c8a0760788b`; CI JNI SHA-256 `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f`; exact GeckoView `154.0.20260824154132`, all 13 engine libraries and audited FIDO/SnakeYAML notices verified independently after download |
| Upgrade/delivery | Real authoritative code42-to-code43 package/version/signer/ARM64 update prerequisites passed; downloader removed only the verified same-version temporary `-local` copy after authoritative verification; older APKs preserved; local build output still exists |
| Device truth | No authorized ADB device at preflight or final redacted check; no pairing retry, install, uninstall, Clear Data, root, private DB/credential read or physical code43 PASS claimed |
| Overall conclusion | **FAILED runtime/physical acceptance gate; PASSED automated/local/CI/artifact gates.** Mobile Test APK delivered for owner acceptance, not an accepted playback release or device deployment |

This is the final post-push release ledger closing the pre-push publication checkboxes in the
committed code43 TODO/state/handoff/release documents. It records actual results instead of inventing
a self-referential SHA in the commit which defines that SHA. Application commit/push, exact-head CI,
artifact verification/publication and project-document reconciliation are complete. Agent-memory is
finalized only through `agent-memory-finalize`; its resulting commit SHA is obtained from that tool,
not predicted here.

## Preserved owner physical evidence and code42 failures

**PHYSICAL PASS retained:** exactly ONE `מומלץ לך בספורט` row before Continue Watching; the full
Sports section in its established lower slot; the code41 rich spoiler-safe matchup poster; OMDb
connection/provisioning; real Sports notification delivery, but not proven exact ten-minute timing;
historical FootReplays Full Match native playback and direct/non-YouTube DasFootball playback;
automatic exact Episode Details source discovery; no spoilers, explicit favorites and source
eligibility. A refactor, host response or deterministic test does not replace these facts.

**Code42 poster regression:** replacing the owner-approved rich code41 poster with a default
two-crest composition was NOT owner approved. It is a regression, never an owner-approved
supersession. Code43 restores the real approved artwork and adds only the owner's explicit whole-card
click, direct Seen/Not Interested icon and nonduplicated identity-strip improvements.

**Other code42 PHYSICAL FAIL observations retained:** global partial-refresh Home warning; old
comparable finished match leading a newer one; FINISHED with stale LiveBall/LIVE viewing; indistinct
DasFootball Play actions; TimeSoccerTV missing from Sports Programs despite a saved source and carrying
unsupported LIVE; FootReplays absent from expected unified management; repeated LiveBall masters;
passive New Series support/withdrawal/tutorial junk and duplicate canonical cards; sentinel/error/
placeholder artwork and malformed numeric/boolean synopsis; contradictory title/year; repeated normal
Series source-check success; suspect `הפשוטע` season/count tabs; diminished personal-list metadata and
date alignment; Continue Watching reshuffling; real highlight playback without watched indication;
completed Catalog-Telegram episode searches returning zero; misleading precise one-vote TMDB score.
The owner's VPN/TMDB observation remains a hypothesis, not a proved VPN cause.

## Implemented root causes and corrections

- **Sports art/actions.** Code42 retained rich art but rejected it for imperfect orientation evidence.
  Restored the code41 rich-art pipeline across personalized/ordinary/browser/Details surfaces, with
  no-art fallback only. Whole passive card/poster navigates to exact Match Details; direct visible
  `ראיתי`/`לא מעוניין` controls consume their own taps; no closed-card `פעולות`; verified matchup art
  omits the duplicate team strip, while decorative art keeps needed identity. Two-team language is
  consistent, and no-spoiler/image-continuity guards remain.
- **Home/ranking.** Removed the global partial-refresh banner, preserving independent stale-while-
  revalidate rows. Existing non-live ranker now has strong deterministic finished recency and stable
  tie-breaks: comparable 2026-09-05 replay precedes 2026-08-22. Favorite LIVE and imminent favorite
  UPCOMING eligibility remain; no media availability is fabricated. Consumed LIVE is demoted only
  inside its existing priority tier.
- **Fixture/source state.** A fresh fixture snapshot now wins over older retained announcement state;
  retaining a source cannot resurrect LIVE after FINISHED. FINISHED hides stale LIVE without
  relabelling a URL replay. LIVE still excludes FootReplays/DasFootball/official post-match YouTube;
  FINISHED restores legitimate post-match families. Das duplicate exact resources collapse and true
  variants use evidence-backed or neutral distinguishing labels.
- **Stable variants.** FootReplays/Das source-declared resource fingerprints replace DOM ordinal and
  display labels as new variant identity; known signing fields are excluded from identity only, not
  rewritten for access. No final media URL becomes catalog identity. Legacy selectors remain readable;
  a missing explicit variant fails rather than playing a sibling. Fresh exact-page projections
  replace their prior in-memory set idempotently; reorder/label/URL refresh cannot erase new watched
  identity or duplicate the page's variants.
- **Sports management/programs.** Whole-feed/generic-player capability inference and incomplete role
  repair caused TimeSoccerTV disagreement. Known-family reconciliation retains its proven programme
  role and removes unsupported LIVE without deleting owner state. Generic feed LIVE needs a single
  item with live/matchup/date evidence. Hybrid recurrence remains unconfirmed for one edition and
  cannot schedule recurrence. One management screen includes built-in Foot/Das and owner families,
  separates known family/configuration/health from child/binding verification, and shows useful facts.
  Known LiveBall roots/children project as one family master with all child, binding, approval,
  priority, health and provenance evidence retained. Repair/re-save/reload is idempotent.
- **Catalog production boundary.** The normal TMDB/provider/cache/pagination path had semantic
  admission and sanitation gaps; no hidden Website catalog was needed to explain the code defect.
  Curation is reapplied after decode/enrichment/merge/pagination, with canonical-ID dedupe. Structural
  support/tutorial/payment-account/SEO/generic-video evidence requires typed weakness or independent
  bad synopsis evidence; no brand blacklist or fuzzy identity merge. Real legitimate canonical series
  remain eligible; explicit Search/direct/personal content remains broader. Owner-private bad-card
  records were unavailable, so their individual persisted provenance was not inspected or claimed.
- **Metadata/TMDB.** Field-aware provider and legacy-cache sanitation prevents sentinel titles,
  placeholder art and boolean/debug/control/giant-numeric pseudo-synopsis from becoming display truth.
  Canonical title/date facts are retained instead of blindly stripping titles. TMDB network/timeout/
  auth/HTTP/parse, no identity, missing field, stale failure and recovery stay distinct; cached content
  survives and success clears stale errors. No VPN detection/cause was invented. Routine Series
  success is silent; season tabs contain season identity only, unknown counts are secondary, weak
  season artifacts are rejected. Existing dated released-season policy now runs in catalog and
  personal enrichment rather than seeding future-inclusive provider totals. `הפשוטע` exact S1E7
  title/date remains, without an invented synopsis/still; Reacher's source eligibility is preserved.
- **Personal rows/persistence.** Additive user-state Room 8→9 migration persists canonical-title
  evidence, paired TMDB vote facts and declared season facts without dropping membership/progress.
  Snapshot enrichment is non-destructive and field-failure isolated; personal cards keep metadata,
  additive list icons and centered dates. Displayed released seasons use dated evidence, not raw
  declared totals. Continue Watching no longer retains async/map arrival order: the same persisted
  facts use the existing deterministic ranking with stable canonical keys/anchors.
- **Sports watched addendum.** The prior observation could enter the bounded affinity log, but there
  was no non-decaying exact-resource consumption/projection boundary. Without private-device access
  we do not claim the owner's specific event was saved. Code43 uses the ONE real-position/duration
  playback pipeline, actual accepted playable identity and a has-played guard, so accidental opens
  and restored resume positions alone mark nothing. Meaningful Highlight/Extended marks only that
  exact role/resource; Full Replay marks only replay and does not fabricate highlight history;
  meaningful LIVE or explicit manual Seen covers both logical post-match roles. Durable compact facts
  read old signal data but do not expire with taste decay. Details projects exact watched siblings;
  outer cards expose highlight-only/full-replay/whole-match state; an unwatched replay remains a
  candidate after highlight-only viewing. Distinct siblings, stable source refresh and upgrade
  boundaries have regressions.
- **Catalog Telegram addendum.** This is not Sports search. Strict FAST query families lost useful
  validated aliases/natural Hebrew forms, pager sufficiency could occur before exact matching, the
  active pool lacked bounded history rescue, and exact Episode Details playback was absent from a
  route guard. Query-plan v2 reserves the natural form and sanitized canonical/reliable aliases;
  local index first, then a zero-strict-hit episode may use at most five seconds inside the existing
  15-second deadline for the same maximum eight selected Catalog CHANNEL/GROUP active sources,
  concurrency at most four and existing bounded history pages. Retrieval precedes conservative exact
  title/season/episode matching; wrong/DM/nonselected/Sports-only candidates reject, co-roles remain
  Catalog-eligible, and no global/account-wide/unlimited search occurs. Source siblings and idempotent
  retry are preserved. Authenticated runtime remains unobserved.
- **Rating addendum.** Exactly one TMDB vote no longer produces a meaningful numeric display score;
  raw value/count/provenance remain. No new threshold above one vote or averaged PMTV score exists.
  OMDb already parsed/rendered independent IMDb/Metacritic/Rotten Tomatoes; its EXTERNAL_RATING SWR
  completion was not accepted by the matching open Details generation. That exact-IMDb-only state
  update now reprojects real returned fields, omits absent fields and rejects stale other-title work.
  No credential readback, title-only lookup or new rating source was added.

**Preserved owner decision:** Website playback/opening is a fallback after native resolution, never
the default path for a source with a supported native resolver. Configured LiveBall → strongly matched
exact child → native resolver → shared PMTV Media3; Website is owner-explicit only and never automatic.
Pre-kickoff exact source without media is typed pending/not-yet-available, not DRM/fatal failure, and
does not poison the LIVE retry. Catalog, SPORTS_ANNOUNCEMENT and SPORTS_MEDIA remain independent
coexistent Telegram roles; Live observation is a capability of SPORTS_MEDIA, not a fourth role.

## Actual validation and current provider outcomes

- **PASS local:** focused tests and full 15-module mobile/mobile-used matrix, 336 suites / 2,996 tests,
  11 intentional skips, zero failures/errors; 340 Gradle tasks. Final 12 mobile-used lint targets plus
  mobile assembly passed, 514 tasks. Every heavy local operation used `heavy-run -- timeout`.
- **PASS security/delivery:** credential scanner 41 cases; downloader 20 rejection + one success;
  delivery 14; provisioning inspector 4; upgrade 8; deterministic prefetch 5; pinned TDLib bootstrap/
  verification; Node crypto/provisioning/interop; Gecko/runtime notices; local and authoritative
  package/version/signer/ARM64/native checks. `git diff --check`, complete task-only review and final
  status passed. No root aggregate or app-tv task ran.
- **CI attempt 1 FAILED:** the 45-minute unit-test step timed out after core task outputs completed
  and `app-mobile:testDebugUnitTest` produced no output for roughly 39 minutes. No assertion failure
  or root-cause trace was emitted; the cause remains unproven. One same-HEAD failed-job rerun was used,
  without a no-op commit or weakened gate. Attempt 2 passed tests in 6m24s, lint in 6m14s and assembly
  in 3m, then all provenance/artifact gates. This closes CI, not physical/provider acceptance.
- **YouTube host:** ordinary public sample `RESOLVED:27`; sampled official Sports highlight and
  trailer each `LOGIN_REQUIRED`, with no DRM evidence. Those two required runtime paths remain
  FAILED. Shared Media3, frames/audio/fullscreen/Back are PHYSICAL TEST PENDING. No bypass or external
  app/WebView success substitution.
- **FootReplays host FAILED:** final post-variant-identity rerun exposed COMPLETE/FIRST_HALF/
  SECOND_HALF, but every native resolver result was `MEDIA_RESOLVE_DYNAMIC_PLAYER_UNSUPPORTED`.
  Competition-index reachability passed. Historical Full Match physical PASS remains historical.
- **Das host FAILED:** final production smoke found no current RSS exact match across 18 bounded
  canonical fixtures (`SUCCESS:0` each); resolution not established. Historical direct playback PASS
  is preserved, not promoted to current success.
- **LiveBall:** current bounded TheSportsDB input yielded no usable UPCOMING/LIVE canonical fixture;
  current exact discovery/resolution smoke was NOT_ATTEMPTED for that exact input blocker. Code42's
  historical compatible-fixture host HLS evidence below is not a code43 physical PASS.
- **TimeSoccerTV:** real bounded opt-in execution returned `SOURCE_DETECTED`, provider/index/player
  markup but `playbackObserved=false`, zero editions/programs. Programme capability retains earlier
  verified evidence; this run proves no edition/playback. Universal Foot/Das structure/profile smoke
  passed only as structural evidence.
- **TMDB real client BLOCKED:** no environment runtime token and no access to the private device vault;
  no credential was read. **Telegram authenticated episode search and OMDb supplemental rating read:
  PHYSICAL TEST PENDING** without the private runtime. OMDb connection remains PHYSICAL PASS, not a
  supplemental-read PASS. These limits were not replaced by fixture/CI evidence.

## Remaining acceptance, blocked decisions and future backlog

- **PHYSICAL TEST PENDING:** every changed code43 phone surface against the authoritative APK:
  poster/whole-card click/direct icon isolation/no duplicate identity; ranking/FINISHED state/variant
  labels; management/grouping/TimeSoccer roles/Telegram role visibility; passive curation/sanitized
  metadata/canonical dedupe/season truth; lists and stable Continue Watching; watched role/resource
  persistence and outer/Details projection; Telegram exact episode retrieval; one-vote display and
  actual exact-ID OMDb ratings; launch/Back/image continuity/upgrade-preserved private state. No
  private-state observation was fabricated from deterministic migration tests.
- **PHYSICAL TEST PENDING:** all new native Media3 acceptance (real video/audio/seek/fullscreen/Back),
  LiveBall pending→LIVE and next real compatible fixture, authenticated Telegram media, and naturally
  unavailable Telegram Live observations. Sports notification delivery is PHYSICAL PASS, while exact
  ten-minute timing/identity/dedup remain unproved. Keep `SCHEDULE_EXACT_ALARM` owner-grant route.
- **BLOCKED — new Israeli rating source decision:** existing exact-IMDb OMDb is the operational
  supplemental route. TVmaze's public CC BY-SA rating is not Israeli-specific/currently ingested and
  has no acceptance-title coverage. Seret community score is a candidate, but only a partnership/
  badge surface was found, no documented public native-app interface/reuse grant/exact-ID crosswalk.
  Representative machine-access coverage is therefore unproved. Sratim/EDB have no approved rating
  API. Written access/licensing, stable schema/attribution/rate contract, exact matching, coverage and
  maintenance proposal plus explicit owner approval are required before integration. No scraper,
  API/account requirement, paid service or fuzzy matcher was introduced. Public evidence and options
  are recorded in `docs/TMDB_INTEGRATION.md`.
- **NOT IMPLEMENTED — Telegram Live stream transport:** pinned TDLib 1.8.66 observation does not supply
  the unshipped joined-call/tgcalls stream transport; no call joining or identity exposure to fake
  playback. Other protected provider resources retain typed login/DRM/region/entitlement boundaries.
- **Approved future backlog remains in current TODO/product contracts:** official provider work only
  with lawful documented contracts, opt-in exact new-episode notifications, strong-ID universe
  relationships, encrypted non-session/non-media multi-device state sync and F2D subtitle/audio/
  picker work. Final TV/Shield parity/D-pad/10-foot and physical acceptance require a separate owner
  authorization after mobile acceptance. No new scope was silently adopted here.

Project docs reconciled: TODO, PROJECT_STATE, HANDOFF, MOBILE_ACCEPTANCE, TEST_PLAN, RELEASE_REVIEW,
UX_DECISIONS, PRODUCT_SPEC, CHANGELOG, README, ARCHITECTURE, DATA_MODEL, APK_DISTRIBUTION,
TELEGRAM_INTEGRATION, TMDB_INTEGRATION, provider operational matrix and ADR 0056. All six parts and
both addenda are represented; code42 historical publication and old checkbox truth were reconciled.
No owner-approved requirement remains only in chat. Code42 physical history is retained below, with
its poster replacement explicitly recorded above as a regression rather than approved supersession.

Privacy: no pairing code/endpoint, device serial, Telegram identity, private source URL, credential,
session, screenshot or private media is in this record. Physical evidence is owner-reported and safe;
diagnostics are aggregate/type/stage only. No application data was cleared or destructively reset.

---

# Historical code42 handoff — retained evidence, not current implementation/publication state

The following historical record predates the owner's code42 physical failures. In particular, its
two-crest substitution was not owner-approved and code43 restores the accepted rich poster above.

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
