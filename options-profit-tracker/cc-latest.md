# OptionsProfitTracker — rolling handoff (Claude Code)

**Task:** S2.3 — OWNER PHYSICAL QA ADDENDUM: market-brief explanations + put-chain failure + reboot acceptance
**Date:** 2026-09-10
**Branch:** `s2/ibkr-reconciliation-lifecycle-dashboard` — **PR #19 OPEN** (`needs-owner`, `no-automerge`), **never merged**, nothing pushed to `main` (`main` is still `7225b7af16c183de00a9f064ead03a01ad6af1d3`).

---

## 1. Heads

| | SHA |
|---|---|
| Starting HEAD (coordinator-verified) | `554346b5cb71b020c0f067110d4f0eb901c7f2bb` |
| Reviewed HEAD, round 1 | `5d4eca6f4456ca09cd1799030db1430ed8cad092` |
| Reviewed HEAD, round 2 | `f73f24271ab1a2923b0aab8ccdf6cd5ab5a5e670` |
| Reviewed HEAD, round 3 | `55d230ec9fd61ef2f5ac6d64aa2caaed0ed131bc` |
| Reviewed HEAD, round 4 | `447161c37a5a279db4891094aae1a5c33dc9f08a` |
| **Final HEAD** | `c1b9300f70819b0b9f6a12dd53f2ed738415ef5a` |
| merge-base with `origin/main` | `7225b7af16c183de00a9f064ead03a01ad6af1d3` |

FIVE project commits: the addendum's work, then four fix rounds answering successive exact-head
reviews. No docs-only commit was made after a review. Section 10 lists every finding and its
disposition. Severity fell each round — r1 3 BLOCKER / 11 MAJOR, r2 0 / 8, r3 0 / 3, r4 0 / 0 (four MINORs) — and
**three of the four fix rounds introduced a regression of their own**, which is the single most useful
thing this process surfaced.

---

## 2. REBOOT — **PASS**

The owner physically rebooted the phone. Android started normally, the app opened normally, the data was
usable. **Every "reboot pending" record is now closed** — `pending-tests.md` carries the PASS and marks the
2026-08-19 S1, S1-cont, 2026-09-06 S1-final and 2026-09-07 S2 reboot items SUPERSEDED (kept for history
only). The durable fix was always the full-APK `install -r` loop rather than Apply Changes. **The reboot
was NOT repeated** — the owner's evidence is not duplicated.

---

## 3. Market brief — the finding, and the final behaviour

**What the owner physically saw:** session state → four index moves → a standalone generic Reuters
headline → a large raw list of falling tickers → nearly the SAME list again under "no specific reason was
found". Not accepted.

**Final behaviour (all SUPERSEDED changes owner-approved):**

- The aggregate `עולות היום:` / `יורדות היום:` lines are **REMOVED** from this card. `מה קורה בטיקרים שלך`
  is an EXPLANATION section; the raw `טופ עולות/יורדות` card directly below it *is* the list. Nothing is
  hidden: every explanation row names its own tickers **with their moves**, joined by a non-breaking space
  so a ticker can never land on one line with its percentage on the next.
- **Grouping by a shared verified cause.** Movers sharing ONE provider-assigned industry AND one direction
  collapse into a single `SECTOR_GROUP` row — `<Industry> · TICKER ±x.x%, …` plus a note stating the
  measured fact. `SectorContext.groups` keys on (industry, direction), so an industry moving both ways
  yields two honest rows, and a group always rests on ≥ 2 distinct companies (a subject is never its own
  evidence). Never grouped merely because several tickers are red; a ticker from another industry cannot
  enter the group.
- **Company-specific outranks sector outranks broad market.** A ticker with its own catalyst keeps its own
  quoted row and never becomes a group subject.
- **The standalone `חדשות שוק מהיום:` block is REMOVED.** A market-wide item appears only when
  `MarketNewsRelevance` can tie it to a tracked ticker, a held provider-named industry, or the benchmark
  row already on screen — and the line **states that scope** (`חדשות היום שנוגעות לטיקרים שלך:` + the
  symbols). Matching is literal and checkable, and EVERY match — cashtag or bare — must clear a
  3-character floor and the ordinary-word stoplist (`CEO`, `ETF`, `FED`, `ALL` are all real symbols;
  `$C 5 billion` is a currency amount). A bare match additionally rests on the symbol being upper case
  where a word is not, so an ALL-CAPS wire headline accepts cashtags only. An industry matches as a whole
  PHRASE with a deterministic tie-break; an index phrase must be complete (a bare "Dow" is Dow Inc).
  Everything else is **omitted**. A long headline is cut at a word boundary with the source appended
  **after** the cut — and the ellipsis is stripped before asking whether the outlet is already named.
  **No AI provider and no new key were added** — nothing is reworded, only bounded.
