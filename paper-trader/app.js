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

  const ORDER = ["benchmark", "rsi2", "trend200", "rotation", "momentum_scan",
                 "leveraged_momentum", "guru_track", "screener_track"];
  const DESC = {
    benchmark: "קנה-החזק ‎SPY‎", rsi2: "‎RSI(2)‎ על ‎SPY‎",
    trend200: "‎QQQ‎ מעל ממוצע ‎200‎", rotation: "רוטציה חודשית ‎SPY/QQQ/TLT/GLD‎",
    momentum_scan: "מומנטום צולב נאסד״ק-‎100‎", leveraged_momentum: "מומנטום ‎ETF‎ ממונפים ‎2x/3x‎",
    guru_track: "בחירות ידניות", screener_track: "רשימת סקרינר איכות"
  };
  const SCAN = { momentum_scan: true, leveraged_momentum: true };

  // Why an all-cash strategy is idle (mirrors the report's footer reasons).
  const IDLE = {
    benchmark: "קנייה והחזקה — ממתין למילוי הראשון",
    rsi2: "ממתין לצניחת ‎RSI(2)‎ מתחת ל-‎10‎",
    trend200: "‎QQQ‎ מתחת לממוצע ‎200‎ — ממתין לחצייה מעלה",
    rotation: "פועל רק בתחילת חודש",
    momentum_scan: "ממתין לסריקה החודשית / מצב שוק",
    leveraged_momentum: "ממתין לסריקה החודשית / מצב שוק",
    guru_track: "אין בחירות ב-‎picks.yaml‎",
    screener_track: "טרם התקבלה רשימה מהסקרינר"
  };

  // DEFAULT monthly % targets per strategy (editable; in-memory only).
  const TARGET_DEFAULTS = {
    benchmark: 0.8, rsi2: 1.0, trend200: 1.0, rotation: 1.0,
    momentum_scan: 1.5, leveraged_momentum: 2.5, screener_track: 1.2, guru_track: 1.0
  };
  // IBKR-Pro fee model + slippage (matches papertrader/portfolio.py + engine).
  const FEES = { per_share: 0.005, min: 1.0, max_pct: 0.01, slip: 0.0005 };
  const REF_SIZE = 10000;   // reference account size for the $-mode target input

  // session-only target state (resets on reload — by design, no localStorage)
  let targets = Object.assign({}, TARGET_DEFAULTS);
  let tmode = {};  // strategy -> '%' | '$'
  const TKEY = "pt_targets_v1";  // localStorage key (GitHub Pages -> persists)
  let STATE = { portfolios: {}, closes: {}, trades: [] };

  // ---- bidi-safe formatting ----
  // Wrap a Latin/number/ticker/price run in an LTR bidi ISOLATE (U+2066…U+2069)
  // so it cannot reorder inside the surrounding RTL Hebrew. (The old LRM pairs
  // only marked direction and still let mixed runs like "29 AMDL @ ~$66.99 — rank 3"
  // visually scramble — that was the dashboard's bidi bug.)
  const LRI = "⁦", PDI = "⁩";
  const w = (s) => LRI + s + PDI;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pct = (x, dp) => (x == null || !isFinite(x)) ? w("—")
    : w((x >= 0 ? "+" : "") + (x * 100).toFixed(dp == null ? 2 : dp) + "%");
  const pctPlain = (x, dp) => (x == null || !isFinite(x)) ? w("—")
    : w((x * 100).toFixed(dp == null ? 1 : dp) + "%");
  const money = (x) => (x == null || !isFinite(x)) ? w("—")
    : w("$" + Number(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const money0 = (x) => (x == null || !isFinite(x)) ? w("—")
    : w("$" + Number(x).toLocaleString("en-US", { maximumFractionDigits: 0 }));
  const signedMoney = (x) => (x == null || !isFinite(x)) ? w("—")
    : w((x >= 0 ? "+" : "-") + "$" + Math.abs(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const numf = (x) => x == null ? w("—") : w(String(x));
  const cls = (x) => (x == null || !isFinite(x)) ? "" : (x >= 0 ? "up" : "down");
  const sizeTag = (n) => n === 10000 ? "10k" : String(Math.round(n));
  const sizeLabel = (n) => w("$" + (n === 10000 ? "10,000" : Math.round(n)));

  function relTime(iso) {
    if (!iso) return "";
    const then = new Date(iso + (iso.length <= 10 ? "T00:00:00Z" : "")).getTime();
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
    out.unbuyable = specs.filter(s => s.price > cash + 1e-9).map(s => ({ ticker: s.ticker, price: s.price }));
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
      if (px == null) { unpriced.push({ ticker: o.ticker, reason: o.reason }); continue; }
      specs.push({ ticker: o.ticker, price: px * (1 + FEES.slip), rank: parseRank(o.reason) });
      meta[o.ticker] = { reason: o.reason, px };
    }
    const plan = planBuys(specs, avail);
    const bought = plan.bought.map(b => ({
      ticker: b.ticker, shares: b.shares, price: meta[b.ticker].px,
      cost: b.shares * b.price + commission(b.shares, b.price), reason: meta[b.ticker].reason, rank: b.rank
    })).sort((a, b) => _rankKey(a.rank) - _rankKey(b.rank));
    const unbuyable = plan.unbuyable.map(u => ({ ticker: u.ticker, price: meta[u.ticker] ? meta[u.ticker].px : null }));
    const not_bought = plan.not_bought.map(n => ({ ticker: n.ticker }));
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
    const lines = (text || "").trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const head = lines[0].split(",");
    return lines.slice(1).map(line => { const c = line.split(","); const o = {}; head.forEach((h, i) => o[h.trim()] = c[i]); return o; });
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

  // ---- trades table rows (optionally filtered to a strategy) ----
  function tradesRowsHTML(trades, opts) {
    opts = opts || {};
    let rows = (trades || []).slice();
    if (opts.strategy) rows = rows.filter(t => t.strategy === opts.strategy);
    rows = rows.slice(-(opts.limit || 20)).reverse();
    if (!rows.length) return "";
    return rows.map(t => {
      const side = t.side === "BUY" ? "🟢 קנייה" : "🔴 מכירה";
      const price = (t.fill_price != null && t.fill_price !== "") ? money(parseFloat(t.fill_price)) : w("—");
      const strat = opts.strategy ? "" : `<td>${w(esc(t.strategy))}</td>`;
      return `<tr><td>${w(esc(t.date))}</td>${strat}<td>${w(esc(t.ticker))}</td><td>${side}</td>` +
        `<td class="num">${w(esc(t.shares))}</td><td class="num">${price}</td><td class="muted">${w(esc(t.reason))}</td></tr>`;
    }).join("");
  }

  const DISCLAIMER =
    "היעד הוא רף שאתה מגדיר — באחוזים או בדולרים — לא תחזית. תשואה עתידית תלויה בשוק " +
    "ואינה מובטחת. הקצב בפועל מבוסס על היסטוריה קצרה ויכול להשתנות מאוד, במיוחד באסטרטגיות ממונפות.";

  const round1 = (x) => Math.round(x * 10) / 10;

  // ---- cash line ----
  function cashLineHTML(p) {
    const today = cashToday(p), since = cashSince(p);
    const t = today == null ? "—" : `<span class="${cls(today)}">${_sm(today)}</span>`;
    const s = `<span class="${cls(since)}">${_sm(since)}</span>`;
    // Hebrew label, then the WHOLE numeric tail as one isolated LTR block.
    return `מזומן: <span class="ltr">${_m(p.cash)} (יומי ${t} · מאז התחלה ${s})</span>`;
  }

  // ---- holdings table ----
  function holdingsHTML(p, closes, opts) {
    opts = opts || {};
    const pos = positionsOf(p), eq = lastEq(p), scan = SCAN[p.strategy];
    const tks = Object.keys(pos).sort();
    if (!tks.length) return "";
    const head = opts.detailed
      ? "<tr><th>טיקר</th><th>כמות</th><th>מחיר ממוצע</th><th>שווי</th><th>משקל</th><th>רו״ה</th></tr>"
      : "<tr><th>טיקר</th><th>כמות</th><th>משקל</th><th>רו״ה</th></tr>";
    let rows = "";
    for (const tk of tks) {
      const q = pos[tk], close = closes[tk];
      const mv = close != null ? q.shares * close : null;
      const pnl = (mv != null && q.cost_basis) ? (mv - q.cost_basis) / q.cost_basis : null;
      const wt = (mv != null && eq) ? mv / eq : null;
      let sub = "";
      if (scan) {
        // One ASCII LTR block (no Hebrew interleaved with the numbers).
        const bits = [];
        if (q.rank != null) bits.push("rank " + q.rank);
        const m = q.momentum_6_1 != null ? q.momentum_6_1 : (q.mom != null ? q.mom : null);
        if (m != null) bits.push((q.partial ? "6-1(short) " : "6-1 ") + _sp1(m));
        if (q.trail_pct != null && p.strategy === "leveraged_momentum") bits.push("trail " + (q.trail_pct * 100).toFixed(0) + "%");
        if (q.partial) bits.push("partial");
        if (bits.length) sub = `<span class="sub ltr">${bits.join(" · ")}</span>`;
      }
      const badge = "";
      const cellsCommon = `<td class="num">${numf(q.shares)}</td>`;
      if (opts.detailed) {
        rows += `<tr><td>${w(esc(tk))}${badge}${sub}</td>${cellsCommon}` +
          `<td class="num">${money(q.avg_price)}</td>` +
          `<td class="num">${mv == null ? w("—") : money(mv)}</td>` +
          `<td class="num">${wt == null ? w("—") : w((wt * 100).toFixed(1) + "%")}</td>` +
          `<td class="num ${cls(pnl)}">${pct(pnl)}</td></tr>`;
      } else {
        rows += `<tr><td>${w(esc(tk))}${badge}${sub}</td>${cellsCommon}` +
          `<td class="num">${wt == null ? w("—") : w((wt * 100).toFixed(1) + "%")}</td>` +
          `<td class="num ${cls(pnl)}">${pct(pnl)}</td></tr>`;
      }
    }
    return `<table><thead>${head}</thead><tbody>${rows}</tbody></table>`;
  }

  // ---- affordability-aware pending preview (BIDI: each Latin run isolated) ----
  const _fmt = (x) => Number(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const _m = (x) => "$" + _fmt(x);                                   // $1,919.93
  const _sm = (x) => (x >= 0 ? "+" : "-") + "$" + _fmt(Math.abs(x)); // +$50.00 / -$9.50
  const _sp1 = (x) => (x >= 0 ? "+" : "") + (x * 100).toFixed(1) + "%";  // +147.6%
  // Reason -> plain ASCII for the LTR block: commas become middle dots so no
  // Hebrew-adjacent comma sits between two Latin runs.
  const reasonAscii = (r) => esc(r || "").replace(/\s*,\s*/g, " · ");
  // Build a pending line as: short Hebrew label + colon + ONE isolated LTR block.
  const _ltr = (inner) => `<span class="ltr">${inner}</span>`;
  function pendingHTML(p, closes) {
    const a = affordability(p, closes);
    if (!a.sells.length && !a.bought.length && !a.unbuyable.length && !a.not_bought.length && !a.unpriced.length) return "";
    const L = [];
    if (a.sells.length) L.push(`<div class="pend">⏳ מכירה: ${_ltr(a.sells.map(esc).join(" · "))}</div>`);
    for (const b of a.bought) {
      // EVERYTHING after the colon (qty, ticker, price, cost, rank, momentum) is one
      // plain-ASCII LTR string in a single isolate -> bidi never reorders its insides.
      let blk = `${b.shares} ${esc(b.ticker)} @ ~$${_fmt(b.price)} (≈$${_fmt(b.cost)})`;
      if (b.reason) blk += " · " + reasonAscii(b.reason);
      L.push(`<div class="pend">⏳ קנייה: ${_ltr(blk)}</div>`);
    }
    for (const u of a.unbuyable) {
      L.push(`<div class="pend skip">⏳ לא ניתנת לרכישה: ${_ltr(`${esc(u.ticker)} — unit $${_fmt(u.price)} > cash $${_fmt(a.avail)}`)}</div>`);
    }
    for (const n of a.not_bought) {
      L.push(`<div class="pend skip">⏳ לא נקנתה הפעם (הקצאה שוות-משקל קטנה מהמחיר): ${_ltr(esc(n.ticker))}</div>`);
    }
    for (const o of a.unpriced) {
      const blk = esc(o.ticker) + (o.reason ? " · " + reasonAscii(o.reason) : "");
      L.push(`<div class="pend">⏳ קנייה: ${_ltr(blk)}</div>`);
    }
    return L.join("");
  }

  // ---- DUAL %/$ target tracker ----
  function targetPreview(strategy, pctv) {
    if (getMode(strategy) === "%")
      return _ltr(`≈ $${_fmt(pctv / 100 * 100)}/mo on $100 · $${_fmt(pctv / 100 * 10000)}/mo on $10k`);
    return _ltr(`= ${(pctv).toFixed(2)}%/mo · input on $10k`);
  }
  function targetEditorHTML(strategy) {
    const pctv = getTarget(strategy), mode = getMode(strategy);
    const val = mode === "%" ? round1(pctv) : Math.round(pctv / 100 * REF_SIZE);
    const btn = (mode === "%" ? "%/חודש" : "$/חודש (על $10k)") + " ⇄";
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
    // Each line: Hebrew label, then ONE isolated LTR block (pure ASCII).
    lines.push(`<div>יעד: ${_ltr(`${(tFrac * 100).toFixed(1)}%/mo ≈ $${_fmt(tDollarM)}/mo`)}</div>`);
    if (!pc.ok) {
      lines.push(`<div class="muted">בפועל: ${pc.tooShort ? "טרם ניתן לחשב קצב (היסטוריה קצרה)" : "אין נתונים"}</div>`);
      if (pc.tooShort) lines.push(`<div>מאז התחלה: ${_ltr(`<span class="${cls(pc.gain)}">${_sm(pc.gain)}</span>`)}</div>`);
      return lines.join("");
    }
    const ratio = tFrac > 0 ? pc.paceM / tFrac : null;
    let badge = "";
    if (ratio != null) badge = ratio >= 1.1 ? `<span class="bd up">🚀 מקדים</span>`
      : ratio >= 0.9 ? `<span class="bd ok">✅ בקצב</span>` : `<span class="bd down">⚠️ מאחור</span>`;
    const spTxt = sp.ok ? ` · SPY ${_sp1(sp.paceM)}/mo` : "";
    const cumTarget = size * (Math.pow(1 + tFrac, pc.months) - 1);
    lines.push(`<div>בפועל: ${_ltr(`<span class="${cls(pc.paceM)}">${_sp1(pc.paceM)}/mo ≈ $${_fmt(pc.paceDollar)}/mo</span>${spTxt}`)}</div>`);
    lines.push(`<div>השגת היעד: ${_ltr(ratio == null ? "—" : (ratio * 100).toFixed(0) + "%")} ${badge}</div>`);
    lines.push(`<div class="muted">מאז התחלה: ${_ltr(`<span class="${cls(pc.gain)}">${_sm(pc.gain)}</span> · target ≈ $${_fmt(cumTarget)} over ${pc.months.toFixed(1)}mo`)}</div>`);
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
    if (btn) btn.textContent = (mode === "%" ? "%/חודש" : "$/חודש (על $10k)") + " ⇄";
    updateTargetUI(strategy);
  }
  function updateTargetUI(strategy) {
    const pctv = getTarget(strategy);
    const prev = document.getElementById("tprev-" + strategy);
    if (prev) prev.innerHTML = targetPreview(strategy, pctv);
    const g = (groupByStrategy(STATE.portfolios) || {})[strategy] || {};
    for (const tag of ["100", "10k"]) {
      const el = document.getElementById("tgt-" + strategy + "-" + tag);
      if (el && g[tag]) el.innerHTML = paceTargetInner(g[tag], pctv);
    }
  }

  return {
    FILES, ORDER, DESC, SCAN, IDLE, TARGET_DEFAULTS, FEES, REF_SIZE, DISCLAIMER,
    w, esc, pct, pctPlain, money, money0, signedMoney, numf, cls, sizeTag, sizeLabel, relTime,
    positionsOf, pendingOf, lastEq, prevEq, cumRet, dayChg, parseRank,
    cashSince, cashToday, commission, sizeWhole, affordability,
    pace, spyPace, getTarget, setTargetPct, getMode, setMode, resetTargets,
    loadAll, state, groupByStrategy, strategyOrder, activityOrder, renderEquityChart, tradesRowsHTML,
    cashLineHTML, holdingsHTML, pendingHTML,
    targetEditorHTML, paceTargetHTML, paceTargetInner, targetPreview,
    onTargetInput, onTargetToggle, updateTargetUI,
  };
})();
