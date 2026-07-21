# paywall-bot — PR #85 stabilization handoff (2026-07-21)

## Git and pull request

- Repository: `funzi7/paywall-bot`.
- PR: #85, https://github.com/funzi7/paywall-bot/pull/85 (open, non-draft,
  targets `main`; not merged).
- Branch: `fix/techfeedil-live-render-content-integrity`.
- Starting local/remote/PR head:
  `4c7d6b67b5ab2bc51d3625d23064d3bcea509c8a`.
- Final local/remote/PR head and main stabilization commit:
  `40daabce1e3249b3a430774f9ae3ba07f9271854`.
- Commit: `Stabilize ordered social and section rendering`.

## Root cause

PR #85 split editorial content into paragraphs, headings, inline images,
social embeds and CTA links, then relied on `after_paragraph_index` and
renderer type precedence to join them again. That anchor cannot distinguish
two unlike nodes between the same paragraphs, so heading→embed and
embed→heading collapsed to the same position and section ownership became an
accidental `<`/`<=` decision. Social recovery also had classifier and
association paths that could accept attribution-looking prefixes, independently
filtered candidate lists, or status URLs that were not structurally owned by
the same post.

## Structural solution

- Direct HTML assigns each editorial element a stable positive source ordinal
  after tenant structural conversion and before parallel extraction. Jina
  first splits compact mixed blocks into logical source nodes, then assigns
  compatible monotonic ordinals. Headings, images/videos, social embeds and
  CTA owners/destinations preserve those ordinals through filtering,
  deduplication, paragraph-anchor remapping, finalization and Telegraph
  boundary cleaning.
- Telegraph merges non-paragraph nodes by paragraph gap plus source order;
  ambiguous ownerless cross-type same-anchor input fails closed rather than
  falling back to hard-coded type order.
- A heading owns only editorial nodes after its ordinal and before the next
  heading. Earlier same-anchor media cannot keep a later heading, consecutive
  headings cannot share following content, and footer/navigation/promo/source
  attribution never count. Converted tables/lists and an exactly owned valid
  CTA remain valid section content.
- CTA destinations carry exact owner ordinal, fingerprint and anchor. Orphan
  CTA headings are removed; an unrelated later citation cannot supply a
  destination.
- Direct and Jina social recovery construct atomic per-post records. Local
  marker/footer boundaries, canonical post identity and unique structural
  ownership prevent missing, rejected, duplicate or conflicting posts from
  shifting another post's URL. Surrounding Hebrew and English prose remains.
- Tweet account metadata uses a complete normalized full match and exact
  display-name/handle identity for both dashed and undashed forms. Date,
  status, pic-marker and source-footer classifiers likewise require their
  complete intended shapes. Direct and Jina source footer recognition now use
  the same terminal-visible-URL or sole-linked-label structure.

## Verification

- Focused `tests.test_techfeedil_ordered_content`: 48/48 green, with exact
  parsed and Telegraph order plus one-to-one post text/status ownership on
  direct HTML and Jina routes.
- All Tech Feed IL suites: 263/263 green.
- Complete repository discovery: 313/313 green.
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
  No real Telegram message, Telegraph page, page-doctor run, backfill or
  repair of an existing page occurred.
