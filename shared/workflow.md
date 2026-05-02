# Shared workflow conventions

> How Dima works. Applies across all apps.

## Communication style

- Hebrew is primary.
- Direct and concise — no preambles, no excessive caveats.
- Disagreement is welcome. Don't capitulate to be agreeable. Push back if there's a reason.
- Mobile is the primary surface. Long responses are read on a phone screen.

## Working with Claude Code

**Discuss before sending.** Always sketch the approach in chat first. Don't generate Claude Code prompts unsolicited.

**Batch related work.** Pack as much related work as possible into each Claude Code prompt. Group similar tasks. Avoid 3-prompt sequences when 1 prompt would do.

**Don't re-prompt completed items.** If something was done in a previous batch, don't include it again. Check state.md / git history first.

**Output format for Claude Code prompts:** Markdown files in `/mnt/user-data/outputs/`, presented to the user, who pastes them to Claude Code.

**Acceptance criteria are mandatory** in every prompt — TypeScript clean, build green, tests pass, observable outcome.

## Branch and PR conventions

- Branch naming: `claude/batch{N}-{description}` (e.g., `claude/batch3-mid-difficulty-sources`)
- PR titles start with conventional commit prefix: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`
- One feature per branch unless tasks are inseparable
- Codex bot reviews PRs automatically — address P1 always, P2 case-by-case

## When something fails

1. Send screenshot/log to Claude (this assistant)
2. Claude diagnoses, doesn't immediately propose a 3-step fix
3. If unclear: ask one focused question to narrow down
4. Once root cause is clear: write a tight Claude Code prompt
5. If the cause is novel: add to relevant `gotchas.md`

## Verification rhythm

- After every Claude Code merge: run a smoke test (manual workflow_dispatch, app reload, etc.)
- Don't enable scheduled crons or background workers until manual run produces expected output
- Screenshots go to Claude for review before declaring success

## Multi-app context

When working on one app, don't pull patterns from another unless explicitly asked. The apps share Dima's preferences but have different stacks, conventions, and constraints.

## Decision-making

- Default to fewer dependencies. Add libraries only when plain stdlib is genuinely insufficient.
- Default to fully automatic. Avoid features that require manual periodic input.
- Prefer offline-first / local-first when possible.
- Hebrew RTL UI is primary across all apps.
