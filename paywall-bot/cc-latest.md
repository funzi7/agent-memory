# paywall-bot — PR #85 Jina social-classification handoff (2026-07-22)

## Git and pull request

- Repository: `funzi7/paywall-bot`.
- PR: #85, https://github.com/funzi7/paywall-bot/pull/85 (open, non-draft,
  targets `main`; not merged).
- Branch: `fix/techfeedil-live-render-content-integrity`.
- Starting local/remote/PR head:
  `40daabce1e3249b3a430774f9ae3ba07f9271854`.
- Final local/remote/PR head and main follow-up commit:
  `f5346fde17c29a1b4b7d0ac5d891f3ea4590ac0e`.
- Commit: `Require complete Jina social embed classification`.

## Root cause

The ordered-content stabilization at `40daabce` left one Jina lifecycle flaw:
`_extract_jina_social_groups` added every marker-bearing block to `consumed`
during discovery, before it had proved valid tweet text, one unambiguous local
status identity, safe footer ownership and a clean structural boundary. A
plain editorial sentence mentioning `pic.twitter.com` could therefore vanish
without producing an embed. The nearby pre-splitter could also isolate content
on marker presence before complete classification, while duplicate visible/
link-target marker representations and punctuation-only boundary fragments
could distort candidate counts or masquerade as tweet text.

## Structural solution

- Jina now builds provisional atomic records without changing `consumed`.
  Reconciliation first requires a payload-bearing tweet fragment, exactly one
  canonical status identity from contiguous strict footer blocks, exclusive
  footer ownership, clean validation and a fully claimable marker block. Only
  confirmed groups populate the consumed-block set.
- Incomplete, ambiguous, unsupported or conflicting candidates return their
  marker/status-bearing source blocks to the normal editorial pipeline. Only
  complete detached account/date metadata may be suppressed when it is
  structurally attached and safe. Ordinary prose, headings, images, lists,
  tables, CTA links, code and thematic breaks are hard ownership boundaries.
- The source pre-splitter is conservative and reversible: it isolates only a
  locally complete social span and preserves editorial prefixes, bridges and
  suffixes. It has no global status pool, parallel-list index or arbitrary
  footer lookahead cap.
- A visible `pic.twitter.com` marker duplicated in its own Markdown link target
  counts as one logical representation; a hidden target alone is not embed
  evidence, and conflicting representations fail closed. Empty or
  punctuation-only fragments cannot become posts, while Hebrew, English and
  emoji payloads remain valid subject to the existing contamination gate.
- Direct HTML received the symmetric structural guard: an ordinary blockquote
  with a pic reference is not a social dump without a known embed container or
  strict locally owned status/footer evidence.
- The stable positive `source_order` design from `40daabce` remains intact, so
  confirmed Jina groups retain exact heading/media ownership and Telegraph
  render order through finalization.

## Verification

- Focused `tests.test_techfeedil_ordered_content`: 69/69 green; focused
  `tests.test_techfeedil_live_render`: 33/33 green. Assertions cover exact
  paragraph survival, one-to-one post text/status ownership, source ordinals,
  heading ownership and final Telegraph order.
- All Tech Feed IL suites: 284/284 green.
- Complete repository discovery: 334/334 green.
- Explicit TheMarker regressions (`tests.test_message_format` and
  `tests.test_source_health`): 50/50 green; established TheMarker behavior is
  unchanged.
- `python -m compileall -q .` passed; all 15 tracked workflow YAML files parsed;
  `bash -n` passed for both tracked shell scripts; `git diff --check` and both
  unstaged/staged `state/` diff guards passed.

## Remaining blockers and safety

- Remaining implementation blockers: none. PR #85 remains unmerged for normal
  review automation and owner review.
- No tracked runtime file under `state/` was modified, staged or committed.
  No real Telegram message or Telegraph page was published or changed; no
  page-doctor run, backfill or repair of an existing page occurred.
