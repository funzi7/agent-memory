# OptionsProfitTracker — 2026-11-06 stock-price recovery handoff

This is the complete current handoff. It supersedes the earlier 2026-11-06 handoff while retaining
that history in git and the appended state/roadmap/gotchas records.

## Heads, branch, PR and exact-head evidence

- This follow-up started at OPT HEAD `6f13551b7c28b908e4a5a6e82a3fbf78f9cfa135`.
- Final/pushed/reviewed OPT HEAD: `b928645dd3290909fe71367b6e480e925ddd3e3d`.
- Branch: `s2/ibkr-reconciliation-lifecycle-dashboard`; PR #19 remains OPEN and unmerged. No push to
  `main`. The owner's existing `local.properties` SDK path remains unstaged/excluded.
- Agent-memory starting HEAD for this follow-up:
  `bf55320494a05fb5252efdd89e5b5c94dbb96aa3`. The final memory SHA is the canonical finalizer
  result and must be read from git, not typed in advance.
- Trusted `chatgpt-codex-connector[bot]` receipt
  [6692049538](https://github.com/funzi7/OptionsProfitTracker/pull/19#issuecomment-6692049538),
  2026-11-06T18:14:46Z, reviewed `b928645dd3`: “Didn't find any major issues.” The authoritative
  PR-head check `128068254240` is green and reports no unresolved non-outdated trusted P1/P2.
- Exact-head PR Build Gate run `42268223284`, job `128065633929`: PASS. Workflow Scripts Tests run
  `42268223214`, job `128065633553`: PASS. Codex evaluator run `42268932939`, job `128068119850`:
  PASS. The first push-time evaluator ran before the review signal and failed historically; it is
  superseded by the green PR-head status and later evaluator.

## Installed stock-price failure: proven root cause and correction

The stock quote workflow had already been rewired away from Flex, but the installed package still had
the earlier app-only `OEM_DENY_3` QA network deny. Logcat showed DNS failures and the canonical Yahoo
extended-hours quote batch returned `0/8`. This was not a provider empty response and not a quote-merge
regression.

Read-only WorkManager inspection found four unfinished Flex slots waiting behind the same connectivity
constraint:

- `flex_price_sync`;
- `pre_market_sync`;
- `flex_sync_now_full`;
- `flex_sync_now_regular`.

Simply removing the package deny could therefore have issued unauthorized broker requests. The source
now makes the owner auto-sync preference a real broker-access admission boundary:

- periodic, pre-market, app-start and boot work persists `requires_auto_sync=true`;
- old work without origin metadata defaults true and fails closed while disabled;
- the worker checks admission before credentials, Flex ownership or provider access;
- OFF first persists the preference, then cancels and awaits all four named durable slots;
- app start and boot perform the same disabled cleanup, and boot keeps `goAsync()` alive until
  WorkManager persistence;
- every pre-market re-arm rechecks the preference;
- ON restores pre-market and periodic schedules;
- a newly created explicit owner sync persists false and remains available while automatic sync is
  off;
- `OptionsTrackerApp` is the sole pre-market schedule owner; Dashboard no longer schedules it.

Independent local review found no current-diff P1/P2. Two earlier review concerns were corrected before
commit: Settings ON restores pre-market scheduling, and the boot disabled path awaits cancellation
persistence. A rapid OFF→ON UI-toggle race remains lower risk: the already-started cancellation may
win and require a later re-toggle/app start, but it cannot authorize an automatic broker call.

## Device recovery and physical evidence

The final APK was installed with `adb install -r`; user data and signing identity were preserved. A
temporary signed instrumentation helper used only app-owned APIs to call `AppPreferences.setAutoSync`
and await `FlexSyncWorker.cancel()`. It set auto-sync OFF, then was uninstalled and all temporary test
source/configuration was removed.

Before network restoration:

- durable auto-sync value was false;
- WorkManager database integrity was `ok`;
- unfinished `FlexSyncWorker` rows were zero.

After removing `OEM_DENY_3`, a locked-device Doze restriction still prevented the bounded foreground
test. A temporary OPT-only device-idle/background allowance was applied only after the zero-Flex proof.
The canonical live Yahoo run then returned **8/8 stock prices** and **4/4 indices**. DataStore recorded
attempt sequence `8`, committed attempt `8`, requested `8`, usable `8`. No Flex worker/fetch/start was
logged and no IBKR request or synchronization ran.

The temporary allowlist/background allowance was removed, normal stopped/background policy restored,
and OPT was force-stopped. Final device state: package network allowed, no temporary Doze allowlist,
auto-sync OFF, zero unfinished Flex work, fresh 8/8 prices persisted. The phone stayed locked, so the
screen itself was not visually inspected. On unlock/open, the owner should see the persisted prices;
do not call visual UI acceptance passed until observed.

## Validation and artifact

- Focused `FlexSyncQueueTest` + `FlexTerminalErrorPolicyTest`: **28 tests / 2 classes / 0 failures /
  0 errors / 0 skips**, `BUILD SUCCESSFUL in 1m54s`.
- Full JVM `:app:testDebugUnitTest`: **2336 tests / 169 classes / 0 failures / 0 errors / 2 skips**,
  `BUILD SUCCESSFUL in 31s`.
- Final `:app:compileDebugKotlin`: `BUILD SUCCESSFUL in 12s`, zero real compiler `^e:` lines.
- Fresh `clean assembleDebug`: `BUILD SUCCESSFUL in 4m54s`; 42/42 actionable tasks executed.
- `git diff --check`: clean before commit; only unrelated `local.properties` remained afterward.
- APK version `1.0.0`, code `1`, 64,832,472 bytes; SHA-256
  `50deec8ea135426b88633a23be2050ee8d38823d40a0380b2f8034d441cd7481`.
- Original signer unchanged: SHA-256
  `9e5307e1344917f0cdc495c5cc04a80d23a92c5965c779b6efb0faa1135b8221`; SHA-1
  `5d3d855c6c6c397f817df2bd0c62f16f940b1551`.
- Exact-hash copy delivered to
  `/sdcard/Download/OptionsProfitTracker/OptionsProfitTracker-1.0.0.apk`; device copy matched.

No new IBKR Flex request, broker sync/import/resync, option-chain refresh, IV refresh, PUT scan,
watchlist/news refresh, paid-key provider request, trade, uninstall, data clear or manual device-DB
mutation occurred. The one bounded Yahoo quote test was the explicit recovery verification described
above.

## Financial/accounting state remains unchanged

This follow-up changes no realized-P&L formula, ledger selection or persisted financial row.

- WDCX exact local fixture remains: open `0.95`, 3 contracts, opening rebate `-1.46`, close `0.65`,
  closing rebate `-1.47` → `+92.93`; displayed rounded `32%` cannot turn it into `94.13`.
- Sep1–28 sanitized audit: 52 raw rows / 16 broker-backed / 36 local-only; raw `5089.44`, 49 canonical
  rows `4844.09`, broker `4741.75`, unresolved `102.34`. Three proven duplicate representations remove
  `245.35`; missing per-cycle broker evidence prevents attribution of the remainder.
- Sep3–Oct2 canonical `5724.27` versus owner-reported broker `5518`, unresolved `206.27`.
- September statement canonical/app `5832.48` versus IBKR equity+index options `5634.27`, unresolved
  `198.21`. SOXL assigned 128C is local `199.23` versus broker option `0`; removing it still leaves
  `-1.02`, and raw assignment evidence is absent.
- YTD `38287.55` versus IBKR `37688.74`, gap `598.81`, without exact per-cycle broker evidence/cutoff.
- November options match `+232.30`. November stock remains RKLX `-926.74` versus broker `-990.92` and
  MULL `-5678.18` versus broker `-4563.93`; OPT total `-6604.92` versus IBKR headline `-5554.86`
  (displayed broker rows add to `-5554.85`). Flex FIFO reproduces OPT, while displayed average anchors
  can reproduce the broker values; changing accounting policy or history still requires owner choice
  and authoritative basis evidence.

No offset, hardcoded SOXL zero, guessed cost basis, cent correction or merge-by-resemblance was added.
Overall financial parity therefore remains **FAILED**.

## Retained S2.8 product contracts

- Exact entered/executable price drives close money; percent is derived. Manual BTC price/percentage
  and B-S Fill remain usable with warnings when tick proof is unavailable. Automatic actionable
  recommendations require proven legal ticks; historical average fills are never quantized.
- High-IV remains IV-only. Dedicated PUT page owns first current-NY-day scan then explicit refresh;
  Dashboard/IV do not secretly scan. OI wording remains `חוזים פתוחים (OI)` / `OI`.
- Historical assignments stay excluded from covered-call reminders; owner had confirmed BBAI, ASTX
  and BTCI phantom reminders were gone. Settings displays generated app version without a bump.
- `docs/STANDALONE_MARKET_AGENT_PLAN.md` remains unchanged. Implementation belongs to future private
  `funzi7/opt-market-agent`, not this repository/round.

## Remaining backlog / next work

1. Owner-visible only: unlock/open OPT and confirm persisted fresh stock prices render. Auto-sync is
   intentionally OFF; enabling it is a separate owner action.
2. Obtain authoritative per-cycle broker evidence before changing Sep/YTD or November stock money.
3. Preserve historical stock-ledger coverage gap, SOFI attribution, missing Flex `ibOrderID`, raw
   assignment provenance, exact-series/non-penny/larger-tick proof gaps and non-standard multipliers.
4. Preserve migration registration hazard, expired/null-close history, bidi debt and cross-store
   process-death/permanent-projection limitations.
5. Preserve PR #20 automation-core/fallback rollout and untested `issues:write`; do not fake fallback.
6. Preserve OPT → Trading Tracker SPEC_ONLY, conditional ChatGPT daily report and Phase 3 personal
   historical exit learning.
7. ADB1 live scheduling and ADB2 broker E2E remain owner-gated; do not spend broker/provider quota to
   re-prove the quote fix.

Finalize memory only through
`AGENT_MEMORY_PROJECT=options-profit-tracker /root/work/bin/agent-memory-finalize "<factual message>"`;
do not run direct state-changing git commands in agent-memory.
