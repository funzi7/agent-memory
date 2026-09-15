# automation-core handoff — 2026-09-15 UTC

## Outcome

The canonical structured Claude Code fallback review contract required by
`DEVELOPMENT_RULES_FULL` §12 is implemented centrally in `automation-core`. The
implicit rule `valid review == Codex review` is retired in favour of:

```
valid exact-head review evidence ==
  normal Codex evidence
  OR approved Claude fallback evidence when Codex is provably unavailable
```

The work is on PR <https://github.com/funzi7/automation-core/pull/56>, branch
`claude/canonical-fallback-review-evidence`, head
`1b3100a891e834d05ff35270c4f0e5acb66d02ef`. It is **not merged**: `main` is still
`b91dade2be64c403b9b06c30d007e3a1b5f59b45`.

## What was built

- **`workflows/claude-fallback-review.yml`** (new, synced) is the only
  sanctioned producer of fallback evidence. `workflow_dispatch` only, so GitHub
  restricts it to actors with write access. It refuses unless
  `CLAUDE_FALLBACK_REVIEW_ENABLED == 'true'`, unless dispatched from the default
  branch, unless `reviewed_head` is the live PR head, unless a trusted Codex
  code-review quota notice exists, if Codex already has a genuine result on that
  head, or if any trusted Codex P1/P2 is still active. It checks out nothing and
  derives `verdict` itself rather than accepting it as input.
- **Attestation** is one atomic marker, so a partially forged body contributes
  nothing:
  `<!-- claude-fallback-review:v1 run= attempt= pr= provider=claude_code_fallback
  reviewed_head=<40-char SHA> verdict=clean findings_found= findings_fixed=
  unresolved_p1=0 unresolved_p2=0 validation=passed/<ref>
  reason=codex_quota_unavailable -->`
- **One shared decision.** `codex-gate.yml`, `merge-bot.yml` and
  `claude-fallback-watchdog.yml` carry the identical
  `CANONICAL EXACT-HEAD REVIEW EVIDENCE` block verbatim. A test asserts the
  three inline copies are byte-identical and that `tools/review_evidence.js`
  mirrors their reason codes, so Gate and Merge Bot cannot drift.
- **Trust, all fail-closed.** Consumers require `github-actions[bot]` authorship
  AND re-authenticate the run+attempt through the Actions API: the run must be
  that workflow, event `workflow_dispatch`, `head_branch` the default branch,
  matching attempt, and the comment must fall inside the run window. Any lookup
  failure ignores the attestation. The whole evidence call is wrapped so it can
  never throw into the Gate's technical fail-soft branch, which publishes green.
  Merge Bot and the watchdog pass their GITHUB_TOKEN `roPage` reader for the
  Actions read, because their default client is `AUTOMATION_PAT`.
- **Exact-head binding.** Any new commit invalidates the attestation; a
  previous-head attestation fails.
- **Quota episodes.** Route A: the decline landed on this head epoch. Route B:
  the decline predates this head epoch, Codex has posted nothing since, and the
  attestation happened within 24 h of it — required because the connector goes
  silent on later pushes rather than re-declining. Any genuine Codex activity
  newer than the newest notice closes the episode; no authenticated head epoch
  means no episode at all.
- **Nothing existing weakened.** Findings are evaluated before any head signal,
  so a fallback never bypasses a real Codex P1/P2; a fallback declaring
  unresolved P1/P2 blocks; a returning Codex result on the current head is the
  authority. Provenance is truthful and never claims "Codex reviewed" for a
  Claude review. `codex-p1-acknowledged`, owner override and reaction
  acknowledgement keep their own semantics and are never reused for fallback.
- The watchdog counts an accepted fallback as a review signal and dispatches the
  gate while the verdict is still pending — bounded by the verdict's age, not by
  ordering — so the green verdict gets published without one transient pending
  verdict suppressing the head forever or a persistent disagreement
  re-dispatching every tick.
  It posts no Codex review request and no missing-review alert on that path, and
  once the verdict is green its own `isCandidate` test already excludes the head,
  so it stops on its own rather than re-dispatching every tick.
- **Outdated is not resolved.** An outdated thread nobody resolved still holds a
  live Codex P1/P2. A fallback performs no re-examination of it, so it may never
  clear one — enforced on every evaluation by all three consumers, not only when
  the attestation is minted, because a resolved thread can be re-opened and a
  late Codex finding can arrive already-outdated, both without a new commit.
- Docs: `docs/adr/0001-canonical-review-evidence.md` (new ADR), README operator
  section and repository-variable table, `LOOP_STATE.md`, `handoffs/CONTEXT.md`,
  `handoffs/loop-build.md`.

## Review outcome

Three independent Opus review passes, none by the implementing agent.

- Pass 1: no P1, six P2s — all fixed.
- Pass 2 (mutation-tested by the reviewer): three further P2s — producer-side
  enforcement of the outdated-thread rule was not sufficient; the
  run-authentication hardening was untested; and the wiring that consumes the
  decision was untested, which mattered most (mutating the gate to
  `currentHeadSignal: true` greened every PR with the whole suite still
  passing). All fixed, and the Route A no-TTL decision was confirmed correct.
- Pass 3: confirmed by execution that both post-mint attack sequences are
  blocked end to end and that the watchdog rewrite neither suppresses a head
  forever nor re-dispatches every tick. It found no P1 and two coverage
  regressions rather than live holes — a silently deleted producer test harness
  and two new outdated-thread helpers shipped untested — both fixed and
  mutation-verified.

