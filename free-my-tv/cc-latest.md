# free-my-tv — SHIELD deep debloat audit, phase 1 (read-only) — 2026-10-25

**Repo:** `funzi7/free-my-tv` (private) · `main` HEAD **`79e33ec4ef2530ede2531da9383f6c7b22091a81`**. This is the
first commit; it is pushed and verified on GitHub. The repo has no CI workflow, so no CI run exists. Docs only: no app
code, no deploy, no APK.

## Status

| Track | State |
|---|---|
| Conservative SHIELD debloat (9 pkgs) | **Done and physically verified** by the owner/coordinating chat on 2026-10-23 (Termux host). Re-confirmed read-only on 2026-10-25: the nine are `disabled-user`, HOME = `com.google.android.tvlauncher/.MainActivity`, `com.google.android.tvrecommendations` is `enabled`. The physical checks were not repeated. |
| Deep debloat | **Phase 1 audit complete** (`docs/SHIELD_DEBLOAT_AUDIT.md`, 17 sections). This audit made zero SHIELD mutations; pass-3 verification passed. **Execution pending owner approval.** |
| Location OFF→ON process audit | **Pending physical work.** Location is currently OFF. Plausible Google pair: GMS NetworkLocationService and FusedLocationService. No NVIDIA component is identified; the candidates are `wifi.countrycode` and `blakepairing`. |
| Custom Free My TV launcher | **Future.** The stock Android TV Home stays until it is ready. |

## Device facts (2026-10-25)

- SHIELD Android TV `mdarcy` (SKU U12897F), SHIELD Experience 9.2.4 (33.2.0.400), Android 11/SDK 30, build
  RQ1A.210105.003.7825230_4387.0822, patch 2026-01-05, one user.
- `/data`: 12,203,000 KB total, about 2.69 GB free (78% used). System partition 92% used (read-only).
- 145 packages for user 0 (129 system, 16 user). 11 disabled: the nine, plus `com.google.android.tv` (2025-08-04) and
  `com.nvidia.benchmarkblocker` (factory self-disable).
- YouTube, YouTube Music, Play Games and the Play copy of Prime Video are **absent in every form**.
  `com.google.android.videos` has no code, only kept data.
- **A disabled persistent app still starts at boot:** `com.nvidia.nvgamecast`. AOSP 11 `startPersistentApps` has no
  enabled check.
- Termux restore snapshot `~/shield-debloat-20261023-161907/`: inspected read-only and never run.

## Classification (report §9; authoritative)

A 41 · B 9 · C 1 (`videos`, already done) · D 0 · E 32 · F 39 · G 16.

No new C/D candidates. The next steps are owner decisions (E) and physical tests (G).

## Hard rules (carry forward)

- `com.google.android.tvrecommendations` stays enabled (CleanYourTV bisect: the SHIELD phone remote breaks after a
  reboot without it).
- `com.google.android.tvlauncher` stays HOME.
- **The 37 UID-1000 packages are disable-only.** A user-0 uninstall or `pm clear` clears system-UID Keystore and
  app-ops state, and `install-existing` doesn't restore it.
- Never run `pm uninstall-system-updates` without a package: it reverts all 14 updated system apps.
- Agents never run ADB server lifecycle, pairing or port scans from PRoot, and all device access uses the lease.
- **Never put the word "adb" in non-device Bash command text.** The global hook then takes the device lease. This
  happened twice in this session as lease-only windows; both were released and recorded.

## Recommended next batch (report §15; all NOT EXECUTED, owner approval needed)

1. Storage housekeeping: old TiviMate backups (≤ 126.1 MiB), a review of TiviMate recordings (≤ 1,131.2 MiB), and the
   private-media-tv `/data/local/tmp` traces (20.6 MiB; private-media-tv decision).
2. `katniss` disable, if voice/Assistant is unused (≈ 141 MB resident).
3. `smbserver` off, if unused (≈ 4.9 MB).
4. Netflix / Plex Media Server, if unused.
5. Cosmetic: the Prime stub, `backdrop`, `smartconnect`.
6. Physical G tests: `osc` (user-0 uninstall with `-k`) and `shield.ask` (disable, then remote/Alexa checks).
7. Irreversible `videos` leftover purge (optional, last).

Separately: read-only evidence for `app.messaging`.

## Storage truth

- Disabling frees 0, and firmware is never reclaimable.
- The only measured system-debloat `/data` gain is ≈ 107 MiB (lower bound), from reverting the updates of four E apps.
  That is not proposed.
- The big levers are owner content and owner apps.
- App data is not measurable from the shell. The diskstats per-app cache is stale (about 7–9 days, inferred).

## Process notes

- The prompt first arrived truncated; the owner re-sent it in full before the commit.
- Two subagents spawned 3 helper agents (over the 4-agent cap). Future briefs must forbid nested agents.
- Independent Opus safety review: 2 P1, 10 P2, 16 P3. All were resolved before the commit
  (`docs/shield-audit/SAFETY_REVIEW.md`).
- private-media-tv sessions (Codex `01a0ec26…`, Claude `143a246c…`) also used the SHIELD lease that day. Codex updated
  private-media-tv to 0.7.23 at 11:52:29Z.

## Validation

- Pass 3 (14:57:21Z) against pass 1: no package enable/disable/install/uninstall change; the nine are disabled,
  `tvrecommendations` is enabled, HOME is unchanged.
- No mutating command was run by this audit. The proposed commands were not executed.
- `git diff --check` is clean.
