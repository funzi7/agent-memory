# DEVELOPMENT_RULES_FULL

## 1. כללי תשובה כלליים

- ענה על בסיס עובדות ומקורות בלבד.
- אל תציג הנחות, “אמור להיות”, “צריך להיות” או דעה אלא אם המשתמש ביקש דעה.
- כאשר אין ביסוס מספיק, ציין זאת במפורש.
- העדף חישובים וניתוח על מחמאות ואל תסכים עם המשתמש אוטומטית.
- התחל משפט בעברית/RTL, אלא אם רוב המשפט באנגלית.

## 2. תחולת כללי הפיתוח

הכללים במסמך זה חלים על כל משימת פיתוח שמנוסחת עבור Codex או Claude Code, אלא אם המשתמש נתן באותו סבב הוראה מפורשת אחרת.

בכל פרומפט פיתוח חובה לכלול במפורש את דרישות הסיום, התיעוד, הבדיקות, ה־commit, ה־push וה־agent-memory. אין להסתפק בכך שהכללים קיימים במסמך זה או בפרסונליזציה.

## 3. בדיקות חובה לפני שינוי

לפני שינוי קוד, קובץ, גרסה או תצורה, הסוכן חייב לבדוק בפועל:

- `pwd`
- שם הריפו
- branch
- HEAD
- tracking branch
- `git status`
- `git diff`
- קובצי handoff/state העדכניים
- `/root/work/agent-memory/<repo-name>/cc-latest.md`

אין להניח שה־worktree נקי.

## 4. שמירת עבודה קיימת ו־Git safety

- אין למחוק, לדרוס או לעקוף עבודה מקומית קיימת.
- אסור להשתמש ב־`reset`, `clean`, `restore`, `stash`, `force-push` או checkout/worktree חלופי כדי לעקוף שינויים מקומיים.
- אין לצרף ל־commit שינויים מקומיים שאינם חלק מהמשימה.
- עבודה מקבילה על אותו repository דורשת אישור מפורש ותכנון בידוד.
- repositories שונים אינם דורשים worktree.

## 5. בניית scope, בירור ו־milestones

לפני ניסוח פרומפט חדש:

- הצ׳אט המנהל אינו שולח פרומפט ל־Codex או ל־Claude Code לפני שכל הדרישות והעמימויות של הסבב התבררו והמשתמש נתן אישור מפורש למסירת הפרומפט.
- אין להמציא דרישות, להרחיב scope או להוסיף התנהגות שלא התבקשה. כאשר פרט מהותי אינו ברור, יש לעצור ולברר אותו לפני ניסוח הפרומפט או שינוי הקוד.
- בדוק אילו באגים קטנים, תיקוני UI ושיפורים קשורים אפשר לשלב בבטחה במשימה המהותית הבאה.
- אין ליצור milestone, version bump או סבב build נפרד לתיקון קטן אם ניתן לשלבו בלי להגדיל את הסיכון באופן מהותי.
- אין לפצל עבודה רק משום שכל תיקון יכול לקבל מספר גרסה נפרד.

## 6. החלטות UX והתנהגות מאושרת

- כאשר המפרט מגדיר התנהגות, יש ליישם אותה בדיוק.
- כאשר קיימות שתי אפשרויות UX סבירות או יותר שלא הוכרעו, הסוכן חייב לעצור לפני שינוי קבצים.
- יש להציג:
  1. אפשרויות ממוספרות;
  2. תיאור מעשי וקצר;
  3. היתרונות, החסרונות או ההשפעה של כל אפשרות.