- **The broad-market row states co-movement, never causation:**
  `נעות באותו כיוון עם השוק הרחב, שגם הוא יורד היום:` — the owner's permitted meaning. The phrase
  `לא נמצאה סיבה ספציפית` is gone and the S2.2 string `אין הסבר זמין…` stays gone.
- **No explanation ⇒ OMIT.** No apology line, no invented reason; the ticker stays in the raw movers card.
- **The cap no longer deletes a fact.** A company row past `MAX_EXPLAINED_MOVERS` used to be dropped while
  the movers line still named it. With that line gone, the remainder now collapses into ONE row naming
  every one of them (`עוד טיקרים שלך עם סיבה משלהם היום:` — deliberately kind-agnostic, because rung 1
  also covers an earnings DATE and a social mention), so the S2.1 "never truncate" rule survives.
- **Materiality is testable.** `MarketBrief.diagnostics` reports the news verdict and the per-mover rung;
  `DashboardViewModel` logs them under `MARKET_BRIEF` **once per change** (the brief rebuilds on a
  one-minute tick). Bounded by `MAX_DIAGNOSTIC_MOVERS`; carries tickers, rung names, counts and a bounded
  **public** headline prefix — never a key, an account identifier or a payload.

### Device examples (real run)

```
MARKET_BRIEF: news: NONE — no tracked ticker, industry or index named — dropped — "Starbucks is back, CEO Brian Niccol says. Here i"
MARKET_BRIEF: explain: MULL=BROAD SOXL=BROAD SPCH=OMITTED CWVX=BROAD NEBX=BROAD SNXX=BROAD WDCX=BROAD IRE=BROAD MVLL=BROAD NVTX=BROAD
```

Rendered card: `מצב השוק` (`מסחר רגיל.` · `20:30–03:00+1` · S&P 500 −0.4 %, Nasdaq-100 −0.8 %,
Dow Jones −0.5 %, Russell 2000 −0.8 % · `המדדים המובילים בארה״ב יורדים היום.`) then `מה קורה בטיקרים שלך`
with ONE row: `נעות באותו כיוון עם השוק הרחב, שגם הוא יורד היום:` CWVX −10.9 %, NEBX −10.5 %, WDCX −9.9 %,
SNXX −9.2 %, MVLL −5.5 %, IRE −5.2 %, NVTX −4.8 %. No news block, no repeated list, no empty heading.
SPCH (+3.3 % while the market fell) was omitted — correctly not claimed as market-correlated — and is
still visible in `טופ עולות`.

**LIVE SECTOR-GROUP PATH NOT OBSERVED.** Finnhub `stock/profile2` returns an EMPTY industry for every
leveraged single-stock ETF this owner holds (ELIL, MULL, SOXL, CWVX, NEBX, SNXX, WDCX, SPCH — all logged
`industry=(none — cached as answered)`), which is a real provider answer rather than a failure. The grouped
row is covered by **deterministic fixtures only**. No sector catalyst was fabricated to claim a physical
PASS. Owner options are in `roadmap.md` item 2.

---

## 4. Put chain — root cause and result

**Root cause, proven:** the keyless Yahoo options endpoint now refuses.

```
GET https://query1.finance.yahoo.com/v7/finance/options/SOXL
HTTP 401 {"finance":{"result":null,"error":{"code":"Unauthorized","description":"Invalid Crumb"}}}
```

`לא התקבלו נתוני שרשרת מהספק.` was therefore literally true and *was a failed runtime path* — never "there
are simply no opportunities".

- **`YahooCrumb`** performs the cookie + crumb handshake a browser performs: `fc.yahoo.com` for a
  `Set-Cookie`, `query2…/v1/test/getcrumb` for the token, then `?crumb=` + the `Cookie:` header. **Same
  keyless endpoint — no account, no API key, nothing stored, no new provider.** One handshake per process;
  a refusal may re-mint at most once per `MIN_REFRESH_INTERVAL_MS` (60 s), because a dead endpoint returns
  401 for every ticker in a scan. A **200 body** is checked for the refusal too — the endpoint has been
  observed answering 200 with it.
