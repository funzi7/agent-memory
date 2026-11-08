# paywall-bot handoff — 2026-11-08 UTC (SECURITY: Telegraph access tokens out of git — fixed, merged, rotated)

## Headline

The read-only security audit of 2026-11-07/08 found ONE committed real secret in this repository: both tenants'
Telegraph access tokens, tracked as `state/telegraph_token.json` (TheMarker) and
`state/techfeedil-telegraph-token.json` (Tech Feed IL), re-staged by every state commit, with a `createAccount`
fallback whenever a file was missing. The owner approved the full fix (rotation included; NO history rewrite, NO
force-push). It is **done**: code merged, both tokens rotated, both tenants publishing through the new secrets.

- **PR #120** (security fix) MERGED 2026-11-08T11:48:14Z as squash `98796d9328244d01178c4ccdb23895abb936fb70`.
- **PR #121** (docs-only acceptance log) MERGED 2026-11-08T12:51:25Z as squash `720fdacb205313e344bea970c3b7fca0bcdfa0e9`.
- **Both Telegraph tokens rotated** at 12:35Z with `revokeAccessToken`; the old values (still in git history by owner
  instruction) are revoked and verified rejected (`ACCESS_TOKEN_INVALID`).
- No token value or fingerprint is stored anywhere in the repository; this handoff carries none either.

## FINAL STATE

- **`origin/main`:** `720fdacb205313e344bea970c3b7fca0bcdfa0e9` (the #121 squash on top of the #120 squash and the
  bot's state commits). Canonical record: `docs/telegraph-token-secrets-20261108.md` (ADR + runbook + acceptance
  log); `handoffs/CONTEXT.md` has the 2026-11-08 section at the top.
