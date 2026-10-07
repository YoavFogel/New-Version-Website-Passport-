# Existing Site Audit: passporteu.co.il

**Date:** 2026-10-07
**Status:** Partial audit. Read the limitations section first.

---

## 0. Limitations: read this first

The audit could not crawl the live site directly. From the build environment:

- `passporteu.co.il` and `www.passporteu.co.il` were refused by the outbound network policy (proxy `connect_rejected` / DNS failure).
- The Wayback Machine (web.archive.org) was also unreachable.

The content below is rebuilt from **search-engine indexed text and snippets** of passporteu.co.il, plus business details that EU Passport uses publicly (e-mail signatures and marketing e-mails). The audit therefore:

- covers the **home page / main landing content** fairly well, and other pages only partially;
- **does not** include the full navigation tree, form field lists, verbatim testimonials, or SEO titles and descriptions beyond the main `<title>`;
- paraphrases some text where search engines only returned a summary.

**To finish the audit (recommended before launch), do one of the following:**
1. Allow `passporteu.co.il` in this environment's network policy and re-run the crawl, or
2. Export the site (WordPress: Tools → Export, or a full HTML save of each page) into `/docs/source/` in this repo, or
3. Paste the text of the testimonials, FAQ and contact pages into an issue or file.

Every item below marked **(unconfirmed)** should be checked against the live site.

---

## 1. Pages and URLs found

| URL | Indexed title | Notes |
|---|---|---|
| `https://passporteu.co.il/` | "אזרחות רומנית" | The only URL search engines return for the domain. The site is probably a single long landing page with anchor sections, or has very few indexed inner pages. |

**Finding:** With only one indexed URL, the site has almost no organic search footprint beyond its brand name. Competitors (passportogo, romanian-passports, mayapassport, hershko-romania, doortoeurope, law-center and others) each rank with dozens of topic pages: eligibility, B1, minors, documents, the 2025 amendment, and more. This is the biggest SEO gap.

---

## 2. Content found, by section

### 2.1 Hero / opening
- Main subject: Romanian citizenship (אזרחות רומנית) and the Romanian (EU) passport.
- Positioning: "a family operation that helps eligible people exercise their right to Romanian citizenship and a Romanian passport."

### 2.2 About / story
- At the start of **2017**, attorney **Avihay Fogel(-Ronen)** and his family began their own Romanian naturalization process, with a law firm that specialized in Romanian citizenship.
- After finishing the process, Avihay and his son used their experience as clients to start their own operation. It was described as "שונה מהנוף" ("different from the landscape") and built "from day one" on credibility, integrity and full transparency.
- Adv. Avihay Fogel-Ronen's listed practice areas: Romanian citizenship, commercial law and real-estate law.
- Legal representation is described as provided "from our office in Israel and in Romania".

### 2.3 Service promises
- "Personal attention from the first meeting until the passport is delivered."
- "Unlike others, we promise full availability from the first day until you receive the Romanian passport."
- "Transparency and credibility toward the client is our supreme goal."
- Disclaimer: the work is done under Romanian law, which can change, so **100% success cannot be guaranteed**. This is a good, honest point to keep.

### 2.4 Process
- "The naturalization process is divided into **two types**, depending on your details. Each takes a different amount of time and has different sub-stages, which our staff explain on the phone call."
- Stages described (paraphrased):
  1. **Document collection.** Locate the relative's original records in Romania, fully update the relative's Israeli records ("Israeli biography") to prove the link, and make a full copy of the civil profile.
  2. **Required documents.** Copies of birth certificate, population-registry extract (תמצית רישום), marriage certificate and a police clearance certificate (תעודת יושר), assembled into a reasoned file that proves the family link.
  3. **Oath ceremony.** The file goes to the Romanian Ministry of Justice. If approved, you are invited to the embassy for an oath ceremony that "includes reading the Romanian oath and answering a few questions in Romanian".

### 2.5 Timelines (as stated on the old site)
- "Simpler processes: about **one year** until the passport."
- "Longer processes: **2.5–3 years**."
- "The naturalization itself can take **1.5 to 3 years** from the start until the oath at the Romanian consulate."
- These figures contradict each other (1 year vs. 1.5–3 years) and are not dated.

### 2.6 Eligibility / FAQ content
- "Romanian citizenship is available to natives of Romania and their **biological or adopted** descendants, **up to and including the third generation (grandchildren)**."
- "Minors under 18 at the time the parent receives citizenship are **automatically included** in the parent's file and receive citizenship **at no additional cost**. Adults over 18 must submit their own application."
- "The Romanian passport grants all the rights of a European citizen **without affecting your status in Israel**."

### 2.7 CTAs
- Main CTA: a phone consultation call ("שיחה טלפונית" / "שיחת ייעוץ"). **(unconfirmed: exact button text)**
- WhatsApp contact is used in marketing; the business WhatsApp number is +972-2-509-0307 (from marketing e-mails). **(unconfirmed on site)**

