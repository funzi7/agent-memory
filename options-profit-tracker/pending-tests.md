# OptionsProfitTracker — Pending Device Tests

> Living backlog — Claude Code appends each round's device tests here; Dima checks
> items off after testing; Claude (Desktop) translates outstanding items to Hebrew
> in chat on request. Newest round first. English with Hebrew on-screen area names in quotes.

## Group FR prime (2026-06-18)

- [ ] (FR1) Sync prune — sold-out ticker leaves the snapshot: hold a stock (e.g. via a held position that shows in "תזכורת CC" / portfolio value), then in IBKR fully sell it so the next Flex sync returns holdings WITHOUT that ticker. After the sync, the sold ticker should DISAPPEAR from the portfolio value, the "תזכורת CC" reminders, and the abnormal-move alerts. It should no longer linger.
- [ ] (FR1) Sync prune — still-held + open-position + manual tickers REMAIN: in the same sync, a ticker you still hold, a ticker you have an OPEN or draft position on (even if not in this sync's holdings), and a manually-added/overridden ticker (manual=true) must all SURVIVE the prune — only genuinely sold-out, non-manual tickers are removed.
- [ ] (FR1) Sync prune — option-only / partial sync does NOT wipe: run a sync that returns NO stock holdings (option-only). The snapshot must be left untouched (no tickers removed) — the prune only runs when this sync actually returned holdings.
- [ ] (FR2) CSP-assignment preview = $0 (not sold): open "סגירת פוזיציה" for a CSP, choose "הוקצה" (assignment) WITHOUT marking shares sold. The assignment summary card "Option P&L:" line must show $0, the footnote must explain the premium is folded into the cost basis, and the calculated P&L for the close must be $0 (no premium booked, no commission subtracted).
- [ ] (FR2) CSP-assignment preview WITH a sale: on the same screen mark the shares sold at a price. The calculated P&L should equal (sale price − (strike − premium/share)) × contracts × 100 minus commission — i.e. stock P&L measured against the premium-reduced effective basis, NOT the raw strike.
- [ ] (FR2) CC-assignment preview unchanged otherwise: a "הוקצה" Covered Call still shows the wheel breakdown; the "Option P&L:" line now reads $0 (which matches IBKR's option P&L on CC assignment).

## Group FQ prime (2026-06-18) — central realized P&L

- [ ] (FQ) Manually-assigned CSP, shares NOT sold → $0 everywhere: a CSP closed via "הוקצה" manually (no Flex import, no later stock sale) should show $0 realized in the "פיד", the reports ("דוח מס" and others), and the dashboard MTD / realized totals — not +premium.
- [ ] (FQ) CSP assignment WHERE shares were later sold → stock P&L on effective basis: realized P&L should equal (sale price − (strike − premium/share)) × contracts × 100 minus commission.
- [ ] (FQ) Flex-IMPORTED assignment unchanged: a CSP assignment from an IBKR Flex import (has ibkrRealizedPnl) still shows IBKR's value (typically $0 option P&L) — unchanged.
- [ ] (FQ) CC assignment + BTC/EXPIRED/ROLLED unchanged: a "הוקצה" Covered Call still shows $0 option P&L; positions closed via "פקע" (expired), BTC, or "רול" (rolled) show the same realized P&L as before in the "פיד" and dashboard totals.

## Group FP prime (2026-06-18) — feed timestamps + per-contract CC premium

- [ ] (FP1) Expired option shows the REAL expiry time in the "פיד": with an open sold option past its expiration date, open the app later in the day (evening Thailand time). The auto-expire "פיד" entry should be timestamped at the expiration date at US market close (16:00 ET), not at the time you opened the app.
- [ ] (FP1) Manual close timestamp in the "פיד": manually close a position with method "פקע" (expired) or "הוקצה" (assigned) choosing a past close date — the "פיד" entry's time should be that close date @ 16:00 ET. Then close another with an intraday method (BTC) — its "פיד" entry should still show the current time.
- [ ] (FP2) "תזכורת CC" per-contract dollar amount: on the dashboard "תזכורת CC" reminder, line 3 should show the premium per contract (≈ bid × 100) — e.g. a $0.57/share bid reads `CC ~$57.00 לחוזה`, not `~$0.57`. The "לחוזה" label and the (סטרייק … · פקיעה …) suffix are unchanged.