- **Branches pushed:** `security/telegraph-token-secrets-20261108` (head `23eac3576e5b7213311f26bd34fa6537f5017a4c`,
  merged by #120); `docs/telegraph-token-rotation-evidence-20261108` (head
  `68985bc2d43285e64ef58a0b9b819aa880bbde34`, merged by #121); `docs/telegraph-tech-rotation-evidence-20261108`
  (head **`fcd6263479d57387eb4d57d40634bf64b5fc8248`**, **PR #122**, docs-only, OPEN at handoff time with Codex review
  requested — Merge Bot merges it once `check-codex-status` is green; it records the Tech post-rotation evidence
  below). This is the task's final paywall-bot HEAD.
- **Secrets (GitHub Actions, repository scope):** `TELEGRAPH_ACCESS_TOKEN` (TheMarker, Telegraph account `demarker`)
  and `TECH_TELEGRAPH_ACCESS_TOKEN` (Tech Feed IL, account `techfeedil`), created 10:51Z with the then-current
  values and updated 12:35:24Z / 12:35:31Z with the rotated ones (values always piped via stdin from a 0600 file,
  never displayed). The rotated tokens also live on the owner's machine at `~/.config/paywall-bot/telegraph-<site>.token`
  (0600, directory 0700).
- **Local working copy:** clean; the legacy token files were deleted from the working copy at 12:48Z (revoked values;
  both paths gitignored). Local pre-commit secret guard installed via `scripts/install_git_hooks.sh`.

## What changed (PR #120)

- `sites/*/config.yaml`: `telegraph.token_file` → `telegraph.token_env`. `core/telegraph_pub.py`: token from the
  environment only (`_resolve_token`, `require_token`); `TelegraphTokenMissing` carries the variable NAME only; a
  config with `token_file`, or a named tenant without `token_env`, is rejected (`TelegraphTokenConfigError`); the
  file cache and the `createAccount` fallback are deleted. `publish_article` without a token → None with subreason
  `telegraph_token_missing:<env>` (item stays deferred). `core/main.py` + `core/backfill.py` call `require_token()`
  right after `set_site_context` (fail fast, like a missing Telegram variable; red run).
- Source Health (Tech): `validate_telegraph_token(token_env)` → `missing_telegraph_token` (critical, red run with
  the monitor's own urgent owner DM naming the secret; deliberately NOT bridged — a poll without the secret never
  reaches the Runtime Ops bridge, Codex P2) / `invalid_telegraph_token` (critical, bridged owner action
  `telegraph_token_invalid`; the DM names the secret, never a file, never "create a token").
  `not_initialized` no longer exists. `RuntimeOpsSettings.telegraph_token_env` (no fallback to another tenant's name).
- Workflows: the tenant secret goes only to the publishing/health steps (`poll.yml`, `poll-techfeedil.yml`, both
  `backfill.yml` jobs, `source-health-techfeedil.yml`). `ci.yml`: `fetch-depth: 0` + `scripts/secret_guard.py`
  (`--tree` always; `--range origin/<base>..HEAD` on PRs).
- Prevention: token files untracked; `.gitignore` (`state/telegraph_token.json`, `state/techfeedil-telegraph-token.json`,
  `state/*telegraph*token*`, `*.telegraph-token`); `scripts/commit_tenant_state.sh` lists no token path and exits 4
  if one is staged; `scripts/secret_guard.py` (redacting: path, line, rule only; Telegraph/Telegram/Anthropic/OpenAI/
  GitHub/Google/AWS/Slack/private-key rules; bare 60-hex is token-shaped); `scripts/install_git_hooks.sh`.
- `tools/telegraph_token_tool.py` (`info` / `verify` / `rotate`): fingerprints only, tokens only in JSON POST bodies,
  `--out` created 0600 outside the repo BEFORE the revoke, pre-flight → revoke → verify; revocation confirmed only by
  an explicit Telegraph refusal; exit 5 when a lost revoke reply leaves the old token dead; short writes completed or
  reported (exit 3).
- Provider canary stubs `_resolve_token`; `tools/provider_pr_guard.py` forbids the new names in scout tests;
  `tools/telegraph_page_doctor.py` diagnoses without a token and refuses repair without one.

## Tests and validation (physically run)

- Local: `python -m unittest discover` → **2955 OK** (three full runs, the last after the review fixes);
  `python -m tests.test_message_format` passed; Node 21/21; `git diff --check` clean; `scripts/secret_guard.py
  --tree/--staged` clean; every workflow YAML parses; every tracked `.sh` passes `bash -n`.
- New suites: `tests/test_telegraph_token_secrets.py`, `tests/test_secret_guard.py`, `tests/test_telegraph_token_tool.py`.
  Updated: `test_techfeedil`, `test_source_health`, `test_techfeedil_runtime_ops`, `test_techfeedil_source_health_recovery`,
  `test_techfeedil_tenant_queue`, `test_runtime_ops_integration`, `test_provider_canary`, and every suite that stubbed
  `_ensure_account` (now `_resolve_token`) or listed the token files as tracked state.
- CI: the first PR head (`f513b3c`) failed only `git diff --exit-code -- state/` (one new test appended to the tracked
  `state/errors.log`; fixed in `4d479db` with an isolated-log base class); every later head green; main CI
  42477339972 green on `98796d9`; #121 CI green.
- **Review:** Codex reviewed every #120 head: three P2 (rotation tool: lost `revokeAccessToken` reply reported as
  "nothing revoked"; short `os.write` passing as "saved"; Source Health: `missing_telegraph_token` bridged to a path
  the aborted poll never reaches) — each fixed in the next commit with tests, threads resolved; clean on `23eac35`;
  #121 clean. Before the PR, an independent Claude Code (Opus) PR-style review of the staged diff: 0 P1, 1 P2 (the
  lost-reply case), 7 P3 — fixed (except the deliberate JSON `getAccountInfo` body, live-verified). Not a Codex
  fallback: Codex was available.

## Production evidence (READ-ONLY OBSERVED; manual dispatches are ordinary polls, the same the Guardian uses)

