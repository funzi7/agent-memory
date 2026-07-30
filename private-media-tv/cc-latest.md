# Private Media TV — F1B Handoff

## Identity

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Completed milestone | F1B — approved authentication UI, credential provisioning, channel/video selection, and one-video range-aware Telegram playback implementation |
| Version | `0.3.0-f1b` (`versionCode` 3) |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `f44b30bf4e534f5fcc4d2b855ca69c4907764df1` |
| Main F1B implementation commit | `727b2a55a27f51a3e3f7e67b92369b5994470409` |
| CI Java-selector correction commit | `9241da8f7793d9a45341657b4e4d159b8e7cfaf6` |
| Ending application HEAD | `9241da8f7793d9a45341657b4e4d159b8e7cfaf6` |

The ending application HEAD was pushed to `origin/main`, remotely verified, used by the successful final Android CI run, and matched by the CI APK delivered to phone storage. The follow-up commit is a scoped correction after the first pushed run exposed an invalid Temurin catalog selector; history was not rewritten.

## Preserved F1A foundation

F1B preserved the official native artifact without rebuilding it:

| Property | Observed value |
| --- | --- |
| Official repository | `https://github.com/tdlib/td.git` |
| Exact TDLib commit | `022d60202e446ad1287b9fb68e687c8a0760788b` |
| Observed version | `1.8.66` |
| Target | Android API 26, `arm64-v8a` only |
| NDK / CMake | `28.2.13676358` / `3.31.6` |
| AAR SHA-256 | `025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2` |
| Java JAR SHA-256 | `e39bb497b7eea1f33d7d3b5816591b7656259df29e0231c10287e514e3951a04` |
| `libtdjni.so` SHA-256 | `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc` |

Both required verify-only commands passed against the F1A cache. APK-delivery helpers were isolated in `scripts/lib/apk-delivery.sh` so `scripts/lib/common.sh`, an input to the native build identity, remained byte-identical. No TDLib pin, source, ABI, NDK, CMake, OpenSSL input, native flag, or publication identity changed. No third-party TDLib binary, wrapper, fork, gateway, or Bot API was introduced.

The Development certificate also remains unchanged:

```text
2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0
```

`core-security` remains independent of TDLib. Raw official TDLib Java/JNI types remain confined to `core-telegram`. Existing F0 progress/player behavior and the 89-test F1A baseline remain covered.

## Modules and principal files

The application now has eight real modules:

- `app-tv`: top-level navigation, dependency wiring, Home/Settings/player presentation, focus restoration, secure-window handling, and process runtime ownership;
- `core-designsystem`: existing neutral TV engineering shell;
- `core-model`: provider-neutral media/progress models;
- `core-playback`: existing progress policy plus the Media3 provider-range `DataSource`;
- `core-provider`: provider-neutral provider and range-source contracts;
- `core-provisioning`: private-LAN provisioning protocol/server, `.pmtprov` codec, validation, and fakes;
- `core-security`: TDLib database-key protection plus the separately aliased Telegram credential vault;
- `core-telegram`: the sole official TDLib adapter, authorization commands, session controller, channel/video queries, and range reader.

Principal delivered file groups include:

- Settings navigation and presentation under `app-tv/src/main/kotlin/com/funzi7/privatemediatv/settings/`, with corresponding app tests;
- credential storage additions under `core-security`;
- provisioning implementation and compatibility tests under `core-provisioning`;
- authorization, content-query, session-lifecycle, and range implementation under `core-telegram`;
- provider-neutral range contracts under `core-provider` and Media3 integration under `core-playback`;
- the offline tool `tools/telegram-provisioning-file.html` and its Node verifiers;
- canonical phone-delivery logic in `scripts/lib/apk-delivery.sh`, `scripts/export-latest-apk-to-phone.sh`, and `scripts/download-latest-ci-apk-to-phone.sh`;
- expanded pinned `.github/workflows/android-ci.yml`;
- `docs/TELEGRAM_PROVISIONING.md`, `docs/F1B_SHIELD_ACCEPTANCE.md`, ADRs 0007–0008, and reconciled product, architecture, security, UX, test, release, state, distribution, and handoff documents.