- לאחר הצגת האפשרויות יש להמתין לבחירה מפורשת לפני קוד, version bump, migration, commit או push.
- החלטות כאלה כוללות בין היתר: מיקום פעולות, ניווט, סדר מסכים, אוטומטי מול ידני, ברירות מחדל, מחיקה/החלפה/הסתרה, ניסוח התנהגותי וזרימות שימוש.
- אין צורך לעצור על החלטות הנדסיות פנימיות שאינן משנות UX וכבר כפופות למפרט.
- אין “לשפר” UX לפי העדפת הסוכן.
- פעולת חזרה חייבת להחזיר למסך הקודם באותו מצב שבו המשתמש עזב אותו, לרבות מיקום הגלילה, הפריט או הטאב שנבחרו, וסינון או חיפוש פעילים כאשר הם רלוונטיים. אין לאפס את המסך ללא דרישה מפורשת.
- בכל התחלה של גלילה כלפי מעלה, ללא סף מרחק מינימלי, יופיע כפתור צף שמבצע גלילה ישירה לראש העמוד. הכפתור יישאר קבוע וגלוי עד שהמשתמש יגלול בפועל כלפי מטה.
- בעמודי מדיה או קטלוג, כגון מסך כותרים, בכל התחלה של גלילה כלפי מעלה יופיע בחלק העליון שדה חיפוש צף. שדה החיפוש יישאר קבוע וגלוי עד שהמשתמש יגלול בפועל כלפי מטה, ולא יוסתר, יזוז או ישנה מיקום בזמן מיקוד, הקלדה או שימוש בו.
- אותה לוגיקת הופעה והישארות חלה על שני הרכיבים: כפתור החזרה לראש העמוד ושדה החיפוש.
- התנהגות שכבר נבדקה ואושרה על ידי בעל הפרויקט אינה ניתנת להחלפה בשקט עקב refactor, “שיפור ארכיטקטוני”, שינוי תשתיתי או מימוש מחדש.
- כל שינוי שמחליף התנהגות מאושרת דורש החלטה ואישור מפורשים של בעל הפרויקט לפני שינוי הקוד. ללא אישור כזה, ההתנהגות הקיימת והמאושרת נשמרת גם אם הסוכן סבור שקיימת חלופה ארכיטקטונית טובה יותר.
- כאשר בעל הפרויקט מאשר החלפה, יש לתעד מה החליף את ההתנהגות הקודמת ואת הסיבה להחלפה, ולסמן את ההחלטה או הדרישה הישנה כ־`SUPERSEDED — owner approved`. אסור לסמן דרישה או החלטה מאושרת כ־`SUPERSEDED` ללא אישור מפורש של בעל הפרויקט.

## 7. מודלים, כניסה וכלי עבודה

לפני כל פרומפט פיתוח יש להציג רק את פקודת הכניסה מה־Termux הרגיל:

- Codex: `cauto <repo-name>`
- Claude Code: `clauto <repo-name>`

אין להציג ידנית `proot-distro`, `cd` או flags.

הפקודה `ai` מאפשרת לבחור agent ו־repository; ללא שם repository מוצג תפריט, ו־`N` מאפשר יצירת GitHub repository, clone או repository מקומי.

תחת PRoot root אין להשתמש ב־`--dangerously-skip-permissions`; יש להשתמש ב־`clauto`.

יש להשתמש תמיד בהגדרה החזקה ביותר הנתמכת בפועל:

- Codex: ‏GPT‑5.6 Sol, ‏Ultra לסוכן הראשי ול־subagents, ‏YOLO ועד 4 subagents.
- Claude Code: effort מרבי ועד 4 subagents.
- כאשר Fable זמין, שלב התכנון של משימת Claude Code ייעשה ב־Fable העדכני הזמין.
- לאחר שהתכנון נסגר ולפני תחילת המימוש, יש להעביר את עבודת המימוש ל־Opus העדכני הזמין. Claude Code תומך בהחלפת מודל בתוך אותו session באמצעות `/model`, ותומך גם בהפעלת subagent עם `model: opus` או עם model parameter ברמת ההפעלה.
- כאשר ניתן לבצע זאת אוטומטית ובטוחה בתוך אותו session, יש להעדיף ש־Fable ישמש כמתכנן/מתאם ויעביר את עיקר עבודת המימוש ל־Opus subagent או subagents. במקרה כזה Opus מבצע את עבודת הקוד שהואצלה, אך ה־Fable main thread עשוי עדיין לצרוך מעט מכסה לצורך תיאום, קבלת תוצאות והמשך השיחה.
- אם המטרה היא להעביר גם את ה־main thread עצמו ל־Opus לאחר התכנון, יש לבצע מעבר מודל נתמך בתוך אותו session, למשל `/model opus`. אין להניח ש־Claude יכול לבצע בעצמו פקודת `/model` של המשתמש באמצעות prompt רגיל. אם אין מנגנון אוטומטי נתמך שמחליף את מודל ה־main thread, יש לעצור לאחר סגירת התכנון, לבקש מהמשתמש לבצע את מעבר המודל, ורק לאחר מכן להתחיל את המימוש.
- מטרת החלוקה היא לשמור את Fable בעיקר לתכנון ולחסוך את מכסת/צריכת Fable במהלך המימוש, כדי לאפשר יותר זמן ועבודה ב־Claude Code.
- אין לקבע מספר גרסה של Fable או Opus במסמך זה. יש להשתמש בגרסה העדכנית הזמינה בפועל לחשבון ובתחביר הרשמי הנתמך בגרסת Claude Code המותקנת.
- אם Fable או Opus אינם זמינים לחשבון, או שמנגנון מעבר/האצלה נתמך נכשל, אין להעמיד פנים שהחלוקה בוצעה; יש לציין זאת ולהשתמש בהגדרה החזקה ביותר הזמינה בהתאם לכללים האחרים.

