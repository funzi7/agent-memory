# OptionsProfitTracker — 2026-10-19 urgent Flex option-parse repair handoff

Date: 2026-10-19. Same branch `s2/ibkr-reconciliation-lifecycle-dashboard`, same PR #19 OPEN,
NOT merged; no push to main (`7225b7af16c183de00a9f064ead03a01ad6af1d3` untouched). This complete
replacement supersedes the 2026-10-01 S2.8 handoff as the CURRENT state; that handoff's history is in
agent-memory git and in the project docs (`docs/S2_8_ACCEPTANCE.md`, `S2_8_VALIDATION.md`, TODO,
PROJECT_STATE, HANDOFF), and every open S2.8 item below is carried forward, not closed.

## Heads and gates

- Starting project HEAD: `ab168766ec636d072832057cc1237e511d58e7aa` (S2.8 Review20 clean).
- Final project HEAD: `6879976c499266b216477579b548de8b8c84afba`.
- Exact-head checks/review: normal Codex (trusted connector) review on exact `6879976c` CLEAN — "Didn't find any major issues" (2026-10-19T14:28:01Z); check-codex-status pass ("Reviewed — clear"); codex-gate-evaluator pass after re-running the push-time evaluation run 39269011089 ("outdated_findings_and_current_head_signal on head 6879976"); PR Build Gate pass (4m16s); Workflow Scripts Tests pass; 84 review threads, 0 unresolved active; PR #19 OPEN, not merged.

## Owner-authorized scope

Urgent, narrow repair of the manual IBKR sync failure seen after the Flex token renewal —
`שגיאת פירסור: Flex options incomplete: rejected=8 multiplier=0 contractId=0 zeroQuantity=0
requiredField=8` — plus ONE controlled real-device sync. Not authorized: merging PR #19, main,
rewriting trading data, delete+import/full re-sync, repeated live calls, other provider quota, a new
version/milestone, the wider S2.8 backlog.

## Root cause (evidence, not assumption)

- S2.8 made every per-row option refusal fatal; the last pre-S2.8 parser (`4512cbf`) dropped the same
  rows silently ("previously worked").
- The only `requiredField` condition that refuses a well-formed broker row was the March-2026 filter
  `ticker == "OPEN" || ticker.length < 2` (`39de587`, "filter OPEN phantom ticker").
- The owner's own June-2026 Flex export (read locally, never copied/printed) carries `OPEN` as
  Opendoor Technologies (NASDAQ), a real SELL EXECUTION with conid and fifoPnlRealized; the persisted
  feed has Flex-derived STOCK_SOLD rows for OPEN and O and an OPEN CSP draft.
- Live confirmation: the fixed build parsed the same-day snapshot with 0 refusals; every other
  refusal rule is unchanged, so the 8 were OPEN/one-letter-underlying rows (deduction; the earlier
  payload itself was never saved).

## Change

- `ui/screens/settings/FlexOptionRowParser.kt` (pure, JVM-tested) = the per-row option parse moved
  from `ImportViewModel.parseFlexXmlTrades`, identical except: any non-blank broker underlying is
  accepted; every refusal names field + missing/unsupported/exception kind with a redacted shape
  (no symbol/id/account/token/money/XML). Debug hook inside the per-row guard; NaN/Infinity commission
  refused (unknown money never 0). Any refusal still fails the WHOLE payload.
- `syncFromIbkr` and `fullResync` validate option rows BEFORE persisting NAV/holdings, basis anchors,
  stock-realized ledger or cash; `fullResync` aborts on any option-parse failure (no OpenPositions
  fallback before deletion).
- `FlexQueryService.errorCodeOf` + `isTerminalError`: IBKR credential/configuration codes 1010, 1011,
  1012, 1014, 1015, 1016 (official table, recorded in funzi7/trading-tracker
  docs/research/ibkr-flex-api.md §1.8; live refetch 403 from this host). 1013 IP restriction excluded
  (phone IP changes). GetStatement loop stops on them; `FlexSyncWorker` returns failure (pre-market
  chain re-armed) instead of retry. Everything else keeps retrying.