No empty feature module, permanent catalog, background index, allowlist manager, phone app, backend, or synchronization module was added.

## Approved UX implemented

The previously unresolved authentication choices are now approved and implemented:

- Telegram setup is available only through Settings.
- **"הגדרות"** is the third Home action card; Back returns Home and focus returns to that card.
- Settings is Hebrew-first and RTL-capable, with Telegram, application-information, and destructive-action sections.
- Credential provisioning is clearly separate from account login.
- Local-network QR provisioning is primary; **"ייבוא קובץ מוצפן"** is the offline fallback.
- Account login defaults to Telegram QR. **"שיטת התחברות אחרת"** opens the phone-number path.
- Phone number, code, email challenge, and two-step password use the Android TV/system keyboard.
- Disconnect and reset are separate two-step-confirmed actions.
- **"ניתוק Telegram"** removes the device session, TDLib database/files/cache, and temporary Telegram selection state while retaining provisioned API credentials and unrelated application state.
- **"איפוס האפליקציה"** removes all app-owned local state, including the Telegram session, credential vault and aliases, settings, progress/mappings, and temporary selections.
- **"בדיקת ניגון"** is a diagnostic Ready-only channel → video → range-player path, not a catalog.

Settings status distinguishes credentials absent, credentials present without a session, authentication in progress, connected, recoverability failure, disconnecting, and reset required. Sensitive credential/challenge values, raw TDLib state, internal identifiers, and TDLib paths are excluded from UI semantics and diagnostic presentation.

## Credential provisioning and security

Telegram API credentials are provisioned at runtime and are not compiled into the APK.

The credential vault uses:

- a dedicated non-exportable `AndroidKeyStore` AES-256 key distinct from the TDLib database-key wrapping alias;
- `AES/GCM/NoPadding` and a fresh random IV;
- a versioned authenticated envelope in app-private atomic storage;
- public status limited to `NotProvisioned`, `Provisioned`, and `InvalidOrUnavailable`;
- fail-closed handling for corrupt or unavailable key material;
- explicit credential deletion only during full reset.

The local provisioning flow owns one ephemeral server/session. It:

- selects only an eligible private-LAN interface;
- uses a uniformly random 256-bit fragment secret, which is base64url-decoded directly as the one-session AES-256 key;
- keeps the secret out of the HTTP path/query and authenticates format/session/IV metadata as AES-GCM AAD;
- accepts one bounded encrypted submission, rejects wrong sessions/replay/malformed or oversized bodies, rate-limits attempts, and expires within five minutes;
- stops on success, cancel, timeout, navigation away, or process stop;
- reports **"אין רשת מקומית זמינה"** when no eligible interface exists;
- logs neither request bodies nor credentials.

This protects the payload against passive LAN observation. The page is served over local HTTP, not authenticated TLS; an actively compromised LAN or browser environment remains outside this protection. Use is limited to a trusted private LAN.

The `.pmtprov` fallback is versioned and interoperable between Kotlin and the offline HTML tool. It uses PBKDF2-HMAC-SHA256 with 600,000 iterations, a random salt, AES-256-GCM, a random IV, authenticated non-sensitive metadata, and a 16–128 printable-ASCII passphrase rule to avoid cross-runtime normalization ambiguity. Import uses `ACTION_OPEN_DOCUMENT`, reads through the content URI, retains no long-term URI permission or plaintext copy, requires confirmation before replacing valid credentials, and never deletes the owner-managed external file.

The self-contained HTML tool makes no network request and uses no browser storage. It clears input fields after generating the encrypted file and instructs the owner to keep the file and passphrase separate.

No real Telegram credential, account challenge, login QR, session, private chat/channel value, or private media value was used or recorded.

## Telegram authorization and restoration

The UI issues real provider-neutral commands through `core-telegram`; raw TDLib objects do not cross the module boundary.

