# automation-core — latest Claude Code status

## Fix #13 — bridge inlines the Codex P1/P2 finding text into the @claude fix comment

**automation-core main commit:** `e596873`

The bridge pinged "@claude fix … Codex flagged N active P1/P2 finding(s)" but
WITHOUT the finding text. Codex posts the specifics as INLINE review comments, and
**claude.yml's run context cannot read inline review threads** (`gh pr view
--comments` / `gh api` / GraphQL `reviewThreads` all 403 on a `statusCheckRollup`
permission error). So Claude was pinged with the count but no actionable content
and replied "I can't see the specific change; restate it as a top-level comment."

**Fix — make the @claude fix comment self-contained:**
- **Check step** (already has `reviews` / `reviewComments` / `latestCommitDate`):
  builds a markdown digest reusing the existing P1/P2 substring + `onHead`
  freshness — from `reviewComments` (Codex + P1/P2 + onHead → `` - `path:line` —
  <body> ``, line→`original_line` fallback) and `reviews` (→ `- <body>`). Caps the
  WHOLE digest at ~6000 chars (whole findings; appends "(N more truncated; see the
  Codex review on this PR)"). Outputs `findings_digest`; sets `finding_count` = the
  digest bullet count.
- **Comment step:** reads the digest via an **env var** (`FINDINGS_DIGEST`, safe
  for arbitrary markdown — no `${{ }}` interpolation into the JS string) and embeds
  it: `@claude fix` / `[auto-triggered]` marker / "…the inline review threads are
  NOT readable from your run context, so the findings are inlined below — apply a
  fix for each: --- <digest> ---".
- **Fallback** (empty digest, guarded): the prior generic message + "Codex's
  findings are in this PR's review — read the review body/threads on the PR."
- Unchanged: AUTOMATION_PAT token, concurrency group, the 3-round circuit breaker,
  and the freshness rule — only the comment body is enriched.

**Validation:** actionlint clean on both copies; node --check on all 3
github-script blocks; a digest self-test passes (inline `path:line` formatting;
excludes P3-only / non-Codex / stale notes; ~6000-char truncation note;
empty→fallback); `workflows/` ↔ `.github/workflows/` byte-identical (blob
`b7d9513`).

**Propagation:** rides the **daily sync** to the downstream repos — Claude now
receives the actual Codex P1/P2 text inline and can act without the inline review
threads it can't read.
