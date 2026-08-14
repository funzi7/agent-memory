# Private Media TV — F2B.4.2 Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2B.4.2 — no-known-source owner search and mobile-player parity |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `f7d06959c94131e73844e79ba620c27b8b4c42a1` |
| Main implementation commit | `a950dffa2bec4354d2b4a85feb29f5ac3e12aa3b` |
| Final application HEAD | `6cfbe7d870e8478b9014f25d29eadfc662304246` |
| Starting agent-memory HEAD | `8858a48a74c4a5e53c4785483bb757ef238a4aaf` |
| F2B.4.1 exact-head baseline CI | `31748553198` — success |
| First F2B.4.2 CI | `31755156670` — failed only on stale workflow version assertions |
| Final exact-head CI | `31756251328` — success |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.3.6-phone-test`, versionCode 14 |
| TV regression identity | `com.funzi7.privatemediatv`, `0.5.6-f2b42`, versionCode 19 |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |

Both application commits were pushed without force, and final application `HEAD` matches
`origin/main`. The first commit contains the scoped search, UI, player-control, tests, version, and
documentation changes. The second is a CI-only correction: the workflow was still asserting and
publishing F2B.4.1 version names/codes after correctly building F2B.4.2. It updates those assertions
and artifact metadata and renames the focused-test step; it does not change runtime behavior.

Only the exact-final-HEAD mobile artifact was downloaded and published. TV shared-code regression
was built and verified, but no TV APK was exported or delivered and no Shield command ran.

## Implemented behavior

### Explicit owner-search scope

Owner-directed literal discovery now carries an explicit provider-neutral scope:

- `KNOWN_SOURCES_ONLY` searches only non-empty title-specific manual affinity;
- `ALL_SELECTED_SOURCES` searches only the owner's currently active, explicitly selected My
  Sources entries; and
- zero selected sources performs no provider work and leaves search disabled with a Manage Sources
  explanation.

The Known Sources screen no longer equates global selection with title affinity. It separately
shows authoritative title-specific known sources and globally selected sources that may be added to
the title. With no title affinity, the screen explicitly says that no known sources are defined and
enables the all-My-Sources literal action when any selected sources exist.

Known-source literal search preserves the physically successful F2B.4.1 path. All-selected literal
search uses the owner term directly, with one primary literal query per eligible source, existing
bounded concurrency/cancellation, no automatic TMDB alias Cartesian product, and the selected-source
limit. It checks exact binding and local metadata first. A local hit is exposed progressively before
remaining live work completes; live progress is stable-appended, and the existing bounded recent
media fallback participates when textual provider search returns zero.

Literal video/document hits remain visible as possible matches when the automatic identity parser
is uncertain. Private cards continue to render the source display title, media caption/title,
filename when available, date, duration, resolution, size, and thumbnail on-device. No private
source or media value was added to diagnostics, fixtures, CI, logs, documentation, or this handoff.

### Exact binding and playback eligibility

An owner-confirmed result discovered through all selected sources may now use the existing exact
binding when its source is still explicitly selected and active. Reopening Sources consults that
binding first and returns it without a new broad search. Parent source/template learning remains
conservative, and no sibling episode is exact-bound automatically.

Test playback for an unbound possible result discovered across My Sources is likewise allowed only
while the source remains currently selected. Bound, warm, verified complete-local, cached, and
current-message resolution rules remain intact; fullscreen/orientation changes never repeat source
resolution.

### Accurate FAST scope copy

Automatic FAST discovery now restricts to manual affinity only when that affinity is non-empty.
Without manual affinity it uses selected My Sources, while existing learned/proven evidence remains
preferred ordering rather than being falsely presented as manual scope. Mobile state records the
actual search scope, so progress says it is searching known sources only for real known affinity and
My Sources otherwise. Zero My Sources performs no search and shows the source-management action.

DEEP behavior and the existing exact-binding short circuit remain explicit and unchanged.

### Unified mobile player controls

Tracing proved that automatic, possible/test-play, exact-bound, cached/warm, complete-local, and
normal picker launches already converge on the same `MobileScreen.PLAYBACK`, player runner,
controller, Media3 surface, and playback identity. There was no second player to remove. The
physical symptom was discoverability: Fullscreen sat after six actions in a horizontally scrolling
row and was initially off-screen on a portrait phone.

Fullscreen is now an always-visible fixed player action. While fullscreen, Exit Fullscreen and
Rotate are fixed and visible. The established fullscreen policy remains the single implementation:
known portrait dimensions request portrait, landscape or square dimensions request landscape,
unknown dimensions preserve current orientation, manual rotate overrides automatic orientation for
that playback session, and exit restores normal app orientation and system bars. Immersive mode
uses supported insets APIs with transient gesture escape.

Fullscreen and rotation do not key or recreate source resolution, the playback runner, controller,
or surface. Position, Media3 memory buffer, speed, scaling, audio track, subtitle track, and resume
identity therefore stay in the same active session.

## Principal implementation areas

- `core-catalog`: explicit owner-directed scope, selected-source eligibility, literal progressive
  discovery, local-first behavior, exact binding, possible-result playback, and FAST empty-affinity
  fallback.
- `app-mobile`: distinct title-affinity/global-source presentation, correct Hebrew scope/action
  copy, source-scope state, common player launch assertions, and fixed fullscreen/rotate controls.
- `core-telegram`: production code was unchanged; focused adapter regression proves one literal
  request per selected source and progressive first-result behavior.
- `core-playback`: production code was unchanged; existing runner/controller continuity and
  fullscreen policy tests remain authoritative.
- `app-tv`: version 19 compile/regression only; no delivery or physical flow.
- `.github/workflows` and `scripts`: code-14/code-19 validation, artifact metadata, safe mobile
  code-13 predecessor rotation, and upgrade fixtures.
- Documentation: README, roadmap, changelog, product/architecture/data/security/Telegram/UX/test,
  release, handoff, APK distribution, project state, and ordered mobile acceptance were reconciled.

## Focused regression evidence

Synthetic behavior tests cover:

- three selected sources and no title affinity enabling all-My-Sources owner search;
- a known source among three global selections restricting the owner query to that source only;
- zero selected sources disabling search, showing the explanation/action, and making no provider
  call;
- exact FAST progress copy for known affinity versus My Sources scope;
- one literal primary query for each selected source, a match existing only in the third source,
  progressive exposure before sibling completion, private source-label rendering, and retention as
  a possible match despite parser uncertainty;
- a local literal index hit appearing before suspended live-network completion;
- owner binding of the all-selected result and immediate exact reopen with zero provider calls;
- all-selected possible-result test playback while the source remains selected;
- validated automatic, possible/test-play, and exact-bound results producing the same playable
  launch contract and mobile route;
- Fullscreen displayed without horizontal scrolling, with Exit Fullscreen and Rotate displayed in
  fullscreen on a phone-sized viewport;
- portrait, landscape, square, and unknown video-dimension decisions plus session-scoped manual
  override; and
- runner/controller identity, position, buffering, speed, scaling, track choices, and resume state
  surviving fullscreen/orientation transitions.

Failing-first evidence was observed before production changes: the new owner-scope API and UI tests
did not compile against the manual-only contracts, and the phone-sized player test could not see the
off-screen Fullscreen action. The focused regressions passed after the scoped implementation.

## Local validation

The following completed successfully:

- focused `app-mobile`, `core-catalog`, `core-playback`, and `core-telegram` tests;
- affected-module suites;
- `./gradlew --version` and `./gradlew projects`;
- `./gradlew test` — 1,071 tests, zero failures/errors/skips: mobile 236, TV 74,
  catalog 222, metadata 66, model 19, playback 90, provider 27, provisioning 48,
  security 98, and Telegram 191;
- `./gradlew lint`;
- `./gradlew :app-mobile:assembleDebug`;
- `./gradlew :app-tv:assembleDebug`;
- `./scripts/bootstrap-tdlib-android.sh --verify-only`;
- `./scripts/verify-tdlib-artifact.sh`;
- package/version/signer, ARM64-only JNI, NDK r28c, ELF dependencies, stored JNI, 16-KiB alignment,
  page-size, and prohibited-content checks;
- mobile/TV exporter, exact-head downloader, upgrade, rejection-path, credential-scan, provisioning
  interoperability, and shell-syntax harnesses;
- real retained mobile code 13→14 update verification;
- exact-head F2B.4.1 TV baseline code 18→19 update verification; and
- `git diff --check` before both application commits.

Official TDLib 1.8.66 remains pinned to official source commit
`022d60202e446ad1287b9fb68e687c8a0760788b`, ARM64-only, NDK r28c, and 16-KiB-compatible. The local
verified artifact AAR SHA-256 is
`025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2`, and its JNI SHA-256 is
`21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc`. The exact-CI packaged JNI
SHA-256 is `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f`. TDLib was verified only
and was not rebuilt.

The final local mobile APK was 59,132,387 bytes with SHA-256
`1ebe7ec75dc2b354f9620fd99f9179adb5854ae40bf367e73572659d3f023c4e`. The regression-only local
TV APK was 59,384,558 bytes with SHA-256
`a9fb4133ec398513d7eb18f8f33d71beee7870b1d8dffa3b1c9cbb89bf840c56`.

`adb devices -l` found no connected device.

## Exact-head CI and mobile delivery

CI run `31755156670` reached the post-assembly verification step for implementation HEAD
`a950dffa2bec4354d2b4a85feb29f5ac3e12aa3b`. Wrapper validation, official TDLib verification,
unit/focused tests, lint, and both assemblies passed. The job then failed because the workflow still
asserted TV F2B.4.1 code 18 and mobile code 13. No artifact was published from that failed run.

The narrow workflow correction produced final Android CI run `31756251328`, which completed
successfully for exact final application HEAD `6cfbe7d870e8478b9014f25d29eadfc662304246`.
Wrapper validation, official TDLib verification, 1,071 tests, focused F2B.4.2 suites, lint, signed
ARM64 TV/mobile assemblies, package/version/signer/JNI/private-material checks, metadata creation,
and both artifact uploads passed. The exact mobile artifact ID is `9203067605`; the TV artifact was
not downloaded.

The exact-head mobile downloader independently verified remote `main`, workflow/run/head/artifact
metadata, checksum, package/version/code, Development signer, ARM64-only native payload, and
private-material rules before isolated atomic publication. The published APK is:

- path: `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk`;
- size: 58,371,732 bytes;
- SHA-256: `6d12c5d4e72e2157587c33dcf7add3ff3e8a113c9e924c33eac61ca8bd1d510b`;
- modified time: `2026-08-14 00:22:27.030729838 +0000`;
- package/version: `com.funzi7.privatemediatv.mobile` / `0.3.6-phone-test` (14);
- signer: the Development certificate above; and
- ABI/JNI: ARM64-only with the exact-CI packaged JNI hash above.

The verified code-13 APK remains at the isolated mobile `previous` path with SHA-256
`97150a677e9247d475cf5b6a8f384ab7c0ed5748e33672fdd924dc95c4605a33`. A direct post-publication
check proves same package and signer, code 13→14, ARM64-only JNI, and update-preserving
`adb install -r` policy with no uninstall, downgrade, or clear-data operation. Parent TV APKs and
the provisioning document retained their pre-delivery hashes. No TV artifact was delivered.

## Physical acceptance, limitations, and next step

No authorized device was connected. No installation, launch, state-preservation check, real
Telegram search, source-label inspection, binding, playback, fullscreen, orientation, manual rotate,
or playback-continuity action was physically performed. File publication, tests, and CI are not
physical acceptance.

The exact next step is the ordered 23-step code-14 procedure in `docs/MOBILE_ACCEPTANCE.md`:

1. update code 13 to code 14 without uninstalling or clearing state;
2. reconfirm the known-source/exact-bound physical F2B.4.1 baseline and playback;
3. verify visible fullscreen, dimension-driven portrait/landscape, manual rotate, and retained
   position/buffer on exit;
4. use a title with no affinity to verify the explicit empty-known state, enabled all-My-Sources
   literal search, progressive source-labelled result, binding, and immediate exact reopen; and
5. verify FAST says known sources only with affinity and My Sources without affinity.

Keep every real source name, title, term, caption, filename, provider identity, and screenshot out
of public issues, commits, CI, and agent-memory. Do not expand this corrective milestone into TMDB,
Offline, Auto-next, trailers, recommendations, sync, YouTube, indexing architecture, TV delivery, or
Shield work.
