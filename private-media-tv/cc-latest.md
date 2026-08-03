# Private Media TV — F1D Handoff

## Identity

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Completed milestone | F1D — lightweight Android phone acceptance harness using the existing shared implementation |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `73a855e07e3cbcc2832ce6d3063958a9f434c16c` |
| Final application HEAD | `8782f7cd12dd5ea91c9cd3cffacaf80946ab9b89` |
| Mobile package / version | `com.funzi7.privatemediatv.mobile` / `0.1.0-phone-test` (`versionCode` 1) |
| Preserved TV package / version | `com.funzi7.privatemediatv` / `0.3.3-f1c2` (`versionCode` 6) |

The application changes were pushed without rewriting history. Local `HEAD`, `origin/main`, the successful final Android CI run, and the final mobile artifact metadata all identify the final application SHA above. The orderly F1D implementation commit is `0e32c9f8aae5fca2e25a09fc0c36bb1e2d232ec6`; the scoped follow-up `8782f7cd12dd5ea91c9cd3cffacaf80946ab9b89` corrects an artifact-lineage verification issue exposed only by the first post-push delivery rehearsal.

## Milestone purpose and scope

F1D adds one installable Android phone application, `:app-mobile`, so the owner can physically exercise the real shared Private Media TV pipeline before repeatedly moving TV builds to an NVIDIA Shield. It is a compact diagnostic harness, not the final consumer phone product and not a redesign of the approved TV application.

The separate package gives the mobile harness its own Android data sandbox, preferences, Keystore entries, TDLib session/database/download paths, and reset boundary. It does not communicate with or control the Shield. F1D does not add synchronization, permanent cataloging, TMDB, subtitles, production signing, Play Store delivery, backend services, analytics, advertising, Firebase, crash reporting, or torrent support.

## Implemented behavior

### Mobile module and diagnostic Home

- `:app-mobile` is registered in `settings.gradle.kts` and depends directly on the existing shared model, provider, playback, provisioning, security, and Telegram modules. It never depends on `:app-tv`.
- The app has a regular touchscreen launcher, no Leanback or TV-banner requirement, portrait/landscape support, Hebrew/RTL support, and a distinct label and icon treatment: **PrivateMediaTV Mobile Test**.
- It targets `arm64-v8a` only, uses minimum SDK 26 consistently with the shared Android implementation, and is signed with the existing Development identity.
- Its compact scrolling Hebrew Home reports the exact mobile version, TDLib availability, API-credential status, Telegram authorization status, session state, and direct actions for encrypted-key import, Telegram connection, channel/video testing, disconnect, and reset.

### Production encrypted provisioning path

- Android Storage Access Framework selects the existing encrypted v1 `.pmtprov` document. No plaintext `api_id`/`api_hash` shortcut exists.
- The mobile UI calls the production `ProvisioningFileImporter`, strict bounded source/codec, authenticated decrypt/validation, and Android Keystore-backed credential vault.
- Structural validation occurs before passphrase entry. A failed passphrase attempt clears only transient passphrase input, retains the prepared selected document in the active route, and permits same-file retry.
- The exact safe F1C.2 Hebrew result mapping now lives at the smallest coherent shared boundary in `core-provisioning`; TV and mobile delegate to that canonical mapping.
- Successful vault storage and Telegram runtime startup are distinct outcomes. A startup failure exposes a runtime-only retry without requiring file reselection or credential re-entry.
- The external document is never copied or deleted, and credential values never enter public state, logs, semantics, saved state, or the APK.

### Real Telegram authorization and restoration

