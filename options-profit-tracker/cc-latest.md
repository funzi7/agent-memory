# cc-latest.md — OptionsProfitTracker handoff (latest)

> Rolling single-file handoff. Every future prompt OVERWRITES this file with a fresh, complete summary of the just-finished task and then prints its commit SHA. Read this first for the newest context, then `state.md` (full commit chain), `pending-tests.md` (device-test checklists), `roadmap.md` (backlog + owner rules) and `gotchas.md` (hard-won lessons).

## Latest task: S1-FINAL — original keystore verified → rebuild → safe in-place install → real-device launch/runtime test (2026-09-06, Claude Code)

**OPT HEAD after S1-final: `7225b7af16c183de00a9f064ead03a01ad6af1d3`** (main; docs-only commit "docs(S1-final): original debug keystore recovered — phone-built APK installed in place + launched on device" — changes `PHONE_BUILD.md` only).
**APK build HEAD: `d0d5d3d154333e9616ef972b0bf52d5841a44038`** (= origin/main at task time, verified `HEAD == origin/main` before building). App sources are identical across `5445921 → d0d5d3d → 7225b7a` (those commits touch only `.github/workflows` and `PHONE_BUILD.md`), so the installed app code == S1's `5445921`.
**No app / P&L / IV / Room / DB / prefs / AvgCostResolver / workflow code was changed.** `local.properties` (`sdk.dir=/opt/android-sdk`) stays locally modified and uncommitted.

