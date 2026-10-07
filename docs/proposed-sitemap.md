# Proposed Sitemap and Information Architecture

**Date:** 2026-10-07

## 1. Principle: structure by user intent

The old site is a single page that tells the business's story in order. The new site is built around the **questions people actually ask**, in roughly the order they ask them:

1. **"What is this and is it for me?"** → Romanian citizenship (pillar), Eligibility, Questionnaire
2. **"What about my specific situation?"** → Restoration, Children & minors, Romanian language (B1)
3. **"What will actually happen?"** → Process, Documents, Romanian passport, Costs
4. **"Can I trust these people?"** → About, Testimonials, FAQ
5. **"How do I start?"** → Questionnaire, Contact

The **eligibility questionnaire** is the hub of conversion. Every page leads to it.

## 2. Sitemap

```
/                                   דף הבית
│
├── /ezrachut-romanit               אזרחות רומנית (pillar page)
│   ├── /zakaut                     מי זכאי לאזרחות רומנית
│   ├── /hashavat-ezrachut          השבת אזרחות (סעיף 11)
│   ├── /yeladim-vektinim           אזרחות רומנית לילדים וקטינים
│   └── /safa-romanit-b1            דרישת השפה הרומנית (B1)
│
├── /tahalich                       התהליך שלב אחר שלב
│   ├── /mismachim                  מסמכים נדרשים
│   └── /alut                       עלויות ושכר טרחה
│
├── /darkon-romani                  דרכון רומני (הנפקה וחידוש)
│
├── /bdikat-zakaut                  שאלון בדיקת זכאות  ★ primary conversion
│   └── /bdikat-zakaut/toda         thank-you / next steps (noindex)
│
├── /odot                           אודות EU Passport
├── /mamlitzim                      לקוחות מספרים
├── /shealot-nefotzot               שאלות נפוצות
├── /tzor-kesher                    צור קשר
│
├── /madrichim                      מדריכים ומאמרים (hub)
│   ├── /madrichim/chok-ezrachut-2025          מה השתנה בחוק ב-2025
│   ├── /madrichim/besarabia-moldova            שורשים בבסרביה / מולדובה
│   ├── /madrichim/bukovina-chernivtsi          שורשים בבוקובינה / צ'רנוביץ
│   ├── /madrichim/haachanat-mivchan-b1         איך מתכוננים למבחן B1
│   ├── /madrichim/teudot-mi-romania            איך משיגים תעודת לידה מרומניה
│   ├── /madrichim/shgiot-bishmot               פערי איות בשמות במסמכים
│   ├── /madrichim/zchuyot-ezrach-eu            מה מאפשר דרכון אירופי בפועל
│   └── /madrichim/ezrachut-kfula               אזרחות כפולה: ישראל ורומניה
│
└── Legal (footer only)
    ├── /mediniyut-pratiyut           מדיניות פרטיות
    ├── /negishut                     הצהרת נגישות
    └── /tnai-shimush                 תנאי שימוש והבהרה משפטית
```

## 3. Navigation

**Desktop header (right to left):**
`[לוגו EU Passport]`  אזרחות רומנית ▾ · התהליך ▾ · דרכון רומני · שאלות נפוצות · אודות · צור קשר · `[לבדיקת זכאות]` (button)

- **אזרחות רומנית ▾**: מי זכאי · השבת אזרחות · ילדים וקטינים · דרישת השפה (B1)
- **התהליך ▾**: שלב אחר שלב · מסמכים נדרשים · עלויות

**Mobile:** hamburger menu with the same groups as accordions, plus a sticky bottom bar: `[לבדיקת זכאות]` `[וואטסאפ]`.

**Footer:** short "about" text + attorney name and license number · main links · guides · contact details + hours · legal links · "המידע באתר אינו מהווה ייעוץ משפטי".

## 4. Page inventory and priority

| # | Page | URL | Primary intent | Priority | File |
|---|---|---|---|---|---|
| 1 | Home | `/` | Orientation + trust | **P1** | [01-home.md](./content/01-home.md) |
| 2 | Romanian citizenship (pillar) | `/ezrachut-romanit` | Understand the whole topic | **P1** | [02-romanian-citizenship.md](./content/02-romanian-citizenship.md) |
| 3 | Eligibility | `/zakaut` | "Am I eligible?" | **P1** | [03-eligibility.md](./content/03-eligibility.md) |
| 4 | Eligibility questionnaire | `/bdikat-zakaut` | Self-check → lead | **P1** | [04-eligibility-questionnaire.md](./content/04-eligibility-questionnaire.md) |
| 5 | Citizenship restoration | `/hashavat-ezrachut` | Legal track, seniors | P2 | [05-citizenship-restoration.md](./content/05-citizenship-restoration.md) |
| 6 | Children & minors | `/yeladim-vektinim` | Parents | **P1** | [06-children-and-minors.md](./content/06-children-and-minors.md) |
| 7 | Romanian language (B1) | `/safa-romanit-b1` | The 2025 change | **P1** | [07-romanian-language-b1.md](./content/07-romanian-language-b1.md) |
| 8 | Process | `/tahalich` | "What happens and how long?" | **P1** | [08-process.md](./content/08-process.md) |
| 9 | Documents | `/mismachim` | Preparation | P2 | [09-documents.md](./content/09-documents.md) |
| 10 | Romanian passport | `/darkon-romani` | Issue / renew | P2 | [10-romanian-passport.md](./content/10-romanian-passport.md) |
| 11 | Costs | `/alut` | Price transparency | P2 | [11-costs.md](./content/11-costs.md) |
| 12 | FAQ | `/shealot-nefotzot` | Quick answers | P2 | [12-faq.md](./content/12-faq.md) |
| 13 | About | `/odot` | Trust | **P1** | [13-about.md](./content/13-about.md) |
| 14 | Testimonials | `/mamlitzim` | Social proof | P2 (needs material) | [14-testimonials.md](./content/14-testimonials.md) |
| 15 | Contact | `/tzor-kesher` | Reach us | **P1** | [15-contact.md](./content/15-contact.md) |
| 16 | Guides hub + article briefs | `/madrichim` | SEO, long tail | P3 | [16-guides.md](./content/16-guides.md) |
| 17 | Legal pages | footer | Compliance | P1 (launch blocker) | [17-legal-pages.md](./content/17-legal-pages.md) |

**P1** = needed for launch. **P2** = launch or soon after. **P3** = ongoing content.

## 5. Redirects from the old site
The old site appears to have only `/` indexed. When the full URL list is available (see audit §0), map every old URL to its closest new page with a 301 redirect. Old anchor links (`/#about` and similar) need no redirects.

## 6. Open structural decisions
1. **Other citizenships.** Internal material suggests the office also handles other citizenships (e.g., German). Should the new site be Romania-only, or have a top-level "אזרחויות נוספות" section? The recommendation is Romania-first at launch, with the structure leaving room for `/ezrachut-germanit` and others later.
2. **URL language.** Transliterated slugs (recommended) vs. Hebrew-letter slugs vs. English.
3. **Language versions.** Hebrew only at launch? Russian is a strong candidate for a second language, given the Bessarabia/Moldova audience.