- The mobile harness uses the official TDLib runtime through `core-telegram`; no raw TDLib object escapes that module.
- Phone-number login is the practical primary mobile path. The state machine supports phone number, code, email challenge, two-step password, registration/premium/unsupported states, ready, retryable and fatal/recoverability failures, and logging-out/closing/closed states.
- The real Telegram account-login QR remains available as an explicitly optional cross-device action. The TV product remains QR-default; F1D does not alter that decision.
- Phone number, code, email input, password, and QR link are transient. They are cleared after submission and are not saved, logged, placed in exceptions, or exposed through accessibility semantics or screenshots.
- Process recreation and relaunch follow the actual TDLib authorization state. Ready sessions can restore from app-private TDLib storage; interrupted authorization resumes from TDLib state without restoring any secret input.
- Runtime reuse is health-gated: a newly created closed runtime starts normally, active retained runtimes are reused, and terminal closed/failed ownership is not mistaken for a healthy process-retained session.

### Channel, video, and playback diagnostics

- The harness reuses the bounded F1B/F1C discovery implementation: broadcast channels only, bounded pagination, loading/empty/retry states, recent video plus conservative document-video candidates, deduplication, and newest-first ordering.
- The touch UI exposes display metadata but no internal channel or message identifiers. It creates no permanent allowlist, background catalog, or index.
- Playback uses the provider-neutral TDLib range reader and Media3 `DataSource` directly. Telegram media is not proxied through HTTP and a bounded range does not trigger an automatic full-file download.
- The player includes a video surface, play/pause, 10-second backward/forward actions, seek bar, far seek, position/duration, buffering state, redacted errors, and live non-sensitive range diagnostics.

### Destructive actions

- **Disconnect Telegram** requires confirmation, clears only this mobile package's TDLib session/cache, and retains its provisioned API credentials.
- **Reset mobile test application** requires separate confirmation and removes all mobile-owned state, including credentials and session data.
- Mobile reset is constrained to mobile app-private boundaries and cannot target the TV package or storage. Neither action affects the installed Shield/TV application.

## Shared implementation and isolation decisions

The mobile presentation/orchestration layer is intentionally thin. Production cryptography, provisioning decoding, credential storage, TDLib protocol/runtime handling, session protection, discovery, range reading, and playback contracts remain in their established shared modules. The only shared-code extraction required by F1D was the exact F1C.2 provisioning-result presentation mapping; no broad architecture rewrite or empty feature modules were introduced.

Principal implementation areas are:

- `app-mobile/build.gradle.kts`, `app-mobile/src/main/AndroidManifest.xml`, `MainActivity.kt`, `MobileAcceptanceApp.kt`, `MobileLifecycle.kt`, `MobileModels.kt`, `MobileRuntimeFacade.kt`, and `MobileViewModel.kt`: mobile identity, manifest/resources, touch-first UI, route state, and Android orchestration boundaries;
- `MobileLifecycleTest.kt`, `MobileManifestContractTest.kt`, `MobileModelsTest.kt`, and `MobileViewModelTest.kt`: 25 behavior-focused mobile tests;
- `core-provisioning/.../ProvisioningImportMessages.kt`: canonical safe Hebrew import-result mapping used by both applications;
- `app-tv/.../ProvisioningImportPresentation.kt`: TV delegation to that shared mapping only;
- `scripts/verify-mobile-apk.sh`, `scripts/lib/mobile-apk-delivery.sh`, both mobile export/download scripts, and their two harnesses: isolated APK verification, atomic publication, exact-CI-artifact selection, and behavioral rejection/success coverage;
- `.github/workflows/android-ci.yml`: mobile tests/lint/signed assembly, two-package verification, CI-cache JNI byte comparison, and separate TV/mobile artifacts;
- documentation, including `docs/MOBILE_ACCEPTANCE.md`.

Package-scoped Android storage prevents either application from opening the other's app-private files. Existing TV package, preference identities, Keystore aliases, envelope formats, TDLib paths, session paths, and update behavior were not renamed or made cross-package; any shared relative storage identity resolves only inside the owning package's sandbox.

## TV continuity