### Result in one line
The signing blocker is GONE: the owner's recovered ORIGINAL computer debug keystore signed a fresh phone build whose certificate matches the installed app exactly; `adb install -r` succeeded in place with every data file intact; the app launched from ADB, drew its first frame in 1.06 s, loaded positions from Room, ran its workers and logged zero fatal/DB errors; the APK is delivered to Download. **validation = BLOCKED on one item only: the owner's visual data-survival acceptance could not be collected in-session** (the interactive question tool is denied in this session's permission mode). Reboot NOT performed (still owner-gated).

---

## Signing — verified from three independent sources (all identical)
- **Keystore** `/root/.android/debug.keystore` (file mtime 2026-09-06 17:55 — copied by the owner; the phone-generated 2026-07-22 keystore survives only as `debug.keystore.phone-generated.bak`). `keytool` (JDK 21): alias `androiddebugkey`, created 2026-02-22, valid to 2056-02-15, **SHA-1 `5D:3D:85:5C:6C:6C:39:7F:81:7D:F2:BD:0C:62:F1:6F:94:0B:15:51`**, SHA-256 `9E:53:07:E1:34:49:17:F0:CD:C4:95:C5:CC:04:A8:0D:23:A9:2C:59:65:C7:79:B6:EF:B0:FA:A1:13:5B:82:21`. No custom `signingConfig`/`storeFile` anywhere in Gradle (re-checked) → this one file is the whole signing path.
- **New APK** `app/build/outputs/apk/debug/app-debug.apk` (`apksigner verify --print-certs --verbose`): APK Signature Scheme **v2** only (v1/v3/v3.1/v4 false), 1 signer, DN `C=US, O=Android, CN=Android Debug`, **SHA-1 `5d3d855c6c6c397f817df2bd0c62f16f940b1551`**, SHA-256 `9e5307e1344917f0cdc495c5cc04a80d23a92c5965c779b6efb0faa1135b8221`.
- **Installed app, re-read FRESH before install** (pulled `base.apk`, 35,739,191 B, SHA-256 `2e4fcb1ea0e7921dee57b138cafb081ac929854fc84c8c16abfcd2b60f7a0784`): **SHA-1 `5d3d855c6c6c397f817df2bd0c62f16f940b1551`**, SHA-256 `9e5307e1…8221`, v2. → install gate PASSED on actual output, not inference.

## ADB / device state
- `adb devices -l` → `192.168.1.117:43817  device  product:pa3qxxx model:SM_S938B device:pa3q transport_id:2` (Samsung Galaxy S25 Ultra). Plain `adb` (Debian 34.0.5) saw it; no `fakeroot` form needed; no re-pairing. IP:PORT differs from S1-cont (`172.20.10.3:42677`) because the Wi-Fi network changed — the pairing persists.
- Device: `/data` 99 G free; device local time UTC+7 (Thailand) — all device timestamps below are +07.

## Build / tests (all via `/root/work/bin/heavy-run`, `queue-status` was free; `JAVA_HOME=/usr/lib/jvm/java-21-openjdk-arm64`, SDK `/opt/android-sdk`)
- Repo sync first: local main was 4 commits behind (PR #18 workflow sync + PR #17 Yahoo health-check, workflows only) → `git merge --ff-only origin/main` (no reset/stash/restore). `HEAD == origin/main == d0d5d3d…` proven before the build.
- `:app:compileDebugKotlin` → BUILD SUCCESSFUL, `grep "^e: "` EMPTY (tasks UP-TO-DATE: app sources unchanged since S1's real compile).
- `:app:testDebugUnitTest` → first run reported **UP-TO-DATE = tests NOT re-executed**; forced a real run with `:app:cleanTestDebugUnitTest :app:testDebugUnitTest` → **23 tests, 0 failures, 0 errors, 0 skipped** (`CoveredPutCalculatorTest` 15 + `ProfitCalculatorCoveredPutTest` 8; XML timestamp 2026-09-06T19:37:20).
- `git diff --check` → clean (run before the build and again before install).
- `:app:assembleDebug` → BUILD SUCCESSFUL, `packageDebug` re-executed (re-signed with the recovered keystore). Output `app-debug.apk` **63,194,072 B, SHA-256 `8e94372fcd407af69fb528f68ae116079ccc4eaca7f50ff5ef46e887ce0faebd`** (mtime after the build start; the S1 artifact `4f07bc62…` was replaced — no stale APK used). `output-metadata.json`: applicationId `com.dima.optionstracker`, versionCode **1**, versionName **1.0.0**.

## Pre-install snapshot (non-sensitive; names/sizes only — no DB, prefs, keys or trade contents were dumped)
- `pm path` → `/data/app/~~Z718Q0KfDZmaQsOrJ5qXgg==/com.dima.optionstracker-Q-qw4bC0Jm_8on8l7LpmLA==/base.apk`; versionCode 1 / versionName 1.0.0 / minSdk 26 / targetSdk 35; **firstInstallTime 2026-04-22 22:53:57**; lastUpdateTime 2026-08-17 20:46:43; dataDir `/data/user/0/com.dima.optionstracker`; app process alive (pid 4137).
- `run-as` file evidence: `databases/options_tracker.db` 339,968 B (2026-09-05 02:50) + `-wal` 469,712 B + `-shm` 32,768 B; `files/datastore/app_settings.preferences_pb` 32,457 B; `files/articles_cache.json` 35,645 B; `files/social_cache.json` 71,507 B; `shared_prefs/` 7 xml files; `du`: databases 828K, files 151K, shared_prefs 32K, cache 3033K.

## Install (update in place) — SUCCESS
- Gate script re-checked immediately before installing: `git diff --check` clean, `HEAD == origin/main`, adb state `device`, new-APK SHA-1 == `5d3d855c…` == installed SHA-1 (and SHA-256) → then `adb install -r app/build/outputs/apk/debug/app-debug.apk` → **`Performing Streamed Install` / `Success`, exit 0** (device 2026-09-07 02:38:39). No uninstall, no `pm clear`, no `-d`, no package/signature workaround.
- Post-install: new codePath `/data/app/~~XqWGcjjEXOIXuMfu3-NZiw==/com.dima.optionstracker-MaEY9_VZSfKy7Shh1DAupA==`; versionCode 1 / 1.0.0; **firstInstallTime UNCHANGED 2026-04-22 22:53:57** (update, not a fresh install); lastUpdateTime 2026-09-07 02:38:39; dataDir unchanged; **every data file above still present with identical size + mtime**; the NEW installed `base.apk` pulled again → SHA-256 `8e94372f…` (byte-identical to the build output), signer unchanged.

## Launch + real-device runtime test — PASSED (no fatal/DB error)
- `am force-stop` → `monkey -p com.dima.optionstracker -c android.intent.category.LAUNCHER 1` (Events injected: 1) → system log **`Displayed com.dima.optionstracker/.MainActivity for user 0: +1s57ms`**; pid **16937** alive at t+5/15/30/45/60 s; a second warm launch at 02:41:53 became top-resumed (`onTop=true`) and drew again, same pid.
- App-PID logcat (114,959 lines from process start): `APP_ONCREATE` + `MAIN_ONCREATE` fired; `WM-WrkMgrInitializer` initialised WorkManager; `ALERT_SCHEDULE: SUCCESS: AlertWorker enqueued`; `FlexSyncWorker: Scheduled periodic sync every 60 minutes` then `Auto-sync: outside trading hours (ET: 15, SUNDAY), skipping`; both `WM-WorkerWrapper: Worker result SUCCESS`; dashboard loaded the open positions from Room (`IV_TRACE` for 5 open positions, `FEED_FIX dedupe 107 → 107`, `BACKFILL skip: already have 329 rows`).
- Error scan: **0 `FATAL EXCEPTION`, 0 app `AndroidRuntime`** (the only `AndroidRuntime` lines in the full dump are the monkey tool's own JVM init, pid 16888 / uid 2000, "VM exiting with result code 0"), **0 `IllegalStateException`, 0 SQLite / Room / downgrade / "migration from" errors**, no Hilt / BootReceiver errors.
- Observations recorded, NOT fixed: (1) **diagnostic log storm** — ≈96.8k `PNL_TRACE` W-lines + 4.7k `PnLDebug` + 3.8k `PNL_DBG` within ~10 s of every dashboard load (~100k logcat lines per load, repeated on the warm re-launch), and they print per-position trade details → gating/removal TODO in roadmap. (2) 6 s after the 2nd launch the phone moved the owner's other app (`com.funzi7.privatemediatv.mobile`) back to the front via Samsung `Pageboost: moveTaskToFront` (a Recents-style switch by whoever held the phone) — not a crash; our task stayed alive in the background.

## Owner visual acceptance — NOT OBTAINED (the single blocker)
- Required by the task before `passed`: (1) app opens normally and stays open; (2) dashboard populated, not empty; (3) existing positions still present; (4) history / feed / calendar / reports still present; (5) settings + data not reset to a fresh-install state; (6) no crash while navigating normally.
- `AskUserQuestion` was **denied** (session runs in "don't ask" permission mode) and no other channel can block for an answer, so the owner must report the 6-point result in the next prompt. Until then S1-final is **BLOCKED**, not passed. If anything is missing → release blocker: do NOT uninstall/clear; capture `adb logcat -d --pid=$(adb shell pidof -s com.dima.optionstracker)`.

## APK delivery — DONE, hashes match
- `/sdcard/Download/OptionsProfitTracker/OptionsProfitTracker-1.0.0.apk` (directory created; versionName read from the build's `output-metadata.json`), **63,194,072 B**, SHA-256 `8e94372fcd407af69fb528f68ae116079ccc4eaca7f50ff5ef46e887ce0faebd` — identical to the build output, verified both from PRoot `sha256sum` and via `adb shell sha256sum` on the device path.

## Reboot — NOT PERFORMED (still pending, owner-gated)
- A reboot kills the Termux/PRoot/Claude session, so it stays a separate next step. It is now meaningful: the installed package is a full APK (`install -r`), so the S1 root cause (streamed/Apply-Changes deploy reverting to an older v30 APK on reboot) should no longer apply — only the real reboot confirms it. Capture commands: `PHONE_BUILD.md` §5 / `pending-tests.md`.

## Docs / state updated this task
- OPT `PHONE_BUILD.md` (commit `7225b7a`): §0 keystore row = recovered original (SHA-1 `5D:3D…`), §2b forced test re-run recipe, §3 pairing DONE + current IP:PORT note, §4 signing RESOLVED + mandatory 3-way signer gate + `logcat -T` quoting fix, §5 durable-fix APPLIED status, new §6 evidence table. README / CLAUDE.md pointers still accurate → untouched.
- agent-memory `options-profit-tracker/`: `roadmap.md` (owner-reported backlog A–F recorded verbatim, S1-final status, `PNL_TRACE` TODO), `pending-tests.md` (S1 checklist: SIGNING/INSTALL/LAUNCH done, OWNER ACCEPTANCE + REBOOT open, older S1/S1-cont items marked SUPERSEDED, GM→R2 device items now testable), `state.md` (dated S1-final block), `gotchas.md` (install-loop lessons), `current-session.md` (pointer), this file.

## Remaining blockers / TODOs (all preserved; none implemented in S1-final)
1. **Owner visual acceptance** of the installed build (6-point checklist) — blocks `passed`.
2. **Reboot test** (owner-gated) — pending.
3. **Owner-reported backlog A–F** (roadmap 2026-09-06): A dashboard section "מה קורה היום בשוק" before "פוזיציות פתוחות"; B Covered-Call reminder wording + missing-eligible-ticker investigation; C IBKR signed commissions/rebates (diagnostic first, no formula change); D IBKR-vs-app realized P&L discrepancies (full fills→basis→P&L reconciliation, no formula change without approval); E feed close timestamp bug ("15.08 03:00" vs real 14.08 execution — suspect the 16:00-ET fallback rendered in UTC+7) + add real closing TIME to the close/edit page; F SPCH ~$20 reconciliation fixture (commission ≈ -5.92 does not explain it).
4. `PNL_TRACE` / `PnLDebug` / `PNL_DBG` log storm — gate or remove (record only).
5. Everything older stays open: F1, F2, R1/R2, dashboard banner-reappear (GP1 diagnosis), buy-to-cover import gap, social-feed items, D1 findings (A1 yield banner, A2 CALL assignment prob, Covered-Put money-path ruling), PR #18 automation review findings, all pending device tests (GM→R2, GO BootReceiver, Covered Put core).

## Pointers
- `PHONE_BUILD.md` (OPT) — the proven on-device build → test → APK → signer gate → `install -r` → launch → logcat → Download-delivery loop.
- `state.md` — full dated commit chain (S1-final block appended). `pending-tests.md` — device checklist. `roadmap.md` — backlog + owner rules. `gotchas.md` — keystore continuity, Gradle UP-TO-DATE tests, `adb shell` quoting, monkey `AndroidRuntime` noise, log-storm, foreground-switch lessons.
