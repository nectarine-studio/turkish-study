# Running Log

Newest entries go at the top. Each entry: date, what changed or was learned, and any open question.

## 2026-11-19

Started the project from a Quizlet export test (Set 122, 63 Turkish vocabulary cards).

Findings
- Quizlet has no usable public API. New API keys have been paused since December 2018, and there is no public developer API or SDK today.
- The only official way out is the set's Export option. It gives text only (terms and definitions), with no images.
- Uploading images inside Quizlet needs Quizlet Plus. Free accounts can only use Quizlet's own image gallery, on the website only.
- Third-party scrapers and browser extensions exist, but they break often and may violate Quizlet's terms. Not used here.

What was built
- `index.html`: single-file prototype with Browse, Quiz and Import. Cards come from Set 122.
- 11 Unsplash photos attached to 14 cards. Most of the set is personality traits and grammar words, which stock photos cover poorly.
- The PDF export had some Turkish letters stripped. Diacritics were restored by hand (for example Yazin to Yazın, Yardimsever to Yardımsever) and words split across lines were rejoined. "Kışın" is a guess for "Kişin" and should be checked.

Known limits
- Photos hotlink from Unsplash, so they only load when the file is opened in a normal browser, online. Sandboxed previews block remote images.
- Attached photo URLs are stored in localStorage, so they live in one browser only.
- Unsplash's guidelines require hotlinking and photographer credit. Both are done on each card.

Open questions and next steps
- Decide where photos come from for abstract words: AI-generated illustrations in one shared style, or Unsplash only.
- Add a backend (for example Cloudflare Pages with D1) to store decks and chosen images across devices.
- Add Unsplash API search inside the app (needs an API key, kept server-side).
- Add spaced repetition scheduling and a flip-card study mode.
- Check the restored Turkish spellings against the original Quizlet set.