The TV application remains `com.funzi7.privatemediatv`, version `0.3.3-f1c2` / code 6, Development-signed, ARM64-only, Leanback-required, `LEANBACK_LAUNCHER`-only, landscape TV UI, and D-pad-oriented. F1D did not weaken any TV manifest requirement, alter its release version, or publish a replacement to the canonical TV `latest` path.

TV APK bytes changed in the local F1D regression build only because the already-approved F1C.2 safe Hebrew import-result mapping moved to the smallest shared library boundary. TV delegates to the same mapping, so its observable import messages and behavior remain unchanged. TV package/version/signer/native payload and prohibited-content inspection passed locally and in final CI.

## Security decisions

- Android backup and data extraction are disabled for mobile.
- Credentials use the Android Keystore-backed vault; the TDLib database key uses the existing Keystore-backed protection design.
- TDLib databases, sessions, downloads, and temporary files stay in mobile app-private storage.
- The activity uses secure-window handling for sensitive authorization/import UI, and secret inputs are transient and cleared after submission.
- No credential, passphrase, provisioning document, Telegram session/database, private content, or real configuration value is compiled into either APK or used in CI.
- No analytics, advertising, Firebase, crash reporter, hosted gateway, Bot API, third-party TDLib binary, or plaintext fallback was added.

## Native and signing continuity

No TDLib native build occurred. Before all Gradle work, both required verify-only commands passed against the unchanged pinned official artifact. Final CI restored and verified its existing cache and compared both packaged TV and mobile JNI entries byte-for-byte with that restored cache.

