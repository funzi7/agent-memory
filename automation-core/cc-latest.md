# automation-core handoff — 2026-11-09 UTC (oauto GLM-audit verification round; PR #58 continued, `main` merged in)

## Outcome

PR <https://github.com/funzi7/automation-core/pull/58> (`claude/oauto-opencode-reviewer`) was continued, not
replaced: `origin/main` `15e44e6` (PR #59, Codex Gate fail-closed) was merged into the branch with the three
documentation conflicts resolved by hand (both sides kept), the owner's GLM whole-repository audit was verified
finding by finding against the code and reproduced on disposable fixtures before anything was changed, the real
gaps were fixed in `launchers/oauto/` with reproduce-first regression tests, an independent Opus reviewer then
found one pre-existing P2 (a crafted `.git` file could point the preflight at another local repository) and six
P3s, all fixed the same way, the installed launcher was refreshed with byte parity, and the branch was pushed.
PR #58 is NOT merged (not asked; owner decision). Final head: see "Review and gate state".

Commits this round (on top of `18011a9`): `01f6840` merge of `main`; `8edc3d3` A/C/D/E fixes; `43b1708`
hard-link counting optimisation; `d2495cd` independent-review fixes (P2 + six P3); `33c0dda` docs; `5860e1f`
Codex P1 #1 fix (commondir in a real `.git`); `0ca1844` docs; `afd4639` Codex P1 #2 fix (committed symlink in
include history); `2c743cf` docs; `62fca59` Codex P1 #3 fix (absolute in-repository symlink targets) + committed
directory symlinks on include paths; `4dc70dd` docs; `4544f09` Codex P1 #4 fix (written include names kept for
history); `9e8a88d` docs; `09dfcc8` Codex P1 #5 fix (symlink targets judged as written and as live-resolved);
`bdc6cef` docs; `2d5d7b7` Codex P1 #6 fix (include resolution context through historical symlink hops);
`0bc9c29` docs; `3059954` Codex P1 #7 fix (tree walk for historical include paths) + `f16dfe6` (dead helper
removed); `d64744c` docs; `f852171` Codex P1 #8 fix (include directives walked uncollapsed); `2389a03` docs; `d9b71a1` Codex P1 #9 fix (byte-exact link targets); `68d2fd2` docs; `8308090` Codex P1 #10 fix (outside aliases re-enter the walk); `3833718` docs — the FINAL head (Codex clean, gate 🟢, CI green).

## Codex rounds on this PR today (exact-head, `@codex review` each time; `pull_request_target` gate runs from the
merged `main` published the trusted head marker on every push — the PR #59 fix works)

1. `33c0dda` (02:20Z push; CI green 02:22Z; receipt 02:27Z): P1 — a real `.git` DIRECTORY carrying a `commondir`
   file naming another repository was accepted by `own_git_info`'s early return (git honours that file in any git
   dir; the victim's committed file appeared in `preflight.md` as a deletion). Fixed in `5860e1f`: such a `.git`
   is refused by `check-repo-git` before any git command, the scan records it, and a submodule git dir is accepted
   only without a `commondir` file; regression test with victim-index-untouched proof. Thread replied + resolved.
   The bridge auto-triggered `@claude fix`; the Claude fixer hit `billing_error` (0 tokens) and handed off to the
   watchdog, which cannot run here (rejected `AUTOMATION_PAT`); nothing touched the branch.
2. `0ca1844` (02:55Z push; CI green 02:57Z; receipt 03:06Z): P1 — an included config that was a committed SYMLINK
   (`conf/a.cfg -> b.cfg`) with both files deleted: the history pass read the link blob as config text, so `b.cfg`
   was never excluded and its removed credential reached the preflight (re-reproduced on the old launcher; the
   fixed one excludes both names). Fixed in `afd4639`: `git ls-tree` mode per revision; a `120000` entry's blob
   goes to the new `resolve-link` subcommand (target resolved as git would; in-repo → excluded/denied/followed,
   absolute/escaping → outside file, empty/root/`.git` → fail closed); tests for the scenario, a chain, a loop, an
   escaping target, a type change and `resolve-link` itself. Thread replied + resolved.
3. `2c743cf` (03:27Z push; CI green 03:29Z; receipt 03:33Z): P1 — `resolve-link` labelled every ABSOLUTE
   symlink target as outside, so `conf/a.cfg -> /abs/<repo>/conf/b.cfg` (both deleted) left `b.cfg` neither
   excluded nor followed (re-reproduced; fixed launcher excludes both). Fixed in `62fca59`: absolute targets are
   judged by where they land (inside → `I`, root/`.git` → fail closed, elsewhere → `O`); the same commit resolves
   a committed DIRECTORY symlink on an include path (`conf -> realconf`, both deleted) by walking the path's
   ancestors at the revision and re-rooting below the `120000` entry — the last documented gap of this class
   (only a never-committed deleted directory link stays unresolvable). Thread replied + resolved.
