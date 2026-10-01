# Current session — OptionsProfitTracker

Date: 2026-10-01. S2.8 implementation, exact-head review fixes and owner BTC restoration.
Starting HEAD: `4512cbfa93b0a1623d544626c56e1c8709c06083`.
Final HEAD: `ab168766ec636d072832057cc1237e511d58e7aa`, pushed to the same PR19 branch. Review20 is
CLEAN and all exact-head checks passed. Latest clean
reviewed app-code HEAD before the
audit/export-test/docs-only commits: `a423e0d7964090f10d1ae4fcf1e3f563a604d1ef` (Review18).
Same branch `s2/ibkr-reconciliation-lifecycle-dashboard`, PR #19 OPEN, never merged; main untouched.
Full requirements, evidence, limits and retained backlog: `cc-latest.md` and project S2_8 documents.

## Final state

Normal Codex Review20 trusted-connector
[comment5939081513](https://github.com/funzi7/OptionsProfitTracker/pull/19#issuecomment-5939081513)
reviewed exact `ab168766ec636d072832057cc1237e511d58e7aa` CLEAN at2026-10-01T19:35:25Z.
Build110546709904/run36915008018 passed at2026-10-01T19:39:37Z in7m21s;
scripts110546710243 and Codex Gate110548127638 passed. All79 threads were retrieved with zero active
unresolved non-outdated trusted Codex P1/P2; PR19 remains OPEN/unmerged.
Overall acceptance remains FAILED financial parity: fixed Sep1–28 NY broker options4741.75 vs prior
app5089.43. Proven inverse/manual duplicates remove245.35; exact signed rounding adds.01.
Canonical49 rows4844.09 leaves102.34 unverified for33 local-only cycles; owner has no saved export.
No hardcoded correction, fake rows or sync. WDCX .65 close gives92.93, never rounded32%-driven94.13.
Separate owner evidence for OPTIONS-only 2026-09-03..2026-10-02 reports app5832 versus broker5518
at whole-dollar precision, observed314, and no October gains. It does not replace Sep1–28 evidence.
Owner supplied exact5634.27 as IBKR September monthly-statement realized equity+index options;
canonical5832.48 differs by198.21, but per-trade row parity remains unproven.
Fresh read-only input has334 position rows and274
broker_reconciliation records;3 copy hashes unchanged/integrity passed; persisted option closes
endSep30 with zero Oct closes observed. Production audit passed1test/1class/17s:57raw(15broker,
42local)5969.62;54canonical5724.27,same3pairs−245.35,39canonical local-only. Delta to reported
whole-dollar5518 is206.27, NOT cent-proven. Sep1SPCH3529 52.74 +Sep2MULL3540 55.47=108.21;
5724.27+108.21=5832.48 is compatible with reported app5832, not proof of its date selection.
Sep1–Oct2 production audit passed1test/1class/3m41s/all31tasks executed:59raw(16broker/43local)
6077.83;56canonical5832.48,40canonical local-only,same3pairs−245.35 (log/XML/CSV under
`/tmp/opt-s28-oct2-*` and `/tmp/opt-s28-oct2.j7bb6j/audit-sep1-oct2.csv`). Thus5832.48−108.21=
5724.27, supporting period mismatch but not proving the unsupplied screenshot filter/cents. The5634.27
reference is the confirmed separate September IBKR equity+index-options monthly statement;
5832.48−5634.27=198.21 exactly at supplied statement precision. No invented per-trade evidence,
Oct2 closes,sync or provider request. The owner confirmed the exact SOXL128 CALL exp2026-09-25
statement row has IBKR realized0. Matching persisted SOXL3586 is locally EXPIRED/unassigned with
money199.23 and no broker P&L/reconciliation. This proves a broker-evidence/classification mismatch
accounting for nearly all of198.21; counterfactual broker0 gives5633.25, still−1.02. No correction
was applied. SOXL3586 has an AutoExpire signature; assigned-CC math already returns0, while IBKR's
official reporting reference places assigned-option premium in underlying P&L, not separate option
realized P&L. Import skips already EXPIRED/EXPIRED rows and auto-assignment acts only on OPEN rows.
Missing raw broker evidence prevents proving why assignment was not persisted. No offset, device DB
write, hardcoded0 or protected assignment-formula change. The owner separately reports options-only
YTD app38287.55 versus IBKR37688.74 (gap598.81) without an exact cutoff; saved closes stopSep30.
A bounded Jan1–Oct2 production audit passed1test/1class/17s:280raw/232broker/48local=38532.90;
277canonical/232broker/45local=38287.55 after the same3pairs−245.35; delta598.81 (`/tmp/opt-s28-
ytd-audit.log`, XML `/tmp/opt-s28-ytd-xml`, CSV `/tmp/opt-s28-oct2.j7bb6j/audit-ytd.csv`).
SOXL0 would hypothetically reduce that gap to399.58, not prove or apply a correction. Older local
IDs12/208(BTCI PUT33,128.43),3534/3538(IRE PUT6,108.43),3537(SPCH CALL10,65.68) are documented
genuine partial-close slices totaling302.54, not duplicates, but lack external broker reconciliation
identity and authoritative broker amounts; no row-level attribution is supportable. YTD canonical
money is232broker-backed rows33680.02 plus45local-only rows4607.53; Jan–Aug221rows/32455.07 and
September56rows/5832.48. Do not turn the399.58 counterfactual or subset arithmetic into attribution.

Final Sep3–Oct2 decoder-guard audit passed1test/1class/45s with unchanged5724.27
(`/tmp/opt-s28-oct2-audit-final.log`, XML `/tmp/opt-s28-oct2-window-final-xml`, CSV
`/tmp/opt-s28-oct2.j7bb6j/audit-sep3-oct2-final.csv`). Exact Sep1–30 statement audit passed1test/
1class/16s:59raw/16broker/43local;56canonical5832.48 against5634.27,delta198.21
(`/tmp/opt-s28-september-statement-exact-audit.log`, XML
`/tmp/opt-s28-september-statement-exact-xml`, CSV
`/tmp/opt-s28-oct2.j7bb6j/audit-september-statement-exact.csv`).

Latest owner correction: restore manual BTC price/percentage entry, live price-based dollars and saved
CC target display. **SUPERSEDED — owner approved:** blocking/clearing manual input on unknown ticks.
Missing/off-tick proof warns; automatic model/PUT/B-S recommendations still refuse unknown proof.
Fresh readonly MULL3585 target50.0 and RKLX3611 target42.8571428571429 are current. The earlier
`/tmp/opt-s28-btc.D3iFlu` RKLXNULL observation is historical. Do not infer which owner action produced
it; no device DB write/repair and no physical UI PASS. Normal owner re-entry is available.

Separate High-IV/PUT pages; PUT page owns one first unattempted NY-day scan then explicit force.
Dashboard/IV never secretly scan. One cache/pool/rejection model; OI wording and thresholds preserved.
Process kind/universe singleflight + bounded TTL + explicit force-through-leaf, fake counters only.
Sixth review adds atomic partial-worker CAS, cash-window preservation, key-before-TTL,
non-cancellable stock commit/publication and immediate recovery. Room/prefs process-death and
permanent projection-store failures remain honestly documented limits.
Seventh review fixes shared activity title/description direction and the close-source broker token;
existing persisted text, timestamps and money remain unchanged.


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


Ninth review5381662557 on c198b692f0c68bf9a93d03e682364f9abe1c2412 found two valid issues:
PUT empty-state numeric/English runs now reuse the shared atomic LTR renderer (including LRI/FSI
spans), preserving all rejection wording. Legacy partial-event rehome now keeps the stored description
when complete parent/order proof is absent; it cannot claim an earlier pre-close count from the final
open remainder, sum reopened cycles or invent evidence. Candidate identity, timestamps and money are
unchanged. Five history and four display regressions cover the correction. The review also claimed
the script directory command universally failed; actual pinned Node20 local/CI runs passed76/76.
Explicit *.test.js selection nevertheless hardens portability with identical76-test coverage.

## Validation and delivery

- Final exporter-fix HEAD: Python real-exporter integration passed3tests/0failures/0errors in
  0.626s (`/tmp/opt-s28-review19-python-tests.log`). Normalized absent-vs-null comparison proves the
  documented export matches all334positions/274records; Jan1–Oct2 production audit passed1test/
  1class/18s unchanged277canonical/38287.55/delta598.81 (`/tmp/opt-s28-review19-exporter-audit.log`,
  XML `/tmp/opt-s28-review19-exporter-xml`, CSV
  `/tmp/opt-s28-oct2.j7bb6j/audit-ytd-exporter.csv`). Final combined clean-test/test/compile/assemble
  passed1755tests/0failures/0errors/1existing skip/113classes(1754executed),BUILD SUCCESSFUL24s,
  51tasks(2executed,49up-to-date),zero real compiler errors
  (`/tmp/opt-s28-review19-full-compile-apk.log`, XML `/tmp/opt-s28-review19-full-xml`). Fixed Sep28
  audit `/tmp/opt-s28-audit.cu74l9/audit-s28-review19-full.csv` remains49canonical/4844.09/
  residual102.34. Scripts76/76/all other counters zero in1077.549062ms
  (`/tmp/opt-s28-review19-scripts.log`);diff-check clean. App/package unchanged; APK SHA256 remains
  `7496e04146048a2bec495eb0c8719333544839825152f979a715d1aca353f3ca`,already installed/delivered
  with unchanged signer; no redundant launch.
- Prior post-Review18 operator-test/docs candidate (historical after exporter fix; production app
  source unchanged): full REAL JVM
  passed1755tests/0failures/0errors/1existing skip/113classes(1754executed),BUILD SUCCESSFUL36s;
  `/tmp/opt-s28-owner-window-full.log`, XML `/tmp/opt-s28-owner-window-full-xml`. Fixed Sep28 audit
  `/tmp/opt-s28-audit.cu74l9/audit-s28-owner-window-full.csv` actually ran and remains49canonical/
  4844.09/residual102.34/same3pairs. Scripts76/76/all other counters zero in2499.321093ms
  (`/tmp/opt-s28-owner-window-scripts.log`). Compile BUILD SUCCESSFUL11s,16tasks up-to-date,zero
  real `^e: ` lines (`/tmp/opt-s28-owner-window-compile.log`); diff-check clean. APK build passed33s/
  41tasks(4executed,37up-to-date),zero real compiler errors (`/tmp/opt-s28-owner-window-apk.log`):
  version1.0.0/code1,65,956,886bytes,SHA256
  `7496e04146048a2bec495eb0c8719333544839825152f979a715d1aca353f3ca`; signer unchanged. Existing
  host ADB/phone/TracerPid0 reverified; install-r returned Performing Streamed Install/Success;
  required Download hash matches; NOlaunch.
- Review14 focused validation:268 tests,0 failures,0 errors,0 skipped,25 classes,
  BUILD SUCCESSFUL1m42s; `/tmp/opt-s28-review14-focused.log`, XML
  `/tmp/opt-s28-review14-focused-xml`. Scripts76/76 all zero;
  `/tmp/opt-s28-review14-scripts.log`.
- Review14 full REAL JVM:1742 tests,0 failures,0 errors,1 existing skip,112 classes
  (1741 executed),BUILD SUCCESSFUL15s; `/tmp/opt-s28-review14-full.log`, XML
  `/tmp/opt-s28-review14-full-xml`. The actual audit ran to
  `/tmp/opt-s28-audit.cu74l9/audit-s28-review14-full.csv`, unchanged4844.09 against4741.75,
  residual102.34 and the same three proven pairs.
- Review14 compile BUILD SUCCESSFUL8s,zero real `^e: ` lines;
  `/tmp/opt-s28-review14-compile.log`; `git diff --check` clean.
- Review14 `assembleDebug --stacktrace`:BUILD SUCCESSFUL37s,41tasks (3executed,38up-to-date),
  zero real `^e: ` lines; `/tmp/opt-s28-review14-apk.log`. APK1.0.0/code1,65,950,883bytes,
  SHA256`031d7fe16c7ce811307d8e591b54c8da4d4eb6201daa1981718af8bfb863e4fd`.
  Signer unchanged; install-r Success; canonical Download delivery matches hash; NOlaunch.
- The Review13 metrics and artifact below are historical after Review14 source changes.

- Final Review13 focused retry219 tests,0 failures,0 errors,0 skipped,20 classes,
  BUILD SUCCESSFUL26s; `/tmp/opt-s28-review13-focused-final-retry.log`, XML
  `/tmp/opt-s28-review13-focused-final-xml`.
- Full JVM1737 tests,0 failures,0 errors,1 existing skip,111 classes(1736 executed),
  BUILD SUCCESSFUL18s; `/tmp/opt-s28-review13-full-final.log`,
  XML`/tmp/opt-s28-review13-full-final-xml`.
- Actual persisted audit output `/tmp/opt-s28-audit.cu74l9/audit-s28-review13-full-final.csv` remains
  canonical49rows/4844.09 against4741.75, residual102.34; it ran, not skipped.
- Scripts76/76; earlier actual DAO-SQL SQLite fixtures6/6; compile BUILD SUCCESSFUL9s,zero real
  Kotlin `^e: ` errors; `/tmp/opt-s28-review13-scripts.log`,
  `/tmp/opt-s28-review13-compile-final.log`.
- The initial Review13 focused run failed KSP at `ImportViewModel.kt:1964:34 Expecting ')'` because
  two expression-body `Record` constructors ended `}` instead of `)`. The tokens were corrected;
  `/tmp/opt-s28-review13-focused.log` is a repository patch failure, not PASS or a toolchain limit.
- The pre-pre-insert focused217/full1735 passes are historical. The first post-pre-insert focused219
  run had1 fixture failure because two rows used different `createdAt = now()` timestamps. Seeding
  `createdAt` from the fixed snapshot clock corrected the test without loosening production guards;
  `/tmp/opt-s28-review13-focused-final.log` is not PASS.
- Review13 source is committed in the last pushed HEAD and its local validation passes.
- Historical Review13 APK build BUILD SUCCESSFUL31s; `/tmp/opt-s28-review13-apk-final.log`.
- APK1.0.0/code1,64,913,657bytes,SHA256
  `cdf26ed60efaa139b474763a7c7066e2270aa5ff1fb9bcbbba9b0131b5c67389`.
- Signer unchanged SHA256`9e5307e1344917f0cdc495c5cc04a80d23a92c5965c779b6efb0faa1135b8221`.
- Installed in place via existing host ADB (`install -r` → Success) and delivered to
  `/sdcard/Download/OptionsProfitTracker/OptionsProfitTracker-1.0.0.apk`, matching hash.
- The intermediate pre-insert clean3m54s/all42tasks APK SHA256
  `efb59af8a1a4288182a7ef22a6677eb72e113384c22d6dc150e39138fbd81fc6` was not installed or delivered.
- The Review13 APK above is historical and superseded by the Review14 artifact.
- All34 valid findings from the first14 normal reviews are fixed in pushed
  `96d65d41d8a65db7d7e2a13ec9c4b082c01a7b42`. Review13
  [finding4158111738](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158111738)
  was resolved by [reply4158493929](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158493929).
  Full-PR Review14 `5383172022` reviewed exact `e99100de52ce00ed73d3e09457390d3abc218175`
  and found three valid issues:
  [4158547817](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158547817),
  [4158547823](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158547823), and
  [4158547831](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158547831).
  All are fixed and resolved by replies
  [4158702367](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158702367),
  [4158702528](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158702528), and
  [4158702703](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158702703).
  Full-PR Review15 `5383450464` reviewed exact
  `96d65d41d8a65db7d7e2a13ec9c4b082c01a7b42` at2026-10-01T18:06:55Z and found two additional
  valid issues: [4158773255](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158773255)
  because a non-null empty chain page hid a provider failure from discovery status, and
  [4158773262](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158773262)
  because the covered-call quote contract suffix could wrap separately. Provider failures are now
  classified independently of page nullability; `CHAIN_INCOMPLETE` stays sticky after later clean/
  usable pages, while clean missing-underlying remains a normal skip. Covered-call contract suffix,
  ticker, share count, quote price and daily percentage are atomic LTR runs. Total valid findings are36
  across15 reviews. DashboardViewModel and DashboardScreen corrections were implemented;
  one chain-classification/sticky-state test and one atomic covered-call display test were added.
  Focused validation passed316/0fail/0errors/0skip/28classes, BUILD SUCCESSFUL1m40s
  (`/tmp/opt-s28-review15-focused.log`, XML `/tmp/opt-s28-review15-focused-xml`), and scripts passed
  76/76 all zero (`/tmp/opt-s28-review15-scripts.log`). Full REAL JVM passed1744/0fail/0errors/
  1existing stock-fixture skip/112classes (1743executed), BUILD SUCCESSFUL19s
  (`/tmp/opt-s28-review15-full.log`, XML `/tmp/opt-s28-review15-full-xml`). The actual audit ran to
  `/tmp/opt-s28-audit.cu74l9/audit-s28-review15-full.csv` and remained49rows/4844.09/residual102.34/
  same3pairs. All36 findings are fixed in pushed source. Review15 discussions are resolved by replies
  [4158871216](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158871216) and
  [4158871390](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158871390).
  Compile passed BUILD SUCCESSFUL8s with zero real `^e: ` lines
  (`/tmp/opt-s28-review15-compile.log`); diff-check/protected SDK/private hashes remain clean/unchanged.
  Review15 APK build passed42s/41tasks(3executed,38up-to-date), zero real compiler errors
  (`/tmp/opt-s28-review15-apk.log`): version1.0.0/code1,65,951,267bytes,SHA-256
  `9006b09d5a095f5a602f239618ad1f3ef69164119dad860011d5f6e168e03999`; signer unchanged,
  install-r Success, canonical Download hash matches, NOlaunch. Review14/15 evidence is historical.
  Full-PR Review16 `5383656245` reviewed exact `dcc00e2fc128b14e1cdf32ad2833c58b74e4340c`
  at2026-10-01T18:23:46Z and found two valid issues:
  [4158937105](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158937105)
  because long PUT exit-metric LTR text can clip, and
  [4158937113](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4158937113)
  because tied minimum values inflate the percentile. Total valid findings are38 across16 reviews;
  all38 are fixed in final pushed source. Corrections are limited to PUT opportunity display/tests and
  score/tests. PUT exit,
  contract/expiry/DTE,IV/premium/collateral,liquidity and risk metrics are atomic flowing runs; two
  static display tests and four score tests were added. Focused validation over the same10 glob
  selectors passed322/0fail/0errors/0skip/29classes, BUILD SUCCESSFUL1m17s
  (`/tmp/opt-s28-review16-focused.log`, XML `/tmp/opt-s28-review16-focused-xml`). Full REAL
  clean-test/test passed1750/0fail/0errors/1existing stock-fixture skip/113classes (1749executed),
  BUILD SUCCESSFUL19s (`/tmp/opt-s28-review16-full.log`, XML `/tmp/opt-s28-review16-full-xml`).
  Actual audit `/tmp/opt-s28-audit.cu74l9/audit-s28-review16-full.csv` is unchanged49rows/4844.09/
  residual102.34/same3pairs. Scripts passed76/76/all other counters zero in661.153594ms
  (`/tmp/opt-s28-review16-scripts.log`). Compile passed BUILD SUCCESSFUL7s/16tasks up-to-date/zero
  real `^e: ` lines (`/tmp/opt-s28-review16-compile.log`). `assembleDebug` passed BUILD SUCCESSFUL33s/
  41tasks(3executed,38up-to-date)/zero real `^e: ` lines (`/tmp/opt-s28-review16-apk.log`).
  APK1.0.0/code1 is65,957,101bytes,SHA-256
  `d15255a9edfa201be39d0fd06a871e111e0b97075710b204b2eefad6327951f0`; signer unchanged
  `9e5307e1344917f0cdc495c5cc04a80d23a92c5965c779b6efb0faa1135b8221`. Existing host ADB
  PID26045/TracerPid0/device were reverified; install-r Success, exact required Download filename/hash
  matches, and the app was NOT launched. Approved scoring
  preserves owner-best100/owner-worst0/equal ties via `(count <= value - minCount)/(N-minCount)*100`,
  in-pool all-equal neutral50, outside-pool0/100, unique-min outputs, interior multiplicity,70/30
  weighting,risk and eligibility. It is not a page-move redesign. Fixes are pushed at
  `121c31ec124d20ab7f1fa848d1c5f88b2ae6d219`; Review16 discussions are resolved by replies
  [4159080144](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4159080144) and
  [4159080395](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4159080395).
  Full-PR Review17 `5383925734` reviewed that exact HEAD at2026-10-01T18:43:44Z and found two P2s:
  [4159147837](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4159147837)
  because all-source tick metadata failure could claim the day, and
  [4159147857](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4159147857)
  because a stale contract-only canonical-association write lacked expected-row CAS protection.
  Total valid findings are40 across17 reviews; all40 are fixed in final pushed source. Corrections are
  limited to the tick and canonical-CAS lanes. Tick daily cache now
  requires at least one valid source; all-source failure gets only a5-minute monotonic completion
  cooldown, with no daily cap/autonomous loop and existing mutex/singleflight preserved. Three tests
  were added and the day-cache test strengthened. Canonical `completeRecord` CAS now runs under
  `PROCESS_WRITE_LOCK` with one durable-key commit; caller CAS failure returns raw rows rather than
  hiding them behind stale association. Review14 `mergeForWrite` remains unchanged. Two tests were
  added and source wiring strengthened. Owner forms are unchanged. Focused validation over12
  selectors passed168/0fail/0errors/0skip/22classes, BUILD SUCCESSFUL1m25s
  (`/tmp/opt-s28-review17-focused.log`, XML `/tmp/opt-s28-review17-focused-xml`); selectors cover
  OptionTick,BrokerReconciliationStore,PersistedLifecycleDedup,ExpectedImportReconciliation,
  CanonicalRealizedReads,ExactCloseMoney,PutScanLifecycle,PutPageOwnership,Provider,Owner,
  BtcProfitIntentPersistence and CloseOwnerBtcCalculator. Scripts passed76/76/all other counters zero
  in775.489062ms (`/tmp/opt-s28-review17-scripts.log`). Full REAL passed1755/0fail/0errors/
  1existing stock-fixture skip/113classes(1754executed), BUILD SUCCESSFUL20s
  (`/tmp/opt-s28-review17-full.log`, XML `/tmp/opt-s28-review17-full-xml`). Actual audit
  `/tmp/opt-s28-audit.cu74l9/audit-s28-review17-full.csv` ran and remained49rows/4844.09/
  residual102.34/same3pairs. Compile passed BUILD SUCCESSFUL8s/16tasks up-to-date/zero real `^e: `
  lines (`/tmp/opt-s28-review17-compile.log`). `assembleDebug` passed BUILD SUCCESSFUL30s/
  41tasks(3executed,38up-to-date)/zero real `^e: ` lines (`/tmp/opt-s28-review17-apk.log`).
  APK1.0.0/code1 is65,957,101bytes,SHA-256
  `8516baee7565b13062e4af9cb875f8a406cd02ebb4c33ba622b074aa0142c055`; signer unchanged.
  Host ADB PID26045/TracerPid0 reverified; install-r Success, required Download path/hash matches,
  NOlaunch. Prior-head Build job110523828404 and scripts job110523826075 passed, but Review17 itself
  was not clean until these fixes. Review16 validation/APK are historical. Review17 fixes are pushed
  at `a423e0d7964090f10d1ae4fcf1e3f563a604d1ef`; both discussions are resolved by replies
  [4159252509](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4159252509) and
  [4159252758](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4159252758).
  Full-PR Review18 returned CLEAN on that exact HEAD through trusted connector
  [comment5938443878](https://github.com/funzi7/OptionsProfitTracker/pull/19#issuecomment-5938443878)
  at2026-10-01T18:58:56Z. Exact-head Build110530770563,scripts110530772918 and
  Codex110533114324 all passed. The later owner Sep3–Oct2/September-statement/YTD evidence adds only
  configurable offline audit-test/docs work, pushed at
  `9a24944301bbe851190e7e0f41b786c9125e30da`; it invalidates Review18 for the final candidate.
  Replacement validation/artifact pass. Review19 `5384440605` then reviewed exact
  `9a24944301bbe851190e7e0f41b786c9125e30da` and found one valid P2,
  [4159580179](https://github.com/funzi7/OptionsProfitTracker/pull/19#discussion_r4159580179): the
  documented exporter omitted broker/canonical identity fields consumed by the audit. The whitelist
  now retains both without exporting secrets/arbitrary preferences; three real-script integration
  tests cover precision,legacy/null/privacy and source immutability. Fix HEAD
  `ab168766ec636d072832057cc1237e511d58e7aa` is pushed; total valid findings are41 across19 reviews.
  Review19 was resolved by reply4159626501. Full-PR Review20 request
  [5939035896](https://github.com/funzi7/OptionsProfitTracker/pull/19#issuecomment-5939035896) was
  posted at2026-10-01T19:32:27Z. Review20 reviewed exact
  `ab168766ec636d072832057cc1237e511d58e7aa` CLEAN through trusted connector
  [comment5939081513](https://github.com/funzi7/OptionsProfitTracker/pull/19#issuecomment-5939081513)
  at2026-10-01T19:35:25Z: “Didn’t find any major issues.” Codex Gate110548127638 and
  scripts110546710243 passed. Build110546709904/run36915008018 completed PASS at
  2026-10-01T19:39:37Z in7m21s. No new finding;
  total remains41 valid findings across20 reviews. GraphQL retrieved all79 threads(hasNextPage=false)
  with zero active unresolved non-outdated trusted Codex P1/P2; PR19 remains OPEN/unmerged on exact
  `ab168766ec636d072832057cc1237e511d58e7aa`.
- Readonly DB/WAL snapshots/integrity/signing/host-isolation checks were performed.
- NO app launch, broker/Flex/import/resync, price/IV/PUT/chain/watchlist/news/provider refresh,
  manual device DB write, settings change, uninstall or clear. Physical network-capable QA is
  OWNER-DEFERRED; installing is not screen acceptance.

Owner-approved local.properties edit preserved/excluded. Unrelated private-media-tv memory edit
preserved. Memory finalized only through canonical project-scoped helper, with approved ff-only safety
repair. No reset/clean/restore/stash/rebase/history rewrite/force push/alternate worktree.

Remaining: fixed-window financial102.34 evidence gap; separate Sep3–Oct2 residual206.27/39local rows;
September-statement residual198.21 with confirmed SOXL local199.23/broker0 classification mismatch,
still−1.02 counterfactually and no raw assignment evidence for automatic repair; YTD gap598.81/
45local rows with no exact owner cutoff; held exact-series/tick proof data gaps;
OPT→Trading Tracker/conditional ChatGPT report SPEC_ONLY; Phase3 learning; historical stock coverage;
SOFI attribution; missing Flex ibOrderID; PR20 rollout; migration registration1/17 hazard; issues:write
untested; journal/null-close/bidi debt; owner-deferred physical checks. No unrelated item closed.

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

Thirteenth normal review5382642371 on 0e58179a8b4f97d1e8904d59892c3b83e82b63f5 raised the valid
finding count to31. Its source-frozen correction makes partial manual-import publication Room-first
under the complete planner snapshot: opening-fee repairs, closed slice, feed row and live remainder
commit together, then side-table evidence publishes only if the committed snapshot remains exact.
Room/preferences are not cross-store atomic; process death can leave missing identity evidence, which
fails closed rather than inventing an incremental slice. The companion draft B-S worker correction
uses the same expected-row/current-DRAFT guard and skips stale writes and counters after owner edit,
delete or promotion. Their source was committed and locally validated before Review14; Review14 found
the separate three issues recorded below.

Initial open, spread and closed pre-insert paths now use the same full candidate-snapshot guard and
postcommit evidence publication. A concurrent manual save cannot slip between candidate check and
insert as a duplicate representation; distinct execution evidence still preserves real separate
round trips. Two new regressions bring the import guard class to12 tests.

A supplemental bounded review found exact price-first close money was gated by a missing legacy
second-leg strike even when all monetary inputs existed. The source-frozen narrow correction removes
only that non-monetary strike gate and preserves signed leg-premium, stale-metadata, assignment and
protected-strategy semantics. Review13 local validation passes and the correction is committed in
the final pushed head. All three supplemental guard/exact-money findings are fixed, but supplemental
review was not a substitute for Review14.

Fourteenth normal review5383172022 on e99100de52ce00ed73d3e09457390d3abc218175 raised the valid
finding count to34. The fixed `AlreadyRepresented` path separates empty evidence recovery from the
still-required atomic fee/remainder repair. `sameImportBrokerEvidenceFacts` ignores reconciliation
timestamp/canonical-link projection fields while comparing complete lifecycle facts to decide whether
remainder evidence may be refreshed. Separately, `BrokerReconciliationStore.mergeForWrite` retains a
prior canonical link only for the same complete opening-and-closing execution pair with the prior
contract/class identity. What-if labels may wrap, while contract/date/price/count/money values are
explicit atomic one-line LTR children. Add/Edit/manual BTC/B-S controls are unchanged. Thirteen
import tests, three new What-if tests and one broker-store pair-retention test cover these fixes.
Focused268, full1742/112classes/1existing skip, scripts76, compile8s and APK37s passed for the
Review14 source. Review15 source fixes now pass focused316/28classes, scripts76 and full1744/
112classes/1existing skip; the actual audit is unchanged. Compile8s/zero real compiler errors and
diff-check pass. Review15 APK42s/SHA9006b09d5a095f5a602f239618ad1f3ef69164119dad860011d5f6e168e03999
is installed/delivered without launch. The Review15 correction is pushed at
`dcc00e2fc128b14e1cdf32ad2833c58b74e4340c` and both Review15 discussions are resolved. Review16
then found two valid issues. Focused322, full1750/113classes/1existing skip, scripts76,compile7s and
APK33s/SHA-d15255a9 pass; the audit is unchanged. The artifact was installed/delivered without launch.
Review16 fixes are pushed at `121c31ec124d20ab7f1fa848d1c5f88b2ae6d219` and both discussions are
resolved. Review17 then found two P2s; focused168,full1755/113classes/1existing skip,scripts76,
compile8s and APK30s/SHA-8516baee pass; audit unchanged. The artifact was installed/delivered without
launch. Fixes are pushed at `a423e0d7964090f10d1ae4fcf1e3f563a604d1ef`, both discussions are
resolved, and Review18/all3checks are clean on that exact HEAD. The later operator-audit test/docs-only
candidate was pushed at `9a24944301bbe851190e7e0f41b786c9125e30da`; Review19 found the exporter
identity omission above. Its fix is pushed at `ab168766ec636d072832057cc1237e511d58e7aa`; replacement
validation/artifact pass. Review20 is clean and Build/Codex/scripts exact-head checks all passed.
