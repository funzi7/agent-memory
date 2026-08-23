# Private Media TV — F2C.6.1 Final (published; physical owner acceptance pending)

## Identity and release state

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F2C.6.1 finalization — release-validation policy change (owner decision, 2026-08-23): external CLI TMDB token smoke made optional/non-release-blocking; factual `MetadataResult.Failure` reporting in the live smoke; exact-head publication of mobile code 29 |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD (this session) | `b5785d4f622699f4c905807ac96ad53761cf00ab` |
| Final application HEAD | `27256b01393cce122566645f426101c10e09778d` (pushed normally, no force; equals `origin/main`) |
| Exact-head Android CI | `32643492647` — **success**, exact head `27256b01393cce122566645f426101c10e09778d` (Gradle wrapper validation + Official TDLib/tests/lint/signed TV+mobile assembly both green; both exact-head artifacts uploaded) |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.4.10-phone-test`, versionCode 29 (updates code 28 in place; **no version bump this session**) |
| TV regression identity | `com.funzi7.privatemediatv`, `0.6.9-f2c61`, versionCode 32 (regression build only; **not delivered**) |
| Schemas | Unchanged this session: Catalog/FTS 11; UserState v6; territory availability v3; Local Library v2 |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| Published mobile code-29 APK (CI build) | 59,382,512 bytes, SHA-256 `0a5f28d346eff0f4cc34c9717553cfbfc3c174eb4f561e902c9ad69bd319ce3a`, ARM64-only, pinned JNI `790c545f…`, Development signer |
| TDLib | Pinned official commit unchanged; CI verified/packaged the pinned artifact; no rebuild |

## What changed this session (owner-directed policy change)

The owner changed the F2C.6.1 release-validation strategy. The external CLI live TMDB smoke
credential path (`PMTV_TMDB_SMOKE_TOKEN`) is **no longer a release requirement**: the installed
mobile app already loads the real TMDB catalog with its app-private credential through the
production path `AndroidTmdbCredentialVault` → `VaultMetadataCredentialSource` →
`MetadataProviderFactory.createTmdb()`, which is the authoritative live credential/runtime path.
The new release gate is: (1) automated tests pass; (2) exact-head Android CI passes;
(3) publish code 29; (4) **physical owner validation on the real Android app is the live
TMDB/runtime acceptance gate**.

Factual record preserved (not weakened, not pretended): the smoke's positive-path checks NEVER
ran on this host (no credential, no device); only its real-network failure path ever passed;
that partial run was NOT accepted as release evidence. The smoke remains opt-in
(`-Ppmtv.live.tmdb.smoke=true`) and non-release-blocking.

Commit `27256b01` (10 files, docs + one test file; no production code, no version pins):

1. **`F2c61LiveTmdbIsraelSmokeTest` unsafe-cast fix:** the positive path's unchecked
   `included as MetadataResult.Success` was replaced with a `when` that throws a factual
   `AssertionError` on a live `MetadataResult.Failure` (typed category and optional safe retry
   delay only — never a token, URL, or payload) instead of surfacing a `ClassCastException`.
   Both smoke tests, their assertions, and the opt-in gating are otherwise unchanged.
2. **Release docs reconciled to the new policy:** README, TODO, CHANGELOG,
   `docs/PROJECT_STATE.md`, `docs/RELEASE_REVIEW.md`, `docs/HANDOFF.md`, `docs/TEST_PLAN.md`,
   `docs/MOBILE_ACCEPTANCE.md` (the F2C.6.1 physical procedure is explicitly the live
   TMDB/runtime acceptance gate), and a dated superseding-decision addendum in ADR 0027.

## Validation actually run (this session)

- Focused `:core-metadata:testDebugUnitTest --tests '*F2c61LiveTmdb*'`: BUILD SUCCESSFUL
  (both smoke tests assumption-skipped without the opt-in flag, as designed).
- Full non-live `./gradlew test` at the final tree: **1,564 tests / 0 failures / 0 errors /
  5 skipped** (3 environment private-LAN listener cases + the 2 opt-in live TMDB smokes) —
  identical to the pre-change counts; no test removed or weakened.
- `git diff --check` clean before commit; one cohesive commit pushed normally; remote verified
  (`git ls-remote` shows the final HEAD).
- Exact-head Android CI `32643492647` for `27256b01…`: success, both jobs green, both signed
  exact-head artifacts uploaded.
- `adb devices -l`: no device at any point; no installation/launch/physical claims are made.

## Phone publication (canonical, this session)

`./scripts/download-latest-ci-mobile-apk-to-phone.sh` ran against CI run `32643492647`
(artifact `private-media-tv-mobile-apk-27256b01…`) and **succeeded**: package/version/ABI/JNI/
signer verified, rotation performed. Verified final state of
`/storage/emulated/0/Download/PrivateMediaTV/Mobile/`:

- `private-media-tv-mobile-latest.apk` = code 29 CI build, 59,382,512 bytes, SHA-256
  `0a5f28d346eff0f4cc34c9717553cfbfc3c174eb4f561e902c9ad69bd319ce3a`
- `private-media-tv-mobile-previous.apk` = verified code 28, 59,332,692 bytes, SHA-256
  `f9c3a24e78242bd0a54860004f28be56198f18474f4ecdc484e32f52e234cc7f`
- broken code 23 remains excluded/blocklisted; no other files present
- TV directory files verified untouched (timestamps unchanged); no TV export, no Shield action,
  no uninstall/downgrade/Clear Data

## Pending, limitations, and risks

- **Physical owner acceptance is pending and is now the live TMDB/runtime acceptance gate:**
  install code 29 over code 28 (Android must offer Update; NO uninstall/Clear Data) and run the
  F2C.6.1 procedure in `docs/MOBILE_ACCEPTANCE.md` (tri-state Eye states/bulk/undo, Continue
  Watching convergence, collection-card strip, Israel row behavior/placement, folder-context
  recognition via `סרוק שינויים`) — real TMDB catalog loading observed there is the runtime
  evidence. Local playback/delete/reconcile remain separately unverified.
- The external token smoke was never positively run; if ever used in the future it now reports
  a live failure factually. It remains optional and must not be represented as passed.
- A code-29→28 rollback reads SERIES_EYE/SEASON_BULK marks as unwatched under code 28 (lenient
  reader; data preserved, restored on re-upgrade).
- TV code 32 remains a regression build only; no Shield delivery or acceptance is claimed.

## Exact next step / continuation

1. Owner performs the F2C.6.1 code-29 physical procedure (`docs/MOBILE_ACCEPTANCE.md`) — this
   completes the live TMDB/runtime acceptance gate.
2. Deferred and untouched: local-file catalog playback bridge (needs the owner architecture
   decision), local source priority/CW-reopen/progress/auto-next parity, OMDb provisioning,
   Wikidata franchise population, Windows implementation, final Shield rollout.

Preserve all permanent constraints: `funzi7` only; no reset/clean/restore/stash/force push; no
alternate checkout/worktree; no speculative TDLib rebuild; no Telegram work from
browsing/continuation/badge paths; mobile-only publication; never claim physical or runtime
evidence without the owner/device; never commit or persist any TMDB credential.
