# paywall-bot — latest Claude Code session (2026-07-21)

## Task: PR #85 — live-render content integrity (post-#84 regressions)

- **Branch**: `fix/techfeedil-live-render-content-integrity` from origin/main
  `b237428` (contains #84 merge `c36334e`). PR #85 (non-draft → main, NOT
  merged): https://github.com/funzi7/paywall-bot/pull/85
- **HEAD**: `f8eac002d004a638ad50212c85bd5736e7e4c0f8` (local = remote = PR
  head, verified via API). Two commits: product code `f08f5fc`, tests+docs
  `f8eac00`.

## What changed (evidence: poll run 29845436185, direct-HTML route)

- **RTL (A)**: RLM+RLI…PDI+RLM renderer-owned isolates on every TG text line
  (title also inside the bold entity, flash 🔸 line too) and every Telegraph
  block for force-RTL tenants. Trusted marks = {LRM, RLM, RLI, PDI}; shared
  `_DIRECTION_MARKS_STRIP` translate table keeps `_final_tree_sections` /
  caption counters / `_final_tree_violations` mark-insensitive. TheMarker
  unchanged (no marks).
- **Message gate (B)**: `article_parser.validate_channel_message` (vendor
  label / `replacement_character:N` / `unsupported_script:U+XXXX`) runs on
  the EXACT outgoing message in `_post_article` (strict-gate tenants);
  findings → MSG-VALIDATE log + no send (defer).
- **Social embeds (D)**: `features.social_embed_handling` (techfeedil).
  Status URLs from DOM `a[href]`/`blockquote[cite]` + Jina markdown;
  `_finalize` replaces the tweet-dump run (seeds: pic.twitter.com/status
  URL; neighbors: meta/mostly-latin) with ONE embed dict; `_build_nodes`
  renders blockquote + `לצפייה בפוסט המקורי ב-X` anchor; publish_article
  re-validates embed text. No URL → dump omitted.
- **CTA (E)**: `_extract_inline_cta_links` covers headings/buttons/adjacent
  anchors; lexicon + לפרטים נוספים והרשמה / לפרטים והרשמה / להרשמה לתוכנית;
  heading nodes render recovered anchors via
  `_paragraph_children_with_links`; inline_links filter accepts heading
  texts as anchors. **KEY BUG FOUND**: main.py's two publish call sites
  never passed `inline_links` — #84 extracted links but production never
  rendered them. Both now pass `inline_links` + `social_embeds`.
- **Sections (F)**: techfeedil `prepare_html` converts `<table>` rows to
  `• key: val | val` bullet paragraphs (before excludes); `_finalize`
  section-integrity pass keeps a heading only if its own section has
  paragraphs/images/embeds (footer never counts; CTA-with-link counts;
  orphan CTA heading dropped). The old blanket tail-heading drop was
  REMOVED (subsumed — it was killing tail-anchored CTA headings).
- **Tags (G)**: `build_article_message` re-resolves `source_tag_for` and
  enforces it last/once; tags.py `_apple_context_ok` (product token or ≥3
  standalone Hebrew אפל) gates the Apple company tag.

## Tests / verification

- NEW `tests/test_techfeedil_live_render.py` (21) — 7 sanitized fixtures
  (ALUTech CTA+tags, WSC isolates, Rapyd repair-or-defer adversarial,
  pc U+FFFD/malformed, Suunto subtitle/cocoon, Samsung X-embed ± URL,
  Garmin table ± fallback) + adversarial cleaner-bypass gates + TheMarker
  guard + state-digest guard. Wired into ci.yml.
- 9 existing pins updated for isolates (test_techfeedil test_12/test_20;
  rtl_source_tag title/excerpt/mixed/pc; multisource trailing PDI+RLM pin
  and RLI/PDI removed from forbidden list; content_bounds/walla caption
  counts mark-insensitive).
- Full matrix 253 green; compileall, 15 workflow YAMLs parse, bash -n,
  `git diff --check`, `git diff --exit-code -- state/` all pass.

## Operational notes

- **Poll policy discrepancy**: task requires `Poll & Post — Tech Feed IL`
  disabled until #85 merges, but the workflow is ACTIVE and ran hourly
  through 2026-07-21T17:21Z (state commits prove posts). No MCP tool can
  disable a workflow — owner must disable manually.
- Session hazard: the cloud env was RESET TWICE mid-task, wiping
  uncommitted work; everything was re-applied and pushed early this time.
  Lesson: commit+push a checkpoint as soon as product code compiles.
- Geektime canonical source tag remains `גיקטיים` (established since #80,
  pinned by tests); the live_render suite asserts via `source_tag_for` so
  it is mapping-agnostic.
