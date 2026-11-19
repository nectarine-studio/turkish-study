# Turkish Study

A study app for Turkish vocabulary built from Quizlet exports. It runs as a Cloudflare Worker that serves the static app and a small image endpoint.

## Sets

- Set 122 (63 cards, hand-cleaned).
- Elif Alışveriş Gidiyor (184 cards). These start as well studied (box 4 of 5), spread over the next eight days so they do not all come due at once. Any answer you give replaces that starting status.

Use the chips under the title to study one set or both.

## Modes

- Browse: card grid with search and image filters. Each card can use a photo, a pasted image URL or an AI image.
- Flashcards: flip cards with spaced repetition. Choose due and new cards, words that need work, everything, or one theme. Rate with Again, Good or Easy (keys 1, 2, 3; space flips).
- Learn: each word moves through four steps: match the word, recognise the meaning, type the Turkish word, type the meaning. A wrong answer sends the word back a step. Long phrases stop after step 2. Missing accents are accepted with a reminder, and there are buttons for ç ğ ı ö ş ü.
- Quiz: quick multiple choice.
- Sentences: translate a Turkish sentence into English, check against a reference, then rate how it went. Currently written for Set 122 only.
- Mind map: every card grouped into 11 themes and colored by status (not started, needs work, learning, strong). Dashed rings mark words due for review. The two themes that most need work get a Focus badge, and the page lists themes to study and words to revisit.

Spaced repetition uses five boxes with review gaps of 10 minutes, 1, 2, 4, 8 and 16 days. Every mode feeds the same progress record.

## Images

- Unsplash photos stay hotlinked with the photographer credit shown (11 photos, Set 122 only).
- AI images come from `POST /api/image`, which calls Cloudflare Workers AI (`@cf/black-forest-labs/flux-1-schnell`). Generated images are kept in the browser (IndexedDB). They only work on the deployed site, not from a local file.
- Pasted image URLs and generated images are stored in this browser only.

## Getting a set out of Quizlet

1. Open the set in Quizlet, open the three-dot menu and choose Export.
2. Keep the default separators: a tab between term and definition, a new line between cards.
3. Paste the text into the import box at the bottom of the app. Imported cards are not saved between visits.

Quizlet's export contains text only. Images are never included.

## Deploying

`wrangler.jsonc` defines the Worker (`src/worker.js`), the static assets (`public/`) and the Workers AI binding. Deploy with `npx wrangler deploy`, or connect the repo in the Cloudflare dashboard with deploy command `npx wrangler deploy`. Workers AI usage is billed against the account's allowance.

## Files

- `public/index.html`, `public/styles.css`: page shell and styles.
- `public/js/data.js`: cards, themes and photo records (generated from the Quizlet exports).
- `public/js/sentences.js`: example sentences.
- `public/js/store.js`: progress (localStorage) and image storage (IndexedDB).
- `public/js/app.js`, `modes.js`, `mindmap.js`, `main.js`: the app.
- `src/worker.js`: image endpoint and static asset passthrough.

## Photo credits

Sean Oulashin (summer), Alex Dukhanov (rain), Osman Rana (umbrella), Aaron Burden (snow), Greg Shield (leaves), Fujiphilm (clothes), dharmendra sahu (holiday), Tim Stief (winter), Igor bispo (sharp), Deconovo (soft), Patrick Hendry (bumpy terrain). All from Unsplash.

See `LOG.md` for decisions and findings.
