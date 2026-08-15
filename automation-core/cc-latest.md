# automation-core handoff — 2026-08-13 UTC

## Outcome

The malformed production Codex Gate, repeated watchdog Telegram alerts, CI Doctor noise, and the remaining Claude credential-isolation weaknesses were repaired. The normal exact-head Codex Gate and Merge Bot flow is active again. The downstream paywall-bot automation rollout also completed through its normal Merge Bot.

## Emergency bootstrap repair

- Bootstrap PR: <https://github.com/funzi7/automation-core/pull/40>
- Exact CI-validated head: `1ce6f1244801e467bdec196f04f1d557e2ca3ecc`.
- Squash merge: `fd16f6ad875726386f4f7c029993639cafebaa01`.
- Exact-head Automation Core CI run `31681764445` passed. This was the authorized one-time bootstrap exception because the default-branch Gate itself could not be parsed; the exact diff was independently re-read before its SHA-pinned merge.
- Root cause: a roughly 25 KB `actions/github-script` `script: |` scalar directly contained `${{ steps.prs.outputs.numbers }}`. GitHub template expansion made the generated expression exceed the platform's 21,000-character expression limit before jobs could be created. The PR-number JSON now crosses the step boundary through `env`, while JavaScript reads `process.env.PR_NUMBERS_JSON`.
- Regression coverage parses every tracked workflow YAML, including synced source/mirror pairs and hub-only workflows, extracts every `actions/github-script` body, and rejects every direct GitHub-expression interpolation in script bodies. This covers both the original large-expression failure and quoted/unquoted string or type injection; values must travel through `env`. Source and `.github` mirrors remain byte-identical.
- The watchdog now records a trusted durable `ai-loop` marker keyed by repository, PR, exact head, operation, and normalized error fingerprint for gate-dispatch, update-branch, and backup-dispatch failures. The first material failure still logs and alerts once; identical scheduled retries log persistence but do not repeat Telegram or duplicate the marker. A new head or materially different error can alert once again.
- CI Doctor now identifies internal automation by authoritative workflow path as well as display name. A parse-failed run surfaced as `.github/workflows/codex-gate.yml` can no longer open a `claude-fix` issue, while product CI remains eligible.

## Production verification

- Manual Codex Gate run `31681859499` dispatched successfully after the bootstrap merge and did not reproduce `Exceeded max expression length 21000`.
- Claude Fallback Watchdog workflow ID `302663752` was re-enabled only after that proof.
- Manual post-enable watchdog runs `31683051350` and `31683055505` passed.
- Four later real scheduled ticks, runs `31687590924` at 09:39 UTC,
  `31692340712` at 10:43 UTC, `31695724482` at 11:29 UTC, and
  `31698865743` at 12:11 UTC, passed. Their jobs completed without an
  expression-length error, gate-dispatch failure, Telegram alert, or Telegram
  delivery failure.
- Deterministic tests prove an identical PR/head/error fingerprint cannot alert repeatedly and that a new head or new normalized error remains alertable.
- Issue #39 received a factual repair comment and was closed only after the workflow parsed and dispatched. Manual CI Doctor runs `31682946331` and `31683006262` passed, and no equivalent internal-workflow issue was recreated.

## Protected provenance and PR #38

- The repaired Gate initially treated an old Codex capacity notice as a review signal. That race let the old PR #38 head `5933fa16cc48ad6e2bd2d68fcf6aac2c916f089c` merge prematurely as `cdf4c94528fdfd81ab00742c549355912355bcc1` before the intended credential isolation was present. Automation workflows were temporarily disabled for containment; no override acknowledgement was used.
- Forward-repair PR #41 merged normally as `dd9a9de615eb0613e314b26e989d82375c808e66`. In Issue/new-PR mode, checkout uses `github.token` with `persist-credentials: false`; the model receives only `Read`, `Glob`, and `Grep`; credentials are scrubbed before the model step; and `AUTOMATION_PAT` exists only in trusted post-model PR creation. Existing-PR fixer mode remains separately scoped to an already approved same-repository branch.
- Follow-up exact-head Codex findings were fixed rather than acknowledged and merged normally through PRs #42–#51. The final sequence includes capacity-notice rejection, protected provenance binding, trusted exact-head/thread authority, backup context hardening, label-race hardening, queued Gate epoch/final merge-candidate revalidation, and top-level Claude digest binding.
- Final relevant automation-core merges: #42 `3103c6be6bc66cf949e6d67c33960bce882101f0`, #43 `ed5d1a2a79015da7f158f1167bde00329808eb3d`, #44 `47975163b66e48ab32f7c0d81aeb4aa23bc9cf02`, #45 `0c259d4d16286bc0b609dc36805071fee08c57fb`, #46 `7e662c9409a9e6f4405c9bfa06f14b6dd0b3d700`, #47 `16fbf2d1e7c363dc7875c0e030a57c3ec7856d64`, #48 `fd92aece2472aacdb8c1540da2f0ae8378f4a052`, #49 `fae994889c4878813319192254145ecaf6d15e96`, #50 `7e601fd06d9d5cc5038702f76ff62e2b5c54101a`, and #51 `b3cd345e35d0316773925c88468f1e4a6460af22`.
- Every forward code correction passed full repository CI, received a trusted review bound to its exact head, had all real P1/P2 findings fixed and threads resolved, passed the authoritative Gate, and was squash-merged by the normal Merge Bot. GitHub Codex review capacity was available during the recovery despite the old stale quota notice.

