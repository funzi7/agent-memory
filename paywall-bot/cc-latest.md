diagnostic: codex-gate always-red + over-running on #51/#49 (READ-ONLY)

> gh unavailable; captured via GitHub REST (pulls/check-runs/reviews/actions). Verbatim.
> NB: by capture time BOTH PRs are already MERGED — #51 merged 2026-06-29T11:45:56Z,
> #49 merged 2026-06-29T11:44:23Z. The "always-red" is the fail-closed gate flicker
> on early runs before Codex reviewed the head; the LATEST check-codex-status on each
> went green, which is why they merged.

## PR #51 — head c8c1a521a3b55de97bbe584418817bc16bccaf95 (chore/sync-automation-core, MERGED)

### A. Codex Gate (`check-codex-status`) check-runs on this head — count, conclusions, SUMMARY
```
count(check-codex-status)=3
success :: (output.title="") :: (output.summary="")   started 2026-06-29T11:41:38Z  [LATEST]
failure :: (output.title="") :: (output.summary="")   started 2026-06-29T11:39:55Z
failure :: (output.title="") :: (output.summary="")   started 2026-06-29T11:38:14Z
(also on head: test-message-format = success)
```
The Codex Gate's custom check sets **NO output text** — output.title/summary are
empty strings on the failing runs (confirmed via the single-check-run endpoint for
id 84042860506). So the "red" carries no message; it is purely the fail-closed
state. The LATEST run is success → the PR was mergeable and merged.

### B. Did Codex (chatgpt-codex-connector) REVIEW this head? (last 3 reviews)
```
(none — Codex posted ZERO reviews on PR #51)
```
Codex never reviewed the sync PR. The gate still went green on its latest run
(via the wait-for-first-review escape / a non-review signal), and #51 was merged.

## PR #49 — head 2ed796e9becbd7c387939e8f1ccec7b5af11ccd4 (claude/quality-rolling-issue, MERGED)

### A. Codex Gate (`check-codex-status`) check-runs on this head — count, conclusions, SUMMARY
```
count(check-codex-status)=6  (across the head's check-suites)
success :: (output.title="") :: (output.summary="")   started 2026-06-29T11:45:59Z  [latest tier]
success :: (output.title="") :: (output.summary="")   started 2026-06-29T11:45:55Z
success :: (output.title="") :: (output.summary="")   started 2026-06-29T11:45:55Z
success :: (output.title="") :: (output.summary="")   started 2026-06-29T11:45:43Z
success :: (output.title="") :: (output.summary="")   started 2026-06-29T11:45:43Z
failure :: (output.title="") :: (output.summary="")   started 2026-06-29T11:44:17Z  (earlier, stale)
(plus an earlier head's failure 11:42:36 + test-message-format successes; claude job = failure)
```
Same as #51: empty output.title/summary (confirmed via id 84043638647). Latest
runs are success → merged.

### B. Did Codex REVIEW this head? (last 3 reviews, codex actor)
```
COMMENTED commit=e62a3f548f60ae21b77f2ded040d7eb3acca2857 at=2026-06-29T08:27:15Z
COMMENTED commit=540d29a173b7d872694819f0bfdde44bbd795b91 at=2026-06-29T11:30:51Z
COMMENTED commit=2ed796e9becbd7c387939e8f1ccec7b5af11ccd4 at=2026-06-29T11:45:36Z
```
Codex DID review #49 — including the final head `2ed796e9be` at 11:45:36 (a
"💡 Codex Review" with no P1/P2 → clean), so the gate went green and the PR merged.
(Codex review is still working here — OpenAI quota lapse hit codex-ACTION/backup,
not Codex review on these PRs.)

## C. codex-gate run volume (over-running?)

```
codex-gate.yml total_count (all-time) = 275
recent window returned = 30 runs
by (event, conclusion):
  pull_request           : failure x4
  pull_request_review    : success x8
  pull_request_review_comment : success x8
  workflow_dispatch      : success x4, failure x5
  issue_comment          : success x1
```
Newest 30 (createdAt event conclusion):
```
2026-06-29T11:45:53Z workflow_dispatch success
2026-06-29T11:45:52Z pull_request_review_comment success
2026-06-29T11:45:52Z pull_request_review success
2026-06-29T11:45:41Z pull_request_review_comment success
2026-06-29T11:45:40Z pull_request_review success
2026-06-29T11:44:12Z workflow_dispatch failure
2026-06-29T11:42:33Z pull_request failure
2026-06-29T11:42:07Z pull_request_review_comment success
2026-06-29T11:42:07Z pull_request_review success
2026-06-29T11:41:32Z workflow_dispatch success
2026-06-29T11:40:19Z pull_request_review_comment success
2026-06-29T11:40:18Z pull_request_review success
2026-06-29T11:39:50Z workflow_dispatch failure
2026-06-29T11:38:09Z pull_request failure
2026-06-29T11:31:57Z workflow_dispatch success
2026-06-29T11:31:04Z pull_request_review_comment success
2026-06-29T11:31:04Z pull_request_review success
2026-06-29T11:30:55Z pull_request_review_comment success
2026-06-29T11:30:55Z pull_request_review success
2026-06-29T11:30:16Z workflow_dispatch failure
2026-06-29T11:28:36Z workflow_dispatch failure
2026-06-29T11:26:55Z pull_request failure
2026-06-29T09:09:28Z issue_comment success
2026-06-29T08:27:29Z pull_request_review_comment success
2026-06-29T08:27:29Z pull_request_review success
2026-06-29T08:27:23Z workflow_dispatch success
2026-06-29T08:27:19Z pull_request_review_comment success
2026-06-29T08:27:19Z pull_request_review success
2026-06-29T08:25:43Z workflow_dispatch failure
2026-06-29T08:24:03Z pull_request failure
```

### Read
- **Always-red illusion:** every `pull_request` (push) run and the FIRST
  `workflow_dispatch` self-rerun conclude **failure** (fail-closed: Codex hasn't
  reviewed the new head yet). Once Codex reviews, the `pull_request_review` /
  `pull_request_review_comment` runs + a later self-rerun conclude **success**.
  The PR shows red until the latest run flips green — exactly the stale-early-red
  pattern (the merge-bot latest-per-name dedupe already accounts for it; the PR
  badge itself still flickers).
- **Over-running:** 275 total codex-gate runs. Each push fires a `pull_request`
  run AND the gate's head-targeted `workflow_dispatch` self-rerun, and every Codex
  review fires BOTH `pull_request_review` and `pull_request_review_comment` runs —
  so a single review wave spawns ~4 gate runs. The self-rerun loop multiplies this
  further. Net: many runs per PR head; consider deduping/again-capping the
  self-rerun and/or collapsing the review/review_comment double-trigger.
- Codex REVIEW is healthy on #49 (reviewed every head incl. the final one);
  #51 (sync PR) was merged without a Codex review.
