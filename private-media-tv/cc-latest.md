# Private Media TV — F1D.4 Handoff

## Identity

| Field | Value |
| --- | --- |
| Application repository | `funzi7/private-media-tv` |
| Milestone | F1D.4 — adaptive Telegram streaming performance and approved TV catalog UX specification |
| Branch / tracking branch | `main` / `origin/main` |
| Starting application HEAD | `f90882cc28d3e88912347052b717f48808e8a9a9` |
| Final application HEAD | `2c97790b08178658b8ca37c0d66832d94fd954dd` |
| Application milestone commit | `2c97790b08178658b8ca37c0d66832d94fd954dd` |
| Manager-verified starting agent-memory commit | `33f157c13317a37b609e4752a823038e45d70aec` |
| Actual agent-memory parent after preserving newer unrelated work | `928782cd1e16647df007abd905fca83f90d55256` |
| Mobile identity | `com.funzi7.privatemediatv.mobile`, `0.1.4-phone-test`, `versionCode` 5 |
| TV identity | `com.funzi7.privatemediatv`, `0.3.7-f1c6`, `versionCode` 10 |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |

The application milestone commit was pushed without rewriting history. Final application `HEAD` and
`origin/main`, exact-HEAD Android CI, both uploaded artifacts, and the downloaded CI mobile artifact
all identify the final application SHA above.

## Outcome

F1D.4 replaces the fixed at-most-4-MiB Telegram request window with a bounded adaptive 8 → 16 →
32 MiB policy, preserves the single effective per-file request supported by pinned TDLib, adds
low-watermark read-ahead and stale-update protection, owns an explicit Media3 buffering profile, and
adds non-sensitive in-memory performance instrumentation. It also records the approved future TV
catalog requirements without implementing permanent indexing, TMDB networking, or the final TV
redesign.

Mobile advances from code 4 to code 5 and TV advances from code 9 to code 10 with unchanged package,
Development signer, protected-storage identities, TDLib paths, ARM64 packaging, and official native
lineage. The TV APK was built and verified as a shared-code regression artifact only; it was not
exported, delivered, installed, or deployed.

## Authoritative physical code-4 baseline

The owner physically updated and tested mobile code 4 before F1D.4. Established facts are:

- credentials, the TDLib database-key state, and the authenticated Telegram session survived the
  update without reprovisioning or relogin;
- Telegram remained connected and broadcast channels and real media were visible;
- the same previously failing media opened;
- the direct production probe read exactly 65,536 bytes from local cache at `LOCAL_FILE_READ`;
- Media3 started playback, rendered visible video, produced audible audio, and consumed many
  megabytes through the production provider; and
- retry, typed diagnostics, and bounded cleanup remained available.

This closes the basic range-delivery blocker and proves there was no native TDLib defect to repair.
Code 4 still used fixed request windows no larger than 4 MiB. It did not establish code-5 startup,
long-playback, rebuffer, cold-large-media, network-continuity, or Shield performance.

## Implemented streaming transaction

### Adaptive provider-neutral range policy

`core-provider` owns a pure adaptive selector. Its bounded outputs are:

- 8 MiB for cold startup, parser-originated far demand, or a user/far seek;
- 16 MiB after at least 4 MiB of continued sequential consumption;
- 32 MiB after at least 12 MiB of useful sustained sequential consumption; and
- the known remaining size when it is smaller than the selected window.

No request is zero length or larger than 32 MiB. An unbounded Media3 `DataSpec` never becomes a
whole-large-resource TDLib request. Verified complete files remain local, partial local bytes are
reused first, and a seek resets sequential prediction to a focused 8 MiB window.

Policy input includes current position, known total size, sequential bytes consumed, seek state,
locally available coverage, active request bounds, recent provider throughput, recent consumption
rate, buffered duration, playback speed, and buffering/rebuffer pressure.

### One-file ownership and read-ahead

Pinned TDLib has one effective user-initiated `DownloadFile` request slot per file; another call may
alter that request rather than create an independent parallel range. The implementation therefore:

- owns at most one active request for the file/session;
- reuses active coverage and coalesces overlapping or adjacent demand;
- suppresses duplicate effective requests;
- binds responses and updates to current session/request generation;
- rejects stale updates after seek or replacement;
- replaces only obsolete coverage that cannot satisfy the new position;
- cancels only an active request owned by that playback session; and
- never cancels completed media.

Bounded low-watermark read-ahead starts before readable coverage reaches zero without delaying an
already readable foreground range. Its ordinary threshold is one quarter of the selected window and
its pressure threshold is one half. Pause/close stops unjustified prefetch, resume recalculates from
actual state, and seek resets prediction. There is no parallel request queue or unbounded background
download.

The final concurrency regression proves that a pause arriving during range-session construction and
publication cannot be missed: `activeSession` is volatile, and adaptive/read-ahead decisions consume
the latest source-level playback state.

### Performance diagnostics

Provider and playback instrumentation uses monotonic clocks and typed in-memory state. It covers:

- provider and read bytes per second plus moving-average throughput;
- read-consumption rate;
- time to first provider byte;
- time to Media3 `READY`;
- time to first rendered frame;
- current adaptive request size;
- locally available bytes and network request count;
- buffered duration;
- rebuffer count and accumulated rebuffer duration;
- local/network origin, delivered bytes, current stage, and stable safe failure code.

The diagnostic state contains no title, channel, filename, path, Telegram identifier, account value,
raw platform/TDLib error, exception, or stack trace. The mobile engineering block is secondary to
ordinary playback controls and is not a default final-TV surface.

### Exact Media3 buffer profile

`TelegramProgressiveLoadControlProfile` owns one explicit profile:

| Setting | Value |
| --- | ---: |
| Minimum forward buffer | 15,000 ms |
| Maximum forward buffer | 60,000 ms |
| Initial playback threshold | 2,500 ms |
| Rebuffer playback threshold | 7,000 ms |
| Back buffer | 15,000 ms |
| Target buffer bytes | 96 MiB |
| Allocator segment | 64 KiB |
| Priority | Time before size |
| Trim allocator on reset | Yes |
| Retain back buffer from keyframe | No |

Autoplay, ordinary `BUFFERING` recovery without source recreation, pause/resume buffer retention,
10-second and far seeks, valid TDLib local-byte reuse, and terminal-only source retry remain intact.

## State and update preservation

Mobile code 5 keeps the code-4 package identity and must update it without uninstall, clear-data,
downgrade, provisioning-file reimport, passphrase entry, Telegram relogin, database-key recovery, or
reset. No F1D.4 migration clears or renames the API credential vault, TDLib database-key envelope or
alias, authenticated TDLib database/session, complete or partial TDLib files, playback progress,
continue-watching state, mobile settings, or unrelated application state.

TV code 10 keeps the code-9 package, signer, private-state identities, D-pad behavior, and secure
window policy. Local APK comparison proved update prerequisites, but no TV installation or physical
TV state-continuity result is claimed.

## Approved TV catalog UX requirement

`docs/TV_CATALOG_UX_SPEC.md` is an approved product requirement, not a speculative proposal. It
defines an original landscape, D-pad-first, 10-foot catalog experience with:

- horizontal Home rows beginning with **המשך צפייה**;
- progress-aware movie and episode cards with stable focus restoration;
- locally indexed next-episode rollover without invented episodes;
- metadata-rich movie, series, season, and episode pages;
- every matching on-device source variant across allowed Telegram channels;
- TMDB as the planned primary metadata provider while keeping rating providers separate and never
  labeling a TMDB vote score as IMDb; and
- TV-safe language, subtitle, audio, seek, autoplay, hardware, passthrough, buffering, cache, blur,
  and about settings.

No reference screenshot, copied brand asset, copied layout, third-party code, font, endpoint, or
torrent behavior was added. F1D.4 does not implement permanent catalog indexing, TMDB networking, or
the final visual redesign.

Future product work is divided into:

- **F2A:** local persistent Telegram catalog and source-variant identity;
- **F2B:** TMDB matching, metadata cache, and provider abstraction;
- **F2C:** TV Home rows, Continue Watching, and details/series pages; and
- **F2D:** source picker, subtitle/audio preferences, and final playback integration.

## Principal changed areas

- `core-provider`: `AdaptiveRangePolicy`, performance estimator/state, and provider-neutral range
  diagnostics.
- `core-telegram`: one-slot adaptive `TdLibRangeSource`, ownership/coalescing, stale-generation
  guards, read-ahead, pause/resume/seek coordination, and deterministic range tests.
- `core-playback`: the named LoadControl profile, playback performance tracker/event relay, Media3
  wiring, and behavior tests.
- `app-mobile`: code-5 identity and secondary sanitized performance presentation.
- `app-tv`: code-10 identity and shared playback regression build; no TV delivery.
- CI and delivery scripts: code-5/code-10 identity, exact-HEAD artifacts, retained update pairs, and
  mobile-only publication isolation.
- Documentation: the approved TV catalog specification, physical performance procedure, ADR, and
  reconciled architecture, security, Telegram, test, release, state, handoff, and distribution
  records.

## Native artifact evidence

No TDLib native build occurred. Both required verification-only commands passed in two observed
local runs, and exact-HEAD CI verified its established cache without rebuilding TDLib.

| Native property | Observed value |
| --- | --- |
| Official TDLib version | 1.8.66 |
| Official source commit | `022d60202e446ad1287b9fb68e687c8a0760788b` |
| ABI | `arm64-v8a` only |
| NDK | r28c |
| Local AAR SHA-256 | `025313d2a7cdbf148e5c700e8ef6c9d384f2301aff043c844997e0c23eb9abd2` |
| Local Java JAR SHA-256 | `e39bb497b7eea1f33d7d3b5816591b7656259df29e0231c10287e514e3951a04` |
| Local packaged JNI SHA-256 | `21d59ebfeba4edc62ea74cefaa79b08650e796530f3d5e57804105cc44cb65dc` |
| CI packaged JNI SHA-256 | `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |
| Layout | 16 KiB-compatible ELF/APK placement |

The local and CI JNI hashes are two pre-existing, separately verified cache lineages for the same
pinned official source/build identity. They are not required to be byte-identical to each other;
each packaged APK was verified against the cache that produced it. F1D.4 changed no source pin,
native input, ABI, NDK, AAR/JAR identity, or native cache identity.

## Local validation

Both TDLib verification-only commands, Gradle 9.5/JDK 21 project discovery, every focused module
test, aggregate tests, aggregate lint, and both assemblies passed. After the final pause-publication
concurrency fix, aggregate tests, lint, both assemblies, native/package inspection, and the real
retained mobile 4→5 and TV 9→10 upgrade comparisons reran and passed.

Generated JUnit XML records 460 tests, all passed with zero failures, errors, or skips:

| Module | Tests |
| --- | ---: |
| `app-tv` | 74 |
| `app-mobile` | 48 |
| `core-model` | 15 |
| `core-playback` | 40 |
| `core-provider` | 23 |
| `core-provisioning` | 48 |
| `core-security` | 96 |
| `core-telegram` | 116 |
| **Total** | **460** |

All 423 tests present at the start of F1D.4 remain. Added coverage includes adaptive startup and
8 → 16 → 32 MiB sequential growth, seek reset, cap/clamp, one-slot reuse/coalescing/duplicate
suppression, stale-update rejection, low-watermark read-ahead, pause/resume/close, pause racing
session publication, throughput/timing/rebuffer state, exact LoadControl values and allocator bounds,
warm/partial/cold/short/large media scenarios, near/far seek, no-progress recovery, terminal retry,
diagnostic leakage, update compatibility, and mobile-only publication isolation.

Additional passed local evidence:

- browser/WebCrypto/Kotlin interoperability checks;
- provisioning inspector: 4 cases;
- upgrade harness: 13 cases;
- TV publication harness: 9 cases;
- TV exact-HEAD downloader rejection harness: 8 cases;
- mobile publication harness: 10 cases;
- mobile downloader harness: 19 rejection cases and 1 success case;
- native-layout verification with NDK r28c and 16 KiB requirements;
- shell syntax checks; and
- real retained mobile code 4→5 and TV code 9→10 update verification.

No required local or CI check failed. `adb devices -l` returned an empty device list, so physical
code-5 and Shield procedures were omitted rather than reported as passed.

### Commands actually run

The observed command set included the mandatory preflights in both repositories and these
milestone checks and delivery operations:

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
./gradlew :core-model:test
./gradlew :core-provider:test
./gradlew :core-playback:testDebugUnitTest
./gradlew :core-telegram:testDebugUnitTest
./gradlew :core-security:testDebugUnitTest
./gradlew :core-provisioning:testDebugUnitTest
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
./scripts/download-latest-ci-mobile-apk-to-phone.sh
adb devices -l
git diff --check
```