4. `4dc70dd` (03:58Z push; CI green 04:00Z; receipt 04:02Z): P1 — an include path's directory part was resolved
   against the current filesystem, so a committed `conf -> realconf` retargeted later to a missing `newconf`
   (with `realconf/a.cfg` deleted) reached history only as `newconf/a.cfg` and the committed link was never
   examined (re-reproduced; fixed launcher excludes `realconf/a.cfg`). Fixed in `4544f09`: the path exactly as
   written is registered next to the referenced and canonical names (present → include name; missing →
   unloadable target), so history starts from `conf/a.cfg` and re-roots below the committed `120000` entry. The
   retarget-to-an-existing-directory variant is refused unconditionally by the directory-alias rule. Thread
   replied + resolved.
5. `9e8a88d` (04:22Z push; CI green 04:24Z; receipt 04:33Z): P1 — the same gap inside `resolve-link`: an
   absolute target was realpath-resolved through a later-retargeted directory symlink, so the written path
   never reached history (re-reproduced; fixed launcher excludes `oldconf/b.cfg`). Fixed in `09dfcc8`: every
   symlink target is judged both as written and as live-resolved (one record per distinct result; a relative
   target that escapes and re-enters the repository counts as inside). Thread replied + resolved.
6. `bdc6cef` (04:51Z push; CI green 04:53Z; receipt 04:56Z): P1 — nested relative includes of a committed
   symlinked config were resolved against the link's target directory instead of the path git opened (root
   `c.cfg` vs `configs/c.cfg`), so the root file's removed credential travelled (re-reproduced; fixed launcher
   excludes it). Fixed in `2d5d7b7`: every history entry carries its resolution context (own path for an include
   directive, the referenced link path for a symlink target), content reached under two contexts is processed
   under both, and history-found paths are not re-seeded as their own context. Thread replied + resolved.
7. `0bc9c29` (05:20Z push; CI green 05:23Z; receipt 05:28Z): P1 — a committed `a.cfg -> conf/../b.cfg` with
   `conf -> dirs/nested`: `conf/..` was collapsed lexically (root `b.cfg`) instead of following `conf` first
   (`dirs/b.cfg`), so the committed link was never inspected (re-reproduced; fixed launcher excludes
   `dirs/b.cfg`). Fixed in `3059954` + `f16dfe6`: historical include paths are walked through the tree at the
   revision like a path lookup (`tree_walk`: symlinks replaced before the next component, `..` after the link it
   follows, re-entry handled, >40 hops / empty target / root / `.git` fail closed), replacing `resolve-link` and
   `history_dir_link`; intermediate symlink entries are no longer listed as excluded and a symlink loop among
   deleted included configs now refuses the launch. Thread replied + resolved.
8. `d64744c` (05:55Z push; CI green 05:57Z; receipt 06:01Z): P1 — the same collapse one level up: an include
   DIRECTIVE written `conf/../b.cfg` (in a deleted committed `a.cfg`) was normalised to root `b.cfg` before the
   tree walk could follow the committed `conf` (re-reproduced; git shown to have loaded `dirs/b.cfg`; fixed
   launcher excludes it). Fixed in `f852171`: `uncollapsed_include_path` keeps a directive's `.`/`..`
   components; `includes-in-config` emits them as `W` records, the scan hands the live ones over via
   `--walk-out`, and the launcher walks them under their own context without treating the raw spelling as a
   name. Thread replied + resolved.
9. `2389a03` (06:24Z push; CI green 06:27Z; receipt 06:29Z): P1 — `tree_walk` read a committed link target via
   command substitution, stripping a trailing newline from a filename that ends in one (`a.cfg -> "b.cfg\n"`),
   so the real file was never excluded (re-reproduced; fixed launcher excludes it). Fixed in `d9b71a1`:
   targets read byte-exact (`IFS= read -r -d ''`) after a fail-closed NUL check. Thread replied + resolved.
10. `68d2fd2` (06:47Z push; CI green 06:50Z; receipt 07:02Z): P1 — a committed link target leaving the
    repository through an outside alias directory that points back into it (`/outside/alias -> <repo>`) was
    classified as an outside file, so the deleted target was never excluded (re-reproduced; git shown to have
    loaded it; fixed launcher excludes it). Fixed in `8308090`: outside paths are resolved with `realpath -m` and
    re-enter the walk when they land inside the repository. Thread replied + resolved.
