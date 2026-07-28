# Private Media TV — F0 Foundation Handoff

## Identity

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Completed milestone | F0 Foundation |
| Version | `0.1.0-f0` (`versionCode` 1) |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `fdee6f2d293bd7ad4ba7ac63d8938e03f7845c2b` |
| Ending application HEAD | `a451eb93ba73f6f51671c9a334fae079f48ddef1` |
| Initial F0 implementation commit | `b0a99c61e1b4fd593851ba0b514858500265ed17` |
| CI-bootstrap correction commit | `a451eb93ba73f6f51671c9a334fae079f48ddef1` |

The application ending HEAD was pushed to `origin/main` and verified against both the remote branch and the repository API. The second commit is a non-destructive follow-up made after the first real CI run exposed a hosted-runner SDK bootstrap failure; history was not rewritten.

## Modules created

- `app-tv`
- `core-model`
- `core-provider`
- `core-playback`
- `core-designsystem`

No empty future integration, persistence, synchronization, phone, or backend modules were created.

## Files created and updated

The foundation added 65 new application paths and replaced the initial repository README with the product README. Major groups are:

- root workflow/build files: `.editorconfig`, `.gitignore`, `AGENTS.md`, `CLAUDE.md`, `CHANGELOG.md`, `README.md`, `TODO.md`, `settings.gradle.kts`, `build.gradle.kts`, `gradle.properties`, the version catalog, Gradle wrapper files, and `.github/workflows/android-ci.yml`;
- `app-tv`: module build file, TV manifest, launcher resources, Home/details/progress/player Compose screens, shell navigation state, local sample data, generated local media resource, and navigation-state tests;
- `core-model`: identifiers, media/catalog/source/progress/watched models, completion policies, and behavior tests;
- `core-provider`: pure catalog, metadata, stream, and subtitle contracts;
- `core-playback`: Media3 controller abstraction, player state/progress callbacks, video surface, and formatting tests;
- `core-designsystem`: neutral colors/spacing/theme and reusable focusable TV cards;
- documentation: `PRODUCT_SPEC.md`, `PROJECT_STATE.md`, `ARCHITECTURE.md`, `DATA_MODEL.md`, `TELEGRAM_INTEGRATION.md`, `SECURITY.md`, `UX_DECISIONS.md`, `TEST_PLAN.md`, `RELEASE_REVIEW.md`, `HANDOFF.md`, and ADRs 0001–0003.

The CI correction updated the workflow plus `CHANGELOG.md` and the four validation/handoff state documents with the observed first-run failure.

## Implemented behavior

- Installable Android TV debug application with application ID `com.funzi7.privatemediatv`.
- Leanback launcher activity, landscape orientation, touchscreen-not-required declaration, RTL support, TV banner/icon, and backup/data-transfer exclusions.
- Neutral Compose for TV engineering shell with:
  - working title and version/build information;
  - an explicit F0 disconnected-integration message;
  - a horizontal row of generic local sample cards;
  - generic local details;
  - an episode-state grid showing unavailable, available/unplayed, in-progress, and watched;
  - D-pad-focusable elements with visible focus and accessibility status semantics;
  - deterministic entry focus plus saveable destination, selected-card, and focus-return state.
- Media3 playback demonstration using a committed 60-second synthetic local H.264/AAC asset:
  - play and pause;
  - ten-second forward/backward seek with bounds;
  - actual player position, duration, phase, and error state;
  - real progress callbacks through the playback abstraction;
  - pause on lifecycle stop and release on disposal.
- Separate movie, series, and episode domain types.
- Pure episode completion policy with:
  - completion at 30 seconds remaining or less when duration/final-segment information is reliable;
  - 90% fallback only for unreliable duration/final-segment information;
  - no completion from opening media;
  - sticky completion after a backward seek;
  - manual watched and unwatched overrides;
  - `END_THRESHOLD`, `RATIO_FALLBACK`, and `MANUAL` reasons.
- Separate movie policy with automatic completion disabled.
- Provider-managed, range-aware source references that do not require a public URL or expose an external SDK type.

## Architecture decisions

- The product is private, single-user, Android TV-first, and D-pad-only capable; NVIDIA Shield TV Pro remains the primary physical target.
- Future account access is on-device through TDLib, with provider SDK types isolated behind adapters.
- Only owner-approved sources are eligible for future indexing.
- Media bytes remain directly between the source service and device.
- A future backend may synchronize application state only; it must not relay media or hold sensitive account state.
- Catalog discovery, metadata lookup, stream resolution, and subtitle resolution are separate pure contracts, inspired by Stremio separation only.
- The project contains no Stremio runtime, addon server/protocol, dependency, copied asset/code, or torrent support.
- Compose for TV and Media3 are the UI/playback foundation.
- TMDB is planned as the primary future metadata provider; other ratings providers remain deferred.
- Hebrew, RTL, and mixed-direction titles are required.
- The episode grid is the approved primary series-progress visualization.
- Movie automatic completion and final catalog visual direction remain unresolved.

## Commands and validation actually run

Environment and preflight inspection included:

```bash
java -version
javac -version
echo "$ANDROID_HOME"
echo "$ANDROID_SDK_ROOT"
ls -la "${ANDROID_HOME:-${ANDROID_SDK_ROOT:-/nonexistent}}"
gradle --version
adb devices -l
```

The installed environment was OpenJDK/Javac 21.0.11 on Linux ARM64. Android environment variables were unset; the usable local SDK was discovered at `/opt/android-sdk` with API/Build-Tools 36 available. No system Gradle command was installed, so the committed checksum-protected wrapper is authoritative.

Final local validation included:

