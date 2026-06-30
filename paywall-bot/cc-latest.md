verify: #55 + #56 merged into main; gate/bridge/claude fixes present on main (READ-ONLY)

> gh/curl-on-raw unavailable for a private repo; captured via GitHub REST (pulls / contents@main / commits / actions). Verbatim.

## 1. #55 + #56 merge state
```
#55 state=closed merged=true merged_at=2026-06-30T10:00:50Z base=main :: Drop foreign-script-dominant subtitle candidates (Chinese-subtitle guard)
#56 state=closed merged=true merged_at=2026-06-30T10:04:43Z base=main :: chore(automation): sync from automation-core
```

## 2. are both merge commits on main's first-parent history?
```
git log main (newest first) contains:
  4a1e01b  Merge pull request #56 from funzi7/chore/sync-automation-core   <- main HEAD
  9ab8ec9  Merge pull request #55 from funzi7/claude/subtitle-foreign-guard
#56 merge 4a1e01b -> on main: YES (it IS main HEAD)
#55 merge 9ab8ec9 -> on main: YES (reachable on main, 1 commit behind HEAD)
(both merged=true, base=main → on main)
```

## 3. gate+bridge+claude fixes actually on main (read .github/workflows @ main = sha 4a1e01b)
--- codex-gate.yml (job name / check producer / MAX_ATTEMPTS / concurrency / output) ---
```
concurrency:
  group: codex-gate-pr-${{ github.event.pull_request.number || github.event.inputs.pr_number || github.event.issue.number || github.run_id }}
  cancel-in-progress: true
  checks: write
jobs:
  codex-gate:                      <- job KEY is `codex-gate` (not check-codex-status)
    name: check-codex-status       <- job DISPLAY name = check-codex-status
            const MAX_ATTEMPTS = 3;
            async function publishGateCheck(headSha, conclusion, title, summary) {
              const mine = existing.find((c) => c.name === 'check-codex-status');
              await github.rest.checks.update({ ...body, check_run_id: mine.id });
              await github.rest.checks.create({ ...body, name: 'check-codex-status', head_sha: headSha });
            output.title states: '🟢 Reviewed — clear' / '🔴 Active Codex P1/P2' / '🟡 Waiting for Codex review'
```
--- codex-auto-fix.yml (does the @claude fix body inline findings?) ---
```
          FINDINGS_DIGEST: ${{ steps.check_review.outputs.findings_digest }}
            const digest = (process.env.FINDINGS_DIGEST || "").trim();
            core.setOutput("findings_digest", digest);
            core.setOutput("finding_count", String(digestBullets.length || findingN));
            ... so the findings are inlined below — apply a fix for each:\n\n---\n${digest}\n---
            for (const c of reviewComments) { if (...isP12(c.body) && onHeadDate(c.created_at)) ... `- \`${loc}\` — ...` }
```
--- claude.yml (max-turns on main) ---
```
          claude_args: |
            --max-turns 50
            --allowedTools "Read,Glob,Grep,Edit,Write,MultiEdit,Bash(git:*),Bash(python:*),...,Bash(gh pr:*),Bash(gh issue:*),Bash(actionlint)"
```

## 4. CI on the LATEST main commit
```
main head = 4a1e01b96f0a7e81db82b200a2104783a0151170
CI (ci.yml) run on 4a1e01b: 2026-06-30T10:04:46Z push completed/success
(prior main heads 9ab8ec9 / 527d41b / b0774a5 also push completed/success)
```

## 5. any OPEN PRs left + needs-owner anywhere?
```
open PRs: (none — 0 open)
open issues labeled needs-owner: (none — 0)
```

## VERDICT
- (a) both #55 + #56 merged onto main: **YES** (both merged=true, base=main; merge commits 9ab8ec9 and 4a1e01b are on main's first-parent history; 4a1e01b is main HEAD).
- (b) codex-gate.yml on main has job != check-codex-status + explicit check + MAX_ATTEMPTS=3 + concurrency: **YES** — job KEY = `codex-gate`; explicit `check-codex-status` published via `checks.create`/`checks.update` (publishGateCheck, head-pinned, with 🟢/🔴/🟡 output.title); `MAX_ATTEMPTS = 3`; top-level `concurrency` (codex-gate-pr-…, cancel-in-progress:true) all present. **NOTE/CAVEAT:** the job also carries `name: check-codex-status`, so the JOB-STATUS check-run is ALSO named `check-codex-status` alongside the explicit one — i.e. two same-named check-runs on the head (the duplicate fix #11's rename aimed to avoid). merge-bot's latest-per-name dedupe still copes, but this is worth an upstream follow-up.
- (c) codex-auto-fix.yml on main inlines findings: **YES** — `FINDINGS_DIGEST` env + `findings_digest` output + the "…inlined below — apply a fix for each: --- <digest> ---" body, built from `reviewComments`/`reviews` (Codex + P1/P2 + onHead) are all present.
- (d) claude.yml max-turns on main = **50** (broad allowedTools present).
- (e) latest main CI conclusion = **success** (4a1e01b → CI push completed/success).
- (f) leftover open PRs = **none** (0 open PRs; 0 needs-owner issues). The loop is fully drained.
