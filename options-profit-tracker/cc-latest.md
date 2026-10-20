# OptionsProfitTracker — 2026-10-20 ADB device-lease restore + physical acceptance handoff

Date: 2026-10-20. Same branch `s2/ibkr-reconciliation-lifecycle-dashboard`, same PR #19 OPEN, NOT
merged; main untouched (`7225b7af16c183de00a9f064ead03a01ad6af1d3`). This replaces the 2026-10-19
single-flight handoff as CURRENT; that round's record stays in agent-memory git and in
`docs/S2_8_ACCEPTANCE.md` / `S2_8_VALIDATION.md`. Every open S2.8 item is carried forward. This round
changed NO app source — docs-only commits.

## Heads and gates

- OPT round start: `fbe255608f305db0ccdb16dab22430d18babd2e0`.
- OPT final HEAD: `2ae291683905577bf46b24670a47ecefcf20afbd` (two docs commits: `e2ab1fc` physical
  acceptance + lease restore/hardening; `2ae2916` accurate Gate-status record).
- Codex Gate at `2ae2916`: Codex reviewed the head CLEAN ("Didn't find any major issues", 10:52Z);
  `build-gate` and `scripts-test` PASS. The Gate stays RED because `codex-gate-evaluator` reports TWO
  still-active P2 findings from the 2026-10-19 review — `ClosePositionScreen.kt:768` (sanitize stale
  legs before deriving BTC targets) and `AppModule.kt:143` (observe reconciliation evidence changes in
  canonical flows). Both are in the financial/reconciliation engine, which THIS device-QA round is
  forbidden to change, and the docs-only commits don't touch those lines so GitHub doesn't mark them
  outdated. NOT bypassed: no `codex-p1-acknowledged` label, no thread resolved without a fix, PR #20's
  Claude-fallback contract not merged. Owner to resolve those two P2s (engine scope).

## What this round did

1. **Restored the shared ADB device lease** (it did not exist — only an empty `adb-device.lock`). It
   lives OUTSIDE this repo: the global Claude + Codex PreToolUse hooks (`~/.claude/hooks/` and
   `~/.codex/hooks/global_resource_queue.py`), `/root/work/bin/adb-device-lease` (engine),
   `adb-device-run`, `adb-device-release`, `queue-status`, and one shared `adb_lease_policy.py`.
   - ONE global, session-sticky lease: owner `claude:`/`codex:<session_id>`, others wait ~100 s then
     exit 75, idle expiry 300 s counted from the command STOP (a heartbeat keeps a running command's
     lease alive and makes a killed runner's idle time count from the kill), shared activity flock
     taken under the state mutex, `ADB_SERVER_SOCKET` forced to `tcp:127.0.0.1:5037`.
   - The hooks rewrite executed adb to `adb-device-run` (lease outer, heavy-run inner when also heavy);
     DENY server lifecycle, pairing, disconnect/reconnect, adbd restarts, another/removed server,
     killing adb, lease spoofing/tampering, device-wide network changes and force-stop/clear of Termux,
     and an adb subcommand / device-shell program the policy can't read. `adb connect` is ALLOWED.
     `queue-status` adds an `adb-device:` line; heavy-build and agent-memory lines unchanged.
   - Backups `*.bak-20261020`; `~/.claude/settings.json` and `~/.codex/hooks.json` untouched.
2. **Hardened the shell-text policy through two independent reviews** (see state.md for the full list).
   R1 found 3 P1 / 5 P2 / 3 P3 (heavy-wrap crash, comment/continuation deny bypass, Codex memory-git
   ordering, release-while-active, substring `already_wrapped`, read-only over-denial, text-only
   lease-taking, find/awk bypass, quadratic cost, release/socket bypasses) → both hooks ROLLED BACK to
   originals 09:30Z, rewritten offline. R2 of the rewrite found 2 P1 / 1 P2 / 1 P3 (bash EXPANSION
   bypasses — IFS word-splitting and ANSI-C dollar-quote decoding; unknowable device-shell input;
   prefilter superset) → all fixed, every R1 fix re-confirmed. Fixture **722/722** on the INSTALLED
   bytes; worst `analyze()` ~0.65 s near the 1 MB cap; reinstalled atomically 10:40Z byte-identical;
   live re-verified (wrap, device list, read-only dumpsys, owner-injected release, free status).
3. **Physical acceptance of the single-flight Flex sync** (ran under v1 of the lease, before the
   hardening; unaffected by it). APK `4afde87e616f74e45eb81b69e01aaae079e3a56eca25fcadabc731c481e665d5`
   installed in place under an app-scoped reversible OEM_DENY_3 block: no IBKR request, data and signer
   preserved. First start cancelled **29** stale anonymous Flex one-shots by id (14 of the 43 had
   already SUCCEEDED 2026-10-19); periodic, pre-market and the other workers preserved; reopen
   recreated nothing stale; trading DB byte-identical by table fingerprint; block removed and firewall
   verified identical. Phone left force-stopped with ONE pending `flex_sync_now_full` from
   `BootReceiver` (Android 15+ boot re-delivery). Acceptance items 1–12 PASS (item 4 = 29 explained,
   item 5 not exercised). See `docs/S2_8_ACCEPTANCE.md` §"Physical acceptance … 2026-10-20".

## INCIDENT (recorded, resolved by the owner)

A fixture test run WITHOUT the stub client ran a real server kill and stopped the Termux host ADB
server at 10:05Z (an unfixed newline-in-quoted-`-c` bug let a `#` comment hide the line). The phone's
link had already dropped phone-side at 08:57Z and the device QA was already complete, so nothing on the
phone was affected, and the server lifecycle was not broken deliberately from PRoot. The owner
restarted the server in Termux (back ~10:17Z). Fix: every test environment now stubs the client first
on PATH and aborts otherwise; a test asserts refused commands never reach the stub. Rule for the next
agent: NEVER test lease tooling against the real client — stub it.

## Not verified / owner-gated

- New scheduling under a LIVE network (the owner's next open runs the one pending full sync + any due
  periodic/pre-market, serialized) — pending-tests ADB1.
- Broker E2E — not authorized (ADB2).
- Owner choices 3–7 remain OPEN (import of newly-accepted OPEN/one-letter cycles; GetStatement pacing;
  non-standard multipliers; sync-now tap joining a backoff wait; overdue pre-market now runs).
- Overall S2.8 and financial parity remain NOT accepted; carried-forward parity figures unchanged
  (Sep 1–28 broker 4741.75 vs app 5089.43 Δ347.68; and the other windows recorded in the prior
  handoff). No offsets/plugs; re-audit after any owner Import.

## Device facts

Phone SM-S938B, Android 17 / SDK 37. Serial during QA `192.168.1.133:37305`; after the owner's
mid-round reconnect `192.168.1.133:34451` (the port changes each reconnect — read it from the device
list, and always pass `-s`; a SHIELD TV may also be attached). Host ADB server runs in Termux
(protocol 41, `TracerPid: 0`); only the owner starts/kills/pairs it, in Termux.

Finalize memory only with `AGENT_MEMORY_PROJECT=options-profit-tracker
/root/work/bin/agent-memory-finalize "<factual message>"`; never mutate memory Git directly.
