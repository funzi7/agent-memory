# automation-core handoff — 2026-11-08 UTC

## Outcome

`oauto <repo>` exists: a Termux-accessible launcher that opens OpenCode 2.2.6 on a
repository under `/root/work` as a **read-only, privacy-restricted code reviewer**,
pinned to the two approved OpenCode Zen free models and enforced by OpenCode
configuration and policy, not by prompt alone. It reuses the cauto/clauto repository
resolution (`/root/work/bin/ai-launch`, now tracked in this repo) and leaves the
`cauto`, `clauto` and `ai` behaviour byte-identical.

Branch `claude/oauto-opencode-reviewer` (from `main` =
`15652f663ccf31fac3c03651a5a7b56758257de4`); PR and HEAD in "Git state" below. The
launcher is installed on the device already; the PR only tracks it.

## What was built

- `launchers/ai-launch` — tracked copy of the live launcher. First commit imports it
  byte-identical; later commits add the `opencode` mode, which `exec`s
  `/root/work/bin/oauto-run "$SELECTED_REPO" [alias] "$@"` right after `cd`, before the
  cauto/clauto banner; a leading `glm`/`deepseek` argument is kept for oauto-run instead
  of being taken as a repository name (`oauto deepseek` → menu, then DeepSeek).
  `codex`/`claude` exec blocks and the `ai` menu are unchanged (a test rebuilds the file
  from `tests/fixtures/ai-launch.pristine` plus exactly the intended edits). The original
  live file is kept as `/root/work/bin/ai-launch.backup-before-oauto-20261107`.
- `launchers/oauto/oauto-run` — lock first (re-exec under `flock -n --close`, held by the
  flock parent for the OpenCode process lifetime; lock key `<repo>-<path hash>`); fail-closed
  preflight: OpenCode version must be exactly 2.2.6; no `/etc/opencode/opencode.json(c)`;
  no `opencode.json(c)`/`.opencode/` in the repository and no `opencode.json(c)` in any
  parent; one unpruned, case-insensitive worktree scan (`oauto-policy.py scan`, budget
  `OAUTO_SCAN_BUDGET`, default 180 s, fail closed when exceeded): secret-like files →
  refuse unless `OAUTO_ALLOW_SENSITIVE_FILES=1`; symlinks leaving the repo → refuse
  (targets under `/usr`,`/bin`,`/lib` tolerated for virtualenvs); credential-looking lines
  in `gradle.properties` or a `user:secret@` remote URL in `.git/config` → refuse. Then a
  read-only git preflight (`GIT_OPTIONAL_LOCKS=0`, every git call time-bounded, byte caps:
  status 8000, stats 4000, diffs 24000 each, log 3000, total ≤ 100,000; detached/unborn
  HEAD handled) with every changed, deleted or untracked secret-like path excluded from the
  diffs by `:(exclude,literal)` pathspec and listed by name; saved to
  `~/.local/state/oauto/<repo>-<hash>/preflight.md` and passed as the TUI's first prompt.
- Private config per launch: `XDG_CONFIG_HOME=~/.local/state/oauto/<repo>-<hash>/xdg-config`
  (OpenCode honors it; `~/.config/opencode` is then neither read nor written). Rendered by
  `oauto-policy.py` (stdlib, `python3 -I`): deny-all `permissions` then allow
  `read`/`glob`/`grep`/`question`; `read` denies from ONE pattern list (dotenv, keys,
  keystores, `*.p8`, SSH/GPG/AWS/Docker homes, `.git/`, `.netrc`, `.npmrc`, `.pypirc`,
  `local.properties`, `*keystore.properties`, credentials/client_secret/service-account
  JSON, `*secrets*.{json,yaml,yml,toml,properties}`, Terraform state) with `.env.example`
  style templates re-allowed; escaping glob patterns denied (`/*`, `~*`, `..*`, `*{/*`,
  `*[*`, `*$*`); explicit denies for `shell`, `edit`, `webfetch`, `websearch`, `subagent`,
  `skill`, `execute`, `external_directory`, image generation, browser; same ruleset on both
  reviewer agents; `title`/`summary`/`compaction` deny-all and pinned to the launch model;
  `build`/`plan`/`general`/`explore` disabled; `policies`: `provider.use` deny `*` + allow
  `opencode`, `integration.connect` deny `*`, `integration.use` only `opencode`,
  `mcp.use`/`skill.use`/`plugin.use`/`websearch.use` deny `*`, `tool.use` denies mirroring
  the permissions; `share: disabled`, `update: disable`, `snapshots/lsp/formatter/websearch:
  false`, `mcp.servers: {}`, `skills: []`; every model the binary offers except the approved
  one(s) disabled (static list + dynamic from `opencode models`). The same pattern list
  drives the scan and the diff exclusion (`classify`). Verifiers parse `opencode debug
  config` (only the private dir/file may be a source), `opencode models` (exactly the
  approved set) and `opencode debug agents` (40 probes per agent); afterwards the private
  config dir must still contain only `opencode.json`. All helper calls run `--standalone`
  inside a time-bounded, `env -i` scrubbed helper.
