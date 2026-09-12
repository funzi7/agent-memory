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
- [ ] (FZ) Run 'סנכרון מלא (מחק + ייבוא)' and switch to the 'ראשי' tab while it runs — afterwards the dashboard 'הון זמין' updates to the synced cash value (no longer stuck on the old manually-set $7k). Verify it matches the synced 'הון מוקצה' shown on the import screen.
- [ ] (GA) After a completed 'סנכרון מלא', the dashboard 'הון זמין' shows the synced cash value (matching 'הון מוקצה' on the import screen), NOT the old manually-set $7k. The Settings 'הון זמין' field no longer forces the manual value.
- [ ] (GB1) Open 'רווח/הפסד מניות', tap the MULL row — it expands to show MULL's individual sales (each with date, 'N מניות @ $price', and the realized ± amount). Tapping again collapses. With a specific month chip selected, only that month's sales show.
- [ ] (GB2) In the main feed ('פעילות'/dashboard activity list) AND the full activity screen, tap a 'מכירת מניות' (STOCK_SOLD) row — it navigates to the 'רווח/הפסד מניות' screen (previously tapping did nothing).
- [ ] (GB2) Tap a 'מכירת מניות' (STOCK_SOLD) row in the feed (dashboard activity list OR full activity screen) — it opens 'רווח/הפסד מניות' with THAT ticker already expanded and the exact tapped sale highlighted (subtle blue tint). Manually tapping another ticker drops the highlight. The dashboard compact 'ראה הכל' card still opens the screen with nothing pre-expanded.
- [ ] (GC) In 'רווח/הפסד מניות', the per-ticker table has a sortable header (טיקר | ממומש) matching the 'שווי תיק' page: tap a header to sort, tap again to flip asc/desc (active header blue with ▲/▼, idle ⇅); columns stay aligned under their headers; default = realized descending. The row still expands to the sale drill-down on tap, the chevron + GB2 highlight + month chips still work.
- [ ] (GD1) After importing a Flex with a short stock (e.g. -54), the 'שווי תיק' (PortfolioBreakdown) shows that ticker in the 'לא נכלל' section as '-54' with a 'שורט' badge and value '—' (not $0); the portfolio-value TOTAL is unchanged (short excluded). No P&L number changed. (GD2 will add the short's liability value + inverted P&L.)
- [ ] (GE) In the feed (dashboard activity list OR full activity screen), tap SEVERAL different 'מכירת מניות' (STOCK_SOLD) records — including non-most-recent ones and same-ticker/same-month ones: EACH opens 'רווח/הפסד מניות' with that ticker auto-expanded, the month chip set to that sale's month, and the exact tapped sale highlighted. Manually tapping another ticker or changing the month clears the highlight.
- [ ] (GD2) After re-importing a Flex with a flipped short (e.g. MULL -54, IBKR short avg 714.78): the SHORT_AVGCOST log shows ~714.78; in 'שווי תיק' MULL now appears in the MAIN holdings list (not 'לא נכלל') as '-54' + 'שורט' badge, value = (714.78 - current)*54 shown RED at current ~940 (loss), and it would turn GREEN if price drops below 714.78. Long rows unchanged; the portfolio total reflects the short's net P&L. (GD3 will split the 100-share assignment into 46 close + 54 short-open.)
- [ ] (GF1) Tap STOCK_SOLD feed rows for SEVERAL tickers/months (MULL, ASTX, PLUG — most-recent AND older): EACH opens 'רווח/הפסד מניות' with that ticker expanded, the month chip on that sale's month, and the exact sale highlighted. Manual ticker/month change clears the highlight.
- [ ] (GF2) Dashboard 'פוזיציות פתוחות' card shows a 'שורט' row for MULL -54 with its inverted P&L (RED at current ~940, would be GREEN below 714.78) — separate from 'טופ עולות/יורדות'. (openPositionsCount may not yet include it — known leftover.)
- [ ] (GF3) After re-import, the MULL assignment feed row reads '46 מניות' (closed portion), not 100/154; its realized stays ~$12,222. Other (non-flip) sales still show their full qty.
- [ ] (GG1) A short with <100 shares (e.g. MULL -54) appears in 'שווי תיק' under 'לא נכלל' (NOT the main 'מניות בתיק' list) showing '-54'+'שורט' and its inverted P&L (RED at ~940). A 100+ short would appear in the main list. The headline portfolio total is unchanged.
- [ ] (GG2) The dashboard '... פוזיציות פתוחות' count INCLUDES the MULL short (count goes up by 1 vs before). Options/longs count unchanged; a short ticker that also has an open option isn't double-counted.
- [ ] (GG3a) With ONLY a background auto-sync (no manual import), the MULL short still appears (-54) with the correct inverted P&L (avgCost ~714.78 from SHORT_AVGCOST bg-sync log) — shorts no longer require a manual import to show.
- [ ] (GH1) Tap a STOCK_SOLD feed row for a ticker NOT first in the sort (a smaller ticker) → 'רווח/הפסד מניות' scrolls DOWN so that ticker's row is visible with its drill-down open and the sale highlighted (not stuck at the top showing the header/total).
- [ ] (GH2) MULL -54 appears within 'טופ עולות/יורדות' by its daily price % (placed by that %), carrying a 'שורט' tag, and is NO LONGER shown as a separate −$ row above the movers.
- [ ] (GH3) The MULL assignment shows TWO feed rows — 'מכירת מניות' 46 (~$12,222 realized) AND 'פתיחת שורט (הקצאה)' 54 @ 690 (realized 0, non-clickable); 46+54=100; the realized P&L total is unchanged.
- [ ] (GI1) Tap a STOCK_SOLD feed record for a ticker near the BOTTOM of the sorted list → 'רווח/הפסד מניות' scrolls DOWN so that ticker's expanded, highlighted row is visible (not stuck at the top). Manual ticker/month change still works; no auto-scroll on manual taps.
- [ ] (GI2) The MULL 'פתיחת שורט (הקצאה)' feed row shows the proceeds (~$38,598, '@ 714.78 · התקבל $38,598') as NEUTRAL info (not green/red, no $0.00), and is NOT counted in any realized total. Re-importing upgrades an older $0/@690 row to show the proceeds.
- [ ] (GK1) Tap a STOCK_SOLD feed record for a ticker near the BOTTOM of the sort → 'רווח/הפסד מניות' scrolls so that ticker's expanded, highlighted row is visible (not stuck at top). The per-ticker table still reads as one card; manual taps don't auto-scroll.
- [ ] (GK2) MULL 'פתיחת שורט (הקצאה)' shows 'התקבל $38,598' (54 @ 714.78) neutral, not in any realized total; SHORT_OPEN_PROCEEDS log shows costBasisPrice≈714.78 used=rawXml.
- [ ] (GK3) Tapping the MULL 'פתיחת שורט (הקצאה)' feed row opens the 'שווי תיק' screen (MULL -54 + P&L), instead of doing nothing.
- [ ] (GL1) Tap a STOCK_SOLD record for a ticker LOW in the sort (e.g. PLUG) → 'רווח/הפסד מניות' scrolls so its expanded, highlighted row is visible; SR_SCROLL log shows idx >= 0.
- [ ] (GL2) MULL 'פתיחת שורט (הקצאה)' shows 'התקבל $38,598' (54 @ 714.78); SHORT_OPEN_PROCEEDS log shows costBasis≈714.78 (not $0).
- [ ] (GL3) Tapping the MULL 'פתיחת שורט (הקצאה)' row opens a DIALOG showing -54 שורט, entry 714.78, received $38,598, and the date — not the general 'שווי תיק' page (a 'פתח בשווי תיק' button still navigates there).

### 2026-06-20 GL4 (Claude Code, OPT bfdaf84) — device tests
- [ ] Tap a STOCK_SHORT_OPENED feed row (e.g. MULL "פתיחת שורט (הקצאה)") on BOTH the dashboard recent-activity card AND the full Activity Feed → opens the new "פוזיציית שורט" detail PAGE (not a dialog). Verify מחיר כניסה ≈714.78 (NOT 690), שווי כניסה/התקבל = |qty|×entry, מחיר נוכחי = live snapshot, and רווח/הפסד לא ממומש = (entry-current)×|qty| colored green when price<entry / red when price>entry.
- [ ] Tap "ASTX פקע והוקצה" → must NOT show "פוזיציה לא נמצאה"; it should open the ASTX ticker detail (position was removed on re-import). Check Logcat FEED_CLICK "resolve positionId=.. gone=true".
- [ ] Regression: tap a same-day expiry/assignment record whose position STILL exists → still opens its position page (gone=false). STOCK_SOLD rows still deep-link to stock-realized. Other feed rows unchanged.

### 2026-06-20 GL5 Codex (OPT fb8b538) — device test
- [ ] Re-import MULL and verify FLIP_DBG shows netStockPos=-54, isFlip=true, shortOpenQty=54; SHORT_OPEN_PROCEEDS fires with costBasis about 714.78 and proceeds about $38,598; STOCK_SHORT_OPENED exists with amount=null and all realized totals are unchanged.

- [ ] 2026-06-20 Device — re-import a long-to-short assignment and verify STOCK_SHORT_OPENED reads visually as 54 מניות שורט @ $714.78 · התקבל $38,598, with no event amount and unchanged realized totals (OPT d583a7e).

### 2026-06-20 GL6 (Claude Code, OPT 4c9ee9a) — device test
- [ ] Tap "ASTX פקע והוקצה" (and "MULL פקעה והוקצה") on BOTH the dashboard recent-activity card AND the full Activity Feed → must open the ASTX/MULL position page (ClosePositionScreen / "עריכת סגירה"), NOT the ticker page and NOT a "פוזיציה לא נמצאה" toast. Check Logcat FEED_CLICK "ASTX-case eventId=.. positionId=.. inIds=.. idsSize=.. resolved=.." — resolved should be a real id.
- [ ] If a tickers position was TRULY removed (no row in פוזיציות) → tapping its assignment record opens the ticker detail page (graceful fallback), still never a dead toast.
- [ ] Regression: working records (valid stored positionId, e.g. recent opens/closes) still open their exact position page; drafts still open the edit screen; STOCK_SOLD still deep-links to stock-realized; STOCK_SHORT_OPENED still opens the short detail page.

### 2026-06-21 GL7 (Claude Code, OPT ab3e00e) — device test
- [ ] On the dashboard "יעד חודשי" card, in a month that HAS stock-sale realized (e.g. MULL/other STK sales this month), confirm a small grey subline "ממומש מניות: +$X" (or -$X) appears beneath "ממומש החודש", colored green for gains / red for losses, numbers LTR (sign on the left, no RTL reversal).
- [ ] Confirm the value equals that month's total in the "רווח/הפסד מניות" screen for the current month (sum across tickers).
- [ ] Confirm a month with NO stock sales shows NO subline (not "$0.00"). Confirm the options "ממומש החודש" figure, the target number, the percent pill, and the progress bar are all UNCHANGED.

- [ ] 2026-06-21 Device — close/assign a CC or let it pass 16:00 ET, remove the ticker from current holdings, and verify it disappears immediately from the CC reminder. Confirm CC_REMINDER_FILTER reports the exclusion reason; then verify a genuinely current 100+ share snapshot/manual override still produces an uncovered-share reminder when appropriate (OPT f45e1f7).

### 2026-06-21 GL8 (Claude Code, OPT 48ddf3b) — device tests
- [ ] Dashboard "יעד חודשי" card: in a month WITH stock-sale realized, confirm a bold "סה"כ החודש: ±$X" line appears beneath the GL7 "ממומש מניות" subline, equal to ("ממומש החודש" options figure) + (the stock subline value), colored green/red by sign, numbers LTR. Confirm the target number, percent pill, and progress bar are UNCHANGED.
- [ ] Calendar "לוח שנה": for a month with stock sales, confirm under the month-totals row (צפוי/ממומש/יעד) two centered lines appear — "ממומש מניות (חודש): ±$X" and "סה"כ החודש (כולל מניות): ±$Y" with Y = the month's options ממומש + stock. Navigate months (swipe / arrows): the stock + combined lines must follow the displayed month and match that month's value in the "רווח/הפסד מניות" screen.
- [ ] Both screens: a month with NO stock sales shows NEITHER the stock line NOR the combined total (no "$0.00" rows); options figures and all date logic unchanged.

- [ ] 2026-06-21 Device — on דוחות, select a month and a year/all-years containing stock sales: verify ממומש מניות equals the matching summed value in רווח/הפסד מניות, סהכ משולב equals options+stock, signs/numbers render LTR and green/red correctly, and both extra figures disappear for a zero-stock period (OPT f561eeb).

### 2026-06-21 GL9 (Claude Code, OPT d9c94fd) — device test
- [ ] Open "לוח שנה" and swipe/arrow through several months including a 5-week month (e.g. Feb) and a 6-week month, and months WITH vs WITHOUT stock-sale realized. The weekday header row and the day grid must NOT shift vertically — only the cell contents change. The grid always shows 6 week-rows (last row empty for short months).
- [ ] "היום" appears as a small AccentBlue outlined chip immediately to the LEFT of the month name (RTL) when viewing any non-current month; tapping it jumps to the current month/day. On the current month the chip is hidden and the month name + grid sit in the SAME position as when it was shown (no jump).
- [ ] Confirm the realized/stock/combined figures and the per-week "שבוע" totals still show correct values (just reserved-but-invisible when zero); no "$0.00" text is visible.

- [ ] 2026-06-21 Device — reopen דוחות after a cold start, select June and then 2026/all-years, and confirm ממומש מניות appears with the same signed value as dashboard/calendar, סהכ משולב equals options+stock, and Logcat REPORTS_STOCK shows the matching period key and non-zero stockRealized; a zero-stock month must hide both added rows (OPT 65014e2).

### 2026-06-21 GL10 (Claude Code, OPT 9da346f) — device test
- [ ] Calendar "לוח שנה": navigate between a month WITH stock-sale realized (shows "ממומש מניות" + "סה"כ החודש" lines, incl. a large combined value) and a month WITHOUT — the top summary card height must be IDENTICAL (the grid/weekday row below must not move). Verify a big combined number does NOT wrap to a 2nd line.
- [ ] Navigate across months with different-length Hebrew names (e.g. מאי vs ספטמבר vs אוקטובר): the prev/next arrows and the "היום" chip must stay in the SAME horizontal positions; only the centered month name changes within its fixed slot. Entering/leaving the current month (chip shows/hides) must not move the name or arrows either.
- [ ] The "היום" chip still works (jumps to current month) and the realized/stock/combined figures are still correct.

- [ ] 2026-06-21 Device — edit a short PUT/CSP at price ~25, strike 24, IV 122%: risk must be cautionary (not "סטרייק רחוק"), intel must be yellow/cautious (not "התנאים תומכים בהמשך החזקה"), and RISK_DBG must show bufferPct~4, the entered IV, a larger expMovePct, and MEDIUM/HIGH. Regression: price 100/strike 80/IV 20% remains VERY_LOW/far; an ITM PUT remains VERY_HIGH/red (OPT 24c50b6).

### 2026-06-21 Carry-forward (Claude Code) — calendar progress-bar jump + risk IV-buffer device test
- [ ] Calendar "לוח שנה": navigate between a month that HAS a target (progress bar shown, monthlyTarget>0) and a month that has NO target (bar hidden) — the layout must NOT shift vertically. (Currently it STILL jumps because the bar is conditional; fix = reserve the bar's height in no-bar months via the alpha-reserved/maxLines approach used for the summary-card stock lines. The "היום" chip + summary card already stay put.)
- [ ] Risk/intel IV-buffer (CODEX 24c50b6) — not yet device-verified (no open PUT at the time). On דוחות/AddPosition: a PUT at price≈25 / strike≈24 / IV≈122% → risk HIGH/caution AND intel cautionary (NOT "התנאים תומכים בהמשך החזקה"); a genuinely-far low-IV case (price 100 / strike 80 / IV 20%) → still far/VERY_LOW. Confirm RISK_DBG shows bufferPct/IV/expMovePct/band/verdict.

### 2026-07-04 Consolidated device tests, rounds GM→R2 (statuses per owner reports; NO regression tests per owner rule)
CONFIRMED WORKING on device:
- [x] GM2 sort persistence in "רווח/הפסד מניות": survives re-entry and cold start; feed deep-link still jumps/expands/highlights under any saved sort.
- [x] R2 navigation: tapping an inner sale row in the drill-down opens the actual position page (open OR closed); ticker with only a short opens the short page.
FAILED on the owner's current device build — retest ONLY after pulling latest main + full install (adb install -r):
- [ ] R1a: a Covered Put row in "פוזיציות פתוחות" shows the assignment-probability readout (percent + bar + risk color), wording speaks of buy-to-cover, breakeven labeled "מחיר כיסוי אפקטיבי".
- [ ] R1b: numbers sit in place inside Hebrew feed titles ("100 מניות", not "מניות 100") — check a short-open row and a stock-sale row.
- [ ] GP1: after dismissing a banner with ✕, re-entering the dashboard does NOT bring it back while the worker cache is unchanged. (Owner reports it still returns every entry — under diagnosis, see roadmap.)
PENDING (not yet testable or not yet run):
- [ ] GN1: with 2+ positions expiring within 7 days — one banner per alert; ✕ closes only that banner (needs real expiring positions).
- [ ] GN2: "רווח/הפסד מניות" opens on the current month; falls back to the newest month with data when the current month is empty; a feed deep-link overrides to the tapped sale's month.
- [ ] GO BootReceiver: after a FULL apk install, reboot the phone, wait ~2 minutes, open the app — data refreshed without manual sync (auto-sync enabled).
- [ ] GP2: CoveredPutDetailScreen shows an assignment-probability card (percent, bar, risk color, Hebrew risk label) next to the economics block.
- [ ] R2-restore: pressing back from the position page returns to "רווח/הפסד מניות" with the same expanded ticker and the same scroll spot (exact current symptom being clarified with owner).
- [ ] Covered Put core (8d8907b): "פוט מכוסה" appears in the strategy picker; picking a shorted ticker auto-detects short shares + entry price; contracts exceeding the short show a coverage warning; the detail screen shows status / covered / uncovered / strike / expiry / multiplier / premium / effective cover price / upside break-even / max profit / short P&L / option P&L / combined P&L / assignment simulation / unlimited-upside-risk warning; MULL fixture to the cent: premium 1,820.00, effective cover 23.60, upside break-even 29.9912, max profit 6,488.56; on a real assignment the short SHRINKS (no new long position) and only assigned contracts are marked; OTM expiry realizes the full premium with the short unchanged.

### 2026-08-19 S1 device-test checklist — phone build/install loop + reboot crash (NEW; no regression tests per owner rule)
Prerequisite for every item: a paired ADB device. One-time: Android → Developer options → Wireless debugging → Pair device with pairing code, then `adb pair <IP>:<PORT>` (enter code) + `adb connect <IP>:<PORT>`; `adb devices -l` must show `device`. See PHONE_BUILD.md.
- [ ] SIGNING: `adb shell dumpsys package com.dima.optionstracker | grep -iA2 signing` (or pull + `apksigner verify --print-certs`) — compare its SHA-1 to the phone APK's `0EB514FE3213157080D3FA8269A74E83E34EBD08`. If they DIFFER, copy the computer's `~/.android/debug.keystore` onto the phone, rebuild, and confirm the SHA-1 now matches BEFORE `install -r` (do NOT uninstall).
- [ ] INSTALL (update, data-preserving): `adb install -r app/build/outputs/apk/debug/app-debug.apk` succeeds; app data intact (positions still present); `adb shell pm path com.dima.optionstracker` resolves. If `INSTALL_FAILED_UPDATE_INCOMPATIBLE` → do the SIGNING step first.
- [ ] LAUNCH from ADB: `adb shell monkey -p com.dima.optionstracker -c android.intent.category.LAUNCHER 1` opens the dashboard with data (no empty/crash); `adb logcat --pid=$(adb shell pidof -s com.dima.optionstracker)` shows no FATAL.
- [ ] REBOOT CRASH REPRO/CONFIRM (real reboot; capture EARLY): after this full APK install (not Apply Changes), `adb reboot`, wait ~2 min, then `adb logcat -b all -d > /tmp/postboot.log` and grep for `FATAL EXCEPTION|IllegalStateException|downgrade database|migration from 30 to 31|BootReceiver|FlexSyncWorker|Room`. Also `adb shell dumpsys package com.dima.optionstracker | grep -i version` before vs after reboot (versionCode must not revert). EXPECTED with the S1 full-APK install: NO downgrade crash, app opens with data. If it still crashes, capture the exact `Can't downgrade database from version 31 to 30` / `migration from 30 to 31 not found` line for the owner.

### 2026-08-19 S1-cont device-test status update (Claude Code; no regression tests per owner rule)
- [x] ADB self-connection: DONE — 172.20.10.3:42677 state "device" (SM-S938B), plain adb and fakeroot adb both see it; read-only pm path / dumpsys / adb pull work from the phone.
- [x] SIGNING comparison: DONE — result MISMATCH. Installed com.dima.optionstracker SHA-1 5d3d855c6c6c397f817df2bd0c62f16f940b1551 (SHA-256 9e5307e1344917f0cdc495c5cc04a80d23a92c5965c779b6efb0faa1135b8221) VS new app-debug.apk SHA-1 0eb514fe3213157080d3fa8269a74e83e34ebd08 (SHA-256 74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4). Both CN=Android Debug, different keystores. install -r NOT attempted.
- [ ] INSTALL (blocked): copy the computer's ORIGINAL debug.keystore to /root/.android/debug.keystore (standard source C:\Users\DELL\.android\debug.keystore -- STANDARD location, not verified on that box), rebuild assembleDebug, confirm new-APK SHA-1 == 5d3d855c... , then ANDROID_NO_USE_FWMARK_CLIENT=1 fakeroot adb install -r app/build/outputs/apk/debug/app-debug.apk. Do NOT uninstall / clear data.
- [ ] LAUNCH from ADB + logcat: retest only AFTER a successful install -r (currently blocked by the mismatch above).
- [ ] REBOOT repro: still owner-gated; NOT performed in S1-cont.

### 2026-09-06 S1-final device-test status (Claude Code; no regression tests per owner rule) — OPT 7225b7af16c183de00a9f064ead03a01ad6af1d3
- [x] SIGNING: RESOLVED — the original computer debug.keystore is now at /root/.android/debug.keystore (keytool SHA-1 5D:3D:85:5C:6C:6C:39:7F:81:7D:F2:BD:0C:62:F1:6F:94:0B:15:51); the new app-debug.apk signer SHA-1 5d3d855c6c6c397f817df2bd0c62f16f940b1551 == the freshly pulled installed base.apk signer (SHA-256 9e5307e1… equal too). The earlier phone keystore 0EB514FE… is retired (backup file only).
- [x] INSTALL (update, data-preserving): `adb install -r app/build/outputs/apk/debug/app-debug.apk` → Success; `pm path` resolves to the new codePath (~~XqWGcjjEXOIXuMfu3-NZiw==); firstInstallTime unchanged (2026-04-22 22:53:57); Room DB / DataStore / cache files identical in size + mtime before/after; installed base.apk byte-identical to the build (SHA-256 8e94372f…).
- [x] LAUNCH from ADB: `monkey … LAUNCHER 1` → "Displayed …MainActivity +1s57ms", pid stable 60 s, second warm launch OK; app-PID logcat shows no FATAL / AndroidRuntime / IllegalStateException / Room / SQLite / downgrade / migration error; workers finished SUCCESS; dashboard loaded positions from the DB.
- [ ] OWNER VISUAL ACCEPTANCE (REQUIRED before S1-final can be called passed): open "מעקב אופציות" on the phone and confirm ALL SIX: (1) opens normally and stays open; (2) dashboard populated, not empty; (3) existing positions still present; (4) history / feed / calendar / reports still present; (5) settings + data not reset to a fresh-install state; (6) no crash while navigating normally. Could not be collected in the S1-final session (interactive prompt unavailable). If ANY item fails → release blocker; do NOT uninstall/clear; capture `adb logcat -d --pid=$(adb shell pidof -s com.dima.optionstracker)`.
- [ ] REBOOT CRASH REPRO/CONFIRM: still owner-gated, NOT performed. Now meaningful because a FULL APK is installed: `adb reboot`, wait ~2 min, `adb logcat -b all -d > /tmp/postboot.log`, grep FATAL / IllegalStateException / downgrade / "migration from" / BootReceiver / FlexSyncWorker / Room; `dumpsys package com.dima.optionstracker | grep -iE 'versionCode|codePath'` must still show versionCode 1 / codePath ~~XqWGcjjEXOIXuMfu3-NZiw==. EXPECTED: no downgrade crash, app opens with data.
- NOTE: the 2026-07-04 "FAILED on the owner's current device build — retest ONLY after pulling latest main + full install" items (R1a, R1b, GP1) and the PENDING items (GN1, GN2, GO BootReceiver, GP2, R2-restore, Covered Put core) are now TESTABLE — the phone runs a full `install -r` of current main (app sources = 5445921) as of 2026-09-06. Their statuses stay unchanged until the owner reports.
- SUPERSEDED: the 2026-08-19 S1 "SIGNING" item and the S1-cont "INSTALL (blocked)" / "LAUNCH from ADB + logcat: retest only AFTER a successful install -r" items above are superseded by this block (kept for history).


### 2026-09-07 S2 device-test status (Claude Code; OPT 1ab4c824c4c0c0d087ed4d3fde851968e1cf4493; PR #19 OPEN, needs-owner) — executed on the real device
DONE by the agent on the device (build installed with `install -r`, signer gate passed, data intact):
- [x] Install/launch/runtime: 3 in-place installs, firstInstallTime unchanged, DB/DataStore intact, 0 FATAL / Room / SQLite / migration errors.
- [x] PNL log storm: OLD build 63,006 PNL_TRACE + 2,966 PnLDebug + 2,319 PNL_DBG per dashboard load → S2 build **0 / 0 / 0**.
- [x] Real IBKR sync + import (790 trades / 265 cycles) run 3x non-destructively; final run updated=0 inserted=0 unchanged=261 ambiguous=3 noMatch=0 (converged, idempotent).
- [x] SOFI: feed row "SOFI נסגר BTC • −$26.88" at 05.09 02:48 (was "הוקצה $0.00"); edit screen shows close 0.24 / close commission 8.09 / P&L −$26.88 and "שעת סגירה 05.09.26 02:48:02 — שעת ביצוע בפועל (IBKR)".
- [x] Commission signs verified against IBKR fifoPnlRealized (SPCH rebates, SOFI charges).
- [x] "מה קורה היום בשוק" renders exactly before "פוזיציות פתוחות", same heading weight, plain Hebrew, no flicker.
- [x] CC reminder: owner-approved three lines, money LTR ("פרמיה משוערת לחוזה: $46.00"), SOFI/BTCI/RKLX/NOK/MULL/SPCH/SOXL eligible with a current snapshot.
OWNER visual checks still owed (the agent cannot judge these):
- [ ] Open "עריכת סגירה" on SPCH and one more position and compare EVERY figure with the IBKR app: opening/closing premium, both commissions, realized P&L, quantity, close date + time.
- [ ] Covered Put MULL: assignment option P&L $0.00, "מחיר כיסוי אפקטיבי (כולל פרמיה)" 23.60, and NO separate option income for it in calendar / monthly target / reports.
- [ ] CALL probability: an obviously OTM Covered Call shows a few percent, not ~96%.
- [ ] CC yield tier on a new Covered Call uses the stock cost basis (≈2.22% / ≈26% for premium 0.54 / cost 24.28 / DTE 31), not premium ÷ strike.
- [ ] Three contracts stay AMBIGUOUS by design and were never overwritten (BTCI PUT 33 qty 2, IRE PUT 6 qty 8, SPCH CALL 10 qty 18 — several manual rows opened within days of each other). Decide whether to correct those manually.
- [ ] The reconciliation inserted ONE missing row (BKSY 25C buy-to-close, +$171.95) that the app had lost — confirm it belongs.
- [ ] Reboot: STILL PENDING, not performed.
- [ ] (review round) A ticker whose CC was ASSIGNED must NOT reappear in the CC reminder after a later price-only sync (the ghost guard now keys on `sharesUpdatedAt`); a ticker whose CC merely EXPIRED or was bought back must still appear.
- [ ] (review round) Owner decision: `expectedProfitAtExpiration` still projects the full premium for an OPEN covered put while an assignment realizes $0 on the option — make the projection state-aware (needs approval, P&L-locked) or leave as is.

### 2026-09-07 S2.1 device-test status (Claude Code; OPT e91488b; PR #19 OPEN, needs-owner) — executed on the real device
DONE by the agent on the device (install -r, signer gate passed 3 ways, data intact, no reboot):
- [x] 4 full non-destructive IBKR syncs + imports (790 trades / 265 cycles). Every run: updated=0 inserted=0 unchanged=261 ambiguous=3 noMatch=0 (idempotent).
- [x] Financial audit on the live feed, identical on all 4 runs: `IBKR_AUDIT: cycles=265 closed=259 unique=256 ambiguous=3 unmatched=0 | mismatches realized=0 premium=0 commission=0 qty=0 timestamp=0 maxRealizedDelta=0c | verdict=CLEAN` — **zero final-realized divergence across all 256 uniquely matched broker cycles**.
- [x] All three ambiguous contracts logged with the new self-explaining reason (cycle_split_across_N_rows_qty_sum_matches) and NOT overwritten.
- [x] Market brief on a REAL holiday (today was Labor Day, Mon 2026-09-07 NY): "השוק בארה״ב סגור היום — יום העבודה. אין מסחר." — named holiday, no roll-call line, no "(+N)", old "(סוף שבוע או חג)" hedge gone, no movers on the closed day, only the one relevant ticker (SOXL 127C 09.09), badge "סגור" + countdown "15 שעות לפתיחה" consistent with the same session model.
- [x] Privacy: 14 logcat lines carrying accountId/account number + 1 raw <FlexQueryResponse> BEFORE → 0 of everything AFTER (account number, accountId, raw XML, apikey, owner email, owner address), same device, same feed.
- [x] Stability: 0 FATAL, 0 Room/SQLite/migration errors, PNL log storm still 0/0/0, firstInstallTime unchanged across 3 in-place installs.
OWNER visual checks still owed (the agent cannot judge these):
- [ ] Open an OPEN Covered Put (MULL) and confirm the projected profit is now $0 when the stock is at or below the strike, and the full premium only when it is above. Previously it always showed the full premium.
- [ ] Open a CLOSED Covered Put and confirm the new "רווח/הפסד ממומש — אופציה" card shows the IBKR figure with the source line, and that the live "רווח/הפסד פתוח" card no longer appears for it.
- [ ] Open "עריכת סגירה" on a broker-reconciled closed position: the headline must show the IBKR figure with the line "מ-IBKR (הברוקר הוא המקור הקובע)" and must match the dashboard / calendar / reports for the same row.
- [ ] Tax report (דוח מס): the realized total, the monthly table and the tax estimate must now match the dashboard MTD for the same months. This figure is also SAVED as the loss carry-forward, so an old wrong value may still be stored from before this build.
- [ ] Tax CSV export: the RealizedPnL column must now equal the IBKR_PnL column on every reconciled row.
- [ ] Add Position → the monthly income card ("פוזיציות קיימות") and the "💡 חסר $Y ליעד" suggestions must match the dashboard MTD.
- [ ] Add Position → "היסטוריית <TICKER>": a spread where only ONE leg was broker-matched must show the combined P&L, not the matched leg alone.
- [ ] Market brief on a normal TRADING day: check the session line at four moments — before 04:00 ET, in pre-market, during regular hours, and after 16:00 ET — and confirm movers only appear once the bell has rung and switch to past tense afterwards.
- [ ] Decide the three S2.1 owner questions (buy-to-cover feed rows; how to correct the three split cycles; whether to strengthen the feed fingerprint with tradeID/ibExecID). See cc-latest.md "Left for the owner to decide".
- [ ] Reboot: STILL PENDING, not performed (explicitly forbidden this task).

### 2026-09-07 S2.1 review round (Claude Code; OPT 9500709) — extra owner checks created by the self-review fixes
- [ ] Covered Call premium banner: on a ticker where the holding is NOT contracts x 100 (e.g. 500 shares, sell 1 call), the yield and tier must now match the per-share figure (premium / cost basis), not a fraction of it. Previously such trades were mis-tiered.
- [ ] Commission on any position whose IBKR fill crossed zero (a single buy that closed a short and opened a long): the open + close commissions should now sum to the ONE fill's commission, not twice it. The device import corrected SPCH 13C from 6.83 to 1.37 on the open side.
- [ ] Tax report: the "הפסד מועבר משנה קודמת" line may still show a stale value saved by an older build. Open the tax screen for the PREVIOUS year once so it rewrites the carry-forward with the corrected figure, then re-check the current year.
- [ ] Edit a broker-reconciled closed position and change the close price: the P&L must now follow the edit (the broker value is dropped on an explicit edit) instead of staying frozen.
- [ ] Partially close a broker-reconciled position: the two resulting rows must NOT both show the full broker P&L; each should show its own calculated figure until the next IBKR sync.
- [ ] Oversized Covered Put (more puts than short shares): the assignment simulation must now show option income on the uncovered shares rather than $0, and the combined figure must equal short + option.
- [ ] Dashboard: leave the app open across 16:00 ET on a trading day. The session badge, the countdown and the market brief must all switch together within about a minute, instead of the brief changing while the badge stays put.
- [ ] Market brief before any stock sync has run (or with a cleared price snapshot): it must say prices are not available yet, never "אין תנועות חריגות היום".
- [ ] Decide the two NEW security items in cc-latest.md ("Left for the owner to decide" 4 and 5): cleartext credentials in the daily external-storage backup, and allowBackup with no extraction rules.

### 2026-09-09 S2.2 device-test status (Claude Code; OPT 4935ba6; PR #19 OPEN, needs-owner) — executed on the real device
DONE by the agent on the device (install -r, signer gate passed, data intact, no reboot):
- [x] Feed: the SPCH strike-12 row was repaired in place — `FEED_FIX: re-homed partial-close event 1026 from OPEN 3554 to slice 3556 (SPCH 10/18)`. It now reads "SPCH נסגר חלקית • ⁨10⁩ מתוך ⁨18⁩ חוזים • Strike 12.0 • −$112.17" at 09.09 03:00 (= the CLOSE date's 16:00 ET, was the EXPIRY's). One row only, no duplicate; next cold start reported `rehomed=0` (idempotent).
- [x] CC reminder: `CC_REMIND: ticker=SPCH snapshot=800 total=800 openCC=800 uncovered=0` → excluded. SOXL still correctly included at 100 uncovered shares (its CC expired that day). ASTX/BBAI still excluded as ghosts.
- [x] Calendar preserved: 2026-09-08 = 87.51 + (−112.17) = −24.66 → displays −25, unchanged.
- [x] Market brief: 0 occurrences of "אין הסבר זמין" in the UI tree; the card shows only the session line; the raw "טופ עולות/יורדות" card still lists every mover.
- [x] Reconciliation converged over two non-destructive imports: `updated=0 inserted=0 unchanged=262 ambiguous=3 noMatch=1`; audit mismatches realized/premium/commission/qty/timestamp all 0.
- [x] An open-cycle defect found and fixed during QA: `qty 18 → 8 (broker 18 − 10 closed-in-app) comm 12.37 → 5.5`.
OWNER checks still owed (the agent cannot judge or resolve these):
- [ ] **SPCH strike 12 — check the IBKR app.** The Flex statement reports the position as **18 contracts OPEN** with **800 shares**, and contains the 1,000-share stock sale but **no buy-to-close for the 10 option contracts**. The app shows 10 closed + 8 open because that close was recorded in the app on 2026-09-08. If the buy-to-close never actually executed, the real position is 18 short calls against 800 shares (1,000 shares' worth naked). Until this is settled the slice keeps `ibkrRealizedPnl = NULL`, so −$112.17 is the app's own calculation and the feed timestamp stays a 16:00 ET settle rather than a real fill time.
- [ ] Market brief, POSITIVE path: on a day when one of your tickers moves ≥3% AND has a same-day headline, confirm the card lists it with the headline underneath. Not observable during the S2.2 session — no ticker met both conditions. The negative path was proven live: `mover=NOK pct=3.3 news=5 newsToday=0 → NONE_omitted_from_brief` (five real Finnhub items fetched, none dated today, correctly unused).
- [ ] Decide whether the thin Finnhub coverage is acceptable: `company-news` returned 0 items for every leveraged/thinly-covered ticker in the portfolio (MULL, MVLL, ASTX, RKLX, NEBX, TSLL, SNXX, WDCX, SOXL) and 5 for NOK, so in practice this card will often list no movers at all.
- [ ] Partially close a position through "סגירת פוזיציה" and confirm the new feed row says "נסגר חלקית" with "N מתוך M חוזים" and the slice's own P&L — not a full close, not $0.00.
- [ ] Reboot: STILL PENDING, not performed (explicitly forbidden this task).

## S2.3 ADDENDUM (2026-09-10) — OWNER checks the agent could not perform

The phone's keyguard is SECURE (`dumpsys trust` → `deviceLocked=1`), so NO UI navigation or screenshot
QA was possible this session. Everything below needs the owner to unlock the phone and look.

- [ ] **משיכה line (A).** Open the dashboard after the NEXT daily Flex snapshot lands. If a withdrawal
      happened this month, `משיכה: $X` must appear DIRECTLY BELOW `ממומש מניות`, and `סה״כ החודש`, the
      target number and the progress bar must be UNCHANGED by it. If no withdrawal happened, the line
      must be absent — not `$0.00`. Cross-check the figure against IBKR's own Deposits & Withdrawals
      report for the month.
- [ ] **The Flex query must include the Cash Transactions section.** Without it the figure is always
      zero and the line stays hidden — by design, never guessed. Worth confirming once in the query
      config. If the query config is ever changed (transactionID added, date format, level of detail),
      run a FULL re-sync once — that clears the side table so the same movements cannot be stored
      twice under new keys.
- [ ] **Put ranking (B).** Open "IV גבוה בתיק" during US market hours on a day something is red. The
      new section "פוטים לפי פרמיה / בטחונות" must appear BELOW the IV list (which must be unchanged).
      Check: no strike above the current price; no expiry today or tomorrow; every row shows either
      (BID) or (ESTIMATE), and no (ESTIMATE) row sits above a (BID) row. Tap one — the new-position
      screen must open as a CSP with that ticker, strike, premium, EXPIRY and 1 contract. **Please
      check the expiry especially**: it was a day early before the fix round.
- [ ] Outside market hours the same section must say the regular session has not opened, and must NOT
      rank yesterday's chain.
- [ ] **Watchlist (C).** Enter the watchlist, leave, re-enter: prices must be there IMMEDIATELY, not
      after a delay and never blank. Turn Wi-Fi off and pull-to-refresh: the prices must STAY (a failed
      refresh may not erase them). Tap a row — the new-position screen must open with that price
      already in the price field.
- [ ] **Market brief (D).** The card must show three headings — מצב השוק / מה קורה בטיקרים שלך /
      מה צפוי בהמשך היום — with index moves and a plain-Hebrew sentence about the day under the first,
      even on a day your own tickers are quiet. Every ticker listed as a mover must have a reason
      printed somewhere below (a headline, a same-industry co-movement, or the single "יורדות יחד עם
      השוק הרחב" line). If you ever see a mover named with no reason at all, that is a defect.
- [ ] Confirm the sector line, when it appears, names OTHER tickers of yours in the same industry —
      never the ticker explaining itself.
- [ ] Reboot: STILL NOT PERFORMED (forbidden in this task and the two before it).

## S2.3 FINAL ADDENDUM (2026-09-10) — owner-gated checks

Device QA WAS possible this round (the phone was unlocked), so these are the items that still need a
human, not the whole list. What was already verified on screen is in `cc-latest.md`.

- [ ] **CC premium during the REGULAR session (the one that matters).** Open the dashboard between
      09:30 and 16:00 ET. For a ticker with 100+ uncovered shares the reminder must show
      `ביד נוכחי לחוזה $X` with a real strike and expiry. Check that `$X` is plausible against a real
      option chain for that exact contract, and that it is roughly **100 ×** the per-share bid you see
      in a broker — 0.42/share must read $42.00, never $0.42 and never $4,200. If the number is not
      credible, capture the ticker/strike/expiry and say so: the whole point of this round is that a
      wrong number must never be printed confidently.
- [ ] Leave the app open for 15 minutes during the session: the premium must be allowed to CHANGE
      (the 10-minute TTL), not sit frozen the way it did all day before.
- [ ] Outside the session (evening, weekend) the same card must say either
      `ביד אחרון שנצפה לחוזה $X` with an age, or `אין כרגע ציטוט אמין לחוזה.` plus your own last sold
      premium. It must NOT say `ביד נוכחי` outside 09:30–16:00 ET.
- [ ] **Market brief in PRE_MARKET (04:00–09:30 ET) and AFTER_HOURS (16:00–20:00 ET).** The card must
      describe the CURRENT session with live numbers. The sentence
      `המחירים המוצגים הם מנעילת המסחר הקודמת` must never appear in pre-market again. On a Saturday or
      an NYSE holiday it must instead give the exact closed-day reason.
- [ ] **Put preview on the dashboard during market hours on a red day.** The `🔥 IV גבוה` card must
      show BOTH sections, with at most three put rows. Open `ראה הכל` and confirm those three rows are
      **the top three of the full list, in the same order, with the same numbers** — if the dashboard
      and the full screen ever disagree, that is the "second formula" defect and is a bug.
- [ ] Tap a dashboard put row: it must open a CSP prefilled with that ticker, strike, premium, EXPIRY
      and 1 contract — the same as tapping the row on the full screen.
- [ ] Reboot: STILL NOT PERFORMED (forbidden in this task and the three before it).
- [ ] **`פרמיה אחרונה שמכרת` date (fixed after the screenshots were taken, NOT re-photographed).**
      The phone re-locked before the fixed build could be photographed. On a ticker whose last CC was
      sold on one day and bought back on another, the date next to the premium must be the day you
      SOLD it, not the day you closed it. RKLX 0.42 and SPCH 0.30 were both sold 2026-09-08 and bought
      back 2026-09-09; the card used to say `09.09.26` for both and must now say `08.09.26`.

## S2.3 FINAL ADDENDUM — added after the second fallback review (2026-09-10)

- [ ] **Benchmark row after the bell (16:00–20:00 ET) and in the evening.** The four indices must
      show the DAY's move, not the post-market tick. Cross-check one of them against any finance
      site: if the app says +0.0 % on a day the index closed −1.8 %, the `dayPrevious` fix has
      regressed. The label there reads `מדדים מובילים — סיכום היום:` (no longer "בנעילה").
- [ ] **The known gap beside it:** in that same window your own tickers will still show ≈0.0 % and
      may vanish from the movers list, because only the INDEX row was corrected this round. That is
      expected and logged in `roadmap.md` — please confirm you are happy to leave it until its own
      round rather than treat it as a new bug.
- [ ] **CC card left open across 16:00 ET.** Open the dashboard before the close and leave the app
      in the foreground. Within ~30 s of 16:00 the premium line must stop saying `ביד נוכחי לחוזה`
      and switch to `ביד אחרון שנצפה לחוזה` with an age. If it still says "current" at 17:00, the
      re-derivation regressed.
- [ ] **Withdrawal history across an id-shape change.** The store is on `ID_SHAPE = v3`. After the
      NEXT daily sync, check that `משיכה:` for EVERY month you have history for is unchanged — not
      just the current one. If an older month drops to zero or shrinks, the replacement is deleting
      rows the payload does not re-supply. (Fixed twice this round; worth one real confirmation.)

### 2026-09-10 S2.3 physical-QA addendum — device test status (Claude Code; OPT 5d4eca6; PR #19 OPEN, needs-owner)
Executed on the real device (SM-S938B, 192.168.1.118:37211, `install -r`, firstInstallTime 2026-04-22 unchanged, no uninstall / no pm clear / no DB or DataStore deletion / no reboot).

- [x] **REBOOT — PASS (owner, physical).** The owner rebooted the phone: Android started normally, the app opened normally, the data was usable. **This closes every "reboot pending" item above** — the 2026-08-19 S1 "REBOOT CRASH REPRO/CONFIRM", the S1-cont "REBOOT repro", the 2026-09-06 S1-final reboot item and the 2026-09-07 S2 "Reboot: STILL PENDING" are all SUPERSEDED by this result and are kept only for history. The durable fix was the full-APK `install -r` loop, never Apply Changes. Not re-run in this round (the owner's evidence is not duplicated).
- [x] Market brief renders the owner's shape with no duplication: `מצב השוק` (`מסחר רגיל.` · 20:30–03:00+1 · SPY −0.4 / QQQ −0.8 / DIA −0.5 / IWM −0.8 · `המדדים המובילים בארה״ב יורדים היום.`) then `מה קורה בטיקרים שלך` with ONE row — `נעות באותו כיוון עם השוק הרחב, שגם הוא יורד היום:` CWVX −10.9%, NEBX −10.5%, WDCX −9.9%, SNXX −9.2%, MVLL −5.5%, IRE −5.2%, NVTX −4.8%. **No standalone news block, no repeated mover list, no empty heading, no "לא נמצאה סיבה".**
- [x] News materiality live: the general feed's item ("Starbucks is back, CEO Brian Niccol says…") was classified `news: NONE — no tracked ticker, industry or index named — dropped` and did NOT render.
- [x] Omission live: SPCH (+3.3 % on a falling market) logged `SPCH=OMITTED` and does not appear in the brief — it is still visible in the raw `טופ עולות` card.
- [x] Put chain: `YAHOO_CRUMB: handshake ok (crumb len=11, cookie=true)`; `universe=17 red=13 scanned=4 tickers/12 expiries/1194 contracts requests=16 ranked=4 providerFailure=NONE`. The empty-state message is gone; the list is populated from live chains.
- [x] Ranking arithmetic recomputed BY HAND and matching to the cent: WDCX strike 18 → gross 1,800, credit 980, net 820, 980/820 = **119.51 %**; NEBX strike 25 → gross 2,500, credit 1,150, net 1,350 = **85.19 %**; SNXX strike 16 → gross 1,600, credit 620, net 980 = **63.27 %**. Descending order held; the dashboard preview is exactly the first 3 of the 4-long canonical ranking (MULL 58.21 % is 4th and correctly absent).
- [x] Exact-contract IV proven: the put rows show 131 / 182 / 157 % against ticker-level IVs of 139 / 159 / 136 % on the same card.
- [x] CSP prefill: tapping WDCX opened `פוזיציה חדשה` with CSP selected, ticker WDCX, 1 contract, Strike 18, פרמיה 9.80, Sell + Put, תפוגה 15.12.28, DTE 827, מחיר נוכחי 18.02. **No trade was saved.**
- [x] Stability + privacy: 0 FATAL, 0 AndroidRuntime, 0 Room/SQLite/migration, 0 account ids / API keys / raw Flex XML / owner email across 23,438 log lines. ONE put scan and ONE crumb handshake across a 4-minute session (TTL + in-flight gates held).
- [ ] **LIVE SECTOR-GROUP PATH NOT OBSERVED — recorded as fact, not fabricated.** Finnhub `stock/profile2` returns an EMPTY industry for every leveraged single-stock ETF this owner holds (ELIL, MULL, SOXL, CWVX, NEBX, SNXX, WDCX, SPCH — all logged `industry=(none — cached as answered)`), which is a real provider answer rather than a failure. The grouped row is therefore covered by deterministic fixtures only (`MarketBriefExplanationContractTest`). No sector catalyst was invented to produce a physical PASS. See roadmap for the owner decision.
- [ ] OWNER visual check: confirm the new brief shape reads correctly to you, and that omitting an unexplainable ticker from the brief (while it stays in `טופ עולות/יורדות`) is what you want.
- [ ] OWNER visual check: the put ranking's top entries are 2027–2028 LEAPS. That follows your own approved contract (no upper DTE cap, ratio NOT annualised). Confirm you want that, or pick an option in roadmap.md.

### 2026-09-10 S2.3 — device-test status at the FINAL head (OPT c1b9300)
- [x] Install: `adb install -r`, **installed `base.apk` SHA-256 read back off the device == the build** (`a2eb2fec834f49b054a68c6f4f82039351ec7c261b060746ff766856b70dda60`), `firstInstallTime` still 2026-04-22 22:53:57, signer SHA-1 `5d3d855c…`. No uninstall, no `pm clear`, no DB/DataStore deletion, no reboot. Delivered to `/sdcard/Download/OptionsProfitTracker/` with a matching on-device hash.
- [x] Launch + stability + privacy on this exact head: 0 FATAL, 0 AndroidRuntime, 0 Room/SQLite/migration, 0 account identifiers / API keys / raw Flex XML.
- [ ] **LIVE PROVIDER RUN NOT OBTAINED ON THIS HEAD — device condition, not the app.** The phone's Private DNS is in strict `hostname` mode pointed at `dns.adguard.com`, and Android's resolver began failing device-wide part-way through the session (`getent hosts` fails too, so it is not app-specific). Five launch attempts over ~15 minutes all produced `UnknownHostException`. That setting is the owner's and was NOT changed. **This is recorded as a gap, not claimed as a pass.**
  - The full live data run DOES exist on the two immediately preceding heads: `f73f242` — crumb handshake ok, **1,065 contracts**, ranked=4, `providerFailure=NONE`, the three preview ratios recomputed by hand to the cent, and the CSP prefill verified (strike 18 / premium 9.80 / Sell+Put / expiry 15.12.28 / DTE 827, no trade saved); `447161c` — handshake ok, **615 contracts**, ranked=4, `providerFailure=NONE`, per-ticker `status=NONE` confirming the per-ticker diagnostic fix live.
  - The delta from `447161c` to the final `c1b9300` is 4 files / 61 insertions / 9 deletions — a money-comparison normalisation, one close-method list entry, and two test files. **Nothing on the network path.**
  - The failed runs were themselves useful evidence: the crumb handshake was attempted ONCE per process rather than once per request (the round-1 `crumb()` rate-limit fix, live), the scan fast-failed at 4 requests, and every per-ticker line read `status=NETWORK` — not a sticky value, and not "no put meets the rules".
- [ ] OWNER: when the phone's DNS is healthy, open the app and confirm `פוטים לפי פרמיה / בטחונות` is populated and `מה קורה היום בשוק` reads correctly to you.

### 2026-09-12 S2.4 — device-test status (Claude Code; PR #19 OPEN, needs-owner) — executed on the real device
Executed on SM-S938B (192.168.1.118), `adb install -r` only. No uninstall, no `pm clear`, no DB or
DataStore deletion, **no reboot** (the reboot gate stays CLOSED from S2.3 — do not reopen it).
Session clock: **Saturday 2026-09-12, ~04:40–05:15 ET** — the US market and the option book were SHUT
all session, which bounds what could be proven live.

DONE by the agent on the device:
- [x] Install/launch: signer SHA-1 `5d3d855c6c6c397f817df2bd0c62f16f940b1551` == installed; installed
      `base.apk` SHA-256 read back off the device == the build; `firstInstallTime` still
      2026-04-22 22:53:57. 0 FATAL, 0 AndroidRuntime, 0 Room/SQLite/migration over 39,742 app lines.
- [x] Privacy over the same 39,742 lines: **0** occurrences of the Flex token, the Anthropic key, the
      Finnhub key, the AlphaVantage key, any `U#######` account id, `FlexQueryResponse`,
      `AccountInformation`, or the owner's email.
- [x] **STOCK REALIZED (A).** One real Flex sync (payload 4,908,464 chars, 103 tickers). The audit
      reported **0 MISMATCH and 0 GRAIN_SUM lines** — every STK row in the owner's query is
      `levelOfDetail=EXECUTION`, so there is **no duplicate grain anywhere to double-count**.
- [x] **SPCH proven from the broker's own rows.** The 1,000-share sale is **2026-09-08 15:10:17 ET**,
      sent as FOUR EXECUTION fills: 300 @ 10.69 → −2,043.77; 100 @ 10.69 → −681.97; 500 @ 10.70 →
      −3,407.71; 100 @ 10.69 → −681.94. **1,000 shares, −$6,815.39 exactly.** The expected −$2,412.39
      appears NOWHERE in the payload. **The reported double-count did NOT reproduce.**
- [x] **Total == drill-down, on screen.** `רווח/הפסד מניות` 09-2026: SPCH row −$6,815.39, expanding to
      exactly those four fills. Month total −$15,377.59 (BTCI −1,914.57, SOFI −3,077.21, NOK −3,570.42,
      SPCH −6,815.39).
- [x] **Historical audit, all 114 ticker-months**: 93 agree to the cent; 21 differ, classified —
      buy-to-cover has no feed event (MULL 2026-07 +3,159.07, PLUG 2026-06 −691.07, QQQ 2026-02 −4.30);
      the same-second `(timestamp, amount)` feed fingerprint collapses two real fills (BCAR 2026-01
      proves it exactly — two fills at 12:33:36 both realizing 1.48, one skipped); the rebuilt total is
      windowed while feed events accumulate (GPUS 2026-01 −39.68); and 11 cases of ±0.01 rounding.
      **None is a double-count.**
- [x] **WATCHLIST (D).** Both surfaces show the SAME 15 tickers with the SAME prices and day changes.
      The `רשימת מעקב` section on `התראות ומעקב` previously showed **no price and no day change at
      all**. Default order verified live, ascending by signed move: NVTX −0.5, SNXX −0.3, ASTX −0.3,
      IRE −0.3, TSLL −0.2, WDCX −0.1, NVDA −0.0, FAS +0.0, MVLL +0.1, NEBX +0.2, CWVX +0.3, SOXL +0.4,
      RKLX +0.4, ELIL +0.6.
- [x] **Shared persisted sort.** Tapped `מחיר` on the ALERTS surface → `opt_table_sort.xml` gained
      `watchlist_shared_col=PRICE`, `watchlist_shared_asc=false`; the FULL screen then opened showing
      `מחיר ▼` active and ordered 218.26 → 173.95 → 122.28 → 29.34 → 26.04 → 25.08 → 17.12. Restored to
      the approved default (`MOVE` / asc) afterwards.
- [x] **Navigation prefill from BOTH surfaces.** Tapping WDCX on the full screen and on the alerts
      section each opened `פוזיציה חדשה` with ticker WDCX and `מחיר נוכחי` = **17.12**. **No trade was
      saved.**
- [x] **No request storm.** 4 `WATCHLIST_VOL` lines across the whole session — one batch per screen
      entry, each `seeded 15/15 refreshed 15/15 showing 15`, so rows had prices on the FIRST frame and
      a failed refresh could not blank them. 0 `CC_QUOTE` calls (correctly gated by the shut book).
- [x] **CC (C) — stale/last-known labelling verified, which is all a shut book allows.** MULL:
      `ביד אחרון שנצפה לחוזה: $110.00` `(פקיעה 16.10.26 · סטרייק 29)` + `לא ציטוט חי — נקרא לפני 13 שעות.`
      SPCH: `אין כרגע ציטוט אמין לחוזה.` + `פרמיה אחרונה שמכרת: $44.00 · 10.09.26` (the SOLD date, its
      own label). Neither said `ביד נוכחי`. No midpoint was invented from half a book.
- [x] **PUT (B) — closed-market path.** `פוטים לפי פרמיה / בטחונות` → `אין מחירי מסחר רגיל להיום.` with
      `ראה הכל ←` present and **no fabricated candidate**.
- [x] **MARKET BRIEF (E).** Card renders `מצב השוק` → `השוק בארה״ב סגור היום — סוף שבוע. אין מסחר.` →
      `מה צפוי בהמשך היום` → `פוקעות בהמשך השבוע:` with RKLX 18C 18.09, ELIL 29P 18.09, SNXX 14P 18.09,
      WDCX 15.67P 18.09. The row WRAPS to a second line and both lines share the same right edge; dates
      render LTR (`18.09`, `15.67P`), no tofu from the LTR isolate.

OWNER-PENDING — could NOT be proven this session, and are NOT claimed:
- [ ] **CC BID / ASK / MID live.** Needs the REGULAR session (09:30–16:00 ET). Open the dashboard and
      confirm a ticker with 100+ uncovered shares shows `פרמיה משוערת לחוזה (אמצע)`, a
      `ביד / ביקוש / אמצע לחוזה` line, and `לימיט מומלץ (אמצע, לא מובטח ביצוע)`. Check the mid by hand:
      bid 0.42 / ask 0.44 → mid 0.43 → **$43.00 per contract** (never $0.43, never $4,300). If the book
      quotes only one side, the card must fall back to the bid alone with NO mid line.
- [ ] **PUT 2–60 DTE live.** During market hours on a red day, confirm every ranked candidate is DTE
      2–60 and that **no 2027/2028 LEAP appears** (they used to dominate). Confirm the dashboard's top 3
      are the first 3 of the full list, same order, same numbers.
- [ ] **SUPERSEDED — owner approved:** the S2.3 FINAL ADDENDUM item that asked for `ביד נוכחי לחוזה $X`
      during the session. With a two-sided book the headline is now the MID and reads
      `פרמיה משוערת לחוזה (אמצע)`; `ביד נוכחי לחוזה` remains the wording only when the book quotes a
      bid and no usable ask. Kept for history.
- [ ] **Market brief alignment with SEVERAL explanation rows.** Saturday produced only two rows, so the
      multi-row case (a sector group + a broad-market row + an overflow row) is covered by fixtures
      only. Confirm on a trading day that every row starts at the same edge and wrapped rows align.
- [ ] **Where −$2,412.39 came from.** The app is not double-counting; IBKR's four fills sum to
      −$6,815.39. If IBKR's own screen shows −$2,412.39 for this sale, it is a different report,
      period or lot-matching basis — please send the exact IBKR view so it can be reconciled. Nothing
      was changed toward that number.

### 2026-09-12 S2.4 — device checks added by the REVIEW rounds (final head)

Re-verified on the device after the review fixes, on the final build:
- [x] **The orphaned-price defect, on the exact row that broke.** NVDA (target strategy `מניות`) tapped
      from the `רשימת מעקב` section on `התראות ומעקב` now opens `פוזיציה חדשה` with the ticker field
      holding **NVDA** and `מחיר נוכחי` **218.26**. Before the fix that tap produced an EMPTY ticker with
      the price sitting in the field, belonging to nothing.
- [x] **Navigation really is unified.** Tapping WDCX on the FULL `רשימת מעקב` screen now opens the same
      form the alerts surface opens: **CSP selected, WDCX, `מחיר נוכחי` 17.12**. Before, the full screen
      passed no strategy and opened a bare form. **No trade was saved** on any of these taps.
- [x] Final build launches clean: 0 FATAL, 0 AndroidRuntime, 0 SQLite/Room/migration; 0 token, key,
      account id, raw Flex XML or owner email in the app log.
- [x] Installed == built == delivered APK hash on the final head; `firstInstallTime` still
      2026-04-22 22:53:57; signer SHA-1 `5d3d855c…`.

Still owner-pending (unchanged — a shut market bounds them):
- [ ] CC **BID / ASK / MID** during the regular session (09:30–16:00 ET). Check the mid by hand:
      bid 0.42 / ask 0.44 → mid 0.43 → **$43.00 per contract**. With only one side quoted there must be
      NO mid line and the card must fall back to the bid alone.
- [ ] PUT ranking during market hours on a red day: every candidate DTE 2–60, **no 2027/2028 LEAP**, and
      the dashboard's top 3 identical to the first 3 of the full list.
- [ ] **NEW — worth one look after the IV fix.** A contract whose own IV is above 500 % now has no
      usable IV and is excluded (`NO_OWN_IV`) instead of rendering as a wrong small number. If a
      candidate you expected to see is missing on a very-high-IV name, that is why.
- [ ] Market-brief alignment with SEVERAL explanation rows (needs a trading day with movers).
