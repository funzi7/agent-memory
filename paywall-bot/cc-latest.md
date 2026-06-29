# paywall-bot — latest Claude Code status

## Quality Monitor: stop the report-PR pileup → one rolling Issue

**Problem:** the runtime Quality Monitor opened a report PR per finding-batch; the
only idempotency was a per-finding-hash dedup, with NO check for an already-open
report PR — so `quality-report-*` PRs piled up (#37/#39/#40/#41, plus #36 reverted).

**Fix (PR opened): #49** on branch `claude/quality-rolling-issue`.
- `core/quality_inspector.py`: `file_quality_pr` → **`file_quality_findings`**:
  - KEEPS the hash dedup (`_filter_new_findings`); no new findings = no-op.
  - Maintains ONE rolling Issue (label **`quality-findings`**, title "Runtime
    content-quality findings (themarker)"): appends a comment if it exists, else
    creates it (body via the reused `_generate_report_md`).
  - Marks new hashes filed + commits `state/themarker.json` to main via the PAT.
  - DROPS branch/commit/PR mechanics + `reports/` files; removes `_generate_pr_body`.
  - New toggle **`ROUTE_FINDINGS_TO_AUTOFIX` (default `False`)**: rolling Issue is
    owner-driven (no `claude-fix`). `True` also labels `claude-fix` to route into
    the autonomous loop.
- `.github/workflows/quality-monitor.yml`: CLI `--file-pr` → **`--file-findings`**.
- `tests/test_message_format.py`: new **RR2** test (create / append-comment /
  dedup-no-op; GitHub API + git mocked). Kept **RR** still passes.

**Validation:** quality-inspector logic exercised standalone — create → POST
`/issues`; existing → POST `/issues/{n}/comments`; all-filed → no-op (zero HTTP);
toggle default `False`; `_generate_pr_body`/`file_quality_pr` removed. The FULL
`tests/test_message_format` suite could not run in this sandbox (its top-level
`from core import tg_bot` pulls `telegram`/`cryptography`, whose rust binding
panics here — unrelated to this change); the inspector was validated in isolation.

## One-time cleanup (done this run, via API)

- Seeded the rolling Issue **#50** (`quality-findings`) with all 12 currently-open
  findings (type/severity/hash/hebrew_ratio/article URL/timestamp); full Hebrew
  sample text stays in `state/themarker.json` + the closed PR diffs.
- Closed the stale pileup PRs: **#37, #39, #40, #41** (report PRs) and **#46**
  (revert of merged #36). Left **#47** (active code fix) and **#35** alone.

## Next steps / caveats

- **MERGE #49 before the next Poll cycle** to fully stop new report PRs. If a
  report PR slips through before the merge, just close it.
- `ROUTE_FINDINGS_TO_AUTOFIX` stays **False** (owner-driven) unless content-quality
  fixes should flow through the auto-fix loop.
