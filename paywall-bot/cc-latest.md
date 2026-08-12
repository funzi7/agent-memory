# paywall-bot handoff — 2026-08-12 UTC

## Outcome

The self-healing rollout is intentionally **not complete**. Do not merge the open sync PR until central automation-core finishes review and a new sync replaces its head.

## Verified repository state

- GitHub main: `9ec7a64075969ddae9d150f56c3ed5ddf397259e`.
- The main movement from `c18971779d05bc81a822092cbe782ce5c9deaff7` was an unrelated automated `state/techfeedil.json` update. This infrastructure task did not mutate or publish Tech Feed IL/TheMarker production state.
- PR #93 is merged. Former head: `aae1c20698509d3cf52a4e9f68cc7a24feb44383`; merge commit: `8e2e3a24496584c74e05e90714ab130309f5f5b8`.
- PR #89 (`chore(automation): sync from automation-core`) is CLOSED, not merged. Stale head: `2dc8cd5028fac0add06355fd10b84a463e118c5e`. The factual close comment is <https://github.com/funzi7/paywall-bot/pull/89#issuecomment-5258872850>.
- The old #89 branch was deleted. The current `chore/sync-automation-core` branch belongs to fresh PR #94, as allowed by the cleanup rule.

## Fresh sync PR #94

- URL: <https://github.com/funzi7/paywall-bot/pull/94>
- Current head: `58e675d2337d092c85d0518a0a43eac788583c74`.
- State: OPEN, non-draft, mergeable.
- Diff contains only five synced automation workflows: Claude, Codex auto-fix, Codex backup, Codex Gate, and Merge Bot/watchdog infrastructure; no production application/state file.
- At creation, all seven configured synced workflows were byte-identical to automation-core main `c6708e2d9c58179e451d3a7cb5be0baa4f283767`.
- Exact-head `test-message-format` CI is green, but authoritative `check-codex-status` is red.
- Active trusted P1 thread: `PRRT_kwDOSZRyh86YbmH1` (“Keep protected paths guarded for bot-authored owner PRs”). Do not resolve it until the final central provenance fix has merged and been synced into #94.
- Do not merge #94 at its present head.

## Central dependency / blocker

- automation-core PR #37 proved the requested live behavior and auto-merged exact reviewed head `b912f6e6ea5b6721589c8d87edb23fafe2977080` as squash commit `c6708e2d9c58179e451d3a7cb5be0baa4f283767`.
- Merge Bot run `31555184597` logged protected owner review, cleared `needs-owner` + `needs-owner-auto`, merged, and deleted the branch.
- A downstream Codex review then exposed PAT-authorship ambiguity for Claude-created protected changes.
- Central corrective PR #38 is open at `5933fa16cc48ad6e2bd2d68fcf6aac2c916f089c`. Automation Core CI run `31558633148` is green and all prior P1/P2 threads are resolved.
- The external Codex reviewer refused the required current-head review with an account usage-limit message on 2026-08-12 02:59 UTC. Therefore no authoritative exact-head gate exists for #38, and #38 was correctly left open with `needs-owner` + `needs-owner-auto`.

## Safe resume sequence

1. Restore/renew Codex code-review capacity.
2. Request `@codex review` on automation-core PR #38 and require a verdict explicitly bound to `5933fa16cc48ad6e2bd2d68fcf6aac2c916f089c` (or its then-current head), zero active P1/P2 threads, green Automation Core CI, mergeability, and green exact-head `check-codex-status`.
3. Let central Merge Bot auto-merge. Do not use an override merely to bypass the missing review.
4. Trigger `Sync from automation-core` in paywall-bot. It should update fresh PR #94; it must not resurrect #89.
5. Verify all seven sync files match central and only intended automation files changed. Resolve #94 thread `PRRT_kwDOSZRyh86YbmH1` only after its fix is present.
6. Request a fresh exact-head Codex review, require CI/gate green and no active P1/P2, then let the newly synced Merge Bot close the loop. Use the authorized one-time rollout merge only if bootstrap timing alone prevents the old downstream bot, and pin it to the exact reviewed SHA.
7. Verify downstream main contains the synced Merge Bot. Do not run Backfill or mutate/publish production state.

## Local state

- `/root/work/paywall-bot` is on clean `main` at `9ec7a64075969ddae9d150f56c3ed5ddf397259e` after a normal fast-forward.
