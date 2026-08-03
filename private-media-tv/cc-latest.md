# Private Media TV — F1D.2 Handoff

## Identity

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F1D.2 — TDLib database-key startup repair and observable runtime retry |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `63bff9ccf5ba6a44bf8ccdf61b90a254f489d4af` |
| Final application HEAD | `1f9f43593f75bf7a8e3131ec58959060e87c2207` |
| Main milestone commit | `58365b7244e7ff3d999fd8950525f3b8d4067fc4` |
| Scoped CI follow-up | `1f9f43593f75bf7a8e3131ec58959060e87c2207` |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.1.2-phone-test`, `versionCode` 3 |
| TV identity | `com.funzi7.privatemediatv`, `0.3.5-f1c4`, `versionCode` 8 |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |

Both application commits were pushed without rewriting history. Final local `HEAD`, `origin/main`,
the successful exact-HEAD Android CI run, its artifacts, and the downloaded mobile artifact all
identify the final application SHA above.

## Authoritative physical trigger

The owner physically updated and tested mobile code 2 on a Samsung Android 16 phone. Established
facts are:

- the APK updated the existing installation without uninstalling or clearing data;
- screenshots work throughout `app-mobile`;
- the real provisioning document had already passed structural validation;
- the correct passphrase was accepted;
- production API credentials were stored and read back;
- the dedicated Android API-credential vault self-test passed;
- Telegram runtime startup then failed after credential storage;
- Home incorrectly described API credentials as inaccessible/reset-required while TDLib remained
  unavailable, authorization was closed, and no session was active;
- the runtime-only retry appeared inert because it exposed no loading state, attempt number,
  startup stage, safe code, navigation, or changed terminal result; and
- phone-number login remained unavailable.

These observations prove API-credential success followed by a later TDLib startup failure. They do
not prove the exact database-key, JNI, client, parameter, or native-runtime root cause.

## Implemented behavior

### Independent security and runtime states

Mobile presentation and runtime orchestration now retain three independent states:

1. API credential vault;
2. TDLib database-key vault; and
3. TDLib native/runtime.

Home exposes a row for each, plus provider-neutral Telegram authorization/session status. A
database-key or runtime failure cannot mark the API vault inaccessible. Only an actual credential
vault status/read failure does that. Existing stored credentials are read on startup; no
version-triggered clearing, document reselection, passphrase re-entry, credential replacement, or
full reset was added.

### Typed startup transaction

Startup is modeled as explicit non-sensitive stages:

1. API credential read;
2. configuration validation;
3. storage-path preparation;
4. database-key acquisition;
5. runtime-lease acquisition;
6. gateway creation;
7. TDLib Java-class check;
8. JNI library load;
9. actual leased client creation;
10. TDLib parameter submission;
11. native start; and
12. first real authorization-state observation.

Terminal state retains the exact safe stage, category, stable safe code, typed database-key failure,
and retryable/fatal disposition where applicable. Every existing database-key failure remains
distinguishable through `core-security`, `core-telegram`, the mobile facade/ViewModel, mobile UI,
and applicable TV Settings presentation:

- `PMTV-TDLIB-DBKEY-STORAGE`;
- `PMTV-TDLIB-DBKEY-GENERATE`;
- `PMTV-TDLIB-DBKEY-PROTECT`;
- `PMTV-TDLIB-DBKEY-WRAPPING-KEY`;
- `PMTV-TDLIB-DBKEY-ENVELOPE-CORRUPT`;
- `PMTV-TDLIB-DBKEY-EXISTING-DATABASE-NO-KEY`; and
- `PMTV-TDLIB-DBKEY-CONSUMER`.

Runtime failures remain distinct for credential read, invalid configuration, storage preparation,
database-key recoverability, active ownership, Java class, JNI load, client creation, parameter
submission, native start, and authorization initialization. Timeout after parameter submission
remains `PARAMETERS_SUBMISSION` / `PMTV-TDLIB-SET-PARAMETERS` rather than being relabeled as an
authorization failure.

### Observable retry and native ownership

Every accepted press of the Telegram runtime retry:

- increments a monotonic attempt number;
- immediately displays loading and the current safe stage;
- leaves the control visible but disabled while work runs;
- blocks duplicate attempts;
- rereads existing API credentials without reimport or passphrase entry;
- releases only safely closable stale/failed ownership;
- obtains or reuses the database key;
- constructs a fresh runtime;
- terminates with either the exact safe failure or success; and
- moves to phone-number login only after real runtime startup succeeds.

The stale-owner release itself is an observable runtime-lease stage. If it fails, retry terminates
at `PMTV-TDLIB-RUNTIME-LEASE` and preserves the previously observed database-key row instead of
falsely resetting or upgrading it.

Java-class and JNI-load checks are safe standalone probes. Client capability is measured only
through the production leased gateway. Cancellation before client creation safely closes genuinely
unstarted ownership and permits lease reuse. Once native creator invocation makes ownership
uncertain, copied database-key material is wiped, callbacks remain active, another client is
blocked, and only a real TDLib Closed update releases ownership; close/cancellation cannot invent
closure.

### TDLib database-key envelope

`FileEncryptedDatabaseKeyEnvelopeStore` remains distinct from the API credential envelope format,
filename, codec, and Keystore alias. It now independently enforces:

- package-owned `noBackupFilesDir` confinement;
- parent-component and symbolic-link escape rejection;
- Android-compatible owner-only lock opening and cross-process acquisition;
- encrypted same-directory staging;
- complete write and descriptor `fsync`;
- exact staged read-back and cryptographic verification before acceptance;
- create-only conflict protection;
- same-directory atomic move when available;
- a reviewed lock-held same-directory fallback only when atomic move is unsupported;
- final permanent exact and cryptographic read-back;
- no hard-link publication;
- no plaintext disk path; and
- cleanup that cannot mask a verified committed success.

### Dedicated database-key self-test

Mobile exposes **"בדיקת מפתח מסד TDLib"** separately from the existing Android API-vault test. The
new self-test composes the production database-key manager, encrypted envelope store/codec, Android
Keystore protector, and session-storage boundary with only:

- a unique disposable app-private root;
- a unique disposable wrapping alias;
- empty disposable database/files/temp directories; and
- random fake key material.

It proves missing initial state, first key generation, wrapping-key creation, protection,
publication, read-back, unprotection, exact second-call reuse, scoped session/envelope/alias
deletion, and final absence. Success and all failures clean only those disposable identities. UI
state contains only passed or a stable failed stage/code.

### Narrow database-key-only recovery

The confirmed **"תיקון מפתח מסד TDLib בלבד"** action is available only when all of the following
are re-proven under serialized runtime ownership:

- API credentials are accessible;
- authorization never reached Ready;
- no usable database or other session material exists; and
- the typed failure is isolated to removable database-key envelope/alias material.

Wrapping-key, corrupt/invalid-envelope, secure-storage, and key-protection failures may qualify.
Generation, consumer, and existing-database-without-key failures never qualify. The action requires
confirmation, retains API credentials and unrelated state, deletes only the mobile database-key
material and empty never-authorized TDLib directories, verifies absence, and automatically retries
startup once. Any real database, download, temporary file, symlink, unknown entry, or unavailable
inspection hides recovery and fails closed.

## Principal changed areas

- `core-security`: `DatabaseKeyContracts.kt`, `FileSecurityStorage.kt`,
  `TdlibDatabaseKeyManager.kt`, new `AndroidTdlibDatabaseKeySelfTest.kt`, Android composition, and
  focused store/manager/self-test behavior tests.
- `core-telegram`: `TelegramRuntimeHealth.kt`, `TelegramSessionController.kt`,
  `TdLibClientGateway.kt`, new `TdLibNativeStartupBoundary.kt`, and failure/ownership/startup tests.
- `app-mobile`: `MobileModels.kt`, `MobileRuntimeFacade.kt`, `MobileViewModel.kt`,
  `MobileAcceptanceApp.kt`, code-3 build identity, and model/ViewModel/manifest tests.
- `app-tv`: Settings models/ViewModel/screen, code-8 build identity, and Settings regression tests;
  no TV APK delivery.
- `.github/workflows/android-ci.yml` and scripts: code-3/code-8 artifact identities, deterministic
  ARM64 JNI layout verifier, update/delivery continuity, and exact-HEAD artifact validation.
- `README.md`, `TODO.md`, `CHANGELOG.md`, `AGENTS.md`, and the security, Telegram, provisioning,
  test, release, state, distribution, mobile, Shield, UX, and handoff documents.

## Native artifact evidence

No native build occurred. The exact canonical mobile code-2 APK was inspected before publication
changed:

| Property | Value |
| --- | --- |
| APK size | 55,989,332 bytes |
| APK SHA-256 | `07ce528d06bc097c752a4f35d1fa75d4e894ba501530900e3302da37d647aafe` |
| APK modification | `2026-08-03 16:56:04.852971303 +0000` |
| Packaged `libtdjni.so` SHA-256 | `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |
| Phone-host page size | 4,096 bytes |