- Launch: `env -i` (HOME/PATH/TERM/LANG/TMPDIR/SHELL/USER + private XDG_CONFIG_HOME;
  COLORTERM/LC_ALL/XDG_*_HOME passed through when set) → `opencode --standalone --prompt
  <preflight>`. Never `--auto`, never `--worktree`.
- Termux: `/data/data/com.termux/files/usr/bin/oauto-launch` (`proot-distro login debian --
  /root/work/bin/ai-launch opencode "$@"`, no env pass-through) and an `oauto()` block in
  Termux `~/.bashrc`; Debian `~/.bashrc` gets `oauto()` too. `launchers/oauto/install.sh`
  installs/refreshes idempotently (`--verify`; backs up replaced files as
  `*.backup-before-oauto-<stamp>`; refuses unpaired bashrc markers and unknown arguments).
- Approved models (opencode.ai/docs/zen, read 2026-11-07): `opencode/glm-5.3-flash-free`
  (default) and `opencode/deepseek-v4.1-flash-free` (`oauto <repo> deepseek`); both $0 in/out;
  the page states for each "Its provider follows a zero-retention policy and does not use
  your data for model training". The other free models on that page carry retention or
  training clauses and are disabled.
- Docs: `docs/adr/0002-oauto-read-only-opencode-reviewer.md`, `launchers/oauto/README.md`,
  README `launchers/` section, `LOOP_STATE.md` (TODO item 8 + "Device launchers"; item 5
  reconciled), `handoffs/CONTEXT.md` §7 A0/A1, `handoffs/loop-build.md` dated 2026-11-08
  entry (full validation record and review findings).

## Validation actually run (device, OpenCode 2.2.6, disposable fixture repos only)

- `tests/test_oauto_launcher.js` 20/20 pass (contract, scan/classify, verifiers with 13
  mutations, and the launcher driven end to end against `tests/fixtures/fake-opencode`: clean
  check, dynamic model disabling, secret refusal/override, symlink classes, deleted-secret
  exclusion, project/parent config refusal, version pin, bad args, lock contention,
  detached/unborn HEAD, oversized diff, scrubbed launch, ai-launch routing and parity,
  install.sh); `bash scripts/validate.sh` green (YAML, mirrors, 59 github-script bodies,
  actionlint); `git diff --check` clean.
- Real binary `--check` paths (GLM, DeepSeek, via `ai-launch opencode <repo>`, via the Debian
  `oauto` function): config sources = only the private file; models = exactly the two
  approved ids; 5 agents resolved, 40 probes each as expected.
- Real binary refusals: `.opencode/` present; outward symlink (even with the secrets
  override); secret-like files; override → pass with WARNING and no secret marker in the
  preflight.
- Real binary tool level (exact rendered rules, harness prompt): read `.env`,
  `config/server.pem`, `.git/config`, `.ssh/config` → `Permission denied: read`;
  `/etc/hostname` → `Permission denied: external_directory`; `.env.example`, `src/calc.py`
  readable; write/edit/shell/webfetch/subagent absent from the tool list; identical under
  `--auto`; glob `{/root,x}/.ssh/*` → `Permission denied: glob`, `**/*.py` works; `--model
  opencode/big-pickle` → `Model unavailable`; `--agent build` → `Agent not found`. Earlier
  rounds on the same rules: `glob /root/*` denied, skill load of the real local skill `docs`
  → `Unable to load skill` with no skills visible, a project `.opencode/plugins/marker.ts`
  executed without policies and not under the `plugin.use` deny policy, `plugins: ["-*"]`
  removed the free-tier provider (not used). No fixture file changed; no process left.
- Real launch through the installed launcher under a PTY: lock held by the flock parent,
  tree `flock → bash oauto-run → opencode --standalone --prompt → opencode.exe serve --stdio
  --port 0` (no shared service), preflight auto-submitted, the model read the file, globbed
  for tests and returned a P1 on the planted regression; afterwards nothing remained and
  `~/.config/opencode` was untouched.

