# Private Media TV — F1D.3 Handoff

## Identity

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F1D.3 — physical Telegram range-source repair and observable playback diagnostics |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `1f9f43593f75bf7a8e3131ec58959060e87c2207` |
| Final application HEAD | `f90882cc28d3e88912347052b717f48808e8a9a9` |
| Application milestone commit | `f90882cc28d3e88912347052b717f48808e8a9a9` |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.1.3-phone-test`, `versionCode` 4 |
| TV identity | `com.funzi7.privatemediatv`, `0.3.6-f1c5`, `versionCode` 9 |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |

The application commit was pushed without rewriting history. Final local `HEAD`, `origin/main`,
the successful exact-HEAD Android CI run, its artifacts, and the downloaded mobile artifact all
identify the final application SHA above.

## Authoritative physical code-3 findings

The owner physically updated and tested mobile code 3 on an Android 16 phone. Established facts
are:

- the APK updated without uninstalling or clearing application data;
- stored API credentials remained accessible;
- TDLib database-key startup and Telegram phone authorization succeeded;
- the Telegram account was connected;
- broadcast-channel discovery, recent-media discovery, and media selection succeeded;
- selection of a real media item opened the playback screen;
- the selected file exposed a known total size of approximately 24.5 MiB;
- the player remained black at 00:00 with unknown duration and produced no audio or video;
- provider diagnostics retained known total size, zero locally available bytes after closure, an
  unbounded request beginning at zero, local-cache origin, and closed resource state;
- Media3 reported its generic source-range failure; and
- no media byte and no bounded network range request were observed.

These findings prove authentication, connected-session restoration, content discovery, media
mapping, and playback-screen navigation. They do not prove successful delivery of any media byte
to Media3. The exact code-3 root cause was not physically isolated. Path-alias policy, local-file
opening/reading, and completed-file prefix handling were strong code-based candidates, not proven
causes.

## Implemented behavior

### Typed provider-neutral range transaction

The provider-neutral contract now models the complete media-byte transaction with stable,
non-sensitive stages for snapshot acquisition, prefix query, local path resolution and policy,
local open/stat/read, bounded download request and progress, cancellation, Media3 open/read, and
session cleanup.

Failures use a closed set of safe `PMTV-RANGE-*` codes. Diagnostics retain:

- current stage and last terminal failure;
- playback/source request attempt;
- local-open and network-download counts;
- total size and current requested position/length;
- locally available bytes and local/new-request origin;
- bytes delivered to Media3; and
- cleanup completion independently of terminal outcome.

No diagnostic, UI message, or Media3-facing exception includes a filesystem path, filename,
provider identifier, Telegram identifier, raw TDLib object, raw error text, exception, or stack
trace.

### Failure retention across cleanup

Session cleanup no longer overwrites a failed terminal result with `CLOSED`. A failed open or read
followed by successful cleanup remains a failure with its exact failed stage and safe code while
also reporting that resources are closed. A clean user close can still terminate as closed without
a failure. A new source attempt clears the old failure only after the new attempt actually begins.

### Android local-file boundary

Direct production use of a Java NIO channel opened with mixed read/no-follow options was replaced
by an injectable Android local-file access boundary.

Production behavior:

- resolves the configured TDLib files root and candidate to canonical identity;
- accepts two standard Android app-private path aliases only when both resolve to the exact same
  package-owned TDLib root;
- rejects real root escape, intermediate-component escape, a symbolic-link final component,
  missing files, and non-regular files;
- prefers `android.system.Os` read-only, close-on-exec, no-follow descriptor opening;
- verifies the opened descriptor with `fstat`, performs positioned reads, and closes once; and
- uses a narrowly scoped app-private fallback only when the preferred platform operation is
  unsupported, with canonical revalidation before and after opening.

The boundary does not grant access to arbitrary application storage or shared storage.

### Completed, partial, and uncached files

A TDLib snapshot marked complete no longer depends exclusively on the downloaded-prefix query.
After trusted-path and regular-file validation, physical file length may establish local
availability when it is compatible with exact or expected size. Prefix zero on a valid complete
file therefore remains locally readable.

Completed-file size mismatch is a typed failure, never successful content. Exact EOF, beyond EOF,
shorter-than-declared, and larger-than-declared cases are explicit. Partial local prefixes are read
only where they cover the requested position.

When local bytes do not cover the request, the source issues a bounded request of at most 4 MiB,
updates diagnostics before sending it, handles immediate response/update ordering in either
direction, distinguishes timeout from no progress, cancels only its active owned request, never
cancels a completed file, and supports a fresh bounded request after seek.

### Media3, autoplay, and retry

`ProviderRangeDataSource` preserves the exact safe provider failure while exposing only redacted
`IOException` text to Media3. Presentation reports failure stage/code, whether zero or some bytes
reached Media3, open/read attempt, and retry availability.

Selecting media remains an explicit playback action. A successfully prepared source starts
automatically, shows buffering while waiting, and retains manual play/pause. After failure, the
Hebrew retry action increments the playback-attempt counter, rejects duplicate concurrent retry,
clears the prior Media3 error, closes the previous source session, reopens the same provider source,
shows the current stage, and terminates with success or the exact safe range code. Successful retry
starts playback without channel reload, Telegram relogin, or media reselection.

### Direct 64 KiB physical range probe

The mobile playback screen includes the Hebrew action **"בדיקת 64KiB ראשונים"**. It uses the same
production `ProviderRangeSource` without the Media3 parser, opens position zero for 65,536 bytes,
reads until the first byte, EOF, or typed failure, and reports only byte count, local/new-request
origin, stage, and safe code. It never displays or hashes content bytes and always cleans up an
opened session, including coroutine cancellation.

A successful probe followed by Media3 failure remains visibly distinct from a range-delivery
failure.

### State and update preservation

Mobile code 4 preserves the mobile application ID, Development signer, API-credential vault,
database-key envelope and alias, authenticated TDLib database/session, TDLib files, playback cache,
settings, and unrelated application state. No uninstall, clear-data, version-triggered deletion,
relogin requirement, provisioning-document reimport, or migration cleanup was added.

The shared production range repair also advances TV to code 9. The TV package, signer, app-private
identities, D-pad behavior, and secure-window policy remain intact. No TV APK was exported,
downloaded to shared storage, installed, or deployed for this milestone.

## Principal changed areas

- `core-provider`: typed range diagnostics and terminal-failure model, plus the production 64 KiB
  probe and behavior tests.
- `core-playback`: Media3 adapter diagnostics and the fresh playback-attempt/autoplay/retry runner,
  with source-byte and retry tests.
- `core-telegram`: Android local-file boundary and repaired TDLib range source, with alias,
  descriptor, completed-file, bounded-download, race, timeout, cancellation, and seek tests.
- `app-mobile`: code-4 identity, probe/retry/autoplay presentation, safe diagnostics, and ViewModel
  tests.
- `app-tv`: code-9 identity and shared playback diagnostics/retry regression presentation; no TV
  delivery.
- CI and delivery scripts: code-4/code-9 package expectations, update compatibility, native-layout
  checks, exact-HEAD selection, and mobile-only publication isolation.
- `README.md`, `TODO.md`, `CHANGELOG.md`, `AGENTS.md`, ADR 0008, and the architecture, security,
  Telegram, test, release, project-state, handoff, distribution, mobile-acceptance, Shield, and UX
  documents.

## Native artifact evidence

No TDLib native build occurred. Both mandatory commands ran in verification-only mode. The official
TDLib source remains pinned to commit
`022d60202e446ad1287b9fb68e687c8a0760788b`.

| Artifact | SHA-256 |
| --- | --- |
| Verified local AAR | `025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2` |
| Verified local Java JAR | `e39bb497b7eea1f33d7d3b5816591b7656259df29e0231c10287e514e3951a04` |
| Verified local cached JNI | `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc` |
| Packaged exact-HEAD CI JNI | `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |

