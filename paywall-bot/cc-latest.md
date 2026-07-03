handoff: seeded handoffs/CONTEXT.md — canonical repo context for paywall-bot

**Change (paywall-bot main @ `d4f84c3`, one docs-only commit, author funzi7):** created
`handoffs/CONTEXT.md` — the always-current canonical context file (same role as automation-core's
`handoffs/CONTEXT.md`). From now on EVERY agent prompt on paywall-bot must update it in the SAME
commit as its change.

**Sections (all code facts verified against `main` on 2026-07-03 with file:line citations):**
- §1 WHAT THIS REPO IS — Telegram bot posting TheMarker premium → `@demarkerpremium` via Telegraph;
  `poll.yml` runs `core.main` two-phase (`_phase1_discover` `main.py:690` defers 30 min /
  `MIN_AGE_BEFORE_POST_SECONDS=1800` `state.py:46`; `_phase2_retry` `:738`; `MAX_RETRY_COUNT=5`
  `state.py:47` → permanent_fail).
- §2 FETCH CHAIN + IN-CHAIN GATES — telegram→direct→jina→smry→one3ft→wayback (`_fetch_chain`
  `article_parser.py:54`); in-chain teaser (`_is_teaser_shape:320`, `TEASER_SUSPECT_SOURCES:312`,
  `PAYWALL_MIN_BODY_CHARS=1500:304`) + talkback (`_has_talkback_signature:337`, commit `0889e70`)
  reject→continue; `_quality_gate_reason` (`main.py:59`) = post-fetch backstop; DO-NOT-RE-ADD bypass
  list in the `fetch_and_parse` docstring (`:3449`).
- §3 QUALITY MONITOR — `quality-monitor.yml` → `core.quality_inspector`; `inspect_published_post:339`,
  `file_quality_findings:535`, hash-dedup, rolling Issue **#50** (label `quality-findings`),
  `ROUTE_FINDINGS_TO_AUTOFIX=False:408`, refetch/checkout origin/main before read + before commit.
- §4 THE AI LOOP HERE — codex-gate two-check (fix #15: job check `check-codex-status` authoritative +
  cosmetic create-only `codex-gate-verdict`); ack = Codex-only issue-level 👍 after head (owner 👍
  does nothing); override `codex-p1-acknowledged`; sync PRs never reviewed → use override; bridge
  inlines findings; `claude.yml` `--max-turns 50` + `CLAUDE_SHOW_FULL_OUTPUT=true` (repo var already
  set, effective once fix #16 syncs); Codex API backup DISABLED → watchdog escalates `needs-owner`
  (merge-bot HARD STOP — remove manually).
- §5 HARD-WON LESSONS — phantom Codex summaries (`4f4d0cf`/PR never existed, verify via API);
  2025-03-31 no-update policy → create-only; sandbox can't run full pytest (`from core import tg_bot`
  rust panic) → ci.yml `test-message-format` is arbiter; 2026-07-02 fixer `error_max_turns` burned
  $2.21 for nothing.
- §6 CURRENT STATE — **#58 MERGED** 10:52:34 (`9cc3e59`; head `0889e70` all three fixes, CI green;
  merged with `needs-owner` still on via override); **#59 MERGED** 10:52:08 (fix #15 gate now on main).
  TODO: fix #16 upstream → sync → merge; delete diag branches `run-brokenimg`, `run-srclink`,
  `telethon-vs-posted-guids` (still on origin).
- §7 AGENT CONVENTIONS — code → `claude/*` PR; docs/state → direct-to-main; update CONTEXT.md every
  commit; publish cc-latest.md + print 7-char SHA; identity `funzi7 <207505227+funzi7@users.noreply.github.com>`.

**TODO snapshot:** fix #16 (claude.yml show-full-output) upstream→sync→merge; remove `needs-owner`
before merging future PRs; delete the three `diag/*` branches.
