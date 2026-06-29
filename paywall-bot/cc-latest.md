# paywall-bot — Wave-2 diagnostic: byline, drop-cap, broken images (2026-06-29)

READ-ONLY diagnostic on branch `claude/foreign-script-cocoon-fixes`. No paywall-bot
code changed. Wave-1 fixes (flash/channel/Thai/Cocoon zero-width) live in **PR #42,
commit `fcace5b`**; prior summary at SHA **`8af2faf`**.

## Environment constraint (affects PART B)
The egress network policy **denies all article-source hosts** — themarker.com,
news.google.com, telegra.ph, one3ft, r.jina.ai, img.haarets.co.il all return
`403 connect_rejected` via the agent proxy (allowlist is package registries +
anthropic only). So the live feed could NOT be fetched, the 5 recent items / 3
target articles could NOT be parsed live, and the requested HTTP HEAD content-type
checks on קניון images could NOT run. Evidence below is (a) the EXACT current code,
(b) REAL cached parser output from `state/themarker.json` → `quality_issues`, and
(c) deterministic runs of the REAL parser functions on reconstructed DOM.

---

## (a) THREE CODE AREAS (current state, exact)

### 1. BYLINE / CREDITS
- `core/article_parser.py:1510` **`_extract_author(soup)`**:
  ```python
  def _extract_author(soup):
      t = _meta(soup, "author")          # <meta name="author">
      if t: return t
      el = soup.find(class_=re.compile(r"author|byline", re.I))
      if el and el.get_text(strip=True):
          return _clean(el.get_text())   # _clean only collapses whitespace
      return None
  ```
- `core/article_parser.py:368` **`_clean`** — only `.replace` zero-width + `re.sub(r"\s+"," ")`. No dedup, no English/handle strip.
- `core/article_parser.py:_finalize` — cleans title/subtitle/paragraphs/cocoon_paragraphs **but NOT `author`**.
- `core/telegraph_pub.py:223` — `author = _global_clean_paragraph(author)` (only cleaner applied to author).
- `core/telegraph_pub.py:128-131` — renders `{"tag":"strong","children":[f"מאת: {author}"]}`.
- `_extract_author` is wired only on the `parse_html` path (`article_parser.py:2094`); jina/smry set `author=None`.

### 2. FIRST PARAGRAPH / DROP-CAP
- `core/article_parser.py:1914` **`_extract_paragraphs`** — body assembly. Line **1941**:
  ```python
  text = _clean(p.get_text(" "))     # <-- join separator " " between child nodes
  ```
  A drop-cap `<p><span>ר</span>פאל…</p>` → `get_text(" ")` → `"ר פאל…"`. `_clean` only
  collapses whitespace; it does not rejoin. The orphan-prefix rejoin
  (`_GLOBAL_ORPHAN_PREFIX_RE`, prefix letters `הובכלמש` only) does NOT cover `ר`, so the
  split survives. The inline-image walker repeats the same join at `article_parser.py:1848`.
  No drop-cap / first-letter handling exists anywhere.

### 3. INLINE IMAGES (PR #32 feature)
- `core/article_parser.py:1741` **`_extract_inline_images(soup, base_url, kept_paragraph_texts, hero)`** — walks `<p>/<figure>/<img>`.
- `:1699` **`_select_best_image_src`** — priority data-src → data-original → data-lazy-src → largest data-srcset → largest srcset → src (`:1659 _srcset_largest`).
- `:1575` **`_is_inline_image_url_blocked`** — data: URI + whole-path-component blocklist (`_INLINE_IMAGE_BLOCK_TOKENS`, `:1566`).
- `:1610` **`_inline_image_dim_too_small`** — declared width/height < `_INLINE_IMAGE_MIN_DIM=100`.
- `:1628` **`_resolve_image_url`** — relative→absolute, `//`→https.
- Per-image filters: blocklist, declared-dim, `src==hero`, dup-src, cap `_INLINE_IMAGE_MAX_COUNT=5`.
- Attach: `core/telegraph_pub.py:_build_nodes` (`:132-165`) + `_inline_image_figure_node` (`:84`).
- **There is NO content-type / HTTP / format validation.** Only the URL string and the
  declared width/height attributes are inspected. No HEAD, no GET, no extension allowlist.

---

