# cc-latest.md — OptionsProfitTracker handoff (latest)

> Rolling single-file handoff. Every future prompt OVERWRITES this file with a fresh, complete summary of the just-finished task and then prints its commit SHA. Read this first for the newest context, then `state.md` (full commit chain), `pending-tests.md` (device-test checklists), and `roadmap.md` (backlog + owner rules).

## Latest task: S1 — Phone-only Android dev setup + reboot-crash diagnostic (2026-08-19, Claude Code)
**OPT HEAD after S1: `5445921`** (main; "docs: phone-only (Termux/PRoot) build/install/debug runbook + reboot-crash diagnostic (S1)"). Parent `ac3f4e8`. **Docs only — no app / P&L / IV / Room / DB / prefs code changed** (locked core untouched).

Goal: move the complete practical Android dev loop off Android Studio and onto this phone (Termux/PRoot), AND diagnose the reported post-reboot "app opened empty and crashed."

---

## What environment was found
- **aarch64** Termux/PRoot. **JDK 21 only** (`/usr/lib/jvm/java-21-openjdk-arm64`; no JDK 17 — Gradle 8.7 + AGP 8.6.1 build clean on 21). `JAVA_HOME` was empty → set per-build.
- **Two SDK dirs:** `/usr/lib/android-sdk` holds ONLY `adb`; the real SDK is **`/opt/android-sdk`** (shared with sibling `linkdrop-android`) — has `platform-tools`, `build-tools/{35,36,37}.0.0`, `cmdline-tools/latest` (sdkmanager), `platforms/{26,36,37}` and, after S1, **`platforms/android-35`**.
- ARM aapt2 override already global in `~/.gradle/gradle.properties`: `android.aapt2FromMavenOverride=/opt/android-sdk/aapt2-wrapper/aapt2` (mandatory on ARM — Google's Maven aapt2 is x86_64-only).
- `local.properties` is **tracked** (shipped with a Windows `sdk.dir=C:\…`) yet gitignored; it was wrong for the phone.
- Heavy-build serialization lock available: `/root/work/bin/heavy-run -- <cmd>` (+ `queue-status`).
- App: compileSdk/targetSdk 35, minSdk 26, versionCode 1, versionName 1.0.0, applicationId com.dima.optionstracker, **no custom signingConfig** (debug builds use `~/.android/debug.keystore`).

## What was installed / configured
- Installed `platforms;android-35` via `sdkmanager --sdk_root=/opt/android-sdk` (was missing; blocked compileSdk 35). `android-35/android.jar` (27 MB) now present.
- Set `local.properties` → `sdk.dir=/opt/android-sdk` **on disk only (NOT committed** — machine-specific; left unstaged).
- No other global/destructive changes. No toolchain replaced.

## Signing continuity — NOT PROVEN (likely differs)
- Phone `~/.android/debug.keystore` SHA-1 **`0E:B5:14:FE:32:13:15:70:80:D3:FA:82:69:A7:4E:83:E3:4E:BD:08`**, **generated on the phone 2026-07-22**. The built APK is v2-signed with exactly this cert.
- The installed app has run for **months from the computer's Android Studio** → its cert is the computer's debug keystore, almost certainly **different** (a copied keystore would keep an older valid-from, not 2026-07-22).
- Could NOT compare against the installed cert — **no ADB device connected** (see below). So continuity is **assumed to differ**; `adb install -r` will likely fail `INSTALL_FAILED_UPDATE_INCOMPATIBLE`. Non-destructive remedy (documented, not performed): copy the computer's `debug.keystore` to `~/.android/debug.keystore`, rebuild, verify SHA-1 matches the installed app, then `install -r`. **Uninstall/clear-data forbidden.**

## APK built? YES
- `:app:assembleDebug` (via heavy-run) → **`app/build/outputs/apk/debug/app-debug.apk`** (~63 MB), package `com.dima.optionstracker`, versionCode 1 / versionName 1.0.0, signed (APK Signature Scheme v2) with the phone debug keystore.

## Installed from the phone? NO (blocked, non-Studio)
- `adb devices` is **empty** (daemon starts, no device; no mDNS wireless service). `~/.android/adbkey` exists from a prior 2026-07-22 auth, but nothing is connected now.
- Install / launch / logcat were **not** run this session. They need a **one-time manual** Android action: Developer options → Wireless debugging → Pair device with pairing code, then `adb pair <IP>:<PORT>` (+ code) and `adb connect <IP>:<PORT>`. Command shapes are in PHONE_BUILD.md; **no IP/port/code was invented**.

## Is Android Studio still required? NO — for the build loop
- source → Gradle → **compile gate → tests → APK** is fully proven on the phone with zero Android Studio.
- The **install/launch/logcat** portion needs a paired ADB device (a one-time Wireless-debugging pairing in Android Settings) and, if signing differs, a one-time keystore copy — **neither is Android Studio**. Once paired, `install -r` / launch / logcat run entirely on the phone.

## Reboot test performed? NO
- A real reboot of THIS phone would kill the Termux/PRoot session and strand the task, so it was **not** performed (per the task's own "don't strand" rule). Diagnosis is **code + agent-memory** evidence; device-log confirmation is left as an owner device-test (exact capture commands in PHONE_BUILD.md §5 and pending-tests.md).

## Reboot crash — root cause (evidence-backed, ranked)
Single defect: **DB-version-vs-APK-version mismatch across reboot**, made fatal by the deliberate removal of destructive fallback, and made fragile by `MIGRATION_30_31` living in only **1 of 11** hand-maintained Room builders.
- **H1 (most likely):** an Android-Studio "Apply Changes"/streamed deploy (v31 code) does not persist as a full package; on **reboot** the OS reverts to the last fully-installed older APK (`@Database version 30`) while the on-disk Room DB is already **v31** → Room **downgrade** → uncaught `IllegalStateException` (no destructive fallback to absorb it). `DashboardViewModel.openPositions` `.catch { emit(emptyList()) }` renders the dashboard **EMPTY**, then a concurrent **unguarded** DB open (inline-composable DBs in `MainActivity.kt:764/787/818`, auto-backup) **CRASHES** the process. "Android Studio fixed it" = it re-deployed a v31 APK so code matched the on-disk v31 DB again; it did **not** repair data. Confirmed by memory: `roadmap.md` "Deploy note", `gotchas.md:95-100`, `current-session.md:79`.
- **H2 (same defect, upgrade direction):** v30-on-disk / v31-code opened by a worker (`FlexSyncWorker.kt:187`, `AlertWorker.kt:153`) or an inline-composable DB → "migration from 30 to 31 not found" (workers swallow it and just fail sync; an inline-composable DB crashes).
- **H3 (contributing):** BootReceiver enqueues a boot-time full Flex sync that auto-expires open options (`FlexSyncWorker.kt:559-571`) → dashboard looks sparse. No deletion — nothing at boot wipes rows.
- **Ruled out:** WorkManager "not initialized" (default init intact, plain `CoroutineWorker`s), BootReceiver wiping/ANR (all off-main-thread, `goAsync()`), DataStore main-thread ANR (all suspend on IO), destructive-migration wipe (removed).
- **Durable fix = the S1 loop itself:** deploy a real APK (`assembleDebug` + `adb install -r`), never Apply Changes. **No code fix in S1** (touches locked P&L/DB/Room core + has design choices) — owner options recorded in roadmap (process-only / versionCode bump / consolidate 11 builders / guarded-downgrade[rejected]).

## Tests
- Compile gate `:app:compileDebugKotlin` — **BUILD SUCCESSFUL**, 0 `^e:` lines (42 warnings only).
- `:app:testDebugUnitTest` — **23/23 pass** (CoveredPutCalculatorTest 15, ProfitCalculatorCoveredPutTest 8; 0 failures/errors/skips).
- `git diff --check` — clean. Final gate re-run before commit — UP-TO-DATE, still green.

## Not physically tested (needs a device)
- ADB pairing, `install -r`, launch-from-ADB, logcat, and the real reboot repro. Signing-cert comparison against the installed app.

## Remaining risks / manual steps
1. Pair ADB (one-time, Android Settings). 2. Likely copy the computer's `debug.keystore` to the phone before `install -r`. 3. Keep `local.properties` = `sdk.dir=/opt/android-sdk` locally (never commit). 4. Reboot crash persists until the owner adopts full-APK installs (option 1) — code hardening (options 2-4) needs owner approval as it touches locked core.

## Pointers
- `PHONE_BUILD.md` (in the OPT repo) — the full on-device build/install/debug runbook + reboot capture commands.
- `state.md` — full dated commit chain. `pending-tests.md` — S1 device-test checklist (no regression tests). `roadmap.md` — S1 owner fix options + preserved backlog (F1/F2, R1/R2, banner, buy-to-cover, D1 findings). `gotchas.md` — Room-builder-drift + destructive-fallback-removal lessons.
