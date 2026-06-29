diagnostic: paywall-bot loop + Quality Monitor pileup — full read (READ-ONLY)

> gh CLI unavailable; captured via GitHub REST API + a repo clone for file reads.

## P1 — Quality Monitor workflow YAML (full)

```
name: Quality Monitor

# Triggered after each Poll workflow completes (successful runs only — a
# failed Poll wouldn't have written new findings to state). The
# workflow_dispatch trigger is kept so the file_quality_pr CLI can be
# invoked manually for testing without waiting for a Poll cycle.
on:
  workflow_run:
    workflows: ["Poll & Post"]
    types: [completed]
  workflow_dispatch:

permissions:
  contents: write
  pull-requests: write

jobs:
  file-quality-pr:
    runs-on: ubuntu-24.04
    timeout-minutes: 5
    # Only run when the upstream Poll succeeded, OR when manually dispatched.
    # workflow_run fires regardless of outcome; the guard prevents us from
    # repeatedly trying to file a PR off a failing pipeline.
    if: ${{ github.event_name == 'workflow_dispatch' || github.event.workflow_run.conclusion == 'success' }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          # Use AUTOMATION_PAT instead of the default GITHUB_TOKEN so the
          # branch push + state-update push to main carry PAT credentials.
          # Pushes authored by the default GITHUB_TOKEN do NOT trigger
          # downstream workflows on the same repo (GitHub safety rule),
          # which means codex-auto-fix wouldn't react to the report PR.
          # PAT-authored pushes are treated as a real user event and DO
          # trigger downstream workflows.
          token: ${{ secrets.AUTOMATION_PAT }}

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: pip

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: File quality PR if findings present
        env:
          # Same PAT as the checkout token. The env var name stays
          # GITHUB_TOKEN so core/quality_inspector.py reads it via
          # os.environ["GITHUB_TOKEN"] without code changes — only
          # the secret source switches.
          GITHUB_TOKEN: ${{ secrets.AUTOMATION_PAT }}
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: python -m core.quality_inspector --file-pr --site themarker
```

## P2 — report-PR creation code (core/quality_inspector.py:484-580, verbatim) + dedup

```
def _filter_new_findings(state: dict) -> list[dict]:
    """Return findings whose hash isn't in state["quality_pr_filed_issue_ids"]."""
    issues = state.get("quality_issues") or []
    filed = set(state.get("quality_pr_filed_issue_ids") or [])
    return [f for f in issues if f.get("hash") and f["hash"] not in filed]


def file_quality_pr(site: str = "themarker") -> dict | None:
    """CLI workhorse — see the module docstring's "CLI ENTRY" section.

    Returns {"pr_number": int, "pr_url": str} on success, or None when
    there were no new findings. Failures during git/API work raise so the
    workflow surfaces them; absence of new findings is NOT a failure.
    """
    state_path = Path(f"state/{site}.json")
    if not state_path.exists():
        log_warning(f"quality_inspector: state file missing: {state_path}")
        return None
    state = json.loads(state_path.read_text(encoding="utf-8"))

    fresh = _filter_new_findings(state)
    if not fresh:
        log_info("quality_inspector: no new quality issues to file")
        return None

    today = _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%d")
    short = uuid.uuid4().hex[:8]
    branch = f"quality-report-{today}-{short}"
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    report_path = REPORTS_DIR / f"quality-issue-{today}-{short}.md"
    report_path.write_text(_generate_report_md(fresh), encoding="utf-8")
    log_info(f"quality_inspector: wrote {report_path} with {len(fresh)} findings")

    _run_git("config", "user.name", "github-actions[bot]")
    _run_git(
        "config", "user.email",
        "41898282+github-actions[bot]@users.noreply.github.com",
    )
    _run_git("checkout", "-b", branch)
    _run_git("add", str(report_path))
    _run_git(
        "commit", "-m",
        f"report: {len(fresh)} runtime content-quality findings ({today})",
    )
    _run_git("push", "-u", "origin", branch)

    token = os.environ.get("GITHUB_TOKEN", "")
    repo = os.environ.get("GITHUB_REPOSITORY", "")
    if not token or not repo:
        log_error(
            "quality_inspector: missing GITHUB_TOKEN / GITHUB_REPOSITORY; "
            "branch pushed but PR not opened"
        )
        return None

    pr_resp = requests.post(
        f"https://api.github.com/repos/{repo}/pulls",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
        },
        json={
            "title": (
                f"fix: runtime content quality issues detected "
                f"({len(fresh)} findings)"
            ),
            "head": branch,
            "base": "main",
            "body": _generate_pr_body(fresh, str(report_path)),
        },
        timeout=15,
    )
    pr_resp.raise_for_status()
    pr_data = pr_resp.json()
    log_info(
        f"quality_inspector: opened PR #{pr_data['number']} ({pr_data['html_url']})"
    )

    # Mark these findings as filed in state so they don't generate another PR.
    state["quality_pr_last_filed_at"] = _dt.datetime.now(_dt.timezone.utc).isoformat()
    filed = set(state.get("quality_pr_filed_issue_ids") or [])
    filed.update(f["hash"] for f in fresh)
    state["quality_pr_filed_issue_ids"] = sorted(filed)
    state_path.write_text(
        json.dumps(state, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    _run_git("checkout", "main")
    _run_git("add", str(state_path))
    _run_git(
        "commit", "-m",
        f"state: mark {len(fresh)} quality findings filed in PR #{pr_data['number']}",
    )
    _run_git("push", "origin", "main")
    return {"pr_number": pr_data["number"], "pr_url": pr_data["html_url"]}
```

