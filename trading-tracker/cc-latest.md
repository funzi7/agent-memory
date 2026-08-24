# trading-tracker — Round 3 handoff (2026-08-24)

Project HEAD: `bc1d683be6add9de89e8f6e17a51c55cbd257af9` (origin/main, pushed and remote-verified)
Starting project HEAD: `605a12375adf3593d3425d7c57180cc9ffe511cf`
Repo: `github.com/funzi7/trading-tracker` · package
`com.funzi7.tradingtracker` · app `0.3.0` / versionCode `3` · Room schema `3`

## Work completed

### Broker refresh and scheduling

- `FlexSyncEngine` owns one process-wide Deferred single-flight shared by manual
  Sync, pull-to-refresh, scheduled work, activation catch-up, and backfill.
  Concurrent callers join the active Flex request sequence rather than starting a
  second SendRequest/GetStatement flow.
- Added a unique network-constrained WorkManager request named
  `ibkr-flex-daily-ny-2100-v1`. The next target is NY 21:00 computed with
  `America/New_York`, recomputed after terminal work, and therefore DST-correct.
  Android delivery remains best-effort, not an exact alarm.
- Activation/scheduled catch-up compares the most recent NY 21:00 due instant
  with the latest complete successful `CURRENT` sync. A manual success after due
  satisfies the period. `BACKFILL`, migrated/restored `LEGACY`, and `PARTIAL`
  runs cannot suppress the daily obligation.
- Added Room migration 2→3: one additive non-null `sync_runs.operation` column
  with fail-closed `LEGACY` default. Explicit 1→2→3 migrations and exported
  schema `3.json` are committed; destructive fallback remains absent.
- Partial ingest is a real non-success result while retaining valid rows. An
  unchanged malformed RAW replay stays partial. Worker retry is transient-only,
  exponential 30 minutes, capped at four retries; permanent credential/query
  errors do not spin endlessly.
- Unexpected Keystore/Room/runtime failures are caught outside the request
  sequence, sanitized, and persisted best-effort. Pull/manual busy state clears
  in `finally`; raw exception/credential text is never surfaced.
- Flex pacing remains serialized at >1 second and at most 10 requests/minute.

### Pull-to-refresh and presentation

- One joined pull workflow covers Home, Calendar, Statistics, Dividends list,
  Dividend detail, Daily detail, Reconciliation, and Broker Sync/status. It joins
  broker + missing/stale FX work, retains navigation, lets Room Flows update all
  screens, and reports success/partial/failure/no-credentials honestly.
- Shared `NyTime`/`Fmt` display actual dates as ASCII LTR `dd/MM/yyyy` and
  timestamps as `dd/MM/yyyy HH:mm`; persisted ISO/broker RAW values are unchanged.
- Shared `MachineText` and embedded LTR fragments enforce one line, no ellipsis,
  no soft wrap, full signs/digits, and deterministic down-sizing for money,
  percentages, quantities, counts, dates/times, and tickers.
- Statistics → `ביצועים לפי נייר` uses the same five-column geometry for header
  and rows, has no horizontal scroll, leaves heading `נצ/הפ`, and displays
  wins/losses. Regressions include EWY `5/0`, MULL `11/7`, SOFI `16/2`, and PLUG
  `17/4`, with trade-count and Win Rate consistency.

### Dividend addendum

- One logical payment contains exactly one gross row and zero/one/many immutable
  withholding rows. Every tax row is linked independently; all confidently
  matched rows are retained, summed, and shown individually plus broker total,
  percentage, and complete source net.
- Pairing requires compatible account/currency/symbol/conid plus a shared broker
  action ID or trade ID. Instrument/date-only evidence remains ambiguous/audit
  evidence and never moves money. Missing broker tax is nullable/unavailable,
  never fabricated broker `0%`.
- Effective-tax priority is manual percentage override → complete summed broker
  tax → exact-date local cash policy → unavailable. The local user policy uses
  only one unambiguous account-total RAW Cash Report whose period-end `toDate`
  equals the payment date: negative ending cash = 30%, zero/positive = 25%.
  Latest cash, nearest-date cash, and reconstruction guesses are prohibited.
- Tax source, historical cash/date, broker rows, local fallback, manual override,
  effective percentage/tax/net, currency, payment source, and override status are
  separately visible. Revert removes only Layer C and recomputes the source chain.
- Dividend cards/detail show ticker/date/gross/effective tax rate/amount/net/source.
  Per-share and units are parsed only from one matching immutable IBKR Cash
  Transaction description; units require exact `BigDecimal` derivation. Current
  holdings are never used as historical quantity.
