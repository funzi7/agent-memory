# OptionsProfitTracker current session — 2026-11-06

## Repository and exact-head state

- Follow-up start: `6f13551b7c28b908e4a5a6e82a3fbf78f9cfa135`.
- Final/pushed/reviewed OPT HEAD: `b928645dd3290909fe71367b6e480e925ddd3e3d`.
- Same branch `s2/ibkr-reconciliation-lifecycle-dashboard`, PR #19 OPEN/unmerged; no main push.
- Owner `local.properties` remains unstaged and excluded.
- Trusted Codex receipt `6692049538` reviewed exact `b928645dd3` with no major issues. Build Gate
  `42268223284/128065633929`, scripts `42268223214/128065633553`, Codex evaluator
  `42268932939/128068119850` and PR-head check `128068254240` passed.

## Stock-price failure and correction

The installed app still had the earlier package-only `OEM_DENY_3` QA network deny. DNS failed and the
canonical Yahoo stock batch returned `0/8`. Four unfinished Flex slots were waiting behind the same
connectivity condition, so unblocking first could have issued an unauthorized broker request.

Automatic periodic/pre-market/app-start/boot work now carries `requires_auto_sync=true`; old work
without the field defaults true. The worker checks the durable preference before credentials/provider
access. OFF cancels/awaits all four named slots and blocks pre-market re-arm. ON restores periodic and
pre-market. Explicit owner sync remains available with false. App startup is the sole pre-market owner.

The fresh `1.0.0` APK was installed in place with data/signer preserved and delivered to the canonical
Download path. Auto-sync was set OFF through an app-owned temporary signed helper; all Flex
cancellations were awaited, DB integrity was `ok`, and the helper was removed. After removing the
package deny, a bounded Yahoo check returned stocks `8/8` and indices `4/4`; durable evidence is
attempt/commit `8`, requested/usable `8`. No Flex worker/fetch/start and no IBKR request ran. Temporary
Doze/background allowances were removed, normal stopped state restored, and OPT was force-stopped.
The phone stayed locked, so final visual rendering remains owner-visible QA after unlock.

## Validation and artifact

- Focused Flex policy/terminal tests: 28/28, 2 classes.
- Full JVM: 2336 tests, 169 classes, 0 failures, 0 errors, 2 skips; `BUILD SUCCESSFUL in 31s`.
- Final compile: `BUILD SUCCESSFUL in 12s`, zero real `^e:` lines; clean assembly: 4m54s, 42/42 tasks.
- APK: 64,832,472 bytes; SHA-256
  `50deec8ea135426b88633a23be2050ee8d38823d40a0380b2f8034d441cd7481`.
- Signer SHA-256 `9e5307e1344917f0cdc495c5cc04a80d23a92c5965c779b6efb0faa1135b8221`;
  SHA-1 `5d3d855c6c6c397f817df2bd0c62f16f940b1551`.

## Still open

Financial acceptance remains failed without plugs: Sep1–28 `4844.09` vs `4741.75`; Sep3–Oct2
`5724.27` vs `5518`; September statement `5832.48` vs `5634.27`; YTD `38287.55` vs `37688.74`;
November stock `-6604.92` vs broker headline `-5554.86`. November options match `+232.30`. No
accounting policy was changed. Preserve historical stock/SOFI/`ibOrderID`, migration/PR20, Trading
Tracker, conditional report and Phase 3 backlog. Standalone-agent implementation remains assigned to
future private `funzi7/opt-market-agent`.
