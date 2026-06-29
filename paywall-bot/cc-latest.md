# paywall-bot — in-body subhead DOM capture (CI diagnostic, 2026-06-29)

READ-ONLY capture in GitHub Actions (agent egress blocks article hosts). One-shot workflow
added to main (`37e6e09`), run via push-trigger temp branch `diag/run-subheads`, then REMOVED
from main (`b7183a6`) and the temp branch deleted. Feed scanned:
`https://www.themarker.com/cmlink/1.144` (100 entries, first 25 fetched).

## SUBHEAD FINDING — TheMarker articles have NO genuine in-body section subheads
Scanned 25 articles for `<h2>/<h3>/<h4>` and strong-only `<p>/<div>` INSIDE
`section.article-body-wrapper`. Result: **only 3/25** had ANY candidate, and **every candidate
is a false positive**, not an editorial subhead:
- The only `<h3>` found is `text='כתבות קשורות'` ("Related articles") whose chain is
  `section.article-body-wrapper.xjp7ctv > aside.…[object.Object].no-print > h3.…` — i.e. a
  **related-articles RAIL `<aside>` nested inside the body wrapper, marked `no-print`**. It is a
  rail heading, not content.
- The only `strong-only:p` found is `'אלון דורי, מנכ"ל חברת ניהול התיקים וקרנות הגידור ב-IBI…'` —
  an **author-bio / byline blurb** (trailing strong-wrapped credit), not a section subhead.
- Interleaving of the sample hit: `p, p, p, h3:'כתבות קשורות', p, p, p, p, p, p, p, p,
  strong-only:p:'אלון דורי…'` — the h3 is a mid-body related-rail aside; the strong-only is the
  end-of-article author bio.

**VERDICT:** in this 25-article sample TheMarker bodies are flat `<p>` lists with **0 genuine
editorial `<h3>/<h4>` subheads**. The element it *nominally* uses for the rail heading is `h3`,
but that h3 is the "כתבות קשורות" related-articles `aside.no-print` (a rail), and the strong-only
paragraph is an author bio.

### Implication for the bold+underline subhead fix
There is essentially **nothing to capture** on current TheMarker content — a subhead feature
would be a near-no-op. If implemented defensively it MUST:
- EXCLUDE `<aside>` / `no-print` containers (the "כתבות קשורות" h3 is a rail, NOT a subhead —
  do not bold/underline it; ideally drop it);
- NOT treat a trailing strong-only author-bio `<p>` as a subhead.
Recommendation: deprioritize the subhead-format fix (no real input); if built, gate strictly on
genuine `<h3>/<h4>` that are direct body children outside any `aside`/`no-print`, which the
sample shows essentially never occur.

## Other Wave-2 facts (from the formatting map, restated)
- **Source link already exists**: `_build_nodes` footer emits `p` = "מקור: " +
  `a[href=original_url]` → "TheMarker" (telegraph_pub.py ~166-175). `original_url` is in scope at
  assembly; an external source-link node is already present (add/relabel is trivial).
- **RTL has NO mechanism**: no `dir`/RLM/RLE/align/wrapper anywhere; direction relies on
  Telegraph default + Hebrew chars. A paragraph that STARTS with English/Latin renders **LTR**
  (the right-align-when-starts-English gap).
- **Media credits**: only standalone start-anchored short "צילום:" `<p>` is dropped
  (`NOISE_PHOTO_CREDIT_RE`). **"וידאו:" and "עריכה:" have NO drop rule** — they'd survive unless
  they trip another noise filter. Inline-image figcaption → `figcaption` node.
- Node tags emitted: figure/img/blockquote/p/strong/em/a/hr/figcaption. `u` (underline), `h3`,
  `h4` available but unused.

## Main state
Wave-1 merged (#42 → `3f284d1`); byline+drop-cap #44 merged; **#47 (inline-image body-root scope)
+ Codex `9174afe` MERGED**; video = no-op (handled by #47; no embeddable players in sample). Only
**PR #35 (old capture diag) still open**. Image-rail/video/subhead diag workflows added+removed.
