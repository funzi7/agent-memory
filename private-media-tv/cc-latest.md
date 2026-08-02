# Private Media TV — F1C Handoff

## Identity

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Completed milestone | F1C — TV Home UX, continue watching, removal, and full-screen Telegram account QR presentation |
| Version | `0.3.1-f1c` (`versionCode` 4) |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `9241da8f7793d9a45341657b4e4d159b8e7cfaf6` |
| F1C implementation and ending application HEAD | `580ea31637ecfd7a59d446bf61679a16053d9350` |

The ending application HEAD was pushed without rewriting history, verified at `origin/main`, used by the successful Android CI run, and matched by the CI artifact delivered to canonical phone storage.

## Preserved foundation

F1C reused the verified official TDLib artifact and did not rebuild native code.

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

The secure credential-provisioning architecture, real TDLib QR/phone authorization state machine, disconnect/reset separation, signed ARM64 packaging, local/CI APK delivery scripts, tests, and CI structure remain intact. Raw TDLib Java/JNI types remain confined to `core-telegram`; `core-security` remains independent of TDLib. No third-party TDLib binary, wrapper, fork, gateway, or Bot API was introduced.

## Approved UX and behavior

F1C implements the owner-approved original hybrid direction: Netflix-like content-first hierarchy with selective Stremio-like information density. It copies no branded asset, logo, screenshot, font, layout, endpoint, code, dependency, or torrent behavior.

Home now presents:

1. a compact TV header;
2. compact Settings and local-playback quick actions;
3. a prominent horizontal **"המשך צפייה"** row;
4. the existing fictional local media samples below the primary row.

The former Progress action is absent from Home and details. Its route remains only as unreachable internal regression/debug continuity, not a top-level product path. Settings remains accessible for management and Telegram status/actions without acting as the content hub.

### Continue watching

The new app-private tracker:

- creates a record only after a player callback reports that playback actually occurred;
- filters completed content through the existing episode/movie completion policies;
- projects all eligible stored records newest-first;
- exposes an explicit empty state;
- shows title, optional context, resume time, and a bounded progress bar when duration is reliable;
- resumes the selected local item from its saved position;
- supports D-pad navigation and visible focus;
- uses D-pad center/OK long-press as the primary path to **"הסרה מהמשך צפייה"**;
- removes only that item's local resume/history record;
- leaves Telegram data, credentials, sessions, downloads, and other application state untouched;
- permits the item to reappear after playback starts again.

Persistence uses the existing app-private `private-media-tv-progress` preference domain with a versioned JSON record. Full application reset already deletes that domain. The current product wiring tracks the real local sample player; durable Telegram catalog targets remain deferred with the catalog itself. No unfinished catalog module or section was added.

### Telegram account QR

The prior account-login QR shared the scrollable Settings content and was physically reported low/cropped. F1C routes QR authorization states to a dedicated non-scrollable full-screen landscape presentation:

- the QR square is bounded against both available height and width;
- ZXing renders a four-module quiet zone and the UI adds white padding;
- the code remains centered in its own column;
- instructions, factual status, Back, and phone fallback occupy a separate column;
- the fallback cannot push the code below the fold;
- Back closes the route safely and clears the presentation value;
- current TDLib refreshes replace the in-memory QR;
- inactive routes and the phone method reject QR publication;
- phone/code/email/password/registration challenges remain in the scrollable Settings presentation.

The QR value is not logged, persisted, included in saved navigation state, or exposed through semantics. Credential-provisioning QR and Telegram account-login QR remain separate ephemeral secrets.

## Principal implementation areas

- `app-tv/.../continuewatching/`: projection, completion-policy integration, app-private storage, ViewModel wiring, removal, and focused tests;
- `app-tv/.../ui/HomeScreen.kt`: content-first Home, quick actions, horizontal row, empty state, progress cards, resume, and long-press dialog;
- `app-tv/.../ui/PlaybackDemoScreen.kt`, `SampleContent.kt`, `MainActivity.kt`, and `PrivateMediaTvApp.kt`: stable local media keys, playback-driven recording, resume, navigation, and focus restoration;
- `core-designsystem/.../FocusableTvCard.kt`: optional D-pad-compatible combined click/long-click support;
- `app-tv/.../settings/SettingsModels.kt`, `SettingsViewModel.kt`, and `ui/SettingsScreen.kt`: ephemeral presentation state, full-screen QR branch, safe dismissal, refresh replacement, and Settings spacing cleanup;
- `.github/workflows/android-ci.yml` and APK delivery tests/scripts: F1C version metadata and artifact verification;
- reconciled README, TODO, changelog, product, state, architecture, data, Telegram, security, UX, test, release, distribution, acceptance, and handoff documents.