The packaged JNI is ARM64, retains the existing NDK r28c identity, has 16 KiB-compatible load
alignment and uncompressed APK placement, and matches the verified native dependency allowlist.
The separately verified local and CI cache lineages retain their established byte identities; this
milestone changed neither the TDLib source pin nor native build inputs.

## Local validation

Commands actually run included:

```bash
./scripts/bootstrap-tdlib-android.sh --verify-only
./scripts/verify-tdlib-artifact.sh
./gradlew --version
./gradlew projects
./gradlew test
./gradlew lint
./gradlew :app-mobile:assembleDebug
./gradlew :app-tv:assembleDebug
./gradlew :app-mobile:testDebugUnitTest
./gradlew :app-tv:testDebugUnitTest
./gradlew :core-provider:test
./gradlew :core-playback:test
./gradlew :core-telegram:testDebugUnitTest
./gradlew :core-security:testDebugUnitTest
./scripts/verify-apk-native-layout.sh --apk MOBILE_APK
./scripts/verify-apk-native-layout.sh --apk TV_APK
./scripts/verify-mobile-apk.sh --apk MOBILE_APK
./scripts/verify-upgrade-apks.sh MOBILE_CODE_3_APK MOBILE_CODE_4_APK
./scripts/verify-upgrade-apks.sh TV_CODE_8_APK TV_CODE_9_APK
./scripts/test-inspect-pmtprov.sh
./scripts/test-verify-upgrade-apks.sh
./scripts/test-apk-phone-delivery.sh
./scripts/test-download-latest-ci-apk-rejections.sh
./scripts/test-mobile-apk-phone-delivery.sh
./scripts/test-download-latest-ci-mobile-apk-rejections.sh
node tools/verify-lan-crypto-fallback.mjs
node tools/verify-provisioning-html.mjs
node tools/verify-pmtprov-interop.mjs self-test
bash -n scripts/*.sh
bash -n scripts/lib/*.sh
./scripts/export-latest-mobile-apk-to-phone.sh
adb devices -l
git diff --check
```