11. `3833718` (07:20Z push; CI green 07:22Z; review-state `completed`, no findings, 07:33Z; gate `🟢 Reviewed —
    clear` 07:33:46Z): clean — the final head.

## GLM audit — verification result (owner-run `oauto automation-core` session, 2026-11-08 ~20:18–20:30Z; report
retrieved from the local OpenCode session store `~/.local/share/opencode/opencode.db`, treated as unverified claims)

| # | Claim | Verified against code | Reproduced | Outcome |
|---|---|---|---|---|
| P2-1 (A) | hard link whose partner is outside the repo is undetectable | yes (README admitted it) | yes, old scan `symlinks=0` | FIXED: refused unconditionally when `st_nlink` > names the scan sees in the worktree, `.git` and (lazily) the object store |
| P2-2 (B) | no backslash deny for `glob` | gap in the deny list is real | NOT exploitable on the real 2.2.6 binary | no code change (fix only if reproducible); defence-in-depth backlog |
| P2-3 (C) | linked worktrees (`.git` file) weaker than `.git` dirs | yes | yes, symlinked `config.worktree` passed | FIXED: gitdir + commondir walked under the `.git` rules |
| P2-4 | mutable third-party action tags | yes (`checkout@v5`, `github-script@v8`, `*-artifact@v4`, `codex-action@v1`, `claude-code-action@v1`, `create-pull-request@v6`) | n/a | backlog (LOOP_STATE item 11), not this PR |
| P3-5 | `validate.sh` globs `*.yml` only | yes; no tracked `.yaml` exists | n/a | backlog |
| P3-6 (D) | `auth.json` etc. missing from the pattern list | yes | yes | FIXED on all four controls (Composer, `.pgpass`, `.my.cnf`, `.s3cfg`, `*.ppk`, kubeconfig, Terraform CLI, RubyGems, service-account spellings) |
| P3-7 | alias list duplicated in `ai-launch` | yes | n/a | backlog |
| P3-8 (E) | `tool.use` ceiling never verified via OpenCode output | yes | yes (`verify-sources` passed with policies deleted) | FIXED: loaded `policies`/`permissions` must equal the rendered arrays verbatim and resolve the probes |

Finding B evidence (read-only Opus investigator, real binary, synthetic fixture): OpenCode 2.2.6's glob/grep
tools run ripgrep with the pattern as a `--glob` filter rooted at the tool's `path`; `path` goes through
`FileAccess.resolve`, which raises `external_directory` (denied) for anything outside the project directory and
treats a backslash as a literal filename character (`windowsPath` is the identity on POSIX). Replaying the exact
ripgrep argv for `\.\./**`, `src/\.\./\.\./**`, `*\..\*`, `*\\..\\*`, `\/**`, `\\/**`, `{\.\.,src}/**` returned
only inside files; grep leaked only with a real `..` path, which `external_directory` denies before ripgrep runs.

## What changed (`launchers/oauto/oauto-policy.py`, `oauto-run`, `tests/test_oauto_launcher.js`,
`launchers/oauto/README.md`, `docs/adr/0002`)

- A: per-inode name count for `st_nlink > 1` files across the worktree and `.git`; unaccounted → `SYMLINK <name>
  -> <path> (hard link: N names, M inside the repository; ...)`, unconditional (also for secret-named files);
  aliases of secret-like/git-dir files keep `hard link to <x>`; in-repo pairs and hook links accepted; object-store
  partners (`git clone . inner-copy`, git-annex thin mode) accounted by a lazy walk of the pruned `objects` dirs.
- C: `walk_git_dir` shared by `.git` and the gitdir/commondir of a `.git` file: symlinked Git config files
  refused, regular files registered as alias targets (hooks excepted), configs credential-checked; ordinary
  symlinks in out-of-worktree git dirs not reported; a secret-named alias of a git-dir file refused unconditionally.
- P2 (review): `check-repo-git` — `.git` must be a real directory, or a `.git` file parsed exactly like git whose
  gitdir is this worktree's linked-worktree admin dir (`gitdir` back-pointer → this `.git`, under
  `<commondir>/worktrees/<name>`) or its submodule gitdir (`core.worktree` → this worktree); `oauto-run` calls it
  before ANY git command; the scan reports an unowned pointer too.