DEDUP NOTE: the only idempotency is `_filter_new_findings` (skips finding HASHES already in state["quality_pr_filed_issue_ids"]). There is NO check for an already-OPEN quality-report PR — so a new finding hash always opens a new PR (the pileup).

## P3 — why are the report PRs RED? checks on #41

```
#41 head sha = dcce912792fa63046aa130cdf304adee9476ff6b
check-codex-status  conclusion=success  started=2026-06-27T14:27:34Z  (latest)
check-codex-status  conclusion=failure  started=2026-06-27T14:25:55Z
test-message-format conclusion=success  started=2026-06-27T14:24:17Z
check-codex-status  conclusion=failure  started=2026-06-27T14:24:16Z

For every FAILING check, .output (title/summary/text) was fetched via the single
check-run endpoint (id 83825395667): output.title="", output.summary="", output.text=""
— the Codex Gate's custom check sets NO output text; the "failure" is just the
fail-closed gate state on an early run. The LATEST check-codex-status on this head
is success, so #41's red is a stale early gate run (same latest-per-name effect as
merge-bot), not a real test failure. (test-message-format passed.)
```

## P4 — #42 origin + is it a follow-up code fix?

```
#42 metadata:
  branch = claude/foreign-script-cocoon-fixes
  user   = funzi7   assoc = OWNER
  created= 2026-06-28T08:36:34Z   MERGED 2026-06-29T04:42:28Z (merged_by funzi7)
  => YES, #42 is a real follow-up CODE FIX (Claude-authored, cherry-picked from
     fcace5b): routes flash+channel through the cleaner, adds Thai, fixes the
     Cocoon zero-width label. 304/-22 across core/article_parser.py, core/main.py,
     core/tg_bot.py, tests/test_message_format.py. Local suite 141/141.

#42 head sha = 08bc6fcdbbfbb6979beb499092190778b9cc7199 — check-runs (name conclusion;
.output.title not exposed by the REST check-runs list endpoint):
  trigger_codex_on_health_issue  skipped
  trigger_codex_fix              skipped
  archive_codex_summary          failure
  check-codex-status             success
  archive_codex_summary          skipped
  check-codex-status             success
  ...(28 runs total; multiple check-codex-status SUCCESS on the final head — #42
  merged green; the recurring archive_codex_summary FAILUREs are the agent-memory
  archive job, a known fail-soft side job, not the gate.)
```

## P5 — did report->fix EVER produce a merged code fix? (closed PRs)

```
Closed PRs (num | merged | branch | title) — report->fix flow DID produce merged code fixes:
#36 merged=True  quality-report-2026-06-25-670351f2 :: fix: runtime content quality issues detected (1 findings)
#45 merged=True  codex/github-mention-fix-route-flash-+-channel-through-cleaner :: fix: drop numeric-only flash remnants
#44 merged=True  claude/byline-dropcap-fixes :: fix: clean byline + rejoin drop-cap first letter
#43 merged=True  quality-report-2026-06-28-b545a842 :: fix: runtime content quality issues detected (1 findings)
#42 merged=True  claude/foreign-script-cocoon-fixes :: fix: route flash + channel through cleaner, add Thai, fix Cocoon label
#32 merged=True  claude/article-inline-images :: feat(telegraph): embed in-body images with captions
#29 merged=False quality-report-2026-06-04-6676c780 :: (report PR, closed unmerged)
#28 merged=False quality-report-2026-06-03-0ab43712 :: (report PR, closed unmerged)
#34 merged=True  claude/reduce-poll-frequency :: ci(poll): cut cron ~62% Actions minutes
#30 merged=True  chore/sync-automation-core :: chore(automation): sync from automation-core
#33 merged=True  claude/capture-one3ft-sample :: diag: optional one3ft raw-HTML capture
#31 merged=True  claude/fix-one3ft-cocoon-cleaners :: fix(one3ft): unify cocoon cleaners + inline caption + Arabic->Hebrew
#27 merged=True  claude/sync-codex-gate-workflows :: chore(workflows): sync codex-gate + codex-auto-fix
#22 merged=False quality-report-2026-06-02-89d86bab :: (report PR, closed unmerged)
#26 merged=True  claude/fix-cocoon-foreign-and-jina-noise :: fix: per-line Cocoon caption + U+FFFD strip + jina truncate
#25 merged=True  claude/disable-smry-diag-and-map-sources :: chore(smry): gate DIAG dump
#24 merged=True  claude/fix-smry-extraction :: fix(smry): block-level fallback extractor
#23 merged=False chore/sync-automation-core :: (sync PR, closed unmerged)
#21..#1 merged=True (various claude/* + fix/* code fixes)
#18 merged=False quality-report-2026-06-02-74e58aca :: (report PR, closed unmerged)

Summary: code fixes routinely merge (claude/* + fix/* branches). Report PRs (quality-report-*)
mostly merge to RECORD the finding (#36, #43) or are closed unmerged (#18,#22,#28,#29) — but
several stay OPEN and pile up (see P9), because there is NO already-open-report-PR dedup (P2).
```

