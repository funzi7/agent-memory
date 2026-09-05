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
