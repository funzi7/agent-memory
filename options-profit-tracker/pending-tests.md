# OptionsProfitTracker — Pending Device Tests

On-device verification owed (run on the real Android app; Hebrew UI area names):
- [ ] (FS1) CC assignment calculated P&L = $0: 'סגירת פוזיציה' on a Covered Call → 'הוקצה' → the bottom 'רווח/הפסד' shows $0 (not −commission); the 'Option P&L:' line and the wheel breakdown are unchanged.
- [ ] (FT1) Auto-expire at market close: a sold option past 16:00 ET on its expiration date auto-expires by ~03:00 Thailand (next day), and two options with the SAME expiration date both auto-expire together (not one-yes-one-no).
- [ ] (FT2) Feed migration after first cold start: the existing CSP-assignment row in 'פיד' shows $0 (matching 'פרטי פוזיציה'/'לוח שנה'/'דוחות'), and old expiry rows show the expiration date @ US market close (16:00 ET) instead of the app-open time.
- [ ] (FU1) Feed sign: in 'פיד', a gain shows a leading '+' (e.g. '+$1,859.00') and a loss a leading '-'; $0 rows show no sign. Colors (green gain / red loss) unchanged.
- [ ] (FU2) After this build's first cold start, the ASTX assignment row in 'פיד' shows the assignment date (morning 18.6), NOT the expiration date @ 16:00.
- [ ] (FV) After re-importing the Flex, each stock SELL appears in 'פיד' as a '<ticker> מכירת מניות' row with 'N מניות @ $price' and its realized P&L (e.g. MULL 22 @ $572.45 → +$2,437.62 green; the 3x 1-share @ $649.61 each appear SEPARATELY). Re-importing the same Flex does NOT create duplicates. Totals on dashboard/reports are NOT expected to include these yet (Phase 2).
- [ ] (FW) Create a MANUAL position and keep a draft, then run 'מחק וייבא': the manual position and the draft SURVIVE; only imported positions are replaced. The warning text now says manual + drafts are kept ('פוזיציות ידניות וטיוטות יישמרו').
- [ ] (FY) Start a 'סנכרון מלא (מחק + ייבוא)', then immediately switch to the 'ראשי'/dashboard tab while it runs. The import COMPLETES (no 'שגיאה נתפסה'/JobCancellationException); afterwards 'הון זמין' reflects the synced value, the 'רווח/הפסד מניות' card includes the latest sales (MULL ~$12,588 incl. the 19.6 sale), and STOCK_SOLD feed rows appear.
