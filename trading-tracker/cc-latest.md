# trading-tracker — Round 2 handoff (2026-08-24)

Project HEAD: `605a12375adf3593d3425d7c57180cc9ffe511cf` (origin/main, pushed)
Starting project HEAD: `e7310849b6d9248d23895bcf264c12114eaf2f35`
Repo: `github.com/funzi7/trading-tracker` · package
`com.funzi7.tradingtracker` · app/database version `0.2.0` / `2`

## Work completed

- Changed current-position truth to the latest valid, per-account IBKR Open
  Positions snapshot. Present/nonempty replaces, present/empty clears,
  absent/malformed retains, zero quantity is hidden, identical replay is stable,
  and older backfills cannot replace a newer snapshot. Manual-only FIFO positions
  remain visible; broker FIFO residues are diagnostics rather than current
  inventory. Reconciliation includes broker-open/ledger-closed,
  ledger-open/broker-absent, quantity, and instrument mismatches with contract-ID
  identity preferred over ticker text.
- Added stable logical dividend payments with conservative gross/withholding
  pairing and explicit ambiguity. Broker originals remain immutable. A Layer-C
  per-payment tax-percentage override accepts fixed-point decimal `0..100`,
  recomputes effective tax/net across detail, Home, calendar/daily, statistics,
  and export, and can revert to broker truth. Dividends remain excluded from
  Trading P&L and Win Rate.
- Added durable dividend notification baseline/dedup/backfill eligibility,
  Hebrew-first native-currency content, one event per logical payment, Android
  13 permission handling, a dividend channel, immutable/update PendingIntent,
  and a cold-start route to the exact payment detail. Existing history and later
  historical backfills remain silent; replay/restatement identity cannot alert
  twice; notification denial cannot fail sync.
- Automated FX refresh on active launch when missing/stale (>24h) and through one
  unique daily network-constrained WorkManager job. The existing open.er-api.com
  primary and Frankfurter fallback preserve prior valid cache on all failures or
  invalid/zero responses. USD/ILS/THB display conversion is non-mutating and
  reports source, successful timestamp, and age.
- Added IBKR NAV Summary in Base and Cash Report parsing/storage for NAV, Cash,
  and Settled Cash with independent freshness/order protection. Effective
  Portfolio Size is newest complete valid broker NAV, otherwise manual fallback;
  Position Sizing uses the effective NAV while risk percentage remains a user
  setting. Current multi-account coverage is explicitly VALID/ABSENT/INVALID.
  Missing/malformed/older sections never zero or regress valid state.
- Fixed dark Material 3 foreground roles and shared component propagation across
  the app while preserving profit green, loss red, dividend gold, open-position
  blue, Hebrew RTL, and LTR isolation for financial/ticker/date text.
- Enabled Room schema export, committed v1/v2 schemas, added an explicit additive
  migration 1→2, and retained all released entities/data without destructive
  fallback. The database grows from 14 to 20 entities.
- Extended portable backup v2 for new broker/portfolio state while preserving a
  golden-tested v1 checksum path. Export uses one Room snapshot; restore validates
  settings before replacement, applies financial data plus notification baseline
  transactionally, and compensates ordinary cross-store cancellation. Credentials,
  FX cache, and notification receipts remain excluded; Android OS backup is
  disabled/excluded.
- Made Excel export transaction-consistent and audit-friendly: one detail row per
  realized FIFO slice (including partial cycles), full fixed-point precision,
  multiplier, allocated commissions, execution/cycle IDs, honest timestamp versus
  date-only precision, native currencies, and separately visible broker/effective
  dividend values.
- Updated README, TODO, architecture/data/backup/schema/Flex research docs,
  PROJECT_STATE, RELEASE_REVIEW, and DEVICE_VALIDATION. D1/D2 remain unanswered.

## Automated validation

- Final global-queue gate passed:
  `./gradlew :app:testDebugUnitTest :app:assembleDebugAndroidTest :app:lintDebug :app:assembleDebug`.
- JVM results: **148 discovered, 147 passed, 1 skipped, 0 failures/errors**. The
  skipped test is the optional owner-file-dependent legacy `.xls` smoke test.
