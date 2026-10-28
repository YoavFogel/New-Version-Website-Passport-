# דמו: דף הבית "דלפק הבוטיק"

פותחים את `demo/index.html` בדפדפן. אין צורך ב-build. האתר הקודם ב-`site/` לא השתנה.

## הכיוון
- **taste-skill:** כיוון `borrowed-category` ("לבוש של קטגוריה אחרת"), seed 341306042. הצבעים והפונט נשמרו מהמותג (`--keep palette,type`).
- **הקטגוריה השאולה:** דלפק של בוטיק. הדרכון מוצג כמו חפץ יקר על דלפק כהה, מה שכלול בתיק מוצג כמו מחירון מודפס, השאלות כמו כרטיסיות במגירה, והלוגו בסוף בנוי מבלוקים.
- **הרעיון:** שרשרת המסמכים של המשפחה הופכת לחפץ שעל הדלפק. רישום הלידה של סבתא נהיה תיק משפחתי, והתיק נהיה דרכון, במעבר איטי (crossfade) בכותרת הפתיחה.
- **הדבר החי בדף:** "האם זה רלוונטי עבורכם?". שלוש שאלות (מי נולד ברומניה, מאיפה, גיל), ומיד מוצג התיק: איזה מסמך נאתר, באיזו מדינה, איזה צוות מטפל בו, והאם צריך B1. בלי JavaScript מוצגת תוצאת ברירת מחדל.
- **תנועה:** Lenis לגלילה חלקה, GSAP ו-ScrollTrigger לכניסת התוכן בכל סקשן, לשורות המחירון, לנקודות במפה ולבלוקים של הלוגו, וזום איטי לתמונה בסיום. מי שהגדיר "הפחתת תנועה" מקבל את הדף המלא בלי תנועה.

## מה צריך מכם לפני עלייה לאוויר
1. **תמונות.** הסביבה כאן חוסמת את ארכיוני התמונות הפתוחים (Wikimedia, מוזיאונים), כך שבדף יש תמונה אמיתית אחת, `hero-person.jpg`, ושני פוסטרים של סרטונים מ-Drive. החפצים בפתיחה (רישום לידה, תיק, דרכון) והמפה מצוירים בקוד. כדאי להשיג 4 עד 8 תמונות אמיתיות: הצוות, המשרד, הקונסוליה, ארכיונים, ערים ברומניה.
2. **מספר וואטסאפ.** הקישורים מסומנים `#whatsapp`. המספר 02-509-0307 הוא קווי וצריך אישור.
3. **השלוחות.** מה כל צוות עושה (בטבלה ובבדיקה) נכתב לפי הטקסט המאושר, אבל החלוקה בין בוקרשט ליאשי ומה שנעשה באוקראינה הם הנחה שלי. צריך אישור.
4. **זמנים.** "כמה זמן זה לוקח" נכתב בלי מספרים, כי ה-[חסר: X–Y] עדיין פתוח.
5. **ביקורות Google** לא נכללו, כדי לא להמציא הוכחות. מקומן מחכה לקישור לפרופיל.
6. **פונט.** הדמו רץ על Heebo. כשקבצי Almoni יגיעו, מוסיפים אותם ל-`assets/fonts` ושמים את "Almoni" ראשון ב-`--font`.
7. **איור הדרכון.** הדרכון בדף הוא איור מפושט ולא העתק של המסמך הרשמי.

## בדיקות
- `lint.mjs`: 0 FAIL, 0 WARN.
- `inspect.mjs` ב-1440, 768 ו-390: נשארו 2 FAIL.
  - `few-pictures`: 3 תמונות, והמינימום הוא 4. נובע מחסימת הרשת, ראו סעיף 1.
  - `covered-text`: בטלפון, כותרת "מה כלול בתיק" עוברת מתחת לסרגל הפעולה הקבוע בתחתית המסך בזמן הגלילה. זה הסרגל עצמו ולא באג פריסה.
- WARNs שנשארו: אין לולאת וידאו (הסרטונים הם נגני Drive), `lopsided` בסיום (הבודק לא רואה את התמונה שממוקמת absolute), ו-`ragged-edges`.

## ביקורת, סבב אחרון
```
ROUND 2
Seen in one second: navy counter, a document on it, "אזרחות רומנית, עד הדרכון ביד" at 86px, one yellow button.
Idea (one sentence): the family's paper trail (birth record → family file → passport) becomes the object on a boutique counter.
Live thing: three-question eligibility check that builds the file's document chain and names the team that handles it.
Layout words by section: hero=counter object / branches=table + map / check=form + result card / included=printed menu + quote + video / steps=horizontal accordion / story=two columns with highlights / opens=two fields / faq=index cards / close=photo split / footer=block wordmark.
Scores: design 7 · usability 8 · creativity 7 · content 8 → overall 7.5.
Caps applied: few real pictures (3 of 4 minimum), so imagery holds the design score down.
Top three problems:
1. The page has only one real photograph; the hero object and map are drawings (all screenshots). Fix: client photos.
2. The two showcase panels depend on Drive posters; without them panel one is a navy block (desktop-page-02). Fix: a real poster frame per video.
3. Text start lines vary across centred and split sections (ragged-edges, 1440). Fix: align section intros to two grid lines.
```