| Property | Value |
| --- | --- |
| Official source | `tdlib/td` |
| Exact TDLib commit | `022d60202e446ad1287b9fb68e687c8a0760788b` |
| TDLib version | `1.8.66` |
| ABI | `arm64-v8a` only |
| Android API / NDK / CMake | 26 / 28.2.13676358 / 3.31.6 |
| OpenSSL input | `openssl-3.5.7`, SHA-256 `a8c0d28a529ca480f9f36cf5792e2cd21984552a3c8e4aa11a24aa31aeac98e8` |
| Java JAR SHA-256 | `e39bb497b7eea1f33d7d3b5816591b7656259df29e0231c10287e514e3951a04` |
| Local verified AAR / JNI SHA-256 | `025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2` / `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc` |
| Existing CI-cache AAR / JNI SHA-256 | `8e4ca12fdfb3f8a8c00dabdcd00cc36c5fd7c1c364fd2d76b8c36b34d391cef9` / `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |

The local-host and GitHub-runner caches are two separately verified, pre-existing artifact lineages and have different JNI hashes. F1D created neither one and changed no source pin, ABI, NDK, CMake, OpenSSL input, native flag, native identity input, cached AAR/JAR/JNI artifact, or native-build script.

## Local validation

Commands actually run included:

```bash
./scripts/bootstrap-tdlib-android.sh --verify-only
./scripts/verify-tdlib-artifact.sh
./gradlew --version
./gradlew projects
./gradlew test
./gradlew lint
./gradlew :app-tv:assembleDebug
./gradlew :app-mobile:assembleDebug
./gradlew :app-mobile:testDebugUnitTest
bash -n scripts/*.sh
bash -n scripts/lib/*.sh
./scripts/test-inspect-pmtprov.sh
./scripts/test-verify-upgrade-apks.sh
./scripts/test-apk-phone-delivery.sh
./scripts/test-download-latest-ci-apk-rejections.sh
./scripts/test-mobile-apk-phone-delivery.sh
./scripts/test-download-latest-ci-mobile-apk-rejections.sh
node tools/verify-lan-crypto-fallback.mjs
node tools/verify-provisioning-html.mjs
node tools/verify-pmtprov-interop.mjs self-test
./scripts/export-latest-mobile-apk-to-phone.sh
adb devices -l
git diff --check
```

Results:

- Gradle 9.5.0/JDK 21.0.11 discovered all nine modules. Aggregate tests, focused mobile/shared tests, full lint, signed TV regression assembly, and signed mobile assembly passed.
- Generated JUnit XML records 307 tests with zero failures, errors, or skips: TV app 70, mobile app 25, model 15, playback 23, provider 2, provisioning 46, security 56, and Telegram 70. All 282 F1C.2 tests were preserved; F1D added 25 mobile tests.
- The new tests cover regular launcher/no Leanback, distinct package/ARM64 compatibility, production provisioning and exact F1C.2 result mapping, retained-document wrong-password retry, vault Android boundaries, runtime-start retry, authorization challenge transitions, transient sensitive state, session restoration, broadcast/video mapping, playback/range wiring, disconnect/reset isolation, delivery-script isolation, CI artifact selection, and APK identity/version/signer verification.
- Executable Node WebCrypto to production-Kotlin interoperability passed in both directions with the required authentication, structure, length, identifier, work-factor, and credential-field negatives. This is executable cross-runtime evidence, not a source-string check.
- Shell syntax and all behavior harnesses passed: structural inspector 4 cases, upgrade verifier 8, TV publication 9, TV CI-downloader rejection 8, mobile publication 6, and mobile CI downloader 19 rejection cases plus 1 valid publication case. All three Node verifiers passed.
- Both APKs passed package/version/code/signer inspection, ARM64-only native-entry inspection, exactly-one-TDLib-JNI and ELF/Android identity checks, DEX presence, and prohibited credential/passphrase/provisioning/session/private-content scans.
- `adb devices -l` listed no devices. No APK was installed or launched and no physical-device result is claimed.

JVM and script tests do not prove a physical Android Keystore, TDLib networking, Telegram authorization, Android process/session restoration, codecs, Media3 rendering, range playback, touch/keyboard behavior, or phone/Shield storage behavior.

## Local APKs and initial mobile export

| Field | TV regression APK | Mobile APK |
| --- | --- | --- |
| Build path | `app-tv/build/outputs/apk/debug/app-tv-debug.apk` | `app-mobile/build/outputs/apk/debug/app-mobile-debug.apk` |
| Package | `com.funzi7.privatemediatv` | `com.funzi7.privatemediatv.mobile` |
| Version | `0.3.3-f1c2` (6) | `0.1.0-phone-test` (1) |
| Size | 57,106,339 bytes | 56,047,804 bytes |
| APK SHA-256 | `10e2cade85e6540c2ffc1ee4b23323e079be4cdcba0ab564d57b86466289c1ca` | `b54f8a8911cd7aa000401fa3c7435aa129fbdf7724fe3539a09d78c3bae27b6d` |
| Signer | Expected Development certificate | Expected Development certificate |
| Native payload | only `arm64-v8a`; local pinned JNI | only `arm64-v8a`; local pinned JNI |

The local mobile publisher placed a real copy at `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk`, with modification `2026-08-02 23:24:38.772995369 +0000` / epoch `1785713078`. It reverified package, version, signer, ABI, JNI, size, and SHA-256 before and after atomic publication. Parent TV APKs and the offline provisioning tool remained byte- and timestamp-identical. This was shared-storage file delivery only.

## Exact-HEAD CI evidence

| Field | Value |
| --- | --- |
| Android CI run | `30772902585` |
| Event / branch / commit | `push` / `main` / `8782f7cd12dd5ea91c9cd3cffacaf80946ab9b89` |
| Result | completed successfully |
| Gradle wrapper job | `91563052044`, passed |
| TDLib/tests/lint/TV+mobile APK job | `91563064736`, passed |
| TV artifact ID / name | `8841165811` / `private-media-tv-apk-8782f7cd12dd5ea91c9cd3cffacaf80946ab9b89` |
| TV archive size / digest | 57,031,062 bytes / `sha256:e00eb2817a34745c04116248dec4c0217c014503680a4ba0f8a3c9c5a1625e58` |
| TV artifact expiry | `2026-09-01T23:51:37Z` |
| Mobile artifact ID / name | `8841166063` / `private-media-tv-mobile-apk-8782f7cd12dd5ea91c9cd3cffacaf80946ab9b89` |
| Mobile archive size / digest | 55,957,638 bytes / `sha256:651138bb4df3eb68ab527eee6e8a625e9321d993e64896ffe64a0977fbf76f91` |
| Mobile artifact expiry | `2026-09-01T23:51:38Z` |

The final run passed wrapper validation; pinned Java/Android/NDK setup; existing TDLib cache restore and verify-only validation; CI artifact-selection rejection tests; browser crypto fallback; Development signer reconstruction/fingerprint verification; all unit and focused F1C.2/F1D tests; TV/mobile lint; signed ARM64 TV and mobile assembly; both package/version/signer/native/prohibited-content checks; byte-for-byte comparison of both packaged JNI entries with the restored CI cache; separate checksum/metadata creation; separate artifact uploads; and signing-material deletion.

The first exact-head run for implementation commit `0e32c9f8aae5fca2e25a09fc0c36bb1e2d232ec6` (`30772347231`) also passed and uploaded valid artifacts. Its first mobile-download attempt published nothing because a newly added host-side verifier incorrectly required the established CI-cache JNI hash to equal the different established local-cache JNI hash. No native artifact was invalid and no rebuild occurred. The follow-up removed that cross-lineage comparison, retained downloaded-APK-to-artifact-metadata JNI verification, explicitly compared both CI APK JNI entries to CI's restored cache, and added the 19-rejection/1-success downloader harness. The original artifact then published successfully as a rehearsal; final release evidence below uses only the follow-up HEAD's own successful run and artifact.

GitHub emitted a non-failing annotation that pinned actions declaring Node.js 20 were forced onto Node.js 24. It did not affect the successful final run and remains a maintenance item.

## Final CI mobile APK phone delivery

After the successful exact-final-HEAD run, `./scripts/download-latest-ci-mobile-apk-to-phone.sh` selected exactly one unexpired mobile artifact by repository, workflow, push event, branch, conclusion, full commit, name, metadata, checksum, package, version, ABI, signer, APK hash, and TDLib JNI hash. It then used the isolated mobile-only atomic publisher.

Final `latest` evidence:

```text
path=/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk size=55956564 modified=2026-08-02 23:54:43.300994680 +0000 epoch=1785714883
39630452cdc872cb981160bc86322bc276eb72a710f1d1894bec79dd60240efd
```

It re-verifies as:

| Property | Value |
| --- | --- |
| Final application/artifact HEAD | `8782f7cd12dd5ea91c9cd3cffacaf80946ab9b89` |
| Workflow run | `30772902585` |
| Package / version | `com.funzi7.privatemediatv.mobile` / `0.1.0-phone-test` (1) |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| Native payload | `arm64-v8a` only; exactly one `lib/arm64-v8a/libtdjni.so` |
| Packaged TDLib JNI SHA-256 | `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |
| Rotation | unchanged bytes from the prior valid CI rehearsal; canonical timestamp refreshed for the final run |

The `Mobile` directory contains only this `latest` and one distinct local-build `previous` (56,047,804 bytes, SHA-256 `b54f8a8911cd7aa000401fa3c7435aa129fbdf7724fe3539a09d78c3bae27b6d`, retained epoch `1785713078`). The mobile publisher did not overwrite, rotate, or retimestamp any parent TV file. Parent evidence remained:

- TV `latest`: 57,030,122 bytes, SHA-256 `11bca1c3333cebcb5f08e10d5361b586cb7e7d8341b5aa0b4ff00908ba8f24aa`, epoch `1785705844`;
- TV `previous`: 57,107,459 bytes, SHA-256 `48095b075917c756eece8689c3684780a083018e5c03bf0568ae1261aac18877`, epoch `1785704934`;
- offline provisioning tool: 6,066 bytes, SHA-256 `ff56a206d462c5f1f1a71644e04814564f47b1d801b58e4af1dab2245602f26f`, epoch `1785416651`.

Phone shared-storage delivery is not installation, launch, authorization, session restoration, playback, or physical acceptance evidence.

## Physical status, limitations, and risks

No authorized ADB device was visible. F1D was not installed or launched during agent validation. The following remain pending and are not implied by the 307 JVM tests, APK inspection, CI success, or shared-storage copy:

- real Android Keystore credential-vault and TDLib database-key behavior;
- SAF selection and same-document wrong-passphrase retry on a phone;
- real Telegram networking and phone/code/email/password/optional-QR authorization;
- force-stop, Recent Apps close, process recreation, and device-local session restoration;
- live broadcast-channel/video discovery;
- MP4 and, when available, MKV codec/rendering behavior;
- bounded range reads, near/far seeks, buffering, and playback on physical hardware;
- disconnect credential retention and reset isolation on installed packages.

ARM64-only packaging excludes x86/x86_64 emulators and 32-bit phones. Optional account-login QR testing requires another device because a phone cannot conveniently scan its own display. The two verified TDLib cache lineages require provenance checks against the cache that produced each artifact, not cross-lineage byte equality.

Shield installation, update continuity, D-pad/Leanback presentation, TV hardware codecs, and physical TV playback were intentionally deferred and not attempted. F1D does not replace those TV-specific checks.

## Exact next physical phone acceptance

Use the final CI mobile APK above and follow `docs/MOBILE_ACCEPTANCE.md` without recording any private value:

1. Install the mobile package and verify the distinct **PrivateMediaTV Mobile Test** label, package, version, signer, and ordinary launcher. Confirm the TV package/data remains separate.
2. Open encrypted-key import, select the existing generic encrypted v1 document through SAF, and verify structural-valid status appears before passphrase entry.
3. Enter an intentionally wrong passphrase locally, confirm the exact safe error and cleared passphrase, then retry the same retained document with the correct passphrase. If runtime startup fails, use runtime-only retry.
4. Complete real phone-number authorization, including code, email, and two-step-password challenges only if TDLib requests them. Optionally test the real account-login QR from a second device.
5. After ready state, close the app from Android Recent Apps and reopen it. Also force-stop/relaunch. Confirm TDLib reports the actual restored state without restoring secret inputs.
6. Load broadcast channels and recent video candidates. Verify bounded pagination, retry/empty states, deduplication, newest-first ordering, and absence of internal IDs.
7. Play MP4 first and MKV when available. Exercise play/pause, 10-second back/forward, seek bar, far seek, buffering, and safe range diagnostics without a full-file or HTTP-proxy shortcut.
8. Disconnect and confirm credentials remain while the mobile Telegram session/cache is removed. Reconnect as needed.
9. Reset the mobile harness and confirm all mobile-owned state is removed while the separate TV package/storage remains untouched.

Record only pass/fail stage categories. Do not record credentials, phone/authentication values, QR links, session data, channel/message identifiers, private media names, screenshots, or sensitive logs.

## Unresolved product and UX decisions

F1D intentionally makes no final consumer-phone or catalog design decision. Still unresolved are the permanent channel-allowlist UX, full catalog navigation details, subtitles, movie automatic-completion policy, final consumer phone design, synchronization, and physical tuning within the approved original TV Home direction. Those choices remain deferred until physical F1D and F1C.2 import, update-continuity, account-login, and playback acceptance supplies real evidence.

## Continuation instructions and next milestone

The exact next milestone is **F1D physical phone acceptance** using the procedure above; no further implementation should be assumed complete until those observations are recorded. Diagnose any failure from the safe visible stage and actual TDLib state, preserving package isolation and native identity.

After phone acceptance, return to the Shield only for TV-specific work: update-preserving installation, existing F1C.2 provisioning continuity, D-pad/Leanback UX, TV hardware codecs, and real playback. Do not weaken TV requirements or treat phone success as Shield evidence.
