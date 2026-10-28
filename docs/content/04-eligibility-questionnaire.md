# שאלון בדיקת זכאות

**URL:** `/bdikat-zakaut` (+ thank-you page `/bdikat-zakaut/toda`, noindex)
**Priority:** P1 (primary conversion)

---

## 1. Page objective
Turn interest into a qualified lead. Collect the minimum family information the office needs for a useful first call, and set honest expectations about what happens next.

## 2. Target audience
Visitors from any page who want a personal answer. They are mostly on mobile.

## 3. Primary CTA
**שליחה ובקשת שיחה** (submit)

## 4. Suggested H1
**בדיקת זכאות לאזרחות רומנית**

## 5. Section structure
1. Short intro + what to expect (time, privacy)
2. Multi-step form (one question per screen on mobile, progress bar)
3. Contact details step
4. Consent + submit
5. Thank-you page: what happens next

## 6. Draft content

# בדיקת זכאות לאזרחות רומנית

כמה שאלות קצרות על ההיסטוריה המשפחתית שלכם, בערך שתי דקות. אין צורך במסמכים בשלב הזה. אם לא יודעים תשובה, בחרו "לא בטוח/ה", וזה בסדר גמור.

🔒 הפרטים משמשים רק לבדיקת הזכאות וליצירת קשר איתכם.

---

### שלב 1 מתוך 7
**מי מבני המשפחה נולד ברומניה, או באזור שהיה חלק מרומניה?**
- אני
- אבא או אמא
- סבא או סבתא
- סבא רבא או סבתא רבתא
- לא בטוח/ה

### שלב 2 מתוך 7
**איפה הוא או היא נולדו?**
- רומניה של היום
- בסרביה / מולדובה
- בוקובינה / צ'רנוביץ (אוקראינה)
- אחר / לא בטוח/ה
*(שדה טקסט אופציונלי: שם העיר, אם ידוע)*

### שלב 3 מתוך 7
**בערך באיזו שנה הוא או היא נולדו?**
- לפני 1918
- 1918–1940
- 1941–1950
- אחרי 1950
- לא בטוח/ה

### שלב 4 מתוך 7
**אילו מסמכים יש למשפחה? (אפשר לבחור כמה)**
- תעודת לידה רומנית
- דרכון רומני ישן
- תעודת עולה / תעודת זהות ישנה
- אין מסמכים / לא ידוע

### שלב 5 מתוך 7
**מה הגיל שלכם?**
- מתחת ל-18 (ממלא/ת הורה)
- 18–64
- 65 ומעלה

*(Logic note: the age answer determines whether the B1 explanation appears on the thank-you page. **[V06]**)*

### שלב 6 מתוך 7
**עבור מי הבדיקה? (אפשר לבחור כמה)**
- עבורי
- עבור הילדים שלי (מתחת לגיל 18)
- עבור ילדים בגירים
- עבור בני משפחה נוספים

### שלב 7 מתוך 7: פרטי התקשרות
- שם מלא *
- טלפון נייד *
- אימייל
- מתי נוח לדבר? (בוקר / צהריים / ערב)
- משהו נוסף שחשוב שנדע? (טקסט חופשי)

☐ קראתי את [מדיניות הפרטיות](/mediniyut-pratiyut) ואני מסכים/ה ליצירת קשר בנושא הפנייה *
☐ אשמח לקבל עדכונים על שינויים בחוק האזרחות הרומני (אופציונלי)

**[שליחה ובקשת שיחה]**

---

### Thank-you page (`/bdikat-zakaut/toda`)

# תודה, קיבלנו את הפרטים

**מה קורה עכשיו?**
1. אנחנו עוברים על התשובות שלכם.
2. נחזור אליכם בטלפון או בוואטסאפ, בדרך כלל תוך [X] ימי עסקים. **[V21]**
3. בשיחה נסביר מה ידוע לנו לפי התשובות, אילו מסמכים יידרשו ומה הצעד הבא. **השיחה אינה מחייבת אתכם בדבר.**

*(Conditional block, shown if age = 18–64 and the Romanian-born relative is not the applicant:)*
> **💡 כדאי לדעת כבר עכשיו**
> מבקשים בגירים מתחת לגיל 65 נדרשים כיום בדרך כלל להציג תעודת B1 בשפה הרומנית. **[V05, V06]** לא צריך להתחיל ללמוד היום, אבל כדאי לקרוא [מה זה אומר בפועל](/safa-romanit-b1).

**בינתיים, כדאי לקרוא:**
- [התהליך שלב אחר שלב](/tahalich)
- [מסמכים נדרשים](/mismachim)
- [ילדים וקטינים](/yeladim-vektinim)

רוצים לדבר עכשיו? **[שיחה בוואטסאפ]**

## 7. SEO title
`בדיקת זכאות לאזרחות רומנית: שאלון קצר | EU Passport`

## 8. Meta description
`ענו על 7 שאלות קצרות על ההיסטוריה המשפחתית ונחזור אליכם עם הערכה ראשונית לזכאות לאזרחות רומנית ודרכון רומני. ללא התחייבות.`

## 9. Internal links
`/mediniyut-pratiyut` · `/safa-romanit-b1` · `/tahalich` · `/mismachim` · `/yeladim-vektinim` · `/zakaut`

## Implementation notes (for later)
- Save partial progress in the browser so a visitor who leaves can resume.
- Send the answers to the CRM (monday.com "New Leads" board) with all fields mapped.
- Track each step's completion to find drop-off points.
- Don't ask for an ID number or upload documents at this stage.