אין להפחית reasoning/effort או מספר subagents בגלל sessions נוספים. אם CLI, מודל או התחביר השתנו, יש לבדוק תחילה תיעוד רשמי עדכני.

## 8. פיצול פרומפטים ב־Termux

### Codex

פרומפט ארוך ל־Codex דרך Termux חייב להיות מפוצל לחלקים קצרים וממוספרים להדבקה רציפה, כדי למנוע תקיעה בעת הדבקת טקסט ארוך.

- כל חלק יסומן בבירור: `PART 1/N`, `PART 2/N` וכן הלאה.
- בחלקים שאינם האחרונים יש להורות ל־Codex לשמור את הדרישות ולהמתין, בלי להתחיל עבודה.
- רק החלק האחרון יסומן `FINAL PART` ויכלול הוראה להתחיל לאחר קליטת כל החלקים.
- אין להשמיט דרישות כדי לקצר את הפרומפט.

### Claude Code

ל־Claude Code ב־Termux ניתן למסור פרומפט ארוך אחד, אלא אם פיצול נדרש מסיבה אחרת.

## 9. עבודה מקבילה ו־subagents

- במשימה גדולה יש להפעיל עד 4 subagents במקביל למסלולים עצמאיים, במיוחד חקירת קוד, בדיקות, תיעוד וסקירה.
- אין לאפשר לכמה agents לערוך במקביל אותם קבצים או אזורי קוד צמודים.
- מותר להריץ sessions מקבילים על repositories שונים.
- קריאה, עריכה, חקירה, review, תיעוד ובדיקות קלות רשאים לרוץ במקביל.

כל build/test מקומי כבד חייב לעבור דרך ה־global hooks וה־heavy-build queue המותקנים, לרבות:

- Gradle/Android
- APK/AAB
- NDK
- CMake
- wrappers כגון `build.sh`, `release.sh`, `package.sh`

בכל הטלפון רשאי לרוץ heavy build אחד בלבד מכל Codex/Claude sessions וה־subagents. האחרים חייבים להמתין. אסור לעקוף hook/lock, לבטל build פעיל או להפעיל heavy build נוסף במקביל.

## 10. בדיקות runtime אמיתיות

שינוי המשפיע על runtime אמיתי אינו מאומת באמצעות unit tests או CI בלבד. זה כולל בין היתר:

- הורדות
- רשת או API
- yt-dlp/ffmpeg
- אחסון
- background work
- שירותים חיצוניים
- קלט או output אמיתי

אם אין מכשיר או ADB זמין, חובה לבצע לפחות integration smoke test אמיתי מול השירות, ה־URL או הקלט הרלוונטי, להפיק output ולבדוק אותו בפועל.

כשל בבדיקה הוא release blocker. אסור לדווח `passed` או למסור release כאילו אומת.

אם מכשיר או ADB זמינים, יש להעדיף end-to-end אמיתי על המכשיר.

## 11. מסמכי מצב ו־backlog reconciliation

