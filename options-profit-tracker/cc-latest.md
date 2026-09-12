# OptionsProfitTracker — rolling handoff (Claude Code)

**Task:** S2.4 — STOCK REALIZED INTEGRITY + PRACTICAL PUT WINDOW + ACTIONABLE CC QUOTES + UNIFIED
WATCHLIST + MARKET-BRIEF LAYOUT
**Date:** 2026-09-12
**Branch:** `s2/ibkr-reconciliation-lifecycle-dashboard` — **PR #19 OPEN** (`needs-owner`,
`no-automerge`), **never merged**, nothing pushed to `main` (`main` is still
`7225b7af16c183de00a9f064ead03a01ad6af1d3`).

---

## 1. Heads

| | SHA |
|---|---|
| Starting HEAD (coordinator-verified) | `c1b9300f70819b0b9f6a12dd53f2ed738415ef5a` |
| **Final HEAD** | `9183a167c03f15761e48f94cbde5aa0d9571c9e3` |
| merge-base with `origin/main` | `7225b7af16c183de00a9f064ead03a01ad6af1d3` |

---

## 2. READ THIS FIRST — the defect this round was commissioned to fix DOES NOT EXIST

S2.4 was written against: *"SPCH 1,000-share sale reconciles to −$2,412.39; the app falsely shows
−$6,815.39; duplicate report grains are being double-counted."* The arithmetic even supported it —
`−2,412.39 + (−4,403.00) = −6,815.39` exactly.

**One real Flex sync on the device disproves it.** IBKR sends the sale as **FOUR EXECUTION fills on
2026-09-08 15:10:17 ET**:

| qty | price | `fifoPnlRealized` |
|---|---|---|
| 300 | 10.69 | −2,043.77 |
| 100 | 10.69 | −681.97 |
| 500 | 10.70 | −3,407.71 |
| 100 | 10.69 | −681.94 |
| **1,000** | | **−6,815.39** |

- The four fills sum to **exactly 1,000 shares and exactly −$6,815.39**.
- The audit reported **0 MISMATCH and 0 GRAIN_SUM lines over the entire 103-ticker payload** — every
  STK row in the owner's Flex query is `levelOfDetail=EXECUTION`. **There is no duplicate grain
  anywhere to double-count.**
- The per-ticker total and the per-sale drill-down **agree to the cent**, verified ON SCREEN.
- **−$2,412.39 appears nowhere in the payload.** Nothing was changed toward it.

**OWNER INPUT NEEDED:** if IBKR's own screen shows −$2,412.39 for this sale, it is a different report,
period or lot-matching basis. Please send that exact IBKR view. It must not be "fixed" toward blind.

**Note on the date.** The sale traded **2026-09-08**. The task called it "the 2026-09-09 sale" because
the app's drill-down was printing the DEVICE's calendar day — see §6.

---

## 3. What shipped

### 3.1 `StockRealizedGrain` — one canonical stock-sale grain rule (new, pure, 40 tests)

Defensive, and it closed a real divergence even though it was not the SPCH bug:
`ImportViewModel.captureStockRealized` summed **every** STK row carrying a `fifoPnlRealized` and was
the ONLY consumer of `parseFlexXml` with no grain rule — options have `selectExecutionRows`, holdings
have `selectHoldingRows`, cash has `FlexWithdrawals`, and the stock FEED had its own inline EXECUTION
filter. **The total and the feed were reading two different row sets**, one query-config change away
from the double-count this now prevents.

- **EXECUTION is the grain of record** — because it is the grain the FEED uses. Both surfaces now
  select through `StockRealizedGrain.select`.
- **Suppression is scoped to ONE ORDER** — never the payload, not even the ticker (that would DELETE
  an older sale the payload reported only at ORDER grain). Identity is `ibOrderID`/`orderID`, else
  `(ticker, day)`; **never `transactionID`** (per-row, and the attribute that double-counted the
  withdrawal card). Two rows at the SAME grain are never merged.