- Exact-head Codex review 5572314869 on `cdb535c6d92a731e3ad9a67f71b6246d3569d8e8`: P1 4314426490
  (`parseFlexXml` dropped `<Trade>` without `symbol` before validation) and P2 4314426505
  (multiplier/contract-id/zero-quantity refusals unclassified) — both fixed in
  `1e692de682213c9586d79dfd74c73d52fc7d4536` (`parseFlexXmlTradeRows` rows + withoutSymbol validated
  in both sync paths; every refusal classified), threads replied 4314578079/4314578458 and resolved.
- Exact-head Codex review 5572561055 on `1e692de`: P1 4314621523 — non-standard multipliers were
  imported while protected ProfitCalculator prices ×100. Fixed fail-closed in
  `90771cfd9bbb5548da6485b449d97fa665f05bb0`: only the proven multiplier 100 is imported, any other
  refused as `unsupported:multiplier`; ProfitCalculator untouched (owner decision 5). Replied
  4314668383, resolved.
- Exact-head Codex review 5572695391 on `90771cf`: P1 4314727842 (Opendoor `OPEN` STK executions
  dropped from the stock ledger) + P2 4314727849 (`OPEN` dropped from the market-brief universe) —
  fixed in `6879976c499266b216477579b548de8b8c84afba`: `OPEN` is a real ticker in StockRealizedGrain,
  StockLotAccounting, OrdersTradesRealized, MarketBriefBuilder and ReportGenerator's validator; `OPEN`
  joins MarketNewsRelevance.AMBIGUOUS_BARE (`$OPEN` still matches). Replies 4315006147/4315006555,
  resolved. The screenshot-OCR word list keeps `OPEN` (UI status word in free text).
- Tests: FlexOptionRowParserTest (18), FlexTerminalErrorPolicyTest (3), StockRealizedGrainTest and
  MarketNewsRelevanceTest Opendoor cases; MarketBriefBuilderTest updated (had pinned the defect).

## Validation (actual)