```bash
./gradlew --version
./gradlew projects
./gradlew test
./gradlew lint
./gradlew :app-tv:assembleDebug
./gradlew :core-model:test :core-playback:testDebugUnitTest :app-tv:testDebugUnitTest
find app-tv/build/outputs/apk -type f -name '*.apk' -print -exec ls -lh {} \;
git diff --check
git diff --cached --check
git status --short --branch
```

Additional inspections used the Android APK analyzer, `ffprobe`, SHA-256 hashing, staged-path review, ignore-rule checks, dependency/scope searches, remote branch comparison, and real GitHub Actions run inspection.

## Passed checks

- Gradle 9.5.0 wrapper launched on JVM 21.0.11.
- Project discovery listed exactly the five intended modules.
- `./gradlew test` passed.
- 21 behavior tests passed with zero failures/errors:
  - 13 episode/movie completion-policy tests;
  - 2 catalog/source transformation tests;
  - 3 playback formatting tests;
  - 3 navigation save/restore/focus-return tests.
- Android lint passed with zero errors. Remaining warnings are pinned-version/API update notices and the required landscape-orientation notice.
- Debug APK assembly passed.
- Focused model, playback, and navigation test tasks passed.
- Debug APK exists at `app-tv/build/outputs/apk/debug/app-tv-debug.apk`, size 16,051,797 bytes, SHA-256 `694130e55945041b420037ba5c67353c3559b8e7b5fa377bd501fefa72e2ed14`.
- Packaged-manifest inspection confirmed ID/version, API 26 minimum, API 36 target/compile, Leanback required, touchscreen not required, TV launcher category, landscape, icon, and banner.
- The committed local sample was confirmed as 60 seconds of H.264 640×360 video with AAC 48 kHz audio.
- Both staged and unstaged whitespace checks passed.
- Gradle wrapper validation passed locally and in CI.
- Corrected Android CI run `30362512805` for ending HEAD `a451eb93ba73f6f51671c9a334fae079f48ddef1` completed successfully:
  - Android SDK setup passed;
  - wrapper validation passed;
  - unit tests passed;
  - Android lint passed;
  - debug APK assembly passed.

## Failed checks and resolutions

Resolved local build failures:

- An unavailable JDK 17 toolchain request was replaced by running on installed JDK 21 while emitting Java/Kotlin 17-compatible bytecode.
- Java/Kotlin target mismatch was resolved by pinning both bytecode targets to 17.
- API-37-only Core/Lifecycle artifacts were replaced with stable API-36-compatible versions.
- An inapplicable navigation-saver method reference was replaced with explicit save/restore lambdas.

Observed CI failure:

- Initial Android CI run `30362218357` for `b0a99c61e1b4fd593851ba0b514858500265ed17` completed with failure.
- Its wrapper-validation job passed.
- Its build job stopped before project checks because the hosted runner did not expose `sdkmanager` on `PATH`; unit tests, lint, and assembly were skipped in that run.
- The workflow was corrected with pinned `android-actions/setup-android` v4.0.1 and required API-36 packages. The correction run `30362512805` then passed completely.

There are no unresolved local unit-test, lint-error, assembly, push, remote-verification, or corrected-CI failures.

## Physical checks not performed

`adb devices -l` listed no devices. Physical Android TV testing was not performed, and no NVIDIA Shield result is claimed.

The following remain physically unverified:

- installation and launcher visibility;
- remote-only D-pad traversal and focus restoration;
- details/grid/player entry and exit;
- play, pause, seeking, decoding, audio, and lifecycle release;
- Hebrew/RTL behavior on a TV;
- accessibility-service traversal.

The exact English manual procedure is in `docs/TEST_PLAN.md` in the application repository.

## Limitations

- No TDLib dependency, authentication, remote content, or authenticated stream data source exists in F0.
- No metadata service, persistence, synchronization, phone application, backend, analytics, advertising, or crash-reporting integration exists.
- The F0 playback loader accepts a local Android URI. A future provider-managed stream still needs an authenticated, range-aware Media3 data-source adapter.
- Episode-grid state is local sample presentation data and is not persisted.
- Manual watched/unwatched domain behavior has no final TV interaction.
- The local/CI APK evidence does not prove target-device decoding or remote behavior.
- No production deployment or release signing occurred.

## Risks

- TDLib native packaging, ABI compatibility, secure local state, range-aware reads, seeking, and cleanup are unproven.
- Focus placement, scrolling, RTL layout, accessibility announcements, and Media3 lifecycle behavior can differ on physical TV hardware.
- Future provider/persistence work must preserve the local-first and no-media-proxy boundaries.
- Public handoffs must continue to use only generic product data and non-sensitive evidence.

## Unresolved decisions

- Stremio-inspired, Netflix-inspired, or separately approved hybrid catalog direction.
- Automatic movie completion.
- Season-level and whole-series numerical summaries.
- Final grid density, grouping, pagination, artwork ratios, typography, motion, and focus treatment.
- Manual watched/unwatched TV entry point.
- Phone-to-TV interaction.
- Subtitle-selection UX.
- Future state-sync protocol and backend shape.

## Exact next milestone

**TDLib authentication and Telegram playback spike**

Full channel indexing and catalog implementation are not the immediate next milestone.

## Continuation instructions

1. Run both mandatory repository preflights and preserve any new or unrelated work.
2. Confirm application HEAD `a451eb93ba73f6f51671c9a334fae079f48ddef1` and corrected CI run `30362512805`.
3. Run the complete `docs/TEST_PLAN.md` physical procedure when an authorized Android TV is available; keep device evidence separate from build/CI evidence.
4. Limit the next milestone to TDLib packaging/authentication and one direct, authenticated, range-aware Media3 playback proof.
5. Keep all sensitive owner data device-local and outside source control, logs, screenshots, CI, and this public repository.
6. Do not expand into full catalog ingestion before the playback spike succeeds.
