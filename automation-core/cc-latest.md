# automation-core — latest Claude Code status

## Fix #7: claude.yml fixer — raise --max-turns 20→50 + broaden allowedTools

**automation-core main commit:** `048c391`

**Problem (confirmed on paywall-bot #49):** the autonomous fixer failed with
**`error_max_turns`** — $0.77 spent over 21 turns with **11 permission_denials**.
The fixer kept trying tools OUTSIDE its narrow `--allowedTools` list, burned the
20-turn cap on denial churn, and never opened a fix PR. Budget was NOT the cause
(ANTHROPIC_API_KEY set; token had write). Two root causes: turn cap too low AND
allowlist too narrow.

**Fix (in `claude.yml`, both copies byte-identical, blob `c6533d3`):**
- `--max-turns 20 → 50`.
- Broadened `--allowedTools`: kept `Read,Glob,Grep,Edit,Write`; **added
  `MultiEdit`**; replaced per-subcommand `Bash(git ...)` with broad
  **`Bash(git:*)`**; added `Bash(python:*)`/`python3`/`pytest`/`pip`/`node`/`npm`
  + `ls`/`cat`/`find`/`head`/`tail`/`sed`/`mkdir`/`cp`/`mv`; kept
  `Bash(gh pr:*)`/`Bash(gh issue:*)`/`Bash(actionlint)`.
- Prompt: one line telling the fixer to stay inside the allowlist (denied calls
  waste turns) and treat the PR's CI (codex-gate) as the final validation rather
  than blocking on a local full-suite run.
- Comment block rewritten to explain the new cap + allowlist + WHY, with a
  security note: the fixer can already commit+push via Edit+git, so a broader
  command allowlist adds little marginal risk.

**Validation:** actionlint clean on both copies; YAML parse confirms the
`--allowedTools` quoting is a single well-formed string; `workflows/` ↔
`.github/workflows/` byte-identical.

**Propagation:** rides the **daily sync** to the downstream repos. Combined with
fix #6 (gate blocks P1+P2) and fix #4 (loud watchdog), the loop can self-heal
once `AUTOMATION_PAT` has the `Actions: write` scope. Remaining owner-side:
close #38, run a fresh downstream sync.
