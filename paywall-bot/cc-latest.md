# paywall-bot — Tech Feed IL attribution + source-health follow-up handoff

Date: 2026-07-19 UTC

This is the current authoritative agent handoff. It supersedes the wave-2
handoff. Repository architecture and deployment history remain in
`handoffs/CONTEXT.md` (§8 MVP, §9 source health, §10 wave 2, **§11 this
task**). Full investigation evidence and the post-merge procedure are in
`docs/techfeedil-attribution-health.md`.

## Git and pull request

- Primary repository: `funzi7/paywall-bot`.
- Authoritative starting `origin/main`:
  `8795a8935746c3ce7a5770d5509666b4000815f9` (latest techfeedil state commit;
  wave-2 PR #76 already merged at `bbcfbd68e6ee8a00ec242e61af5b860463efffe5`).
- Branch: `fix/techfeedil-attribution-health`.
- Feature commits: `77845675ef347d1ff9f6fd45e95961dccae7b7f4` (main change) +
  `c3928bcc3d8f627dd45236717897688e8cfc20b7` (review round: byline evidence
  priority + section-label rejection). Local HEAD / remote HEAD / PR head
  (all verified equal): `c3928bcc3d8f627dd45236717897688e8cfc20b7`.
- Ready, non-draft PR: **#77**,
  `https://github.com/funzi7/paywall-bot/pull/77` — verified via API: open,
  targets `main`, `draft: false`, head SHA exactly as above. NOT merged.
- The already-published N12 Telegraph page was not modified or republished.
- No production state, health state, token, credential, or error log was
  committed; `state/errors.log` test noise was restored before commit.

## CRITICAL production bug found and fixed (identity collapse)

WordPress `?p=` guids canonicalized to the bare homepage
(`https://tgspot.co.il/`); that key entered every WP feed's activation
baseline, and `_filter_fresh_items` drops any item whose guid key is in the
baseline — so **every new item from gadgety(×4)/geektime/tgspot/theverifier/
hwzone(×2)/pc was silently discarded**. All four 2026-07-19 polls logged
`phase1: 0 source items` with `errors=0`; only N12/Walla could publish (the
single posted article that day was the mako one). Health's TGspot
`newest_item_never_seen_by_production:3.0h` was a TRUE detection.

Fix: **one authoritative identity helper** `core.url_utils.
article_identity_key` used by BOTH `core.main._dedup_key` and
`core.source_health.canonical_key`. Query-identified URLs keep their query
(`https://tgspot.co.il/?p=169053`), `is_homepage_identity` keys never enter
baselines. Existing baselines self-heal via per-item link/canonical keys —
replaying the real committed state proved the missed TGspot item now flows
into discovery with no historical flood.

## Exact causes for the three "failed" publishers (from state + Actions logs)

- **TGspot** — the identity bug above (real production miss, fixed). Article
  pages still Cloudflare-403 → Jina: correctly *degraded*, unchanged.
- **The Gadget Reviews** — `https://thegadgetreviews.com/feed/` answered
  **HTTP 429 to all three 0/2/5s burst retries in BOTH the 16:36 and 16:51
  polls** (Actions runs 29695186115 / 29695675753) → activation baseline
  never created; health double-reported `baseline_missing` + unseen-newest.
  Fixed: `Retry-After`-aware 429 backoff (default 20s, cap 60s) in
  `core.feeds._fetch_feed_bytes` + activation-pending semantics. The feed
  stays safely uninitialized; the next successful poll baselines it; no
  Backfill; health recovers automatically.
- **The Verifier** — deep extraction at 16:41 hit
  `all_sources_failed:direct=http_status:403;jina=too_few_paragraphs:0<3`
  after a successful direct extraction at 14:57: intermittent origin WAF. No
  code fix warranted; digest now states it readably.

## Health visibility / activation rules (core/source_health.py)

- `production_visibility` compares the FULL identity set (guid/feed
  link/canonical, `item_identity_keys`; probes record
  `newest_item_identities`) against posted/deferred/baseline/terminal.
- Runs ONLY when the feed's current-generation baseline exists; fails only
  when grace elapsed (`newest_unseen_grace_hours`) AND a successful poll
  completed ≥ `visibility_poll_opportunity_hours` (default 1h) after the item
  appeared AND (timestampless items) it survived into a second health run.
  Items published after the last poll are never missed; age alone never
  flags. Healthy visibility checks are emitted so recovery works.
- Missing/generation-pending baseline = **activation_pending** (healthy-class
  status, own digest section, no counters/alerts, no duplicate visibility
  failure), escalating to degraded only after ≥3 completed polls
  (`activation_baseline_still_missing_after_N_polls`); tracked in
  `health_state["activation"]`, pruned with feeds.
- Digest (`build_daily_digest`): Healthy / Degraded / Activation pending /
  Failed / shared infrastructure; every non-healthy publisher line carries
  component + translated reason + Jina-fallback outcome (e.g.
  `• N12 — direct discovery blocked by Radware; Jina succeeded`). Machine
  codes unchanged in state/report; Telegram escaping/limits preserved;
  manual runs still don't bump scheduled counters.

## Product changes (tenant-configured; TheMarker untouched)

- **Telegraph header = channel brand** (`sites/techfeedil/config.yaml`):
  `author_name: "פיד טכנולוגיה"`, `author_url_behavior: "channel"`,
  `author_url: https://t.me/Tech_Feed_IL`; resolved by
  `telegraph_pub.page_author_url()`. Header never links the original
  article; the original source is linked exactly once (footer). TheMarker
  keeps `"original"`. Telegram posts link only the Telegraph page.
- **Real `מאת:` bylines** (`core/article_parser.py`): leading/repeated
  `מאת:` normalized; photo credits (`צילום:`…), date-shaped strings, Latin
  widget/entity strings, and Hebrew widget labels (`כתבי האתר`) rejected;
  `_author_is_site_label` (called in `_finalize` with source metadata) drops
  a byline equal to the publisher's own name/domain; `מערכת N12`-style
  newsroom bylines and multi-author lists preserved; no author → no line.
- **Tech AI summary enabled on the shared Cocoon pipeline**
  (`ai_summary.enabled: true`, caption `🤖 סיכום AI של Tech Feed IL`):
  vendor-label normalization (zero-width tolerant), Thai/CJK/Cyrillic/
  homoglyph repair-or-drop, RLM, publish-boundary FOREIGN-RESIDUE scan +
  POST-RECORD `foreign=`/`srclink=` counters — identical to TheMarker.
  Contaminated summaries are omitted while the valid article ships. This
  supersedes wave-2's "no AI summaries" (documented product decision).
- **Topic hashtags** (`sites/techfeedil/tags.py` rewrite): ordered
  Hebrew-canonical taxonomy + company tags (OpenAI/ChatGPT/Apple/Google/
  Microsoft/Samsung/Meta/Nvidia/Intel/Amazon/Tesla) with whole-token/phrase
  boundaries and bounded Hebrew prefixes; strong signals =
  title/subtitle/AI-summary, body = first 5 paragraphs needing ≥2 hits;
  order topics → companies → source tag LAST; ≤5 tags; uncertain → omitted;
  no generic filler tags. `core.main.build_message_tags` passes
  subtitle/cocoon via keywords with a TypeError fallback so
  `sites/themarker/tags.py` keeps its exact legacy contract. `core.preview`
  now emits `telegram.tags` and the tenant-correct `telegraph.author_url`.
  Sanitized N12 AI-propaganda fixture yields
  `בינה_מלאכותית / דיפ_פייק / איראן / N12` from the general rules.

## Validation

- `python3 -m tests.test_message_format` — 185 checks, `All tests passed.`
- `python3 -m unittest`: `tests.test_techfeedil` 21 OK,
  `tests.test_techfeedil_wave2` 17 OK, `tests.test_source_health` **50 OK**
  (new: shared-identity, guid-vs-canonical visibility, www/slash/AMP/
  tracking/path-identity equivalence, published-after-poll,
  truly-missed, missing-baseline suppression, generation mismatch,
  timestampless double-observation, activation escalation, digest shapes,
  429 backoff/bounds), NEW `tests.test_techfeedil_quality` **42 OK**
  (attribution ×4, byline scenarios ×9, Cocoon/residue fixtures ×9, tag
  rules ×15 incl. TheMarker-unchanged contract). New suite wired into
  `.github/workflows/ci.yml`.
- `compileall`, PyYAML `safe_load` of all 15 workflows, `bash -n
  scripts/*.sh`, `git diff --check` — pass.
- Two pre-existing tech tests updated for the new attribution/AI-caption
  product decisions (deliberate, documented in PR + CONTEXT §11).
- **Sandbox limitation:** this session's egress proxy blocks every publisher
  host (tunnel 403), so live nine-publisher discovery/extraction could not
  run here. Substituted: replay of the REAL committed production + health
  state through the new code (TGspot item now fresh; TGR activation_pending;
  digest renders reasons end-to-end) + production Actions-log evidence.
  Run the post-merge procedure in `docs/techfeedil-attribution-health.md`.

## Review round (same PR #77, second commit)

The production screenshot's `מאת: דיגיטל` (an N12 desk label from generic
metadata) was not fully covered by the first commit. Corrections:

- **Author evidence priority** in `_extract_author`: explicit VISIBLE byline
  node → Article/NewsArticle JSON-LD author (`_jsonld_article_authors`) →
  generic meta author fields → none. A generic meta value can never override
  a better visible byline; invalid candidates skip to the next tier. "bio"
  added to the author-node class blocklist (an author-bio biography block is
  never the byline — caught by the wave-2 Gadget Reviews fixture).
- **Source-aware section-label rejection hook**:
  `sites/techfeedil/parser.py` `AUTHOR_SECTION_LABELS` +
  `author_is_section_label(author, parser_id=…)`, called from `_finalize`.
  n12 rejects bare דיגיטל / N12 דיגיטל / TECH12 / טכנולוגיה / חדשות / mako /
  N12 / נקסטר; per-source lists exist for walla/gadgety/geektime/tgspot/
  theverifier/pc/hwzone/thegadgetreviews. Never global: one source's list
  cannot reject another source's genuine author; `מערכת …` newsroom bylines
  (מערכת N12, מערכת N12 דיגיטל, מערכת וואלה, מערכת האתר) always pass;
  TheMarker has no parser module so the hook is a no-op there and its byline
  fixtures are unchanged.
- Regressions in `tests/test_techfeedil_quality.py` (now **42**): bare
  `דיגיטל` metadata omitted end-to-end (no `מאת:` node in Telegraph);
  visible `מאת: יואב זיתון` beats metadata `דיגיטל`, JSON-LD `דיגיטל`, and a
  plausible named metadata author; newsroom bylines preserved; per-source
  label matrix incl. cross-source non-rejection.
- Re-validated: test_message_format 185 checks, test_techfeedil 21,
  test_techfeedil_wave2 17, test_source_health 50, test_techfeedil_quality
  42; compileall / 15-workflow YAML / bash -n / git diff --check all pass.
- PR #77 description updated to state the visible-over-JSON-LD-over-meta
  priority and that bare publisher desk/section labels are not authors.

## Post-merge (owner)

1. Merge PR #77 through the normal review process. **Do not run Backfill.**
2. Run **Poll & Post — Tech Feed IL** once: expect The Gadget Reviews
   baseline (or clean activation-pending until its 429 clears) and the
   previously frozen WP-guid publishers' new items entering
   `deferred_items` (not a flood).
3. After the 30-minute defer cycle, verify per post: channel-brand header,
   footer-only source link, real-or-absent `מאת:`, Hebrew AI-summary
   caption, Telegraph-only Telegram link, ordered topic tags with source
   last.
4. Run **Source Health — Tech Feed IL** with `force_deep`; digest must show
   per-publisher reasons; TGspot visibility recovers once production ingests
   its newest item.