- At the valid phone-number authorization state, the default path requests another-device QR authentication.
- The current ephemeral QR is refreshed when TDLib updates it and explicitly queried again when the screen becomes active.
- QR presentation is cleared when state changes, phone fallback begins, or the route closes; late updates cannot republish it to an inactive screen.
- Phone fallback performs the real bounded lifecycle transition needed before accepting phone input.
- Real state-driven commands exist for phone number, authentication code, email address/code, two-step password, registration, premium blocking, retryable errors, ready, logout, closing/closed, and unknown future states.
- Challenge values are neither saveable nor restored. Inputs are cleared after submission or state transition.
- One process-owned runtime is reused across Activity recreation. A true process restart rebuilds from protected credentials/session storage and TDLib's current authorization state.
- Runtime startup/replacement and destructive operations share one serializer. Close/logout have bounded, deterministic outcomes.

These behaviors were validated with deterministic fakes and JVM tests. No physical restart, real Telegram login, or Android Keystore device behavior was tested.

## Diagnostic channel, video, and playback spike

The diagnostic selector:

- reads TDLib's maintained main chat-list/update model;
- shows broadcast channels only;
- caps channel loading at four pages of 50;
- restores focus to the selected opaque item after returning;
- caps recent-media loading at five pages of 40;
- maps TDLib video messages and conservatively recognized video documents, including MP4/MKV candidates when metadata supports them;
- deduplicates by opaque identity and sorts newest first;
- creates no persistent allowlist, background index, or catalog.

Presentation models contain no raw TDLib types or public identifiers. Latest-generation gates and lifecycle-owned jobs prevent obsolete channel/media/play requests from mutating state or navigating after a newer request or Back.

The provider-neutral playback path consists of:

- an opaque playable source and range-reader contract;
- a TDLib-backed reader that starts at arbitrary offsets, reuses available local prefix bytes, requests bounded ranges, waits for ordered file updates, supersedes obsolete seek work, and coordinates one active range per file;
- a configurable initial 4 MiB window, documented as an unmeasured engineering default;
- a Media3 `DataSource` supporting zero/non-zero position, known and unknown requested lengths, exact end, beyond-end failure, repeated open/seek/close, cancellation, timeout, and redacted errors;
- a diagnostic player with play/pause, ±10-second seek, far D-pad seek, position/duration/buffering state, and non-sensitive byte/range/cache diagnostics.

No public HTTP media URL or proxy exists. TDLib paths and internal IDs are not displayed or logged. A close timeout remains a redacted failure and prevents a conflicting future open until cleanup succeeds; it is never reported as a false closed result.

No real channel discovery, video selection, TDLib byte-range read, MP4/MKV playback, seek, or cache-reuse behavior was physically tested.

## Local validation

Observed application toolchain:

- Gradle `9.5.0`;
- JDK `21.0.11`;
- Android Gradle Plugin `9.3.0`;
- Kotlin plugin `2.2.10`;
- compile/target SDK 36 and minimum SDK 26;
- preserved native NDK `28.2.13676358` and CMake `3.31.6`.

Required validation commands included:

```bash
./scripts/bootstrap-tdlib-android.sh --verify-only
./scripts/verify-tdlib-artifact.sh
./gradlew --version
./gradlew projects
./gradlew test
./gradlew lint
./gradlew :app-tv:testDebugUnitTest :app-tv:lint :app-tv:assembleDebug
bash -n scripts/*.sh
bash -n scripts/lib/*.sh
./scripts/test-apk-phone-delivery.sh
./scripts/test-download-latest-ci-apk-rejections.sh
node tools/verify-lan-crypto-fallback.mjs
node tools/verify-provisioning-html.mjs
./scripts/export-latest-apk-to-phone.sh
./scripts/deploy-shield.sh
./scripts/download-latest-ci-apk-to-phone.sh
/opt/android-sdk/platform-tools/adb devices -l
qemu-x86_64 /opt/android-sdk/platform-tools/adb devices -l
```

Generated JUnit XML records **205 tests with zero failures, errors, or skips**:

| Module | Tests |
| --- | ---: |
| `app-tv` | 27 |
| `core-model` | 15 |
| `core-playback` | 23 |
| `core-provider` | 2 |
| `core-provisioning` | 30 |
| `core-security` | 39 |
| `core-telegram` | 69 |

Aggregate tests, focused app tests, full lint, signed assembly, seven phone-delivery migration cases, eight CI-downloader rejection cases, both HTML/JavaScript checks, and static dependency/secret/supply-chain audits passed. No raw TDLib import exists outside `core-telegram`; no third-party TDLib dependency was found; tracked-tree and complete-history secret checks found no blocker.