## Independent review

An Opus reviewer subagent (not the implementing agent) reviewed the first complete version:
2 P1 (deleted/modified tracked secrets reached the model through the preflight diff; scan
narrower than the read-deny list, case-sensitive, pruned), 10 P2 (shared global config
rewritten before the lock, `oauto deepseek` ran GLM, cap arithmetic, venv symlinks refused,
skills/symlink/refusal wording, config-dir denylist, install.sh marker deletion, missing
behavioural tests), 10 P3. All addressed as recorded in the handoff entry.

## Not physically tested / limitations / risks

- The Termux entrypoint itself: `proot-distro login` refuses to run from inside the Debian
  PRoot session ("attempted to run proot-distro in a proot session"); the wrapper mirrors
  `cauto-launch`; the owner must run `oauto <repo>` once from a real Termux shell.
- No review on a real project repository (fixtures only); no full DeepSeek TUI session (only
  `opencode run` with the DeepSeek agent and `--check`); offline behaviour not exercised
  (fails closed at the `models` step by design); `/etc/opencode` and preflight-size refusals
  exist in code but were not exercised; the free tier's daily request limit is documented
  by OpenCode without a number; whether a running TUI re-reads its private config
  mid-session is unknown.
- Every model request transmits the selected code context and the preflight diff to
  OpenCode's remote inference service; zero retention is the provider's published term. The
  preflight is visible in `/proc/<pid>/cmdline` to same-user processes while the session runs.
- `grep` is content-returning and path-unrestricted by OpenCode design (explicit
  `path: ".env"` returned the line) — the worktree scan is the real control; project
  `AGENTS.md` is sent to the model as instructions; OpenCode downloads ripgrep to
  `~/.cache/opencode/bin/rg` on first grep (done, cached); helper commands without
  `--standalone` start the shared background service (one was started and stopped during the
  investigation; `~/.config/opencode/service.json` with a local service password remains, my
  earlier global `opencode.json` artifact was removed so that directory is back to
  OpenCode-owned content only).
- The launcher refuses any OpenCode version other than 2.2.6 until re-validated
  (`VALIDATED_VERSION` in `oauto-run`); `update: disable` prevents silent upgrades.
- No code-editing OpenCode mode exists; not requested.

## Git state

- automation-core branch `claude/oauto-opencode-reviewer`, HEAD:
  `915a12d204f6e03ba3c8a87f2f0ee12f2c354ebb` (pushed; commits: byte-identical
  ai-launch import `11980eb`, rollout-status reconciliation `3fe1829`, the launcher
  `d17f3a1`, stray `__pycache__` removal + PR link `915a12d`)
- PR: <https://github.com/funzi7/automation-core/pull/58> — open, not merged; no Codex
  review yet
- `main` unchanged at `15652f663ccf31fac3c03651a5a7b56758257de4` (PR #56 merged
  2026-09-15T14:03:30Z).

## Backlog (reconciled 2026-11-08)

1. **oauto** — owner to run `oauto <repo>` once from Termux; merge the PR; decide whether
   `DEVELOPMENT_RULES_FULL` §7 should list `oauto` beside `cauto`/`clauto`. After any
   OpenCode upgrade: re-run `oauto <repo> --check`, the fixture battery and the tool-level
   probes, then bump `VALIDATED_VERSION`.
2. **Canonical Claude fallback review rollout** — PR #56 is merged, but as of 2026-11-07 no
   consumer default branch has `claude-fallback-review.yml` (paywall-bot, OptionsProfitTracker,
   thai-rent-finder, agent-memory all 404); sync PRs paywall-bot #107, OPT #20, TRF #92 are
   open and unmerged; no repo sets `CLAUDE_FALLBACK_REVIEW_ENABLED`. OPT PR #19 still cannot
   pass without fresh exact-head evidence.
3. Items 1–4 and 7 of the LOOP_STATE TODO (Claude-budget and OpenAI-quota runtime
   verification, downstream audit, Codex Cloud limitation, minutes-guard coverage) are
   unchanged and still pending.

## Operating invariants to preserve

- Authoritative policy stays inline in trusted workflow YAML; `tools/*.js` are mirrors.
- No `${{ }}` inside `github-script` bodies; Actions/Checks reads on GITHUB_TOKEN.
- oauto: never `--auto`, never a `plugins` directive, every helper `--standalone`, one
  pattern list for read-deny/policy/scan/diff-exclusion, fail closed on any verifier error,
  cauto/clauto/ai paths untouched (test-pinned), `~/.config/opencode` never written.