## Downstream rollout

- Normal sync continuously updated existing paywall-bot PR #94; no replacement PR was needed.
- Final #94 head `5d65f205708435aab09ce03ace5880c30b342293` contained exactly the seven configured automation workflows and no application/state changes.
- Exact-head CI run `31699982535`, a fresh clean Codex review, zero unresolved P1/P2 threads, and authoritative Gate run `31700426352` all passed.
- Normal Merge Bot run `31700719028` squash-merged #94 as `2575f0f2b16c12ebb9b9173e8c9a8248ab529ebe`. There was no owner click and no `codex-p1-acknowledged` override.

## Subsequent exact-head hardening and final sync

- PR #52 expanded the expression validator from the original large-scalar
  regression to every direct `${{ ... }}` occurrence in all tracked
  `github-script` bodies, including hub-only workflows. Its exact reviewed head
  was `1edbebb1a7c16f2110c94410df73f4cd49c09add`; normal Merge Bot merged it as
  `961b51d9ff23edd215ff026d8dc0845f9a8124a9`. The downstream expression sync
  PR #96 used head `d29810b1c2f3e0a4bf425aa364cf3bbfec99aa3d`,
  passed Gate run `31705628966`, and normally merged as
  `cb5cc5d87f335963e1f80db54de11fe706e3f6de`.
- Paywall documentation PR #97 exposed another asynchronous race: an old-head
  Codex task summary arrived after a new push, and timestamp-only binding let
  the new head turn green before its own review. It had already merged as
  `0c4ae03fdbc7c7bf79b41c4fb31dd19db0c10e10` when detected. Merge Bot was
  disabled temporarily for containment; no override was used.
- PR #53 removed task-summary and timestamp-only freshness. Its exact head
  `8a361a5da4c12d916cb5973e945af24c3f1ad5a1` passed full CI and clean Codex
  review, Gate runs `31707513978` / `31707580139`, and normally merged as
  `42cf33992116b2a9845d4a060c363d7ea4ae1bda` after Merge Bot was safely
  re-enabled.
- Review then identified a legitimate reaction-only clean Codex delivery mode.
  PR #54 permits that signal only when authenticated Gate marker/run history
  proves the PR has exactly one observed head; after any head transition an
  immutable commit-bearing result remains mandatory. Its exact head
  `fec26d450f9fcfd5440e7ba39cee17f594fd82c2` passed full CI, exact-head Codex,
  Gate `31709584430`, and normally merged as
  `cbd154d34e150b1195b62be7cc0f0786e9ce4866`.
- Review of the downstream sync found that a rejected reaction-history lookup
  could bubble to the broad technical fail-soft path. PR #55 performs history
  lookup only for an authenticated trusted `+1` candidate and makes lookup
  errors return fail-closed `false`, leaving immutable evidence and active
  threads authoritative. Its exact head
  `8e61001b03e41090304db8f77f450901619e2295` passed all 84 deterministic tests,
  every YAML/script/parity check, exact-head CI `31710332461`, a clean Codex
  result with zero threads, Gate `31710681603`, and normal Merge Bot. It merged
  as `b91dade2be64c403b9b06c30d007e3a1b5f59b45`, the final automation-core main
  SHA for this task.
- Normal sync updated paywall-bot PR #98. Final head
  `012824a7b8d710cd4fd06245ac19afc27a4de09d` contained the seven byte-identical
  workflows plus only scoped documentation, passed application CI
  `31711027957`, received a clean explicitly bound Codex result with all three
  prior findings resolved/outdated, and passed Gate `31711220444`. The
  SHA-pinned Merge Bot merge request on run `31711250348` coincided with a
  server-side successful merge while its client/API call surfaced a 502 (the
  run logged `#98: unexpected merge error (502), skipping this PR: Server
  Error`); GitHub independently recorded #98 merged at `2026-08-13T14:40:09Z`
  as `73c2d3875e49aa038f0ed9790d610eb063e4e90d`, and the immediately following
  Merge Bot run found no auto-merge candidate because #98 was already merged.
  Run `31711250348` therefore must not be described as having received a normal
  successful merge response. Final one-file handoff PR #99
  passed CI `31711412191`, clean exact-head Codex and Gate `31711526953`; normal
  Merge Bot run `31711572132` merged it as
  `d8b3251e49fb9512c4e872dd15663d3513a28d1e`.

## Current operating state

- The Codex Gate, Claude Fixer, Claude Fallback Watchdog, and Merge Bot workflows are active in automation-core and paywall-bot.
- `no-automerge` remains permanent; manual or unknown `needs-owner` remains a hard stop; only a proven transient `needs-owner` plus `needs-owner-auto` pair may clear after fully green exact-head validation.
- Bot/Claude protected-path PRs remain fail-closed unless their trusted workflow provenance is cryptographically bound to the exact expected context. Trusted sync still requires its exact signature. Merge remains SHA-pinned and revalidates the final candidate.
- Do not weaken these invariants to handle capacity notices, stale reviews, queued Gate runs, or label races.
