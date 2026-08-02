# Private Media TV — F1C.1 Handoff

## Identity

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Completed milestone | F1C.1 — full-screen credential-provisioning QR and phone APK timestamp correction |
| Version | `0.3.2-f1c1` (`versionCode` 5) |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `580ea31637ecfd7a59d446bf61679a16053d9350` |
| Final application HEAD | `404d0c2daeda00c17041e828c4c9eccd945e353b` |

The final application HEAD was pushed without rewriting history, fetched back from `origin/main`, used by the successful Android CI run, and matched by the CI artifact delivered to canonical phone storage.

## Authoritative physical finding from final F1C

The owner physically tested final F1C and reported:

- the application installed and opened;
- offline navigation worked;
- Settings opened and the offline flow passed;
- pressing **"הגדרה בטלפון באמצעות QR"** showed the credential-provisioning QR inline near the bottom of the scrollable Settings screen;
- only part of that QR square was visible;
- credential provisioning and therefore real Telegram login were blocked;
- the later Telegram account-login QR could not be reached or physically tested.

This was a real physical F1C failure, not an absence of physical testing. F1C had fixed the wrong presentation path: it moved the TDLib account-login `qrChallenge` to full screen, while the separate credential-provisioning `provisioningAddress` still rendered inside `CredentialProvisioningScreen`'s `LazyColumn`.

## Actual F1C.1 fix

### Credential-provisioning presentation

- **"הגדרה בטלפון באמצעות QR"** now selects a dedicated `CREDENTIAL_PROVISIONING_QR` route before the local coordinator can publish an address.
- The scrollable credential setup screen contains actions/status only and has no QR rendering branch.
- The credential screen title is exactly **"הגדרת מפתחות Telegram"**.
- The account-login screen title remains exactly **"התחברות לחשבון Telegram"**.
- Both flows use one reusable non-scrollable full-screen TV layout container, but the container owns no state or lifecycle.
- The pure layout policy reserves overscan margins, header space, and separate QR/control columns, then bounds the whole square and quiet zone against both landscape dimensions.
- The QR retains ZXing's four-module quiet zone plus UI white padding.
- Initial focus is on a non-secret cancel/alternative control; dismissing returns focus to the credential-provisioning action.

### Flow isolation and cleanup

- Provisioning keeps its local-server address/session owner; account login keeps its TDLib challenge owner.
- Route gates prevent a provisioning value from entering account-login state and prevent an account challenge from entering provisioning state.
- Back/cancel, timeout, success, navigation away, lifecycle stop, and ViewModel cleanup stop/clear provisioning.
- Replacement listening updates replace only the currently active in-memory provisioning address.
- Account-login request/refresh/replacement/phone-fallback behavior remains unchanged.
- No provisioning URL, QR payload, one-time secret, credential, or account QR enters saved state, persistence, logs, exceptions, semantics, source, CI metadata, or this handoff.

Principal implementation areas:

- `app-tv/.../settings/SettingsModels.kt` — dedicated route, presentation selectors, flow isolation, cleanup/focus helpers, exact titles;
- `app-tv/.../settings/SettingsViewModel.kt` — route selection and provisioning terminal/navigation/lifecycle cleanup;
- `app-tv/.../ui/SettingsScreen.kt` — removal of inline QR plus two distinct full-screen presentations;
- `app-tv/.../ui/TvFullScreenQrLayout.kt` — bounded TV layout policy;
- app and provisioning focused tests — route, lifecycle, secrecy, isolation, update, and size behavior.

F1C Home, **"המשך צפייה"**, long-press removal/re-entry, Progress de-emphasis, Settings management, TDLib authorization, disconnect/reset, and diagnostic playback behavior remain intact.

## Phone APK timestamp correction

Both local and CI publishers now perform this after successful atomic `latest` publication:

1. touch the final `private-media-tv-latest.apk` without changing APK bytes;
2. sync that file;
3. capture exact path/size/modification time/epoch;
4. require the epoch to be no earlier than publication start;
5. reverify size, SHA-256, package, version name/code, and Development signer;
6. print the exact final path and modification time.

Rotation copies timestamps and explicitly reapplies/syncs the former `latest` epoch to `previous`. This extra step is required because the first real F1C.1 local publication showed that Android shared storage can preserve the replaced `previous` inode's older timestamp across rename. The nine-case harness passed after the hardening, and the final real CI rotation proved that `previous` retained the former local-latest epoch.

Focused delivery tests cover fresh latest time, historical previous time, failed publication leaving latest content/time unchanged, unrelated content/time preservation, canonical-file safety, and caller integration.

## Preserved native and signing foundation

F1C.1 reused the verified official TDLib artifact and did not rebuild native code.

