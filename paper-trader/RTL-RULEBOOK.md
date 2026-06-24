# RTL Rulebook — Hebrew / English / numbers bidi

This is the **single** bidirectional-text spec for the paper-trader dashboard
(`dashboard.html`, `strategy.html`, `app.js`, `style.css`). It supersedes every
earlier ad-hoc attempt (`unicode-bidi:plaintext`, per-word `<bdi>` wrapping in
the builders, per-digit isolates, etc.). All bidi now happens in **one place**:
`PT.applyRtl(root)` in `app.js`, called once after each render.

The dashboard renders settled JSON/CSV (not streaming text), so we process the
DOM **once on load/refresh**. Streaming rules are N/A here. `localStorage` is
fine (GitHub Pages) and is used for editable targets.

---

## The rules

### 1. Paragraph direction — "any-Hebrew → RTL"

For every text element / line / cell, set `dir` from its content:

```js
const RTL = /[֐-׿؀-ۿݐ-ݿࢠ-ࣿ]/;
el.dir = RTL.test(el.textContent) ? 'rtl' : 'ltr';
```

Any line containing **any** Hebrew/Arabic char aligns **right** — even if it
starts with English, a number, or a symbol. A purely English/number/symbol line
aligns **left**. This is stricter than the browser default; we set it
explicitly and do **not** rely on `unicode-bidi:plaintext`.

### 2. Isolate Latin-letter runs only

Wrap each match of this regex in `<bdi>…</bdi>`:

```js
const NONRTL_RUN = /[A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*(?:[._\-\/%][A-Za-z0-9]+)*%?/g;
```

This isolates Latin words / identifiers / tickers and letters-glued-to-numbers
(`GFS`, `rank`, `INTC`, `10k`, `v4`, `BRK.B`, `momentum_scan`). It does **not**
match pure numbers, times (`05:30`), dates (`2026/06/22`), decimals (`12.5`), or
signs/percent (`+`, `-`, `%`, `+3.5%`). Apply to **text nodes only** — never
inside attribute values or existing markup/links.

### 3. Numbers / signs / percent

Plain numbers, dates, times and decimals stay **bare** so the browser orders
them and their separators correctly. The one case that lands on the wrong side
inside an RTL line is a number led by a **sign** or a **currency symbol** (a
lone leading `-`/`+`/`$` resolves to the RTL side and jumps to the right). That
is the only targeted fix: isolate signed/currency runs **LTR** so the sign/`$`
sit on the **left** and travel with the digits:

```js
const SIGNED = /[+\-]\$?\d[\d.,]*%?|\$\d[\d.,]*%?/g;   // -> <bdi dir="ltr">…</bdi>
```

A sign glued to a preceding digit (e.g. the `-` in `2026-06-23`) is an internal
separator, not a negative sign, and is left bare. Unsigned percents like
`12.5%` are left bare (the `%` correctly stays on the right of the digits).

We do **not** blanket-isolate all numbers — that is what scrambled earlier
attempts.

### 4. Code & icons always LTR

```css
pre, code { direction:ltr; unicode-bidi:embed; text-align:left !important; }
svg       { direction:ltr !important; }
bdi       { unicode-bidi:isolate; }
```

### 5. Streaming / caching

N/A for this dashboard — it renders settled data once per load/refresh.

---

## Implementation

`PT.applyRtl(root)` (in `app.js`) is the single shared helper:

1. Walks text nodes (skipping `BDI`, `CODE`, `PRE`, `SCRIPT`, `STYLE`,
   `TEXTAREA` subtrees — so it never double-processes), and replaces each with
   `wrapRuns(text)` output: Latin runs in `<bdi>`, signed/currency runs in
   `<bdi dir="ltr">`, everything else bare.
2. Sets `dir` on every element by rule 1 (`CODE`/`PRE` forced `ltr`; `svg`/
   `canvas` left alone).

It is idempotent and is called after every render: in `load()`'s `finally`
on both pages, and after the live target-tracker updates. Builders emit **plain
escaped text + structural tags only** — they contain no bidi markup.

---

## Validation (test sentences)

`NONRTL_RUN` must isolate exactly these (asserted at load via `console.assert`
in `app.js`):

| Input | Isolated runs |
|---|---|
| `ריצה ב-22:30 UTC (05:30 בבוקר)` | `["UTC"]` |
| `המחיר 10k דולר` | `["10k"]` |
| `הרווח +3.5% השבוע` | `[]` (sign+number+% left alone) |
| `תזכורת Covered Call - 3 טיקרים` | `["Covered","Call"]` |

And a pending line such as
`קנייה: 1 GFS @ ~$83.39 · rank 3 · מומנטום +147.6%`
renders RTL (right-aligned) with `GFS` / `rank` / `מומנטום` readable, `$83.39`
and `+147.6%` LTR-isolated (sign/`$` on the left).