- **All five option paths carry it**: `OptionChainQuotes.expirations` / `.puts` and `IvService`'s four,
  including `fetchCcQuote`. The same 401 was therefore a standing infrastructure reason the CC card
  reported `אין כרגע ציטוט אמין לחוזה` — that was not necessarily an illiquid book.
- **Failure classification**: `OptionChainQuotes.Failure` = NONE / UNAUTHORIZED / RATE_LIMITED /
  HTTP_ERROR / NETWORK / MALFORMED / EMPTY, surfaced through `PutScanResult.providerFailure`.
- **`PutScanResult.emptyReason` names each cause** and never collapses them: provider refused / rate
  limited / network / bad response / no red tickers / no put contracts / no exact-contract IV / all ITM /
  all expiring today-or-tomorrow / no usable bid / no put meets the rules. A provider refusal outranks the
  CONTRACT counters (they are zero *because of* it) but **not** `redTickers == 0`, which is known from the
  price snapshot without ever asking the provider.
- **`PutOpportunity.rejectionOf` is the ONE rule set** and `candidateOf` is written in terms of it, so the
  diagnostic counters can never drift from the ranking. Bounded per-red-ticker logging:

```
PUT_SCAN: MULL -8.7% provider=yahoo/v7 status=NONE expiries=6 eligible=6 pages=3 puts=566 itm=361 tooSoon=0 noOwnIv=26 noPremium=14 tinyPremium=0 badCollateral=0 ok=165 best=21.2P 2027-06-17 BID ratio=58.21%
PUT_SCAN: WDCX -8.3% provider=yahoo/v7 status=NONE expiries=5 eligible=5 pages=3 puts=147 itm=87  tooSoon=0 noOwnIv=0  noPremium=0  tinyPremium=0 badCollateral=0 ok=60  best=18.0P 2028-12-15 BID ratio=119.51%
PUT_SCAN: NEBX -8.1% provider=yahoo/v7 status=NONE expiries=4 eligible=4 pages=3 puts=238 itm=131 tooSoon=0 noOwnIv=0  noPremium=5  tinyPremium=0 badCollateral=0 ok=102 best=25.0P 2027-03-19 BID ratio=85.19%
PUT_SCAN: SNXX -7.9% provider=yahoo/v7 status=NONE expiries=10 eligible=9 pages=3 puts=243 itm=146 tooSoon=0 noOwnIv=1 noPremium=1 tinyPremium=0 badCollateral=0 ok=95  best=16.0P 2027-03-19 BID ratio=63.27%
PUT_SCAN: universe=17 red=13 scanned=4 tickers/12 expiries/1194 contracts (noOwnIv=350) requests=16 ranked=4 providerFailure=NONE
```

No API key, no account identifier and no payload appears in any of it.

- **Data quality was NOT relaxed** to fill the list: no fabricated IV, no ticker-level IV standing in for a
  contract's own, no stale `lastPrice`, no zero bid, no ITM put, no expiry today or tomorrow. **The
  approved put contract is unchanged** — universe, red-only, ITM excluded, ATM/OTM allowed, no upper DTE
  cap, one best per ticker, exact-contract IV mandatory, ranked by premium / NET collateral, not
  annualised, CSP prefill, top-3 preview, request-storm gates. `PutRejectionTest` pins all of it.
- **Existing approved providers only.** No new provider and no new key were added anywhere in this round.

### Manual ratio checks (recomputed by hand, matching to the cent)

| Ticker | Strike | gross = strike×100 | credit shown | net = gross − credit | credit/net×100 | displayed |
|---|---|---|---|---|---|---|
| WDCX | 18 | 1,800.00 | 980.00 | 820.00 | 119.5122 % | **119.51 %** |
| NEBX | 25 | 2,500.00 | 1,150.00 | 1,350.00 | 85.1852 % | **85.19 %** |
| SNXX | 16 | 1,600.00 | 620.00 | 980.00 | 63.2653 % | **63.27 %** |