כל פרומפט חייב לכלול דרישת finalization מחייבת לעדכון:

- `TODO.md`
- `PROJECT_STATE`
- `HANDOFF`
- כל מסמך acceptance/test/release/UX שרלוונטי לשינוי
- `README` ו־ADR כאשר ארכיטקטורה, הגדרות או חוזה המוצר השתנו
- `/root/work/agent-memory/<repo-name>/cc-latest.md`

יש לבצע reconciliation מלא של ה־backlog:

- מה בוצע בפועל;
- מה עדיין pending פיזית;
- מה הוחלף ומסומן `SUPERSEDED`; כאשר מדובר בדרישה, החלטה או התנהגות שאושרה קודם על ידי בעל הפרויקט, הסימון יהיה `SUPERSEDED — owner approved` ורק לאחר אישור מפורש.
- מה נשאר לעתיד.

אין:

- להשאיר checkbox ישן של גרסה קודמת כאילו הוא עדיין משימה פעילה רק משום שאיש לא חזר למסמך;
- למחוק היסטוריה;
- להמציא PASS פיזי;
- לסמן משימה שהוחלפה כ־DONE; היא מסומנת `SUPERSEDED`. דרישה, החלטה או התנהגות שאושרה קודם על ידי בעל הפרויקט ומוחלפת באישורו מסומנת `SUPERSEDED — owner approved`, עם תיעוד של המחליף והסיבה.

לפני finalization חובה לבדוק שאין דרישה שאושרה במהלך הסבב ונשארה רק בצ׳אט.

לאחר ה־HEAD הסופי, CI ו־publication אם בוצעו, יש לעדכן גם את `cc-latest.md`, כולל backlog עתידי רלוונטי.

finalization אינו שלם אם הקוד מעודכן אך מסמכי המצב אינם משקפים את אותו מצב.

התיעוד חייב לציין:

- מה בוצע בפועל;
- אילו בדיקות הורצו ומה עבר או נכשל;
- מה לא נבדק פיזית;
- מה נשאר;
- מגבלות, סיכונים והחלטות ארכיטקטוניות;
- HEAD החדש;
- deploy רק אם בוצע בפועל.

## 12. סיום Git ו־agent-memory

בסיום משימה משמעותית חובה:

1. להריץ את כל הבדיקות הרלוונטיות;
2. להריץ `git diff --check`;
3. לבצע commit מסודר רק לשינויי המשימה;
4. לדחוף את repository הפרויקט;
5. לסיים agent-memory רק באמצעות:

`/root/work/bin/agent-memory-finalize "<commit message>"`

אסור לבצע ישירות פעולות Git משנות־מצב בתוך `/root/work/agent-memory`.

קבצים שונים של projects שונים ב־agent-memory רשאים להיכתב במקביל. רק Git finalization נעשה בתור, עם staging/commit לתיקיית הפרויקט בלבד ו־push תחת lock משותף.

אין להמציא SHA או למסור SHA לפני push מוצלח של שני repositories.

### PR review fallback כאשר Codex אינו זמין

כאשר תהליך העבודה הרגיל דורש Codex PR review, אך Codex review quota/דקות אינם זמינים, וביצוע המשימה נעשה ב־Claude Code, אסור לדלג על review.

במקרה כזה:

- Claude Code חייב לבצע PR-style review מלא לאחר סיום המימוש, הבדיקות והתיעוד ולפני finalization סופי.
- הביקורת תתבצע על ה־PR diff אם קיים PR, או כ־PR-style review על diff המשימה אם טרם נפתח PR.
- כאשר אפשר, יש לבצע את הביקורת באמצעות Opus reviewer subagent נפרד מה־agent שביצע את עיקר המימוש.
- Claude Code חייב לתקן את כל הממצאים התקפים שעלו בביקורת, להריץ מחדש את כל ה־validation הרלוונטי ואת `git diff --check`, ולעדכן את התיעוד אם התיקונים שינו behavior, acceptance, tests או release state.
- יש לתעד במפורש:

  `review_provider = claude_code_fallback`  
  `reason = codex_quota_unavailable`

- אסור להציג fallback כזה כאילו היה Codex review.

