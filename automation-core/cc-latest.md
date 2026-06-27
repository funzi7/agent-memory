diagnostic: #33 watchdog dispatch — skip vs 403 (READ-ONLY)

## A — did the watchdog try to dispatch and fail, or skip #33?
```
> Method note: the `gh` CLI is not available here; `gh run view <id> --log` was
> reproduced via the GitHub REST job-logs endpoint (get_job_logs, full content),
> then grep -iE 'PR #33|failed to dispatch|fired Codex|escalat|needs-owner|403|404|422|HttpError|not accessible|Resource not'.
> The decisive runtime lines (timestamped) for each run are below. (The log also
> echoes the workflow's `script:` source, whose text literally contains
> needs-owner / escalate / "fired Codex" / "failed to dispatch" / 403,404,422 —
> those are source lines, not execution output, and are omitted here.)

run 28271438616 (job 83769455754, "watch"):
2026-06-26T23:42:53.6032862Z   retry-exempt-status-codes: 400,401,403,404,422
2026-06-26T23:42:54.3829756Z ##[warning]PR #33: failed to dispatch codex-backup-fix.yml (ignored): Resource not accessible by personal access token

run 28280196819 (job 83794281393, "watch"):
2026-06-27T05:42:05.5168713Z   retry-exempt-status-codes: 400,401,403,404,422
2026-06-27T05:42:06.4012744Z ##[warning]PR #33: failed to dispatch codex-backup-fix.yml (ignored): Resource not accessible by personal access token

DECISIVE: the watchdog matched PR #33 and TRIED to dispatch codex-backup-fix.yml;
the dispatch FAILED with 403 "Resource not accessible by personal access token"
(AUTOMATION_PAT lacks the Actions: write / workflow-dispatch scope). It did NOT
skip #33 — the dispatch is blocked by token permissions, so the backup never ran.
```

## B — ai-loop marker in the REVIEW-COMMENT channel (and its head=)
```
> REST equivalent of `gh api .../pulls/33/comments` (review-comment channel).
2026-06-26T15:15:09Z  ::  <!-- ai-loop:v1 root_pr=33 head=58a5c348003bcdde2ecc765df13af12a3659f5e2 attempt=1 agent=claude state=requested -->

(Exactly one ai-loop marker in the review-comment channel: agent=claude,
state=requested, head=58a5c348003bcdde2ecc765df13af12a3659f5e2. NO agent=codex
marker exists — consistent with the dispatch never succeeding.)
```

## C — #33 current head SHA
```
58a5c348003bcdde2ecc765df13af12a3659f5e2

(Current #33 head == the marker's head= value above, so the watchdog's
head-match check passes and it proceeds to the dispatch — confirming this is a
dispatch-permission failure, not a head-moved skip.)
```
