# OptionsProfitTracker — S2.8 complete handoff

Date: 2026-10-01. Same branch `s2/ibkr-reconciliation-lifecycle-dashboard`, same PR #19 OPEN,
NOT merged; no push to main. This complete replacement supersedes the S2.7 current-state handoff,
not its historical evidence or outstanding backlog. Canonical detailed requirements and review/build
history: project `docs/S2_8_ACCEPTANCE.md`, `S2_8_ARCHITECTURE.md`, `S2_8_REQUEST_AUDIT.md`,
`S2_8_VALIDATION.md`, TODO, PROJECT_STATE and HANDOFF.

## Heads and acceptance

- Starting project HEAD: `4512cbfa93b0a1623d544626c56e1c8709c06083`.
- Final project HEAD: `ab168766ec636d072832057cc1237e511d58e7aa`, pushed to the same PR19 branch.
  Review20 is CLEAN and all exact-head checks passed. Latest
  clean reviewed app-code HEAD before
  the audit/export-test/docs-only commits: `a423e0d7964090f10d1ae4fcf1e3f563a604d1ef` (Review18).
- Main unchanged: `7225b7af16c183de00a9f064ead03a01ad6af1d3`.
- Local memory HEAD observed before finalization: `207b5f1e98aeb5af4bebe8b9c40dcd23fdc1dbb1`;
  remote has unrelated later work. Only the canonical helper may integrate/finalize it.
- Overall S2.8 acceptance: FAILED financial parity, not a fabricated PASS. Residual102.34 lacks
  broker evidence. Forbidden live QA is OWNER-DEFERRED, not itself a failure.