Twenty-two mutations that previously survived are now killed by the suite,
re-verified locally on scratch copies with the real tree untouched:
`currentHeadSignal: true` (which alone would have greened every PR), disabling
the gate's blocking branch, disabling Merge Bot's three evidence guards,
removing the run status/conclusion/default-branch/edited-comment checks,
removing the outdated-finding guard and its lazy resolver, the one-character
`!` slip in either new outdated-thread helper, reverting the
severity-carrying-notice classification, and removing every producer
precondition — the trusted-quota requirement, the live-head check, unresolved
P1/P2, the default-branch guard, the outdated-thread refusal, and the
truncated-thread guard. That last one has no consumer counterpart: every thread
query caps comments at 100, so a Codex P1 at comment #101 is invisible
system-wide and only the producer fails closed on it.

## Validation actually run

- 127 deterministic tests pass (43 new in `tests/test_review_evidence.js`):
  the full mandatory acceptance matrix; the paywall-bot **PR #103** regression
  built on that PR's real timestamps (Codex rounds 01:53:36Z/02:01:39Z/02:09:43Z
  on earlier heads, usage-limit notices from 02:13:50Z, final head
  `d068d977a700093affc47a46aa2b1610fe72248f` committed 09:50:19Z), passing only
  through the valid structured path and failing under each missing requirement;
  the **shipped inline block** from all three consumers executed directly across
  the whole trust matrix; the **producer script** executed against its refusal
  matrix; and proof that the Codex-only decision is unchanged when the policy
  switch is off.
- `bash scripts/validate.sh` green: every tracked YAML parses, all synced
  source/`.github` mirrors byte-identical, all 59 `github-script` bodies
  expression-safe and syntax-checked.
- `actionlint` 1.7.7 reports zero findings across every workflow, including the
  new producer — the real GitHub Actions validation.
- `git diff --check` clean. Exact-head repository CI green.
- Read-only real-consumer check against OptionsProfitTracker PR #19's actual
  comment history: the shipped block finds its four genuine connector
  usage-limit notices and zero Codex activity and returns `no_attestation`;
  given a hypothetical exact-head attestation it returns `stale_quota_evidence`
  because every notice predates the current head; adding a current-head notice
  flips it to `structured_fallback_clean`.

## Defects caught during self-review and fixed

- The gate's reworded pending check title would have broken the watchdog's exact
  `PENDING_TITLE` match, silently disabling the late-signal sweep for pending
  PRs. The original title is restored and a test now pins the two together.
- `tools/review_evidence.js` did not short-circuit fallback evaluation on a
  current-head Codex signal the way the inline block does, so a stale
  attestation could have blocked a Codex-reviewed head in the mirror only.

## Review provenance

`review_provider = claude_code_fallback`, `reason = codex_quota_unavailable`.

Codex posted a genuine usage-limit notice on PR #56 at 2026-09-15T12:49:40Z, so
normal Codex review is unavailable right now. The change was reviewed by an
independent Opus reviewer separate from the implementing agent. The new central
mechanism is explicitly **not** claimed as authoritative for its own PR: it did
not exist before that PR, and `automation-core` has not set
`CLAUDE_FALLBACK_REVIEW_ENABLED`.

## What is NOT done — physically pending

- **PR #56 is not merged.** Its Gate is red with
  `🟡 Waiting for Codex review` because Codex cannot review this head while its
  quota is exhausted, and fallback is not enabled on automation-core. Merge Bot
  will not touch it either: it is a `claude/` branch touching protected paths,
  so `mayAutoMergeProtectedPaths` is false and it is not an auto-merge candidate
  without an explicit `automerge` label. It needs the owner, or Codex quota to
  return.
- **No production validation of the new code paths.** `pull_request_target`
  loads Codex Gate from the base branch, so the gate run on PR #56 executed
  main's OLD code. The new gate/merge-bot/watchdog behaviour takes effect only
  after merge. No fallback attestation has been minted or honoured in
  production.
- **Consumer sync not performed.** The sync workflow clones `automation-core`
  main, so syncing before the merge would deliver the old workflows. Repos with
  `sync-automation-core.yml`: `paywall-bot`, `OptionsProfitTracker`,
  `thai-rent-finder`, `agent-memory`. After merge, dispatch
  `sync-automation-core.yml` on each; the normal sync PR flow applies and no
  consumer feature PR should be force-merged.
- **Per-repo opt-in still required.** Actions variables are not synced. Until a
  repository sets `CLAUDE_FALLBACK_REVIEW_ENABLED=true`, it keeps the Codex-only
  contract unchanged.
- **OptionsProfitTracker PR #19 cannot pass yet.** Its newest trusted quota
  notice is 2026-09-09T17:45:15Z, while its current head
  `074de86e52f2a168b89dc21ff32a851570f1b144` was pushed 2026-09-14T19:45:26Z, so
  the notice predates the head epoch (Route A fails) and is ~6 days old (Route B
  window is 24 h). It also carries permanent `no-automerge` plus `needs-owner`.
  A pass requires either a current-head trusted Codex quota notice followed by a
  fresh exact-head Claude fallback review and attestation, or a normal Codex
  review once quota returns. Do not claim it passes before that evidence exists.

## Operating invariants to preserve

- Authoritative policy stays inline in trusted workflow YAML; `tools/*.js` are
  pure mirrors for deterministic tests only. Workflows must never load
  executable policy from a PR-controlled checkout.
- No direct `${{ }}` inside `github-script` bodies; values cross via `env`.
- Actions/Checks reads run on GITHUB_TOKEN, not `AUTOMATION_PAT`.
- Fail closed on every API/history lookup relevant to authority, and never let a
  new code path reach the Gate's technical fail-soft green.
- Do not weaken exact-head binding, reaction-history hardening, protected-path
  provenance, or SHA-pinned merge revalidation.
