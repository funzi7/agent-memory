# private-media-tv — coordination protocol: Codex owns the repository (recorded by Claude Code, 2026-10-07)

Recorded by Claude Code from the owner's coordination instruction. The instruction reached the Claude session
truncated (its opening lines were missing; the received tail began "…itory writer is allowed."). This note records
the protocol as received plus the standing rules it rests on (`DEVELOPMENT_RULES_FULL.md`: one heavy build per
device, `agent-memory-finalize` as the only agent-memory Git path, §13 three-line answers). Codex adopts/reconciles
it into canonical tracked project state at its next safe checkpoint; the owner corrects anything misread here.

## Protocol

1. **One repository writer at a time.** Only one agent may write to `/root/work/private-media-tv`. Current owner:
   **Codex** (a `codex --yolo … -m gpt-5.6-sol` process has been running in the tree for ~5.5 h at the time of
   writing; HEAD `41593a823ec3f934def33411c6d7bcc059f07053` "D1: remove row-key publication allocation", 2026-10-07;
   39 tracked files modified and uncommitted = Codex's in-flight D1 work).
2. **While Codex owns it, Claude Code must not patch:** tracked files; the working tree (including Codex's
   uncommitted changes); Git state (no add/commit/stash/restore/reset/rebase/checkout); heavy builds or the shared
   build lock; device installs (Shield, phone); the VPS; the untracked diagnostic files. A needed change is
   **reported** (here, in `agent-memory/private-media-tv/`) instead of made.
3. **Allowed for Claude Code meanwhile:** read-only inspection (git log/status/diff, files, logs) and reporting into
   `agent-memory/private-media-tv/` through `/root/work/bin/agent-memory-finalize` only (direct Git in agent-memory
   is hook-blocked). No new agents that write to the repository.
4. **Hand-over:** at Codex's next safe checkpoint, Codex separately adopts/reconciles this protocol into canonical
   tracked project state (AGENTS.md / docs / TODO) and normal finalization rules apply from then on. Ownership
   returns to Claude Code only by an explicit owner instruction.
5. **The old Claude task is not continued.** The two Claude agents that died on the 2026-09-29 weekly usage limit —
   the LATER-2 build (TV 66) and the Main-thread heaviness audit — were **not** resumed. LATER-2 and LATER-3 were
   completed by later sessions (LATER-2 through `0717eb7d`, LATER-3 through `e273f99d`, 2026-09-30; TV 67
   checkpoint `9b6adaa8`), so nothing of that task is pending. The current line is D1 (`cc-latest.md`, 2026-10-04:
   roadmap D1 → D2 → D3 → RANK-1 → SY7 → T3 → T4).

## Facts at hand-off (read-only, 2026-10-07)

- `private-media-tv`: HEAD `41593a823ec3f934def33411c6d7bcc059f07053`, unchanged by Claude; tree dirty with
  Codex's uncommitted work (39 files, +3016/−259 at the time of reading) left exactly as found; `t.html` untracked.
- `agent-memory`: HEAD `8341e116cf5a6bc36455323f281449c48e0451bb` = `origin/main` before this note; worktree clean
  before this note.
- Processes: no Claude agents, builds or logcat captures running (ps showed only the Codex process, the host ADB
  server and the Claude main session). Heavy-build lock untouched. No device, VPS or network action taken.
- Claude's 2026-09-28/29 planning files still exist in the session scratchpad
  (`/tmp/claude-0/-root-work-private-media-tv/143a246c-…/scratchpad/`: `server-data/D2-BRIEF.md`, `D3-BRIEF.md`,
  `D4-BRIEF.md`, `proposals/RANK-1-BRIEF.md`, `tv-port/T3-REFRESH.md`, `T4-REFRESH.md`, `later-plans/*`,
  `player-next/*`, `devchecks/MORNING-2026-09-29.md`). They are session-local, dated before LATER-2/LATER-3 and D1
  landed, and partly superseded; Codex decides at its checkpoint whether any of them is worth adopting. They are
  not canonical.
- Owner questions that were open at Claude's last session (2026-09-29) — verify against `cc-latest.md` before
  re-asking: `כותרים דומים` (A leave / B only with a real rating / C remove); subtitle size per screen vs one;
  D4b ג'ירפה ties (a listing cards only / b only when TMDB confirms the service / c names alone); D4a before or
  after the TV port; (after T4) whether a match watched on the phone reveals its result on the TV.