- D: `SENSITIVE_READ_PATTERNS` extended (read denies, `tool.use` ceiling, scan and preflight exclusion all follow
  the one list); PROBES 40 → 44; case variants the case-sensitive rules miss (`Auth.json`, `.PGPASS`) are handed
  over by the scan (`--unruled-out`) and denied by exact name for the launch (a glob metacharacter in such a name
  refuses the launch).
- E: `verify-sources` requires `debug config`'s `info.policies` / `info.permissions` to equal the rendered arrays
  rule for rule and replays `policy_probes()` + PROBES (incl. `--deny-read`); real 2.2.6 carries both arrays
  verbatim (`policies ok: 62 probes; permissions ok: 44 probes`).
- Walk errors: `SKIPPED <path>: <reason>` records + exit 3 (fail closed); launcher message updated (unexercised:
  root can list everything here).
- Docs: README rows/paragraphs, ADR 0002 items 1/4/5 + a glob consequence; LOOP_STATE items 8 (marker observed),
  10 (oauto) and 11 (new backlog), "Device launchers"; CONTEXT §3 + A1 + A00; `handoffs/loop-build.md` dated entry.

## Validation actually run

- Reproductions on the previous code for every fixed finding (scratchpad logs quoted in the handoff entry).
- `bash scripts/validate.sh` green at `8308090` (the final code; `3833718` is docs-only on top): 278/278 node tests
  (`tests/test_oauto_launcher.js` 106: 75 + 12 round 1 + 7 round 2 + 12 across the ten Codex P1 rounds), 59
  github-script bodies, actionlint, `git diff --check`, source/mirror parity — 736 s; green after every fix
  commit before it (266 → 278 tests).
- Real OpenCode 2.2.6, `oauto-run --check` on fixtures: clean repo, submodule checkout and linked worktree pass
  (sources verbatim, models, agents); outside hard link under an innocent name refused with the override; Composer
  `auth.json` refused / verified with the override; `Auth.json` read-denied by exact name under the override
  (64/46 probes); symlinked `config.worktree` of a linked worktree refused; crafted `.git` file refused before any
  git ran (victim index untouched). Installed copy `/root/work/bin/oauto-run <fixture> deepseek --check` verified.
  No OpenCode process or service left; `~/.config/opencode` untouched.