Descending order held. **The dashboard preview is exactly the first 3 of the 4-long canonical ranking**
(MULL 58.21 % is 4th and correctly absent) — one scan, one cache, one formula, no re-sort.
**Exact-contract IV proven**: the rows show 131 / 182 / 157 % against ticker-level IVs of 139 / 159 / 136 %
on the same card; a substitute would have printed the same number twice.
**CSP prefill**: tapping WDCX opened `פוזיציה חדשה` with CSP selected, ticker WDCX, 1 contract, Strike 18,
פרמיה 9.80, Sell + Put, תפוגה 15.12.28, DTE 827, מחיר נוכחי 18.02. **No trade was saved.**

---

## 5. CC premium — status

**Still ACTIVE, not silently closed.** The BID-only rule from the previous addendum is unchanged and the
approved strike/DTE policy was NOT altered. What this round adds is the missing half of the diagnosis: the
same 401 was starving `fetchCcQuote`, so "no reliable quote" was often an endpoint failure rather than an
illiquid book. With the crumb fix the CC path now gets real chains and reports honest, policy-based reasons
— on the device: `CC_QUOTE: RKLX: no expiration with DTE 21-35` and the same for MULL, which is the
owner's own 21–35 DTE policy finding nothing, not a provider failure. The card was not in the screenshots
the owner sent, so **no CC acceptance is claimed**; it remains open for the owner's visual check.
One observation recorded in `roadmap.md` item 4: `fetchCcQuote` is called ~4× per ticker within
milliseconds (pre-existing, not introduced here).

---

## 6. Tests, compile, APK, device, privacy

- **662 JVM tests, 0 failures, 0 errors, 0 skipped, 37 classes** (was 579/30). New:
  `MarketBriefExplanationContractTest`, `MarketNewsRelevanceTest`, `PutRejectionTest`, `YahooCrumbTest`,
  `SectorGroupTest`, `ReviewGapCoverageTest`, `CloseEditDetectionTest`, plus new cases in
  `PutScanEmptyReasonTest` and `IbkrReconcilerTest`. Read from the JUnit XML, not from Gradle's summary.
