# paywall-bot — Tech Feed IL per-source health handoff

Date: 2026-07-19

## Current Git status

- Primary repository: `funzi7/paywall-bot` at `/root/work/paywall-bot`.
- Starting `origin/main` HEAD:
  `b3417d6b1d41bdeb8ceb440145344d58fccbd2b7`.
- Branch: `feat/techfeedil-source-health`.
- Feature commit / branch HEAD:
  `23a62b8129b84dfbed47091a8e054d8ee6f84c14`.
- Remote branch SHA was verified with `git ls-remote` and equals the local HEAD.
- Draft PR: #75, `https://github.com/funzi7/paywall-bot/pull/75`.
- `gh pr view` verified that PR #75 is open, targets `main`, uses the requested
  feature branch, and points to
  `23a62b8129b84dfbed47091a8e054d8ee6f84c14`.
- `main` was not merged or modified by this task.

The maintained repository handoff is `handoffs/CONTEXT.md`; Tech tenant MVP
context is in §8 and this monitor is fully recorded in §9.

## Delivered scope

- Added production-grade active per-source health monitoring for the already
  configured `techfeedil` tenant.
- No publisher, feed, parser adapter, or production content source was added or
  enabled. The existing configured sources remain Gadgety, Geektime, TGspot,
  The Verifier, and N12/mako.
- The monitor is strictly no-publish: it does not create Telegraph pages and
  does not send Telegram channel posts. Only owner alert/digest DMs are allowed.
- TheMarker production behavior is preserved. Its feeds, parser/fetch chain,
  publishing/state, schedules, secrets, aggregate health workflow, and
  `poll-themarker` concurrency remain unchanged.

## Active monitor architecture

- Entry point: `python -m core.source_health --site techfeedil`.
- Forced publisher extraction: add `--deep`.
- Local no-DM validation: add `--no-alerts`; authentication and permission
  validation still runs because `--no-alerts` suppresses DMs only.
- Every run probes all nine configured discovery endpoints independently and
  records:
  - configured/final URL, HTTP status, redirect, latency, content type;
  - WAF, Cloudflare, Radware, CAPTCHA, access-denied, consent, and generic
    error-page detection even on HTTP 200;
  - parse success, raw/valid item counts, newest canonical URL/timestamp;
  - invalid, duplicate, unexpected-host URL counts;
  - per-feed freshness against configurable thresholds.
- RSS probes use the same production entry parsing helpers. HTML category
  probes use the configured production category adapter. N12's existing Jina
  category fallback is reported explicitly; no fallback/source was invented.
- Discovery and extraction work use a maximum of four workers. Discovery
  requests have explicit 15-second timeouts. Telegram API validation also has
  explicit 15-second per-call timeouts. The configured 270-second monitor
  budget reserves 60 seconds for shared authentication checks and persists
  unfinished endpoint/publisher IDs as `runtime_budget_exhausted` where
  technically possible. The workflow hard timeout is ten minutes.
- Deep checks group by `source_id`, not feed. Gadgety's four feeds count as one
  publisher; N12's category and RSS count as one publisher. Each publisher gets
  at most one representative extraction per run.
- A deep check runs when:
  - the newest canonical URL changed since the publisher's last successful
    deep result;
  - no successful deep check exists;
  - the parser/quality configuration signature changed;
  - the previous success is at least 48 hours old; or
  - `--deep` / workflow `force_deep` is selected.
- An unchanged publisher with a successful deep result less than 48 hours old
  is skipped. A failed attempt never advances its successful timestamp or URL,
  so scheduled failures are retried.
- Deep extraction uses the real production `article_parser.fetch_and_parse`
  direct/Jina chain and shared quality gates. A thread-local optional collector
  captures body-free attempt diagnostics without changing the established
  return contract. It reports fetch source, fallback use, title/author/
  canonical/hero presence, paragraph/character/Hebrew counts and ratio, and
  exact quality failures including partial/empty body, site chrome, sponsored
  markers, related rails, talkbacks, teaser shape, and publisher adapter
  failures.
- The command emits title in its ephemeral structured JSON because title is a
  required extraction diagnostic. Persisted health state never stores title,
  article body, paragraph, excerpt, credential, bot token, Telegraph token, or
  session string.

## Pipeline and state health

- Production state is read through a strict, non-mutating JSON reader. Missing,
  unreadable, corrupt, or invalid state cannot silently become an empty healthy
  snapshot.
- Pipeline diagnostics include last successful poll age, baseline presence per
  configured feed, deferred/stuck items by source, retry totals/maxima,
  source-aware permanent failures, and newest feed items not represented in
  posted/deferred/baseline/terminal state after the configured grace period.