- **A losing grain tier is suppressed ONLY when it RESTATES the winner — same money AND same signed
  quantity.** Money alone is not enough: an EXECUTION SELL realizing +$100 and a separate buy-to-cover
  realizing +$100 on the same ticker and day have equal sums and are different movements, and matching
  on money alone DELETED the second (Codex found this). IBKR signs sells negative and buys positive, so
  signed quantity separates them — and separates two break-even rows whose sums are both `0.00`. A tier
  that does not restate the winner is **KEPT** and reported as `GRAIN_SUM`, never deleted.
- **The FEED additionally takes EXECUTION-grained (or wholly unlabelled) rows only.** The feed is
  append-only and dedupes on `(timestamp, amount)` with no migration path, so letting an ORDER-grain
  sale become an event meant a later EXECUTION-grain payload inserted its fills ALONGSIDE the surviving
  aggregate — `+100` today, `+60`/`+40` tomorrow, drill-down 200 for a sale of 100, permanently (Codex
  found this too). The total is rebuilt each import and is immune. `crossSurface` reports the
  difference rather than hiding it.
- **`fifoPnlRealized` is already net of commission** — never re-applied.
- **A BUY row is not a sale**: buy rows stay in the TOTAL (a buy-to-cover carries real realized P&L)
  but have no feed event, and `crossSurface` reports exactly that as the one legitimate difference.
- **Nothing is dropped silently**: bounded `STOCK_REALIZED` audit lines, a `SUM` line per ticker-month,
  and magnitude-ordered `ROW` lines.

### 3.2 Put window: DTE **2–60 inclusive** (SUPERSEDED — owner approved)

"No upper DTE cap" worked exactly as specified and that was the problem: with an un-annualised ratio a
longer expiry legitimately wins, so the live list filled with 2027–2028 LEAPS (WDCX PUT 18 exp
2028-12-15 at 119.51 %, DTE 827). The owner chose a WINDOW rather than annualising.

- `PutOpportunity.MAX_DTE = 60`, new `Rejection.EXPIRY_TOO_FAR`; `rejectionOf` stays the ONE rule set.
- **The window is applied BEFORE the request budget is spent** (`DashboardViewModel`'s `eligible`
  filter). Otherwise the scan buys three chains per ticker on LEAPS it then rejects and ranks nothing
  while claiming "no put meets the rules".
- `contractsRejectedTooFar` and `tickersWithNoExpiryInWindow` are separate counters with their own
  sentences — "everything expires tomorrow" and "everything is a LEAP" are opposite facts.
- The ratio is **still not annualised**; everything else in the approved contract is unchanged.

### 3.3 CC reminder: BID / ASK / MID (owner approved)

- `CcPremium.midOf` / `recommendedLimitPerShare`. **Estimated premium = MID, recommended limit = MID**,
  derived ONCE (the card reads `quoteMid`, it does not recompute).
- **A mid exists only from a valid bid/ask PAIR**: a lone bid has no midpoint (`(bid+0)/2` would halve
  a real price), a lone ask has none, a crossed book is rejected, `ask == bid` is a locked market and
  is fine. With no pair the card falls back to the BID alone, exactly as before.
- `IvService.CcQuote.askPerShare`; stored as `ccQuoteAsk` and **REMOVED when a refresh returns no
  ask**, so a stale offer can never pair with a newer bid.
- The ×100 still happens exactly once (0.42/0.44 → mid 0.43 → **$43.00**/contract).
- Labelled `לימיט מומלץ (אמצע, לא מובטח ביצוע)` — a midpoint is not a fill.
- The owner's own last sale stays a separate line with its SOLD date.

### 3.4 One watchlist (owner approved)

`WatchlistShared.kt` + `WatchlistSort.kt`. The two surfaces had become two different lists with one
name: the full screen seeded prices and showed the day change, the `רשימת מעקב` section on
`AlertsScreen` showed **neither**, and only the full screen carried the price into `פוזיציה חדשה`.

- ONE quote loader, ONE row, ONE sort control, ONE tap target.
- Default sort = **today's move, largest declines first** (ascending on a signed %; descending would
  put the best day on top).
- Sort choice AND direction **persist and are shared** — one `TableSortPrefs` key `watchlist_shared`
  (its own SharedPreferences file, **not** the protected `AppPreferences`).
