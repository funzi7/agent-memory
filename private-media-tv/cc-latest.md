# Private Media TV — F1A Handoff

## Identity

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Completed milestone | F1A — TDLib infrastructure, secure authentication foundation, stable signing, and APK delivery |
| Version | `0.2.0-f1a` (`versionCode` 2) |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `a451eb93ba73f6f51671c9a334fae079f48ddef1` |
| Main F1A implementation commit | `6f94d2decc000e90bd272d97332f466d54e7e6be` |
| CI syntax correction commit | `f44b30bf4e534f5fcc4d2b855ca69c4907764df1` |
| Ending application HEAD | `f44b30bf4e534f5fcc4d2b855ca69c4907764df1` |

The ending application HEAD was pushed to `origin/main`, remotely verified, and used by the successful final Android CI run and downloaded CI APK. The second commit is a scoped, non-destructive follow-up after the first real pushed run exposed a shell quoting defect in APK inspection; history was not rewritten.

## Delivered scope

F1A added two real modules:

- `core-security`, independent of TDLib;
- `core-telegram`, the only module allowed to import official TDLib Java/JNI types.

The intended dependency direction is:

```text
app-tv
  └── core-telegram
        ├── core-security
        └── core-model
```

`core-telegram` did not need a `core-provider` dependency in F1A. `core-model` and `core-provider` remain free of TDLib types. The existing `core-playback` and `core-designsystem` modules remain in place. No empty channel, catalog, database, synchronization, phone, or backend module was added.

Major delivered file groups include:

- reproducible TDLib inputs and tooling in `gradle/tdlib-source.properties`, `scripts/bootstrap-tdlib-android.sh`, `scripts/verify-tdlib-artifact.sh`, `scripts/install-tdlib-build-deps-debian.sh`, and `third_party/tdlib/README.md`;
- Android Keystore and database-key lifecycle implementation plus JVM fakes/tests under `core-security`;
- provider-neutral authorization/configuration/runtime contracts, official TDLib adapter, session controller, request bridge, deterministic fakes, and tests under `core-telegram`;
- stable Development signing inputs and tooling in `gradle/development-signing.properties`, `scripts/setup-dev-signing.sh`, `scripts/configure-ci-dev-signing.sh`, and `scripts/verify-apk-signing.sh`;
- verified distribution tooling in `scripts/export-latest-apk-to-phone.sh`, `scripts/download-latest-ci-apk-to-phone.sh`, and `scripts/deploy-shield.sh`;
- expanded `.github/workflows/android-ci.yml`;
- operating documents for TDLib, signing, APK distribution, architecture, security, Telegram integration, tests, release review, state, handoff, and ADRs 0004–0006;
- a generalized permanent `AGENTS.md` workflow.

`app-tv` depends on `core-telegram` so the ARM64 native library is packaged. F1A did not add a Telegram login button, setup card, dialog, form, screen, navigation destination, or other authentication UX. The existing Home layout and navigation remain unexposed to Telegram setup.

## Official TDLib provenance

| Property | Observed value |
| --- | --- |
| Official repository | `https://github.com/tdlib/td.git` |
| Exact pinned commit | `022d60202e446ad1287b9fb68e687c8a0760788b` |
| Observed TDLib version | `1.8.66` |
| Interface | Official generated Java classes and JNI implementation |
| Target ABI | `arm64-v8a` only |
| Minimum Android API | 26 |
| Android NDK | `28.2.13676358` |
| CMake | `3.31.6` |
| OpenSSL | `3.5.7`; source SHA-256 `a8c0d28a529ca480f9f36cf5792e2cd21984552a3c8e4aa11a24aa31aeac98e8` |
| Build flags | OpenSSL `no-asm` and `-O3`; TDLib CMake `Release`, `TD_ENABLE_LTO=OFF`, `-O3`; `c++_static`; stripped distribution |
| Build-input identity | `2626ee01819da447548931dcbc50f18859b49c148a0bdeb35dfb3e3613f939df` |
| AAR SHA-256 | `025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2` |
| Java JAR SHA-256 | `e39bb497b7eea1f33d7d3b5816591b7656259df29e0231c10287e514e3951a04` |
| `libtdjni.so` SHA-256 | `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc` |

The source checkout and generated artifacts remain in ignored caches, not source control. Bootstrap locking covers substantive cache mutation, validates the official remote and exact commit, rejects partial output, records hashes/metadata, and reuses only a verified artifact whose pin and toolchain identity match. The project build fails with the bootstrap command when the artifact is absent or invalid.

The final official JNI build reached `574/574`. Internal publication verification, the standalone verifier, current-toolchain `--verify-only`, and a verified-cache rerun all passed. Required license and source-attribution material is carried with the generated artifact.