### חוזה קנוני ל־Codex Gate / Merge Bot / watchdog

יש לשמור התאמה מלאה בין כללי `DEVELOPMENT_RULES_FULL` לבין מערכת Codex Gate / Merge Bot / watchdog.

ההנחה הישנה:

`valid review == Codex review`

אינה תקפה עוד. החוזה הקנוני הוא:

`valid exact-head review evidence == normal Codex evidence OR approved Claude fallback evidence when Codex is provably unavailable`

הפתרון חייב להיות CENTRAL ב־`automation-core` ולא patch מקומי ל־repository צרכן יחיד.

#### דרישות fail-closed ל־Claude fallback

1. fallback מותר רק כאשר מדיניות ה־repository מאפשרת אותו במפורש.

2. חייבת להיות ראיה אמינה לכך ש־Codex review אינו זמין כרגע, לדוגמה הודעת quota/usage-limit מה־ChatGPT Codex connector המהימן. אין לאפשר fallback רק משום שמשתמש, agent או comment טענו `Codex unavailable`.

3. fallback חייב להיות קשור ל־HEAD המדויק. ה־attestation חייב לכלול את ה־full 40-character reviewed SHA. כל commit חדש מבטל את ה־fallback ודורש review fallback חדש.

4. נדרשת structured review attestation; free-form comment לבדו אינו מספיק. ה־attestation חייב לכלול לפחות:

   `provider=claude_code_fallback`  
   `reviewed_head=<40-char SHA>`  
   `verdict=clean`  
   `findings_found=<N>`  
   `findings_fixed=<N>`  
   `unresolved_p1=0`  
   `unresolved_p2=0`  
   `validation=<status/reference>`  
   `reason=codex_quota_unavailable`

   יש להעדיף יצירת attestation באמצעות workflow/script קנוני ולא parsing של טקסט חופשי.

5. fallback אינו רשאי לעקוף Codex findings קיימים. כל Codex P1/P2 אמיתי ולא פתור משאיר את Gate אדום.

6. אם Codex ביצע review על HEAD קודם ולאחר מכן נוספו commits, Claude fallback חייב לכסות במלואו את ה־HEAD החדש.

7. אם Codex חוזר ומבצע review אמיתי על ה־HEAD הנוכחי:
   - Codex review יכול להפוך ל־review authority העדכני;
   - כל P1/P2 חדש שלו חוסם merge;
   - fallback קודם אינו רשאי להסתיר review שלילי חדש.

8. Gate output חייב לשקף provenance אמיתי, לדוגמה:

   `Claude Code fallback review accepted for exact head; Codex quota unavailable`

   אסור להציג:

   `Codex reviewed`

   כאשר בפועל ה־review התקבל מ־Claude fallback.

9. Merge Bot חייב להשתמש בדיוק באותה החלטת review evidence כמו Gate. אין לשכפל לוגיקה שונה בין Gate, Merge Bot ו־watchdog. יש להעדיף shared review-evidence decision/helper יחיד ב־`automation-core`.

10. watchdog לא צריך להמשיך להציף `@codex review` requests כאשר exact-head Claude fallback כבר התקבל ועדיין קיימת אותה תקופת `codex_quota_unavailable`.

11. אין להשתמש ב־`codex-p1-acknowledged`, owner override או מנגנון acknowledgement אחר כדי לייצג Claude fallback. אלה semantics שונים.

12. אין להחליש את המסלול הרגיל: כאשר Codex זמין, Codex review נשאר ברירת המחדל הרגילה.

#### Acceptance tests מחייבים

חובה לכסות לפחות:

- exact-head Codex clean -> PASS כרגיל.
- trusted quota notice + exact-head Claude fallback clean -> PASS.
- Claude fallback ללא quota evidence -> FAIL.
- forged/untrusted quota notice -> FAIL.
- fallback על SHA קודם -> FAIL.
- commit לאחר fallback -> FAIL עד review חדש.
- unresolved Codex P1/P2 -> FAIL גם עם Claude fallback.
- fallback עם unresolved Claude P1/P2 -> FAIL.
- pure free-form `Claude reviewed` comment -> FAIL.
- quota evidence ישן שאינו מתאים לאירוע הנוכחי -> FAIL.
- Codex חוזר מאוחר יותר ומדווח P1/P2 חדש -> FAIL.
- כל ה־review evidence נקי -> Merge Bot רשאי למזג כרגיל, עם provenance שמציין Claude fallback.

