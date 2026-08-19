# cc-latest.md — OptionsProfitTracker handoff (latest)

> Rolling single-file handoff. Every future prompt OVERWRITES this file with a fresh, complete summary of the just-finished task and then prints its commit SHA. Read this first for the newest context, then `state.md` (full commit chain), `pending-tests.md` (device-test checklists), and `roadmap.md` (backlog + owner rules).

## Latest task: S1-CONTINUATION — Signing verification + (attempted) first phone-only install (2026-08-19, Claude Code)
**OPT HEAD after S1-cont: `5445921` (unchanged)** — full SHA `5445921d52b59938aa63d7cf5c541abb7b827832`, main. **No app / docs / P&L / IV / Room / DB / prefs code changed this continuation** (ADB read-only inspection + agent-memory handoff only; locked core untouched). No new OPT commit was invented.

Goal: prove signing compatibility between the installed `com.dima.optionstracker` and the phone-built debug APK, and ONLY if they match, `install -r` in place, launch, and verify data survives — all from the phone. No reboot in this continuation.

### Result in one line
The signing identities **DO NOT MATCH** (real certificate evidence). Per the task's CASE B, work **STOPPED before install** — no `adb install`, no uninstall, no clear-data, no reboot. The install is blocked on one non-destructive manual step: copy the computer's original debug keystore onto the phone.

---

## ADB self-connection status: LIVE / WORKING
- The phone is paired to itself and connected: `adb devices -l` shows **`172.20.10.3:42677   device   product:pa3qxxx  model:SM_S938B  device:pa3q  transport_id:1`** (Samsung Galaxy S25 Ultra), state **`device`**.
- Seen by BOTH plain `adb` AND `ANDROID_NO_USE_FWMARK_CLIENT=1 fakeroot adb` (the documented Samsung/Termux form). All read-only ADB commands this session ran from the phone with zero Android Studio: `pm path`, `dumpsys package`, and a full `adb pull` of the installed base.apk (267 MB/s over local Wi-Fi). **So install / launch / logcat CAN now run entirely from the phone** — the ONLY remaining blocker is the signature mismatch below, not connectivity.

## Installed app (read-only, unmodified)
- `pm path` → `/data/app/~~Z718Q0KfDZmaQsOrJ5qXgg==/com.dima.optionstracker-Q-qw4bC0Jm_8on8l7LpmLA==/base.apk`
- versionCode **1**, versionName **1.0.0**, minSdk 26, targetSdk 35.
- **firstInstallTime 2026-04-22 22:53:57**, lastUpdateTime 2026-08-17 20:46:43. dataDir `/data/user/0/com.dima.optionstracker`.
- `apkSigningVersion=2`. Installed base.apk size ≈ 35.7 MB (the new phone build is ≈ 63.2 MB — a size difference only; size has NO bearing on signing identity).

## Certificate fingerprints (apksigner --print-certs on BOTH real APKs — gold-standard evidence, not inferred)
- **INSTALLED `com.dima.optionstracker`** (pulled base.apk): DN `C=US, O=Android, CN=Android Debug`
  - **SHA-1 `5d3d855c6c6c397f817df2bd0c62f16f940b1551`**
  - SHA-256 `9e5307e1344917f0cdc495c5cc04a80d23a92c5965c779b6efb0faa1135b8221`
  - This is the **computer's Android Studio debug keystore** (the app was first installed 2026-04-22).
