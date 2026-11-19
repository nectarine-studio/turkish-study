# Turkish Study

Vocabulary study app built from Quizlet exports. See `README.md` for features and `LOG.md` for decisions so far.

## Working rules

- Add a dated entry to the top of `LOG.md` whenever something is decided, learned or changed. Keep entries short and factual.
- The app is plain HTML, CSS and classic scripts under `public/` (no build step, no modules, so it also opens from a local file). Scripts share globals and load in the order listed in `public/index.html`.
- `src/worker.js` serves `public/` and the `/api/image` endpoint. Keep any API key or paid service call server-side.
- `public/js/data.js` is generated from Quizlet exports. When adding a set, add it to `SETS`, add its rows to `RAW`, assign every card to a theme in `THEMES`, and note any spelling fixes in `LOG.md`.
- Quizlet has no usable API and its export is text only. Do not scrape Quizlet.
- Unsplash photos must stay hotlinked with the photographer credit visible.
- Keep Turkish diacritics intact (ç ğ ı İ ö ş ü). Do not normalize them away, except inside `fold()`, which is only used to compare typed answers.
- Progress lives in localStorage (`ts_progress_v2`), keyed by card id (`setId:number`). Do not change card ids without migrating progress.

## Design

- Headings use Hanken Grotesk with -1.5px letter spacing at headline sizes.
- Buttons are rounded rectangles, never pills.
- Desktop screens should not exceed 900px tall.
- No em dashes in copy.