- `:app:compileDebugKotlin` → **BUILD SUCCESSFUL**, `grep -c "^e: "` = **0**. `git diff --check` clean.
- `clean assembleDebug` → **BUILD SUCCESSFUL**. APK `app/build/outputs/apk/debug/app-debug.apk`,
  **SHA-256 `a2eb2fec834f49b054a68c6f4f82039351ec7c261b060746ff766856b70dda60`**
  (earlier heads produced `b4425f80…`, `c5803055…`, `f1edc008…` and `d6ae0ea7…`; each was installed and QA'd).
  The installed `base.apk` hash was read back off the device and matches the build byte for byte.
- Signer verified with `apksigner verify --print-certs`: **SHA-1 `5d3d855c6c6c397f817df2bd0c62f16f940b1551`**
  (SHA-256 `9e5307e1344917f0cdc495c5cc04a80d23a92c5965c779b6efb0faa1135b8221`), CN=Android Debug — the
  canonical keystore, matching the installed base.
- **`adb install -r` only.** No uninstall, no `pm clear`, no DB or DataStore deletion, no downgrade bypass,
  **no reboot**. `firstInstallTime` unchanged at 2026-04-22 22:53:57.
- Delivered to **`/sdcard/Download/OptionsProfitTracker/OptionsProfitTracker-S2.3-physical-qa.apk`** with an
  on-device SHA-256 identical to the build's.
- **Bounded logcat (23,438 app-PID lines):** 0 FATAL, 0 AndroidRuntime, 0 Room/SQLite/migration errors,
  0 account identifiers, 0 API keys, 0 raw Flex XML, 0 owner email. **No request storm**: ONE put scan
  (16 requests — the documented budget) and ONE crumb handshake across a 4-minute session; the TTL, NY-day
  and in-flight gates all held.

---

## 7. Gates

| Gate | Result |
|---|---|
| **PR Build Gate** | **PASS** on the final head `c1b9300` (run 34528404643, 4m58s, first attempt). Also passed on `5d4eca6`, `f73f242` and `447161c`. Note for the next agent: on `447161c` the gate failed once on a RUNNER FLAKE — the Kotlin daemon died on startup and its message begins `e: `, which is exactly the pattern the gate greps for. There were no `e: file:` lines and a re-run of the same job passed. Check for `e: file:` before believing a red gate. |
| Codex exact-head review | **UNAVAILABLE — quota**. `codex exec` returns `You've hit your usage limit… try again at Sep 15th, 2026 2:29 AM`. Re-verified this round. |
| Claude Code fallback review | FIVE rounds against the **COMPLETE PR diff**, each by a separate Opus reviewer. r1 `5d4eca6`: REQUEST_CHANGES, 3 BLOCKER / 11 MAJOR. r2 `f73f242`: REQUEST_CHANGES, 0 / 8. r3 `55d230e`: REQUEST_CHANGES, 0 / 3. r4 `447161c`: APPROVE_WITH_COMMENTS, 0 / 0 / 4 MINOR — all four fixed. **r5 on the final head `c1b9300`: APPROVE_WITH_COMMENTS, 0 BLOCKER / 0 MAJOR**, and explicitly *"the first fix round in the series that introduces no regression — I specifically tried to construct one and could not"*. Its 3 MINOR / 2 NIT are in a code path it verified is currently unreachable (no write path produces a BUY + ROLLED row) and it states none needs a commit before merging; they are recorded in `roadmap.md` items 10-11. |
| **CENTRAL structured fallback attestation** | **STILL MISSING — infrastructure blocker.** No such mechanism exists anywhere under `/root/work/bin` or in `automation-core`. It was **not faked**, and the `codex-p1-acknowledged` override label was **NOT applied**. `codex-gate-evaluator` / `check-codex-status` therefore show red on the PR, and the round's validation result is `failed` **for this process gate only**. |

---

## 8. Shared-tooling change (disclosed)

`/root/work/bin/agent-memory-finalize` had no way to finalize this project: it derives the memory directory
from the repo basename (`OptionsProfitTracker`) while the memory directory is `options-profit-tracker`,
so it exited 66. The owner previously **approved option (2)** — add an `AGENT_MEMORY_PROJECT` override with
the existing basename behaviour as the default — conditioned on identifying the canonical
version-controlled source first. **There is none**: `/root/work/bin` is not a git repository, the file is
not a symlink, and `automation-core` does not contain it (searched again this round). Because the current
addendum instructs the override to be used, the one-line change was applied to the deployed copy:

```bash
project_name="${AGENT_MEMORY_PROJECT:-$(basename "$project_root")}"
```

Backward-compatible (identical behaviour when the variable is unset), syntax-checked, and backed up as
`agent-memory-finalize.backup-20260910-165548`. **It still has no canonical version-controlled home** —
that remains an open infrastructure item for the coordinator.

---

## 9. Backlog / owner-pending

Recorded in `roadmap.md`, none of it changed in this round:

1. The put ranking is dominated by 2027–2028 LEAPS — a direct consequence of the owner's own approved
   "no upper DTE cap, not annualised" contract. Four numbered options; annualising is the historically
   rejected direction.
2. Sector grouping cannot fire for this portfolio (Finnhub returns an empty industry for leveraged
   single-stock ETFs). Three numbered options; inferring a sector from a symbol stays forbidden.
3. The CSP prefill's IV field takes the ticker-level IV (138.5 %) rather than the ranked contract's (131 %).
   Two numbered options.
4. `IvService.fetchCcQuote` is called ~4× per ticker within milliseconds (pre-existing).
5. **Unchanged from before:** the `× 1.3` premium boost surviving in `ReportGenerator`'s abnormal-move
   alert, and the assigned Covered Put realizing its premium nowhere on the manual path
   (`ProfitCalculator.kt`, P&L-locked). Both still carry their three numbered alternatives.

Owner-visible checks still owed are listed at the end of `pending-tests.md`.

---

## 10. Exact-head review — findings and disposition

Round 1 ran against the COMPLETE PR diff at `5d4eca6` (Codex quota-blocked, so the sanctioned Claude
Code fallback with a separate Opus reviewer). Verdict: **REQUEST_CHANGES** — 3 BLOCKER, 11 MAJOR,
16 MINOR/NIT. Every finding was re-verified against source before anything was changed; two were
verified and then answered differently from the reviewer's suggestion, and both are noted below.

**Fixed in `f73f242` — this round's own defects**

| # | Defect | Why it mattered |
|---|---|---|
| M2 | `groupDetail`/`groupNote` "non-breaking space" was a plain space on BOTH sides (hexdump-verified) | The one row whose contract forbids a ticker breaking away from its percentage had no protection at all |
| M3 | Evidence capped at 5 while subjects were uncapped | A 7-name sector selloff printed 7 tickers over a note claiming 5 moved together — on exactly the day the row fires |
| M4 | `crumb()` never read `mintedAt` | The rate limit guarded the 401 path, not the handshake path: an unreachable host meant two 8 s calls per option request, ~32 per scan |
| M5 | `fetchOptionDetails` sent the crumb without its cookie, and had no refusal branch; the promised `applyYahooAuth` did not exist | Refused exactly like no crumb; a 401 threw and read as an illiquid contract |
| M6 | Overflow row said "with news of their own today" | Rung 1 also covers an earnings DATE and a social mention — an unsupportable claim, the exact class this addendum removes |
| M7 | Scan read `lastFailure` last-wins | Three refused tickers + one clean-but-empty fourth reported "no put meets the rules" about contracts never seen |
| m1/m2/m3 | Cashtag bypassed the floor and stoplist; bare match had no defence against an ALL-CAPS wire headline; industry matched as an unbounded substring with an unspecified tie-break | `$C 5 billion` and "KEY TAKEAWAYS FROM THE FED MEETING" became ticker mentions |
| m4/m6 | A 0.005 bid folded into "no bid"; `fetchCcQuote` collapsed 429/5xx into a silent null | The same one-message-for-every-cause defect the put half of this round removed |
| n1/n2/n4/n5/n6 | Refusal markers, `@VisibleForTesting`, loudest-movers diagnostic, ellipsis before `attribute`, consistent ordering | — |
| M11 | `YahooCrumbTest` could not fail; the grouping API had no direct tests | Rewritten; `SectorGroupTest` added at the sizes that break it. This gap is why M2 and M3 shipped |

**Fixed in `f73f242` — defects elsewhere in the PR, found only because the review covers the complete diff**

| # | Defect |
|---|---|
| M1 | `BrokerReconciliationStore.get()` stripped a segment its callers had already stripped → returned null for EVERY record, so broker execution instants silently stopped winning on the close screen |
| B2 | `ownerChangedClose` was `A?.takeIf{!x} ?: B` with `B == A` — a no-op leaving the position row and the feed event permanently disagreeing after an edit |
| B3 | …and it fired on a NO-OP save: the field is seeded with `fmtPremium(stored)` but compared against the raw Double, while `IbkrReconciler` wrote `avgClosePrice` unrounded (the commission two lines above WAS rounded) |
| M9 | `matchPartialSlice` accepted a lone candidate before the date filter with no date guard → an unrecorded September partial could claim a March round trip of the same size and move it months |
| M10 | `currentStockPriceIsLive` was never cleared on a ticker change → one symbol's live price became another's, feeding B-S and assignment-probability math |
| M8/m18 | Three Compose rows put an unweighted wrapping child before a `maxLines=1` sibling → the CC provenance label and both put rows' ratio badge could measure to 0dp and vanish |
| m8/m9/m11 | Brief detail 50/50 split; `YearMonth.now()` device zone over New-York-keyed broker data; a PERSISTED feed string using the default locale |

**NOT changed, deliberately**

- **B1 — the PR modifies `ProfitCalculator.kt` and `StrategicRiskAnalyzer.kt`** (from earlier commits,
  under the owner's Covered-Put ruling: assignment realizes $0 on the option and the premium folds into
  the effective cover price). Both files are `.claude-guard.json` P&L-locked. The reviewer's own
  recommendation was to keep the PR owner-gated rather than change anything, and PR #19 already carries
  `no-automerge` + `needs-owner`. **The newest commit touches neither file.** This needs the owner's
  written approval before merge.
- **m19 (`SectorContext.label`/`detail` now only feed a discarded BriefLine)** — left in place. They are
  the documented rung-2 renderers, `explanationLadder` is public and directly tested, and deleting them
  would remove coverage of the ladder the owner specified.
- The pre-existing `first4=${key.take(4)}` diagnostics in `AiAnalysisService` / `PortfolioNewsScreen` /
  `OptionChainParser`, and the `API_KEYS: LOAD <provider>: present=<bool> len=<n>` line, are untouched by
  this PR. No key material, account identifier or raw Flex XML appears in any device log this round; the
  `len=` metadata is worth a separate ticket, not a scope expansion here.