- The 12:00Z/12:17Z cron slots had not fired by 12:31Z, so both polls were dispatched by hand on `main` at 12:32Z
  (old token values via the new secrets): Tech run 42480696596 success `posted=6` (six `telegraph_url` lines),
  TheMarker run 42480699573 success `posted=4`, both `errors=0`, no `telegraph_token_missing`.
- Rotation 12:35Z: `rotate` exit 0 for both tenants (new token verified on the same account — `demarker` 1393 pages,
  `techfeedil` 2055 pages; old token `ACCESS_TOKEN_INVALID`); no poll in progress during the ~6 s windows.
- Post-rotation dispatches 12:36Z: TheMarker run 42481015849 success `posted=1` with a `telegraph_url` → a real page
  created with the rotated token; Tech run 42481012853 success `posted=0` (nothing new; the startup gate found the
  rotated secret).
- The 13:17Z Tech cron slot had not fired by 13:31Z, so the Tech poll was dispatched by hand once more at 13:31Z:
  run 42485383691 success `posted=6` with six `telegraph_url` lines, `errors=0` — Tech Feed IL proven on the rotated
  token. Both tenants publish on the new secrets; the bot's own state commits after these runs landed on `main` as usual.

## DONE / PENDING / SUPERSEDED (reconciled; repo: CONTEXT 2026-11-08 section, doc §4)

- **DONE:** #120 merged; #121 merged; secrets created and rotated; both tenants observed publishing through the
  secrets before the rotation; TheMarker observed publishing with the rotated token; old tokens verified revoked;
  local legacy files deleted; CONTEXT §6 backlog item S-1 ("move the Telegraph token files out of the repository")
  closed; the README no longer claims account creation on first publish.
- **PENDING:** PR #122 (docs-only, the last evidence row) merging via Merge Bot after Codex; GitHub secret scanning /
  push protection for the private repository (not readable with this session's token; owner decision); the same
  env-only treatment for any future tenant (enforced by `configure`). The cron lag seen today (the 12:00Z, 12:17Z
  and 13:17Z slots had not fired when checked) is pre-existing GitHub-schedule behavior, not changed by this task;
  the Guardian's self-heal covers Tech as before.
- **SUPERSEDED (engineering, security-driven):** "the Telegraph account is created on the first publish and its token
  cached in `state/`" and the Source Health `not_initialized` state. Old token blobs remain in history by owner
  instruction (no rewrite); they are neutralized by revocation — a future history scan will still find them (dead).
- Unrelated, noticed: PR #116 (docs, DRAFT, `no-automerge`) and PR #118 (`dot/scout-standalone-cli-credits`, another
  agent's work) are still open; untouched.

## Process notes

- Subagents (Opus): two implementation subagents for independent modules (secret guard + hook installer; rotation
  tool) and one independent reviewer. Main thread (Fable) did the core/security-sensitive edits, the rotation and the
  verification. Shell budget respected (one CI waiter at a time; background one-shot checks instead of polling).
- No token value ever entered a shell argument, a log, a transcript or a document: the audit scanner, the token
  tool and all evidence use sha256[:10] fingerprints or identity fields only; the secrets were piped via stdin.
- Local side effect, fixed and disclosed: the test suite appended lines to the tracked `state/errors.log` in the
  working copy (one new test at first, since fixed); never committed; the file was rewritten from `HEAD` content
  (no reset/restore/stash was used anywhere).

## Next steps (owner)

1. Nothing is required for publishing to keep working: both tenants run on the rotated secrets.
2. Optional hardening: enable GitHub secret scanning + push protection for the private repository; run
   `scripts/install_git_hooks.sh` in any other clone; keep `~/.config/paywall-bot/*.token` as the only local copies.
3. Let Merge Bot land PR #122 (docs only). If a Telegraph token ever needs rotating again, follow
   `docs/telegraph-token-secrets-20261108.md` §3 — never create a new account, never store a token in the repo.
