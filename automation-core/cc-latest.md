# automation-core handoff — 2026-11-08 UTC (Codex P1 round on PR #58, closed)

## Outcome

PR #58 (`oauto`, the read-only privacy-restricted OpenCode reviewer launcher) went through
six Codex review rounds and eight independent Opus review passes on its git preflight and
worktree scan. Every Codex finding (three original P1s plus nine further P1s and one P2 raised
on the fixed heads) and every independent-review P1/P2 is fixed on the PR branch with
regression tests that reproduced each leak on the previous code, validated against the real
OpenCode 2.2.6 and git 2.47.3 on the device, installed on the device, pushed, and re-reviewed
by Codex at the exact final head with **no findings**. Codex Gate is green on that head.
The PR stays open and unmerged; the owner merges.

Branch `claude/oauto-opencode-reviewer`, PR <https://github.com/funzi7/automation-core/pull/58>.
Final HEAD `18011a91e35f55c3d94725224c749d08f1ab0ec4` (pushed, == origin). Commits this round:
`b2abc1d` `bddef45` `de81444` `7f79e2e` `a2aa471` `a174b19` `a23cfec` `75c0814` `0ff038a`
`ac10beb` `a87142f` `3733fb3` `60ab40f` `d789b5d` `a7c8548` `18011a9`.

## What was fixed (`launchers/oauto/oauto-run`, `launchers/oauto/oauto-policy.py`)

- **Original P1s (Codex on `d17f3a1`)**: external diff/textconv helpers executed during the
  preflight → every git call runs `timeout 120 env -i`, `--work-tree` pinned, `core.fsmonitor=
  false`, `core.hooksPath=/dev/null`, `log.showSignature=false`, `submodule.recurse=false`,
  `color.*` off, `diff.external=`, every `filter.*` driver emptied (`required=false`, `=` in a
  driver name refuses), diffs carry `--no-ext-diff --no-textconv --no-renames --no-relative
  --no-color --submodule=short --ignore-submodules=dirty`, `git log --no-show-signature`;
  special-character filenames escaped the secret exclusion → `-z` NUL-delimited collection into
  private files, bytes-exact `classify -z`, `:(exclude,literal)` pathspecs, C-quoted listing,
  `check-excluded` proof, collection/proof/pair passes fatal on failure; rename detection hid a
  renamed secret's source → `--no-renames` diffs plus one exhaustive `-M -C -l0` pair pass
  excluding both sides (refuse on failure).
- **Later Codex P1s on the fixed heads**: symlink aliases of `.git`/`.ssh`/`.gnupg`/`.aws`,
  secret-like files and directories holding them, hard links, links inside `.git` leaving the
  repo, a symlinked `.git` or Git config file → refused unconditionally; historical
  `gradle.properties` credentials → changed `CONTENT_CHECKS` files (suffixed copies, rename/copy
  pairs, `=`/`:`/whitespace separators, dotted keys, hunk headers) checked on both sides and
  excluded on a hit, files read in full (>16 MiB refuses); newline-leading filenames hid scan
  hits → C-quoted records and count-based `SUMMARY` verdicts; `.git/config` includes → git's
  own `--show-origin` list plus a conservative parser (BOM, comments, continuations, outside
  hops, linked worktrees), in-repository included files are secret-like (refuse unless
  overridden), excluded and read-denied by exact name plus `*/` form (probed through `debug
  agents`; metacharacter names refuse); deleted include targets and deleted chains → registered
  before the existence check, last committed content (HEAD and merge base) parsed hop by hop,
  outside bridges followed, the scan re-run to a fixed point (≤ 8 passes) so history-found
  present files are counted and alias-checked; referenced-name keying → include targets tracked
  under referenced and canonical names, traversal keyed by the referenced path, an include-name
  link denied by its own name, a directory alias over it refused.
- Contract and limitations are in `docs/adr/0002-oauto-read-only-opencode-reviewer.md` (items 4
  and 8 and the consequences) and `launchers/oauto/README.md`; the full round record is the
  2026-11-08 "Codex P1 round" entry in `handoffs/loop-build.md`.

## Validation actually run (device, git 2.47.3, OpenCode 2.2.6, disposable fixtures only)

- `tests/test_oauto_launcher.js` 75/75 (55 new this round; each new test was run against the
  previous launcher first and failed as expected — repro outputs kept in the session
  scratchpad); `bash scripts/validate.sh` green at the final head: 202/202 node tests, 59
  github-script bodies, actionlint, `git diff --check`.
- Real-binary battery (`oauto-run --check` on fixtures, 60+ checks): hostile textconv/
  command/external/filter/fsmonitor/gpg config → no helper ran; six special-name deleted
  secrets, renamed secrets (worktree and branch), symlink aliases (file, directory, hard link,
  `.git/config`, dangling, two symlinked bridges), gradle credentials (history, colon separator,
  `.bak`, hunk header, 256 KiB+), included Git configs (present, deleted, chained, outside
  bridge, newline-leading name, history-discovered present file counted) — every scenario
  behaved as the docs state; ordinary changes always shown. Six live model probes under the
  rendered config: edit/write, shell, `/etc/hostname`, `.env`, `opencode/big-pickle`,
  `--agent build` all denied/unavailable, no file created, probe secret absent from every
  transcript (the edit probe's first run matched no phrase because the model declined without
  calling a tool; the re-run listed the tools as exactly `glob, grep, question, read, skill`).