- Production migration 1→2 passed a host SQLite test seeded from the exported
  released v1 schema, including exact v2 schema/index/default checks and
  preservation of executions, dividends, RAW rows, metadata, tags, journals,
  settings, and credential references. Android `MigrationTestHelper` and
  PendingIntent tests compiled into the androidTest APK but could not execute
  without a device.
- Lint passed with **0 errors and 22 non-blocking warnings**.
- Debug APK: `/sdcard/Download/TradingTracker.apk`, **16,314,583 bytes**, SHA-256
  `3a597a840bfd03b7f54a7aa2df8e2d7652156b637123f3dce7c640875d940099`.
  It was byte-compared with `app/build/outputs/apk/debug/app-debug.apk`.
- androidTest APK: 435,418 bytes, SHA-256
  `81edb0188ea749487283965dc0d683e19e211784fc2f0dfa4c072311c11a6a3a`.
- Final `git diff --check` passed before staging.

## Real integration and physical state

- The owner previously physically installed v0.1, configured the IBKR Activity
  Flex Token/Query ID, and confirmed the first successful live sync. The observed
  screen showed about 15 open positions, 366 closed trades, monthly gross
  dividends about $171.93, withholding about -$53.88, net about +$118.05, and
  first-load counters about 13790 new / 0 duplicate. This confirms connectivity
  and first ingest only; it is not an idempotency proof.
- `adb devices -l` returned no attached device throughout Round 2. Therefore the
  agent did **not** run `adb install -r`, launch v0.2, inspect logcat, observe the
  v1→v2 migration/data survival, perform the mandatory same-period second live
  sync, compare live displayed positions with the parsed snapshot, inspect actual
  dark-theme rendering, or touch-test tax override/revert/deep links.
- Live NAV/Cash/Settled Cash could not be validated and the installed query's two
  required section selections could not be observed. A naturally new dividend
  did not arrive, so no real incoming-dividend notification is claimed.
- No uninstall, clear-data, destructive migration, historical-execution deletion,
  or credential/token exposure occurred.

## Architectural decisions and remaining risks

- Broker Open Positions is authoritative only after a valid current snapshot;
  historical executions remain authoritative for FIFO realization/history and
  reconciliation. A valid empty section is meaningful; collection emptiness alone
  is never used as section-presence evidence.
- Broker originals remain immutable and Layer-C overrides remain separate.
  Notification identity/baseline is durable and conservative when timestamps are
  unknown. IBKR sync cadence was not changed or scheduled.
- Official IBKR documentation was rechecked on 2026-08-24. Exact NAV/Cash runtime
  XML attribute aliases are still explicitly UNVERIFIED until the first real
  statement containing those sections; preserved RAW input is the source for any
  future alias addition rather than guessed values.
- Release remains blocked on the immediate second same-period real sync proving
  `rowsNew = 0` and stable RAW/canonical/payment/position/closed-trade/P&L/dividend
  totals; any duplicate is a code blocker, not a documentation waiver.
- Also pending: non-destructive physical update/data-survival check, live position
  equality by instrument/quantity, rendered contrast audit, live NAV/Cash shape,
  and observation of a genuinely new future dividend notification.
- Room replacement is transaction-atomic and ordinary cancellation compensates
  the separate DataStore edit. A process death in the narrow cross-store commit
  window is not strictly atomic without a future restore journal; financial Room
  data remains transactional and safe settings are recoverable.
- The delivered artifact is an installable debug APK. Release signing/R8 and a
  desktop Excel/Sheets opening remain follow-up validation. Corporate actions stay
  RAW-only. D1 credentials-in-portable-backup and D2 broker-row delete/hide policy
  remain untouched in `docs/DECISIONS_PENDING.md`.

## Next mandatory run

Follow `docs/DEVICE_VALIDATION.md`: install with `adb install -r` only, record all
specified counts/totals, run the same effective IBKR period twice, require second
sync `rowsNew = 0`, compare broker positions exactly, validate NAV/Cash if present,
and physically inspect all major dark-theme screens. Never uninstall, clear app
data, expose the Token, or delete history to make reconciliation look correct.