- Tech polling now opt-in records `last_successful_poll_at` after successful
  discovery, unions `discovery_ids` when multiple feeds converge on one
  deferred canonical item, and records a bounded 250-row
  `terminal_failures` ledger before removing a permanent-failure deferred row.
  The ledger is body/title/excerpt-free. TheMarker does not enable this feature,
  so its state shape remains unchanged.
- Monitor state is isolated at `state/techfeedil-health.json`. It contains
  alert counters/cooldowns, publisher deep-success identity/timestamps,
  canonical observations, safe endpoint summaries, pipeline counts, request
  counts, unfinished checks, and durations.
- Corrupt health state is preserved byte-for-byte and reported critical instead
  of being overwritten. A resolved-path guard refuses health writes when the
  health path overlaps production state.
- `scripts/commit_source_health_state.sh` runs only in GitHub Actions on the
  default branch and stages exactly `state/techfeedil-health.json`. It never
  stages `state/techfeedil.json`, either Telegraph token, or an error log.

## Shared infrastructure checks

- Telegram bot token is validated with `getMe`; constructor/malformed-token and
  API failures become body-free critical checks rather than uncaught errors.
- The resolved bot username must be `@Tech_Feed_IL_Bot`.
- Channel lookup and bot membership validate that `@Tech_Feed_IL` is a channel
  and the bot is owner or administrator with Post Messages permission. No test
  message is sent.
- Missing Tech Telegraph token is `not_initialized` before first publication.
  Once a token exists it is validated with `getAccountInfo` only. The monitor
  never calls Telegraph account/page creation.

## Alert and exit policy

- First ordinary scheduled source/component failure records state without an
  urgent alert.
- Second consecutive scheduled failure sends an owner DM.
- Identical repeated alerts have a six-hour cooldown.
- An alerted component sends recovery when it becomes healthy.
- Manual runs do not increment scheduled failure counters, including critical
  counters. Critical failures still alert immediately and respect cooldown.
- One ordinary failed publisher degrades the report but exits zero while
  alternatives remain. It never marks the whole channel unavailable.
- Shared critical failures exit nonzero after state and alert attempts:
  - invalid/missing bot credentials;
  - lost channel access/posting permission;
  - corrupt/unreadable production or health state;
  - inability to inspect any configured feed;
  - all publishers failing discovery;
  - inability to persist health state or deliver required owner messaging.
- One concise daily digest separates healthy publishers, degraded publishers
  with working alternatives, and failed shared infrastructure. Healthy sources
  do not receive one DM each. Alert text uses existing Telegram MarkdownV2
  escaping and length controls.

## Workflow and Actions cost

- New workflow: `.github/workflows/source-health-techfeedil.yml`.
- Schedule: once daily at `37 3 * * *` (03:37 UTC), plus manual
  `workflow_dispatch` with `force_deep`.
- One Ubuntu 24.04 job; no source matrix; `timeout-minutes: 10`; pip cache.
- It shares `bot-state-techfeedil` with Tech poll/backfill and does not block
  TheMarker. After acquiring the lock it fetches and fast-forwards to the
  latest default-branch state before monitoring.
- The monitor step exposes exactly:
  `TECH_TELEGRAM_BOT_TOKEN`, `TECH_TELEGRAM_CHANNEL`, and
  `TELEGRAM_OWNER_ID`.
- The health sidecar commit runs with `if: always()` so ordinary/critical
  diagnostics survive after the command has attempted alerts.
- Metrics record total, discovery, extraction and per-source duration; direct
  and Jina requests; conditional/forced mode; and unfinished checks.
- `GITHUB_STEP_SUMMARY` computes raw and per-job-rounded projections using
  approximately 30 scheduled runs/month.
- Normal one-to-five-minute runs project to 30–150 Linux minutes/month. Thirty
  ten-minute timeout jobs would project to 300 minutes. Manual runs add usage,
  so the normal design stays below the requested approximately 500-minute
  monitoring budget.
- PR #75 includes the calculation command and range in its description. The
  exact command used was:

  ```bash
  .venv/bin/python - <<'PY'
  from core.source_health import project_monthly_minutes
  for seconds in (60, 300, 600):
      print(seconds, project_monthly_minutes(seconds, scheduled_runs=30))
  PY
  ```

  Results were 30, 150, and 300 rounded monthly minutes respectively.

## Final live no-publish verification

The final code was run with all configured feeds, `force_deep=True`, temporary
health/log/Telegraph paths, synthetic local Telegram auth objects, no DMs, and
the real production state read-only. It made no Telegram or Telegraph network
call and wrote no production state.

- Overall: exit 0, `degraded` only because Geektime was stale; total 13.238 s,
  discovery 8.386 s, publisher extraction wall time 4.832 s, 14 direct
  requests, two Jina requests, five healthy publisher extractions, and zero
  unfinished checks.