- Device: `install.sh` refreshed `/root/work/bin/oauto-run` and `oauto-policy.py` after each
  validated state (backups `*.backup-before-oauto-20261108-{120902,132239,134043,140044,
  144953,152257,154043,160518,163804,171353,174147,183754,192727}`); `--verify` clean;
  installed copies byte-identical (parity test passes); `/root/work/bin/ai-launch opencode
  oauto-selftest-j [deepseek] --check` through the installed launcher resolved the fixture and
  verified sources/models/agents; `ai-launch`, the Termux wrapper and both `.bashrc` blocks
  unchanged (cauto/clauto/ai byte-identical); no fixture, lock, state dir or OpenCode process
  left.

## Review provenance

- Codex (trusted connector): review of `d17f3a1` (3 P1), `de81444` (2 P1), `a174b19` (1 P1 + 1
  P2), `a23cfec` (2 P1), `ac10beb` (1 P1), `3733fb3` (2 P1), `d789b5d` (2 P1), `18011a9`
  (**no findings**). Every thread replied to with the fixing commits and resolved only after the
  fix was pushed and proven; 0 unresolved threads.
- Independent Opus reviewer subagent (not the implementer), eight passes on the PR diff with
  its own attack fixtures: 1 P1 and 7 P2 found and fixed before pushes, the rest P3 taken or
  documented. `review_provider = claude_code_fallback` style, in addition to Codex, never in
  place of it.

## PR / CI / Codex Gate state (verified 2026-11-08 ~19:45 UTC)

- Exact-head CI `validate-automation-core`: success on `18011a9`.
- Codex review state marker: `commit_sha=18011a91e35f55c3d94725224c749d08f1ab0ec4`,
  `has_any_findings=false`, `status=completed`.
- Codex Gate: `check-codex-status` on `18011a9` = success, "🟢 Reviewed — clear: Codex exact-head
  review accepted. No unresolved non-outdated trusted Codex P1/P2 thread blocks 18011a9
  (current_head_signal_no_active_findings)". The `codex-gate-evaluator` job of the push-event run
  (19:35 UTC, before Codex finished) still shows failure in the checks list; the Gate's later
  runs (19:42 UTC) succeeded and published the green check.
- PR #58: OPEN, mergeable, not merged (owner decision).

## Not physically tested / limitations / risks

- The Termux hop itself (`proot-distro login` cannot run from inside the Debian session) — the
  owner must run `oauto <repo>` once from a real Termux shell; no review on a real project
  repository; no full DeepSeek TUI session; LFS/submodule/linked-worktree repositories only
  against the test double and real git, not a real OpenCode session.
- By design: classification is by path (a safe-named file that still holds secret text beyond
  git's 50 % similarity, or copied from an unmodified secret under the override, is shown);
  content checks cover only `gradle.properties`-style names with a heuristic word list;
  included files outside the repository are followed but not checked; an include through a
  directory symlink deleted with its target, and an include line removed from `.git/config`
  together with its target, are not traced; a hard link to a file outside the repository is not
  detected; `git diff` still refreshes stat data in `.git/index`; up to eight scan passes on
  repositories with include chains; `https://org@...` remotes and shared-config includes
  (`include.path = ../.gitconfig`) refuse unless `OAUTO_ALLOW_SENSITIVE_FILES=1`.
- Every model request still transmits the selected code context and the preflight to
  OpenCode's remote inference service under the provider's published zero-retention terms.

## Backlog (reconciled 2026-11-08)

1. **oauto PR #58** — owner merge (Gate green, Codex clean, CI green); one `oauto <repo>` run
   from Termux; owner decision on listing `oauto` in `DEVELOPMENT_RULES_FULL` §7; after any
   OpenCode upgrade re-run `--check`, the fixture battery and the tool-level probes, then bump
   `VALIDATED_VERSION`.
2. **Possible hardening (not requested, not done)**: private `GIT_INDEX_FILE` copy so the
   preflight never writes `.git/index`; content-based secret detection beyond
   `gradle.properties`; resolving deleted include chains through HEAD's tree for directory
   symlinks; `--find-copies-harder` under the override.
3. **Canonical Claude fallback review rollout** — unchanged since 2026-11-07: PR #56 merged but no
   consumer default branch carries `claude-fallback-review.yml`; sync PRs paywall-bot #107, OPT
   #20, TRF #92 open; no repo sets `CLAUDE_FALLBACK_REVIEW_ENABLED`; OPT PR #19 still needs fresh
   exact-head evidence.
4. LOOP_STATE items 1–4 and 7 unchanged and still pending.

## Operating invariants to preserve

- Authoritative policy stays inline in trusted workflow YAML; `tools/*.js` are mirrors.
- No `${{ }}` inside `github-script` bodies; Actions/Checks reads on GITHUB_TOKEN.
- oauto: never `--auto`, never a `plugins` directive, every helper `--standalone`, one pattern
  list for read-deny/policy/scan/diff-exclusion, every preflight git call through `g()`/`gd()`
  (scrubbed, `--work-tree`, helper-free, `-z`, fail closed), the scan as the single refusal
  decision (count-based, quoted records, fixed point over include history), cauto/clauto/ai
  paths untouched (test-pinned), `~/.config/opencode` never written.