The real retained APK pairs were also passed to `./scripts/verify-upgrade-apks.sh` for mobile
code 4→5 and TV code 9→10. Final local and delivered APKs were passed to the package-specific APK
and native-layout verifiers. Git fetch/status/diff/commit/push and exact-SHA `gh run` inspection were
run in the required order. The TV exporter, TV CI downloader, installer, and Shield deployer were
not run.

The final locally assembled APKs were:

| Candidate | Size | SHA-256 | Modification time |
| --- | ---: | --- | --- |
| Mobile code 5 | 56,222,741 bytes | `ea9ed1e9e7562c1ddaf6b8eee20802be16b9ce66b32a0c36c24fcdd10fc083ae` | `2026-08-04 13:32:29.576450293 +0000` |
| TV code 10 | 57,263,531 bytes | `7f79756f77b499e2c03ac2787ddb78e9cffa7766fc68935515679dc24f8530e5` | `2026-08-04 13:32:29.580450293 +0000` |

Both have the exact package/version/code, Development signer, ARM64-only payload, verified local JNI,
and no credentials, keys, provisioning file, Telegram session/database, or private media. The local
mobile-only exporter passed and left the parent TV APK files and provisioning tool unchanged. The TV
exporter and Shield deployment did not run.

`adb devices -l` listed no attached device. No code-5 installation, launch, state-preservation,
streaming, performance, or Shield result is inferred from local validation.

## Exact-final-HEAD Android CI

| Field | Value |
| --- | --- |
| Run | `30915678822` |
| Event / branch | `push` / `main` |
| Commit | `2c97790b08178658b8ca37c0d66832d94fd954dd` |
| Conclusion | success |
| Wrapper job | `92013079559` — passed |
| Android build job | `92013129636` — passed |
| Mobile artifact | `private-media-tv-mobile-apk-2c97790b08178658b8ca37c0d66832d94fd954dd` |
| TV artifact | `private-media-tv-apk-2c97790b08178658b8ca37c0d66832d94fd954dd` |

The exact-HEAD run passed wrapper validation, official pinned-TDLib cache verification without a
native rebuild, tests, lint, signed ARM64 TV/mobile assembly, package/version/signer/JNI/native-layout
and forbidden-content verification, artifact metadata/checksum generation, and both package-specific
artifact uploads.

## Final CI mobile-only delivery

After exact-HEAD CI succeeded, `./scripts/download-latest-ci-mobile-apk-to-phone.sh` selected the
successful push artifact for the final remote `main` SHA and reverified its metadata, checksum,
package, version/code, signer, ABI, JNI, native layout, and contents before mobile-only publication.

| Field | Final CI mobile APK |
| --- | --- |
| Canonical path | `/storage/emulated/0/Download/PrivateMediaTV/Mobile/private-media-tv-mobile-latest.apk` |
| Package/version | `com.funzi7.privatemediatv.mobile`, `0.1.4-phone-test` (`versionCode` 5) |
| Size | 56,120,404 bytes |
| APK SHA-256 | `c8ce516fad6ce8106df03929bb146da56182e483f403462365c61f4e60325b49` |
| Fresh modification timestamp | `2026-08-04 14:00:57.903473774 +0000` |
| Modification epoch | `1785852057` |
| Development signer SHA-256 | `2987a463ff6fcb6ca50e3e9b3118ded5a9055ea21967621192d991c350b63ab0` |
| ABI | ARM64 only |
| Packaged JNI SHA-256 | `790c545fc7f059ec10063c2f72f58ef36cd1a362c949026dcf31c413d21c259f` |

