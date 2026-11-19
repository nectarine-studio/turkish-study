# Running Log

Newest entries go at the top. Each entry: date, what changed or was learned, and any open question.

## 2026-11-19 (second set and study modes)

Added the Elif Alışveriş Gidiyor set, spaced repetition, Learn mode, sentences, a mind map and AI images.
- Elif set: 185 cards parsed from the Quizlet PDF. "keşke" was skipped because Set 122 already has the identical card, which leaves 184. Card 43 "Üzerine" had no definition in Quizlet, so "on, onto" was added. Check it.
- Spelling fixes made while importing (check against the original): etrafında, Dolaşmak, zıplamak, Mağaza, Çabucak (was Çabırcak), Askılar, Bakacaktı (was Bakacatı), Çıkmak, artık, ayrılmak, Kaç derece (was devece), kusura bakma, Değişmek, değiştirmek, askılık, Atlıkarınca, İhtimale. English fixes: recipe, excuse me, apologies, what's more, and "tight, firm, close" (was "film"). Left unchanged because the right form was unclear: Birbirler, Hayranmak, sıcaklamak.
- Elif words start at box 4 (strong) with reviews spread over eight days. A set can opt in through `seed` in `data.js`.
- Eleven themes group all 247 cards. Assignments were made by hand in the generator and are easy to change in `THEMES`.
- Sentences exist for Set 122 only (39 sentences, written by hand, not yet checked by a Turkish speaker). The Elif words still need sentences.
- AI images: `src/worker.js` calls Workers AI at `/api/image`. It only accepts same-origin POST requests with a 3 to 400 character prompt. There is no rate limit, so anyone who finds the endpoint could use up the account's Workers AI allowance. Add Cloudflare Access or a rate limit if the site is shared widely.
- Per the earlier rule, the app is now split into several files because a backend exists.
- Not tested: the real Workers AI call (only a stand-in), and the deployed site. Browser tests ran locally and passed with no console errors.

Open questions and next steps
- Write sentences for the Elif words.
- Sync progress and images across devices (D1 or KV), since both live in one browser today.
- Add a daily new-card limit setting (fixed at 10 for now).

## 2026-11-19 (deploy)

Cloudflare deploy failed with "This Worker does not exist on this account". No Worker named `turkish-study` existed and the repo had no Wrangler config.
- Added `wrangler.jsonc` (name `turkish-study`, static assets from `./public`) and moved `index.html` to `public/index.html`.
- Cloudflare build settings: build command empty, deploy command `npx wrangler deploy`, production branch must be the branch that holds these files.

## 2026-11-19

Started the project from a Quizlet export test (Set 122, 63 Turkish vocabulary cards).

Findings
- Quizlet has no usable public API. New API keys have been paused since December 2018, and there is no public developer API or SDK today.
- The only official way out is the set's Export option. It gives text only (terms and definitions), with no images.
- Uploading images inside Quizlet needs Quizlet Plus. Free accounts can only use Quizlet's own image gallery, on the website only.
- Third-party scrapers and browser extensions exist, but they break often and may violate Quizlet's terms. Not used here.

What was built
- `public/index.html`: single-file prototype with Browse, Quiz and Import. Cards come from Set 122.
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