- A row with an **unknown** move sorts LAST in both directions; final tie-break is the ticker.
- The S2.3 accepted behaviour moved across unchanged (cached price is a real price; a failed refresh
  merges, never blanks; no fake `$0.00`).

### 3.5 Market brief: one alignment (layout only)

Each row was a `Row` of two `Text`s weighted `1f, fill=false` / `2f` — a fixed one-third/two-thirds
split producing FOUR different offsets on one card, and a wrapped detail resumed at its own inner edge
while a wrapped label resumed at the card's edge. Now every row is ONE paragraph in ONE `Text` with
ONE indentation constant; the note shares that edge. The detail sits in an explicit **LTR isolate**
(`⁦`…`⁩`, written as escapes) rather than a separate `LtrText`, which keeps the
"`2026-09` must never render as `50-2026`" guarantee while letting the row wrap to one common edge.
The `TICKER ±x.x%` NBSP pairing and the S2.1 no-truncation rule are untouched.

---

## 4. The historical audit — 114 ticker-months, measured on the device

**93 agree to the cent. 21 differ. NONE is a double-count.** Classified, recorded, not silently repaired:

| cause | evidence | direction |
|---|---|---|
| **Buy-to-cover has no feed event** (owner-pending A5) | MULL 2026-07 `+3,159.07`, PLUG 2026-06 `−691.07`, QQQ 2026-02 `−4.30` | total right, drill-down short |
| **Same-second `(timestamp, amount)` feed fingerprint collapses two real fills** | **BCAR 2026-01-13 12:33:36 has TWO fills both realizing `1.48`** (at 10.29 and 10.30); only one event exists; diff is exactly 1.48. Also EWT 2026-05, VNDA 2026-02, RXT 2026-02, MULL 2026-06 | total right, drill-down short |
| **The rebuilt total is windowed** — `captureStockRealized` replaces the whole map from the CURRENT Flex window while feed events accumulate for ever | GPUS 2026-01: feed 76.34 vs total 36.66 | drill-down right, total short |
| **Cent rounding** (per-row round vs sum round) | 11 ticker-months at exactly ±0.01 | cosmetic |

The first two were already owner decisions and were **deliberately not changed**: the fingerprint IS
the identity of money-bearing feed rows, and altering it without a migration would INSERT duplicates on
the next import — worse than the under-count. Previously "9 ticker-months affected, theoretical"; now
measured exactly. Options for each are in `roadmap.md`.

---

## 5. Device QA (real phone, SM-S938B)

**Session clock: Saturday 2026-09-12, ~04:40–05:15 ET — the US market and the option book were SHUT
all session.** That bounds what could be proven, and nothing was faked to cover it.

| check | result |
|---|---|
| Signer gate | new APK SHA-1 `5d3d855c6c6c397f817df2bd0c62f16f940b1551` == installed. **PASS** |
| `adb install -r` | Success, in place. `firstInstallTime` still 2026-04-22 22:53:57. No uninstall, no `pm clear`, no DB/DataStore deletion, **no reboot** |
| Installed == built == delivered | SHA-256 read back off the device matches the build and the delivered copy |
| Stability | 0 FATAL, 0 AndroidRuntime, 0 Room/SQLite/migration across **39,742** app-PID lines |
| Privacy | **0** occurrences of the Flex token, Anthropic/Finnhub/AlphaVantage keys, any `U#######` account id, `FlexQueryResponse`, `AccountInformation`, or the owner's email |
| **A — stock realized** | Proven; see §2 and §4. Total == drill-down on screen |
| **B — put window** | Closed-market path correct: `אין מחירי מסחר רגיל להיום.`, `ראה הכל` present, **no fabricated candidate**. **Live 2–60 ranking NOT proven — market shut** |
| **C — CC quote** | Stale/last-known labelling verified: MULL `ביד אחרון שנצפה לחוזה: $110.00` `(פקיעה 16.10.26 · סטרייק 29)` + `לא ציטוט חי — נקרא לפני 13 שעות.`; SPCH `אין כרגע ציטוט אמין לחוזה.` + `פרמיה אחרונה שמכרת: $44.00 · 10.09.26`. Neither said `ביד נוכחי`; **no midpoint invented from half a book**. **Live BID/ASK/MID NOT proven — option book shut** |
| **D — watchlist** | Both surfaces: same 15 tickers, same prices, same day changes. Default order verified live (NVTX −0.5 → ELIL +0.6). Sort changed on the ALERTS surface → `watchlist_shared_col=PRICE` persisted → the FULL screen opened `מחיר ▼` ordered 218.26 → 17.12. Tapping WDCX on BOTH surfaces prefilled `מחיר נוכחי` = **17.12**. Default restored. **No trade saved** |
| **E — market brief** | Rows wrap to one shared right edge, dates render LTR (`18.09`, `15.67P`), no tofu. Multi-explanation-row case not observable on a closed Saturday |
| Request storm | **4** `WATCHLIST_VOL` lines all session — one batch per screen entry, each `seeded 15/15 refreshed 15/15`. **0** `CC_QUOTE` calls (correctly gated by the shut book) |