- Exact-head review/gates: normal Codex Review20 trusted-connector
  [comment5939081513](https://github.com/funzi7/OptionsProfitTracker/pull/19#issuecomment-5939081513)
  reviewed exact `ab168766ec636d072832057cc1237e511d58e7aa` CLEAN at2026-10-01T19:35:25Z.
  Build110546709904/run36915008018 passed at2026-10-01T19:39:37Z in7m21s;
  scripts110546710243 and Codex Gate110548127638 passed. All79 threads were retrieved with zero active
  unresolved non-outdated trusted Codex P1/P2; PR19 remains OPEN/unmerged.

## Financial evidence: fixed Sep 1–28 only, New York dates

Owner IBKR Orders & Trades OPTIONS MTD reference: +4741.75, Sep1–Sep28 2026 inclusive, 136 trades/fills
(not136 cycles). Prior app options +5089.43; difference +347.68. App stock −12892.78 and combined
−7803.35 are internally consistent, but there is NO matching Sep28 stock-filter broker reference.
Never claim stock parity or include Sep29/30 closes to satisfy this historical reference.

Readonly persisted input `/tmp/opt-s28-audit.cu74l9/rows.json`:332 total positions,52 closed option
rows in the fixed window;16 broker-backed and36 local-only. Actual production offline audit:
`/tmp/opt-s28-audit.cu74l9/audit-s28-review17-full.csv` (private sanitized rows not committed publicly).

```text
OFFLINE_SEP28 rows=52 brokerBacked=16 localOnly=36 rawSelected=5089.44 canonicalRows=49 selected=4844.09 brokerReference=4741.75 delta=102.34
OFFLINE_PROVEN_DUPLICATES {3571=3562, 3572=3560, 3559=3557}
```

Proven root causes:
1. Same-day importer BUY-first sorting ignored available execution instants. It inverted short
   SELL→BUY lifecycles, so direction-sensitive matching left manual + inverse imported copies.
   Evidence-backed pairs3571→3562(CWVX),3572→3560(SPCH),3559→3557(SOXL) remove245.35.
2. GLWG3606 opening rebate−.365 previously rounded to−.36; exact decimal HALF_UP gives−.37.
   That independently adds.01. Legacy arithmetic reproduces5089.43; exact raw math5089.44.
3. Canonical49 rows total4844.09. Remaining102.34 is UNRESOLVED, not attributed by guessing.
   Thus347.68=245.35−.01+102.34. Missing individual broker realized/fill identity for33 local-only
   canonical cycles prevents exact broker parity; owner explicitly confirmed no additional saved export.

Unconfirmed IDs:3529,3531,3556,3558,3563,3564,3565,3566,3567,3568,3569,3570,3573,3574,3575,3579,
3580,3581,3582,3583,3584,3586,3587,3588,3589,3590,3591,3592,3596,3598,3599,3601,3606.
Six local-vs-broker diagnostic differences already select broker truth:3572SPCH184,
3541SPCH4,3555RKLX.02,3543BTCI.01,3561SOXL.01,3571CWVX.01. These are not six extra ledger corrections.
August RKLX3514/3551 remains ambiguous and preserved, outside the Sep28 window.

## Separate later owner reference — audited with broker precision limit

The owner separately reports an OPTIONS-only 2026-09-03..2026-10-02 window: app5832 versus
broker5518 at reported whole-dollar precision, an observed314 gap; the owner reports no October gains.
The owner supplied the exact IBKR September monthly-statement total realized for equity and index
options:5634.27. Canonical full-September5832.48 differs by198.21. Per-trade broker evidence is not
available, so row-level parity is not proven.
This does NOT replace or revise the fixed Sep1–28 broker4741.75/app5089.43 reference or its347.68
gap. A fresh read-only device-derived input has334 position rows and274 broker_reconciliation records;
all three source-copy hashes were unchanged
before/after and integrity passed. Persisted option closes endSep30 with zero Oct closes observed;
the owner's “no October gains” remains reported evidence, not an assumed row transformation.

The configurable production audit test passed1/0fail/0errors/0skip/1class,
`BUILD SUCCESSFUL in 17s` (`/tmp/opt-s28-oct2-audit.log`, XML
`/tmp/opt-s28-oct2-window-xml`, CSV `/tmp/opt-s28-oct2.j7bb6j/audit-sep3-oct2.csv`). Sep3–Oct2:
57 raw rows/15 broker-backed/42 local-only, raw5969.62;54 canonical rows5724.27 after the same three
proven pairs remove245.35, with39 canonical local-only. Against reported whole-dollar broker5518,
the computed difference is206.27; this is NOT a cent-proven broker gap. Sep1 SPCH3529 local52.74
plus Sep2 MULL3540 broker55.47 total108.21 outside the window;5724.27+108.21=5832.48 is compatible
with reported app5832 but does not prove the screenshot's internal date selection. The second production
Sep1–Oct2 audit passed1/0fail/0errors/0skip/1class, `BUILD SUCCESSFUL in 3m41s` with all31 tasks
executed under `--rerun-tasks` (`/tmp/opt-s28-oct2-month-audit.log`, XML
`/tmp/opt-s28-oct2-month-xml`, CSV `/tmp/opt-s28-oct2.j7bb6j/audit-sep1-oct2.csv`):59raw/
16broker/43local,raw6077.83;56canonical5832.48,40canonical local-only,same3pairs−245.35.
Therefore5832.48−108.21=5724.27. This calendar-window evidence supports a period mismatch, but the
screen filter/cents were not supplied; report only compatibility, not an observed filter. The5634.27
source is confirmed as the separate IBKR September equity+index-options monthly statement;
5832.48−5634.27=198.21 exactly at the supplied statement precision. Do not invent per-trade evidence,
Oct2 closes, or trigger sync/provider.

The final Sep3–Oct2 decoder-guard rerun passed1test/0fail/0errors/0skip/1class,
`BUILD SUCCESSFUL in 45s` (`/tmp/opt-s28-oct2-audit-final.log`, XML
`/tmp/opt-s28-oct2-window-final-xml`, CSV
`/tmp/opt-s28-oct2.j7bb6j/audit-sep3-oct2-final.csv`) with the same57raw/54canonical/5724.27
figures. The exact-statement rerun passed1test/0fail/0errors/0skip/1class,
`BUILD SUCCESSFUL in 16s` (`/tmp/opt-s28-september-statement-exact-audit.log`, XML
`/tmp/opt-s28-september-statement-exact-xml`, CSV
`/tmp/opt-s28-oct2.j7bb6j/audit-september-statement-exact.csv`):59raw/16broker/43local,
56canonical/5832.48 and exact reference5634.27/delta198.21.

The owner confirmed the exact SOXL128 CALL exp2026-09-25 statement row has IBKR realized0. Persisted
row3586 is the matching short covered-call SELL,qty1,premium2.00,opening fee.77,closing fee0,status/
close methodEXPIRED,assigned=false,closeSep25,with no `ibkrRealizedPnl` or reconciliation record;
local money199.23=200−.77. This proves a broker-evidence/classification mismatch accounting for
nearly all of the198.21 statement gap. The counterfactual total with broker0 is5633.25, still−1.02
versus5634.27. Source tracing proves SOXL3586 carries the AutoExpire event signature. Existing
protected assigned-covered-call math already returns0; no formula correction is needed. IBKR's
official reporting reference says assigned-option premium is included in underlying P&L rather than
reported as separate option realized P&L: https://ibkrguides.com/reportingreference/reportguide/trades.htm.
Import skips already EXPIRED/EXPIRED rows before expiry-action evaluation and automatic assignment
acts only on OPEN rows. With raw broker assignment evidence absent, why assignment was not persisted
cannot be proved. No product correction was applied: no offset, device DB write, hardcoded0 or
protected assignment-formula change.

The owner also reports options-only YTD app38287.55 versus IBKR37688.74, a598.81 gap, but supplied no
exact cutoff. The saved snapshot's latest close isSep30. The bounded2026-01-01..2026-10-02 production
audit passed1test/0fail/0errors/0skip/1class, `BUILD SUCCESSFUL in 17s` (`/tmp/opt-s28-ytd-audit.log`,
XML `/tmp/opt-s28-ytd-xml`, CSV `/tmp/opt-s28-oct2.j7bb6j/audit-ytd.csv`):280raw rows/
232broker/48local totaling38532.90;277canonical/232broker/45local totaling38287.55 after the same
three pairs remove245.35; delta598.81 to the supplied reference. The chosen Oct2 bound follows the
owner's latest rolling cutoff, not a supplied exact YTD cutoff. Treat this as a bounded snapshot
diagnostic, not proof of the owner's filter. A counterfactual SOXL0 would reduce the reported gap to
399.58; this counterfactual is not subset attribution and no result is forced or corrected. The YTD
canonical total comprises232 broker-backed rows33680.02 plus45 local-only rows4607.53; Jan–Aug has
221canonical/32455.07 and September56canonical/5832.48. Five older local rows are documented genuine
partial-close slices, not duplicates: BTCI PUT33 ids12/208 total128.43, IRE PUT6 ids3534/3538
total108.43, and SPCH CALL10 id3537 65.68, together302.54. All lack external broker reconciliation
identity and authoritative broker amounts; no row-level attribution or correction is supportable.

No ticker offset, September constant, aggregate plug, invented trade/export or manual DB repair.
`RealizedLedger.selectedRealized` remains the one authority selection rule. A unique broker cycle
wins; local-only money is exact; proven duplicates are removed only from canonical financial input,
not deleted from raw Room history. Selection is global before date filtering. Reopened genuine cycles
remain distinct; ambiguous contract/class/lifecycle evidence fails closed. Old multiplier-free
fingerprints can prove only standard100 rows, never adjusted contracts. Zero-crossing fills allocate
commission but do not carry closing broker realized into their new opening side. Close-only orphans
need exact class/execution/broker money; zero close price does not erase broker authority.
Protected assignment/Covered Put/B-S/risk/capital formulas were not changed.

## WDCX and restored manual BTC workflow

WDCX short PUT14 expiry2026-10-16,3×100,.95 opening/.65 close, opening rebate−1.46,closing−1.47:
285−195−(−1.46)−(−1.47)=92.93. Displaying32% must never produce94.13.
The saved WDCX3598 ledger already selected92.93; rounded-percent preview was a separate defect,
not proof of the entire September gap. `ExactCloseMoney` makes price authoritative and percent derived,
uses signed decimal fees once, multiplier once, proportional partial fee allocation with cent conservation.
Broker reconciliation/seeded edit invalidation and factual weighted fill precision remain protected.

The owner later reported both MULL/RKLX CC targets missing and inability to enter BTC price, and
explicitly instructed “return to what worked before.”
**SUPERSEDED — owner approved:** metadata refusal disabling/clearing MANUAL BTC calculator controls.
Restored Add/Edit and Close price/percentage editing, preset chips, live calculation, saved-target
card display. `OwnerBtcCalculator` is manual-only: keep typed text/price, derive money/percent from
that price; known percentage targets use directional legal quantization, unknown proof retains the
previous two-decimal calculator value with an explicit warning. Known off-tick typed input warns,
not silently rewrites. Unproved values are NOT labelled legal/executable automatic recommendations.
Automatic PUT/model/B-S recommendations remain strict. Saved target intent survives unrelated edits
in full precision; owner edits save the resulting price-derived effective percent, not rounded display.

Proven regression paths: price field was disabled without metadata; changing percentage cleared old
persisted intent and strict refusal could saveNULL; blur could clear manual price. Edit-load now restores
saved intent's calculator preview but does not silently resave a different effective percentage.

Fresh readonly DB evidence: MULL3585 OPEN CC target50.0; RKLX3611 OPEN CC target42.8571428571429.
The earlier `/tmp/opt-s28-btc.D3iFlu` RKLX targetNULL observation is historical, not current.
Do not infer which owner action produced the current target; this work made no device DB write/repair,
and the persistence evidence is not a physical UI PASS.
No broker order was deleted/changed by this work; no broker order inspection was performed.


## Later owner Add/Edit and B-S restoration

The owner explicitly required the previous Add/Edit form and B-S Fill behavior, not a redesign.
**SUPERSEDED — owner approved:** disabling B-S Fill on missing tick metadata, the added legal-price/arrow
row, and the changed English effective-percent summary. The compact original B-S line/Fill placement,
Hebrew summary and original BTC/currency fields are restored; English/numeric values remain atomic LTR.
`OwnerBsPremiumFill` uses the displayed model value as input only on explicit owner action. Current proven
ticks still quantize directionally; absent proof permits a warned two-decimal calculator value, not an
asserted executable limit. Automatic fills/recommendations stay strict. Invalid/tiny values preserve
entered premium and do not trigger a hidden quote refresh. Existing OPEN historical premium is protected.
Ordinary form edits retain saved/typed BTC intent while invalidating old contract proof; chain/OCR
replacement still clears old suggestions. Manual second-leg premium is retained on strike editing.
Manual BTC-price plans keep their editable percentage in step when opening premium/B-S changes.
Percent-entered and untouched saved intentions remain distinct. Duplicate status banners were removed;
B-S action feedback is separate warning text, not a green success banner. B-S/risk formulas unchanged.
The owner requested English communication; the app locale was not globally translated.

Eighth review5380978416 on0f41b37b54fdc42ab87a60d2cbf793d1ca6b9831 added three valid P2s:
watchlist explicit regular-quote force, manual IV force through every completed cache, and the headline
TTL claimed before a credential exists. Corrections preserve in-flight coalescing and automatic TTL.
A one-shot watchlist pull generation cannot force subsequent ordinary universe changes. Shared IV
result carries Massive attempt evidence (including null) through outer joins to avoid duplicate
fallback/prefetch work. Headline credentials precede an independent token-safe TTL, with atomic
benchmark/headline snapshot merges. Only fake/spied requests were used.

## Tick architecture and proof limits

Primary Cboe Rule5.4, OCC listing plan, Cboe C2020022000 schema and C2024030101 static-URL notice are
linked in project architecture. `OptionTickProofService` uses existing official daily symbol-reference
CSV files(cone/opt/ctwo/exo), actual option-series root, current NY-day positive Tick Type.
Recognized “Pennies to 3.00”=.01 below3/.05 at or above3; “Pennies All”=.01 throughout.
Generic positively proved non-penny .05/.10 policy is tested but NOT inferred from absence in a penny
file. No source proves a larger .50 class here; unknown remains unknown. No paid key or unstable scraper.
Yahoo contract quote fields/existing optionability listing alone cannot prove exact MPV; no inference
from leverage/ticker length/quote multiples. Conflicting, absent or stale proof refuses automatic price.

BUY debit rounds DOWN; SELL credit UP. Optimizer outcome is re-evaluated at the legal barrier.
Effective percent and dollars use the resulting price. Historical weighted average fills are facts
and NEVER quantized. Add routes bind proof to contract/expiry and invalidate on edits; async live
underlying survives stale autofill. Held Room positions lack exact series/root identity: a Yahoo
ticker/strike/right/expiry match cannot prove adjusted-vs-standard holding. Automatic Close recommendations
remain unproven until that separate data gap is solved; manual calculator remains usable per owner override.

## Dedicated PUT page and one scan owner

**SUPERSEDED — owner approved:** combined High-IV + PUT full page/card. Reason: separate tools.
`HighIvScreen` is IV-only:tracked IV/status/IV refresh/add-position navigation. IV refresh does not scanPUT.
Dedicated `PutOpportunitiesScreen`:“פוטים לפי פרמיה / בטחונות”; moved full content, not duplicated.
One canonical PutScanResult/cache/rejection model/scoring pool; tracked/discovered strict±2x/±3x provenance,
exact IV,DTE,premium/collateral,B/E,OTM,profit probability,BTC,liquidity,CSP prefill retained. The
page move kept one ranking engine/formula; later Review16 separately corrected the proven tied-min
percentile defect without redesigning the page or changing thresholds/70–30 weighting.
Adjacent dashboard IV/PUT cards are distinct; discovered leveraged card separate.
IV see-all→HighIV;PUT/discovery see-all→PUT page. Dashboard reads only and never starts a hidden scan.

PUT page entry starts one first current-NY-day scan only when no attempt exists; same-day cached results
never auto-TTL-rescan. Explicit “סרוק הזדמנויות” forces one new scan; in-flight coalescing/disabled button
prevent double execution. Cancellation releases eligibility; completed failure is attempted with specific
reason; completed empty reports rejection reason. Forced refresh keeps old rows until atomic replacement.
Closed/pre-market state makes zero chain requests and leaves later regular-session first-entry eligible.
NY rollover resets eligibility. “טרם נסרק” is only truly unattempted current-day state.
Tests count first entry1,same-dayreentry0extra,force1,doubletap1,cancelretry,closed0chains,rollover,
failure/empty/cached-row retention; Top3/full page share canonical scored objects.

UI “ריבית פתוחה” replaced by “חוזים פתוחים (OI)”/compactOI. Thresholds unchanged:
OI≥100,contractdailyvolume≥10,spread≤25%,relevantPUTtickervolume≥100,realbid,missingliquidityexcluded.
English/numeric/date/money runs use shared LtrText/LTR scope,single-line values; market-brief mixed prose
uses measured numeric inline children, preserving source text/whitespace and allowing prose wrapping.

## Request fan-out and coalescing

Starting source proves FOUR reachable owners:Dashboard first composition direct trigger,ON_RESUME
direct trigger,refreshOnResume's equivalent quote batch,and ViewModel-init batch. Init universe may be
a subset, so do NOT claim every batch equivalent or exactlythree billed passes on owner's later run.
Prior S2.3 physical log in PHONE_BUILD recorded28 Yahoo requests for7tickers fromfourowners; historical,
not a new quota-consuming reproduction. IV fallback could fetch Massive then prefetch the same chain again.

Both direct screen triggers removed; named resume owner retained. Process registry keys refreshkind+
normalized relevant universe(and semantic contract/selection inputs),singleflight shared across recreatedVMs.
Quote/dashboard3min,IV/Massive5min successful freshness,max128completedkeys;empty/failure/cancelnotfresh.
Different kinds/universes remain independent,no global task mutex/UI-delay workaround.
Explicit owner force bypasses both completed outer/leaf caches but joins equal in-flight work.
Massive identity uses credential fingerprint,never secret logs. Add/Close/watchlist contract/all-expiry paths
share appropriate leaves. What-if attempt owner-token cancellation cannot strand claimed-empty cache or
erase a newer claim. Finnhub news/industry now resolve a nonblank key BEFORE atomic TTL/batch claims;
blank/unreadable keys consume no TTL,dayrollover clears stale news independently. Fakes/counters only.
No live claim that monthly provider billing was physically re-measured.

## Complete-PR review fixes

The first fourteen normal Codex reviews produced34 valid findings; all34 are fixed in pushed
`96d65d41d8a65db7d7e2a13ec9c4b082c01a7b42`. Review15 found two additional valid issues, for36
valid findings across15 reviews; both are fixed and resolved in final pushed HEAD `dcc00e2fc128b14e1cdf32ad2833c58b74e4340c`.
Review13 correction source is committed after the historical validation below. Its
[finding4158111738](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158111738)
was resolved with [reply4158493929](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158493929).
Full-PR Review14 `5383172022` reviewed exact `e99100de52ce00ed73d3e09457390d3abc218175`
and found three valid issues:
[already-evidenced partial fee repairs](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158547817),
[execution-bound canonical associations](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158547823), and
[atomic What-if values](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158547831).
All three are fixed and their discussions resolved by replies
[4158702367](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158702367),
[4158702528](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158702528), and
[4158702703](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158702703).
Full-PR Review15 `5383450464` reviewed exact
`96d65d41d8a65db7d7e2a13ec9c4b082c01a7b42` at2026-10-01T18:06:55Z and found two valid issues:
[a non-null empty chain page hid a provider failure from discovery status](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158773255)
and [the covered-call quote contract suffix could wrap separately](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158773262).
Provider failure is now classified independently of page nullability; `CHAIN_INCOMPLETE` remains sticky
after a later clean/usable page, while a clean page missing only underlying price remains a normal skip.
The covered-call reminder renders contract suffix, ticker, share count, quote price and daily percentage
as atomic LTR runs without changing the owner Add/Edit form.
DashboardViewModel and DashboardScreen corrections were implemented with two added tests
(one chain-failure/sticky-state test covering every failure enum plus usable/clean cases, and one
atomic covered-call display test). Focused validation passed316 tests/0 failures/0 errors/0 skipped/
28 classes, `BUILD SUCCESSFUL in 1m40s` (`/tmp/opt-s28-review15-focused.log`, XML
`/tmp/opt-s28-review15-focused-xml`); scripts passed76/76 all zero
(`/tmp/opt-s28-review15-scripts.log`). Full REAL JVM validation passed1744 tests/0 failures/0 errors/
1 existing stock-fixture skip/112 classes (1743 executed), `BUILD SUCCESSFUL in 19s`
(`/tmp/opt-s28-review15-full.log`, XML `/tmp/opt-s28-review15-full-xml`). The actual audit ran to
`/tmp/opt-s28-audit.cu74l9/audit-s28-review15-full.csv` and remained49 canonical rows/4844.09,
residual102.34 and the same three proven pairs. All36 valid findings are fixed in pushed source;
Review15 discussions were resolved by replies
[4158871216](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158871216) and
[4158871390](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158871390).
Compile passed `BUILD SUCCESSFUL in 8s` with zero real `^e: ` lines
(`/tmp/opt-s28-review15-compile.log`); `git diff --check`, protected SDK file and private hashes are
unchanged. Review15 `assembleDebug` passed in42s, 41 tasks (3 executed,38 up-to-date), zero real
compiler errors (`/tmp/opt-s28-review15-apk.log`). APK1.0.0/code1 is65,951,267bytes, SHA-256
`9006b09d5a095f5a602f239618ad1f3ef69164119dad860011d5f6e168e03999`; signer unchanged,
`install -r` Success, canonical Download delivery hash matches, and the app was NOT launched.
The Review14 evidence below remains historical. Full-PR Review16 `5383656245` reviewed exact
`dcc00e2fc128b14e1cdf32ad2833c58b74e4340c` at2026-10-01T18:23:46Z and found two valid issues:
[long PUT exit-metric LTR text can clip](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158937105)
and [tied minimum values inflate the percentile](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158937113).
Total valid findings are38 across16 reviews; all38 are fixed in final pushed source. Corrections are
limited to the PUT opportunity display/tests and score/tests. PUT exit,
contract/expiry/DTE, IV/premium/collateral, liquidity and risk metrics now flow as atomic display runs;
two static display tests and four score tests were added. Review16 focused validation over the same10
glob selectors passed322/0 failures/0 errors/0 skipped/29 classes, `BUILD SUCCESSFUL in 1m17s`
(`/tmp/opt-s28-review16-focused.log`, XML `/tmp/opt-s28-review16-focused-xml`). Full REAL clean-test/
test passed1750/0 failures/0 errors/1 existing stock-fixture skip/113 classes (1749 executed),
`BUILD SUCCESSFUL in 19s` (`/tmp/opt-s28-review16-full.log`, XML
`/tmp/opt-s28-review16-full-xml`). The actual audit ran to
`/tmp/opt-s28-audit.cu74l9/audit-s28-review16-full.csv` and remained49rows/4844.09/residual102.34/
same3pairs. Scripts passed76/76 with all other counters zero in661.153594ms
(`/tmp/opt-s28-review16-scripts.log`). Compile passed `BUILD SUCCESSFUL in 7s`,16 tasks up-to-date,
zero real `^e: ` lines (`/tmp/opt-s28-review16-compile.log`). `assembleDebug` passed
`BUILD SUCCESSFUL in 33s`,41 tasks (3 executed,38 up-to-date),zero real `^e: ` lines
(`/tmp/opt-s28-review16-apk.log`). APK1.0.0/code1 is65,957,101bytes,SHA-256
`d15255a9edfa201be39d0fd06a871e111e0b97075710b204b2eefad6327951f0`; signer unchanged
`9e5307e1344917f0cdc495c5cc04a80d23a92c5965c779b6efb0faa1135b8221`. Existing host ADB
PID26045/TracerPid0/device were reverified; `install -r` returned Success, the exact required Download
filename has matching remote hash, and the app was NOT launched. The
approved scoring contract remains owner-best100/owner-worst0/equal ties, with
`(count <= value - minCount) / (N - minCount) * 100`, in-pool all-equal neutral50, outside-pool0/100,
and unchanged70/30 weighting,risk/eligibility,unique-min outputs and intermediate multiplicity. This
is not a page-move redesign.
Review15 metrics/artifact are now historical. Review16 fixes are pushed at
`121c31ec124d20ab7f1fa848d1c5f88b2ae6d219`; both discussions are resolved by replies
[4159080144](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4159080144) and
[4159080395](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4159080395).
Full-PR Review17 `5383925734` reviewed that exact HEAD at2026-10-01T18:43:44Z and found two valid P2s:
[all-source tick metadata failure could claim the day](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4159147837)
and [a stale contract-only canonical-association write lacked expected-row CAS protection](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4159147857).
Total valid findings are40 across17 reviews; all40 are fixed in final pushed source. Corrections are
limited to the tick and canonical-CAS lanes. Tick daily cache now requires at
least one valid source; all-source failure gets only a5-minute monotonic completion cooldown, with no
daily cap or autonomous loop and the existing mutex/singleflight preserved. Three tests were added and
the day-cache test strengthened. Canonical `completeRecord` CAS now runs under `PROCESS_WRITE_LOCK`
with one durable-key commit; caller CAS failure returns raw rows instead of hiding them behind a stale
association. Prior Review14 `mergeForWrite` behavior is unchanged. Two tests were added and source
wiring strengthened. Owner forms are unchanged. Review17 focused validation over12 selectors
(`OptionTick`, `BrokerReconciliationStore`, `PersistedLifecycleDedup`, `ExpectedImportReconciliation`,
`CanonicalRealizedReads`, `ExactCloseMoney`, `PutScanLifecycle`, `PutPageOwnership`, `Provider`,
`Owner`, `BtcProfitIntentPersistence`, `CloseOwnerBtcCalculator`) passed168/0fail/0errors/0skip/
22classes, `BUILD SUCCESSFUL in 1m25s` (`/tmp/opt-s28-review17-focused.log`, XML
`/tmp/opt-s28-review17-focused-xml`). Scripts passed76/76 with all other counters zero in775.489062ms
(`/tmp/opt-s28-review17-scripts.log`). Full REAL passed1755/0fail/0errors/1existing stock-fixture
skip/113classes (1754executed), `BUILD SUCCESSFUL in 20s` (`/tmp/opt-s28-review17-full.log`, XML
`/tmp/opt-s28-review17-full-xml`). Actual audit `/tmp/opt-s28-audit.cu74l9/audit-s28-review17-full.csv`
ran and remained49rows/4844.09/residual102.34/same3pairs. Compile passed `BUILD SUCCESSFUL in 8s`,
16tasks up-to-date and zero real `^e: ` lines (`/tmp/opt-s28-review17-compile.log`). `assembleDebug`
passed `BUILD SUCCESSFUL in 30s`,41tasks(3executed,38up-to-date),zero real `^e: ` lines
(`/tmp/opt-s28-review17-apk.log`). APK1.0.0/code1 is65,957,101bytes,SHA-256
`8516baee7565b13062e4af9cb875f8a406cd02ebb4c33ba622b074aa0142c055`; signer unchanged.
Host ADB PID26045/TracerPid0 was reverified; install-r Success, required Download path/hash matches,
and the app was NOT launched. Prior-head Build job110523828404 and scripts job110523826075 passed,
but Review17 itself was not clean until these fixes. Review16 validation/APK are historical. Review17
fixes are pushed at `a423e0d7964090f10d1ae4fcf1e3f563a604d1ef`; both discussions are resolved by replies
[4159252509](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4159252509) and
[4159252758](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4159252758).
Full-PR Review18 returned CLEAN on that exact HEAD through trusted connector
[comment5938443878](https://github.com/funzi7/OptionsProfitTracker/pull/19#issuecomment-5938443878)
at2026-10-01T18:58:56Z. Exact-head checks passed: Build110530770563,
scripts110530772918 and Codex110533114324. The later owner Sep3–Oct2/September-statement/YTD evidence
adds only configurable offline audit-test/docs changes, pushed at
`9a24944301bbe851190e7e0f41b786c9125e30da`; this invalidates Review18 for the final candidate.
Replacement validation/artifact are recorded above. Review19 `5384440605` reviewed exact
`9a24944301bbe851190e7e0f41b786c9125e30da` and found one valid P2,
[4159580179](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4159580179):
the documented exporter omitted `brokerContractId`/`canonicalPositionId` even though the audit consumed
them. The exporter now keeps those two whitelisted identity fields, preserves missing legacy values as
null and excludes secrets/arbitrary preferences. Three real-script integration tests cover large integer
identity precision, legacy/privacy behavior and byte-identical source files. The fix is pushed at
`ab168766ec636d072832057cc1237e511d58e7aa`; total valid findings are41 across19 reviews. Review20
request [5939035896](https://github.com/funzi7/OptionsProfitTracker/pull/19#issuecomment-5939035896)
was posted at2026-10-01T19:32:27Z. Review19 was resolved by reply4159626501. Review20 reviewed exact
`ab168766ec636d072832057cc1237e511d58e7aa` CLEAN through trusted connector
[comment5939081513](https://github.com/funzi7/OptionsProfitTracker/pull/19#issuecomment-5939081513)
at2026-10-01T19:35:25Z: “Didn’t find any major issues.” Codex Gate110548127638 and
scripts110546710243 passed. Build110546709904/run36915008018 completed PASS at
2026-10-01T19:39:37Z in7m21s. No new finding; the
total stays41 valid findings across20 reviews. GraphQL retrieved all79 review threads
(hasNextPage=false): zero active unresolved non-outdated trusted Codex P1/P2. PR19 remains OPEN,
mergedAt null, at exact `ab168766ec636d072832057cc1237e511d58e7aa`.
Historical review IDs:
5378718431(forcefreshness),5378897472(liveunderlying+IVLTR),5379037142(What-ifcancel,nudgefallback,BTCLTR),
5379208861(fourAdd/CloseLTR),5379520230(partialclass,stockserialization,numericbrief),
5379854928(workerresurrection,cashwindow,keyTTL,stockpostcommit),
5380627549(sharedfeedLTR,closesourcebrokerLTR),5380978416(watchlistforce,IVleaf force,headlineclaim),
5381662557(PUTemptyLTR,legacycount;scriptselectorportability),5381938342(PUTcoverageLTR),5382112411(expectededit,cashlock,watchlisttargets),
5382407146(workerexpectedrow,historicaleventdate),5382642371(manualimportordering),
5383172022(partialrepair,executionlink,atomicWhat-if).
Shared display-only activity renderer now isolates stored ticker/numeric/English runs without DB
rewrites; close provenance uses separate Hebrew and LtrText broker children. No money/time changes.
The nudge fix tests the real shell block with fakecurl, preserving token fallback; no PR20 rollout.

Sixth-review fixes:worker uses transaction re-read/OPENqtyfeeversion CAS;slice+feed+remainder atomic;guarded
postcommit pair-evidence commit with process lock and cancellation shield. Room/prefs are NOT one store;
process death can leave missing identity,failclosed,notselfhealing.
Stock ledger commit and display publication share noncancellable owned boundary;one immediate readback/
retry on projection failure. Permanent failure retains durable broker evidence/reports failure;notfakePASS.
Full cash resync merges movements without wiping outside a narrower window;ambiguous cash key history
is not permission to clear durable data.
Prior clean4512 and every earlier S2.8 head do NOT validate finalHEAD. Review provider is normal Codex,
not self-authored fallback. Canonical Claude fallback workflow absent in branch/trustedmain(404);
PR20separateOPEN. If Codex becomes unavailable this is a process blocker,not permission to forge evidence.
Owner-approved Codex Gate re-enabled(workflow350803614active).


Ninth review5381662557 on c198b692f0c68bf9a93d03e682364f9abe1c2412 found two valid issues:
PUT empty-state numeric/English runs now reuse the shared atomic LTR renderer (including LRI/FSI
spans), preserving all rejection wording. Legacy partial-event rehome now keeps the stored description
when complete parent/order proof is absent; it cannot claim an earlier pre-close count from the final
open remainder, sum reopened cycles or invent evidence. Candidate identity, timestamps and money are
unchanged. Five history and four display regressions cover the correction. The review also claimed
the script directory command universally failed; actual pinned Node20 local/CI runs passed76/76.
Explicit *.test.js selection nevertheless hardens portability with identical76-test coverage.

## Validation and APK

Final exporter-fix HEAD validation: `python3 -B -m unittest -v
scripts/test_export_option_audit.py` passed3tests/0failures/0errors in0.626s
(`/tmp/opt-s28-review19-python-tests.log`). The real documented export is semantically identical to
the prior private input after normalizing absent versus explicit-null legacy keys:334positions/
274records, no financial-field change. Its Jan1–Oct2 production audit passed1test/0fail/0errors/
0skip/1class, `BUILD SUCCESSFUL in 18s` (`/tmp/opt-s28-review19-exporter-audit.log`, XML
`/tmp/opt-s28-review19-exporter-xml`, CSV
`/tmp/opt-s28-oct2.j7bb6j/audit-ytd-exporter.csv`), unchanged277canonical/38287.55/
232broker/45local/delta598.81. Final combined clean-test/test/compile/assemble passed
**1755tests / 0failures / 0errors / 1existing skip / 113classes** (1754executed),
**`BUILD SUCCESSFUL in 24s`**,51tasks(2executed,49up-to-date),zero real `^e: ` errors
(`/tmp/opt-s28-review19-full-compile-apk.log`, XML `/tmp/opt-s28-review19-full-xml`). Fixed Sep28
audit `/tmp/opt-s28-audit.cu74l9/audit-s28-review19-full.csv` remains49canonical/4844.09/
residual102.34. Scripts passed76/76/all other counters zero in1077.549062ms
(`/tmp/opt-s28-review19-scripts.log`); diff-check clean. App source/package did not change, so the
verified artifact remains APK SHA-256 `7496e04146048a2bec495eb0c8719333544839825152f979a715d1aca353f3ca`,
already installed/delivered with unchanged signer; no redundant launch.

Prior post-Review18 operator-test/docs candidate validation (historical after exporter fix; production
app source unchanged):
full REAL JVM passed **1755 tests / 0 failures / 0 errors / 1 existing skip / 113 classes**
(1754executed), **`BUILD SUCCESSFUL in 36s`** (`/tmp/opt-s28-owner-window-full.log`, XML
`/tmp/opt-s28-owner-window-full-xml`). The original fixed Sep28 audit actually ran to
`/tmp/opt-s28-audit.cu74l9/audit-s28-owner-window-full.csv`, unchanged49canonical/4844.09/
residual102.34/same3pairs. Scripts passed76/76, all other counters zero in2499.321093ms
(`/tmp/opt-s28-owner-window-scripts.log`). Compile passed **`BUILD SUCCESSFUL in 11s`**,16tasks
up-to-date and zero real `^e: ` lines (`/tmp/opt-s28-owner-window-compile.log`); diff-check clean.
`assembleDebug` passed **`BUILD SUCCESSFUL in 33s`**,41tasks(4executed,37up-to-date),zero real
compiler errors (`/tmp/opt-s28-owner-window-apk.log`). APK1.0.0/code1 is **65,956,886 bytes**,
SHA-256 `7496e04146048a2bec495eb0c8719333544839825152f979a715d1aca353f3ca`; original signer SHA-256
`9e5307e1344917f0cdc495c5cc04a80d23a92c5965c779b6efb0faa1135b8221`/SHA-1 unchanged. Existing
host ADB server/phone were reverified with TracerPid0; `adb install -r` returned Performing Streamed
Install/Success, required Download delivery hash matches, and the app was NOT launched.

All heavy work via JDK21 + `/root/work/bin/heavy-run -- ./gradlew`; no concurrent heavy builds.
The Review13 metrics below are historical after Review14 source changes, not final evidence for the
current source. Review14 focused validation passed **268 tests / 0 failures / 0 errors / 0 skipped /
25 classes**, **`BUILD SUCCESSFUL in 1m 42s`** (`/tmp/opt-s28-review14-focused.log`, XML
`/tmp/opt-s28-review14-focused-xml`). Scripts passed **76/76**, zero failures/cancelled/skipped/todo
(`/tmp/opt-s28-review14-scripts.log`). Full REAL JVM passed **1742 tests / 0 failures / 0 errors /
1 existing skip / 112 classes** (1741 executed), **`BUILD SUCCESSFUL in 15s`**
(`/tmp/opt-s28-review14-full.log`, XML `/tmp/opt-s28-review14-full-xml`). The actual persisted audit ran
to `/tmp/opt-s28-audit.cu74l9/audit-s28-review14-full.csv` and remains49 canonical rows/4844.09
against4741.75, residual102.34 with the same three pairs. Compile passed **`BUILD SUCCESSFUL in 8s`**,
zero real `^e: ` lines (`/tmp/opt-s28-review14-compile.log`); `git diff --check` is clean.
Review14 `assembleDebug --stacktrace` passed in **37s**, 41 tasks (3 executed,38 up-to-date), zero
real `^e: ` lines (`/tmp/opt-s28-review14-apk.log`). APK1.0.0/code1 is **65,950,883 bytes**,
SHA-256 `031d7fe16c7ce811307d8e591b54c8da4d4eb6201daa1981718af8bfb863e4fd`; signer is unchanged.
`adb install -r` returned Success and the canonical Download delivery matches that hash; NO launch.
- The first Review13 focused run failed at KSP with
  `ImportViewModel.kt:1964:34 Expecting ')'`: two new expression-body `Record` constructors ended
  `}` instead of `)`. Both tokens were corrected. This repository patch error was not PASS and was
  not an environment/toolchain limitation; `/tmp/opt-s28-review13-focused.log`.
- The corrected pre-pre-insert source then passed focused217/20classes in2m25s and full
  1735/111classes in17s. Those Review13 runs remain valid historical evidence but are superseded
  because the later initial-insert race fix changed source.
- The first post-pre-insert focused219 run compiled but had1 fixture failure: otherwise-identical rows
  inherited different `createdAt = now()` values. The fixture now seeds `createdAt` and `updatedAt`
  from the fixed snapshot clock; no production guard was loosened. This run is not PASS;
  `/tmp/opt-s28-review13-focused-final.log`.
- Final Review13 focused retry:219tests,0fail,0errors,0skip,20classes;BUILD SUCCESSFUL26s.
  `/tmp/opt-s28-review13-focused-final-retry.log`,
  XML`/tmp/opt-s28-review13-focused-final-xml`.
- Full REAL `:app:cleanTestDebugUnitTest :app:testDebugUnitTest --stacktrace`:
  1737tests,0fail,0errors,1existing skip,111classes(1736executed),BUILD SUCCESSFUL18s.
  `/tmp/opt-s28-review13-full-final.log`,XML`/tmp/opt-s28-review13-full-final-xml`.
  Existing skipped OrdersTradesReferenceTest lacks its older stock fixture; actual S2.8 audit ran,
  output `/tmp/opt-s28-audit.cu74l9/audit-s28-review13-full-final.csv`, and remains canonical49rows/
  selected4844.09 against4741.75, residual102.34.
- Scripts `node --test .github/scripts/health/__tests__/*.test.js`:76/76,0fail/cancel/skip/todo;
  `/tmp/opt-s28-review13-scripts.log`.
- Earlier actual production DAO-SQL SQLite in-memory integration checks:6pass,0fail.
- Compile `:app:compileDebugKotlin --stacktrace`:BUILD SUCCESSFUL9s,zero real^e:errors;
  `/tmp/opt-s28-review13-compile-final.log`.
- `git diff --check` clean; Review13/14 source is committed in the final pushed HEAD and local.properties
  deliberately remains dirty/excluded.
- Historical Review13 `assembleDebug --stacktrace`:BUILD SUCCESSFUL31s;
  `/tmp/opt-s28-review13-apk-final.log`.
- Historical Review13 APK1.0.0/code1,64,913,657bytes;SHA256
  `cdf26ed60efaa139b474763a7c7066e2270aa5ff1fb9bcbbba9b0131b5c67389`.
- Unchanged signerSHA256`9e5307e1344917f0cdc495c5cc04a80d23a92c5965c779b6efb0faa1135b8221`;
  SHA1`5d3d855c6c6c397f817df2bd0c62f16f940b1551`.
- Existing Termux-host ADB serverPID26045,TracerPid0;clientremote5037.
  `adb install -r` returned “Performing Streamed Install”/“Success”. NOlaunch.
  Delivered `/sdcard/Download/OptionsProfitTracker/OptionsProfitTracker-1.0.0.apk`,matchingSHA.
  This Review13 artifact is superseded by the Review14 artifact recorded above.
- The pre-insert intermediate clean build completed in3m54s/all42tasks with SHA256
  `efb59af8a1a4288182a7ef22a6677eb72e113384c22d6dc150e39138fbd81fc6`; it is superseded and was
  not installed or delivered. The prior Review12 APK SHA256`b4c0dc34496fa6b52ad990dcd632a949d70fc57b9b4734716cab434f6223719a`
  is historical and superseded too.
- Earlier sixth-review focused compilation missingassertSame import fixed. Next251run had2 testassertion failures
  because coroutine stacktrace recovery copies exceptions; causal-original/suppressed assertions corrected.
  Neither failedrun reportedPASS; repository tests,nottoolchain failure.
  Eighth focus initially failed on a public/internal session-type mismatch; fixed and retested.
  Initial full1691 run had one obsolete short-only UI expectation, updated for the owner's explicit
  old-layout restoration with actual-side math assertions. The eighth full1691 retry passed and was
  superseded by Review12 full1720, then intermediate Review13 full1735, and now final Review13
  full1737. Earlier rounds remain
  in project validation; fifth1610/88/APK0b864 is historical rather than current evidence.

PhysicalQA ACTUALLY performed:readonly DB/WAL+reconciliation snapshot,matchingbeforeafterhashes,
integrity checks,installedsignerread,hostADB isolationcheck,install-r,and Download delivery.
NOTperformed:app launch,BTCscreenvisual/runtime,PUTscan,IV/price/watchlist/news/chain/providerrefresh,
IBKR/Flex/import/full/samesnapshotsync,manualdeviceDBwrite,settingsmutation,uninstall,pmclear.
All network-capable physical paths remain OWNER-DEFERRED to protect quota. Install/testsuccess
does not prove physicalscreenPASS. No ADB start/kill/pair fromPRoot; host lifecycle remainsownerTermuxonly.

## Finalization and retained work

Owner approved preserving/excluding local.properties SDK path;SHA256
`6b69bdfea7b7919bfabc67510e1451ea0b783c57d450b9fbc17c19616e5b751e`.
Unrelatedmemoryprivate-media-tv/cc-latest.mdmustremainoutsideOPTcommit.
Approved minimalhelperfix replacesrebase with ff-onlyremoteintegration,refusesdivergence/dirtyoverlap65,
keepsglobalflock/project-onlycommit--only. Syntaxcheck and isolatedbarefixtures3casespassed
(`/tmp/opt-s28-finalizer.6VvxTY`). HelperSHA256
`a5d7a0dd4928d613d0ddfd822a4c283ef3d3c7a30d8fa4d3403b9b7ef24dfc7f`.
Finalize ONLY with:
`AGENT_MEMORY_PROJECT=options-profit-tracker /root/work/bin/agent-memory-finalize "<factual handoff>"`.
No direct memory state-changing Git;no reset/clean/restore/stash/rewrite/forcepush/alternateworktree.

Retained backlog (not silently closed):
- Sep28 residual102.34/33localcycles; owner has noexport. No new sync authorized.
- Separate Sep3–Oct2 residual206.27/39local canonical cycles remains non-cent-proven because the5518
  reference lacks cents/per-cycle rows. Exact September statement residual198.21 includes confirmed
  SOXL3586 broker0 versus local199.23 classification/evidence mismatch; its missing raw assignment
  evidence blocks an automatic repair and the counterfactual still leaves−1.02.
- YTD reported gap598.81 spans45local-only canonical rows and no exact owner cutoff was supplied.
  Five older genuine partial-close slices totaling302.54 lack external broker identities/amounts;
  subset arithmetic is not attribution.
- Fresh readonly MULL3585 target50.0 and RKLX3611 target42.8571428571429; earlier RKLXNULL snapshot
  is historical. No inferred owner action,manual DB repair or physical UI PASS.
- Heldexactseriesidentity andpositivenonpenny/largertickmetadata gaps forautomatic recommendations.
- OPT→TradingTracker one-waylifecyclebridge/durableoutbox/ACK/retry contract SPEC_ONLY,including factualROLL.
- ConditionalChatGPTdailyreport belongsTradingTracker/relay,SPEC_ONLY;no credentialsinAPK.
- Phase3personalhistoricalBTCexit learning notimplemented/trained.
- Historicalstockledgercoveragepartial (prior measured2025-11-21 onward);notcompleteTradeStation+IBKRlifetime.
- SOFIhistoricalattribution remains,neveroffset.
- FlexibOrderIDmissing:grain/spread/orderidentity ambiguityguardsremain.
- PR20automation-core/fallbackrollout OPEN,separate,notmerged;issues:write stillunproven.
- MIGRATION30_31 registered1of17builders;outofscopepreserved hazard,no migrationsdeleted.
- Journalexpireddatecoverage,historicalsnapshotnullclosesemantics,existingbidi/NBSPdebt.
- S2.7import-only Sep1–18/IBKRhistorical/SOFIsubtotal diagnostics owner-deferred;do not reopenaspermissiontosync.
- Existing physical acceptedPUT/0DTE/broadindexbrief visual cases notclaimedpassedthisround.

All six-part requirements plus later approvals/overrides are reconciled into canonical project docs
and these memory files,notonlychat. No unrelated roadmap feature activated.

Tenth review5381938342 on 395de1465b3c053556151d8c39dae1f582f1269a found one valid display issue:
the sole PUT discovery coverage consumer now uses the existing atomic LTR renderer for ISO date,
counters and leverage multiple. Three regressions cover strict/legacy/missing-date claims and UI
wiring. No claim, ranking, scan or restored Add/Edit/BTC/B-S control changed.

Eleventh review5382112411 on bdc71ee7462d0910c1311b6365419664a92babcc found three valid issues.
Add/Edit's unchanged merge now writes only after full expected-row equality inside one Room
transaction; concurrent/missing rows fail closed, retain form inputs and emit no edit event. Existing
draft saves/promotions also require current DRAFT. Edit cancellation releases loading at both initial
read and guard; new-row/postcommit behavior and financial defaults/formulas remain unchanged.
Cash-flow migration/retention/write and explicit clear share one process-wide lock across instances;
fake SharedPreferences tests execute actual record methods and prove stale legacy rekey cannot double
one withdrawal and failure releases ownership. Watchlist target rows keep LTR and disable wrapping.
Six expected-row tests, two cash concurrency tests and one target-wrapping regression cover the fixes.

Twelfth review5382407146 on fc39f835327c69ba40d69356cf0ee08b553a90a5 found two valid issues.
Every FlexSyncWorker whole-row replacement now re-reads/compares the full expected row inside its
Room write transaction (marks, BTC-order hints, expiry, both assignment paths, draft B-S quotes).
Quote/order work also revalidates original contract/spread identity and broker evidence. Newer owner
edits/closes/deletes survive either writer ordering; lifecycle/assignment formulas remain unchanged.
Historical partial-event rehome requires exactly one matching New York close date even for one
candidate; missing/mismatched/ambiguous dates leave the original event untouched. Five worker guard
and three additional historical-identity regressions passed. Restored Add/Edit/BTC/B-S UI unchanged.

Thirteenth normal review5382642371 on 0e58179a8b4f97d1e8904d59892c3b83e82b63f5 found one valid
manual-reconciliation ordering issue. The source-frozen correction makes partial import publication
Room-first under a complete-planner-snapshot expected-state guard: prior opening-fee repairs, the
closed slice, feed row and live remainder commit together; broker side-table evidence follows only
after the committed snapshot is still exact. Room and preferences remain separate stores, so process
death can leave correct money rows with missing identity evidence. That gap fails closed; only the
exact same cumulative snapshot can use existing origin/created-at recovery, while a later larger
snapshot without sufficient identity refuses rather than inventing an incremental slice. No
cross-store atomicity or self-healing is claimed.

The same full candidate-snapshot guard now covers initial open, spread and closed pre-insert checks
and insertion. A concurrent owner row can no longer appear between check and insert as a duplicate
representation, while distinct execution evidence still preserves genuine independent round trips.
The Review13 import guard class then had12 tests, including owner/sibling insertion after planning and two
distinct executions.

The companion source-frozen draft-worker stale guard reuses the expected-row Room transaction and
requires the row to remain the same DRAFT; an owner edit, delete or promotion skips the obsolete
replacement and its counters. A supplemental bounded review also found that a missing legacy
second-leg strike could block exact price-first close money despite complete monetary inputs. Its
source-frozen narrow correction removes only that non-monetary strike gate; signed leg-premium rules,
single-leg stale-metadata sanitation, assignment and protected strategy formulas remain unchanged.
The Review13 offline validation above passes and these corrections are committed in the last pushed
head. Review14 then found three additional valid issues. `sameImportBrokerEvidenceFacts` ignores
the reconciliation timestamp and canonical-link projection while comparing complete lifecycle fields
to decide whether remainder evidence may be refreshed. Separately,
`BrokerReconciliationStore.mergeForWrite` retains a prior canonical link only for the same complete
opening-and-closing execution pair with the prior contract/class identity. An already-represented partial
with no missing evidence still commits fee/remainder repairs; What-if values render as atomic one-line
LTR children without changing owner inputs. Thirteen import-guard tests, three What-if display tests and one broker-store pair-retention
tests cover the fixes. Review14 focused268, full1742/112classes/1existing skip, scripts76, compile8s
and APK37s pass. Review15's two source corrections, focused316/scripts76 and full1744/112classes/
1existing skip checks now pass locally; the actual audit is unchanged. Compile8s/zero real compiler
errors and diff-check also pass. Review15 APK42s/SHA9006b09d5a095f5a602f239618ad1f3ef69164119dad860011d5f6e168e03999
is installed/delivered without launch. The Review15 correction is pushed at
`dcc00e2fc128b14e1cdf32ad2833c58b74e4340c` and both Review15 discussions are resolved. Review16
subsequently found the two issues recorded above. Focused322, full1750/113classes/1existing skip,
scripts76,compile7s and APK33s/SHA-d15255a9 pass; the audit is unchanged. The artifact was installed/
delivered without launch. Review16 fixes are pushed at `121c31ec124d20ab7f1fa848d1c5f88b2ae6d219`
and both discussions are resolved. Review17 then found the two P2s recorded above; focused168,
full1755/113classes/1existing skip,scripts76,compile8s and APK30s/SHA-8516baee pass; audit unchanged.
The artifact was installed/delivered without launch. Fixes are pushed at
`a423e0d7964090f10d1ae4fcf1e3f563a604d1ef`, both discussions are resolved, and Review18 is clean
with all three checks passing on that exact HEAD. The later operator-audit test/docs-only candidate was
pushed at `9a24944301bbe851190e7e0f41b786c9125e30da`; Review19 found the exporter identity omission.
Its fix is pushed at `ab168766ec636d072832057cc1237e511d58e7aa`; replacement validation/artifact
pass. Review20 is clean and Build/Codex/scripts exact-head checks all passed.
