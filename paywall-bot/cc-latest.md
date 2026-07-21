# paywall-bot — latest Claude Code session state

Updated: 2026-07-21 (UTC), content-boundaries round

## What just happened

PR #83 merged (main `173fad1`). The 11:47Z poll (run 29827479955,
checkout `1234ebbd9` = #83 merge, contains #82) produced two content
incidents, fixed in **PR #84 (open, do not merge without review)**:
branch `fix/techfeedil-content-boundaries-links-media-order` from
`173fad1`, head `99489bba9833d41d416327e1a86badb2255f8cf3`, non-draft,
1 commit, 10 files, no `state/` files.
https://github.com/funzi7/paywall-bot/pull/84

## Proven chronology (no false regression claims)

Both pages are POST-#82 (run checkout contains the recursive guard).
The Verifier 80141 published via JINA (direct 403) with cocoon=0 and
foreign=0 — the guard passed, so the screenshot's "Cocoon AI Summary"
is pixels inside the leaked related/promo IMAGE, not a text node; #82
was NOT bypassed. Geektime item was direct HTML; its CTA anchor was
flattened by text-only extraction.

## Fixes in PR #84

- **Editorial CTA links** (`features.inline_cta_links`, Tech only, no
  hardcoded URLs): lexicon-matched anchors inside body <p> only,
  validated http/https source destination, rendered as a real clickable
  <a> anchored by the link TEXT (filtering can never re-point it); jina
  [text](url) equivalents; dangling "הנה פרטי המשרה" with no recovered
  link is REMOVED by tail integrity; materially incomplete → defer.
- **Verifier editorial boundary**: SOURCE_EXCLUDES["theverifier"]
  structural ancestry + hard `_truncate_body_at_heading` stop (direct
  route); promo/related phrases (מחברים אתכם לטכנולוגיה, המקור
  המקצועי…, פורסמו לאחרונה, …) became jina END MARKERS (the production
  route) — stop text AND image capture, so slogan/related card/related
  thumbnail never parse.
- **Ordered media/caption model**: `_finalize` REMAPS every image/
  heading anchor through a raw→final surviving-prefix map at every
  filtering stage (was: clamp → shift bug); captions stay attached to
  their exact figure; detached "תמונה:" caption paragraphs dropped;
  trailing orphan headings (leaked card titles) dropped.
- **Cocoon visual RTL**: force-RTL tenants render summary paragraphs as
  `aside` blocks with RLM directly on text (Telegraph resolves nested
  p>em unreliably for mixed direction; italics traded for correct RTL);
  guard classifies aside=cocoon (drop-block policy bypass-proven);
  TheMarker keeps p>em (pinned).
- **Observability**: bounded body-free `DIAG CONTENT-BOUNDS` line
  (ordered counts, last-3 kinds + 40-char prefixes, dropped
  CTA/detached-caption/trailing-heading counts).

## Test matrix (all green locally, all in ci.yml)

185 message-format checks + unittest 21+17+50+42+13+15+13+12+11+11+17 +
NEW `tests/test_techfeedil_content_bounds.py` (10); compileall, workflow
YAML, `bash -n`, `git diff --check`, state-clean gate. One aside-shape
pin updated deliberately in rtl_source_tag.

## Post-merge (owner)

1. **Keep Poll & Post — Tech Feed IL DISABLED until PR #84 merges**;
   Source Health may stay enabled. Re-enable the poll after merge.
2. Watch the next poll: Geektime-style CTAs clickable; Verifier pages
   end at the editorial boundary; Cocoon renders as a right-oriented
   aside block.
3. Pending owner-run page-doctor repairs (egress-capable machine):
   the two new pages (Geektime מרעננים…, Verifier יוצרת ChatGPT…), the
   Apple-Watch page, and the earlier Android/Kimi/Verifier pages —
   commands in docs/techfeedil-attribution-health.md.
4. TGspot live 415 curl-matrix diagnosis still pending (PR #83 doc).

## Standing rules (unchanged)

Work only in funzi7/paywall-bot (+ this memory repo). Never write the
owner's personal name. Commits as funzi7
(207505227+funzi7@users.noreply.github.com). Never print secrets. No
Backfill; no publishing during development; never mutate tracked
`state/` files (CI enforces). Verify PRs via API with full 40-char
SHAs. gh CLI unavailable — GitHub MCP tools. `_activate` test isolation.

## Earlier history

PRs #72, #77, #78, #79, #80, #81, #82, #83 — all merged (see
handoffs/CONTEXT.md §8–§11h for the full trail).
