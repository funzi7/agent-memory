# automation-core — latest Claude Code status

## fix #16 — claude.yml: opt-in SDK transcript to enumerate fixer permission denials

**main commit `becba8b`** (direct to main, one commit, author funzi7). `workflows/claude.yml` ↔
`.github/workflows/claude.yml` byte-identical (blob `df61a3a`); actionlint clean on both.

**What & why.** Added one line to the `anthropics/claude-code-action@v1` `with:` block:
```yaml
show_full_output: ${{ vars.CLAUDE_SHOW_FULL_OUTPUT == 'true' }}
```
The action hides the SDK transcript by default ("full output hidden for security" —
`show_full_output` defaults false). So when a fixer run dies `error_max_turns`, the log shows
`permission_denials_count` but NOT which tools were denied — `--allowedTools` can't be tuned on
facts. Incident that motivated it: **paywall-bot PR #58**, fixer `error_max_turns` (51 turns,
**$2.21**, **permission_denials_count: 21**), denied tool names unrecoverable.

**Semantics.** Default stays hidden — the safe default for PUBLIC downstreams, where the transcript
can echo file contents into world-readable logs. A PRIVATE repo flips the repository Actions
variable `CLAUDE_SHOW_FULL_OUTPUT=true` temporarily to enumerate denials by tool name, then flips it
back off. `--max-turns` (50), `--allowedTools`, tokens, triggers, concurrency — all unchanged.

**Handoffs updated in the SAME commit:** `handoffs/CONTEXT.md` (claude fixer bullet — the debug
toggle + when to use it), `LOOP_STATE.md` (claude.yml fix #16 bullet), `handoffs/loop-build.md`
(dated 2026-07-03 entry referencing the #58 error_max_turns / 21-denials incident).

**Validation:** actionlint clean on both `claude.yml` copies; `git hash-object` equal across
`workflows/` and `.github/workflows/`; `show_full_output` present on line 94 of both; name-guard clean.

**Next:** on the next private-repo `error_max_turns`, flip the var on → read denied tool names →
tighten/loosen `--allowedTools`. Propagates to downstreams on the next daily sync.
