diagnostic: codex-backup-fix maiden run on #49 — dispatched but no commit (READ-ONLY)

> gh unavailable; captured via GitHub REST (actions runs/jobs + job logs). Verbatim.

## 1. codex-backup-fix runs (the workflow_dispatch one ~1h ago): status + conclusion

```
2026-06-29T09:09:25Z workflow_dispatch completed/failure id=28361125844  (run_number 1, head dd672b3=main)
total_count = 1   (this is the maiden run)
```

## 2. Its jobs (generate-patch / apply-and-push) + step conclusions

```
job: generate-patch   id=84015756412   status=completed   conclusion=FAILURE
  1  Set up job ............................................. success
  2  Fork-PR security guard (no agent or secrets on forks) .. success   (same-repo PR → proceeded)
  3  Checkout PR head (read-only, no persisted creds) ....... success
  4  Gather the active Codex finding for this head .......... success
  5  Run Codex to fix the finding (CI agent, not Cloud) ..... FAILURE   ← codex-action failed here
  6  Capture the patch (no push in this job) ................ skipped
  7  Upload patch artifact .................................. skipped
  13 Post Run Codex ........................................ success
  14 Post Checkout PR head ................................. success
  15 Complete job .......................................... success

job: apply-and-push   id=84015833304   status=completed   conclusion=SKIPPED
  (entire job skipped — needs.generate-patch.outputs.proceed gate / generate-patch failed,
   so no patch was ever produced or pushed)
```

## 3. generate-patch log — did codex-action run? did it emit a patch? errors? (matching lines, verbatim)

```
env:
  CODEX_SANDBOX: workspace-write
  CODEX_SAFETY_STRATEGY: drop-sudo
  CODEX_WORKING_DIRECTORY: /home/runner/work/paywall-bot/paywall-bot
Running: CODEX_HOME=/home/runner/.codex codex "exec" "--skip-git-repo-check" "--cd" "/home/runner/work/paywall-bot/paywall-bot" "--output-last-message" "/tmp/codex-exec-JWqHEI/output.md" "--sandbox" "workspace-write"
Reading prompt from stdin...
OpenAI Codex v0.142.4
model: gpt-5.5
provider: codex-action-responses-proxy
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
warning: Codex could not find bubblewrap on PATH. ... Codex will use the bundled bubblewrap in the meantime.
ERROR: Quota exceeded. Check your plan and billing details.
ERROR: Quota exceeded. Check your plan and billing details.
Error: codex exited with code 1
##[error]Process completed with exit code 1.
```

→ codex-action DID run (OpenAI Codex v0.142.4, model `gpt-5.5`, provider `codex-action-responses-proxy`, sandbox workspace-write), read the prompt for PR #49, but FAILED with **"Quota exceeded. Check your plan and billing details."** (twice) → `codex exited with code 1`. It emitted **NO patch** — the Capture-patch and Upload-artifact steps were skipped.

## 4. apply-and-push — git apply / push / stale-head / skip / download

```
apply-and-push job conclusion = SKIPPED  (no steps ran)
generate-patch step 6 "Capture the patch (no push in this job)" = skipped
generate-patch step 7 "Upload patch artifact"                   = skipped
```

→ There is NO `git apply`, NO `git push`, and NO stale-head evaluation anywhere, because the whole `apply-and-push` job was SKIPPED. The skip is the CORRECT designed behavior: the codex step failed → no `codex.patch` artifact → nothing to download/apply/push. So the backup produced **no commit on #49** (the only detailed reason is the OpenAI quota failure in §3, not the loop wiring).

## 5. OPENAI key / auth sanity in the codex step

```
(no 401 / "unauthorized" / "authentication" / "missing key" / "not set" line appears)
provider: codex-action-responses-proxy
model: gpt-5.5
ERROR: Quota exceeded. Check your plan and billing details.
```

→ NOT an auth / missing-key problem: `OPENAI_API_KEY` authenticated fine (the model `gpt-5.5` initialized via the codex-action responses proxy and the session started — session id 019f12a4-…). The failure is an **OpenAI account QUOTA/BILLING exhaustion** ("Quota exceeded. Check your plan and billing details."), the OpenAI-side analogue of the Anthropic/Claude budget exhaustion. So on #49 BOTH fixers are currently out of budget: claude.yml (Anthropic) hit error_max_turns earlier, and now codex-backup-fix (OpenAI) hit quota-exceeded — the watchdog's dispatch succeeded (no 403; AUTOMATION_PAT could dispatch), but the backup agent itself can't run until OpenAI billing is topped up.