JUnit XML records 423 tests, all passed with zero skips, failures, or errors:

| Module | Tests |
| --- | ---: |
| `app-tv` | 74 |
| `app-mobile` | 47 |
| `core-model` | 15 |
| `core-playback` | 30 |
| `core-provider` | 8 |
| `core-provisioning` | 48 |
| `core-security` | 96 |
| `core-telegram` | 105 |
| Total | 423 |

All 391 starting tests were preserved. Added tests cover source-open/local-read failure, failure
retention after close, unbounded-to-bounded request diagnostics, Android app-private alias
equivalence and real escape rejection, preferred descriptor opening and unsupported-operation
fallback, complete prefix-zero files and size mismatch, partial/uncached ranges, immediate
response/update races, timeout versus no progress, seek cancellation/replacement, actual Media3
bytes and zero-byte failure, probe success/failure/cancellation, playback retry counting,
duplicate blocking, source reopening, and autoplay after retry.

Additional passed evidence:

- Gradle/JDK discovery, all focused module suites, aggregate tests, lint, and both signed debug
  assemblies;
- executable WebCrypto/Kotlin interoperability, browser-crypto checks, and the provisioning
  inspector with fake inputs;
- upgrade harness: 13 cases;
- TV publication harness: 9 cases;
- TV exact-HEAD downloader rejection harness: 8 cases;
- mobile publication harness: 10 cases;
- mobile downloader harness: 19 rejection cases and 1 successful publication case;
- TDLib native-layout and shell-syntax harnesses;
- retained real mobile code 3 to 4 and TV code 8 to 9 APK update compatibility; and
- mobile-only delivery isolation, including proof that the canonical parent TV files were
  unchanged.

`adb devices -l` listed no attached device during this work. No code-4 installation, launch,
Telegram operation, probe, playback, or Shield result is claimed. JVM tests validate deterministic
contract behavior; they do not prove physical Android path behavior or real Telegram streaming.

## Local APK and publication evidence

The locally assembled mobile code-4 candidate was 56,180,091 bytes with SHA-256
`a5e7bf7deea8924baf16db99738411e69d4faae5f7bf04081f355b27759fcebf`. It passed package,
version/code, Development signer, ARM64-only ABI, packaged JNI, forbidden-content, native layout,
16 KiB alignment, and mobile code-3 update compatibility checks. The local mobile-only exporter
succeeded without changing the canonical TV files.

The TV code-9 candidate was built and inspected locally and passed package/version/code,
Development signer, ARM64/JNI, forbidden-content, native-layout, 16 KiB alignment, and TV code-8
update compatibility checks. It was intentionally not exported, downloaded, installed, or
deployed.

## Exact-final-HEAD Android CI

| Field | Value |
| --- | --- |
| Run / event / branch | `30874285005` / `push` / `main` |
| Commit | `f90882cc28d3e88912347052b717f48808e8a9a9` |
| Conclusion | completed successfully |
| Wrapper validation job | passed |
| Official TDLib, tests, lint, and signed TV/mobile APK job | passed in 7m29s |
| Mobile artifact | `private-media-tv-mobile-apk-f90882cc28d3e88912347052b717f48808e8a9a9` |
| TV artifact | exact-HEAD package-specific TV artifact uploaded; not downloaded to the phone |

The exact-HEAD run passed wrapper validation; official pinned-TDLib cache verification without a
native rebuild; CI-downloader rejection tests; browser crypto; Development signer reconstruction;
aggregate and focused tests; full lint; signed ARM64 TV/mobile assembly; package, version, signer,
JNI, native dependency, 16 KiB layout, and forbidden-content verification; metadata/checksum
generation; and separate artifact uploads. The pull-request-only signing identity check was
appropriately skipped on this push run.

## Final CI mobile-only delivery