| Property | Observed value |
| --- | --- |
| Official source | `tdlib/td` |
| Exact TDLib commit | `022d60202e446ad1287b9fb68e687c8a0760788b` |
| TDLib version | `1.8.66` |
| Target ABI | `arm64-v8a` only |
| AAR SHA-256 | `025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2` |
| Java JAR SHA-256 | `e39bb497b7eea1f33d7d3b5816591b7656259df29e0231c10287e514e3951a04` |
| `libtdjni.so` SHA-256 | `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc` |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |

Both required TDLib cache commands passed before Gradle work. Official source pin, NDK/CMake/OpenSSL inputs, artifact hashes, ARM64-only packaging, and Development identity are unchanged. Raw TDLib types remain confined to `core-telegram`; `core-security` remains independent.

## Local validation

Observed toolchain: Gradle `9.5.0`, JDK `21.0.11`, Android Gradle Plugin `9.3.0`, Kotlin plugin `2.2.10`, compile/target SDK 36, minimum SDK 26.

Commands actually run included:

```bash
./scripts/bootstrap-tdlib-android.sh --verify-only
./scripts/verify-tdlib-artifact.sh
./gradlew --version
./gradlew projects
./gradlew test
./gradlew :app-tv:testDebugUnitTest :core-provisioning:testDebugUnitTest
./gradlew lint
./gradlew :app-tv:assembleDebug
bash -n scripts/*.sh
bash -n scripts/lib/*.sh
./scripts/test-apk-phone-delivery.sh
./scripts/test-download-latest-ci-apk-rejections.sh
node tools/verify-lan-crypto-fallback.mjs
node tools/verify-provisioning-html.mjs
adb devices -l
./scripts/export-latest-apk-to-phone.sh
./scripts/deploy-shield.sh
./scripts/download-latest-ci-apk-to-phone.sh
git diff --check
```

Results:

- Gradle project discovery, aggregate tests, focused app/provisioning tests, lint, and signed assembly passed.
- Generated JUnit XML records 228 tests: app 49, model 15, playback 23, provider 2, provisioning 31, security 39, Telegram 69.
- All 228 passed with zero failures, errors, or skips.
- Shell syntax passed.
- Nine phone-publication cases and eight CI-downloader rejection cases passed.
- Both offline provisioning browser/crypto verifiers passed.
- APK package/version/code/signer/ABI/native-payload and forbidden packaged-material checks passed.
- `git diff --check` passed before the application commit.
- `adb devices -l` listed no device.
- `deploy-shield.sh` exited 3 and reported `SHIELD_IP` not configured/not attempted.

These checks prove implementation and packaging behavior, not physical TV layout/scan success or real Telegram behavior.

## Local APK and local phone delivery

| Field | Value |
| --- | --- |
| Build path | `app-tv/build/outputs/apk/debug/app-tv-debug.apk` |
| Package / version | `com.funzi7.privatemediatv` / `0.3.2-f1c1` (5) |
| Size | 56,997,354 bytes |
| APK SHA-256 | `dde7341cbc7788fa854ed485aaad1c41b8c498ea08dcfdb51a358441a5db54d3` |
| Signer | Expected Development certificate |
| Native payload | only `arm64-v8a`; pinned `libtdjni.so` present |

The local publisher placed this APK at the canonical phone `latest` path and verified:

```text
path=/storage/emulated/0/Download/PrivateMediaTV/private-media-tv-latest.apk size=56997354 modified=2026-08-02 17:57:58.079141908 +0000 epoch=1785693478
dde7341cbc7788fa854ed485aaad1c41b8c498ea08dcfdb51a358441a5db54d3
```

Exactly `private-media-tv-latest.apk`, `private-media-tv-previous.apk`, and `telegram-provisioning-file.html` remained. This was verified phone file delivery, not installation or launch.

## Pushed CI evidence

| Field | Value |
| --- | --- |
| Android CI run | `30760556774` |
| Event / branch / commit | `push` / `main` / `404d0c2daeda00c17041e828c4c9eccd945e353b` |
| Result | Completed successfully |
| Gradle wrapper job | `91530146167`, passed |
| TDLib/tests/lint/APK job | `91530160498`, passed |
| Artifact ID | `8837355662` |
| Artifact name | `private-media-tv-apk-404d0c2daeda00c17041e828c4c9eccd945e353b` |
| Archive size | 56,998,294 bytes |
| Archive digest | `sha256:7f6991c5156f9a1b99496d69a608f691d4b05a8c70ef622ceb552e9d722da5b3` |
| Artifact expiry | `2026-09-01T18:16:16Z` |

