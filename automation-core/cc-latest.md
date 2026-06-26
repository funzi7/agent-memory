# automation-core — latest Claude Code status

## Test PR: Codex backup-fixer probe (throwaway)

**What this is:** a deliberately throwaway test PR that exercises the new Codex
backup-fixer (`codex-backup-fix.yml`) end-to-end. It introduces one clear, safe
defect so Codex will flag it, letting us verify that the Claude-fallback
watchdog dispatches the Codex backup and that the backup pushes a patch directly
to the PR's own branch (no new PR).

- **PR:** #33 — "test(loop): codex backup-fixer probe"
- **Branch:** `test/codex-backup-probe` (base: `main`)
- **Head SHA:** `58a5c348003bcdde2ecc765df13af12a3659f5e2`
- **File added:** `scratch/codex-probe.js` — a standalone scratch file, wired
  into nothing, so a fix is trivial and low-stakes.

**Defect introduced (what Codex should flag):** `lookupUser()` builds a shell
command by string-concatenating untrusted input directly into
`child_process.exec()` — a command-injection vulnerability (e.g.
`username = "x; rm -rf /"`). The safe fix is `execFile` with an args array, or
input validation.

**Status:** throwaway probe — safe to delete. Intentionally NOT labeled
`automerge`. Expected loop: Codex flags the injection (P1/P2) → bridge requests
`@claude fix` → if Claude doesn't deliver within the 20-minute timeout, the
watchdog dispatches the Codex backup, which pushes a fix to this branch.
