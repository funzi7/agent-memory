# automation-core — latest Claude Code status

## fix #26 — honest failure classes + instant stage-skips + cloud-terminal + apply-by-proxy + override sweep

**main commit `d07b0b2`** (direct to main, ONE commit, author funzi7). Two files
(`claude.yml`, `claude-fallback-watchdog.yml`); byte-identical across `workflows/` ↔
`.github/workflows/` (claude.yml `76bdee7`, watchdog `13afcaf`); `yaml.safe_load` + actionlint pass on
all four copies; `node --check` on all 5 script bodies.

### The TRF #88 saga that drove it
1. **Anthropic credit ran dry.** The SDK returned `{"is_error":true,"api_error_status":400,"result":"Credit
   balance is too low","usage":{"input_tokens":0}}` — yet `claude-code-action` reported `subtype:"success"`
   and exited 0. A dead fixer looked like a mysterious no-op and the ladder burned a full 20-min window per
   PR. (Only visible because fix #16's `CLAUDE_SHOW_FULL_OUTPUT` was on.)
2. **Codex Cloud fixed but its sandbox has no push remote** — it posts a terminal SUMMARY comment ("View
   task", sometimes "Created commit `sha` (msg)") instead of pushing, and the ladder waited another pointless
   window.
3. **The `codex-p1-acknowledged` label fires no workflow** — an acknowledged 🔴 PR stayed red until a manual
   head-targeted run.

### claude.yml
- **Part A — classify the SDK outcome.** The fix #23 Delivery-check step now, on a non-delivery, reads the
  SDK terminal result JSON (`steps.claude.outputs.execution_file` env, else
  `find $RUNNER_TEMP -maxdepth 2 -name claude-execution-output.json`) and sets output `class`:
  **`billing_error`** (`is_error` + "Credit balance is too low" / `billing_error`), **`fixer_error`**
  (`is_error` otherwise; result string → output `resultStr`), else **`no_delivery`** (ran clean, no commit =
  genuine model no-op). The 👎/marker step writes `agent=claude state=<class>` (dedupe now on `agent=claude `
  + `state=<class>`, so it can't collide with `claude-proxy`) and `core.error`s a loud line on billing/fixer.
  (`require('fs')`/`require('child_process')` are Node builtins — the zero-module rule only forbids
  `@actions/github`.)
- **Part B — kill-switch.** The job `if:` is wrapped `vars.CLAUDE_ENABLED != 'false' && (…existing…)`
  (absent = enabled) — flip `CLAUDE_ENABLED=false` while credit is dry to skip even the ~17s bounce.

### claude-fallback-watchdog.yml
- **Part C — instant stage-1 skip.** A `claude/billing_error` or `claude/fixer_error` marker (Claude RAN
  AND DIED) makes stage 1 terminal THIS tick — no 20-min wait — with a once-per-head
  `🚨 … Claude fixer dead (<class>) — fund Anthropic` notify (deduped via a `watchdog/claude_dead` marker).
  `CLAUDE_ENABLED=false` (env from `vars.CLAUDE_ENABLED`) also pre-skips stage 1 for every PR (one info
  line/tick).
- **Part D — cloud terminal-summary.** When a `/codex/i`-authored comment dated after the cloud ping
  contains "View task", the codex-cloud stage is terminal — do NOT wait the window — and
  `Created commit \`sha\` (msg)` is parsed into `{sha,msg}`.
- **Part E — claude-proxy stage** (between codex-cloud and escalate). Entry = cloud ended undelivered AND
  the original Claude class == `no_delivery` (**GENUINE** — never billing/fixer: a recipe can't fix an empty
  account) AND `claudeEnabled` AND same-repo AND no `claude-proxy` marker yet → post `@claude fix`
  (`agent=claude-proxy state=requested`) telling Claude to **implement EXACTLY** Codex Cloud's summary
  (`<EMBED>` = the terminal summary body, else the findings digest; sanitized per fix #25 **plus**
  `@codex`→`codex`), then a delivery window. `findingsDigest()` now EXCLUDES `claude-proxy` comments so it
  never re-embeds itself; a node regex test confirms stage-1's `agent==='claude'` filter cannot match
  `claude-proxy`.
- **Part F — enriched escalation.** With a detected commit → "A ready diff waits in the Codex Cloud task —
  commit `sha` (msg). Open the task (View task) → Update branch to apply."; chain names the proxy stage.
- **Part G — override-label sweep.** A `codex-p1-acknowledged`-labeled PR whose head verdict is NOT 🟢 is a
  sweep candidate (regardless of pending) → head-targeted gate dispatch (`ref: pr.head.ref`, the shared
  helper), log `override-label sweep: dispatching gate for PR #N @ <head7>`, loud-fail, once/PR/tick.
  Self-limiting: the dispatched run sees the label → 🟢 → the PR stops matching.

### Validation
`yaml.safe_load` + actionlint on both copies of both files; `node --check` on all 5 script bodies; greps —
`billing_error`/`fixer_error`/`no_delivery` in claude.yml, `CLAUDE_ENABLED` in both, `claude_dead` dedupe,
"View task" + `Created commit` regex, `claude-proxy` post+read with the genuine-no-op entry, `findingsDigest`
excludes `claude-proxy`, override-label sweep using `ref: pr.head.ref`; a node regex test confirms
`agent==='claude'` is false for `claude-proxy`; **ZERO** `require('@actions/github')` / `__original_require__`
/ `getOctokit`; `git hash-object` equal per file.

**Handoffs updated in the same commit:** `handoffs/CONTEXT.md` (fixer-ladder rewritten — failure classes,
the 5-stage chain claude → codex-api → codex-cloud → claude-proxy → owner, cloud terminal-summary +
sandbox-has-no-remote, CLAUDE_ENABLED, override sweep), `LOOP_STATE.md` (claude.yml + watchdog fix #26
entries), `handoffs/loop-build.md` (dated entry citing the #88 saga).

**Owner action:** **fund the Anthropic account** — the actual root of #88; until then every Claude call 402s
at 0 tokens (set `CLAUDE_ENABLED=false` to skip the bounce). Otherwise nothing; propagates on the next daily
sync.
