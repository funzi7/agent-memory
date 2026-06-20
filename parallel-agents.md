# Parallel-agent protocol

Agents: CLAUDE_CODE (clone OptionsProfitTracker_git) and CODEX (clone OptionsProfitTracker_codex). Both push to origin/main.

EVERY task, in order:
1. git fetch and git pull --rebase origin main (STOP if uncommitted).
2. Read agent-memory: state.md, gotchas.md, roadmap.md, AND in-progress.md.
3. Your prompt lists ALLOWED files and FORBIDDEN files. Touch ONLY allowed files. If you would need a file the OTHER agent OWNS in in-progress.md, STOP and report.
4. APPEND your ownership line to in-progress.md and push it BEFORE editing code.
5. Build ONLY in your own clone.
6. Commit and push OPT. Then agent-memory: pull --rebase right before push; if push rejected, pull --rebase and retry. Finally REMOVE your in-progress line and push.
7. Shared files (Screen.kt, MainActivity, AppModule, DB schema) - only the agent whose task owns them this round may touch them, and only if in-progress shows the other agent is not in them.