---

## 6. Two extra real defects that only the device found

1. **The drill-down date was the DEVICE's day, not the broker's.** `getStockSalesForTicker` formatted
   with `ZoneId.systemDefault()`; on the owner's UTC+7 phone a 2026-09-08 15:10 ET fill printed
   `09/09/2026`, while the month CHIP beside it already keyed on New York. One sale, two dates, one
   screen — **and that wrong date is what this whole task was written against.** Fixed as
   `StockRealizedGrain.saleDayLabel` and unit-tested: the date is part of the claim.
2. **The bounded audit hid the very ticker it existed to explain.** Capped at 40 rows in payload order,
   its first real run spent every line on tickers beginning with A and B and never reached SPCH. Now
   ordered by the magnitude of the realized amount, plus a `SUM` line per ticker-month.

---

## 7. Tests, compile, APK

- **729 JVM tests, 0 failures, 0 errors, 0 skipped, 39 classes** (was 662 / 37). Read from the JUnit
  XML, not Gradle's summary. New: `StockRealizedGrainTest` (47), `WatchlistSortTest` (9), plus new
  cases in `CcPremiumTest`, `PutOpportunityTest`, `PutRejectionTest`, `PutScanEmptyReasonTest`.
- `:app:compileDebugKotlin` → **BUILD SUCCESSFUL**, `grep -c "^e: file:"` = **0**.
  (Watch for the known Kotlin-daemon startup flake whose message also begins `e: ` — grep `^e: file:`.)
- `:app:assembleDebug` → **BUILD SUCCESSFUL**. Final APK SHA-256
  **`2fdbd111902ebb0c2eacebcedb750b8b827c9d3c63a03ab6cdc43049a7284f10`**; built == installed ==
  delivered to `/sdcard/Download/OptionsProfitTracker/OptionsProfitTracker-1.0.0.apk`, all three hashes
  read back and identical. Signer SHA-1 `5d3d855c6c6c397f817df2bd0c62f16f940b1551`. `adb install -r`
  only — no uninstall, no `pm clear`, no DB/DataStore deletion, no reboot; `firstInstallTime` still
  2026-04-22 22:53:57. versionName 1.0.0 — **no invented version bump**.
- `git diff --check` clean. `local.properties` deliberately not committed.

---

## 8. Gates

| Gate | Result |
|---|---|
| **PR Build Gate** | **PASS** on every head pushed this round: `75441d1`, `9a527c7`, `09bfa2c`, `62404c8`, `e248039`, `6de000b` |
| **Codex exact-head review** | **CODEX CAME BACK MID-TASK.** It was quota-blocked at the start (`You've hit your usage limit… try again at Sep 15th, 2026 2:29 AM`, verified twice) and the sanctioned Claude fallback was used for the first two rounds. Re-probed before finalizing: Codex answered. It then performed a REAL exact-head review and found **3 MAJOR** defects two Claude reviewers had missed — see §11. **`review_provider = codex` for the final round**, not the fallback |
| `Codex Gate` check on the PR | **RED**, and correctly so. The review above was run through the local `codex exec` CLI; the gate looks for a review signal posted to the PR by the ChatGPT Codex connector, which a local CLI run does not produce. Do not read the red check as "no Codex review happened" — read §11 |
| **CENTRAL structured fallback attestation** | **STILL MISSING — infrastructure blocker, unchanged.** No such mechanism exists under `/root/work/bin` or in `automation-core` (`provider=claude_code_fallback` / `reviewed_head=` / `unresolved_p1=` appear nowhere). It was **not faked**, no local workflow was patched, and `codex-p1-acknowledged` was **NOT** used. The round's overall validation is `failed` **for this process gate only** |

