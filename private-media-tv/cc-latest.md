# Private Media TV — F1D.1 Handoff

## Identity

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F1D.1 — physical Android vault repair and unrestricted mobile screenshots |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `8782f7cd12dd5ea91c9cd3cffacaf80946ab9b89` |
| Final application HEAD | `63bff9ccf5ba6a44bf8ccdf61b90a254f489d4af` |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.1.1-phone-test`, `versionCode` 2 |
| TV identity | `com.funzi7.privatemediatv`, `0.3.4-f1c3`, `versionCode` 7 |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |

The application commit was pushed without rewriting history. Local `HEAD`, `origin/main`, the
successful Android CI run, both CI artifact records, and the final mobile artifact metadata identify
the final application SHA above.

## Authoritative physical trigger and policy

The owner physically installed and launched final F1D mobile code 1 on a Samsung Android phone.
The entire mobile application blocked screenshots because its `MainActivity` unconditionally set
`FLAG_SECURE`. The owner explicitly selected the opposite policy for the diagnostic harness only:

- screenshots are allowed on every `app-mobile` screen;
- ordinary Android screen recording remains allowed;
- the application does not intentionally blank Recent Apps thumbnails;
- this exception does not alter `app-tv` sensitive-route protection.

The owner also selected the real encrypted provisioning document. The mobile UI reported the
structural-valid state before accepting a passphrase. After the correct passphrase was submitted,
code 1 reported the generic device-vault storage failure. The old public mapping collapsed multiple
Keystore and vault-file substages, so the exact physical failing stage remains unknown.

F1D.1 removes the hard-link credential publication path as an Android compatibility risk. It does
not claim that the hard link caused the observed phone failure. Only a physical code-2 retest can
establish the failing or repaired device stage.

## Implemented behavior

### Unrestricted mobile capture, protected TV routes

- `app-mobile/MainActivity` no longer applies `FLAG_SECURE`.
- No mobile secure-window helper, route policy, manifest preview suppression, or Recent Apps
  exclusion was added.
- Mobile Home visibly displays the approved Hebrew warning that screenshots are enabled and that a
  capture containing a code, password, or QR must not be shared.
- Existing `app-tv` route-scoped secure-window behavior is unchanged. Credential provisioning,
  credential QR, account login, channel/video diagnostics, and playback remain protected on TV;
  the overview route still clears only a flag it added.
- Existing secret-input clearing, redacted state, and no-logging behavior remain in force.

### Typed safe vault stages

The shared production credential vault now carries a closed, non-sensitive failure vocabulary for:

- AndroidKeyStore open, alias lookup, AES key generation, cipher initialization, encryption, and
  decryption;
- envelope encoding and cryptographic verification;
- unsafe storage location and security-directory creation;
- lock-file open and inter-process lock acquisition;
- current-envelope read;
- temporary create, owner-only permission handling, write, `fsync`, and read-back;
- expected-state conflict;
- initial and replacement publication;
- final read-back; and
- cleanup/rollback.

Each stage maps exhaustively to one stable `PMTV-*` code and one clear Hebrew message shared by TV
and mobile. Exception type/message, filesystem path, Keystore alias, ciphertext, credential,
passphrase, salt, IV, and stack trace never enter UI state or unrestricted logs. Tests enumerate
every stage/result/code and reject those private details.

### Android-compatible verified publication

Production credential-envelope publication no longer calls `Files.createLink` or uses any hard
link. The store now:

1. constrains the target beneath the package-owned `noBackupFilesDir` and rejects unsafe or
   symbolic-link path components;
2. opens an Android-compatible regular lock file and holds both process and cross-process locks
   across compare-and-publish;
3. creates an encrypted same-directory staging file;
4. applies Android `chmod(0600)` where available, or accepts only a verified owner-only
   app-private fallback;
5. fully writes and descriptor-syncs the staging file;
6. reads back the exact staged bytes, decodes them, decrypts them with AndroidKeyStore, and compares
   the expected plaintext before publication;
7. rechecks the permanent target under lock;
8. attempts a same-directory atomic move first;
9. when atomic move is explicitly unsupported, uses a lock-held non-atomic rename fallback with
   target-state recheck and mandatory final verification; and
10. reads, decodes, decrypts, and exactly verifies the permanent target after publication.

Create-only publication uses an exclusive empty reservation so Java's implementation-specific
atomic-move replacement behavior cannot overwrite an unexpected target. Explicit replacement
proceeds only while the permanent envelope exactly equals the expected prior bytes and keeps a
same-directory verified rollback envelope. A failed initial publication leaves no accepted
permanent envelope. A failed replacement preserves or restores the prior valid envelope. Owned
temporary encrypted files are deleted best-effort. Cleanup failure after a verified commit does not
turn a committed success into a false failure.

### Dedicated physical Android vault self-test

Mobile Home exposes **"בדיקת כספת Android"**. Its production composition uses the real
`CredentialVaultManager`, `FileCredentialEnvelopeStore`, and
`AndroidKeystoreCredentialProtector`, but with a unique disposable directory and unique disposable
Keystore alias. It generates 64 random fake bytes only in memory and exercises capability, key
generation, encryption, staged write/`fsync`, publication, final read-back, decryption, exact fake
payload comparison, envelope deletion, wrapping-key deletion, and final absence verification.

The self-test never opens or modifies the production credential alias/envelope, TDLib database-key
alias, Telegram session, or real credential payload. It cleans the envelope, key, and constrained
directory on success, typed failure, unexpected operation failure, and cancellation. The UI displays
only passed or one stable failed stage/code.

### Import retry and runtime behavior

- The selected, bounded, structurally validated encrypted document stays prepared in memory after
  every vault failure.
- The submitted passphrase is cleared, the owner remains on provisioning, the exact safe vault
  stage/code is displayed, and an immediate same-file retry does not reopen the document.
- No partial credential result starts Telegram or changes Telegram session state.
- A successful vault commit must report `Provisioned` and return the exact expected credential
  payload through the vault contract before the real runtime starts/restarts.
- Stored-success/runtime-failure is distinct and offers runtime-only retry without document
  recreation. Successful runtime start proceeds to login.

### Version and delivery continuity

- Mobile advanced from code 1 to code 2 with the identical package and Development signer.
- TV advanced from code 6 to code 7 for the shared production repair with the identical TV package
  and signer.
- Both remain ARM64-only and retain app-private identities. No uninstall, downgrade, package
  deletion, clear-data, version-triggered data clearing, ABI change, or signing-identity change was
  introduced.
- The mobile publisher accepts only the exact approved code-1 baseline or exact code-2 identity for
  canonical rotation, and mobile callers cannot route through the TV publisher.
- No TV exporter, TV CI downloader, or Shield deployment was run for F1D.1.

## Principal changed areas

- `core-security`: typed contracts; AndroidKeyStore stage boundaries; compare-and-set manager;
  Android-compatible file store, permissions, locking, publication, verification, rollback, and
  self-test; focused behavior tests.
- `core-provisioning`: typed vault-result projection, exhaustive Hebrew messages/codes, exact
  post-commit payload verification, and retained prepared-document behavior.
- `app-mobile`: capture policy, visible warning, vault self-test action/state, code-2 identity, and
  same-file import/runtime orchestration tests.
- `app-tv`: code-7 identity plus regression tests proving secure routes and shared safe messages.
- delivery/upgrade scripts and Android CI: exact mobile/TV versions, approved update pairs, mobile
  rotation isolation, separate exact-HEAD artifacts, and rejection harnesses.
- product, security, provisioning, acceptance, test, release, distribution, state, and handoff
  documentation.

## Native and security continuity

No TDLib native build occurred. Only the required verify-only commands ran against the unchanged
official TDLib 1.8.66 ARM64 cache.

| Property | Value |
| --- | --- |
| Official TDLib commit | `022d60202e446ad1287b9fb68e687c8a0760788b` |
| Local AAR SHA-256 | `025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2` |
| Local Java JAR SHA-256 | `e39bb497b7eea1f33d7d3b5816591b7656259df29e0231c10287e514e3951a04` |
| Local `libtdjni.so` SHA-256 | `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc` |
| CI-cache `libtdjni.so` SHA-256 | `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |

The local-host and GitHub-runner caches are separately verified, pre-existing artifact lineages.
Each APK was compared with the cache that produced it. F1D.1 changed no TDLib pin, ABI, NDK, CMake,
OpenSSL input, native flag, cached artifact, or native-identity script.

No credential, passphrase value, provisioning document, session/database, private media, Keystore
secret, signing secret, or private screenshot was packaged or committed. No analytics, advertising,
Firebase, crash reporting, hosted gateway, Bot API, third-party TDLib binary, or plaintext
credential fallback was added.

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
./gradlew :core-security:testDebugUnitTest
./gradlew :core-provisioning:testDebugUnitTest
./gradlew :app-mobile:testDebugUnitTest
./gradlew :app-tv:testDebugUnitTest
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
./scripts/verify-upgrade-apks.sh OLD_MOBILE_APK NEW_MOBILE_APK
./scripts/verify-upgrade-apks.sh OLD_TV_APK NEW_TV_APK
./scripts/export-latest-mobile-apk-to-phone.sh
adb devices -l
git diff --check
```

Results:

- Gradle 9.5.0 / JDK 21.0.11 discovered all nine projects.
- JUnit XML records 338 tests: TV 71, mobile 32, model 15, playback 23, provider 2,
  provisioning 48, security 77, and Telegram 70. Of those, 335 passed and three provisioning
  local-listener cases were skipped because the host exposed no eligible private IPv4 address.
  There were zero failures or errors, and all 307 starting tests were preserved.
- Executable WebCrypto↔production-Kotlin interoperability passed in both directions with fake
  credentials and required authentication/format/payload negatives. JVM tests do not prove real
  AndroidKeyStore or Android filesystem behavior.
- Full lint and both signed debug assemblies passed.
- Shell syntax and behavior harnesses passed: provisioning inspector 4 cases, upgrade verifier 13,
  TV publication 9, TV downloader rejection 8, mobile publication 8, and mobile downloader 19
  rejection cases plus 1 valid publication case. All three browser/crypto verifiers passed.
- The retained physical-storage APK pairs passed update verification: mobile
  `0.1.0-phone-test`/1 → `0.1.1-phone-test`/2 and TV `0.3.3-f1c2`/6 → `0.3.4-f1c3`/7, with identical
  package/signer within each pair, ARM64/JNI continuity, and update-only install policy.
- `adb devices -l` completed and listed no attached device. It supplied no installation or physical
  acceptance evidence.

## Local APK and mobile-only delivery

| Field | TV regression APK | Mobile APK |
| --- | --- | --- |
| Package / version | `com.funzi7.privatemediatv`, `0.3.4-f1c3` (7) | `com.funzi7.privatemediatv.mobile`, `0.1.1-phone-test` (2) |
| Size | 57,062,890 bytes | 55,989,332 bytes |
| APK SHA-256 | `16571c791a7443f24f2237792a49454ae4b952ae2547ff5759d243afa390eebc` | `c8d54a5d7774410ff3484d6a3267f69352bcd36459872f7d21ec0f8fae13b942` |
| Signer / ABI | Development signer / ARM64 only | Development signer / ARM64 only |
| Packaged JNI | byte-equal to local verified cache | byte-equal to local verified cache |

Both APKs passed ZIP integrity, package/version/code/signer, native-entry, ELF/Android JNI identity,
prohibited-entry, and DEX credential-field checks. The only TV media entry is the tracked generated
public sample and is byte-equal to its repository source; mobile contains no media entry.

The local exporter placed only the verified mobile APK at
`/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk`:

```text
size=55989332
modified=2026-08-03 16:32:56.664971833 +0000
epoch=1785774776
sha256=c8d54a5d7774410ff3484d6a3267f69352bcd36459872f7d21ec0f8fae13b942
```

No TV exporter was run. Both canonical parent TV APKs retained their exact sizes, hashes, and
timestamps across local mobile publication.

## Exact-HEAD Android CI

| Field | Value |
| --- | --- |
| Run / event / branch | `30833624635` / `push` / `main` |
| Commit | `63bff9ccf5ba6a44bf8ccdf61b90a254f489d4af` |
| Conclusion | completed successfully |
| Wrapper job | `91753329254`, passed |
| TDLib/tests/lint/TV+mobile job | `91753361932`, passed in 7m57s |
| TV artifact | ID `8864141749`, `private-media-tv-apk-63bff9ccf5ba6a44bf8ccdf61b90a254f489d4af` |
| TV artifact archive | 57,063,830 bytes; SHA-256 `c3629dd1dd7219c8b324a906f82dd6c7dcce80a84acddb9daf1bbe093ef50e7d` |
| Mobile artifact | ID `8864142566`, `private-media-tv-mobile-apk-63bff9ccf5ba6a44bf8ccdf61b90a254f489d4af` |
| Mobile artifact archive | 55,990,406 bytes; SHA-256 `dfa2afcdf8341351bbe02d7ff7913988acc64c038d0640f7d47cd4884f2ef128` |
| Artifact expiry | TV `2026-09-02T16:53:25Z`; mobile `2026-09-02T16:53:26Z` |

The exact-HEAD run passed wrapper validation; restored-cache TDLib verification without rebuild;
artifact-selection rejection tests; browser crypto verification; Development signer reconstruction
and fingerprint check; aggregate and focused F1D.1 tests; full lint; signed ARM64 TV/mobile assembly;
both package/version/signer/JNI/prohibited-content checks; non-sensitive metadata/checksum creation;
separate TV/mobile uploads; and signing-material deletion. GitHub emitted a non-failing maintenance
annotation that pinned actions declaring Node.js 20 were forced to Node.js 24.

## Final CI mobile APK delivery

After successful exact-HEAD CI,
`./scripts/download-latest-ci-mobile-apk-to-phone.sh` selected only the unexpired mobile artifact
for the exact remote `main` SHA and reverified its metadata, checksum, package, version, signer,
ARM64 shape, and workflow-recorded JNI before mobile-only publication.

Final canonical evidence:

```text
path=/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk
size=55989332
modified=2026-08-03 16:56:04.852971303 +0000
epoch=1785776164
sha256=07ce528d06bc097c752a4f35d1fa75d4e894ba501530900e3302da37d647aafe
```

It reverified as exact application/artifact commit
`63bff9ccf5ba6a44bf8ccdf61b90a254f489d4af`, mobile package
`com.funzi7.privatemediatv.mobile`, version `0.1.1-phone-test`/2, Development signer, ARM64 only,
exactly one `lib/arm64-v8a/libtdjni.so`, and CI-cache JNI SHA-256
`790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f`.

The CI mobile publisher did not overwrite, rotate, retimestamp, or delete either canonical TV APK:

- TV `latest`: 57,030,122 bytes, SHA-256
  `11bca1c3333cebcb5f08e10d5361b586cb7e7d8341b5aa0b4ff00908ba8f24aa`, epoch `1785705844`;
- TV `previous`: 57,107,459 bytes, SHA-256
  `48095b075917c756eece8689c3684780a083018e5c03bf0568ae1261aac18877`, epoch `1785704934`.

Shared-storage publication is file delivery only. It is not installation, launch, AndroidKeyStore,
import, Telegram login, session restoration, playback, or physical-device evidence.

## Physical status, limitations, and risks

Established physical evidence is limited to the owner's code-1 phone observations: successful
installation/launch, globally blocked screenshots, structurally valid real encrypted document, and
generic vault failure after passphrase submission. F1D.1 code 2 was not installed or launched during
agent validation because no authorized ADB device was attached.

The following remain pending and must not be inferred from JVM tests, APK inspection, CI, or file
delivery:

- code-1 → code-2 update on the existing phone without uninstall or clear-data;
- physical confirmation of unrestricted mobile screenshots/recording/Recent Apps and the warning;
- disposable vault self-test on the real AndroidKeyStore and app-private filesystem;
- production import retry, exact vault status/payload, and safe stage result on the real document;
- real Telegram runtime start, account login, session restoration, content discovery, range reads,
  codecs, seeks, and playback;
- physical disconnect/reset and package-data continuity.

The exact code-1 vault root cause remains unproven. A code-2 success would validate the repaired
path on that phone; a code-2 failure should now identify one safe stage/code. ARM64-only packaging
excludes x86/x86_64 emulators and 32-bit devices. Host/JVM tests cannot establish OEM Keystore,
`fsync`, rename, lock, or permission behavior.

Shield delivery, installation, vault/import/login, update continuity, D-pad focus, overscan, QR
presentation, codecs/performance, and playback were intentionally deferred. No TV APK was exported
or delivered and `deploy-shield.sh` was not run. Phone success cannot establish any Shield result.

## Exact next milestone and continuation

The exact next milestone is **F1D.1 physical code-2 phone acceptance**:

1. Update the existing code-1 mobile package to the final code-2 CI APK without uninstall,
   downgrade, or clear-data; verify package, version, signer, ARM64 identity, and retained
   app-private data.
2. Confirm captures are unrestricted throughout mobile and that the visible Hebrew sharing warning
   is present. Do not retain or publish any sensitive capture.
3. Run **"בדיקת כספת Android"** and record only pass or the stable failed stage/code.
4. Reuse the already available encrypted document, confirm structural validation, submit the
   passphrase locally, and record only the safe result. On vault failure, verify the document remains
   prepared, the passphrase field clears, and immediate same-file retry works without reselection.
5. On stored success, verify runtime start/login proceeds without recreating the document. Complete
   the remaining restoration/content/range-playback/disconnect/reset procedure in
   `docs/MOBILE_ACCEPTANCE.md` without recording private values or identifiers.
6. Keep all Shield work deferred to a later, separately evidenced milestone.

Do not change native identity, weaken TV secure routes, reintroduce hard links, add unrestricted
diagnostic logging, or infer a root cause from the code-1 generic failure.