No third-party TDLib Maven package, AAR, Kotlin wrapper, fork, opaque native library, Bot API, or hosted Telegram gateway is present. Host Linux libraries are not packaged. x86, x86_64, and 32-bit devices are outside F1A.

## Security design

`core-security` implements:

- an app-specific, non-exportable `AndroidKeyStore` AES-256 key;
- `AES/GCM/NoPadding` with a fresh random IV for every encryption;
- `SecureRandom` generation of the random 32-byte TDLib database encryption key;
- a versioned, authenticated envelope containing only format/algorithm data, IV, ciphertext/tag, and non-private creation metadata;
- app-private, atomic envelope storage;
- injectable cipher, wrapping-key, storage, database-presence, and randomness boundaries for JVM behavior tests.

Lifecycle behavior is fail closed:

- no database and no envelope creates and protects one new database key;
- an existing envelope is decrypted and reused;
- an existing database with a missing envelope is a fatal recoverability error and never causes key regeneration;
- an unavailable or invalidated Keystore key is fatal and non-destructive;
- corrupt or tampered envelopes are rejected without replacement;
- explicit session deletion exists only through a clearly named API, requires the runtime to be closed, and is not wired to UI.

Plaintext key bytes are scoped to use and cleared. Telegram sessions, databases, downloads, and temporary files remain in app-private storage. Android backup and data extraction remain disabled. A backend never holds a Telegram session and never relays Telegram media.

JVM tests validate lifecycle policy, codecs, redaction, and injectable storage/cipher behavior. They do not prove physical or hardware-backed Android Keystore behavior.

## Telegram runtime foundation

`core-telegram` exposes provider-neutral authorization, configuration, command-result, runtime-health, gateway, repository, runtime, and session-controller APIs. Raw TDLib objects do not cross its public boundary.

The pinned TDLib authorization states map to domain states for:

- TDLib parameters;
- phone number;
- another-device/QR confirmation;
- authentication code;
- email address;
- email code;
- two-step-verification password;
- registration;
- premium purchase;
- ready;
- logging out;
- closing;
- closed;
- unknown or future unsupported constructors.

Sensitive challenge material is excluded from printable representations, errors, logs, analytics, and persisted debug state. QR links are not persisted and may exist only in the shortest-lived future in-memory presentation path.

The runtime uses structured concurrency, one process-wide lease for the current database owner, ordered authorization updates, cancellation-safe request handling, a terminal request bridge, bounded close/logout waits, explicit lifecycle operations, and redacted failures. Callback queues contain mapped authorization state or a redacted failure marker rather than raw updates.

TDLib database, downloaded-file, and temporary paths are app-private. Message, file, and chat-info databases are prepared for the future client; secret chats, contact synchronization, and unrelated Telegram work are not enabled. Logging is conservative and sensitive file logging is disabled by default.

Configuration contains no real credentials. Absent credentials produce `NotConfigured` and do not create a TDLib client or network session. Placeholder or malformed values fail validation before startup. Future external configuration is Git-ignored and must never be logged.

No real Telegram API credential, phone number, authorization code, password, email challenge, QR login, session, network authentication, channel discovery, indexing, or Telegram media playback was used in F1A.

## Development signing

F1A created and preserved one Development-only signing identity shared by local builds and main-push CI delivery builds. This is not production signing.

The public certificate SHA-256 fingerprint is:

```text
2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0
```

Two local setup invocations preserved the same key and fingerprint. Two forced local APK assemblies used the same signer. The CI signing setup updated the four required Actions secrets through authenticated `gh` without printing values. Main-push CI reconstructed the key only in runner-temporary storage, verified the public fingerprint, and deleted signing material during cleanup. Pull requests use an isolated ephemeral signer and do not publish delivery APKs.

No keystore, signing property file, password, Telegram credential, session, database, private log, or private media was committed, placed in public agent-memory, or uploaded in the artifact.

## Local validation

Observed local environment:

- Gradle `9.5.0`;
- JVM `21.0.11`;
- Linux ARM64 host;
- seven Gradle projects;
- TDLib Android API 26, application compile/target SDK 36, NDK `28.2.13676358`, and CMake `3.31.6`.

The dependency installer added only packages that were absent: `cmake`, `file`, `gperf`, `ninja-build`, `default-jdk-headless`, `php-cli`, and `zip`.

The required commands were run, including:

