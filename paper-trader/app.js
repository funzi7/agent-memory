/* Paper Trader dashboard — shared read-only logic (no backend, no localStorage).
 *
 * Loaded by dashboard.html (overview) and strategy.html (per-strategy detail).
 * Everything is pure rendering off the committed JSON/CSV that the daily run
 * publishes. Affordability and cash-movement are computed CLIENT-SIDE so the
 * pages work whether or not portfolios.json already carries the new fields.
 */
"use strict";
window.PT = (function () {
  // Data sits next to this file (Pages same-origin); fetch RELATIVE paths.
  const FILES = { state: "portfolios.json", closes: "closes.json", trades: "trades.csv" };

  // CANONICAL ordering PREFERENCE only — never a filter. The dashboard renders
  // whatever strategies exist in portfolios.json (see activityOrder/strategyOrder,
  // which append any strategy not listed here), so a NEW strategy appears with
  // zero changes. swing is listed for a stable fallback slot; it still shows even
  // if this list were never touched.
  const ORDER = ["benchmark", "rsi2", "trend200", "rotation", "momentum_scan",
                 "leveraged_momentum", "swing", "guru_track", "screener_track"];
  const DESC = {
    benchmark: "קנה-החזק ‎SPY‎", rsi2: "‎RSI(2)‎ על ‎SPY‎",
    trend200: "‎QQQ‎ מעל ממוצע ‎200‎", rotation: "רוטציה חודשית ‎SPY/QQQ/TLT/GLD‎",
    momentum_scan: "מומנטום צולב נאסד״ק-‎100‎", leveraged_momentum: "מומנטום ‎ETF‎ ממונפים ‎2x/3x‎",
    swing: "פריצת סווינג רב-איתותית על ‎S&P 500‎",
    guru_track: "בחירות ידניות", screener_track: "רשימת סקרינר איכות"
  };
  const SCAN = { momentum_scan: true, leveraged_momentum: true };

  // Extra per-strategy explanation shown under the description (both pages).
  const DESC_NOTE = {
    screener_track: "מסלול A = חברה רווחית שעברה את כל השערים · מסלול B = חברה צומחת אך עדיין מפסידה (עברה רף מקל יותר).",
    swing: "כניסה: פריצה מעל שיא התקופה · מעל ממוצע המגמה · אישור נפח · ו-‎RSI‎ לא קיצוני. יציאה: סטופ הפסד / לקיחת רווח / שבירת ממוצע קצר / סטופ-זמן. הדירוג לפי עוצמת הפריצה."
  };

  // Why an all-cash strategy is idle (mirrors the report's footer reasons).
  const IDLE = {
    benchmark: "קנייה והחזקה — ממתין למילוי הראשון",
    rsi2: "ממתין לצניחת ‎RSI(2)‎ מתחת ל-‎10‎",
    trend200: "‎QQQ‎ מתחת לממוצע ‎200‎ — ממתין לחצייה מעלה",
    rotation: "פועל רק בתחילת חודש",
    momentum_scan: "ממתין לסריקה החודשית / מצב שוק",
    leveraged_momentum: "ממתין לסריקה החודשית / מצב שוק",
    swing: "ממתין לפריצה מאומתת (מגמה + נפח + ‎RSI‎)",
    guru_track: "אין בחירות ב-‎picks.yaml‎",
    screener_track: "טרם התקבלה רשימה מהסקרינר"
  };

  // DEFAULT monthly % targets per strategy (editable; in-memory only).
  const TARGET_DEFAULTS = {
    benchmark: 0.8, rsi2: 1.0, trend200: 1.0, rotation: 1.0,
    momentum_scan: 1.5, leveraged_momentum: 2.5, swing: 1.5, screener_track: 1.2, guru_track: 1.0
  };
  // IBKR-Pro fee model + slippage (matches papertrader/portfolio.py + engine).
  const FEES = { per_share: 0.005, min: 1.0, max_pct: 0.01, slip: 0.0005 };
  const REF_SIZE = 10000;   // reference account size for the $-mode target input

  // session-only target state (resets on reload — by design, no localStorage)
  let targets = Object.assign({}, TARGET_DEFAULTS);
  let tmode = {};  // strategy -> '%' | '$'
  const TKEY = "pt_targets_v1";  // localStorage key (GitHub Pages -> persists)
  let STATE = { portfolios: {}, closes: {}, trades: [] };

  // ===================== THE RTL RULEBOOK (single implementation) =====================
  // See paper-trader/RTL-RULEBOOK.md. Builders emit PLAIN escaped text + structural
  // tags; applyRtl(root) is the ONE place that does bidi after each render:
  //   1) PARAGRAPH DIRECTION — any-Hebrew → dir="rtl" (right aligned, even if the
  //      line starts with English/number/symbol); a pure Latin/number/symbol line
  //      → dir="ltr" (left aligned). Set explicitly per element; we do NOT rely on
  //      unicode-bidi:plaintext.
  //   2) ISOLATE Latin-letter runs (words/identifiers/tickers: GFS, rank, INTC, 10k,
  //      v4, BRK.B) in <bdi> via the rulebook's NONRTL_RUN regex.
  //   3) Numbers/times/dates/plain decimals stay BARE; a leading SIGN or a leading
  //      CURRENCY symbol is the one spot that flips in an RTL line, so signed/$ runs
  //      get the targeted fix: a <bdi dir="ltr"> wrapper (sign on the LEFT). Plain
  //      unsigned percents/dates/times are left bare (the rulebook's rule 3).
  //   4) Code/icons always LTR (CSS).
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  // Hebrew/Arabic block detector (rule 1).
  const RTL = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  // Rule 2 — Latin words / identifiers / letters-glued-to-numbers (NOT pure numbers,
  // dates, times, decimals, or signs/percent). This is the rulebook's regex verbatim.
  const NONRTL_SRC = "[A-Za-z0-9]*[A-Za-z][A-Za-z0-9]*(?:[._\\-\\/%][A-Za-z0-9]+)*%?";
  // Rule 3 (targeted) — a number led by a SIGN or by a CURRENCY symbol, which is the
  // only case that lands on the wrong side inside an RTL line. Isolated LTR so the
  // sign/$ sit on the LEFT and travel with the digits.
  // The FIRST alternative keeps a currency amount with a trailing letter-suffix
  // ("$10k", "$10K", "$100k", "$1.5k") together as ONE LTR run — otherwise "$10"
  // matches and the trailing "k" splits into its own isolate and floats to the LEFT
  // of the number in an RTL line ("k$10"). It must precede the plain "$<digits>"
  // alternatives so the suffix is captured, not dropped.
  const SIGNED_SRC = "\\$\\d[\\d.,]*[A-Za-z][A-Za-z0-9]*%?|[+\\-]\\$?\\d[\\d.,]*%?|\\$\\d[\\d.,]*%?";
  const NONRTL_RUN = () => new RegExp(NONRTL_SRC, "g");      // fresh (own lastIndex)
  const TOKEN_RE = () => new RegExp("(" + SIGNED_SRC + ")|(" + NONRTL_SRC + ")", "g");
  const cls = (x) => (x == null || !isFinite(x)) ? "" : (x >= 0 ? "up" : "down");
  // PLAIN numeric formatters (bidi is handled later by applyRtl).
  const money = (x) => (x == null || !isFinite(x)) ? "—"
    : "$" + Number(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money0 = (x) => (x == null || !isFinite(x)) ? "—"
    : "$" + Number(x).toLocaleString("en-US", { maximumFractionDigits: 0 });
  const signedMoney = (x) => (x == null || !isFinite(x)) ? "—"
    : (x >= 0 ? "+" : "-") + "$" + Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (x, dp) => (x == null || !isFinite(x)) ? "—" : (x >= 0 ? "+" : "") + (x * 100).toFixed(dp == null ? 2 : dp) + "%";
  const pctPlain = (x, dp) => (x == null || !isFinite(x)) ? "—" : (x * 100).toFixed(dp == null ? 1 : dp) + "%";
  const numf = (x) => x == null ? "—" : String(x);
  const sizeTag = (n) => n === 10000 ? "10k" : String(Math.round(n));
  const sizeLabel = (n) => "$" + (n === 10000 ? "10,000" : Math.round(n));
  // Builders emit plain escaped text now; w/sn are kept as escape-only shims so the
  // many call sites stay unchanged — all bidi happens in applyRtl().
  const w = (s) => esc(s);
  const sn = (s) => esc(s);
  // colored numeric value: just a color span; applyRtl isolates the value inside.
  const col = (x, txt) => `<span class="${cls(x)}">${esc(txt)}</span>`;
  // Clear Hebrew label for the engine's cryptic "6-1" momentum tag (DISPLAY only;
  // JSON/CSV field names are never touched).
  const MOM_LABEL = "מומנטום";
  // Screener quality-track badge: "מסלול A" / "מסלול B" (rendered only when the
  // data carries a track; applyRtl isolates the Latin letter).
  const trackBadge = (tr) => ` <span class="badge track-${esc(tr)}">${esc("מסלול " + tr)}</span>`;
  // Small explanatory note line for a strategy (e.g. screener track A/B legend).
  const strategyNote = (strategy) => DESC_NOTE[strategy] ? `<div class="note">${esc(DESC_NOTE[strategy])}</div>` : "";

  // Turn one run of text into HTML, isolating Latin runs (<bdi>) and signed/$ runs
  // (<bdi dir="ltr">), leaving plain numbers/dates/times/decimals bare.
  function wrapRuns(text) {
    const re = TOKEN_RE();
    let out = "", last = 0, m;
    while ((m = re.exec(text))) {
      // A sign glued to a preceding letter/digit/Hebrew char is a separator, not a
      // real sign (e.g. the "-" in a date 2026-06-23 or a Hebrew prefix like ב-22) —
      // leave the whole thing bare.
      if (m[1] && (m[1][0] === "+" || m[1][0] === "-") && m.index > 0 && /[\w\u0590-\u08FF]/.test(text[m.index - 1])) {
        out += esc(text.slice(last, m.index + 1));
        last = m.index + 1; re.lastIndex = m.index + 1; continue;
      }
      out += esc(text.slice(last, m.index));
      out += m[1] ? `<bdi dir="ltr">${esc(m[1])}</bdi>` : `<bdi>${esc(m[2])}</bdi>`;
      last = m.index + m[0].length;
    }
    out += esc(text.slice(last));
    return out;
  }

  const _SKIP = { BDI: 1, CODE: 1, PRE: 1, SCRIPT: 1, STYLE: 1, TEXTAREA: 1 };
  function _setDir(el) {
    const n = el.nodeName;
    if (n === "CODE" || n === "PRE") { el.setAttribute("dir", "ltr"); return; }
    if (n === "SVG" || n === "CANVAS") return;            // leave graphics alone
    el.setAttribute("dir", RTL.test(el.textContent || "") ? "rtl" : "ltr");
  }
  // THE single shared helper. Walk text nodes (skipping already-isolated / code /
  // script subtrees), isolate runs, then set dir per element. Idempotent.
  function applyRtl(root) {
    if (!root || typeof document === "undefined" || !document.createTreeWalker) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        for (let p = node.parentNode; p && p !== root.parentNode; p = p.parentNode)
          if (p.nodeName && _SKIP[p.nodeName]) return NodeFilter.FILTER_REJECT;
        return node.nodeValue && /\S/.test(node.nodeValue)
          ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      }
    });
    const targets = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) targets.push(n);
    for (const t of targets) {
      const html = wrapRuns(t.nodeValue);
      if (html.indexOf("<bdi") === -1) continue;          // nothing to isolate
      const tmp = document.createElement("span");
      tmp.innerHTML = html;
      const frag = document.createDocumentFragment();
      while (tmp.firstChild) frag.appendChild(tmp.firstChild);
      if (t.parentNode) t.parentNode.replaceChild(frag, t);
    }
    _setDir(root);
    const els = root.querySelectorAll ? root.querySelectorAll("*") : [];
    for (let i = 0; i < els.length; i++) _setDir(els[i]);
  }

  // Hidden self-check of the rulebook's NONRTL_RUN against its test sentences.
  try {
    const get = (s) => s.match(NONRTL_RUN()) || [];
    const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    if (typeof console !== "undefined" && console.assert) {
      console.assert(eq(get("ריצה ב-22:30 UTC (05:30 בבוקר)"), ["UTC"]), "RTL rulebook test 1");
      console.assert(eq(get("המחיר 10k דולר"), ["10k"]), "RTL rulebook test 2");
      console.assert(eq(get("הרווח +3.5% השבוע"), []), "RTL rulebook test 3");
      console.assert(eq(get("תזכורת Covered Call - 3 טיקרים"), ["Covered", "Call"]), "RTL rulebook test 4");
    }
  } catch (e) { /* self-check is best-effort only */ }

  function relTime(iso) {
    if (!iso) return "";
    // A date-only value is a processed trading DAY (e.g. "2026-06-24"). Report the
    // CALENDAR-day difference to today, so 2026-06-24 on 2026-06-25 reads as ONE
    // day ("אתמול"), not two. (The old code measured hours from midnight-UTC, which
    // for an ~1.8-day gap rounded UP to "2 ימים" — an off-by-one / TZ artifact.)
    const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (dm) {
      const d0 = new Date(+dm[1], +dm[2] - 1, +dm[3]);   // local midnight of that date
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const days = Math.round((today - d0) / 86400000);
      if (days <= 0) return "עודכן היום";
      if (days === 1) return "עודכן אתמול";
      return "עודכן לפני " + w(days + " ימים");
    }
    // Full timestamp -> elapsed-time wording.
    const then = new Date(iso).getTime();
    if (isNaN(then)) return "";
    const sec = Math.max(0, (Date.now() - then) / 1000);
    if (sec < 90) return "עודכן זה עתה";
    const m = sec / 60, h = m / 60, d = h / 24;
    if (m < 60) return "עודכן לפני " + w(Math.round(m) + " דק׳");
    if (h < 24) return "עודכן לפני " + w(Math.round(h) + " שע׳");
    return "עודכן לפני " + w(Math.round(d) + " ימים");
  }

  // ---- schema helpers ----
  function positionsOf(p) {
    if (p.positions && typeof p.positions === "object") return p.positions;
    if (p.position) return { [p.position.ticker]: p.position };
    return {};
  }
  function pendingOf(p) {
    if (Array.isArray(p.pending_orders)) return p.pending_orders;
    if (p.pending_order && p.pending_order.target)
      return [{ ticker: p.pending_order.target, side: "BUY", reason: p.pending_order.reason }];
    return [];
  }
  const lastEq = (p) => { const e = p.equity_history || []; return e.length ? e[e.length - 1][1] : p.cash; };
  const prevEq = (p) => { const e = p.equity_history || []; return e.length >= 2 ? e[e.length - 2][1] : lastEq(p); };
  const cumRet = (p) => p.account_size ? lastEq(p) / p.account_size - 1 : null;
  const dayChg = (p) => { const pv = prevEq(p); return pv ? lastEq(p) / pv - 1 : 0; };
  function parseRank(reason) {
    const m = /rank\s+(\d+).*?(-?\d+(?:\.\d+)?)\s*%/i.exec(reason || "");
    return m ? { rank: +m[1], mom: parseFloat(m[2]) / 100 } : null;
  }
  // Numeric ordering rank from a pending reason — handles momentum "rank N" and
  // the screener's "shortlist #N" (used to order ticker lists #1 first).
  function orderRank(reason) {
    const m = /(?:rank\s+|shortlist\s*#?\s*|#)(\d+)/i.exec(reason || "");
    return m ? +m[1] : null;
  }
  // Each holding's own rank — positions don't carry it, so derive from the latest
  // BUY trade reason for (strategy, ticker): "rank N" (momentum) / "shortlist #N"
  // (screener). null when the strategy has no ranking (benchmark/rsi2/…).
  function holdingRank(strategy, ticker) {
    const trades = STATE.trades || [];
    for (let i = trades.length - 1; i >= 0; i--) {
      const t = trades[i];
      if (t && t.strategy === strategy && t.ticker === ticker && t.side === "BUY") {
        const r = orderRank(t.reason);
        if (r != null) return r;
      }
    }
    return null;
  }
  // Screener quality track (A = profitable / B = loss-making but growing). Read
  // from a structured field if present, else parsed from a reason string. Returns
  // "A" | "B" | null — so the dashboard shows a badge only when the data has it.
  function parseTrack(s) {
    const m = /(?:track|מסלול)\s*([AB])/i.exec(s || "");
    return m ? m[1].toUpperCase() : null;
  }
  function trackOf(obj) {
    if (!obj) return null;
    if (obj.track === "A" || obj.track === "B") return obj.track;
    if (typeof obj.track === "string") { const t = parseTrack(obj.track); if (t) return t; }
    return parseTrack(obj.reason);
  }

  // ---- cash movement (use JSON fields if present, else derive client-side) ----
  function cashSince(p) {
    if (typeof p.cash_change_since_inception === "number") return p.cash_change_since_inception;
    return p.cash - p.account_size;
  }
  function cashToday(p) {
    if (typeof p.cash_change_today === "number") return p.cash_change_today;
    const ch = p.cash_history;
    if (Array.isArray(ch) && ch.length >= 2) return p.cash - ch[ch.length - 2][1];
    return null;  // unknown until history accrues
  }

  // ---- affordability (mirrors report._pending_lines, whole-share) ----
  function commission(shares, price) {
    if (shares <= 0 || price <= 0) return 0;
    return Math.min(Math.max(FEES.min, FEES.per_share * shares), FEES.max_pct * shares * price);
  }
  function sizeWhole(cash, price) {
    if (cash <= 0 || price <= 0) return 0;
    let s = Math.floor(cash / price);
    while (s > 0 && s * price + commission(s, price) > cash + 1e-9) s -= 1;
    return s <= 0 ? 0 : s;
  }
  const _rankKey = (r) => (r == null ? Infinity : r);
  function _topup(kept, plan, cash) {
    const price = {}, rk = {};
    kept.forEach(s => { price[s.ticker] = s.price; rk[s.ticker] = _rankKey(s.rank); });
    const cost = (tk, sh) => sh > 0 ? sh * price[tk] + commission(sh, price[tk]) : 0;
    let remaining = cash - Object.keys(plan).reduce((a, tk) => a + cost(tk, plan[tk]), 0);
    const order = Object.keys(plan).sort((a, b) => (rk[a] - rk[b]) || (price[a] - price[b]));
    let improved = true;
    while (improved) {
      improved = false;
      for (const tk of order) {
        const delta = cost(tk, plan[tk] + 1) - cost(tk, plan[tk]);
        if (delta <= remaining + 1e-9) { plan[tk] += 1; remaining -= delta; improved = true; break; }
      }
    }
  }
  // Mirror of papertrader.portfolio.plan_buys (rank-preferred greedy small-account
  // fill) so the dashboard preview matches what the engine will actually buy.
  function planBuys(specs, cash) {
    const out = { bought: [], unbuyable: [], not_bought: [] };
    if (cash <= 0 || !specs.length) { out.not_bought = specs.map(s => ({ ticker: s.ticker, rank: s.rank })); return out; }
    const eligible = specs.filter(s => s.price <= cash + 1e-9);
    out.unbuyable = specs.filter(s => s.price > cash + 1e-9).map(s => ({ ticker: s.ticker, price: s.price, rank: s.rank }));
    if (!eligible.length) return out;
    const sum = (pl) => Object.values(pl).reduce((a, b) => a + b, 0);
    const equalWeight = (names) => { const slc = cash / names.length; const pl = {}; names.forEach(s => pl[s.ticker] = sizeWhole(slc, s.price)); return pl; };
    let kept = eligible.slice(), plan = equalWeight(kept);
    if (sum(plan) === 0) {
      while (kept.length > 1 && sum(plan) === 0) {
        let worst = kept[0];
        for (const s of kept) if (s.price > worst.price || (s.price === worst.price && _rankKey(s.rank) > _rankKey(worst.rank))) worst = s;
        kept = kept.filter(s => s.ticker !== worst.ticker);
        plan = equalWeight(kept);
      }
      if (sum(plan) > 0) _topup(kept, plan, cash);
    }
    const keptSet = new Set(kept.map(s => s.ticker)), unbSet = new Set(out.unbuyable.map(u => u.ticker));
    for (const s of specs) {
      if (unbSet.has(s.ticker)) continue;
      if (keptSet.has(s.ticker) && plan[s.ticker] > 0) out.bought.push({ ticker: s.ticker, shares: plan[s.ticker], price: s.price, rank: s.rank });
      else out.not_bought.push({ ticker: s.ticker, rank: s.rank });
    }
    return out;
  }
  function affordability(p, closes) {
    const pend = pendingOf(p);
    const sells = pend.filter(o => o.side === "SELL");
    const buys = pend.filter(o => o.side === "BUY");
    let avail = p.cash;
    const pos = positionsOf(p);
    for (const o of sells) {
      const q = pos[o.ticker], px = closes[o.ticker];
      if (q && px != null) { const sp = px * (1 - FEES.slip); avail += q.shares * sp - commission(q.shares, sp); }
    }
    const specs = [], unpriced = [], meta = {};
    for (const o of buys) {
      const px = closes[o.ticker];
      const rank = orderRank(o.reason);
      if (px == null) { unpriced.push({ ticker: o.ticker, reason: o.reason, rank }); continue; }
      specs.push({ ticker: o.ticker, price: px * (1 + FEES.slip), rank });
      meta[o.ticker] = { reason: o.reason, px };
    }
    const plan = planBuys(specs, avail);
    const byRank = (a, b) => _rankKey(a.rank) - _rankKey(b.rank);
    const bought = plan.bought.map(b => ({
      ticker: b.ticker, shares: b.shares, price: meta[b.ticker].px,
      cost: b.shares * b.price + commission(b.shares, b.price), reason: meta[b.ticker].reason, rank: b.rank
    })).sort(byRank);
    const unbuyable = plan.unbuyable.map(u => ({ ticker: u.ticker, price: meta[u.ticker] ? meta[u.ticker].px : null, rank: u.rank })).sort(byRank);
    const not_bought = plan.not_bought.map(n => ({ ticker: n.ticker, rank: n.rank })).sort(byRank);
    unpriced.sort(byRank);
    return { sells: sells.map(o => o.ticker), bought, unbuyable, not_bought, unpriced, avail };
  }

  // ---- realized monthly pace from equity_history ----
  function pace(p) {
    const eh = p.equity_history || [];
    if (eh.length < 2) return { ok: false };
    const d0 = new Date(eh[0][0] + "T00:00:00Z").getTime();
    const d1 = new Date(eh[eh.length - 1][0] + "T00:00:00Z").getTime();
    const days = (d1 - d0) / 86400000;
    const months = days / 30.4375;
    const totalReturn = lastEq(p) / p.account_size - 1;
    const gain = lastEq(p) - p.account_size;
    if (months < 0.05) return { ok: false, tooShort: true, months, totalReturn, gain };
    const paceM = Math.pow(1 + totalReturn, 1 / months) - 1;
    return { ok: true, months, totalReturn, gain, paceM, paceDollar: paceM * p.account_size };
  }
  // SPY pace = the benchmark portfolio (buy-and-hold SPY) of the same size.
  function spyPace(sizeTagStr) {
    const pid = "benchmark_" + sizeTagStr;
    const bp = STATE.portfolios[pid];
    return bp ? pace(bp) : { ok: false };
  }

  // ---- target state (persisted in localStorage, keyed by strategy) ----
  function getTarget(strategy) {
    return targets[strategy] != null ? targets[strategy] : (TARGET_DEFAULTS[strategy] != null ? TARGET_DEFAULTS[strategy] : 1.0);
  }
  function getMode(strategy) { return tmode[strategy] || "%"; }
  function loadTargets() {
    try {
      const raw = localStorage.getItem(TKEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      for (const k in o) {
        if (o[k] && typeof o[k].pct === "number") targets[k] = o[k].pct;
        if (o[k] && (o[k].mode === "%" || o[k].mode === "$")) tmode[k] = o[k].mode;
      }
    } catch (e) { /* storage disabled / corrupt -> defaults */ }
  }
  function saveTargets() {
    try {
      const o = {};
      for (const k of new Set([...Object.keys(targets), ...Object.keys(tmode)])) o[k] = { pct: getTarget(k), mode: getMode(k) };
      localStorage.setItem(TKEY, JSON.stringify(o));
    } catch (e) { /* ignore */ }
  }
  function setTargetPct(strategy, p) { targets[strategy] = Math.max(0, p || 0); saveTargets(); }
  function setMode(strategy, m) { tmode[strategy] = m; saveTargets(); }
  function resetTargets() {
    try { localStorage.removeItem(TKEY); } catch (e) { /* ignore */ }
    targets = Object.assign({}, TARGET_DEFAULTS);
    tmode = {};
  }
  loadTargets();

  // ---- data load ----
  async function getJSON(u) { const r = await fetch(u, { cache: "no-store" }); if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }
  async function getText(u) { const r = await fetch(u, { cache: "no-store" }); if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); }
  function parseCSV(text) {
    // RFC-4180-ish: fields may be quoted and contain commas / "" escapes (the
    // engine quotes any reason with a comma, e.g. "rank 3, 6-1 +147.6%"). A naive
    // comma split leaked a stray quote into the reason — parse quotes properly.
    text = String(text == null ? "" : text).replace(/\r\n?/g, "\n");
    const rows = [];
    let row = [], field = "", inQ = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
        else field += c;
      } else if (c === '"') { inQ = true; }
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += c;
    }
    if (field.length || row.length) { row.push(field); rows.push(row); }
    if (rows.length < 2) return [];
    const head = rows[0].map(h => h.trim());
    return rows.slice(1)
      .filter(r => r.length > 1 || (r[0] != null && r[0] !== ""))
      .map(r => { const o = {}; head.forEach((h, i) => o[h] = r[i]); return o; });
  }
  async function loadAll() {
    const state = await getJSON(FILES.state);   // required
    let closes = {}, trades = [];
    try { closes = await getJSON(FILES.closes); } catch (e) { /* optional */ }
    try { trades = parseCSV(await getText(FILES.trades)); } catch (e) { /* optional */ }
    STATE = { portfolios: state.portfolios || {}, closes, trades, last: state.last_processed_date };
    return STATE;
  }
  const state = () => STATE;

  function groupByStrategy(ports) {
    const by = {};
    for (const p of Object.values(ports)) (by[p.strategy] = by[p.strategy] || {})[sizeTag(p.account_size)] = p;
    return by;
  }
  function strategyOrder(by) {
    return ORDER.filter(s => by[s]).concat(Object.keys(by).filter(s => !ORDER.includes(s)));
  }
  // Order cards by ACTIVITY: benchmark pinned on top, then strategies with open
  // positions, then strategies with pending orders (no positions yet), then the
  // fully-idle all-cash ones last. Within a tier, larger |cumulative return| first.
  function activityOrder(by) {
    const sizesOf = (s) => ["100", "10k"].map(t => by[s][t]).filter(Boolean);
    const tierOf = (s) => {
      const ps = sizesOf(s);
      if (ps.some(p => Object.keys(positionsOf(p)).length > 0)) return 0;   // holding
      if (ps.some(p => (pendingOf(p) || []).length > 0)) return 1;          // pending only
      return 2;                                                             // idle / all cash
    };
    const retOf = (s) => Math.max(0, ...sizesOf(s).map(p => Math.abs(cumRet(p) || 0)));
    const others = Object.keys(by).filter(s => s !== "benchmark");
    others.sort((a, b) => (tierOf(a) - tierOf(b)) || (retOf(b) - retOf(a)) || a.localeCompare(b));
    return (by.benchmark ? ["benchmark"] : []).concat(others);
  }

  // ---- shared chart: normalized equity curves (start=100) ----
  function renderEquityChart(canvas, pfList, prevChart) {
    if (prevChart) { try { prevChart.destroy(); } catch (e) {} }
    const usable = pfList.filter(x => (x.pf.equity_history || []).length >= 2);
    if (!usable.length) return null;
    const dates = new Set();
    usable.forEach(x => (x.pf.equity_history || []).forEach(e => dates.add(e[0])));
    const labels = Array.from(dates).sort();
    const palette = ["#60a5fa", "#2ecc71", "#e67e22", "#9b59b6", "#e74c3c", "#1abc9c", "#f1c40f", "#f472b6"];
    const datasets = usable.map((x, i) => {
      const m = new Map((x.pf.equity_history || []).map(e => [e[0], e[1]]));
      const base = (x.pf.equity_history || [])[0][1] || x.pf.account_size;
      return {
        label: x.label, data: labels.map(d => m.has(d) ? +(m.get(d) / base * 100).toFixed(2) : null),
        borderColor: x.color || palette[i % palette.length], backgroundColor: x.color || palette[i % palette.length],
        borderWidth: 2, pointRadius: 0, tension: .15, spanGaps: true
      };
    });
    return new Chart(canvas, {
      type: "line", data: { labels, datasets },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
        scales: { x: { ticks: { color: "#9aa7b3", maxTicksLimit: 8 }, grid: { color: "#222c36" } }, y: { ticks: { color: "#9aa7b3" }, grid: { color: "#222c36" } } },
        plugins: { legend: { position: "bottom", labels: { color: "#e6edf3", boxWidth: 12, font: { size: 11 } } }, tooltip: { rtl: true } }
      }
    });
  }

  // ---- trades (optionally filtered to a strategy) ----
  function _tradeRows(trades, opts) {
    opts = opts || {};
    let rows = (trades || []).slice();
    if (opts.strategy) rows = rows.filter(t => t.strategy === opts.strategy);
    return rows.slice(-(opts.limit || 20)).reverse();
  }
  // WIDE screens: a normal table (bidi applied post-render by applyRtl).
  function tradesRowsHTML(trades, opts) {
    opts = opts || {};
    const rows = _tradeRows(trades, opts);
    if (!rows.length) return "";
    return rows.map(t => {
      const side = t.side === "BUY" ? "🟢 קנייה" : "🔴 מכירה";
      const price = (t.fill_price != null && t.fill_price !== "") ? money(parseFloat(t.fill_price)) : "—";
      const strat = opts.strategy ? "" : `<td>${esc(t.strategy)}</td>`;
      return `<tr><td>${esc(t.date)}</td>${strat}<td>${esc(t.ticker)}</td><td>${esc(side)}</td>` +
        `<td class="num">${esc(numf(t.shares))}</td><td class="num">${esc(price)}</td>` +
        `<td class="muted">${esc(reasonAscii(t.reason))}</td></tr>`;
    }).join("");
  }
  // NARROW screens (phones): each trade as a compact stacked card — line 1 is
  // date · strategy · ticker, line 2 is side · qty · price · reason. Nothing is
  // clipped and the page never scrolls sideways. Bidi is applied by applyRtl.
  function tradesCardsHTML(trades, opts) {
    opts = opts || {};
    const rows = _tradeRows(trades, opts);
    if (!rows.length) return "";
    return rows.map(t => {
      const side = t.side === "BUY" ? "🟢 קנייה" : "🔴 מכירה";
      const price = (t.fill_price != null && t.fill_price !== "") ? money(parseFloat(t.fill_price)) : "—";
      const l1 = [t.date, opts.strategy ? null : t.strategy, t.ticker].filter(Boolean).join(" · ");
      const l2 = [side, numf(t.shares), price, reasonAscii(t.reason)].filter(x => x != null && x !== "").join(" · ");
      return `<div class="trade"><div class="t1">${esc(l1)}</div><div class="t2">${esc(l2)}</div></div>`;
    }).join("");
  }

  const DISCLAIMER =
    "היעד הוא רף שאתה מגדיר — באחוזים או בדולרים — לא תחזית. תשואה עתידית תלויה בשוק " +
    "ואינה מובטחת. הקצב בפועל מבוסס על היסטוריה קצרה ויכול להשתנות מאוד, במיוחד באסטרטגיות ממונפות.";

  const round1 = (x) => Math.round(x * 10) / 10;

  // ---- cash line ----
  function cashLineHTML(p) {
    // BUG FIX: the daily / since-inception deltas are the TOTAL-EQUITY change
    // (cash + market value of positions) vs the prior day / initial capital — NOT
    // the cash movement. Money that left the cash balance to BUY shares is invested,
    // not lost, so a fully-invested portfolio (little cash, lots of positions) must
    // never read as a near-total loss. "מזומן" stays the real cash BALANCE.
    const eqNow = lastEq(p);
    const today = eqNow - prevEq(p);
    const since = eqNow - (p.account_size || 0);
    const t = col(today, signedMoney(today));
    const s = col(since, signedMoney(since));
    // Plain text + colour spans; applyRtl() sets the line dir=rtl and LTR-isolates
    // the $ balance and the signed deltas so the sign sits on the left.
    return `מזומן: ${sn(money(p.cash))} (יומי ${t} · מאז התחלה ${s})`;
  }

  // ---- holdings table ----
  function holdingsHTML(p, closes, opts) {
    opts = opts || {};
    const pos = positionsOf(p), eq = lastEq(p), scan = SCAN[p.strategy];
    // Order by the strategy's rank when positions carry one (momentum's rank, or a
    // screener shortlist rank), else alphabetically. Keeps #1 at the top.
    const tks = Object.keys(pos).sort((a, b) => (_rankKey(pos[a].rank) - _rankKey(pos[b].rank)) || a.localeCompare(b));
    if (!tks.length) return "";
    const head = opts.detailed
      ? "<tr><th>טיקר</th><th>כמות</th><th>שווי</th><th>משקל</th><th>רו״ה</th></tr>"
      : "<tr><th>טיקר</th><th>כמות</th><th>משקל</th><th>רו״ה</th></tr>";
    let rows = "";
    for (const tk of tks) {
      const q = pos[tk], close = closes[tk];
      const mv = close != null ? q.shares * close : null;
      const pnl = (mv != null && q.cost_basis) ? (mv - q.cost_basis) / q.cost_basis : null;
      const wt = (mv != null && eq) ? mv / eq : null;
      // Per-holding sub-line: its OWN rank (FIX 5) + entry & current price (FIX 4),
      // then the scan-only momentum annotations. One plain run; applyRtl isolates
      // the tickers/$ and keeps the Hebrew labels (דירוג/כניסה/נוכחי) right-to-left.
      const bits = [];
      if (p.strategy === "combined") {
        // Derived blend: show which strategies contributed this (deduped) ticker.
        // Strategy names are Latin identifiers → applyRtl isolates each run.
        const src = Array.isArray(q.sources) ? q.sources : [];
        if (src.length > 1) bits.push(`מוחזק ע״י ${src.length} אסטרטגיות (${src.join(" · ")})`);
        else if (src.length === 1) bits.push(`מ-${src[0]}`);
      } else {
      const rk = (q.rank != null) ? q.rank : holdingRank(p.strategy, tk);
      if (rk != null) bits.push("דירוג " + rk);
      bits.push("כניסה " + money(q.avg_price));
      bits.push("נוכחי " + (close != null ? money(close) : "—"));
      if (scan) {
        const m = q.momentum_6_1 != null ? q.momentum_6_1 : (q.mom != null ? q.mom : null);
        if (m != null) bits.push(MOM_LABEL + " " + pct(m, 1));
        if (q.trail_pct != null && p.strategy === "leveraged_momentum") bits.push("סטופ " + (q.trail_pct * 100).toFixed(0) + "%");
        if (q.partial) bits.push("חלקי");
      }
      }
      const sub = `<span class="sub">${sn(bits.join(" · "))}</span>`;
      // Screener quality track badge (A/B) — shown only when the data carries it.
      let badge = "";
      if (p.strategy === "screener_track") { const tr = trackOf(q); if (tr) badge = trackBadge(tr); }
      const wtTxt = wt == null ? "—" : (wt * 100).toFixed(1) + "%";
      const cellsCommon = `<td class="num">${sn(numf(q.shares))}</td>`;
      if (opts.detailed) {
        rows += `<tr><td>${w(tk)}${badge}${sub}</td>${cellsCommon}` +
          `<td class="num">${mv == null ? "—" : sn(money(mv))}</td>` +
          `<td class="num">${sn(wtTxt)}</td>` +
          `<td class="num ${cls(pnl)}">${sn(pct(pnl))}</td></tr>`;
      } else {
        rows += `<tr><td>${w(tk)}${badge}${sub}</td>${cellsCommon}` +
          `<td class="num">${sn(wtTxt)}</td>` +
          `<td class="num ${cls(pnl)}">${sn(pct(pnl))}</td></tr>`;
      }
    }
    return `<table><thead>${head}</thead><tbody>${rows}</tbody></table>`;
  }

  // ---- affordability-aware pending preview (BIDI: each Latin run isolated) ----
  const _fmt = (x) => Number(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // Replace the engine's "6-1" / "6-1(short)" momentum tag with a clear Hebrew
  // label for DISPLAY only (the underlying reason string in the CSV is untouched).
  const relabelMom = (s) => String(s == null ? "" : s)
    .replace(/6-1\s*\(short\)/gi, MOM_LABEL + " (חלקי)")
    .replace(/6-1/g, MOM_LABEL);
  // commas -> middle dots, "6-1" -> מומנטום, "rank N"/"shortlist #N" -> Hebrew
  // "דירוג N", and strip any stray quote chars ("/'/gershayim that could leak in
  // from a CSV reason). Display only; underlying CSV/JSON is untouched.
  const reasonAscii = (r) => relabelMom(
      String(r == null ? "" : r).replace(/["'׳״]/g, "").replace(/\s*,\s*/g, " · "))
    .replace(/screener\s+shortlist\s*#?\s*/i, "דירוג סקרינר #")
    .replace(/\bshortlist\s*#?\s*/i, "דירוג #")
    .replace(/\brank\s+(\d+)/gi, "דירוג $1")
    // swing "פריצה #N" — the N is shown separately as דירוג N, so drop it here.
    .replace(/(פריצה)\s*#\d+/g, "$1");

  // A PARTIAL profit-taking sell (scale-out): {side:"SELL", qty, partial:true,
  // reason:"מימוש חלקי …"}. Render it distinctly (♻️ green) with the qty so it's
  // clear only PART of the position is sold — never a plain "מכירה". The reason
  // already begins "מימוש חלקי", so strip that prefix to avoid a double label.
  function partialSellRow(o) {
    const head = (o.qty != null) ? `מכירת ${o.qty} יח׳ ${o.ticker}` : `מכירת ${o.ticker}`;
    const r = o.reason ? reasonAscii(o.reason).replace(/^מימוש חלקי\s*/, "") : "";
    return `<div class="pend partial">♻️ מימוש חלקי: ${sn(head + (r ? " · " + r : ""))}</div>`;
  }
  // Render pending SELL orders: each partial sell on its own ♻️ row (qty+reason),
  // the remaining FULL sells collapsed into one "⏳ מכירה: T1 · T2" line. Shared by
  // the swing path and the affordability path so partials look the same everywhere.
  function sellLinesHTML(sellOrders, tb) {
    tb = tb || (() => "");
    const L = [], fulls = [];
    for (const o of (sellOrders || [])) {
      if (o.partial) L.push(partialSellRow(o));
      else fulls.push(o.ticker + tb(o.ticker));
    }
    if (fulls.length) L.push(`<div class="pend">⏳ מכירה: ${sn(fulls.join(" · "))}</div>`);
    return L;
  }

  // Swing pending orders self-describe (structured rank / price / qty), so render
  // them straight from those fields — ordered by RANK (1 first), each showing its
  // price, and split into real buys (qty>0) vs unaffordable (qty=0) — instead of
  // re-deriving affordability from closes.json (which may not price the S&P names).
  function pendingStructuredHTML(p) {
    const pend = (pendingOf(p) || []).slice();
    if (!pend.length) return "";
    const rk = (o) => (typeof o.rank === "number" ? o.rank : Infinity);
    const sells = pend.filter(o => o.side === "SELL");
    const buys = pend.filter(o => o.side === "BUY")
      .sort((a, b) => (rk(a) - rk(b)) || String(a.ticker).localeCompare(b.ticker));
    const L = sellLinesHTML(sells);
    for (const o of buys) {
      const px = (typeof o.price === "number") ? `$${_fmt(o.price)}` : "—";
      const rankTxt = (typeof o.rank === "number") ? ` · דירוג ${o.rank}` : "";
      const reasonTxt = o.reason ? " · " + reasonAscii(o.reason) : "";
      if (o.qty && o.qty > 0) {
        // real planned buy (next-open): qty units @ estimated price.
        L.push(`<div class="pend">⏳ קנייה: ${sn(`${o.qty} יח׳ ${o.ticker} @ ${px}${rankTxt}${reasonTxt}`)}</div>`);
      } else {
        // unaffordable at the account size — show the price, amber/hourglass.
        L.push(`<div class="pend skip">⏳ לא ניתנת לרכישה: ${sn(`${o.ticker} — יחידה ${px}${rankTxt}${reasonTxt}`)}</div>`);
      }
    }
    return L.join("");
  }

  function pendingHTML(p, closes) {
    // Swing carries structured rank/price/qty on each order → render from those
    // (rank-ordered, priced, qty>0 buy vs qty=0 unaffordable). Other strategies
    // keep the closes-based affordability preview below.
    if (p && p.strategy === "swing") return pendingStructuredHTML(p);
    const a = affordability(p, closes);
    if (!a.sells.length && !a.bought.length && !a.unbuyable.length && !a.not_bought.length && !a.unpriced.length) return "";
    // Quality-track suffix per ticker (only when the data carries A/B).
    const trk = {};
    for (const o of pendingOf(p)) { const tr = trackOf(o); if (tr) trk[o.ticker] = tr; }
    const tb = (tk) => trk[tk] ? " · מסלול " + trk[tk] : "";
    const L = [];
    // Each line = an RTL Hebrew label + a plain technical tail; applyRtl() isolates
    // tickers/rank (<bdi>) and signed/$ runs (LTR), keeping signs on the left.
    // Sells from the RAW orders (so partial:true / qty / reason survive — affordability
    // only keeps tickers). Partial profit-takes get their own ♻️ row.
    const sellOrders = pendingOf(p).filter(o => o.side === "SELL");
    for (const line of sellLinesHTML(sellOrders, tb)) L.push(line);
    for (const b of a.bought) {
      let tail = `${b.shares} ${b.ticker} @ ~$${_fmt(b.price)} (≈$${_fmt(b.cost)})`;
      if (b.reason) tail += " · " + reasonAscii(b.reason);
      tail += tb(b.ticker);
      L.push(`<div class="pend">⏳ קנייה: ${sn(tail)}</div>`);
    }
    for (const u of a.unbuyable) {
      L.push(`<div class="pend skip">⏳ לא ניתנת לרכישה: ${sn(`${u.ticker} — יחידה $${_fmt(u.price)} > מזומן $${_fmt(a.avail)}` + tb(u.ticker))}</div>`);
    }
    for (const n of a.not_bought) {
      L.push(`<div class="pend skip">⏳ לא נקנתה הפעם (הקצאה שוות-משקל קטנה מהמחיר): ${sn(n.ticker + tb(n.ticker))}</div>`);
    }
    for (const o of a.unpriced) {
      let tail = o.ticker;
      if (o.reason) tail += " · " + reasonAscii(o.reason);
      tail += tb(o.ticker);
      L.push(`<div class="pend">⏳ קנייה: ${sn(tail)}</div>`);
    }
    return L.join("");
  }

  // ---- DUAL %/$ target tracker ----
  function targetPreview(strategy, pctv) {
    if (getMode(strategy) === "%")
      return sn(`≈ $${_fmt(pctv / 100 * 100)} לחודש על $100 · $${_fmt(pctv / 100 * 10000)} לחודש על $10k`);
    return sn(`= ${(pctv).toFixed(2)}% לחודש · הקלט על $10k`);
  }
  function targetEditorHTML(strategy) {
    const pctv = getTarget(strategy), mode = getMode(strategy);
    const val = mode === "%" ? round1(pctv) : Math.round(pctv / 100 * REF_SIZE);
    const btn = (mode === "%" ? "% לחודש" : "$ לחודש (על $10k)") + " ⇄";
    return `<div class="target-edit">` +
      `<span class="lbl">🎯 יעד חודשי:</span>` +
      `<input id="tin-${strategy}" class="tinput" type="number" step="0.1" min="0" value="${val}" ` +
      `inputmode="decimal" oninput="PT.onTargetInput('${strategy}', this.value)" aria-label="יעד חודשי">` +
      `<button id="ttog-${strategy}" class="ttog" type="button" onclick="PT.onTargetToggle('${strategy}')">${btn}</button>` +
      `<span id="tprev-${strategy}" class="muted tprev">${targetPreview(strategy, pctv)}</span></div>`;
  }
  function paceTargetInner(pf, pctv) {
    const size = pf.account_size, tFrac = pctv / 100, tDollarM = tFrac * size;
    const pc = pace(pf), sp = spyPace(sizeTag(size));
    const lines = [];
    // Natural Hebrew labels; applyRtl isolates SPY/numbers and keeps signs left.
    lines.push(`<div>יעד: ${sn(`${(tFrac * 100).toFixed(1)}% לחודש ≈ $${_fmt(tDollarM)} לחודש`)}</div>`);
    if (!pc.ok) {
      lines.push(`<div class="muted">בפועל: ${pc.tooShort ? "טרם ניתן לחשב קצב (היסטוריה קצרה)" : "אין נתונים"}</div>`);
      if (pc.tooShort) lines.push(`<div>מאז התחלה: ${col(pc.gain, signedMoney(pc.gain))}</div>`);
      return lines.join("");
    }
    const ratio = tFrac > 0 ? pc.paceM / tFrac : null;
    let badge = "";
    if (ratio != null) badge = ratio >= 1.1 ? `<span class="bd up">🚀 מקדים</span>`
      : ratio >= 0.9 ? `<span class="bd ok">✅ בקצב</span>` : `<span class="bd down">⚠️ מאחור</span>`;
    const spTxt = sp.ok ? sn(` · SPY ${pctPlain(sp.paceM)} לחודש`) : "";
    const cumTarget = size * (Math.pow(1 + tFrac, pc.months) - 1);
    lines.push(`<div>בפועל: ${col(pc.paceM, `${pct(pc.paceM, 1)} לחודש ≈ $${_fmt(pc.paceDollar)} לחודש`)}${spTxt}</div>`);
    // PACE vs the user-set monthly target — NOT a return. Reworded from the old
    // "השגת היעד: 224%" (mistaken for a +224% gain): use the MULTIPLE form (×2.2
    // מהיעד) once you're past ~150% of pace, and "N% מהיעד" below that. The real
    // return lives in the separate "תשואה מצטברת" row, so the two can't be confused.
    let achTxt;
    if (ratio == null) achTxt = "—";
    else if (ratio >= 1.5) achTxt = "×" + ratio.toFixed(1) + " מהיעד";   // e.g. ×2.2 מהיעד
    else achTxt = (ratio * 100).toFixed(0) + "% מהיעד";                  // e.g. 80% מהיעד
    lines.push(`<div>קצב מול יעד: ${sn(achTxt)} ${badge}</div>`);
    lines.push(`<div class="muted">מאז התחלה: ${col(pc.gain, signedMoney(pc.gain))} ${sn(`· יעד ≈ $${_fmt(cumTarget)} לאורך ${pc.months.toFixed(1)} חודשים`)}</div>`);
    return lines.join("");
  }
  function paceTargetHTML(pf, strategy) {
    return `<div id="tgt-${strategy}-${sizeTag(pf.account_size)}" class="pace">${paceTargetInner(pf, getTarget(strategy))}</div>`;
  }
  // live handlers (do NOT rebuild the input -> keep focus)
  function onTargetInput(strategy, raw) {
    const v = parseFloat(raw);
    if (isNaN(v)) return;
    setTargetPct(strategy, getMode(strategy) === "%" ? v : v / REF_SIZE * 100);
    updateTargetUI(strategy);
  }
  function onTargetToggle(strategy) {
    setMode(strategy, getMode(strategy) === "%" ? "$" : "%");
    const pctv = getTarget(strategy), mode = getMode(strategy);
    const inp = document.getElementById("tin-" + strategy);
    if (inp) inp.value = mode === "%" ? round1(pctv) : Math.round(pctv / 100 * REF_SIZE);
    const btn = document.getElementById("ttog-" + strategy);
    if (btn) btn.textContent = (mode === "%" ? "% לחודש" : "$ לחודש (על $10k)") + " ⇄";
    updateTargetUI(strategy);
  }
  function updateTargetUI(strategy) {
    const pctv = getTarget(strategy);
    const prev = document.getElementById("tprev-" + strategy);
    if (prev) { prev.innerHTML = targetPreview(strategy, pctv); applyRtl(prev); }
    const g = (groupByStrategy(STATE.portfolios) || {})[strategy] || {};
    for (const tag of ["100", "10k"]) {
      const el = document.getElementById("tgt-" + strategy + "-" + tag);
      if (el && g[tag]) { el.innerHTML = paceTargetInner(g[tag], pctv); applyRtl(el); }
    }
    const btn = document.getElementById("ttog-" + strategy);
    if (btn) applyRtl(btn);
  }

  return {
    FILES, ORDER, DESC, DESC_NOTE, SCAN, IDLE, TARGET_DEFAULTS, FEES, REF_SIZE, DISCLAIMER,
    w, sn, esc, applyRtl, wrapRuns, pct, pctPlain, money, money0, signedMoney, numf, cls, sizeTag, sizeLabel, relTime,
    strategyNote, trackOf, orderRank,
    positionsOf, pendingOf, lastEq, prevEq, cumRet, dayChg, parseRank,
    cashSince, cashToday, commission, sizeWhole, affordability,
    pace, spyPace, getTarget, setTargetPct, getMode, setMode, resetTargets,
    loadAll, state, groupByStrategy, strategyOrder, activityOrder, renderEquityChart,
    tradesRowsHTML, tradesCardsHTML,
    cashLineHTML, holdingsHTML, pendingHTML,
    targetEditorHTML, paceTargetHTML, paceTargetInner, targetPreview,
    onTargetInput, onTargetToggle, updateTargetUI,
  };
})();