The JVM tests validate behavior through fakes and temporary files. They do not establish physical TDLib networking/playback or hardware-backed Android Keystore behavior.

## Local APK and phone delivery

The verified local APK was:

| Field | Value |
| --- | --- |
| Build path | `app-tv/build/outputs/apk/debug/app-tv-debug.apk` |
| Package / version | `com.funzi7.privatemediatv` / `0.3.0-f1b` (3) |
| Size | 57,060,117 bytes |
| APK SHA-256 | `573e115ffd096b4a8ed65a71efa0cbd268489e52667cc82cbb83695d272c3c4e` |
| Signer | Expected Development certificate |
| Native payload | `arm64-v8a` only; stripped Android 26 ARM64 `libtdjni.so` |

Package, version, signer, ABI, JNI identity, ELF target, and forbidden packaged credential/key/session content checks passed.

The mandatory local export passed at `/storage/emulated/0/Download/PrivateMediaTV/`. At that stage, `private-media-tv-latest.apk` was the local F1B APK, `private-media-tv-previous.apk` was the distinct valid F1A APK, and `telegram-provisioning-file.html` was present. Exactly the three allowed names remained; no unrelated file existed or was deleted.

This is verified file delivery to phone storage, not installation or launch.

## Pushed CI evidence

The first pushed F1B run was retained as factual failure evidence:

- run `30545924175` for main implementation commit `727b2a55a27f51a3e3f7e67b92369b5994470409`;
- Gradle wrapper validation passed;
- the build job failed at Java setup because the Temurin catalog rejected selector `21.0.11+10`;
- all TDLib, signing, test, lint, APK, metadata, and artifact steps were skipped;
- no artifact was uploaded.

The workflow was corrected to the catalog's exact `21.0.11+10.0.LTS` identifier in the non-destructive follow-up commit.

Final Android CI evidence:

| Field | Value |
| --- | --- |
| Run ID | `30546085295` |
| Event / branch | `push` / `main` |
| Commit | `9241da8f7793d9a45341657b4e4d159b8e7cfaf6` |
| Result | Completed successfully |
| Wrapper job | `90882467403`, passed |
| TDLib/test/lint/APK job | `90882508829`, passed |
| Artifact ID | `8761004003` |
| Artifact name | `private-media-tv-apk-9241da8f7793d9a45341657b4e4d159b8e7cfaf6` |
| Archive size | 56,932,698 bytes |
| Archive digest | `sha256:51e61b696ea952e0ba7c4004c1b6d48aab4955d09480162ac115dc1c6c4feb8b` |
| Retention expiry | `2026-08-29T13:23:43Z` |

Both jobs passed. Applicable steps passed for exact Java/Gradle/SDK/NDK setup, official pinned TDLib cache restoration and verification, delivery/HTML checks, Development signing reconstruction and public-fingerprint verification, aggregate and focused tests, lint, signed ARM64 assembly, package/version/signer/native/forbidden-content inspection, checksum and non-sensitive metadata creation, artifact upload, signing-material deletion, and post-job cleanup. The pull-request-only isolated signer was correctly skipped on the main push.

GitHub emitted a non-failing annotation that two pinned actions targeting Node.js 20 were forced onto Node.js 24. It did not affect this successful run, but future action-pin maintenance should address the deprecation.

CI ran without real Telegram credentials or an account.

## CI APK phone delivery

After final-HEAD CI succeeded, the mandatory downloader selected only the successful `Android CI` main-push run for current `origin/main`, required the expected unexpired artifact, and verified its commit metadata, package, version, ABI, checksum, and signer before canonical publication.

Final phone directory state:

| File | Evidence |
| --- | --- |
| `private-media-tv-latest.apk` | CI F1B APK; 56,931,759 bytes; SHA-256 `86d9788d2efc48b095fb61c0952b80c7abd0ed1cbb1f2b3bc6ae5c59f52a64b5` |
| `private-media-tv-previous.apk` | distinct local F1B APK; 57,060,117 bytes; SHA-256 `573e115ffd096b4a8ed65a71efa0cbd268489e52667cc82cbb83695d272c3c4e` |
| `telegram-provisioning-file.html` | 6,066 bytes; SHA-256 `ff56a206d462c5f1f1a71644e04814564f47b1d801b58e4af1dab2245602f26f` |

