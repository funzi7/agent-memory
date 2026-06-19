# OptionsProfitTracker — Pending Device Tests

On-device verification owed (run on the real Android app; Hebrew UI area names):
- [ ] (FS1) CC assignment calculated P&L = $0: 'סגירת פוזיציה' on a Covered Call → 'הוקצה' → the bottom 'רווח/הפסד' shows $0 (not −commission); the 'Option P&L:' line and the wheel breakdown are unchanged.
- [ ] (FT1) Auto-expire at market close: a sold option past 16:00 ET on its expiration date auto-expires by ~03:00 Thailand (next day), and two options with the SAME expiration date both auto-expire together (not one-yes-one-no).
- [ ] (FT2) Feed migration after first cold start: the existing CSP-assignment row in 'פיד' shows $0 (matching 'פרטי פוזיציה'/'לוח שנה'/'דוחות'), and old expiry rows show the expiration date @ US market close (16:00 ET) instead of the app-open time.