```bash
./scripts/install-tdlib-build-deps-debian.sh
./scripts/bootstrap-tdlib-android.sh
./scripts/bootstrap-tdlib-android.sh --verify-only
./scripts/verify-tdlib-artifact.sh
./scripts/setup-dev-signing.sh
./scripts/setup-dev-signing.sh
./scripts/configure-ci-dev-signing.sh
./gradlew --version
./gradlew projects
./gradlew :core-security:testDebugUnitTest
./gradlew :core-telegram:testDebugUnitTest
./gradlew test
./gradlew lint
./gradlew :app-tv:assembleDebug
./scripts/test-download-latest-ci-apk-rejections.sh
./scripts/verify-apk-signing.sh --apk app-tv/build/outputs/apk/debug/app-tv-debug.apk
./scripts/export-latest-apk-to-phone.sh
./scripts/deploy-shield.sh
adb devices -l
EXPECTED_COMMIT_SHA=f44b30bf4e534f5fcc4d2b855ca69c4907764df1 \
  ./scripts/download-latest-ci-apk-to-phone.sh
```

Passed local evidence:

- 89 aggregate tests with zero failures, errors, or skips;
- 28 focused `core-security` JVM tests;
- 40 focused `core-telegram` JVM tests without Telegram network access;
- all prior model/provider/playback/navigation tests;
- Android lint;
- two forced signed debug APK assemblies;
- shell syntax for every shell script;
- eight unsuitable-CI-run downloader rejection cases;
- idempotent signing setup and stable signer verification;
- verified TDLib cache reuse;
- missing and deliberately corrupt TDLib artifact fail-closed gates;
- AAR/JAR/native-content verification;
- all-module dependency graph audit with no third-party TDLib;
- tracked-tree and complete-history checks for signing, credential, session, database, and generated-cache material;
- temporary-directory APK export behavior;
- no-address Shield negative path.

The final local APK evidence was:

| Field | Value |
| --- | --- |
| Build path | `app-tv/build/outputs/apk/debug/app-tv-debug.apk` |
| Package | `com.funzi7.privatemediatv` |
| Version | `0.2.0-f1a` (`versionCode` 2) |
| Size | 56,349,059 bytes |
| APK SHA-256 | `5fd25d6435f222bb5dac665f8210aac620ad5ef2394630eec7ac41077f9f5685` |
| Signature | Valid APK Signature Scheme v2; one expected Development signer |
| Native entries | `lib/arm64-v8a/libandroidx.graphics.path.so`, `lib/arm64-v8a/libtdjni.so` |
| TDLib native identity | Stripped Android 26 AArch64 ELF |

No unexpected ABI, signing key, real Telegram credential, database, session, or other forbidden content was found in the APK.

## Local APK phone export

The mandatory local export passed:

- directory: `/storage/emulated/0/Download/PrivateMediaTV/`;
- versioned copy: `private-media-tv-0.2.0-f1a-5fd25d6435f2.apk`;
- latest copy: `private-media-tv-latest.apk`;
- size: 56,349,059 bytes;
- APK SHA-256: `5fd25d6435f222bb5dac665f8210aac620ad5ef2394630eec7ac41077f9f5685`;
- signer: the Development certificate recorded above.

Both destinations were real copied files, not symlinks. This was APK file delivery to phone storage, not installation, launch, runtime testing, or deployment.

## Pushed CI evidence

The first pushed F1A run was intentionally recorded rather than hidden:

- run `30510514881` for commit `6f94d2decc000e90bd272d97332f466d54e7e6be`;
- wrapper validation, official TDLib bootstrap/verification, signing reconstruction/fingerprint verification, aggregate and focused tests, lint, and signed APK assembly passed;
- APK inspection then failed closed because the native-entry command substitution had an unmatched quote;
- metadata generation and artifact upload were skipped, so that run produced no delivery artifact.

The exact shell defect and factual failure were documented. A one-character syntax correction and state reconciliation were committed without rewriting history. All workflow literal shell blocks passed `bash -n`, and the corrected APK-verifier block passed locally against the real APK.

Final Android CI evidence:

| Field | Value |
| --- | --- |
| Run ID | `30512411902` |
| Event / branch | `push` / `main` |
| Commit | `f44b30bf4e534f5fcc4d2b855ca69c4907764df1` |
| Result | Completed successfully |
| Wrapper job | `90775083287`, passed |
| TDLib/test/lint/APK job | `90775106612`, passed |
| Artifact ID | `8748001721` |
| Artifact name | `private-media-tv-apk-f44b30bf4e534f5fcc4d2b855ca69c4907764df1` |
| Archive size | 56,349,998 bytes |
| Archive digest | `sha256:b67aa2a8081bd3d49397b31296669bd99844bc2dc4f40923118de6a1bf2017dd` |
| Retention expiry | `2026-08-29T04:19:15Z` |

