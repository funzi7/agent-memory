# Private Media TV — F1C.2 Handoff

## Identity

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Completed milestone | F1C.2 — physical `.pmtprov` import repair and upgrade-data continuity |
| Version | `0.3.3-f1c2` (`versionCode` 6) |
| Package | `com.funzi7.privatemediatv` |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `404d0c2daeda00c17041e828c4c9eccd945e353b` |
| Final application HEAD | `73a855e07e3cbcc2832ce6d3063958a9f434c16c` |

The application commit was pushed without rewriting history. Local `HEAD`, `origin/main`, the successful Android CI run, and the downloaded CI artifact metadata all identify the final application SHA above.

## Authoritative physical finding that triggered F1C.2

The owner physically verified on NVIDIA Shield that F1C.1's full-screen credential-provisioning QR is completely visible. The owner has no private Wi-Fi network, so LAN provisioning was not usable. The owner then:

- created the encrypted v1 file with the shipped offline HTML tool;
- transferred the real 112-byte file to the Shield;
- selected it through Android's system document picker;
- entered the locally chosen passphrase; and
- received only the old generic fatal Hebrew notice after the screen had cleared both the selected document and passphrase context.

Real Telegram login therefore remained blocked. These actions physically occurred; this was not a missing-file or missing-selection report.

The non-secret inspector confirmed that the observed file has valid v1 magic, version 1, KDF/cipher IDs 1/1, 600,000 PBKDF2 iterations, 16-byte salt, 12-byte IV, 54-byte encrypted payload, and a valid 112-byte total relationship. This proves structural compatibility with the shipped generator only. It does not prove the passphrase, AES-GCM authentication, decrypted credential fields, Android crypto provider, Keystore write, or runtime restart.

The exact physical F1C.1 failure stage remains unknown because that build collapsed document read, binary structure, authenticated decryption, credential validation, vault mutation, and runtime restart into broad states. F1C.2 adds stage isolation; it does not invent a root cause that the old build could not observe.

## Implemented behavior

### Typed, safe transaction results

Provisioning-file import now has provider-neutral results for:

- unavailable, empty, and oversized documents;
- invalid magic, unsupported format/KDF/cipher, invalid work factor or creation metadata, malformed header, and encrypted-length mismatch;
- combined wrong-passphrase/authenticated-ciphertext failure;
- invalid credential payload, `api_id`, and `api_hash`;
- existing-credential and replacement-confirmation states;
- unavailable crypto provider or credential vault;
- vault write and exact read-back failures; and
- credentials stored but Telegram runtime restart failed.

Each result has a stable non-sensitive diagnostic code. Public state and errors contain no exception message, provider detail, document reference, path, passphrase, credential value, ciphertext, salt, IV, Keystore alias, or stack trace. Wrong passphrase and AES-GCM authentication failure intentionally share one public outcome.

### Two-phase route-scoped import

1. Android SAF opens the selected URI once. A strict bounded reader accepts at most 4,096 bytes and reads one extra byte only to detect oversize input. It handles null streams, access denial, missing documents, I/O errors, zero-length reads, empty documents, and unknown provider sizes while closing every stream.
2. Phase A validates only non-secret binary structure before enabling passphrase entry. Filename extension and MIME type are not trusted.
3. The selected URI and prepared encrypted bytes remain only in the active ViewModel route session. They never enter `SettingsUiState`, saved instance state, persistence, logs, or `toString()` output.
4. Phase B copies the visible passphrase into a short-lived `CharArray`, clears the visible field before submission, blocks duplicate work, and performs authentication/validation/storage on the I/O dispatcher.
5. A failed decrypt or vault operation remains on the import screen, retains the same prepared document for retry, clears passphrase input, restores retry focus, and never navigates Back automatically.
6. Cancel, Back, route exit, reset, and ViewModel destruction invalidate work and clear/close the route session.

The Hebrew presentation now distinguishes unreadable/oversized/not-PMT/version/malformed/password-or-corruption/invalid-ID/invalid-hash/crypto/vault stages. Recoverable file errors no longer use the generic fatal authorization notice.

### Vault and runtime transaction

