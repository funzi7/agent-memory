# thai-rent-finder — Roadmap

> History of completed work + forward plan. Update at end of each batch.

עדכון אחרון: 2026-05-04

---

## Status (current)

**Sources עובדים על crons יום-יום (UTC):**
- ✅ FazWaz — `0 20 * * *` (Tier 2)
- ✅ Renthub — `30 20 * * *` (Tier 2)
- ✅ Living Insider — `0 21 * * *` (Tier 2)
- ✅ Lazudi — `30 22 * * *` (Tier 2)
- 🔴 Hipflat — Cloudflare 403, **Tier 3, דחוי לעת עתה**

**Production:** https://thai-rent-finder.vercel.app
**Repos:** funzi7/thai-rent-finder (private), funzi7/agent-memory (public)
**Listings:** 69+ (גדל יום-יום)

---

## Completed batches

### Batch 1 — GH Actions infra + FazWaz migration (PR #44, merged)
- `scripts/scrape-cli.ts` runner with `--source --city --limit --dry-run`
- Refactored FazWaz to use full Playwright (not serverless Chromium)
- `/api/scrape/[source]` returns 503 redirect for FazWaz
- `.github/workflows/scrape-fazwaz.yml` with daily cron + matrix-per-city
- `/jobs` page shows GH Actions link instead of broken sync button
- `docs/SETUP_GH_ACTIONS.md`

**Outcome:** FazWaz PTY produced 4 listings on first verified run. Low number — possibly real low long-term inventory, possibly pagination not paging. Investigate later.

### Batch 2 — Renthub + Living Insider stubs + photo dedup + source filter (PR #45, merged)
- `dedupeImageUrls()` utility + applied retroactively to FazWaz
- Renthub + Living Insider scraper stubs (threw "not yet implemented")
- Workflows for both
- Source multi-select filter on `/listings`
- Bumped GH Actions versions to silence Node 20 deprecation warnings

**Outcome:** Stubs only — sandbox couldn't access live sites for verification. Bodies left for Batch 2.5.

### Batch 2.5 — Scraper implementations + P2 review fixes (PR #46, merged)
- Disabled scheduled crons until live verification (P1 from Codex review)
- CLI uses `process.exitCode` to avoid log truncation (P2)
- `found` excludes deactivated count (P2)
- `status_min` validation gated behind AI source (P2)
- RenthubScraper: plain HTTP + Cheerio, monthly-only filter, hotel reject, defensive selectors, `applyMonthlyFallback()` for index-card price recovery
- LivingInsiderScraper: PTY only (zone_id=42), expired/closed filter, other cities throw "zone not yet mapped"

### Batch 2.6-2.9 — Renthub/FazWaz/LI bug fixes (PRs #47-#51, merged)
- Renthub: city stamping fix, Phuket leak filter, LINE icon photo filter, post-filter limit, structured logging
- FazWaz: city fix, city-stamping helper extracted to `src/scrapers/core/city-stamping.ts`, waitForSelector removed, pre-fetch limit slicing, browser.close() in finally + shutdown logging, scrape-cli 5s force-exit failsafe
- Photo-filters extracted to `src/lib/photo-filters.ts`
- `/api/admin/cleanup-icon-photos` + `/api/admin/audit-listings` endpoints
- LI anchor-first + dedup by source_id, removed obsolete livingdetail_en/closest() logic

### Batch 3.0-3.1 — Living Insider data quality (PR #52 + appended commits, merged)
- isLikelyTitle heuristic, parseLiCardRooms tightened (2-digit cap, leading guard)
- parseLiPrice requires /mo (skip sale prices)
- cleanCardText strips Boosted/Created timestamps
- extractSourceId accepts .html and trailing slash
- Codex P1 fix: Thai สตูดิโอ studio detection restored
- Codex P2 fix: 5-char minimum + content-based isLikelyTitle
- Expanded parseLiCardMonthlyPrice for "Rent price ฿XK", "X baht/month", URL fallback
- Result: 4 listings → ~9 listings persisted per LI run

