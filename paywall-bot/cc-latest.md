# paywall-bot — latest Claude Code session state

Updated: 2026-07-21 (UTC), post-#81-merge incident round

## What just happened

PR #81 merged (main then `8277eb9` after state commits). The FIRST
scheduled poll after it (Actions run 29798791916) confirmed RTL + source
tags work, but produced two new Walla incidents, fixed in **PR #82
(open, do not merge without review)**: branch
`fix/techfeedil-final-node-guard-tags` from `8277eb9`, head
`4e834f5256d4a400833a925b7aa1841ca891e4c5`, non-draft, 1 commit,
10 files, no `state/` files.
https://github.com/funzi7/paywall-bot/pull/82

## Incident A — contaminated Apple-Watch page (walla item/3855032)

Live page carries a Traditional-Chinese widget paragraph + raw
`Cocoon AI Summary` inside the SUBTITLE blockquote. PROVEN route (each
link is a test): (1) the widget rides the subtitle candidates and
`_extract_subtitle` returned the RAW candidate (`return raw`); (2)
`_GLOBAL_FOREIGN_RANGES` is an enumerated blocklist that passed
Bopomofo/fullwidth/CJK-punctuation (same class as the old Cyrillic
gap); (3) `normalize_cocoon_label` could mint the product caption INTO
the subtitle; (4) no check validated the exact final node tree
(SUBTITLE-RECORD truncated at 200 chars hid the tail; now len+400).

**Fixes:** recursive field-aware final-node guard immediately before
createPage/editPage (`_final_tree_violations`): optional
subtitle/cocoon contamination → drop + rebuild + revalidate; mandatory
sections → abort/defer; proven with ALL upstream cleaners and the field
validator monkey-patched out. Blocklist holes closed (Bopomofo,
fullwidth, CJK punct/radicals/strokes/Ext-B–F). Subtitle/Cocoon
separation on strict-gate tenants (wide-strip BEFORE the cleaner;
caption emitted only by the Cocoon renderer; candidates returned
REPAIRED; foreign-dominant widget candidates skipped; clean Hebrew
cocoon paragraph never displaced). TheMarker normalization unchanged.

## Incident B — AliExpress DSA fine, zero topic tags (item/3855031)

Shared taxonomy: NEW company `AliExpress` (+ Hebrew spellings), NEW
conservative topic `איקומרס` (commerce phrases + AliExpress/Temu/eBay;
Amazon deliberately excluded), `רגולציה` aliases extended with
enforcement vocabulary (קנס, נציבות אירופית, DSA/DMA, חקירה
רגולטורית, איסור מכירה, הפרת חוק) — Europe alone never tags (pinned).
Walla source tag renamed to pure-Hebrew `וואלה` (Telegram ends hashtag
entities at a script change; `וואלהTECH` rendered as `#וואלה`+"TECH").

## Test matrix (all green locally, all in ci.yml)

185 message-format checks + unittest 21+17+50+42+13+15+13+12+11 + NEW
`tests/test_techfeedil_walla_incident.py` (11); compileall, workflow
YAML, `bash -n`, `git diff --check`, state-clean gate.

## Post-merge (owner)

1. **Poll & Post — Tech Feed IL is still ACTIVE per the Actions API —
   disable it in the Actions UI until PR #82 merges.** Source Health may
   stay enabled.
2. Merge PR #82 through review, re-enable the poll, then repair the
   Apple-Watch page on the SAME path with the page doctor (diagnose →
   dry-run → --apply, egress-capable machine; commands in
   docs/techfeedil-attribution-health.md). Earlier pending repairs
   (Android/Kimi/Verifier pages) still apply.
3. Watch the next poll: no foreign letters/vendor labels anywhere; the
   AliExpress-class stories should carry AliExpress/איקומרס/רגולציה.

## Standing rules (unchanged)

Work only in funzi7/paywall-bot (+ this memory repo). Never write the
owner's personal name. Commits as funzi7
(207505227+funzi7@users.noreply.github.com). Never print secrets. No
Backfill; no publishing during development; never mutate tracked
`state/` files (CI enforces). Verify PRs via API with full 40-char
SHAs. gh CLI unavailable — use GitHub MCP tools. Test isolation:
`_activate` pattern re-points ERROR_LOG per suite.

## Earlier history

PR #72 (wave 2), #77 (attribution/health), #78 (queue hotfix + state
gate), #79 (Cocoon gate/validator/IV ledger/page doctor), #80 (Verifier
content + RTL + multi-publisher hardening), #81 (RTL bracketing +
guaranteed source tag) — all merged.
