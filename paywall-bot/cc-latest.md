# paywall-bot — latest Claude Code session state

Updated: 2026-07-20 (UTC), second round

## What just happened

PR #80 was STRENGTHENED IN PLACE (same branch
`fix/techfeedil-theverifier-content-rtl`, do not merge without review) —
new production screenshots showed the Verifier defect classes on OTHER
publishers too. Head is now
`44a0b81abc2468af21e16656cd7c647cb632d123` (2 commits, 11 files, no
`state/` files). https://github.com/funzi7/paywall-bot/pull/80

The fix is now VERIFIED ACROSS THE SHARED MULTI-PUBLISHER Tech Feed IL
pipeline: `tests/test_techfeedil_multisource.py` parses one contaminated
fixture with the source metadata of all nine publishers (Gadgety,
Geektime, TGspot, The Verifier, N12, אנשים ומחשבים, וואלה TECH, HWzone,
The Gadget Reviews) and asserts byte-identical cleaned output — no
per-parser policy copies.

## Round-2 additions (on top of the round-1 Verifier fix)

- `is_source_metadata_line` — standalone publisher chrome rows
  ("20 Jul 2026, 13:09 by פיד טכנולוגיה", "July 20, 2026 by …", ISO
  date-times, Hebrew dates, "20.07.2026 | 13:09", time-only,
  published/updated labels). Rejected as subtitle / body / cocoon /
  excerpt / caption / heading / flash body; tags covered transitively.
  Anchored full-line — date-discussing sentences never match.
- Layered unsupported-script policy (letters only; emoji log-only):
  residue in Hebrew prose repaired → foreign-dominant paragraph dropped
  (all-foreign body fails `is_valid` → item DEFERS) → optional subtitle
  repaired-or-omitted at the publish boundary (no longer aborts) →
  cocoon paragraphs with script/control/vendor findings dropped on BOTH
  strict and non-strict validator paths (strict Latin-token gate used to
  pass CJK letters through) → mandatory-field letter at the exact final
  nodes aborts (defers), proven with cleaners monkey-patched out.
- Positive preservation pins: OpenAI, Apple, Google, Android, Gemini,
  NotebookLM, Redmi Note 17 Pro, Xiaomi, iOS, DMA, AI, API,
  fintech junction 2026, 256GB/120Hz/4K survive byte-identical.
- Force-RTL verified over the FULL final surface: serialized-node walk
  (subtitle/byline/body/headings/figcaptions/cocoon/footer all RLM-led,
  Latin-terminal pinned, no untrusted marks) + every non-empty Telegram
  line incl. mixed hashtag line (bare-link lines unmarked by design).
- Fixtures: Geektime-style jina (leaked metadata row as subtitle-position
  AND body row, vendor label + clean summary that SURVIVES the gate,
  legit OpenAI/AI/Upwind, Thai fragment), N12/PC-style HTML (CJK
  repaired, Apple/Google kept), clean mixed review (no false rejection).

## Round-1 contents (unchanged)

Reading-time classifier; `select_article_excerpt` (Tech
subtitle→body→summary; TheMarker legacy order pinned); Verifier
description priority (visible → og → meta → JSON-LD);
`telegraph.force_rtl_blocks` + untrusted-bidi strip; caption
normalization/dedup (`clean_image_caption`/`caption_identity`);
hero/inline dedup (`image_asset_identity`); jina vendor-label one-block
summary routing before the artifact/metadata/emptiness filters; native
"פיד טכנולוגיה" strip documented as Telegraph's own author header
(`author_name_rlm` experiment default OFF, needs live verification —
NOT claimed fixed); `tests/test_techfeedil_verifier.py` (13).

## Test matrix (all green locally, all in ci.yml)

185 message-format checks + unittest 21 (tech) + 17 (wave2) + 50
(source_health) + 42 (quality) + 13 (hotfix) + 15 (cocoon_iv) + 13
(verifier) + 12 (multisource); compileall, workflow YAML, `bash -n`,
`git diff --check`, `git diff --exit-code -- state/`.

## Still blocked (operational, owner must run)

Android/Kimi/Verifier Telegraph page repairs: sandbox egress denies
CONNECT to api.telegra.ph / publishers / api.telegram.org and no
Telethon creds exist. Nothing applied from here (0 pages, 0 Telegram
ops, 0 state changes). Owner: run the doctor sequence in
`docs/techfeedil-attribution-health.md` post-merge (diagnose → dry-run →
--apply → re-diagnose).

## Standing rules (unchanged)

Work only in funzi7/paywall-bot (+ this memory repo). Never write the
owner's personal name. Commits as funzi7
(207505227+funzi7@users.noreply.github.com). Never print secrets. No
Backfill; no publishing during development; never mutate tracked
`state/` files (CI enforces). Verify PRs via API with full 40-char SHAs.
gh CLI unavailable — use GitHub MCP tools. Test isolation: every suite
re-points ERROR_LOG to a tempdir via the `_activate` pattern.

## Earlier history

PR #72 (wave 2), PR #77 (attribution/byline/health), PR #78 (stale/promo
queue hotfix + state-hygiene gate), PR #79 (Cocoon ASCII gate, publish
validator, IV ledger, page doctor) — all merged by owner.