The packaged JNI is ARM64 ELF64 `DYN`, identifies Android NDK r28c (`13676358`), has three `LOAD`
segments all aligned to `0x4000`, is stored uncompressed at a 16,384-byte-aligned APK data offset,
and depends only on `libc.so`, `libdl.so`, `liblog.so`, `libm.so`, and `libz.so`. Android SDK
`zipalign -P 16` verification passed.

The unchanged local official TDLib cache remains pinned to commit
`022d60202e446ad1287b9fb68e687c8a0760788b`:

| Artifact | SHA-256 |
| --- | --- |
| Local AAR | `025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2` |
| Local Java JAR | `e39bb497b7eea1f33d7d3b5816591b7656259df29e0231c10287e514e3951a04` |
| Local `libtdjni.so` | `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc` |
| CI-cache / code-2 `libtdjni.so` | `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |

The local and GitHub-runner caches are separately verified pre-existing lineages. Their JNI files
have the same required layout; the observed byte difference is confined to the GNU build ID. F1D.2
changed no TDLib source pin or native build input.

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
./gradlew :core-security:testDebugUnitTest
./gradlew :core-provisioning:testDebugUnitTest
./gradlew :core-telegram:testDebugUnitTest
./gradlew :core-playback:test
./scripts/verify-apk-native-layout.sh --apk MOBILE_APK
./scripts/verify-apk-native-layout.sh --apk TV_APK
./scripts/verify-mobile-apk.sh --apk MOBILE_APK
./scripts/verify-upgrade-apks.sh MOBILE_CODE_2_APK MOBILE_CODE_3_APK
./scripts/verify-upgrade-apks.sh TV_CODE_7_APK TV_CODE_8_APK
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

JUnit XML records 391 tests, all passed with zero skips, failures, or errors:

| Module | Tests |
| --- | ---: |
| `app-tv` | 74 |
| `app-mobile` | 45 |
| `core-model` | 15 |
| `core-playback` | 23 |
| `core-provider` | 2 |
| `core-provisioning` | 48 |
| `core-security` | 96 |
| `core-telegram` | 88 |
| Total | 391 |

All starting 338 tests were preserved. The three environment-dependent provisioning listener cases
that had skipped earlier ran successfully because the final host exposed an eligible private IPv4
interface. JVM coverage is not physical Android Keystore, TDLib, or phone evidence.

Other local results:

- Gradle 9.5.0 / JDK 21.0.11 project discovery passed.
- Full lint, focused module tasks, and both signed assemblies passed.
- WebCrypto/Kotlin interoperability and all browser/crypto checks passed with fake inputs.
- Provisioning inspector passed 4 cases; upgrade verifier passed 13; TV publication passed 9; TV
  downloader rejection passed 8; mobile publication passed 9; mobile downloader passed 19
  rejection cases plus 1 valid publication.
- Shell syntax checks passed.
- Real retained mobile code 2→3 and TV code 7→8 update checks passed with identical package/signer,
  ARM64/JNI continuity, and update-only install policy.
- `adb devices -l` listed no attached device. No installation or launch was claimed.

## Local APKs and mobile-only publication

| Field | Local mobile candidate | Local TV regression candidate |
| --- | --- | --- |
| Package/version | `com.funzi7.privatemediatv.mobile`, `0.1.2-phone-test` (3) | `com.funzi7.privatemediatv`, `0.3.5-f1c4` (8) |
| Size | 56,206,917 bytes | 57,179,081 bytes |
| APK SHA-256 | `a798b842d821f02c4e6c3ead2a60a78b4b7618d07acf1e39c8ae271cc16ca492` | `1b67d5e07df377bf9fd46c6abef473361d73b17310f25cc70608a5d18acc8066` |
| Signer/ABI | Development / ARM64 only | Development / ARM64 only |
| Packaged JNI SHA-256 | `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc` | same |

Both passed package/version/code/signer, forbidden-content, update, native dependency/layout, and
16KB `zipalign` verification. The mobile-only exporter published the local candidate at the
canonical Mobile path with modification `2026-08-03 20:01:41.388967055 +0000`. No TV exporter,
TV downloader, installation, or deployment was run.

## CI history and scoped follow-up

The first pushed application HEAD, `58365b7244e7ff3d999fd8950525f3b8d4067fc4`, produced Android CI
run `30848932688`. Wrapper validation, aggregate/focused tests, lint, and signed assembly passed.
Package verification then failed because the GitHub runner's `file(1)` rendering omitted NDK
identity text even though the ELF `.note.android.ident` section contained the pinned `r28c` and
`13676358` values. This was a verifier portability defect, not a native artifact defect.

The scoped follow-up makes the deterministic verifier read `.note.android.ident` directly and adds
a harness fixture whose `file(1)` output intentionally omits NDK text. Local native-layout checks
and the mobile CI-downloader harness passed before the follow-up commit/push.

## Exact-final-HEAD Android CI

| Field | Value |
| --- | --- |
| Run / event / branch | `30849912186` / `push` / `main` |
| Commit | `1f9f43593f75bf7a8e3131ec58959060e87c2207` |
| Conclusion | completed successfully |
| Run interval | `2026-08-03T20:22:26Z` to `2026-08-03T20:28:41Z` |
| Wrapper job | `91807133705`, passed |
| TDLib/tests/lint/TV+mobile job | `91807213288`, passed |
| TV artifact | ID `8870326065`, `private-media-tv-apk-1f9f43593f75bf7a8e3131ec58959060e87c2207`, archive 57,096,598 bytes |
| Mobile artifact | ID `8870327314`, `private-media-tv-mobile-apk-1f9f43593f75bf7a8e3131ec58959060e87c2207`, archive 56,039,558 bytes |
| Artifact expiry | TV `2026-09-02T20:28:25Z`; mobile `2026-09-02T20:28:27Z` |

The exact-final-HEAD run passed wrapper validation; official pinned-TDLib cache verification without
rebuild; artifact-selection rejection checks; browser crypto; Development signer reconstruction;
aggregate and focused F1D.2 tests; full lint; signed ARM64 TV/mobile assembly; package, version,
signer, JNI, deterministic 16KB layout and content verification; metadata/checksum creation;
separate artifact uploads; and signing-material deletion.

## Final CI mobile delivery

After successful exact-HEAD CI,
`./scripts/download-latest-ci-mobile-apk-to-phone.sh` selected only the unexpired mobile artifact
for the exact remote `main` SHA and reverified metadata, checksum, package, version, signer, ARM64
shape, JNI hash, and deterministic native layout before mobile-only publication.

Final canonical evidence:

```text
path=/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk
size=56038484
modified=2026-08-03 20:30:36.844966393 +0000
epoch=1785789036
sha256=46e1d4a35befc93cd6304eb5cc3ba333b4a3e143ad555b049f3cb4fd1b5096f2
```

It reverified as mobile code 3, Development signer, ARM64 only, and CI-cache JNI SHA-256
`790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f`. The JNI is NDK r28c ARM64
`DYN`, every `LOAD` is `0x4000`, the uncompressed data offset is 16,384-byte aligned, dependencies
match the allowlist, and Android SDK 16KB `zipalign` verification passed.

The final CI mobile publication rotated the distinct local mobile candidate to `previous`. It did
not overwrite, rotate, retimestamp, or delete any parent TV file:

- TV `latest`: 57,030,122 bytes, SHA-256
  `11bca1c3333cebcb5f08e10d5361b586cb7e7d8341b5aa0b4ff00908ba8f24aa`, modification
  `2026-08-02 21:24:04.892998128 +0000`;
- TV `previous`: 57,107,459 bytes, SHA-256
  `48095b075917c756eece8689c3684780a083018e5c03bf0568ae1261aac18877`, modification
  `2026-08-02 21:08:54.000000000 +0000`; and
- offline provisioning tool: 6,066 bytes, SHA-256
  `ff56a206d462c5f1f1a71644e04814564f47b1d801b58e4af1dab2245602f26f`, modification
  `2026-07-30 13:04:11.779997138 +0000`.

Shared-storage publication is file delivery only. It is not installation, launch, Android Keystore,
database-key, Telegram runtime, login, session, content, playback, or Shield evidence.

## Security and preservation decisions

- API credential and database-key envelopes, formats, filenames, and aliases remain separate.
- No credential, database key, passphrase, phone number, authentication value, QR value, Telegram
  identifier, session/database, private media, screenshot, signing secret, or private diagnostic
  path was committed or packaged.
- Stable failures expose no exception type/message, filesystem path, alias, raw TDLib result, or
  internal identifier.
- TDLib Java/JNI types remain inside `core-telegram`; `core-security` remains TDLib-independent.
- No native rebuild, third-party TDLib binary, hosted gateway, Bot API, analytics, advertising,
  Firebase, crash reporting, or plaintext fallback was added.
- Existing mobile package/signer/storage identities and production credential data are preserved.
- TV package/signer continuity passed, but no TV artifact was delivered or installed.

## Physical status, limitations, and risks

Physically established only from code 2: update continuity, unrestricted screenshots, structural
document validation, accepted passphrase, production API-vault storage/read-back, passing Android
API-vault self-test, later runtime-start failure, incorrect API-vault conflation, and retry that
appeared inert because it exposed no progress or exact repeated result.

The following remain pending and must not be inferred from JVM tests, APK inspection, CI, or file
delivery:

- code 2→3 update on the existing phone without uninstall or clear-data;
- retained accessibility of the already stored production API credentials after update;
- the disposable TDLib database-key self-test on the physical Android Keystore/filesystem;
- exact typed database-key/runtime startup result;
- observable numbered retry on the physical phone;
- narrow-recovery eligibility and behavior, only if the app proves it safe;
- phone-number login, authorization continuation, session restoration, content, range reads,
  codecs, seeking, playback, disconnect, and reset.

The precise physical startup root cause remains unproven. A typed code-3 result may isolate it; a
successful code-3 startup validates the repaired path but does not retroactively prove which old
substage failed. ARM64-only packaging excludes x86/x86_64 emulators and 32-bit devices.

Shield delivery, installation, update continuity, D-pad focus, overscan, QR, Telegram, codec,
performance, and playback acceptance remain deferred. Phone success cannot establish any Shield
result.

## Exact next milestone and continuation

The exact next milestone is **F1D.2 physical mobile code-3 database-key/runtime/login acceptance**:

1. Update the existing installed mobile code 2 with the final exact-HEAD code-3 CI APK. Do not
   uninstall, downgrade, clear data, or replace credentials.
2. Verify package/version/signer and confirm the existing API credentials remain accessible without
   provisioning-document reselection or passphrase entry.
3. Confirm Home independently reports API vault, TDLib database key, and TDLib runtime.
4. Run **"בדיקת מפתח מסד TDLib"** and record only passed or the stable failed stage/code.
5. Press runtime retry and verify visible loading, disabled duplicate action, increasing attempt
   number, current safe stage, and exact terminal result.
6. Use **"תיקון מפתח מסד TDLib בלבד"** only if the application offers it after proving every safe
   eligibility condition; confirm before execution and verify API credentials remain retained.
7. On startup success, continue to phone-number login and the remaining procedure in
   `docs/MOBILE_ACCEPTANCE.md` without retaining or publishing private values or captures.
8. Keep TV delivery and every Shield action deferred.

Do not rebuild native code, weaken TV secure routes, merge the two vault formats/aliases, clear an
existing database whose key is unavailable, log unrestricted diagnostic detail, or infer the old
root cause without direct physical evidence.