Both APKs independently verify as package `com.funzi7.privatemediatv`, version `0.3.0-f1b`/3, and the expected Development signer. The latest contains only `arm64-v8a` native entries and includes `libtdjni.so`. Latest and previous are distinct regular files, neither is a symlink, no checksum/version-named APK remains, and exactly these three allowed files are present.

The downloader reported rotation performed and zero historical removals. The former F1A `previous` was replaced only through the bounded canonical previous-slot rotation; no unrelated phone file was touched.

## Physical status and blocker

The actual SDK `adb` binary is x86 on this ARM host: direct execution exited 132. Running that SDK binary through `qemu-x86_64` produced an empty device list. No authorized Android device was available.

The owner currently has no local wireless network. `scripts/deploy-shield.sh` exited 3 with no configured address and correctly reported not configured/not attempted.

F1B automated implementation and delivery are complete, but physical acceptance was **not performed**. No claim is made for:

- APK installation or application launch;
- Android phone runtime behavior;
- NVIDIA Shield connection, installation, launch, or deployment;
- D-pad, focus return, Hebrew/RTL, system keyboard, or accessibility behavior;
- Android Keystore device or hardware-backed behavior;
- trusted-LAN QR provisioning or encrypted-file import on TV;
- real Telegram credential use, login, session restoration, channel/video discovery, or disconnect/reconnect;
- real MP4/MKV Telegram playback, near/far seek, later-range request, reopen, or cache reuse.

The exact blocker before full catalog development is successful execution of `docs/F1B_SHIELD_ACCEPTANCE.md` on an authorized NVIDIA Shield with a trusted LAN and an owner-controlled Telegram account/media sample. Full channel indexing and catalog construction remain blocked until that procedure passes.

## Risks and limitations

- Local HTTP provisioning encrypts the payload against passive observation but does not provide authenticated TLS or resist an actively compromised LAN/browser.
- Browser/Web Crypto behavior and Storage Access Framework import need device validation.
- Keystore invalidation, process death/restoration, and device-filesystem behavior need physical validation.
- The 4 MiB range window is an unmeasured initial policy, not an optimized result.
- MP4/MKV success depends on actual container/codecs, TDLib cache behavior, Media3 extractors, and Shield capabilities.
- ARM64-only packaging excludes x86/x86_64 emulators and 32-bit devices.
- Upgrade continuity depends on preserving the external Development signing identity.
- The current settings/channel/video/player presentation is an engineering diagnostic shell, not final catalog design.
- Pinned CI actions that still declare Node.js 20 should be refreshed in a future scoped maintenance change before platform enforcement changes.

## Remaining product decisions

Only these remain unresolved:

- final catalog visual identity;
- permanent channel allowlist UX;
- full catalog navigation;
- subtitles;
- movie auto-completion;
- phone application;
- synchronization.

The Settings entry, QR-default login, phone fallback, system keyboard, credential-provisioning methods, disconnect/reset scopes, and one-video diagnostic path are approved and must not be reopened.

## Continuation instructions

1. Run both repository preflights and preserve unrelated work.
2. Verify application HEAD `9241da8f7793d9a45341657b4e4d159b8e7cfaf6`, successful run `30546085295`, and artifact `private-media-tv-apk-9241da8f7793d9a45341657b4e4d159b8e7cfaf6`.
3. Do not add real credentials to source, CI, logs, screenshots, or public handoffs; provision them only on the owner-controlled device.
4. On an authorized Shield and trusted LAN, perform every step in `docs/F1B_SHIELD_ACCEPTANCE.md` and record pass/fail without private values.
5. Diagnose and fix any physical provisioning, authorization, restoration, playback, range-seek, focus, RTL, or Keystore defect before broader catalog work.
6. Do not begin full indexing/catalog construction until physical F1B Shield acceptance passes.
7. Preserve official TDLib pin/artifact identity and Development signer unless a factual scoped defect requires an explicit change.
8. Continue the permanent local build, local phone export, successful pushed CI, matching CI APK phone delivery, and evidence workflow for every meaningful milestone.
