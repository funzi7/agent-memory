# thai-rent-finder — Roadmap

עדכון אחרון: 2026-05-04

## Status

5 sources עובדים על crons:
- ✅ FazWaz (Tier 2)
- ✅ Renthub (Tier 2)
- ✅ Living Insider (Tier 2)
- ✅ Lazudi (Tier 2)
- 🔴 Hipflat (Cloudflare 403, Tier 3 — דחוי, לא בעדיפות)

## Top priority — Bugs

### B1. Lazudi rent regex bug (Codex P1 על PR #54)
META_DESCRIPTION_RE: group 1 = sale price, group 2 = rent. parseLazudiMetaDescription תמיד קורא m[1]. בליסטינגים Sale+Rent — price_thb מקבל מחיר מכירה (סדר גודל גדול מדי). **תקן: @codex address that feedback על PR #54.**

### B2. CI Watcher — job.conclusion במקום job.status (Codex P2 על PR #55)
conclusion הוא null עד שjob נגמר. צריך להחזיר job.status כדי לראות in_progress. **תקן: @codex address that feedback על PR #55.**

### B3. CI Watcher — pagination על jobs endpoint (Codex P2 על PR #55)
GitHub jobs API paginated. matrix runs עם הרבה jobs יאבדו את הjobs האחרונים. **תקן: @codex address that feedback על PR #55.**

### B4. RTL bug: "מ\"ר 24" במקום "24 מ\"ר"
בכל הליסטינגים, סדר המילים הפוך. תיקון פשוט בtemplate.

### B5. Filter סינון לא נשמר בעמוד הראשי
עמודת הסינון מציגה שיש סינון פעיל אבל לא מחיל אותו. תיקון state management.

### B6. Back navigation מקודה הליסטינג חוזר לראש העמוד
חזרה מליסטינג צריכה לחזור לאותה עמדה ב-scroll. שמירת scroll position.

### B7. אין פרטי קשר באף ליסטינג
לבדוק: האם המידע לא נשמר בDB? האם הUI לא מציג? כנראה שדה במודל חסר או שלא חולץ.

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

## DevOps automation

### D1. Codex auto-fix flow ✅ (חדש!)
Codex פותח reviews על PRs, פקודה `@codex address that feedback` מפעילה Codex לתיקון אוטומטי. **שימוש: על כל PR מ-Claude Code, תגובת `@codex address that feedback` תפעיל auto-fix.**

### D2. Codex CLI כBackup ל-Claude Code
$20 ChatGPT Plus כולל Codex CLI. כל הinfrastructure (agent-memory, Projects) portable. שימוש כשClaude Code נגמר טוקנים.

### D3. CI Watcher Project (אחרי PR #55 + GITHUB_PAT)
מאחר שהendpoint מוכן, נוסיף ל-Project system prompt שיקרא ל-`/api/admin/ci-runs`. יחליף את הצורך להעתיק logs ידנית.

## Notes

- Hipflat נשאר דחוי. Cloudflare protection חזק מדי, ידרוש residential proxy ($20-50/חודש). 4 sources עם 80%+ market coverage מספיק לv1.
- לא להוסיף sources חדשים עד שכל הUX bugs/features יסודרו.