## (b) REAL parser output (cache + real-function runs)

### Byline — REAL cached output (`state/themarker.json` quality_issues, `low_hebrew_dominance`):
- issue0 `מאת: MK Shelly Tal Meron - שלי טל מירון@Shellytalmeron·Follow` — `/news/themedia/2026-06-01/…0000019e-8493…`
- issue2 `מאת: ערוץ כנסת 99@KnessetT·Follow`
- issue3 `מאת: ישראלי News@Israeli1News·Follow`
- issue6 `מאת: Coralogix@Coralogix·Follow`
- issue9 `מאת: nimrodhalpern@nimrodhalpern·Follow`
Real-function run: `_extract_author` on `<meta name=author content="MK Shelly Tal Meron - שלי טל מירון">`
→ `'MK Shelly Tal Meron - שלי טל מירון'`; `_global_clean_paragraph(...)` → unchanged →
byline renders `מאת: MK Shelly Tal Meron - שלי טל מירון`.

### First paragraph / drop-cap — real `_extract_paragraphs` run:
Input `<p><span class="dropcap">ר</span>פאל הציגה את מערכת ספיידר…</p>` →
`paragraphs[0]` = `'ר פאל הציגה את מערכת ספיידר בתערוכה והודיעה על עסקה עם רומני…'`
(lone `ר` + space confirmed).

### Images — real `_extract_inline_images` run (5 imgs):
- `…/golden-mall-photo.jpg` (800×500) → **KEPT** (anchor 1, cap "קניון הזהב")
- lazy `data:` + `data-src=…/lazy/real-tower.jpg` (700×400) → **KEPT** (real URL picked)
- `…/icons/share.png` → **DROPPED** url-blocklist (dir segment `icons`)
- `…/tiny.jpg` (60×40) → **DROPPED** declared dim <100px
- `srcset …/img.aspx?id=123&w=1920 1920w,…640w` → **KEPT** (largest `1920w` picked)
HEAD on `img.haarets.co.il/…golden-mall-photo.jpg` → **BLOCKED** by egress policy (could not verify content-type).

### Target articles availability in cache:
- Rafael/Romania SPYDER → **not in cache** (0 hits any field).
- Netanyahu/Albania op-ed → **not in cache** (`אלבני`/`albania` = 0; `נתניהו` hits are other articles).
- מגדל/מליסרון/קניון הזהב → only a **normalized fingerprint** present
  (`"סניפיםשלנו…בקניון"…הראלוויזלקבוצתפוקס…`; separate מגדל-ירושלים fp); `מליסרון`=0; no URL, no HTML.

---

## (c) CONFIRMED ROOT CAUSES

1. **Byline English-name leak + Hebrew duplicate** — `_extract_author` returns the raw
   `<meta author>` / `.author|.byline` element text (which on tweet-embed articles is
   `"<English Name> - <Hebrew Name>@handle·Follow"`). `_clean` does not dedup, strip the
   `@handle·Follow` suffix, or drop the English half; `_finalize` never cleans `author`;
   `_global_clean_paragraph` keeps standalone Latin (brand allowlist) and does not dedup —
   so English name + Hebrew duplicate (+ handle) all render in `מאת:`.

2. **First-letter drop-cap split "ר פאל"** — `_extract_paragraphs` (`:1941`) and the image
   walker (`:1848`) join child nodes with `get_text(" ")`. A drop-cap first letter in its own
   `<span>` becomes `ר` + space + rest. `_clean` only collapses whitespace; the orphan-prefix
   rejoin covers only `הובכלמש`, not `ר` (or other non-prefix letters), so the split ships.

3. **Broken inline images (קניון הזהב)** — the image filter does URL-string + declared-dimension
   checks ONLY; **no content-type/HTTP validation**. URLs that 404, require auth, or are
   query-style endpoints (`img.aspx?…`) pass the parser and are forwarded to Telegraph
   createPage, which fetches them server-side and breaks/omits the ones it can't render.
   (The actual content-type confirmation needs the HEAD checks, which the egress policy blocked
   in this environment.)

Fix targets for Wave-2: dedup+strip-handle+drop-foreign in byline; rejoin lone leading Hebrew
letter (drop-cap) in `_extract_paragraphs`; add image URL/extension or HEAD content-type validation
before embedding.