- Focused first run 163/0/0; final full suite (after all Codex fixes) 1778 tests / 0 failures / 0 errors /
  1 existing skip / 115 classes, compile + assembleDebug `BUILD SUCCESSFUL in 1m 49s`, zero real `^e:`;
  scripts `node --test` 76/76 and exporter unittest 3/3 locally;
  real offline audit unchanged (49 canonical / 4844.09 / residual 102.34, same three pairs);
  `git diff --check` clean. All Gradle via heavy-run (waited behind another project's builds).
- Independent Opus reviewer subagent (NOT Codex): no P1; P2 (SendRequest error-code path untested) and
  P3s (hook guard, fullResync fail-open, vacuous assertion, 1013, NaN commission) all fixed.
- APK 1.0.0/1 final SHA-256 `5b532f56fa94d78533123a4f57421ef71e8f749c5e6681d22c4787c1a1723895`,
  original signer SHA-256 `9e5307e1344917f0cdc495c5cc04a80d23a92c5965c779b6efb0faa1135b8221`;
  delivered to `/sdcard/Download/OptionsProfitTracker/OptionsProfitTracker-1.0.0.apk` and installed in
  place at 10:26:08 ET while the app was idle (`Success`, installed bytes match); not launched — it is
  the final source. Superseded artifacts: 14d72da4… (the live-tested build), f8969b73…, 894ec374…
  (installed 09:46:51 ET; that install restarted the app the owner had opened at 09:28:12 ET — no sync
  in that session, data preserved, session interrupted), cfd473c6… (delivered only, owner's app open).

## Device / live (host ADB only, TracerPid 0; per-command flock on /root/work/.locks/adb-device.lock —
## the documented adb-device-release helper and lock did not exist on this host)

- Pre-review build `14d72da4…` installed in place; normal launch 09:11:51 ET: Application.onCreate
  enqueued a one-shot FULL worker sync and the overdue hourly job fired 5 ms later → IBKR 1018 for one
  (RETRY); the full sync succeeded 09:14:24 ET. Then no worker running/due until 10:31:56 ET.
- ONE manual `סנכרן מ-IBKR` at 09:16:27 ET: 1588 EXECUTION rows (167 rebate fills), parse card 498
  opens / 474 closes / 0 errors, no refusal, no error. Preview only — Import NOT pressed.
- Data survived: DB integrity ok; 353 positions, 0 added/removed (only current_stock_price/updated_at
  on 8 OPEN rows); 1209→1210 events (+SYNC_COMPLETED); stock ledger 279→279 (idempotent), basis 52,
  reconciliation 275; 0 fatal lines; app alive.
- NOT exercised live (later commits): error/abort paths, refusal wording, non-finite commission
  strings, validation of `<Trade>` elements with NO `symbol` attribute, the non-100-multiplier refusal
  and Opendoor STK rows entering the stock ledger. Evidence they don't break the proven success path:
  IBKR emits every configured attribute on each element (June export: one identical 85-attribute set)
  and all known option multipliers are 100 (June export + 353 stored positions); if either assumption
  fails on a future payload the sync fails closed with the named reason (`missing:symbol` /
  `unsupported:multiplier`) instead of importing a subset or wrong money. The Opendoor stock-ledger
  inclusion is a deliberate visible change (decision 2).

## Device finding — retry storm (owner decision pending)

WorkManager (read-only copy): 42 non-unique one-shot FULL-sync FlexSyncWorker chains, 19–55 attempts
each (≈1,500), created by app starts/sync taps while the token was expired (old code retried every
failure forever, default backoff capped 5 h). All due together ≈12:55 ET 2026-10-19, ignoring the
trading-hours gate, vs IBKR's 1 request/second, 10/minute per token. last_sync_time had been
2026-10-08 21:30 ET; it is now 2026-10-19. App UID is background-restricted (jobs deferred).

## Owner decisions / actions (numbered; no code until chosen)

1. Stacked chains & non-unique syncNow: leave / cancel stale one-shot chains + single-flight sync /
   single-flight only.
2. RESOLVED by correction (exact-head Codex P1 4314727842 + P2 4314727849 on `90771cf`): the stock
   paths, market-brief universe and report ticker validator no longer drop `OPEN`. Owner-visible:
   Opendoor's own fifoPnlRealized enters the stock ledger at the next sync (feed shows OPEN sales
   2026-01-09 and 2026-06-09), changing those months' stock/combined totals.
3. Owner's own Import of the newly accepted OPEN/one-letter option cycles (changes realized totals and
   Sep/YTD parity references).
4. Pace non-terminal GetStatement Fail retries (documented 1 request/second).
5. Non-standard option multipliers: now refused at import; supporting them requires authorizing
   `contractMultiplier` in protected ProfitCalculator paths.

## Carried-forward S2.8 backlog (unchanged, not closed)

- Fixed Sep 1–28 options: broker 4741.75 vs canonical 4844.09, residual 102.34 over 33 local-only
  cycles; owner has no saved export. Sep3–Oct2 206.27 (whole-dollar reference); September statement
  5634.27 vs 5832.48 (198.21; SOXL3586 assigned-vs-expired evidence gap, −1.02 counterfactual);
  YTD 38287.55 vs 37688.74 (598.81). No offsets/plugs. NOTE: importing the newly accepted option
  cycles (decision 3) will move these app-side figures; re-audit after any import.
- Held exact series identity / positive non-penny tick metadata for automatic recommendations.
- OPT→Trading Tracker bridge and conditional ChatGPT report SPEC_ONLY; Phase 3 exit learning;
  historical stock-ledger coverage; SOFI attribution; missing Flex ibOrderID; PR #20 rollout;
  MIGRATION_30_31 registered at 1 of 17 builders; journal/snapshot/bidi debt; owner-deferred
  physical PUT/0DTE/brief checks.

Finalize memory only with `AGENT_MEMORY_PROJECT=options-profit-tracker
/root/work/bin/agent-memory-finalize "<factual message>"`; never mutate memory Git directly.
