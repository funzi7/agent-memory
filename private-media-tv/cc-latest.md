# Private Media TV — F2B.4.1 Handoff

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2B.4.1 — owner-directed Telegram media visibility repair |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `5f198b1c727b866ca82b0622c82a5280081a4156` |
| Main implementation commit | `1df74f73badc695abcb457e0322f8832b88eb55b` |
| Final application HEAD | `f7d06959c94131e73844e79ba620c27b8b4c42a1` |
| Starting agent-memory HEAD | `e1c4ecf2f6abbb0f928727d2118ddb46ed5bb369` |
| First exact-head CI | `31747390552` — success |
| Final exact-head CI | `31748553198` — success |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.3.5-phone-test`, versionCode 13 |
| TV regression identity | `com.funzi7.privatemediatv`, `0.5.5-f2b41`, versionCode 18 |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |

Both application commits were pushed without force, and final `HEAD` matches `origin/main`. The
second commit is a delivery-only follow-up: after successful exact-head CI, both the local exporter
and the exact-head downloader safely rejected the legitimate retained code-12 predecessor because
the rotation allowlist stopped at code 11. The follow-up adds only code 12 to that allowlist and
corrects the executable fixture so it actually models code 12. It does not change application
runtime behavior.

Only the exact-final-HEAD mobile artifact was downloaded and published. The TV APK was built and
verified for shared-code regression but was not exported, downloaded to shared storage, installed,
or deployed. No Shield command ran.

## Implemented behavior

### Literal known-source search

The known-source field now means literal private text to find inside the explicitly assigned
source. Owner input is used before aliases or catalog titles and participates in both local index
and live Telegram lookup.

The app-private metadata index now supports direct account- and exact-source-scoped lookup over
caption/title and filename. Unicode NFKC, locale-stable case normalization, whitespace collapse,
and common separator/punctuation tolerance are applied. Normalized substring matches rank before
all-token matches, followed by stable newest tie-breaking. Display does not require a matched media
key, catalog-title hit, or automatic parser approval.

Owner-directed local results are returned without a Telegram call. A fresh automatic negative
cannot hide a newly indexed literal result. Manual and learned aliases also participate in local
index lookup instead of only the provider query plan.

### Possible results and bounded live fallback

A literal video or plausible video-document hit remains visible as a possible match when automatic
identity proof is uncertain. It is neither silently validated nor automatically bound. Available
private thumbnail, caption/title, filename, message date, duration, dimensions, size, and attachment
type are rendered only on-device.

Live owner search sends the exact owner term first and searches only the currently selected exact
known/affinity source set. It never fans out to unrelated selected sources. Provider-zero uses the
existing bounded recent-media window in the same source and literal-filters caption/title/filename
before display. It does not invoke unbounded history or force possible results through the strict
automatic matcher.

A live failure cannot erase an already displayed local hit. Normal UI presents a small retryable
refresh notice when local results remain, or a generic source-search-unavailable message when they
do not. Internal failure categories remain behind diagnostics.

### Exact owner binding and learning

Catalog Room schema 10 adds a provider-neutral exact binding from media identity to a durable
Telegram message/attachment source identity. The binding captures the strongest available remote
or resource identity, with message revision as a fail-closed fallback. Definitive deletion and
replacement remain typed; a missing, changed, or newly substituted identity cannot play once under
the old binding.

Exact binding is stronger than affinity, aliases, and parser evidence. It survives repository and
ViewModel recreation, process death, restart, and compatible APK update. Opening Sources consults
the binding before text search or provider work, including recurring editions. Playback continues
through the established warm/verified-local/current-message/protected-content resolver rather than
bypassing it.

Explicit binding records the appropriate parent series/program source as proven, retains the
successful private term, and stores only a safe observed episode/date naming-form category. It
never exact-binds a sibling episode or edition.

### Parser, UX, index state, and diagnostics

The conservative parser recognizes explicit Hebrew episode-marker evidence across common
separators when the normalized program title is reliable. Wrong episode numbers, arbitrary
standalone numbers, years, resolutions, and quality markers remain insufficient.

The mobile known-source flow provides literal-search and local-index actions. Normal result states
are bound, automatic match, and possible match. Movies, episodes, and recurring editions receive
the appropriate explicit confirmation action, plus test playback where eligible. No internal enum
name is shown in normal UI.

Explicit source-index status now shows state, indexed media count, pages, and whether history end
was reached. Restarting a completed full index resets run counters rather than double-counting
upserted rows, while a real partial checkpoint still resumes.

Diagnostics expose only safe aggregate counts for exact bindings, index rows considered, literal
index matches, live attempts/results, recent fallback consideration/matches, parser/identity
rejects, displayed possible matches, and validated matches. No private string or provider identity
was added to logs, CI, tests, public documents, APK assets, or this handoff.

## Principal implementation areas

- `core-catalog`: owner-directed contracts and service path, literal index ranking, schema 9→10,
  exact binding and fail-closed replacement handling, conservative learning, alias-aware lookup,
  Hebrew episode parsing, safe statistics, and indexed playback materialization.
- `core-telegram`: attempted-search accounting, recent-fallback provenance/counts, and the existing
  bounded same-source fallback integration.
- `app-mobile`: data-source/ViewModel flow, literal-search/index actions, private result cards,
  possible/automatic/bound labels, exact confirmation, retained-local failure UX, recurring-edition
  reopen, and index progress.
- `app-tv`: version 18 compile/regression only; no new TV delivery or physical flow.
- `scripts`: code-13 identities and update harnesses; the final narrow follow-up permits the real
  code-12 predecessor in isolated mobile rotation.
- Documentation: product, architecture, data model, Telegram integration, UX, testing, release,
  distribution, roadmap, project state, changelog, handoff, and the ordered mobile acceptance gate.

## Focused regression evidence

Synthetic tests cover:

- a `matchedMediaKey = null` indexed row returned by literal caption substring with zero Telegram
  calls and no catalog-title or automatic-matcher display prerequisite;
- substring/all-token/newest ranking and separator tolerance;
- a manual alias different from the catalog title finding the local indexed caption;
- parser uncertainty retaining a live or indexed literal hit as a possible result;
- provider-zero bounded recent fallback returning a literal possible result;
- live provider failure retaining a usable local result;
- a deselected affinity source being hidden and impossible to bind;
- one known source remaining the only searched source despite 58 other selections;
- exact binding persistence and immediate reopen without provider search, including recurring
  editions;
- parent-source/term learning without sibling exact binding;
- remote/resource/revision replacement paths failing closed;
- completed explicit-index rebuild counters resetting accurately; and
- safe Hebrew episode-marker recognition with wrong-number/year/resolution safeguards.

Failing-first evidence was directly observed for the new parser behavior and for the missing local
literal API. During final review, an additional resource-identity transition regression failed
before its exact-binding guard and passed after the guard.

## Local validation

The following completed successfully:

- focused `core-catalog`, `core-telegram`, and `app-mobile` tests;
- affected-module suites;
- `./gradlew --version` and `./gradlew projects`;
- `./gradlew test` — 1,058 tests, zero failures/errors/skips: mobile 228, TV 74,
  catalog 218, metadata 66, model 19, playback 90, provider 27, provisioning 48,
  security 98, and Telegram 190;
- `./gradlew lint`;
- `./gradlew :app-mobile:assembleDebug`;
- `./gradlew :app-tv:assembleDebug`;
- `./scripts/bootstrap-tdlib-android.sh --verify-only`;
- `./scripts/verify-tdlib-artifact.sh`;
- package/version/signer, ARM64-only JNI, NDK r28c, ELF dependencies, stored JNI, 16-KiB alignment,
  and prohibited-content inspection;
- real retained mobile code 12→13 update verification;
- exact-head baseline TV code 17→18 update verification;
- mobile/TV publication, exact-head downloader, upgrade, rejection-path, and shell-syntax harnesses;
  and
- `git diff --check` before both application commits.

Official TDLib 1.8.66 remains pinned to official source commit
`022d60202e446ad1287b9fb68e687c8a0760788b`, ARM64-only, NDK r28c, and 16-KiB-compatible. The local
verified artifact JNI SHA-256 is
`21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc`. The exact-CI packaged JNI
SHA-256 is `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` and passed the repository's
native-layout and pinned-lineage checks. TDLib was not rebuilt locally.

The final local mobile APK was 59,371,170 bytes with SHA-256
`9f554fbb58c954247f348e858f818763fc54832bf846ef82bd93ebe1a315edbc`. The regression-only local
TV APK was 59,375,608 bytes with SHA-256
`2dd07b595c7d1383298ee186254f04bcce471829e2195eb80ddf34fc05ab38da`.

`adb devices -l` found no device.

## Exact-head CI and mobile delivery

CI run `31747390552` passed for the main implementation commit. Its exact mobile artifact exposed a
real delivery-only defect: the canonical code-12 predecessor was absent from the rotation verifier's
approved version list. Both exporter and exact-head downloader stopped before modifying shared
storage. The narrow follow-up corrected that allowlist and its false-positive test fixture.

Final Android CI run `31748553198` completed successfully for exact final application HEAD
`f7d06959c94131e73844e79ba620c27b8b4c42a1`. Wrapper validation, official TDLib verification,
1,058 tests, focused suites, lint, signed ARM64 TV/mobile assemblies, package/version/signer/JNI
checks, and both artifact uploads passed. The exact mobile artifact ID is `9200308766`; the TV
artifact was not downloaded.

The exact-head downloader independently verified remote `main`, run/head/artifact metadata,
checksum, package/version/code, Development signer, ARM64-only native payload, and private-material
rules before isolated atomic publication. The published exact-head mobile APK is:

- path: `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk`;
- size: 58,371,736 bytes;
- SHA-256: `97150a677e9247d475cf5b6a8f384ab7c0ed5748e33672fdd924dc95c4605a33`;
- modified time: `2026-08-13 22:20:26.806317125 +0000`;
- package/version: `com.funzi7.privatemediatv.mobile` / `0.3.5-phone-test` (13);
- signer: the Development certificate above; and
- ABI/JNI: ARM64-only with the exact-CI packaged JNI hash above.

The verified code-12 APK remains at the isolated mobile `previous` path. A direct post-publication
check proves same package and signer, code 12→13, ARM64-only JNI, and update-preserving
`adb install -r` policy with no uninstall, downgrade, or clear-data operation. Parent TV files and
the provisioning document were not modified. No TV artifact was delivered.

## Physical acceptance and remaining gate

No authorized device was connected. No installation, launch, Telegram session, catalog search,
binding, playback, restart, or runtime-unavailable index search was physically performed. The
physical code-13-over-code-12 procedure remains the primary release gate; synthetic tests, CI, and
file publication do not satisfy it.

Run the ordered procedure in `docs/MOBILE_ACCEPTANCE.md` first:

1. install code 13 over code 12 without uninstalling or clearing data;
2. confirm Telegram, metadata-provider, user, and source-assignment state remain;
3. open the same real catalog item that failed on code 12;
4. enter a visible substring from its real Telegram post in the literal known-source field and
   search now;
5. confirm the media appears, possibly as a possible match;
6. explicitly bind and play it;
7. exit and reopen Sources, then restart the app, proving the exact binding returns immediately
   without another Telegram search; and
8. when an explicit source index exists, prove literal local lookup still works with live Telegram
   unavailable.

Keep every real source name, title, term, caption, filename, provider identity, and screenshot out
of public issues, commits, CI, and agent-memory. Do not expand this corrective milestone into TMDB,
Offline, Auto-next, YouTube, sync, TV delivery, or Shield work.