- Existing credentials require explicit replacement confirmation.
- The vault encrypts a candidate into a temporary app-private envelope, reads the exact staged bytes back, decrypts them, compares the exact credential payload, and publishes only after successful verification.
- Publication uses a serialized cross-process compare-and-set. A missing, newly present, or changed expected envelope prevents a stale writer from replacing current data.
- Every non-successful replacement leaves an existing valid permanent envelope unchanged.
- Telegram runtime/session/database state is untouched for every pre-commit import failure.
- After verified storage, runtime restart is evaluated separately. Missing, rejected, failed, exception-throwing, or linkage-failing startup becomes a saved-but-runtime-failed screen with a runtime-only retry; the owner is not asked to recreate or reimport the file.
- Android crypto and Keystore operations have injectable capability boundaries. There is no weakened PBKDF2, plaintext fallback, or alternate cipher.

Principal implementation areas:

- `core-provisioning`: typed stages, crypto boundary, strict codec, read-once prepared document, hardened SAF source, two-phase importer, executable WebCrypto interoperability tests;
- `core-security`: capability boundary, staged exact read-back, atomic compare-and-set publication, legacy-envelope fixtures, stable Android aliases/paths;
- `app-tv`: route session, Hebrew mapping, two-phase D-pad UI, duplicate prevention, replacement confirmation, runtime-only retry, and real `SettingsViewModel` integration tests;
- `core-telegram`: stable TDLib storage-path identity tests;
- `scripts` / CI: non-secret structural inspector, old/new APK verifier, behavior harnesses, and mandatory executable interoperability checks.

## Upgrade and data-continuity protections

F1C.2 preserves:

- package `com.funzi7.privatemediatv`;
- Development signing certificate `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0`;
- credential and TDLib database-key envelope formats;
- Android Keystore aliases;
- app-private security directory and envelope filenames;
- TDLib database, downloaded-file, and temporary directory names;
- established Settings/progress/mapping/selection preference identities; and
- the F1C continue-watching v1 JSON schema.

No version-triggered clearing or migration was added. `deploy-shield.sh` remains update-only `adb install -r` and contains no downgrade, uninstall, package deletion, or clear-data operation. `scripts/verify-upgrade-apks.sh` validates identical package and certificate, increasing version code, ARM64/JNI compatibility, and the deployment policy. Its eight-case harness rejects package, signer, version, ABI/JNI, and destructive-install violations.

Fixed compatibility tests decode the existing credential-vault envelope, TDLib database-key envelope, and continue-watching JSON, and assert all established preference, Keystore, security-file, and TDLib-directory identities. This is automated compatibility evidence, not a physical Android update result.

## Native and signing continuity

No TDLib rebuild occurred. Both required verify-only commands passed before Gradle work and CI restored its existing artifact cache by the unchanged key.

| Property | Value |
| --- | --- |
| Official source | `tdlib/td` |
| Exact TDLib commit | `022d60202e446ad1287b9fb68e687c8a0760788b` |
| TDLib version | `1.8.66` |
| ABI | `arm64-v8a` only |
| Android API / NDK / CMake | 26 / 28.2.13676358 / 3.31.6 |
| OpenSSL input | `openssl-3.5.7`, SHA-256 `a8c0d28a529ca480f9f36cf5792e2cd21984552a3c8e4aa11a24aa31aeac98e8` |
| Java JAR SHA-256 | `e39bb497b7eea1f33d7d3b5816591b7656259df29e0231c10287e514e3951a04` |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |

The already-existing local verified artifact remained AAR `025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2` / JNI `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc`. The existing CI cache remained AAR `8e4ca12fdfb3f8a8c00dabdcd00cc36c5fd7c1c364fd2d76b8c36b34d391cef9` / JNI `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f`. The final F1C.2 CI APK's JNI is byte-identical to the retained F1C.1 CI APK's JNI. Thus each established delivery lineage preserved its prior native identity; this milestone did not create either artifact.

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
./gradlew :app-tv:testDebugUnitTest :core-provisioning:testDebugUnitTest :core-security:testDebugUnitTest :core-telegram:testDebugUnitTest
bash -n scripts/*.sh
bash -n scripts/lib/*.sh
./scripts/test-download-latest-ci-apk-rejections.sh
./scripts/test-apk-phone-delivery.sh
./scripts/test-inspect-pmtprov.sh
./scripts/test-verify-upgrade-apks.sh
node tools/verify-lan-crypto-fallback.mjs
node tools/verify-provisioning-html.mjs
node tools/verify-pmtprov-interop.mjs self-test
./scripts/inspect-pmtprov.sh <generic-v1-test-file>
./scripts/verify-upgrade-apks.sh app-tv/build/upgrade-baseline/f1c1-ci.apk app-tv/build/outputs/apk/debug/app-tv-debug.apk
adb devices -l
./scripts/export-latest-apk-to-phone.sh
git diff --check
```

Results:

- Gradle 9.5.0/JDK 21 project discovery, aggregate tests, focused tests, lint, and signed assembly passed.
- Generated JUnit XML records 282 tests: app 70, model 15, playback 23, provider 2, provisioning 46, security 56, Telegram 70. All passed with zero failures, errors, or skips.
- Real Node WebCrypto generated deterministic binary v1 bytes decoded by the production Kotlin codec. The production Kotlin encoder generated bytes authenticated/decrypted by Node WebCrypto. Wrong passphrase, ciphertext and authenticated-header bit flips, truncation, appended bytes, unsupported identifiers/version/work factor, wrong salt/IV lengths, invalid encrypted length, and invalid credential fields all failed as required.
- Shell syntax passed. Inspector 4, upgrade verifier 8, phone publisher 9, and CI downloader rejection 8 behavior cases passed. All three Node verifiers passed.
- The real 112-byte file passed non-secret structural inspection. No decrypt utility was run and no secret was requested or exposed.
- The retained F1C.1 CI APK and local F1C.2 APK passed update verification: same package/certificate, version code 5→6, ARM64/JNI present, and update-only deployment.
- APK package/version/code/signer, ARM64-only entries, JNI presence/ELF identity, prohibited packaged entries, and fake-test-secret absence passed.
- `adb devices -l` listed no device. No Shield address was configured, so deployment was not attempted.

These checks do not prove Shield Keystore behavior, physical import, installation, launch, or data continuity.

## Local APK and initial phone export

| Field | Value |
| --- | --- |
| Build path | `app-tv/build/outputs/apk/debug/app-tv-debug.apk` |
| Package / version | `com.funzi7.privatemediatv` / `0.3.3-f1c2` (6) |
| Size | 57,107,459 bytes |
| APK SHA-256 | `48095b075917c756eece8689c3684780a083018e5c03bf0568ae1261aac18877` |
| Signer | Expected Development certificate |
| Native payload | only `arm64-v8a`; local verified JNI present |

The local publisher verified that APK at the canonical phone `latest` path with modification `2026-08-02 21:08:54.916998475 +0000` (epoch `1785704934`). This was file delivery only.

## Exact-HEAD CI evidence

| Field | Value |
| --- | --- |
| Android CI run | `30767470244` |
| Event / branch / commit | `push` / `main` / `73a855e07e3cbcc2832ce6d3063958a9f434c16c` |
| Result | completed successfully |
| Gradle wrapper job | `91548630020`, passed |
| TDLib/tests/lint/APK job | `91548647345`, passed |
| Artifact ID | `8839485567` |
| Artifact name | `private-media-tv-apk-73a855e07e3cbcc2832ce6d3063958a9f434c16c` |
| Archive size | 57,031,062 bytes |
| Archive digest | `sha256:ef2509c9e20b6ef180317dee814acacebb90ba832a9f1a15589874623b75b378` |
| Artifact expiry | `2026-09-01T21:22:11Z` |

The exact-HEAD run passed wrapper validation; pinned Java/Android/NDK setup; TDLib cache restore and both verify-only invocations; script/inspector/upgrade tests; Node WebCrypto verification; Development signer reconstruction/fingerprint verification; aggregate and focused F1C.2 tests; lint; signed ARM64 assembly; APK package/version/signer/native/forbidden-content verification; metadata/checksum creation; artifact upload; and runner signing-material deletion.

GitHub emitted a non-failing annotation that pinned actions declaring Node.js 20 were forced onto Node.js 24. It did not affect this successful run and remains a future maintenance item.

## Final CI APK phone delivery

After the successful exact-HEAD run, `./scripts/download-latest-ci-apk-to-phone.sh` selected the final push artifact by workflow, branch, conclusion, commit, metadata, checksum, ABI, package, version, and signer before canonical publication.

Final `latest` evidence:

```text
path=/storage/emulated/0/Download/PrivateMediaTV/private-media-tv-latest.apk size=57030122 modified=2026-08-02 21:24:04.892998128 +0000 epoch=1785705844
11bca1c3333cebcb5f08e10d5361b586cb7e7d8341b5aa0b4ff00908ba8f24aa
```

It verifies as package `com.funzi7.privatemediatv`, version `0.3.3-f1c2`/6, expected Development signer, ARM64-only, exactly one `libtdjni.so`, and byte-identical JNI to the retained F1C.1 CI APK. The retained code-5 baseline and this final CI APK pass the upgrade verifier.

The canonical phone directory contains exactly:

| File | Evidence |
| --- | --- |
| `private-media-tv-latest.apk` | final-HEAD CI APK; 57,030,122 bytes; SHA-256 `11bca1c3333cebcb5f08e10d5361b586cb7e7d8341b5aa0b4ff00908ba8f24aa`; modification `2026-08-02 21:24:04.892998128 +0000`, epoch `1785705844` |
| `private-media-tv-previous.apk` | distinct local F1C.2 APK; 57,107,459 bytes; SHA-256 `48095b075917c756eece8689c3684780a083018e5c03bf0568ae1261aac18877`; retained modification `2026-08-02 21:08:54.000000000 +0000`, epoch `1785704934` |
| `telegram-provisioning-file.html` | present; 6,066 bytes; SHA-256 `ff56a206d462c5f1f1a71644e04814564f47b1d801b58e4af1dab2245602f26f` |

Phone delivery is not installation, launch, physical import, or data-continuity evidence.

## Physical status, limitations, and risks

F1C.2 has not been installed or launched on the authorized Shield during agent validation. No ADB device was attached. Therefore both mandatory physical acceptance paths remain pending:

- importing the real structurally valid v1 file through the new two-phase UI, including same-document retry and actual Shield crypto/Keystore behavior;
- installing F1C.2 over the existing app and proving that continue-watching and Settings survive without uninstall or clear data.

Credentials and TDLib session continuity must be checked through an ordinary later update once they exist. JVM tests cannot prove Shield Keystore availability/invalidation behavior, Android process death, TV D-pad focus, or real TDLib startup. The typed stage model should make any new physical failure observable without exposing private data, but it does not guarantee that the original physical issue is fixed until the owner performs the test.

Other preserved limitations remain: trusted-LAN provisioning is unavailable in the owner's current environment; ARM64-only packaging excludes x86/x86_64 emulators and 32-bit devices; real Telegram login, catalog discovery, range playback, and session restoration remain downstream physical work.

## Exact next physical test

1. On the Shield, confirm the installed package is the existing Private Media TV app. Do not uninstall or clear data.
2. Start the bundled local sample and confirm a harmless marker appears in **"המשך צפייה"**. Record only that a marker exists.
3. Open the final CI `private-media-tv-latest.apk` over the existing app. Android must show **Update**, not a separate app. Stop on any package/signature conflict.
4. Relaunch and verify the harmless continue-watching marker and Settings remain.
5. Open **"הגדרת מפתחות Telegram"**, select the same generic 112-byte v1 file, and confirm Phase A reports valid structure before passphrase entry.
6. Enter the passphrase locally on the Shield; do not share or record it. Confirm loading, no duplicate submission, and either configured success or the precise safe stage message.
7. If authentication fails, retry with the same selected document and confirm only the passphrase was cleared. If vault/runtime fails, record only the displayed stage category and confirm existing state remains.
8. On storage success, confirm Settings reports configured credentials. If runtime restart fails, use the runtime-only retry without reimporting.
9. Later, after credentials/session exist, perform another ordinary update and verify both survive.
10. Only after those observations may physical `.pmtprov` import and data-preserving Shield update be marked passed; then continue to account-login and real Telegram playback acceptance.