- **NEW phone build `app/build/outputs/apk/debug/app-debug.apk`**: DN `C=US, O=Android, CN=Android Debug`
  - **SHA-1 `0eb514fe3213157080d3fa8269a74e83e34ebd08`**
  - SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4`
  - This is the **phone `~/.android/debug.keystore`** — `keytool` confirms SHA-1 `0E:B5:14:FE:…:BD:08`, **Valid from 2026-07-22 14:20**. That valid-from POSTDATES the 2026-04-22 install, so this keystore could not possibly have signed the installed app — corroborating the mismatch.

## Did the signatures match? NO
- SHA-1 and SHA-256 **both differ**. Both certs are self-signed `CN=Android Debug` certs, but they are **two different debug keystores** (computer vs phone). This is exactly what S1 predicted; it is now proven with certificate evidence, not assumption.

## Was `install -r` attempted? NO — install result: NOT ATTEMPTED (CASE B stop)
- Because the signatures differ, `adb install -r` was **not run**. It would fail **`INSTALL_FAILED_UPDATE_INCOMPATIBLE`**, and the task forbids forcing past a signature mismatch, uninstalling, or clearing data. So: no install, no uninstall, no `pm clear`, no data touched.
- App launched? **NO** (nothing was installed to launch). Process alive after launch? **N/A** (not launched).
- Owner needs to visually confirm data? **Not applicable to this session** — nothing was installed, so the existing app + its data are **completely untouched**. Data-survival verification only becomes relevant AFTER a successful `install -r`, which is blocked below.

## Reboot performed? NO
- No reboot in this continuation (a real reboot kills the Termux/PRoot session). Reboot remains an owner-gated device test; do NOT reboot until explicitly instructed.

## Remaining manual step (ONE, one-time, non-destructive) — the ONLY blocker to install/launch
The build has **NO custom `signingConfig` / `storeFile`** in any Gradle file (verified) — debug builds sign with the default **`~/.android/debug.keystore`** (on this phone: `/root/.android/debug.keystore`). So overwriting that single file IS the entire signing path; no other signing config exists.

To make `install -r` succeed while preserving all data:
1. On the COMPUTER that signed the installed app, get its **original** debug keystore. Standard location on that Windows box (per the tracked `local.properties` `sdk.dir=C:\Users\DELL\…`): **`C:\Users\DELL\.android\debug.keystore`** — this is the STANDARD Android debug-keystore location, **not a path verified on that machine**.
2. Copy it onto the phone, overwriting **`/root/.android/debug.keystore`**.
3. Rebuild: `./gradlew assembleDebug` (via `/root/work/bin/heavy-run -- …`).
4. Re-verify: `apksigner verify --print-certs app/build/outputs/apk/debug/app-debug.apk` — its SHA-1 must now equal the installed app's **`5d3d855c6c6c397f817df2bd0c62f16f940b1551`** BEFORE any install.
5. Then `ANDROID_NO_USE_FWMARK_CLIENT=1 fakeroot adb install -r app/build/outputs/apk/debug/app-debug.apk` (no `-d`, no uninstall flags). Launch via `am start` / `monkey -p com.dima.optionstracker -c android.intent.category.LAUNCHER 1`, then logcat.
- **Uninstall / clear-data remain forbidden.** Do NOT bypass the mismatch by wiping the app.

## Alternative (owner decision, NOT done here)
If the computer's keystore is unavailable, the only other way to run the phone-signed APK is a fresh install of the phone build under a **different package** or **after an uninstall** — but uninstall DESTROYS the existing data and is FORBIDDEN by this task, so it is not an option without explicit owner approval and a data-export first.

## Tests / verification this session
- Pre-work git gate: OPT HEAD `5445921…` == expected; branch main; upstream origin/main; only `local.properties` dirty (`sdk.dir=/opt/android-sdk`, phone-local, left uncommitted). agent-memory HEAD `0dd61db…` == expected.
- APK present: `app/build/outputs/apk/debug/app-debug.apk` (63,194,072 B). NO new heavy Gradle build run (the S1 APK already passed compile/tests/assemble; task says don't rebuild before the keystore is supplied).
- `git diff --check` — clean.

## Not done / still needs a device action
- `install -r`, launch-from-ADB, logcat capture, and the reboot repro — all blocked on the one keystore-copy step (install) or owner instruction (reboot).

## Pointers
- `PHONE_BUILD.md` (OPT repo) — on-device build/install/debug runbook + reboot capture commands.
- `state.md` — full dated commit chain (S1-cont bullet appended). `pending-tests.md` — S1 device-test status (SIGNING now = mismatch-confirmed; INSTALL/LAUNCH blocked on keystore). `roadmap.md` — S1 signing/install/reboot status + preserved backlog (F1/F2, R1/R2, dashboard banner, buy-to-cover, social-feed, D1 findings). `gotchas.md` — Room-builder-drift + destructive-fallback-removal + debug-keystore-continuity lessons.