No backend, analytics, advertising, crash reporting, permanent channel allowlist, full catalog index, metadata service, subtitles, phone app, synchronization, production signing, or production deployment was added.

## Local validation

Observed toolchain: Gradle `9.5.0`, JDK `21.0.11`, Android Gradle Plugin `9.3.0`, Kotlin `2.2.10`, compile/target SDK 36, and minimum SDK 26.

Commands actually run included:

```bash
./scripts/bootstrap-tdlib-android.sh --verify-only
./scripts/verify-tdlib-artifact.sh
./gradlew --version
./gradlew projects
./gradlew test
./gradlew lint
./gradlew :app-tv:assembleDebug
./gradlew :app-tv:testDebugUnitTest
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

- both TDLib verification commands passed against the existing cache;
- Gradle project discovery, aggregate tests, focused app tests, full lint, and signed assembly passed;
- JUnit XML records 217 tests, zero failures/errors, and three existing environment-assumption socket-test skips; all 39 app tests ran and passed;
- the F1C behavior tests cover row population, ordering, empty state, long-press action visibility, remove, replay-driven re-entry, open-without-playback, QR entry, dismissal, replacement, inactive-state rejection, and full-screen-versus-scrollable presentation;
- shell syntax passed for top-level and library scripts;
- seven APK phone-delivery cases, eight CI-downloader rejection cases, and both offline browser verifiers passed;
- `git diff --check` passed before commit;
- static package-content review found no packaged credential, key, session, or private-media material.

The tests establish implementation behavior through JVM state/policy tests and compilation. They do not establish physical D-pad dispatch, focus traversal, overscan/cropping, QR scan success, Telegram networking, Android Keystore hardware behavior, or media playback on a Shield.

## Local APK and first phone delivery

| Field | Value |
| --- | --- |
| Build path | `app-tv/build/outputs/apk/debug/app-tv-debug.apk` |
| Package / version | `com.funzi7.privatemediatv` / `0.3.1-f1c` (4) |
| Size | 56,980,970 bytes |
| APK SHA-256 | `583e44462a5cb0293f95addd3951fbdaef8cf4cbcc5b77acc7b87865931ed171` |
| Signer | Expected Development certificate |
| Native payload | `arm64-v8a` only; `libtdjni.so` present |

Package, version, version code, signer, ABI set, TDLib JNI presence, and forbidden packaged credential/session content checks passed. The mandatory local publisher copied this APK to the canonical latest slot, retained a distinct valid prior APK in the previous slot, preserved the offline provisioning HTML, and left exactly the three canonical regular files. This is verified file delivery, not installation or launch.

## Pushed CI evidence

| Field | Value |
| --- | --- |
| Android CI run | `30756766127` |
| Event / branch / commit | `push` / `main` / `580ea31637ecfd7a59d446bf61679a16053d9350` |
| Result | Completed successfully |
| Gradle wrapper job | `91520158405`, passed |
| TDLib/tests/lint/APK job | `91520193486`, passed |
| Artifact ID | `8836229693` |
| Artifact name | `private-media-tv-apk-580ea31637ecfd7a59d446bf61679a16053d9350` |
| Archive size | 56,981,909 bytes |
| Archive digest | `sha256:a7d1ea03fc749a6c7c778326f94954166d4b42295183bafe5159e1c5883596b1` |
| Artifact expiry | `2026-09-01T16:36:00Z` |

The run passed Gradle-wrapper validation; pinned Java/Gradle/Android SDK/NDK setup; official TDLib cache restoration and verification; delivery/downloader and browser-crypto checks; Development signing reconstruction/fingerprint verification; aggregate and focused F1C tests; Android lint; signed ARM64 APK assembly; package/version/signer/native/forbidden-content inspection; checksum and non-sensitive metadata generation; artifact upload; signing-material deletion; and cleanup. The pull-request-only isolated signer was correctly skipped on a main push.

GitHub emitted a non-failing platform annotation that pinned actions declaring Node.js 20 were forced to Node.js 24. It did not affect the successful result but remains a future maintenance item.

CI used no real Telegram credentials or account.

## CI APK phone delivery

After successful final-HEAD CI, `./scripts/download-latest-ci-apk-to-phone.sh` selected the exact successful run and unexpired artifact, then verified commit metadata, checksum, package, version, ABI, and signer before publication.

Final canonical phone directory:

| File | Evidence |
| --- | --- |
| `private-media-tv-latest.apk` | CI F1C APK; 56,980,970 bytes; SHA-256 `74656909debd114c018181cce9103208a818ca596f3d57b2981d84f949c64fca` |
| `private-media-tv-previous.apk` | distinct local F1C APK; 56,980,970 bytes; SHA-256 `583e44462a5cb0293f95addd3951fbdaef8cf4cbcc5b77acc7b87865931ed171` |
| `telegram-provisioning-file.html` | 6,066 bytes; SHA-256 `ff56a206d462c5f1f1a71644e04814564f47b1d801b58e4af1dab2245602f26f` |

All three are regular files. Exactly these names remain; no unrelated phone file was removed. The CI APK verifies as F1C, uses the expected signer, contains only ARM64 native entries, and includes `libtdjni.so`. The downloader reported rotation performed and zero historical removals. This remains file delivery only, not installation or launch.

## Physical evidence and remaining blocker

Owner-reported prior offline physical evidence:

- the application installed and opened;
- navigation worked;
- Settings opened;
- the offline flow generally passed;
- the old Telegram account QR appeared low/cropped and was not fully visible, which blocked real login.

This report is authoritative but distinct from agent-run F1C validation. For this milestone, `adb devices -l` listed no authorized device. `./scripts/deploy-shield.sh` exited 3 because no Shield address was configured and correctly reported not configured/not attempted.

Therefore no claim is made that F1C was installed or launched, that its D-pad/focus/RTL/overscan behavior passed, that the new QR was fully visible or scan-successful on a TV, or that real Telegram login, session restoration, channel discovery, playback, seek, or disconnect succeeded. The new QR presentation and real Telegram path remain physically untested.

The blocker before broader catalog work is owner acceptance of F1C on an authorized NVIDIA Shield: verify the new Home/continue-watching interaction, long-press removal/re-entry, full-screen QR visibility and scanning, real Telegram login, and representative playback without recording private values.

## Risks and limitations

- Full-screen layout bounds and unit/state tests do not prove TV overscan or QR-camera readability.
- Compose/JVM coverage does not prove physical long-press dispatch or focus restoration.
- Continue watching currently has stable local sample targets; durable Telegram targets depend on the deferred catalog identity layer.
- Local HTTP provisioning protects against passive observation but is not authenticated TLS and does not resist an actively compromised LAN/browser.
- Keystore invalidation, process death, device filesystem behavior, and real TDLib lifecycle need physical validation.
- The range-player window remains an unmeasured engineering default.
- ARM64-only packaging excludes x86/x86_64 emulators and 32-bit devices.
- Upgrade continuity depends on preserving the external Development signing identity.
- Pinned CI actions declaring Node.js 20 should be refreshed in a scoped maintenance change before future platform enforcement.

## Next milestone and continuation instructions

The exact next milestone is physical F1C Shield acceptance before broader catalog/indexing work.

1. Run both repository preflights and preserve unrelated work.
2. Verify application HEAD `580ea31637ecfd7a59d446bf61679a16053d9350`, successful run `30756766127`, and the matching F1C artifact.
3. Do not add real credentials, QR links, sessions, identifiers, private titles/filenames, screenshots, or sensitive logs to source, CI, issues, or public handoffs.
4. On an authorized Shield, perform the updated acceptance procedure and record only sanitized pass/fail evidence.
5. Validate Home D-pad traversal, visible focus, row empty/populated/order behavior, resume, center/OK long-press removal, and playback-driven re-entry.
6. Validate that account QR opens full-screen, is fully visible without scrolling or cropping, remains readable after TDLib refresh, and closes safely; then validate real login and representative playback.
7. Fix any scoped physical defect before beginning permanent catalog indexing, metadata integration, or allowlist UX.
8. Preserve the TDLib pin/artifact identity, secure credential architecture, Development signer, ARM64 packaging, and permanent local-build/local-phone/CI/CI-phone evidence workflow.
