# telegram-media-feed latest handoff

- Repo: `funzi7/telegram-media-feed`
- Branch: `agent/fix-album-carousel-swipe` (PR #1 → `main` remains open; this round adds commits to it)
- Date/time: `2026-11-08`
- Task: security remediation of the 7–8 November 2026 audit (shared-secret exposure)
- telegram-media-feed HEAD: `92c24495068178c6c351458719660c94a7515dc8` (pushed; hardening commit `132fb1b43ae3d70daf49e31cac8219799eca809f` plus the validation-record docs commit; rotation still pending)
- agent-memory HEAD before this handoff commit: `5001e3313df467ebf64467a7bf503bd37180cbc3`
- Final pushed HEADs are reported by the completing agent after commit/push.

## Current Update

- Audit findings confirmed with redacted fingerprinting only: `.env.local` and two `.env.local.backup.*` files (all 0644) held byte-identical live values of `TELEGRAM_BOT_TOKEN` (len 46, `sha256:8b86e96b2745`), `TELEGRAM_WEBHOOK_SECRET` (len 64 hex, `sha256:4b2ac5d12529`) and `APP_ACCESS_TOKEN` (len 48 hex, `sha256:df18be937938`). Bot: id `8814106886`, `@Media_feed_player_mimi_bot`; token still live; webhook still registered to the dead July Quick Tunnel with 20 pending updates (530 errors). No server or tunnel was running.
- Exact-value exposure inventory (`scripts/security/scan-known-secrets.py`, 140 GB over `/root` + `/tmp`, Termux home, `/sdcard` text files, 13 GB of large files streamed, full Git history/reflog/stash of both repos): owner token in 8 Codex transcripts (2026-07-09/10/11/13) and one saved log excerpt `/tmp/tmf-log-tail.txt`; bot token and webhook secret in 1 of those transcripts (07/13); Git history clean; nothing in `~/.claude`, shell history, profiles, other repos, cron, CI. The audit's "81 files" corresponds to the variable *name* `APP_ACCESS_TOKEN` (106 transcripts), not the value.
- Permissions tightened: `.env.local*` 0600; `~/.codex/sessions` (1,891 files) and `~/.claude/projects` (1,341 files) 0600/0700; `~/.codex/history.jsonl`, `session_index.jsonl`, `logs_2.sqlite*` 0600; `/tmp/telegram-media-feed-*.log` and `/tmp/tmf-log-tail.txt` 0600.
- Code: `lib/secret-compare.ts` `secretEquals()` (SHA-256 digests + `timingSafeEqual`) now guards the three owner-token comparisons in `lib/auth.ts` and the webhook secret check; behaviour/status codes unchanged.
- Prevention: `scripts/secret-guard.mjs` (redacted `path:line: rule-id` output; rules: forbidden-path, telegram-bot-token incl. `bot<token>` URLs, env-assignment, generic-secret-assignment, bearer-or-query-token, private-key-block, disposable-tunnel-url, known-secret-value from `.env.local` in-process; `secret-guard:allow` exempts pattern rules only), `.githooks/pre-commit` (installed locally via `npm run hooks:install`, `core.hooksPath=.githooks`), `.github/workflows/secret-guard.yml` (guard + typecheck + tests), `.gitignore` hardening (env copies, backups, pre-rotation files, key material, `/.codex/`, `/.claude/`, `__pycache__`).
- Tooling under `scripts/security/` (never prints values, never takes a secret as argv): `scan-known-secrets.py`, `redact-known-secrets.py` (structure-preserving, dry run by default, 0600, refuses files changed during processing), `rotate-secrets.py` (hidden-input new bot token, `getMe` same-bot check, CSPRNG 48/64-hex regeneration, exclusive 0600 pre-rotation copy, atomic 0600 rewrite preserving CRLF/`export`/comments, `setWebhook` with carried-over `allowed_updates`/`max_connections`, old token must return 401/404, exit 5 if any post-write step fails), `verify-secrets.py` (live `getMe`, old-token rejection, webhook info, server health/feed/admin with new and old tokens, webhook old secret → 401 and new secret → 400 `invalid_json` with no audit row, optional `--set-webhook`, `--public-url`, opt-in `--send-test-message`).
- Docs: `SECURITY.md` (Secret rotation, Secret Guard, incident pointer), `README.md`, `docs/TERMUX_RUNBOOK.md` (rotation procedure), `docs/adr/0001-shared-secret-rotation-and-redacted-tooling.md`, `docs/SECURITY_REMEDIATION_2026-11.md` (redacted record), `TODO.md`, `docs/PROJECT_STATE.md`, `docs/RELEASE_REVIEW.md`.
- Independent Opus PR-style review (Claude Code fallback; Codex not involved): 4 P1 + 11 P2 + 9 P3 findings, all P1/P2 fixed (token regex boundaries, allow-marker scope, `__pycache__`, exclusive 0600 backup, old-token 401/404 semantics, rotate exit codes, webhook probe body, `allowed_updates` carry-over, git error handling, redaction target env, default 0600, TOCTOU refusal, docs accuracy, CI trimming); P3 items fixed where cheap (shebang `-S`, CRLF/export/comment preservation, lowercase `%3a` variant, no non-JSON body echo).

## Validation

- `git diff --check`: passed.
- `npm run typecheck`: passed.
- Secret Guard: `--tree` 143 files 0 findings; `--staged` 25 files 0 findings; `--paths` over every new file 0 findings.
- New/affected test files run individually on the device: `secret-compare` 5, `secret-exposure` 8, `secret-guard` 12, `security-tools` 6 (incl. CRLF/export rewrite and default-0600 cases), plus `telegram-session-security`, `telegram-cookie-access`, `telegram-ingest` — all passing.
- Full suite: **441/441 passed** in GitHub Actions on Node 22 for hardening commit `132fb1b43ae3d70daf49e31cac8219799eca809f` (push run `42491811442` and PR run `42491811702`, each with typecheck and the tree guard; only runner-deprecation annotations). The device-local full run was cancelled as redundant after >20 minutes behind the heavy-build lock held by another project's task (>4 h); nothing bypassed the lock.
- Real Telegram API, read-only: `verify-secrets.py --base-url ''` passed (`getMe` 200 for the bot; webhook info retrieved).
- Synthetic end-to-end self-test of scan → dry-run → apply → rescan on fake values: passed; no tool output contained a fixture value.

## TODO

- OWNER (manual, required before the task can be reported complete): `@BotFather` → `/mybots` → `@Media_feed_player_mimi_bot` → **API Token** → **Revoke current token**; then in Debian `python3 -I scripts/security/rotate-secrets.py` (`--skip-webhook` while no tunnel runs); deploy with `tmfup`; start the tunnel and update both BotFather Mini App URLs; `python3 -I scripts/security/verify-secrets.py --set-webhook "${PUBLIC_URL}/api/telegram/webhook" --public-url "$PUBLIC_URL"` must print `== result: passed`; re-enter the owner token in the browser.
- OWNER decision: approve the dry-run redaction of the old values in the 8 Codex transcripts, the `/tmp` excerpt and (optionally) the two `.env.local.backup.*` files (`redact-known-secrets.py --env .env.local.pre-rotation-<UTC> ... --apply`), or delete the backups instead; transcripts are never deleted without an explicit decision.
- After rotation: rescan with the pre-rotation env (expect zero outside the retained backups) and with `.env.local` (expect only `.env.local`); then update `docs/SECURITY_REMEDIATION_2026-11.md` rotation/acceptance sections, `TODO.md`, `docs/PROJECT_STATE.md`, and this handoff.
- Unchanged backlog: remove browser-flow `?access_token=` media URLs in favour of cookie/session auth; all physical Android acceptance gates listed in `TODO.md`.

## Explicitly Not Done

- No secret was rotated yet (BotFather action belongs to the owner). All three audited values remain live and must be treated as compromised until `verify-secrets.py` passes against the restarted server.
- No transcript, backup, or log was modified or deleted; redaction was run as a dry run only.
- `.git/info/exclude` was not changed (writes under `.git/` are blocked by the session permission policy; `.gitignore` covers the same patterns).
- Global Claude/Codex hooks, the heavy-build queue, permission policies, and YOLO settings were not touched.
- Nothing was deployed; port 3000, the tunnel, BotFather, the webhook, and `.env.local` contents are unchanged.

## Known Limits

- Exact-value redaction cannot find secrets inside compressed or re-encoded data (APKs, archives, base64); rotation is the primary control.
- SHA-256 fingerprint prefixes are safe only for high-entropy values; the tools warn for values shorter than 16 characters.
- `--tree` scans tracked files only; untracked files are covered by the pre-commit hook once staged.
- The device-wide heavy-build lock serializes `npm test`; any command whose text contains `npm test`/`npm run build` is routed into that queue by the global hook.

## Useful Commands And Routes

- `npm run secret-guard`, `npm run hooks:install`, `npm run typecheck`, `npm test`, `git diff --check`
- `python3 -I scripts/security/scan-known-secrets.py --env <env> --keys TELEGRAM_BOT_TOKEN,TELEGRAM_WEBHOOK_SECRET,APP_ACCESS_TOKEN --root <dir> --git . --report <json>`
- `python3 -I scripts/security/redact-known-secrets.py --env <pre-rotation env> --keys ... --paths-from <json> [--apply]`
- `python3 -I scripts/security/rotate-secrets.py [--skip-webhook | --webhook-url URL] [--clipboard | --reveal-app-access-token]`
- `python3 -I scripts/security/verify-secrets.py [--public-url URL] [--set-webhook URL]`
- `/api/health`, `/api/feed?limit=1`, `/api/admin/ingest?limit=1`, `/api/telegram/webhook`