## P6 — Claude budget on paywall-bot? recent claude.yml runs

```
claude.yml total_count=10. Newest 8 (createdAt event conclusion):
2026-06-29T07:25:13Z pull_request_review_comment completed/skipped
2026-06-28T06:59:21Z pull_request_review_comment completed/failure
2026-06-28T06:59:11Z pull_request_review_comment completed/skipped
2026-06-28T06:59:11Z pull_request_review_comment completed/cancelled
2026-06-28T06:59:11Z pull_request_review_comment completed/skipped
2026-06-27T06:26:41Z pull_request_review_comment completed/success
2026-06-27T06:26:32Z pull_request_review_comment completed/skipped
2026-06-27T06:26:32Z pull_request_review_comment completed/skipped
(Claude HAS run on paywall-bot — at least one success 2026-06-27 and one failure
2026-06-28; mostly skipped/cancelled per the per-event if: routing. Budget is NOT
fully blocked here, unlike automation-core's exhausted budget.)
```

## P7 — loop infra present/missing on paywall-bot

```
Workflows present on paywall-bot main (.github/workflows, contents API @ 5cdcaa9):
[backfill.yml, ci.yml, codex-auto-fix.yml, codex-gate.yml, health.yml, poll.yml,
 quality-monitor.yml, sync-automation-core.yml]

CONFIRMED ABSENT: claude-fallback-watchdog.yml, codex-backup-fix.yml (the new loop
infra is NOT yet synced here), AND claude.yml is NOT on main either (Claude Fixer
is not installed on paywall-bot's default branch; the claude.yml runs in P6 came
from an earlier state / PR-scoped runs). So paywall-bot has Codex review+gate+bridge
but no watchdog/backup and no on-main Claude Fixer.
```

## P8 — bridge/loop activity on stuck report PR #41

```
#41 issue-comment channel (gh api issues/41/comments): []  (no comments — no
@claude / @codex / ai-loop markers in the issue-comment channel).
#41 labels: the labels read failed ("Could not resolve to an Issue with the number
of 41" — #41 is a PR, not resolvable via the Issues-labels GraphQL path). From the
open-PR listing (P9), #41 carries NO labels. So #41 is un-escalated, no needs-owner,
no loop markers — the bridge never engaged it (report PRs aren't Codex P1/P2 review
targets the bridge triggers on).
```

## P9 — all OPEN PRs with branch+labels (cleanup planning)

```
OPEN PRs (num | branch | labels | created):
#47 claude/image-body-scope                       []                        2026-06-29T06:53:25Z  (Claude code fix)
#46 revert-36-quality-report-2026-06-25-670351f2  []                        2026-06-29T06:52:13Z  (Revert of merged report #36)
#41 quality-report-2026-06-27-aeb7f725            []                        2026-06-27T14:24:11Z  (REPORT PR)
#40 quality-report-2026-06-26-59b1229f            []                        2026-06-26T22:04:34Z  (REPORT PR)
#39 quality-report-2026-06-26-ca21c35d            []                        2026-06-26T15:22:15Z  (REPORT PR)
#38 chore/sync-automation-core                     [automerge, needs-owner]  2026-06-26T06:42:46Z  (SYNC PR — escalated/needs-owner)
#37 quality-report-2026-06-25-7566f92a            []                        2026-06-25T11:34:53Z  (REPORT PR, 2 findings)
#35 claude/capture-one3ft-commit                   []                        2026-06-13T14:23:08Z  (old diag PR)

PILEUP CONFIRMED: 4 open quality-report PRs (#37, #39, #40, #41) + a revert (#46) of a
5th (merged #36). Root cause = P2: _filter_new_findings dedupes by FINDING HASH only;
there is NO check for an already-open quality-report PR, so each new finding hash opens
yet another report PR. #38 (sync PR) is separately stuck on needs-owner.
```