### EnableCrons (direct push to main, e2e8753)
- FazWaz: cron `0 20 * * *` UTC = 03:00 Bangkok
- Renthub: cron `30 20 * * *` UTC = 03:30 Bangkok
- Living Insider: cron `0 21 * * *` UTC = 04:00 Bangkok

### Batch 4 — Hipflat + Lazudi + LI Polish (PR #53, merged)
- Hipflat scraper Tier 2 with incremental skip logic
- Lazudi scraper Tier 2 with min-term filter (≤1 month)
- Codex P2 fix: fallbackTitle accepts single-word project names
- LI: isLikelyTitle rejects specs-only structured text
- Hipflat cron: `0 22 * * *` UTC (FAILED — Cloudflare 403, retired)
- Lazudi cron: `30 22 * * *` UTC = 05:30 Bangkok ✅

**Outcome:**
- Lazudi verified: 10 listings, runtime 70s, prices/sqm/beds correct
- Hipflat: Cloudflare 403, dropped to Tier 3 / future investigation
- LI specs-only title fix verified: "DUSIT GRAND PARK" titles clean

---

## Pending PRs

- ⏳ **PR #54 (Lazudi)** — Codex P1 review pending fix (regex group bug)
- ⏳ **PR #55 (CI Watcher endpoint)** — Codex P2 review pending fix (job.status, jobs pagination)
- ✅ **GITHUB_PAT** הוגדר ב-Vercel (uppercase)
- ✅ **Codex environment** הוקם, setup script: `npm install --legacy-peer-deps && npx prisma generate`

---

## Top priority — Bugs

### B1. Lazudi rent regex bug (Codex P1 על PR #54)
META_DESCRIPTION_RE: group 1 = sale price, group 2 = rent. parseLazudiMetaDescription תמיד קורא m[1]. בליסטינגים Sale+Rent — price_thb מקבל מחיר מכירה (סדר גודל גדול מדי). **תיקון:** `@codex address that feedback` על PR #54.

### B2. CI Watcher — job.conclusion במקום job.status (Codex P2 על PR #55)
conclusion הוא null עד שjob נגמר. צריך להחזיר job.status כדי לראות in_progress. **תיקון:** `@codex address that feedback` על PR #55.

### B3. CI Watcher — pagination על jobs endpoint (Codex P2 על PR #55)
GitHub jobs API paginated. matrix runs עם הרבה jobs יאבדו את הjobs האחרונים. **תיקון:** `@codex address that feedback` על PR #55.

### B4. RTL bug: "מ\"ר 24" במקום "24 מ\"ר"
בכל הליסטינגים, סדר המילים הפוך. תיקון פשוט בtemplate.

### B5. Filter סינון לא נשמר בעמוד הראשי
עמודת הסינון מציגה שיש סינון פעיל אבל לא מחיל אותו. תיקון state management.

### B6. Back navigation מקדה הליסטינג חוזר לראש העמוד
חזרה מליסטינג צריכה לחזור לאותה עמדה ב-scroll. שמירת scroll position.

### B7. אין פרטי קשר באף ליסטינג
לבדוק: האם המידע לא נשמר בDB? האם הUI לא מציג? כנראה שדה במודל חסר או שלא חולץ.

---

## High priority — UX

### U1. כפתור אישור בעמוד המסננים
כרגע יציאה מעמוד הסינון רק דרך X. צריך כפתור "החל סינון" / "סגור".

### U2. תגיות (Pattaya, Bangkok וכו') ניתנות ללחיצה
לחיצה על תג עיר תפעיל את הסינון לעיר הזו.

### U3. מחיר מקסימלי 40K (כרגע ~30K?)
שינוי slider/range של filter מחיר.

### U4. Persistent filter (שמירה בין sessions)
אם בחרתי "פטאיה" — בכניסה הבאה לאתר עדיין יראה פטאיה. localStorage או user preferences.

### U5. הוספת חיפוש טקסטואלי
שדה חיפוש מעל הרשימה — שם בניין, אזור, מילות מפתח.

### U6. ערכת נושא בהירה (Light theme)
toggle בין dark/light. כרגע dark only.

### U7. כותרות ארוכות — לא לחתוך בקארד
כרגע truncate. או להוסיף "..." עם הרחבה בלחיצה, או לאפשר 2-3 שורות.