The final canonical APK is a real copied file, not a symlink. Before/after verification proved the
parent TV `latest` and `previous` APKs and the offline provisioning tool retained their exact hashes,
sizes, and timestamps. The TV exporter, TV CI downloader, installation, launch, and Shield deployment
did not run. Shared-storage delivery is not evidence of Android private-state preservation,
Telegram/session behavior, playback, or performance.

## Security and architecture decisions

- TDLib Java/JNI types remain confined to `core-telegram`; UI, `core-model`, `core-provider`, and
  playback contracts remain provider-neutral. `core-security` remains TDLib-independent.
- Telegram sessions, database, files, cache, and playback stay app-private. No backend holds a
  Telegram session or relays Telegram media.
- The API credential vault, database-key vault, native/runtime, and provider/playback diagnostics
  remain distinct typed states.
- No credential, key, phone number, authentication value, password, QR value, Telegram identifier,
  channel/media name, private filename, session/database, private media, screenshot, signing secret,
  raw exception, or private diagnostic path appears in this handoff, CI, or packaged APK.
- Metrics are monotonic typed in-memory state only; no analytics, advertising, Firebase, or crash
  reporting was introduced.
- The isolated mobile harness keeps its explicitly approved ordinary capture behavior and warning.
  TV secure-window handling was not weakened.
- No third-party TDLib binary, wrapper, gateway, Bot API, public/local HTTP media proxy, torrent
  integration, native rebuild, uninstall, clear-data action, TV delivery, or Shield deployment was
  introduced.

## Physical status and limitations

Physically established from code 4: data-preserving update, retained credentials/session, connected
Telegram content discovery, exact 65,536-byte local probe at `LOCAL_FILE_READ`, real Media3 playback,
visible video, audible audio, and multi-megabyte provider reads.

Still pending:

- installing code 5 over the authenticated code-4 mobile application without uninstall or data
  clearing;
- confirming retained vaults, database/session, complete/partial TDLib files, progress, settings,
  and unrelated state after that physical update;
- physical code-5 warm, partial, and cold media startup/first-frame measurements;
- at least ten minutes of continuous playback with rebuffer count and duration;
- pause/resume, 10-second forward/backward seek, far seek, reopen, and local-byte reuse;
- a factual code-4 versus code-5 comparison where media/network conditions permit; and
- every Shield-specific codec, D-pad, focus, thermal, performance, playback, and update result.

JVM tests, successful CI, APK inspection, and shared-storage delivery do not prove physical network
speed, Android Keystore/session continuity, installation, launch, playback, or Shield behavior.
Physical code-5 performance acceptance remains pending, and Shield remains deferred.

## Next phase and continuation

The next product phase is **F2A — local persistent Telegram catalog and source-variant identity**.
Before treating F1D.4 performance as physically accepted, use the exact procedure in
`docs/MOBILE_ACCEPTANCE.md` to install code 5 over code 4 without uninstall/clear-data, then test
warm/partial/cold media, continuous playback, rebuffer behavior, pause/resume, near/far seek, reopen,
and cache reuse. Publish only sanitized numeric measurements and safe stage/code values.

F2A should create the durable on-device Telegram catalog and stable source-variant identity required
by the approved TV UX. It must not add TMDB work early (F2B), final Home/details/series pages early
(F2C), or source/subtitle/audio integration early (F2D). Continue to preserve the official TDLib
pin, one-file request ownership, provider boundaries, app-private state, update compatibility,
Development signer, ARM64/16 KiB native identity, D-pad requirements, and the public privacy boundary.

Do not rebuild TDLib, clear any vault/session/cache, deliver the TV APK, deploy to Shield, publish a
private Telegram identity, or treat phone/CI success as Shield acceptance.