### 2.8 Forms
- A lead form is likely (name, phone, possibly e-mail). **(unconfirmed: fields could not be read)**

### 2.9 Testimonials
- Not recovered. **Needed from the business:** the full list of testimonials, with written consent to publish them on the new site.

### 2.10 Contact information
- Brand: **EU Passport / Passport-EU / אי.יו פספורט** (three spellings are in use and should be standardized).
- Operating entity: **משרד עו"ד אביחי פוגל-רונן** (the law office of Adv. Avihay Fogel-Ronen).
- Client case manager: Yoav Shaked (יואב שקד), "מנהל תיקי לקוחות".
- Phone/WhatsApp: 02-509-0307 **(confirm)**
- E-mail: office.eu.passport@gmail.com **(confirm whether to publish a Gmail address; a domain e-mail is recommended)**
- Physical address: **not found**.

### 2.11 SEO metadata
- `<title>`: "אזרחות רומנית". It is too short and doesn't include the brand, the passport, or a reason to click.
- Meta description: not recovered.

---

## 3. Navigation
Could not be read. Based on the content, the old site probably had sections such as home, about, process, FAQ and contact. **(unconfirmed)**

---

## 4. Repeated sections
- "Transparency / credibility / availability" claims show up in several places without proof (no numbers, no named people, no process detail).
- The process is described more than once with different timelines.

---

## 5. Weak or outdated content

| # | Issue | Why it matters |
|---|---|---|
| W1 | **No mention of the 2025 law change** (Law 14/2025, the B1 Romanian-language requirement for citizenship restoration). | This is now the most important question prospects ask. Its absence makes the site look outdated and leads to unqualified leads. |
| W2 | "Answering a few questions in Romanian at the oath" | This is outdated framing. Under the current law, the B1 certificate is the language proof, with exemptions. |
| W3 | "Minors receive citizenship **at no additional cost**" | Sources report a per-person application fee (90 RON) from 2025 that also applies to minors in the file. |
| W4 | Conflicting timelines (1 year / 1.5–3 years / 2.5–3 years) with no date | This undermines trust. Timelines should be shown as ranges, dated, and labeled as estimates. |
| W5 | "Up to the third generation (grandchildren)" | The legal wording is "descendants up to the third degree". The meaning (does it reach great-grandchildren?) needs a legal decision and consistent wording. |
| W6 | "Two types of processes", never explained | Readers can't tell which one they belong to. The new site should name and explain the tracks. |
| W7 | Generic trust claims ("unlike others", "supreme goal") | These are unverifiable and read as marketing. Replace them with concrete practices (named case manager, update frequency, written fee agreement). |
| W8 | "Does not affect your status in Israel" | This is broadly true for dual citizenship, but it is a legal claim and needs careful wording. |
| W9 | Single page, one indexed URL | There is almost no SEO coverage of high-intent topics. |
| W10 | Three brand spellings | This weakens brand recognition. |
| W11 | No visible fee information | Prospects often leave to compare prices. Even "how pricing works" builds trust. |
| W12 | No pages for the passport stage, documents, minors or B1 | These are the main search intents. |

---

## 6. Factual and legal claims that need verification

Every legal claim from the old site is treated as **unverified**. The master register, with IDs used across `/docs/content/`, is in [`content-strategy.md` §8](./content-strategy.md#8-legalfactual-claims-register).

Summary of old-site claims:

| Old-site claim | Topic | Status |
|---|---|---|
| Descendants "up to third generation (grandchildren)" are eligible | Eligibility | Wording conflicts with "third degree". Needs legal review. |
| Adopted descendants are eligible | Eligibility | Needs verification. |
| Minors are included automatically **at no extra cost** | Minors / fees | Likely outdated (per-person fee). |
| Adults over 18 must file separately | Minors | Likely correct. Confirm. |
| Two process types with different durations | Process | Name and define the tracks. |
| ~1 year (simple) / 2.5–3 years (long) / 1.5–3 years until oath | Timelines | Undated and inconsistent. Replace with current, dated ranges. |
| File goes to the "Romanian Ministry of Justice" | Authority | Files are handled by the **National Citizenship Authority (ANC)**, which operates under the Ministry of Justice. Use the precise name. |
| Oath at the embassy with questions in Romanian | Oath / language | Outdated framing. Confirm current oath procedure and location (Bucharest / consulate). |
| Police clearance (תעודת יושר) required | Documents | Confirm the current document list. |
| No effect on status in Israel | Legal | Confirm wording with counsel. |
| Legal representation in Israel and Romania | Business | Confirm the Romanian partner and how it is presented. |
| "Cannot guarantee 100% success" | Disclaimer | Keep it. |

---

## 7. What to keep from the old site
- The **founder's personal story**: the family went through the process themselves in 2017. This is the strongest authentic trust asset.
- Founded and run by a **licensed Israeli attorney**.
- The **honest disclaimer** that success cannot be guaranteed and the law can change.
- Personal case management from first call to passport.
- The idea of a **phone consultation** as the first step.
