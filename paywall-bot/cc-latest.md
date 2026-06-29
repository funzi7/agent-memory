# paywall-bot — Wave-2 byline + drop-cap fixes (PR #44, 2026-06-29)

Status: **PR #44** OPEN → main, branch `claude/byline-dropcap-fixes`, head **`f0db3a2`**.
Not merged (owner merges after CI green + Codex). Scoped to byline + drop-cap only.
Wave-1 (flash/channel/Thai/Cocoon zero-width) is **MERGED TO MAIN** (PR #42, merge
commit `3f284d1`); the Codex short-flash follow-up is commit `06558d4` (on main as
`08bc6fc fix: preserve short cleaned flash descriptions`). Diagnostic input: `5baad8a`.

## (a) The two fixes — helper/function names + file:line

### FIX 1 — byline `_clean_author` (core/article_parser.py)
- New **`_clean_author(raw)`** (~`core/article_parser.py:1527`). Called from
  **`_extract_author`** (~:1592, both `<meta author>` and `.author|.byline` paths)
  AND from **`_finalize`** (~:2924, `if parsed.author: parsed.author = _clean_author(...)`;
  no-op for jina/smry which set author=None).
- Logic: (1) cut from first `@`; (2) strip trailing `Follow`/`·`/`•`/dash + ws;
  (3) strip zero-width (`_ZERO_WIDTH_STRIP`) + `_clean` collapse; (4) on `" - "/" – "/" — "`
  split keep FIRST Hebrew part (drops English half); (5) if Hebrew remains drop standalone
  pure-Latin tokens, keep Hebrew + numeric; if NO Hebrew keep Latin as-is; (6) collapse
  exact `"X X"` duplicate. `_global_clean_paragraph` brand allowlist unchanged.
- Renders via telegraph_pub `_build_nodes` `מאת: {author}` (unchanged).

### FIX 2 — drop-cap `_rejoin_leading_dropcap` (core/article_parser.py)
- New **`_rejoin_leading_dropcap(text)`** + `_DROPCAP_LEADING_RE = re.compile(r"^([א-ת])\s+(?=[א-ת])")`
  (~:1986). Applied to **`paragraphs[0]` only** at the end of **`_extract_paragraphs`**
  (~:2056, right after `_word_overlap_dedup`). Digit lookahead keeps `"ב 2026 …"`.
- No walker edit: `_extract_inline_images(soup, url, paragraphs, hero)` receives the SAME
  rejoined `paragraphs` list as `kept_paragraph_texts`, and `_fingerprint` strips whitespace,
  so anchors already agree.

## (b) Tests added (tests/test_message_format.py) — all fail-before/pass-after
- **L1L1L** `_clean_author` matrix: `MK Shelly Tal Meron - שלי טל מירון@Shellytalmeron·Follow`→`שלי טל מירון`;
  `Benjamin Netanyahu - בנימין נתניהו`→`בנימין נתניהו`; `ערוץ כנסת 99@KnessetT·Follow`→`ערוץ כנסת 99`;
  `Coralogix@Coralogix·Follow`→`Coralogix`; `ישראלי News@Israeli1News·Follow`→`ישראלי`.
- **M1M1M** end-to-end: `_extract_author` (meta) + `_build_nodes` byline node = `מאת: שלי טל מירון`.
- **N1N1N** drop-cap: first para `ר פאל …`→`רפאל …`; negatives: non-first `ר משהו` unchanged, `ב 2026` unchanged.
- Full suite **145/145** green (was 142).

## (c) READ-ONLY ADDENDUM — input for the NEXT (image-scoping) step

**1. Body-root selection in `_extract_paragraphs`** (~core/article_parser.py:2009):
```python
containers = []
for sel in ("article", ".article-body", "main"):
    for el in soup.select(sel):
        if el not in containers:
            containers.append(el)
```

**2. `_extract_inline_images` call site & first param** (~:2185):
```python
inline_images = _extract_inline_images(soup, url, paragraphs, hero)
```
The first arg is the **WHOLE document `soup`**, NOT the body-root container(s) from
`_extract_paragraphs`. Inside `_extract_inline_images` (~:1878) it INDEPENDENTLY re-selects
containers with the SAME selectors `("article", ".article-body", "main")`. So image
extraction is scoped to article/.article-body/main, but derived separately from the whole
soup (not reusing `_extract_paragraphs`' container objects or its paragraph-level filtering).

**3. Container selectors EXCLUDED from image extraction:** there is **NO container-selector
exclusion** (no sidebar/related/recommended/most-read container is removed at selection time).
Exclusion is per-image via ancestor-CLASS matching only:
- `_ancestor_has_noise_class` → `NOISE_ANCESTOR_CLASSES = ("ai-summary","cocoon","summary-block","ai-generated")`
- `_ancestor_has_structural_noise_class` → `NOISE_STRUCTURAL_ANCESTOR_CLASS_TOKENS = (ad, ads, advert,
  advertisement, sponsored, sponsor, promo, promoted, related, recommended, recommendation, read-more,
  more-articles, most-read, popular, teaser, newsletter, subscribe, subscription, taboola, outbrain,
  comments, comment)`
Note: there is **no literal `sidebar` / `trending` / `zen` token** — a teaser/related image inside a
widget whose class doesn't contain one of the listed substrings is NOT excluded. That class-token
list (substring match on ancestor `class`) is the only structural guard; the image step does not
scope to the paragraph body root nor to a single article container. This is the gap for the
image-scoping fix to address (prefer scoping to the article body root and/or widening exclusions).