- Device: `install.sh` applied after every launcher change up to `8308090` (`oauto-run`, `oauto-policy.py`
  replaced; backups `*.backup-before-oauto-20261109-020906` … `-070717`), `--verify` clean after each,
  device-parity test green; `cauto`/`clauto`/`ai` unaffected (installed `ai-launch` == tracked == pristine +
  exactly the `opencode`-mode edits; the installed copy's `--check` on a fixture verified sources/models/agents).
- Not run / not verifiable here: `SKIPPED` walk-error path (root); a real-binary session on a repository with hard
  links or a linked worktree (fixtures only); a full DeepSeek TUI session; the Termux hop with the refreshed
  launcher (hop files unchanged; the owner's 2026-11-08 Termux run proved the hop).

## Independent review

Opus reviewer subagent (not the implementer), `git diff 01f6840 43b1708`, adversarial fixtures: no new P1; one
P2 (pre-existing, crafted `.git` file → cross-repository content in the preflight), six P3s (git-exact pointer
parsing, sampled verification, case variants under the override, object-store regression, secret-named git-dir
alias, `onerror=None`). All fixed in `d2495cd` with reproduce-first tests; the reviewer's probe scripts now fail
on every case they previously passed. Provenance: `review_provider = claude_code_fallback` style independent
review in addition to the Codex review requested on the pushed head (below).

## Review and gate state of the final head

Final head `3833718cdafda50595eb9c1ac253ea8b8ec12289` (pushed 07:20Z; `@codex review` 07:20:18Z). Exact-head
evidence on the PR: CI `validate-automation-core` success (07:22:57Z); Codex review-state marker for
`3833718c…` with `status=completed`, `has_any_findings=false`, `has_unresolved_findings=false` (07:33:32Z) —
no inline findings; Codex posted no receipt comment for this head, so the gate bound through the structured
marker (the binding PR #59 added); Codex Gate `check-codex-status` = `🟢 Reviewed — clear` (07:33:46Z,
`current_head_signal_no_active_findings`); 24 review threads, 0 unresolved (each of the ten Codex P1s of this
day was answered with its fix commit and resolved only after the fix was reproduced-first, tested and
validated); the `pull_request_target` gate run of every push published the trusted head marker. PR #58 is
`OPEN`, `MERGEABLE` (conflicts gone), `mergeStateStatus=UNSTABLE` only because the diagnostic
`codex-gate-evaluator` job of the pre-review `pull_request_target` run is red by design (🟡 at push time).
NOT merged: the owner merges (`gh pr merge 58 --squash --repo funzi7/automation-core`) — the PR carries no
`automerge` label and this repository's Merge Bot cannot run anyway (rejected `AUTOMATION_PAT`, item 9).
Ten Codex rounds in total today (`33c0dda` → `3833718`), each a valid P1 in the include-history traversal or
the `.git` pointer handling, each reproduced on the previous launcher before the fix; the bridge auto-triggered
`@claude fix` on every finding and the Claude fixer failed each time with `billing_error` (0 tokens) — nothing
but this session touched the branch (origin verified before every push).

## Not physically verified / risks

- Filesystems reporting `st_nlink` = 1 for hard links defeat the hard-link rule (none known on this device).
- The loaded-policy verification proves OpenCode parsed the rendered arrays verbatim and that they resolve the
  probes under the launcher's matcher model; it is not a runtime decision trace (the live tool-level probes of the
  earlier rounds remain the evidence for matcher semantics).
- The backslash glob deny-list gap is real but non-exploitable on 2.2.6; any OpenCode upgrade re-opens it with
  the `VALIDATED_VERSION` pin.
- New refusals an owner may meet: files hard-linked from a package store or `cp -al` copy outside the repository;
  a linked worktree moved without `git worktree repair`; repositories holding `auth.json`-style files (override).

## Backlog reconciliation

1. DONE (this round): merge of `main`; GLM findings A, C, D, E; review P2 + six P3s; docs; device refresh; marker
   publish of PR #59's fix observed on PR #58 (LOOP_STATE item 8); owner's Termux hop and real-project review
   recorded as done (2026-11-08).
2. PENDING (owner): merge PR #58 when satisfied; rotate automation-core `AUTOMATION_PAT` (LOOP_STATE item 9);
   decide on listing `oauto` in `DEVELOPMENT_RULES_FULL` §7; a full DeepSeek TUI session; let paywall-bot's daily
   sync (03:00 UTC) refresh #107 and update paywall-bot's local gate test there.
3. SUPERSEDED: "a hard link to a file outside the repository cannot be detected" (README/ADR) → detected and
   refused; "a link into `.git/objects` is refused" (round-1 wording) → accounted as an in-repository name;
   `verify-sources` as a source-list check only → verbatim + probes.
4. FUTURE (LOOP_STATE item 11): SHA-pin third-party actions; `validate.sh` `*.yaml`; alias set from
   `oauto-policy approved`; optional `*\*` glob deny; `--show-origin -z` format guard.

## Operating invariants to preserve

- One pattern list drives read denies, `tool.use` ceiling, scan and preflight exclusion; the scan's `SUMMARY`
  counts are the only parsed decision input; refusals of outward links, aliases, unaccounted hard links, symlinked
  Git configs and foreign `.git` pointers are unconditional; `OAUTO_ALLOW_SENSITIVE_FILES=1` only accepts the grep
  exposure of in-repository secret-like files; no `--auto`, `--standalone` helpers, scrubbed `env -i`, private
  `XDG_CONFIG_HOME`; `VALIDATED_VERSION` 2.2.6 pin.

---

# Previous handoff — Codex Gate reliability (PR #59, MERGED 2026-11-08 as `15e44e6`)

- Root cause and fix as recorded in the 2026-11-08 `handoffs/loop-build.md` entry: `pull-requests: write` on the
  gate and the fallback producer; technical errors fail closed (`🟠`); structured `codex-review-state:v1`
  binding; thread truncation fail-closed; canonical evidence block hardening; 25-scenario end-to-end harness.
- Post-merge validation: DONE for the marker — on 2026-11-09 02:20Z the first `pull_request_target` gate run from
  the merged `main` (PR #58 push `33c0dda`, run `42550382183`) logged `indexed trusted head epoch run` and left the
  `github-actions[bot]` `codex-head-epoch:v3` comment (no 403). The `🟠` verdict was not induced (tests only).
- Still pending: automation-core `AUTOMATION_PAT` rejected (`Bad credentials` since 2026-09-11; Merge Bot,
  Watchdog, CI Doctor red) — owner rotation (LOOP_STATE item 9); paywall-bot sync PR #107 refresh by the daily
  sync at 03:00 UTC (or owner dispatch), Codex re-review there, and the paywall-bot-side update of its local
  `tests/test_codex_gate_logic.js` summary-row pins (a paywall-bot commit, never made from automation-core).