The exact-HEAD run passed wrapper validation; pinned Java/Gradle/Android SDK/NDK setup; official TDLib cache restore/verification; downloader-rejection and LAN-browser crypto checks; Development signer reconstruction/fingerprint verification; aggregate and focused F1C.1 tests; lint; signed ARM64 assembly; package/version/signer/native/forbidden-content verification; checksum/metadata creation; artifact upload; and signing-material deletion. The main-push artifact contains no real Telegram credentials or account state.

GitHub emitted a non-failing annotation that pinned actions declaring Node.js 20 were forced to Node.js 24. It did not affect the successful run and remains a future maintenance item.

## Final CI APK phone delivery

After successful final-HEAD CI, the downloader selected only the exact push run/artifact, verified its commit metadata/checksum/package/version/ABI/signer, and performed canonical publication.

Final `latest` observation:

```text
path=/storage/emulated/0/Download/PrivateMediaTV/private-media-tv-latest.apk size=56997354 modified=2026-08-02 18:18:09.703141446 +0000 epoch=1785694689
d17e84550e69979a461d913a8c31cde6aaf03cbfd164a4e4f0587f0a456dd355
```

It verifies as package `com.funzi7.privatemediatv`, version `0.3.2-f1c1`/5, expected Development signer, and ARM64-only native payload with `libtdjni.so`.

Final canonical phone directory:

| File | Evidence |
| --- | --- |
| `private-media-tv-latest.apk` | final-HEAD CI APK; 56,997,354 bytes; SHA-256 `d17e84550e69979a461d913a8c31cde6aaf03cbfd164a4e4f0587f0a456dd355`; modification `2026-08-02 18:18:09.703141446 +0000`, epoch `1785694689` |
| `private-media-tv-previous.apk` | distinct local F1C.1 APK; 56,997,354 bytes; SHA-256 `dde7341cbc7788fa854ed485aaad1c41b8c498ea08dcfdb51a358441a5db54d3`; retained modification `2026-08-02 17:57:58.000000000 +0000`, epoch `1785693478` |
| `telegram-provisioning-file.html` | present; 6,066 bytes; SHA-256 `ff56a206d462c5f1f1a71644e04814564f47b1d801b58e4af1dab2245602f26f` |

Exactly these canonical names remain. Rotation was performed, zero historical APKs were removed, and no unrelated phone file was changed. This is file delivery only, not installation or launch.

## Physical status and blocker

F1C.1 itself has not been physically tested. No authorized device was listed during agent validation, and Shield deployment was not configured/attempted.

Therefore the following remain untested:

- visibility, overscan safety, D-pad focus, Back/cancel behavior, and scan readability of the new F1C.1 credential-provisioning QR;
- real credential provisioning and Android Keystore behavior;
- the separate account-login QR on hardware;
- real Telegram login/session restoration;
- channel discovery, Telegram playback, seeking, cleanup, and Shield behavior.

Do not reinterpret this as no physical testing: final F1C was physically tested and failed specifically at the inline/cropped credential-provisioning QR. The new F1C.1 correction is what still needs physical acceptance.

## Risks and limitations

- Pure layout tests cannot prove TV overscan or camera scan readability.
- Compose/JVM tests cannot prove physical D-pad focus traversal.
- Trusted-LAN provisioning is encrypted against passive observation but is not authenticated TLS and does not resist an actively compromised LAN/browser.
- Real Keystore, process-death, TDLib session, codec, and range-playback behavior still require the authorized Shield.
- Continue watching currently has stable local sample targets; durable Telegram targets depend on deferred catalog identity/indexing.
- ARM64-only packaging excludes x86/x86_64 emulators and 32-bit devices.
- Pinned CI actions declaring Node.js 20 should be refreshed in a separate scoped maintenance change before future platform enforcement.

## Exact next step

Physical F1C.1 Shield acceptance remains the blocker before broader catalog work:

1. Verify/install the final CI APK for application HEAD `404d0c2daeda00c17041e828c4c9eccd945e353b` on the authorized NVIDIA Shield.
2. Open **"הגדרת מפתחות Telegram"**, press **"הגדרה בטלפון באמצעות QR"**, and confirm the dedicated full-screen presentation shows the complete square/quiet zone without scrolling or cropping.
3. Verify focus, Back/cancel cleanup, timeout cleanup, and return focus without recording the QR or any private value.
4. Perform real provisioning; confirm success closes/stops and Settings reports configured/no session.
5. Open the separately titled **"התחברות לחשבון Telegram"** flow, validate its QR independently, then perform real login.
6. Complete the preserved diagnostic playback/seek/disconnect acceptance with sanitized evidence.
7. Fix any scoped physical defect before beginning permanent catalog indexing, metadata integration, or allowlist UX.
8. Preserve the official TDLib pin/artifact, secure on-device architecture, Development signer, ARM64 packaging, and local-build/local-phone/CI/CI-phone evidence workflow.
