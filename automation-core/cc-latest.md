# automation-core — latest Claude Code status

## fix #25 — cost trim (drop the gate self-rerun poll + per-note trigger) + cloud-ping sanitize

**main commit `009fc72`** (direct to main, ONE commit, author funzi7). Two files changed
(`codex-gate.yml`, `claude-fallback-watchdog.yml`); **`codex-auto-fix.yml` deliberately UNTOUCHED** (its
`pull_request_review_comment` trigger is load-bearing). Both changed workflows byte-identical across
`workflows/` ↔ `.github/workflows/` (gate `25197d6`, watchdog `57907a1`); `yaml.safe_load` + actionlint
pass on all four copies; `node --check` on all 4 script bodies.

### Measurements that drove it (TRF PR #88)
A live wave = **30 runs ≈ 15 real runner-min**, of which the **Codex Gate burned ~10–12** — mostly runs
that slept **90 s** inside the self-rerun poll or got cancelled after the runner had already started.
Separately, the codex-cloud ping **copied the bridge's full `@claude fix` body**, and that embedded
`@claude` mention **RE-TRIGGERED the Claude fixer on the cloud ping itself** (observed: `claude[bot]` 👀
+ a no-op + a 👎 on the `@codex` comment).

### Part A — codex-gate.yml: drop the per-inline-note trigger
Removed `pull_request_review_comment` (types [created, edited, deleted]) from `on:`. **Kept:**
`pull_request` (opened/synchronize/reopened), `pull_request_review`, `issue_comment` (fix-Summary must
re-trigger), and `workflow_dispatch` + its `pr_number` input (the watchdog sweep and silent-sync grace
DISPATCH INTO it — verified by grepping the watchdog). Rationale: the verdict is evaluated against the
WHOLE head every run; a review already fires `pull_request_review`, and each of its N inline notes
additionally fired a gate run that concurrency mostly cancelled after the runner started (pure cost).

### Part B — codex-gate.yml: delete the self-rerun poll entirely
Deleted `MAX_ATTEMPTS`, `attemptsOnHead`/`listWorkflowRuns`, `scheduleRerun` + **all 5 call sites**, the
`runHeadSha`/`runningOnHead`/`getWorkflowRun` logic, the `NEEDS_RERUN` env plumbing, and **both shell
steps** ("Sleep before head-targeted rerun" = the 90 s `sleep`, and "Trigger head-targeted self-rerun via
workflow_dispatch"). **Dropped the `actions:` permission** (the poll was its only consumer). The 🟡
pending summary is rewritten (no "rerun attempt N/3") to point at the watchdog sweep + manual dispatch +
override label. The poll's two historical jobs are covered elsewhere: a **late 👍** → the **watchdog
sweep** (fix #18, ≤~1h); a **silent trusted sync** → **grace-green** (fix #21). The `workflow_dispatch`
ENTRY handling (pr_number → head) is left fully intact.

### Part C — claude-fallback-watchdog.yml: sanitize the copied digest
`findingsDigest()` now returns ONLY the findings section — sliced after the bridge's fixed lead-in
"apply a fix for each:" (else after the first `---` line, else the full body) — and **sanitizes** it:
strips every `<!-- ai-loop:v1 … -->` marker and replaces `/@claude/gi` → `claude`. The final cloud
comment carries **exactly one mention (`@codex`), zero `@claude`, and only its own
`agent=codex-cloud state=requested` marker** — so it can't re-trigger the Claude fixer or poison
marker-parsing.

### Validation
`yaml.safe_load` + actionlint on both copies of both files; `node --check` on all 4 script bodies; greps
— gate `on:` = `[pull_request, pull_request_review, issue_comment, workflow_dispatch]` (NO
`pull_request_review_comment`); **ZERO** `MAX_ATTEMPTS` / `scheduleRerun` / "Sleep before head-targeted
rerun" anywhere in the gate; the watchdog digest has the marker-strip + `@claude/gi` replacement;
`codex-auto-fix.yml` untouched (git status = only the 2 workflows + 3 handoffs); **ZERO**
`require('@actions/github')` / `__original_require__` / `getOctokit`; `git hash-object` equal per file.

**Handoffs updated in the same commit:** `handoffs/CONTEXT.md` (gate re-check model — poll gone, triggers
narrowed, ~15→~4–6 min; watchdog digest slice+sanitize + the cross-trigger incident), `LOOP_STATE.md`
(codex-gate + watchdog fix #25 entries; the old self-rerun bullet marked REMOVED), `handoffs/loop-build.md`
(dated entry citing the #88 measurements + the cloud-ping re-trigger).

**Next:** expected downstream wave cost **~15 → ~4–6 runner-min** — no 90 s sleeps, fewer gate runs, and
the cloud ping no longer wakes the Claude fixer. Propagates downstream on the next daily sync.