Both CI jobs passed. Every applicable main job step passed: official TDLib build/verification, downloader rejection tests, Development signing reconstruction and fingerprint verification, unit and focused tests, lint, signed ARM64 assembly, corrected package/signer/TDLib inspection, checksum and non-sensitive metadata generation, artifact upload, signing cleanup, and post-job cleanup. The pull-request-only isolated signing step was correctly skipped on this push.

The artifact contains only the signed APK, checksum, and non-sensitive build metadata. A non-failing platform annotation warned that pinned actions using Node.js 20 were forced onto Node.js 24; it did not affect the successful result.

## CI APK phone delivery

After the final run succeeded, the mandatory downloader selected only the successful `Android CI` main-push run for the current remote HEAD, required the one expected non-expired artifact, and verified commit metadata, package, version, ABI, checksum, and signer before copying.

Observed CI APK delivery:

| Field | Value |
| --- | --- |
| Workflow run | `30512411902` |
| Commit | `f44b30bf4e534f5fcc4d2b855ca69c4907764df1` |
| Package / version | `com.funzi7.privatemediatv` / `0.2.0-f1a` (2) |
| Versioned destination | `/storage/emulated/0/Download/PrivateMediaTV/private-media-tv-0.2.0-f1a-31b5a3e70afc.apk` |
| Latest destination | `/storage/emulated/0/Download/PrivateMediaTV/private-media-tv-latest.apk` |
| APK size | 56,349,059 bytes |
| APK SHA-256 | `31b5a3e70afc5cbd5eb5b053563bd545056b2c58d03cc4b404b1662d8e8e352c` |
| Signer | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |

Direct storage verification confirmed that the versioned and latest destinations are regular files, byte-identical, and carry the same checksum. Independent SDK-tool inspection confirmed the expected package, version, version code, valid v2 signature, one Development signer, and only ARM64 native entries including `libtdjni.so`.

The local and CI APK byte hashes differ, but both use the same verified Development certificate and contain the same required package/version/ABI. The CI APK is now the real `private-media-tv-latest.apk` copy.

## Physical checks and limitations

`adb devices -l` completed with no listed device.

The owner had no local wireless network. `scripts/deploy-shield.sh` was run only as the required negative-path check; it exited 3 because no Shield address was configured and reported not configured/not attempted. This is not a deployment pass.

No claim is made for:

- app installation or launch;
- physical Android phone runtime testing;
- physical Android TV or NVIDIA Shield testing;
- Shield connectivity or deployment;
- D-pad, focus, Hebrew/RTL, or accessibility behavior;
- Android Keystore operation on a device or hardware-backed key storage;
- TDLib native loading or session resume on a device;
- Telegram network authentication;
- Telegram media playback.

Known residual risks and limitations include:

- native build cost and cache/toolchain portability;
- OpenSSL assembly acceleration is disabled in this deterministic cross-toolchain path, with physical performance unmeasured;
- external Development-keystore continuity;
- device-filesystem crash durability and resistance to a privileged or same-UID concurrent ancestor-swap race;
- physical Keystore invalidation/recovery behavior;
- real-account authentication and process-recreation behavior;
- range-aware TDLib/Media3 playback.

F1A did not implement channel discovery, channel selection, message indexing, catalog construction, media-record persistence, metadata/ratings/trailers, production signing, or production deployment.

## Unresolved UX decisions

The owner has not yet approved:

1. where Telegram setup is entered;
2. whether QR or phone-number login is the initial/default path;
3. how fallback authentication methods are exposed;
4. how logout and destructive local-session deletion are confirmed;
5. the final Stremio-inspired, Netflix-inspired, or separately approved hybrid catalog direction.

F1A intentionally does not decide or expose these choices.

## Exact next milestone

**F1B — approved authentication UI, real Telegram login, and one-video range-aware playback spike**

Full channel indexing and catalog construction remain blocked until F1B is physically tested on the NVIDIA Shield TV.

## Continuation instructions

1. Run both repository preflights and preserve all unrelated work.
2. Verify application HEAD `f44b30bf4e534f5fcc4d2b855ca69c4907764df1`, successful run `30512411902`, and artifact `private-media-tv-apk-f44b30bf4e534f5fcc4d2b855ca69c4907764df1`.
3. Obtain explicit owner approval for setup placement, default login method, fallback presentation, and destructive-session confirmation before adding authentication UX.
4. Keep any future Telegram credentials and session data external, device-local, redacted, and outside Git, CI artifacts, screenshots, and public handoffs.
5. On an authorized target, physically validate Keystore behavior, TDLib native loading, real login/session resume, D-pad authentication flow, and one authenticated range-aware video playback spike.
6. Do not begin full channel indexing or catalog construction until the F1B Shield acceptance evidence exists.
7. Continue the permanent build, local phone export, successful pushed CI, matching CI APK phone delivery, and evidence workflow for every meaningful milestone.