- Aggregate rate is weighted `abs(sum converted effective tax) / sum converted
  gross`, never a mean of rates. Gross remains visible when tax/net is unknown;
  missing FX, unresolved payment tax, and nonpositive gross fail closed.
- The Dividends page has the complete assembled history and six session-preserved
  sort modes: date new/old (newest default), net high/low, ticker A/Z and Z/A.
- Coverage diagnostics expose broker gross/tax/logical/paired/unpaired/ambiguous/
  unassembled/mapped counts and canonical/error date ranges. Dividend-like RAW
  normalization failures remain immutable, make exact-coverage claims false, and
  appear in a sanitized UI/export audit (kind/error/safe symbol/date/revision/seen
  only; never account, payload, or description). Excel includes logical payments,
  every source row, unassigned taxes, and a dedicated RAW-error sheet.

### Data and product safety

- Round 2 owner acceptance remains preserved: readable dark-theme colors,
  corrected Open Positions with stale tickers removed, and approved dividend
  notification permission.
- Broker Open Positions remains current-position truth; FIFO executions remain
  realized-history truth; dividends remain separate from Trading P&L/Win Rate;
  broker originals remain immutable; local edits remain Layer C; FX is display-only.
- Backup preview validates canonical dates before any replace transaction.
  Credentials, local DBs, statements, notification receipts, and APKs were not
  committed. No uninstall, clear-data, destructive migration, or history deletion
  occurred.

## Automated validation

- Global heavy queue gate passed:
  `./gradlew :app:testDebugUnitTest :app:assembleDebugAndroidTest :app:lintDebug :app:assembleDebug`.
- JVM: **231 total, 230 passed, 0 failed, 0 errors, 1 skipped**. The sole skip is
  the opt-in real `.xls` smoke because `LEGACY_XLS` was not supplied.
- Tests cover NY due/DST/device zones/manual satisfaction/catch-up/unique worker,
  transient/permanent/partial behavior, single-flight and exceptional pull state,
  Room 1→2→3 preservation, exact date/LTR and machine-value policies, shared Stats
  geometry and wins/losses acceptance, one-gross→many-tax replay, tax priority,
  cash signs/unknown, override/revert, weighted/mixed-currency aggregation, six
  sorts, conservative description parsing, history ownership, and sanitized RAW
  errors.
- Android migration, multiple-tax replay, and Compose measurement tests compiled
  into the androidTest APK but did not execute without a device.
- Lint: **0 errors, 24 warnings**. `git diff --check` passed.
- androidTest APK: **1,122,322 bytes**, SHA-256
  `a6769a57cf34b036badda222f0c50d398c2b88b19e58fddc586c7efc0399433a`.

## APK delivery

- Canonical path: `/sdcard/Download/TradingTracker/TradingTracker.apk`
- Size: **16,346,048 bytes**
- Delivery mtime: `2026-08-24 12:23:07.063469094 +0000`
- Gradle and delivered SHA-256:
  `8d24de2c8f0b992c3d0af48afc675aa71d0af445dd76ae86fff010e505d01995`
- The final `app-debug.apk` was copied through a temporary file in the dedicated
  folder, given current mtime, atomically moved, `cmp`/hash-verified, checked
  non-empty, and sent through Android media scan. The old top-level Download APK
  was left untouched.

## Physical/live status and blockers

- `adb devices -l` returned no device. No `adb install -r`, launch, logcat,
  WorkManager inspection, physical UI/date/pull smoke, or installed-data survival
  check occurred. No physical NY 21:00 wake is claimed.
- The installed database/real RAW Flex rows were inaccessible. The BTCI
  one-gross/multiple-tax linkage, exact historical gross/tax/logical coverage
  counts/dates, and exact Cash Report fallback evidence remain physically
  unverified; generic fixtures are not represented as sanitized real rows.
- The mandatory same-period live replay remains a release blocker: run one
  successful refresh, capture counts/totals, immediately refresh the same data,
  and require `rowsNew = 0` plus stable execution count, logical-dividend count,
  realized P&L, dividend gross/tax/net, and current quantities.
- Physically inspect all pull routes, the actual per-security table/long signed
  P&L/column alignment, representative closed/open dates, all six dividend sorts,
  multiple tax rows, effective-source/manual-revert behavior, and existing data.
- Follow `docs/DEVICE_VALIDATION.md`; install only with `adb install -r`. Never
  uninstall, clear data, expose the Flex Token, or delete history as a workaround.