---

## 9. Model/agent availability this round (disclosed — the planned split did NOT happen)

The canonical rules put PLANNING on the latest Fable and IMPLEMENTATION on the latest Opus.

- **Fable: quota-exhausted.** Two planning subagents died with `You've reached your Fable limit`
  (HTTP 429, `claude-fable-5-1`).
- **Opus subagents: weekly limit**, three planning subagents died with `You've hit your weekly limit ·
  resets 8am (UTC)`. One planning subagent (stock-realized) completed before the limit; the other three
  investigations were done by the main thread itself.
- The main thread ran on **Opus 5 (1M)** throughout, which is the strongest setting actually available.
  Once the weekly limit reset, the reviews used **separate Opus reviewer subagents**, and then Codex.
- Per the rules this is recorded rather than presented as if the split had been performed.

**The quota situation is why this round had FOUR review passes by THREE different reviewers, and it is
the single most useful thing that happened to it:** the two Claude reviewers between them found the
orphaned-price defect and the money-deleting grain fallback, and then Codex — reviewing the head those
fixes produced — found three MAJOR defects both Claude reviewers had passed, including one the second
Claude review had explicitly examined and cleared. A second opinion from a different model was worth
more here than a third pass from the same one.

---

## 10. Owner-pending

1. **Where −$2,412.39 comes from** — send the exact IBKR view. See §2.
2. **Live CC BID/ASK/MID** and **live 2–60 DTE put ranking** — both need an open US session.
3. **Buy-to-cover feed rows (A5)** and **the same-second feed fingerprint** — now measured (§4); both
   remain owner decisions with numbered options in `roadmap.md`.
4. **The windowed rebuilt total** (GPUS) — three numbered options in `roadmap.md`.
5. **Unchanged and untouched:** the `× 1.3` premium boost in `ReportGenerator`'s abnormal-move alert
   (seen live this session as `→ CSP ~2.68` on SOXL); the assigned Covered Put realizing its premium
   nowhere on the manual path (`ProfitCalculator`, P&L-locked); cleartext credentials in the daily
   external-storage backup; `allowBackup` with no extraction rules; the dashboard price-refresh
   fan-out; the CSP prefill's ticker-level IV; the per-ticker `changePct` day-baseline gap.
6. **Settings renders the Flex token and every API key as plain on-screen text** (pre-existing;
   observed again this session, deliberately not recorded anywhere).
7. **Reboot remains PASS from S2.3 and was NOT repeated.** Do not reopen it.

---

## 11. Exact-head review — findings and disposition

**SEVEN review passes by THREE reviewers.** Codex was quota-blocked when the round began (the
sanctioned Claude fallback ran twice) and **came back partway through**, so the final authority is
**Codex, not the fallback** — the first time that has been true in this PR series.

| # | Head | Reviewer | Verdict |
|---|---|---|---|
| 1 | `9a527c7` | Claude fallback (separate Opus) | REQUEST_CHANGES — 0 BLOCKER / 3 MAJOR / 8 MINOR / 4 NIT |
| 2 | `e248039` | Claude (separate Opus) | APPROVE_WITH_COMMENTS — 0 / 1 / 8 / 6 |
| 3 | `e248039` | **Codex** | REQUEST_CHANGES — 0 / 3 / 3 / 0 |
| 4 | `6de000b` | **Codex** | REQUEST_CHANGES — 0 / 2 / 4 / 0 |
| 5 | `249cc25` | **Codex** | REQUEST_CHANGES — 0 / 1 / 3 / 0 |
| 6 | `9e3f83a` | **Codex** | REQUEST_CHANGES — 0 / 1 / 3 / 0 |
| 7 | `32d5c77` | **Codex** | APPROVE_WITH_COMMENTS — 0 / 0 / 1 / 0 |
| 8 | `2f0f202` | **Codex** | APPROVE_WITH_COMMENTS — 0 / 0 / 2 / 0 |
| 9 | `905fa02` | **Codex** | APPROVE_WITH_COMMENTS — 0 / 0 / 2 / 0 |
| 10 | **`9183a16` (final)** | **Codex** | **APPROVE — 0 / 0 / 0 / 0**, *"ready to hand to the owner"* |