- Gadgety: all four RSS endpoints HTTP 200, ten fresh items each. Direct
  representative extraction: 23 paragraphs, 2,215 body chars, 1,419 Hebrew
  chars, ratio 0.8456, hero present.
- Geektime: RSS HTTP 200, 30 valid items, but correctly failed its 72-hour
  freshness gate. Newest timestamp was `2026-06-01T07:25:31+00:00`, roughly
  1,158 hours old on the run. Direct representative extraction remained
  healthy: 5 paragraphs, 2,033 chars, 1,396 Hebrew chars, ratio 0.9313, hero.
- TGspot: RSS HTTP 200, ten fresh items. Direct article HTTP 403 then healthy
  Jina extraction: 5 paragraphs, 1,423 chars, 1,112 Hebrew chars, ratio 0.9823,
  hero.
- The Verifier: RSS HTTP 200, ten fresh items. Direct extraction: 12
  paragraphs, 1,996 chars, 1,520 Hebrew chars, ratio 0.9596, hero.
- N12: authoritative TECH12 direct response was HTTP 200 but detected as a
  Radware challenge; its already-configured Jina discovery fallback produced
  18 trusted rows. The supplementary official filtered RSS produced 14 fresh
  technology matches. Direct representative extraction: 11 paragraphs, 4,141
  chars, 3,205 Hebrew chars, ratio 0.9576, hero.

## Files changed in primary repository

- New:
  - `.github/workflows/source-health-techfeedil.yml`
  - `core/source_health.py`
  - `scripts/commit_source_health_state.sh`
  - `state/techfeedil-health.json`
  - `tests/test_source_health.py`
- Updated:
  - `.github/workflows/ci.yml`
  - `.github/workflows/health.yml`
  - `README.md`
  - `core/article_parser.py`
  - `core/main.py`
  - `handoffs/CONTEXT.md`
  - `sites/techfeedil/config.yaml`
  - `tests/test_techfeedil.py`

No production publishing state, Telegraph token, actual credential/session,
tracked error log, downloaded HTML, generated third-party article body, or
sensitive state was committed.

## Exact validation results

- `.venv/bin/python -m tests.test_message_format` — 185 PASS, 0 FAIL; final
  line `All tests passed.`
- `.venv/bin/python -m unittest tests.test_techfeedil -v` — 21 tests, `OK`.
- `.venv/bin/python -m unittest tests.test_source_health -v` — 34 tests, `OK`.
- `.venv/bin/python -m compileall -q core sites tests tools` — passed.
- PyYAML `safe_load` of all 15 `.github/workflows/*.yml` files — passed.
- `bash -n scripts/*.sh` — passed.
- `git diff --check` — passed.
- Sensitive-value pattern scan across all 13 changed files — passed.
- Two independent read-only release/runtime audits reported no remaining
  release blocker, no publication path, and no token output/persistence path.

## Required manual setup / exact next steps

1. Review PR #75 and let CI complete. Do not merge directly from an agent
   session.
2. Confirm existing GitHub Actions secrets exactly:
   - `TECH_TELEGRAM_BOT_TOKEN`
   - `TECH_TELEGRAM_CHANNEL`
   - `TELEGRAM_OWNER_ID`
3. Confirm the token resolves to `@Tech_Feed_IL_Bot`, the bot is an
   administrator of `@Tech_Feed_IL` with Post Messages permission, and the
   owner has sent `/start` to the bot.
4. Merge through the repository's normal reviewed PR flow.
5. From the default branch, manually dispatch **Source Health — Tech Feed IL**
   once with `force_deep=true`. It will not publish. Confirm the owner digest,
   `GITHUB_STEP_SUMMARY`, job runtime, and the isolated health-sidecar commit.
6. Leave subsequent source health on its daily schedule. Do not enable a new
   source based only on this monitoring PR.

## Known limitations / risks

- Geektime's configured official technology RSS was materially stale during
  both live checks. Investigate publisher cadence or a verified first-party
  endpoint change in a separate PR; do not silently weaken the threshold or add
  a replacement source here.
- N12 category discovery currently depends on its already-configured Jina
  fallback after a Radware HTTP-200 challenge. TGspot article extraction may
  depend on Jina after direct Cloudflare HTTP 403.
- Per-source terminal-failure attribution begins after this feature deploys.
  Older aggregate `stats.permanent_fail` history cannot be reconstructed.
- Actual GitHub-billed job duration includes checkout/setup/dependency time;
  validate the projected monthly range from the first merged runs.
- Repository documentation says workflows are synced from
  `funzi7/automation-core`. Mirror/approve this dedicated workflow in that
  source of truth if sync automation would otherwise overwrite PR #75's
  workflow changes.
- The Tech Telegraph result remains `not_initialized` until the first real
  publication creates the tenant-specific token. After initialization,
  `invalid_telegraph_token` is a shared critical failure.