#### Regression fixture קנוני

`paywall-bot` PR #103 הוא regression scenario אמיתי שחייב להיכלל בבדיקות של `automation-core`:

- current head: `d068d977a700093affc47a46aa2b1610fe72248f`
- exact-head CI היה green.
- בוצעו קודם 3 Codex review rounds ובהם 4 ממצאי P2 אמיתיים; כולם תוקנו ונפתרו.
- לאחר ש־Codex הגיע ל־usage limit בוצע Claude Code fallback review מלא.
- ה־fallback מצא עוד 6 defects אמיתיים, כולל regression שה־PR עצמו יצר.
- כולם תוקנו; suite עלה ל־661; state היה byte-clean.
- ה־Gate נשאר חסום משום שלא היה Codex review signal עבור ה־HEAD הסופי.

המערכת המתוקנת חייבת לקבל scenario כזה כאשר כל דרישות ה־fallback מתקיימות, בלי להעמיד פנים ש־Claude הוא Codex.

#### סנכרון automation-core

לאחר שינוי החוזה יש לסנכרן את ה־workflows לכל ה־repositories הצורכים את `automation-core`, ולהריץ tests שמכסים את ה־fallback contract ואת PR #103 כ־regression scenario.

אין לשנות היסטוריה ואין לטעון ש־Claude review הוא Codex review.

## 13. פורמט תשובת הסוכן

התשובה הסופית של Codex או Claude Code חייבת להכיל רק שלוש שורות:

`<repo-name> HEAD: <full 40-character SHA>`  
`agent-memory HEAD: <full 40-character SHA>`  
`validation: <passed/failed — concise factual summary>`

לאחר שהמשתמש מחזיר את שלוש השורות, הצ׳אט המנהל חייב לאמת את שני ה־SHA מול GitHub לפני deploy או בדיקות קבלה.

## 14. Android APK delivery

בכל Android build מוצלח חובה להעתיק את ה־APK למכשיר כך. כאשר ה־build מבוצע באמצעות Codex או Claude Code ב־Termux, העתקת ה־APK למכשיר היא חלק מחייב מה־finalization ואינה אופציונלית:

`Download/<repo-name>/<app-name>-<version>.apk`

שם הקובץ חייב לכלול את שם האפליקציה והגרסה.

## 15. Android TV / NVIDIA Shield

בפרויקט Android TV או NVIDIA Shield:

1. אין להתחיל מיד מהאפליקציה המלאה לטלוויזיה.
2. תחילה יש לבנות אפליקציית `Mobile Test` לטלפון.
3. בגרסת הבדיקה יש לממש ולבדוק פיזית את התשתית, הלוגיקה, הזרימות וכל הפונקציות המשותפות שניתן לבדוק בטלפון.
4. יש לשמור את ה־APK כך:

`Download/<repo-name>/mobile-test/<app-name>-mobile-test-<version>.apk`

5. רק לאחר שגרסת ה־Mobile Test נבדקה פיזית ואושרה, ניתן לבנות את גרסאות הטלוויזיה והטלפון המלאות, כולל שלט, focus, מסך גדול והתאמות Shield.
6. אין לטעון שהאפליקציה נבדקה בטלוויזיה אם נבדקה רק גרסת הטלפון.

## 16. שמות וזהות בפרויקטים

בכל repository, package/namespace, מסמך ומטא־דאטה יש להשתמש רק בשם `funzi7`, ולעולם לא בשם הפרטי של המשתמש.

## 17. פרויקט “כסף”

בפרויקט “כסף” יש לפעול כמומחה פיננסי בינלאומי ממוקד תשואה ולנתח כמנהל קרן על בסיס נתונים, הסתברויות וסיכון.

אין להציב stop-loss לפני שהטרייד ברווח. כניסה מותרת רק כאשר הניתוח מצביע על הסתברות גבוהה במיוחד לרווח.
