# paywall-bot handoff — 2026-08-13 UTC

## Outcome

The automation-only rollout completed through the normal exact-head Codex Gate and Merge Bot. PR #94 is merged; no owner click or finding acknowledgement was used. The task did not edit TheMarker, Tech Feed IL, Telegram, Telegraph, or Backfill application logic or state.

## Upstream prerequisite

- automation-core emergency PR #40 repaired the unparseable Codex Gate and merged as `fd16f6ad875726386f4f7c029993639cafebaa01` after exact-head CI.
- The parse failure came from direct `${{ ... }}` interpolation inside a roughly 25 KB `actions/github-script` body, which exceeded GitHub's 21,000-character expression limit during template evaluation. Regression checks now cover every tracked workflow YAML, including synced source/mirror pairs and hub-only workflows, and reject all direct expression interpolation inside script bodies; values must travel through `env`.
- The automation-core watchdog now deduplicates gate-dispatch, update-branch, and backup-dispatch alerts by repository, PR, exact head, operation, and normalized error fingerprint. The first material event alerts; an identical retry does not; a new head or material error may alert once.
- CI Doctor now excludes trusted internal automation by workflow path as well as name. automation-core Issue #39 was factually closed after the Gate parsed and dispatched, and two subsequent CI Doctor checks created no replacement.
- The prematurely merged old #38 state was corrected forward through reviewed, normally auto-merged automation-core PRs #41–#51. Issue-mode Claude now has no `AUTOMATION_PAT`, no persisted checkout credential, and no generic shell/interpreter tools during model execution; the PAT is confined to trusted post-model code.
- GitHub Codex review capacity was available for the forward fixes and downstream rollout.

## PR #94 final proof

- PR: <https://github.com/funzi7/paywall-bot/pull/94>
- Final exact head: `5d65f205708435aab09ce03ace5880c30b342293`.
- Normal squash merge: `2575f0f2b16c12ebb9b9173e8c9a8248ab529ebe` at 12:35:05 UTC.
- Normal automation-core sync updated the existing PR; it did not create a replacement. At the final head, all seven configured workflows were byte-identical to automation-core source.
- Exact-head paywall CI run `31699982535` passed.
- A fresh trusted Codex review at 12:30:31 UTC named the exact head and reported no active P1/P2. All 13 older or addressed review threads were resolved only after the reviewed corrections were present.
- Authoritative manual Gate run `31700426352` passed. The exact original `pull_request_target` Gate attempt on run `31699980086` was then rerun after thread resolution and produced green native `codex-gate-evaluator` and `check-codex-status` checks on the exact head.
- Normal workflow-run Merge Bot run `31700719028` performed the merge. No owner merge and no `codex-p1-acknowledged` label were used.
- The formerly active `.github/workflows/merge-bot.yml:803` P1 became legitimately superseded by the upstream reviewed corrections; it was never overridden merely to make the PR green.

## Production and repository state

- Paywall-bot Codex Gate workflow ID `288364579`, Claude Fixer `302557988`, Claude Fallback Watchdog `303932281`, and Merge Bot `303932284` are active.
- The seven synced workflows on main are the reviewed automation-core versions. No rejected pre-fix automation regression was reintroduced.
- Main may also contain unrelated production-state commits made by existing automation outside this infrastructure task. This task neither authored nor modified those state files.
- Do not run Backfill or mutate/publish production data while performing automation maintenance.

## Final documentation

- Handoff PR #95 exact head `b42085136b470556595ba5126c3e013a4bedda15` passed downstream CI, received a clean exact-head Codex review, and passed Gate run `31701230800`.
- The normal Merge Bot squash-merged it as `3202649611d6a51d913d7d054a2189ded50e9afb`; paywall-bot main now includes the self-contained rollout record in `handoffs/CONTEXT.md`.

## Subsequent exact-head hardening and final rollout

- Automation-core PR #52 completed repository-wide expression hardening and
  normally merged as `961b51d9ff23edd215ff026d8dc0845f9a8124a9`.
  Normal downstream PR #96 head
  `d29810b1c2f3e0a4bf425aa364cf3bbfec99aa3d` passed current-head CI/Codex,
  Gate `31705628966`, and normally merged as
  `cb5cc5d87f335963e1f80db54de11fe706e3f6de`.
- Documentation PR #97 revealed that an old-head Codex task summary could
  arrive after a push and satisfy timestamp-only freshness before the new
  head's review. It had already merged as
  `0c4ae03fdbc7c7bf79b41c4fb31dd19db0c10e10` when detected; the automation was
  contained and corrected forward without an override.
- Automation-core PR #53 removed task/timestamp binding and normally merged as
  `42cf33992116b2a9845d4a060c363d7ea4ae1bda`. PR #54 preserved legitimate
  reaction-only clean delivery only for authenticated single-observed-head PRs
  and normally merged as `cbd154d34e150b1195b62be7cc0f0786e9ce4866`.
  PR #55 then made reaction-history errors fail closed and moved history lookup
  behind a trusted `+1` candidate; its exact head
  `8e61001b03e41090304db8f77f450901619e2295` passed 84 tests, exact-head CI
  `31710332461`, a clean Codex result, Gate `31710681603`, and normal Merge Bot,
  merging as `b91dade2be64c403b9b06c30d007e3a1b5f59b45`.
- Normal sync updated existing PR #98. Final exact head
  `012824a7b8d710cd4fd06245ac19afc27a4de09d` contained all seven workflows
  byte-identical to the final automation-core source plus only the two scoped
  handoff documents. Application CI `31711027957` passed; the fresh Codex
  result explicitly named that head and found no major issue; all prior P1/P2
  threads were resolved/outdated; Gate `31711220444` produced the green exact
  head check. Normal Merge Bot run `31711250348` performed the SHA-pinned merge
  as `73c2d3875e49aa038f0ed9790d610eb063e4e90d` with no owner merge or override.
- Final handoff-only PR #99 head
  `cffb38d44810d5e74ba592330b225f77a0186821` changed one documentation file,
  passed full CI `31711412191`, received a clean exact-head Codex result with
  zero review threads, and passed Gate `31711526953`. Normal Merge Bot run
  `31711572132` merged it as
  `d8b3251e49fb9512c4e872dd15663d3513a28d1e`, the final paywall-bot main SHA
  for this task. No TheMarker, Tech Feed IL, Telegram/Telegraph publishing,
  state, or Backfill logic was edited.

## Upstream production evidence

- Post-repair automation-core Gate run `31681859499` dispatched successfully with no expression-length parse failure.
- The watchdog was re-enabled only afterward. Real scheduled watchdog runs
  `31687590924`, `31692340712`, `31695724482`, and `31698865743` passed without
  a timestamped gate-dispatch parse error or Telegram alert/failure.
- Deterministic coverage proves repeated identical failure fingerprints are suppressed while genuinely new heads and error classes still alert once.