After the successful exact-HEAD run, the exact-SHA invocation of
`./scripts/download-latest-ci-mobile-apk-to-phone.sh` selected only the unexpired mobile artifact
for remote `main`, then reverified its metadata, checksum, package, version,
Development signer, ARM64-only shape, packaged JNI identity, native dependencies, and deterministic
16 KiB layout before publishing it to the canonical package-specific Mobile shared-storage target.

| Field | Final CI mobile APK |
| --- | --- |
| Package/version | `com.funzi7.privatemediatv.mobile`, `0.1.3-phone-test` (4) |
| Size | 56,087,636 bytes |
| APK SHA-256 | `d72051203acfab14416ebbca64a238f09b237cbf77aec0740e65019e99cc80b6` |
| Fresh modification timestamp | `2026-08-04 03:26:17.795681438 +0000` |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| ABI | ARM64 only |
| Packaged JNI SHA-256 | `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |

The canonical absolute device-storage path is intentionally omitted from this public handoff. The
mobile publication was a real copied file, not a symlink. Before/after digest verification proved
that no parent TV APK or offline tool was overwritten, rotated, retimestamped, or deleted. The TV
exporter and TV CI downloader were not run.

Shared-storage delivery is not evidence of installation, launch, retained Android Keystore access,
Telegram session behavior, byte delivery, playback, or Shield acceptance.

## Security and architecture decisions

- TDLib Java/JNI types remain confined to `core-telegram`; `core-provider`, `core-model`, UI, and
  playback contracts remain provider-neutral. `core-security` remains TDLib-independent.
- The API credential vault, TDLib database-key vault, authenticated TDLib database/session, and
  downloaded files were not migrated, cleared, renamed, exposed, or repackaged.
- Range diagnostics expose only stable stages, safe codes, numeric counts/sizes, coarse origin,
  bytes-delivered status, retry availability, and cleanup state.
- No credential, key, phone number, authentication value, QR value, Telegram identity, private
  title or filename, session/database, private media, screenshot, signing secret, raw exception, or
  private path was committed, logged, displayed, or packaged.
- Mobile keeps its explicitly approved ordinary capture behavior and warning. TV secure-window
  handling was not weakened.
- No third-party TDLib binary, wrapper, hosted gateway, Bot API, media relay, analytics,
  advertising, Firebase, crash reporting, or broad storage access was introduced.
- No native rebuild, source-pin change, uninstall, clear-data action, TV export, TV installation,
  or Shield deployment occurred.

## Physical status, limitations, and risks

Physically established on code 3: update continuity without data clearing, API-vault retention,
database-key startup, Telegram authorization and connected account, channel/media discovery,
selection/navigation, known total size, and a zero-byte source failure before any observed bounded
download request.

The following remain pending and must not be inferred from JVM tests, APK inspection, CI, or file
delivery:

- installing code 4 over the existing code-3 application without uninstall or clear-data;
- automatic restoration of the connected account and retained vault/session/files/settings;
- the exact safe range stage/code on the formerly failing media;
- a physical 64 KiB probe through the production source;
- actual byte delivery into Media3, duration discovery, video, audio, pause/resume, near/far seek,
  source reopen, and a newly bounded request for uncached media;
- physical validation of Android path-alias/descriptor behavior and real TDLib response/update
  ordering; and
- TV/Shield codecs, D-pad, focus, performance, update continuity, Telegram, and playback.

The exact code-3 source failure remains unproven. A code-4 typed result may isolate the stage; a
successful code-4 probe or playback validates the repair but does not retroactively prove which
candidate caused the code-3 failure. ARM64-only packaging excludes x86/x86_64 emulators and 32-bit
devices. Phone playback success would still not prove any Shield result.

## Exact next milestone and continuation

The exact next milestone is **F1D.3 physical mobile code-4 range probe and playback acceptance**:

1. Install mobile code 4 over code 3 without uninstalling, downgrading, or clearing data.
2. Confirm Telegram remains connected without relogin or provisioning reimport.
3. Open the same previously failed media and record only its safe range stage/code.
4. Run **"בדיקת 64KiB ראשונים"** and record only byte count, coarse origin, stage, and safe code.
5. If the probe passes, start playback and verify duration, video, and audio.
6. Verify pause/resume, ten-second forward/back seek, far seek, return/reopen, and playback retry.
7. Select different previously uncached media and verify that diagnostics show a bounded new range
   request; test MP4 first and MKV when available.
8. Publish no private identity, title, identifier, screenshot, or diagnostic path.
9. Keep all TV delivery and Shield actions deferred until separate owner-directed acceptance.

Do not rebuild TDLib, clear a vault/session/cache, broaden storage access, replace safe diagnostics
with raw errors, infer a root cause without typed physical evidence, or treat a phone pass as Shield
acceptance.