**The MAJORs, in order, and all fixed:**

1. **The alerts watchlist prefilled a price into a form with NO ticker.** Unifying the row made that
   surface pass `targetStrategy` into `prefillFromBestTrade`, whose `else -> return` bails for five of
   the picker's seven labels — skipping `updateTicker` while `prefillCurrentPrice` still ran. NVDA
   (`"מניות"`) opened an empty ticker with a price belonging to nothing. **Verified fixed on the device.**
2. **The grain rule could DELETE money.** On the live `(ticker, day)` key, "suppress everything that is
   not the winning grain" removed a second, genuinely different order reported at a coarser grain.
3. **Codex: equal money is not the same movement.** A SELL and a buy-to-cover both realizing `+$100`
   collapsed into one.
4. **Codex: the FEED could accumulate two grains of one order ACROSS imports** — append-only, dedupes
   on `(timestamp, amount)`, no migration path: `+100` today, `+60`/`+40` tomorrow, drill-down 200 for
   a sale of 100, permanently.
5. **Codex: exact-contract IV had a 100× discontinuity.** `rawIv < 5.0 -> ×100` was borrowed from
   `IvService`; against Yahoo v7, where IV is always decimal, a decimal 5.0 (500 %) rendered as **5 %**.
6. **Codex: the quantity guard itself double-counted** — a restating ORDER row that omits `quantity`
   had it coerced to 0, so it no longer matched its own fills.
7. **Codex: an order id is not a fill.** A GTC order fills across sessions and IBKR emits a DAILY ORDER
   row per session; comparing one day's row against ALL the order's executions counted a day twice.

**The final rule, after all seven:** suppression requires IBKR's own order id; grouping is by
`(order id, broker day)`; within a group a losing tier is dropped only when it restates the winner's
money and — when both state one — its signed quantity. Without an order id **nothing is suppressed**
and the group is reported as `AMBIGUOUS_GRAIN`. On the owner's current query that means no suppression
runs at all, which costs nothing because that payload was measured to contain zero duplicate grains.

**Also fixed across the rounds:** the stock drill-down date was the device's day, not the broker's
(this is why the task itself was written against "the 2026-09-09 sale", which traded on 09-08); the
audit's row cap hid the very ticker it existed to explain; `keptRows` claimed a guard it did not
implement; the audit asserted "only partly covered" from a comparison that cannot establish it; the
empty state spoke for every scanned ticker on one ticker's evidence; `summaryLines` had an alphabetical
cap that would have dropped 54 of 114 ticker-months including SPCH; the cross-surface audit could not
see a ticker whose sales are only in stored history; three successive attempts at the watchlist row's
0dp hazard (the third moved it, the fourth split the row, the fifth flowed it); the CC book row could
clip the MID — the number the next line calls the recommended limit; and `fetchOptionDetails` logged an
exception message that can quote a crumb-bearing URL.

**The last two rounds' findings, also fixed:** fixing ONE crumb-bearing catch was not enough — the
sibling Yahoo option paths build crumb-bearing URLs too, and a parser exception on a malformed HTTP 200
can quote the URL that produced it, so every such catch now logs the exception CLASS and the response
diagnostic keeps only `body.length`; and the recommended-limit line now says **לחוזה**, because every
other money line on that card is per CONTRACT and `$43.00` beside a per-share midpoint of `0.43` is
precisely the ×100 confusion the feature exists to prevent.

**What this round actually demonstrates:** a second reviewer from a DIFFERENT model was worth more than
another pass from the same one. Two independent Claude reviews passed a head that Codex then opened
with three MAJORs, one of which the second Claude review had explicitly examined and cleared. Every
Codex round after that found a defect inside the previous round's fix — narrowing each time — which is
the convergence you want but only get by re-reviewing the head the fix produced.