### U8. הצגת כל התגיות (חסר תמונות וכו')
תגי איכות/סטטוס מופיעים אבל חלקם נחתכים.

---

## Medium priority — Features

### F1. הוספת הקונדו הנוכחי של דימה (Dusit)
פיצ'ר "My current home" — דימה מסמן ליסטינג ספציפי כקונדו שלו, ההשוואות מציגות אותו כbaseline.

### F2. השוואה מול הקונדו של דימה
לכל ליסטינג: כמה זול/יקר יותר ממה שדימה משלם, באחוזים. דורש את F1 קודם.

### F3. סקרייפינג של בניין ספציפי
"אני רוצה לראות את כל הליסטינגים בבניין X" — חיפוש מלא בכל הsources עם שם בניין כקריטריון.

### F4. הצגת תיאור מלא וproperty highlights
מהsource הdetail page — תיאור מלא, רשימת תכונות, מחירים לתקופות שונות (חודש/3 חודשים/שנה).

### F5. שם בניין ומיקום פנימי בעיר
חילוץ שם הפרויקט והאזור המדויק (Jomtien, Wongamat וכו') — חלקי כיום, נדרש בכל הsources.

---

## DevOps automation

### D1. Codex auto-fix flow ✅ (חדש!)
Codex פותח reviews על PRs, פקודה `@codex address that feedback` מפעילה Codex לתיקון אוטומטי. **שימוש:** על כל PR מ-Claude Code, תגובת `@codex address that feedback` תפעיל auto-fix. דורש Codex environment פעיל (✅ הוקם 2026-05-04).

### D2. Codex CLI כBackup ל-Claude Code
$20 ChatGPT Plus כולל Codex CLI. כל הinfrastructure (agent-memory, Projects) portable. שימוש כשClaude Code נגמר טוקנים.

### D3. CI Watcher Project (אחרי PR #55 + GITHUB_PAT)
מאחר שהendpoint מוכן (PR #55 ממתין למיזוג), הוסף ל-Project system prompt שיקרא ל-`/api/admin/ci-runs`. יחליף את הצורך להעתיק logs ידנית. **System prompt מוכן ב-`CIWatcher_SystemPrompt.md`**.

### D4. Codex auto-fix workflow
GitHub Action שמזהה review של Codex עם P1/P2 ואוטומטית מגיב `@codex address that feedback`. **Prompt מוכן ב-`CodexAutoFix.md`**.

---

## Future batches (not yet started)

### Batch 5 — DDProperty
- Uses Next.js, has `__NEXT_DATA__` JSON in HTML — strategy: extract structured data
- Live inspection first (Scraper Doctor), then implementation

### Batch 6 — Property Scout (Playwright)
- Anti-bot heavier than FazWaz
- Reuses the FazWaz tier-2 pattern

### Batch 7 — Cross-source dedup
- The Building model exists. Improve cross-source deduplication using:
  - Building name + city + bedroom count + sqm range + price range
  - Heuristic: same building + same bedrooms ± 5% sqm = likely same physical unit
- UI: show "זמין גם ב-{source}" badge on listing cards when match found across sources

### Maybe later
- Listing Quality Inspector — periodic job that flags listings with missing photos, suspicious prices, expired-likely. Surfaces in `/jobs` admin view.
- Drill-down per source (last 10 errors, time-series of listings_added)
- "Best deals" — listings priced significantly below building average

### Explicitly out of scope
- Facebook Marketplace / groups (anti-bot + ToS)
- Airbnb (short-term, not the use case)
- Bahtsold (low signal, no structured rental data)
- Sale listings (rentals only)
- Hipflat (Cloudflare-blocked, would need residential proxy)

---

## Notes

- Hipflat נשאר דחוי. Cloudflare protection חזק מדי, ידרוש residential proxy ($20-50/חודש). 4 sources עם 80%+ market coverage מספיק לv1.
- לא להוסיף sources חדשים עד שכל הUX bugs/features יסודרו.
- כל הspecs (Batch1-Batch4, CIWatcher_*, CodexAutoFix) שמורים ב-/mnt/user-data/outputs בtranscript.
